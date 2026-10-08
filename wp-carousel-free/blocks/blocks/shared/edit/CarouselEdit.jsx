/**
 * CarouselEdit – shared editor component for all 6 WP Carousel Pro blocks.
 *
 * Renders the preview entirely client-side (CarouselRender + swiper/react —
 * no PHP round-trip) and assembles the inspector sidebar. Pagination dots,
 * navigation arrows, and Tiles AJAX pagination are inspector panels on the
 * parent block, not sub-blocks.
 *
 * Collaborators (all in this folder):
 *  - `CarouselInspector`     — sidebar panel assembly
 *  - `EditorPreview`         — per-source item resolution + live preview
 *  - `SourceToolbar`         — per-source BlockControls (edit/add items)
 *  - `ItemEditPopupRouter`   — per-source single-item edit popup
 *  - `useProgrammaticSourceGuard`, `useEditorDynamicCss` — lifecycle/CSS hooks
 */

import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { PanelNotice } from '@wp-carousel-pro/components';
import { GalleryEditPopup, VideoSourceAddPopup } from '../popups';
import InspectorControl from '../../../components/inspectorControls/inspectorControls';
import WizardFlow from '../wizard';
import { openReadyPatterns, isReadyPatternsEnabled } from '../ready-patterns';
import { openAIBuilder, isAIBuilderEnabled } from '../ai-builder';
import CarouselInspector from './CarouselInspector';
import EditorPreview from './EditorPreview';
import PaginationPreview from './PaginationPreview';
import BlockPreviewShape from './BlockPreviewShape';
import SourceToolbar from './SourceToolbar';
import ItemEditPopupRouter from './ItemEditPopupRouter';
import useProgrammaticSourceGuard from './useProgrammaticSourceGuard';
import useFreeLayoutGuard from './useFreeLayoutGuard';
import { resolveThumbsLayout } from '../constants/freeValues';
import { needsSetup } from '../utils/needsSetup';
import useEditorDynamicCss from './useEditorDynamicCss';
import useUniqueId from '../hooks/useUniqueId';
import useOpenBlockInspector from '../hooks/useOpenBlockInspector';
import useEditorContentSelect from '../hooks/useEditorContentSelect';

// Swiper CSS (imported once via this shared component). The full bundle keeps
// the editor rule-set identical to the frontend `wpcp-blocks-swiper-style`
// handle (swiper-bundle.min.css) — do not swap back to piecemeal module CSS.
import 'swiper/swiper-bundle.css';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function sanitizeDomId(value) {
	return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Run `fn` after the block editor finishes the current pointer gesture. Nav/pagination
 * preview chrome is rendered inside the parent carousel DOM while InnerBlocks are hidden
 * (`editor-preview.scss`), so core often resolves the hit to the parent synchronously and
 * would override an immediate `selectBlock` on the child.
 *
 * @param {() => void} fn Callback.
 */
function runAfterBlockEditorPointerDispatch(fn) {
	window.requestAnimationFrame(() => {
		window.requestAnimationFrame(() => {
			fn();
		});
	});
}

/* ── Main edit component ─────────────────────────────────────────────────── */

/**
 * Main editor component for all WP Carousel Pro blocks.
 *
 * @param {Object}   props               - Component props
 * @param {Object}   props.attributes    - Block attributes
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {string}   props.name          - Block type name
 * @param {string}   props.clientId      - Block client ID
 * @return {JSX.Element} Block editor component
 */
function CarouselEdit({ attributes, setAttributes, name, clientId }) {
	const { uniqueId, sourceType, items = [], patternDemo = false } = attributes;
	const orientation = attributes?.layoutOptions?.contentOrientation;
	const displayStyle = attributes?.layoutOptions?.displayStyle;

	useProgrammaticSourceGuard(attributes, setAttributes);
	useFreeLayoutGuard(attributes, setAttributes);
	const { selectBlock } = useDispatch(blockEditorStore);
	const openBlockInspector = useOpenBlockInspector();

	const paginationOn = attributes.layoutOptions?.pagination !== false;
	const [openPanel, setOpenPanel] = useState('layouts');
	const carouselScopeRef = useRef(null);

	const onEditorPaginationClick = useCallback(() => {
		if (!paginationOn || !clientId) {
			return;
		}
		runAfterBlockEditorPointerDispatch(() => {
			selectBlock(clientId);
			openBlockInspector();
			const panelName = 'paginationDots';
			setOpenPanel(panelName);
		});
	}, [paginationOn, clientId, selectBlock, openBlockInspector]);

	// Click a content slot in the preview (title/description/read-more, or the
	// meta row) → open the matching inspector panel, mirroring the pagination
	// affordance. `panelName` is resolved by the delegated handler in
	// `useEditorContentSelect` from the clicked slot's class.
	const onEditorSlotClick = useCallback(
		(panelName) => {
			if (!clientId || !panelName) {
				return;
			}
			runAfterBlockEditorPointerDispatch(() => {
				selectBlock(clientId);
				openBlockInspector();
				setOpenPanel(panelName);
			});
		},
		[clientId, selectBlock, openBlockInspector]
	);

	// Generate unique ID if not set
	useUniqueId(uniqueId, setAttributes, 'wpcp-carousel');

	// Thumbnails-slider scaffolding — outer-element class hooks for the dynamic
	// CSS pipeline. Mirrors `BlockRenderer.php` so editor preview === frontend.
	const isThumbnailsSliderBlock = name === 'wp-carousel-pro/thumbnails-slider';
	const thumbsLayoutClass = resolveThumbsLayout(attributes.layoutOptions?.thumbsLayout);
	const thumbsPositionClass = attributes.thumbsArea?.position ?? 'bottom';
	const rawActiveStyleClass = attributes.thumbnail?.activeStyle ?? 'none';
	const activeStyleClass = rawActiveStyleClass === 'border' ? 'indicator' : rawActiveStyleClass;

	// useBlockProps always forces id="block-{clientId}" — custom id is dropped. Scope dynamic CSS with an inner root.
	const blockProps = useBlockProps({
		className: 'wpcp-block-editor-wrap',
	});

	const { dynamicCssString, paginationCssString, navigationCssString, tilesPaginationCssString } =
		useEditorDynamicCss(attributes, name);

	const showTilesPaginationPreview =
		name === 'wp-carousel-pro/tiles' &&
		attributes.layoutOptions?.pagination === true &&
		['post', 'product', 'image', 'video'].includes(sourceType);

	const isSetup = needsSetup(attributes);
	useEditorContentSelect(carouselScopeRef, onEditorSlotClick, !isSetup);

	const [editingGallery, setEditingGallery] = useState(false);
	const [editingItemId, setEditingItemId] = useState(null);
	const [showAddVideo, setShowAddVideo] = useState(false);
	const readyPatternsEnabled = isReadyPatternsEnabled();
	const aiBuilderEnabled = isAIBuilderEnabled();
	const [panelTabs, setPanelTabs] = useState({
		layouts: 'general',
		contentArea: 'general',
		image: 'general',
		rating: 'general',
		taxonomy: 'general',
		postContent: 'general',
		productContent: 'general',
		content: 'general',
		postMeta: 'general',
		socialShare: 'general',
		video: 'general',
		audio: 'general',
		advanced: 'general',
	});
	const advancedOptions = attributes.advancedOptions || {};
	const customCssClass =
		typeof advancedOptions.cssClass === 'string' && advancedOptions.cssClass.trim()
			? advancedOptions.cssClass.trim()
			: '';
	const customCssId =
		typeof advancedOptions.cssId === 'string' && advancedOptions.cssId.trim()
			? sanitizeDomId(advancedOptions.cssId)
			: '';

	const initKey = displayStyle === 'vertical' ? orientation : '1';

	return (
		<>
			{/* ── Toolbar ── */}
			<SourceToolbar
				sourceType={sourceType}
				items={items}
				patternDemo={patternDemo}
				setAttributes={setAttributes}
				onEditItems={() => setEditingGallery(true)}
				onAddVideo={() => setShowAddVideo(true)}
				onRefineWithAI={
					aiBuilderEnabled && !isSetup
						? () => openAIBuilder({ clientId, blockName: name, isRefining: true })
						: undefined
				}
			/>

			{/* ── Inspector sidebar ── */}
			<InspectorControl
				attributes={attributes}
				setAttributes={setAttributes}
				onOpenReadyPatterns={
					readyPatternsEnabled ? () => openReadyPatterns({ clientId, blockName: name }) : undefined
				}
			>
				<CarouselInspector
					attributes={attributes}
					setAttributes={setAttributes}
					layoutType={name}
					openPanel={openPanel}
					setOpenPanel={setOpenPanel}
					panelTabs={panelTabs}
					setPanelTabs={setPanelTabs}
				/>
			</InspectorControl>

			{/* ── Editor canvas ── */}
			<div {...blockProps}>
				<div
					ref={carouselScopeRef}
					className={classNames('wpcp-block-carousel-scope', {
						'wpcp-block-thumbnails-slider': isThumbnailsSliderBlock,
						[`wpcp-thumbs-layout-${thumbsLayoutClass}`]: isThumbnailsSliderBlock,
						[`wpcp-thumbs-position-${thumbsPositionClass}`]: isThumbnailsSliderBlock,
						[`wpcp-active-style-${activeStyleClass}`]: isThumbnailsSliderBlock,
					})}
					id={uniqueId || undefined}
				>
					{dynamicCssString && <style>{dynamicCssString}</style>}
					{paginationCssString && <style>{paginationCssString}</style>}
					{navigationCssString && <style>{navigationCssString}</style>}
					{tilesPaginationCssString && <style>{tilesPaginationCssString}</style>}
					{/* Inner content wrapper — mirrors the PHP `.wpcp-block-inner` so the
					    General-tab padding selector `#uniqueId > .wpcp-block-inner` resolves
					    in both the editor preview and the frontend (parity). */}
					<div className={classNames('wpcp-block-inner', customCssClass)} id={customCssId || undefined}>
						{isSetup ? (
							<WizardFlow
								attributes={attributes}
								setAttributes={setAttributes}
								onOpenReadyPatterns={() => openReadyPatterns({ clientId, blockName: name })}
								readyPatternsEnabled={readyPatternsEnabled}
								onOpenAIBuilder={() => openAIBuilder({ clientId, blockName: name })}
								aiBuilderEnabled={aiBuilderEnabled}
							/>
						) : (
							<>
								<EditorPreview
									key={initKey}
									attributes={attributes}
									setAttributes={setAttributes}
									name={name}
									onItemEdit={(item) => setEditingItemId(item.id)}
									onEditorPaginationClick={onEditorPaginationClick}
								/>
								{showTilesPaginationPreview && <PaginationPreview attributes={attributes} />}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Editor-only reminder that pattern demo images should be replaced. */}
			{patternDemo && 'image' === sourceType && (
				<PanelNotice className="wpcp-demo-images-notice">
					{__(
						'Note: This block uses demo images for preview only. Please replace them with your own images.',
						'wp-carousel-free'
					)}
				</PanelNotice>
			)}

			{/* ── Gallery/items edit popup ── */}
			{editingGallery && (
				<GalleryEditPopup
					blockName={attributes.blockName}
					items={items}
					sourceType={sourceType}
					onClose={() => setEditingGallery(false)}
					onSave={(updatedItems) => setAttributes({ items: updatedItems, patternDemo: false })}
				/>
			)}

			{/* ── Add video source popup ── */}
			{showAddVideo && (
				<VideoSourceAddPopup
					blockName={attributes.blockName}
					onInsert={(newItems) => {
						setAttributes({ items: [...items, ...newItems] });
					}}
					onClose={() => setShowAddVideo(false)}
				/>
			)}

			{/* ── Single item edit popup ── */}
			<ItemEditPopupRouter
				items={items}
				sourceType={sourceType}
				blockName={attributes.blockName}
				editingItemId={editingItemId}
				setEditingItemId={setEditingItemId}
				setAttributes={setAttributes}
			/>
		</>
	);
}

/* ── Inserter preview wrapper ────────────────────────────────────────────── */

/**
 * Default edit export. In the Gutenberg inserter preview (`isPreviewMode`),
 * renders the stylised layout-shape diagram instead of mounting the full
 * editor — avoids running the carousel's data/Swiper lifecycle inside the
 * preview iframe and matches the "Block Preview" design (Figma 6094-57102).
 * Requires `example` to be set on the block (see each block.json).
 *
 * @param {Object} props Block edit props.
 * @return {JSX.Element} Inserter preview visual or the full editor.
 */
export default function CarouselEditWithPreview(props) {
	const isPreviewMode = useSelect((select) => {
		const settings = select(blockEditorStore).getSettings();
		return !!(settings.isPreviewMode ?? settings.__unstableIsPreviewMode);
	}, []);

	if (isPreviewMode) {
		return <BlockPreviewShape name={props.name} />;
	}

	return <CarouselEdit {...props} />;
}
