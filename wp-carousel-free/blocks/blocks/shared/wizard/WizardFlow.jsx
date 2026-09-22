/**
 * WizardFlow – multi-step setup wizard shown when a new block is inserted.
 *
 * Steps:
 *  1. source      – Choose content source type (Image, Video, Post, etc.)
 *  2. orientation  – Choose content orientation (Classic, Overlay, etc.)
 *  3. media        – Upload / Media Library  (image source only)
 *  4. review       – Selected items grid with Edit Gallery + Continue
 *
 * Video-specific steps (after orientation):
 *  3v. videoSource  – Choose video provider + enter URLs / select self-hosted
 *  4v. videoEdit    – Per-video detail editing (title, desc, thumbnail, etc.)
 *
 * For post/product sources, steps 3-4 are skipped (query-driven).
 * For video, step 3 shows Upload/Media Library then step 4 review.
 */

import { __ } from '@wordpress/i18n';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { Button, FormFileUpload, Spinner } from '@wordpress/components';
import { SpProBadge, openPricingPage } from '@wp-carousel-pro/components';
import { MediaUploadCheck, store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import {
	SortableContext,
	rectSortingStrategy,
	verticalListSortingStrategy,
	arrayMove,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import carouselIcon from '../../carousel/icon.jsx';
import { getThumbnailFromUrl, extractMediaSizeUrls, openWpMediaModal } from '../utils/media';
import { isVideoItemInsertable, prepareVideoItemForInsert } from '../utils/videoUrlValidation';
import VideoUrlFieldFeedback, { isVideoUrlFieldValid } from '../ui/VideoUrlFieldFeedback';
import { SliderBlockIcon } from '../../slider/icon';
import { ThumbSliderBlockIcon } from '../../thumbnails-slider/icon';
import { TilesBlockIcon } from '../../tiles/icon';
import {
	getAllowedTopLevelSources,
	getAllowedSubSources,
	getProTopLevelSources,
	PRO_VIDEO_SUB_SOURCES,
	VIDEO_SUB_SOURCES,
} from '../constants/allowedSources';
import {
	SOURCES,
	VIDEO_SOURCES,
	VIDEO_SOURCE_LABELS,
	VIDEO_SOURCE_META,
} from '../constants/sourceMeta';
import ItemEditPopup from '../popups/ItemEditPopup';
import SocialMediaSelectLocked from '../popups/SocialMediaSelectLocked';
import SpProNotice from '../../../components/pro/proNotice';
import { PRO_ITEM_SOCIAL_SHARE } from '../constants/proFeatures';
import {
	getContentOrientationItems,
	getDefaultContentOrientation,
	getContentAreaPaddingDefault,
} from '../inspector/fragments/contentOrientations';
import './WizardFlow.scss';

/* ── Constants ─────────────────────────────────────────────────────────── */

const SOURCE_LABELS = {
	image: __('Images', 'wp-carousel-free'),
	video: __('Videos', 'wp-carousel-free'),
};

const MEDIA_TYPES = {
	image: ['image'],
	video: ['video'],
};

const QUERY_SOURCES = ['post', 'product'];

const BLOCK_WIZARD_META = {
	carousel: {
		title: __('Carousel', 'wp-carousel-free'),
		Icon: carouselIcon,
	},
	slider: {
		title: __('Slider', 'wp-carousel-free'),
		Icon: SliderBlockIcon,
	},
	'thumbnails-slider': {
		title: __('Thumbnails Slider', 'wp-carousel-free'),
		Icon: ThumbSliderBlockIcon,
	},
	tiles: {
		title: __('Tiles', 'wp-carousel-free'),
		Icon: TilesBlockIcon,
	},
};

function getWizardBlockMeta(blockName) {
	return BLOCK_WIZARD_META[blockName] || BLOCK_WIZARD_META.carousel;
}

/* ── Helpers ─────────────────────── */

let _videoIdCounter = 0;
/**
 * Generates a unique identifier for wizard-managed video items.
 *
 * @return {string} Unique video item id.
 */
function generateVideoId() {
	return `video_${Date.now()}_${++_videoIdCounter}`;
}

/**
 * Creates the default video item shape used by wizard steps.
 *
 * @return {Object} Empty video item attributes.
 */
/**
 * Creates the default video item shape used by wizard steps.
 *
 * @param {string} [blockName] Active block, used to pick a video sub-source the
 *                             block allows. Defaults to `'youtube'` when omitted
 *                             or when the block has no allow-list entry.
 * @return {Object} Empty video item attributes.
 */
function createEmptyVideoItem(blockName) {
	const allowed = blockName ? getAllowedSubSources(blockName, 'video') : null;
	const defaultSource = allowed && allowed.length > 0 ? allowed[0] : 'youtube';
	return {
		id: generateVideoId(),
		videoSource: defaultSource,
		videoUrl: '',
		url: '',
		title: '',
		description: '',
		customUrl: '',
		customThumbnail: null,
		customThumbnailUrl: '',
	};
}

const acceptFromMediaTypes = (types) =>
	(Array.isArray(types) ? types : [types]).map((type) => `${type}/*`).join(',');

/**
 * Upload button that opens the native OS file picker directly (mirroring the
 * core Image block), uploads the chosen file(s) to the media library, and hands
 * the resulting attachment object(s) to `onSelect` — instead of opening the WP
 * media-library modal.
 *
 * Each call site supplies its own button markup via `render`, which receives
 * `{ open, isUploading }` (matching the core `MediaUpload` render shape).
 *
 * @param {Object}   props              - Component props.
 * @param {string[]} props.allowedTypes - Allowed media types passed to the uploader.
 * @param {boolean}  props.multiple     - Allow selecting multiple files.
 * @param {Function} props.onSelect     - Receives a single attachment or an array (when multiple).
 * @param {Function} props.render       - Renders the trigger button: ({ open, isUploading }) => JSX.
 * @return {JSX.Element} The file-upload trigger.
 */
function WizardUploadButton({ allowedTypes = ['image'], multiple = false, onSelect, render }) {
	const [isUploading, setIsUploading] = useState(false);
	const mediaUpload = useSelect((select) => select(blockEditorStore).getSettings().mediaUpload, []);

	const handleFiles = (event) => {
		const filesList = event.target.files;
		if (!filesList || !filesList.length) {
			return;
		}
		// Fall back to the media-modal upload tab if the editor provides no uploader.
		if ('function' !== typeof mediaUpload) {
			openWpMediaModal({
				tab: 'upload',
				allowedTypes,
				multiple: multiple ? 'add' : false,
				onSelect,
			});
			return;
		}
		setIsUploading(true);
		mediaUpload({
			allowedTypes,
			filesList,
			onFileChange: (items) => {
				const ready = (items || []).filter(Boolean);
				// uploadMedia fires repeatedly: transient blobs (no id) first, then the
				// final attachments. Wait until every item has a real attachment id.
				if (ready.length && ready.every((media) => media && media.id)) {
					setIsUploading(false);
					onSelect(multiple ? ready : ready[0]);
				}
			},
			onError: () => setIsUploading(false),
		});
	};

	return (
		<FormFileUpload
			accept={acceptFromMediaTypes(allowedTypes)}
			multiple={multiple}
			onChange={handleFiles}
			render={({ openFileDialog }) => render({ open: openFileDialog, isUploading })}
		/>
	);
}

/* ── Step: Source ───────────────────────────────────────────────────────── */

function StepSource({
	blockName,
	sourceType,
	onSelect,
	onOpenReadyPatterns,
	readyPatternsEnabled,
}) {
	const allowedSet = new Set([
		...getAllowedTopLevelSources(blockName),
		...getProTopLevelSources(blockName),
	]);
	// Pro sources keep their catalogue position; the card is a badged teaser that
	// opens the pricing page rather than selecting the source.
	const visibleSources = SOURCES.filter((src) => allowedSet.has(src.value));
	const { title, Icon } = getWizardBlockMeta(blockName);

	return (
		<>
			<div className="wpcp-wizard-header">
				<h2 className="wpcp-wizard-title">
					<span className="wpcp-wizard-title-icon">{Icon ? <Icon /> : null}</span>
					{title}
				</h2>
				<p className="wpcp-wizard-subtitle">
					{__('Choose a content source type to get started', 'wp-carousel-free')}
				</p>
			</div>
			<div className="wpcp-wizard-grid wpcp-wizard-source-grid">
				{visibleSources.map((src) => (
					<div
						key={src.value}
						className={`wpcp-wizard-card ${sourceType === src.value ? 'is-active' : ''}${
							src.pro ? ' wpcp-pro-locked' : ''
						}`}
						role="button"
						tabIndex={0}
						onClick={() => (src.pro ? openPricingPage() : onSelect(src.value))}
						onKeyDown={(e) => e.key === 'Enter' && (src.pro ? openPricingPage() : onSelect(src.value))}
					>
						<span className="wpcp-wizard-card-icon">{src.icon}</span>
						<span className="wpcp-wizard-card-label">{src.label}</span>
						{src.pro && <SpProBadge />}
					</div>
				))}
			</div>
			<div className="wpcp-wizard-footer-actions">
				{readyPatternsEnabled && (
					<Button isPrimary onClick={onOpenReadyPatterns}>
						{__('Start with Ready Patterns', 'wp-carousel-free')}
					</Button>
				)}
			</div>
		</>
	);
}

/* ── Step: Orientation ─────────────────────────────────────────────────── */

function StepOrientation({
	blockName,
	sourceType,
	orientation,
	onSelect,
	onPrev,
	onSkip,
	onOpenReadyPatterns,
	readyPatternsEnabled,
}) {
	const orientationItems = getContentOrientationItems(sourceType, { blockName }).map(
		({ value, icon, onlyPro }) => ({
			value,
			onlyPro,
			Icon: icon?.type,
		})
	);

	return (
		<>
			<div className="wpcp-wizard-header">
				<h2 className="wpcp-wizard-title">{__('Choose Orientation', 'wp-carousel-free')}</h2>
				<p className="wpcp-wizard-subtitle">
					{__('Choose an orientation that fits your content', 'wp-carousel-free')}
				</p>
			</div>
			<div className="wpcp-wizard-grid wpcp-wizard-orientation-grid">
				{orientationItems.map(({ value, Icon, onlyPro }) => (
					<div
						key={value}
						className={`wpcp-wizard-orient-card ${orientation === value ? 'is-active' : ''}${
							onlyPro ? ' wpcp-pro-locked' : ''
						}`}
						role="button"
						tabIndex={0}
						onClick={() => (onlyPro ? openPricingPage() : onSelect(value))}
						onKeyDown={(e) => e.key === 'Enter' && (onlyPro ? openPricingPage() : onSelect(value))}
					>
						<Icon value={null} />
						{onlyPro && <SpProBadge />}
					</div>
				))}
			</div>
			<div className="wpcp-wizard-footer-actions">
				{readyPatternsEnabled && (
					<Button isPrimary onClick={onOpenReadyPatterns}>
						{__('Start with Ready Patterns', 'wp-carousel-free')}
					</Button>
				)}
			</div>
			<div className="wpcp-wizard-nav">
				<Button isLink className="wpcp-wizard-nav-btn" onClick={onPrev}>
					{__('Previous', 'wp-carousel-free')}
				</Button>
				<Button isLink className="wpcp-wizard-nav-btn" onClick={onSkip}>
					{__('Skip', 'wp-carousel-free')}
				</Button>
			</div>
		</>
	);
}

/* ── Step: Media (image) ───────────────────────────────────────────────── */

/**
 * Normalizes a raw WP media attachment into a wizard item.
 *
 * @param {Object} mediaItem Raw attachment object from the media frame.
 * @return {Object} Wizard item shape.
 */
function mapWizardMediaItem(mediaItem) {
	return {
		id: mediaItem.id,
		url: mediaItem.url || '',
		sizes: extractMediaSizeUrls(mediaItem),
	};
}

function StepMedia({ sourceType, onMediaSelect, onPrev, onSkip }) {
	const title = __('Choose Image', 'wp-carousel-free');
	const subtitle = __(
		'Drag and drop images, upload, or choose from your library.',
		'wp-carousel-free'
	);
	const allowedTypes = MEDIA_TYPES[sourceType] || ['image'];

	const handleMediaSelect = (items) => {
		const selected = Array.isArray(items) ? items : [items];
		onMediaSelect(selected.map((mediaItem) => mapWizardMediaItem(mediaItem)));
	};

	return (
		<>
			<div className="wpcp-wizard-header">
				<h2 className="wpcp-wizard-title">{title}</h2>
				<p className="wpcp-wizard-subtitle">{subtitle}</p>
			</div>
			<div className="wpcp-wizard-media-buttons">
				<MediaUploadCheck>
					<WizardUploadButton
						allowedTypes={allowedTypes}
						multiple
						onSelect={handleMediaSelect}
						render={({ open, isUploading }) => (
							<Button
								isPrimary
								isBusy={isUploading}
								disabled={isUploading}
								className="wpcp-wizard-upload-btn"
								onClick={open}
							>
								{isUploading ? (
									<>
										<Spinner />
										{__('Uploading…', 'wp-carousel-free')}
									</>
								) : (
									<>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="20"
											height="20"
											viewBox="0 0 20 20"
											fill="none"
										>
											<path
												d="M0 17V13C0 12.4477 0.447715 12 1 12C1.55228 12 2 12.4477 2 13V17C2 17.2652 2.10543 17.5195 2.29297 17.707C2.48051 17.8946 2.73478 18 3 18H17C17.2652 18 17.5195 17.8946 17.707 17.707C17.8946 17.5195 18 17.2652 18 17V13C18 12.4477 18.4477 12 19 12C19.5523 12 20 12.4477 20 13V17C20 17.7957 19.6837 18.5585 19.1211 19.1211C18.5585 19.6837 17.7957 20 17 20H3C2.20435 20 1.44152 19.6837 0.878906 19.1211C0.316297 18.5585 0 17.7956 0 17Z"
												fill="white"
											/>
											<path
												fillRule="evenodd"
												clipRule="evenodd"
												d="M9.29297 0.292969L9.36914 0.224609C9.34265 0.246185 9.3171 0.268836 9.29297 0.292969ZM9.7164 0.0412407C9.74629 0.0324152 9.7765 0.0250141 9.80694 0.0190376C9.98695 -0.016306 10.1748 -0.0018289 10.3483 0.0625016C10.3802 0.0743179 10.4116 0.0878161 10.4424 0.102997C10.309 0.0370634 10.1589 0 10 0C9.90143 0 9.80631 0.0146006 9.7164 0.0412407Z"
												fill="white"
											/>
											<path
												d="M5.70703 6.70703L9 3.41406V13C9 13.5523 9.44771 14 10 14C10.5523 14 11 13.5523 11 13V3.41406L14.293 6.70703C14.6835 7.09756 15.3165 7.09756 15.707 6.70703C16.0976 6.31651 16.0976 5.68349 15.707 5.29297L10.7174 0.303343L10.707 0.292969C10.4388 0.0247164 10.0562 -0.0591166 9.7164 0.0412407C9.63671 0.0647753 9.55937 0.0984389 9.48639 0.142229C9.44584 0.166562 9.40664 0.194022 9.36914 0.224609L9.29297 0.292969L9.28259 0.303343L4.29297 5.29297C3.90244 5.68349 3.90244 6.31651 4.29297 6.70703C4.68349 7.09756 5.31651 7.09756 5.70703 6.70703Z"
												fill="white"
											/>
										</svg>
										{__('Upload', 'wp-carousel-free')}
									</>
								)}
							</Button>
						)}
					/>
					<Button
						isSecondary
						className="wpcp-wizard-library-btn"
						onClick={() =>
							openWpMediaModal({
								tab: 'browse',
								allowedTypes,
								multiple: 'add',
								onSelect: handleMediaSelect,
							})
						}
					>
						{__('Media Library', 'wp-carousel-free')}
					</Button>
				</MediaUploadCheck>
			</div>
			<div className="wpcp-wizard-nav">
				<Button isLink className="wpcp-wizard-nav-btn" onClick={onPrev}>
					{__('Previous', 'wp-carousel-free')}
				</Button>
				<Button isLink className="wpcp-wizard-nav-btn" onClick={onSkip}>
					{__('Skip', 'wp-carousel-free')}
				</Button>
			</div>
		</>
	);
}

/* ── Step: Video Source (accordion panel design) ───────────────────────── */

function SortableVideoPanel({ blockName, item, isExpanded, onToggle, onDelete, onUpdate }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});
	const [showInfo, setShowInfo] = useState(false);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const sourceObj = VIDEO_SOURCES.find((s) => s.value === item.videoSource);
	const sourceLabel = sourceObj?.label || 'YouTube';
	const urlLabel = VIDEO_SOURCE_LABELS[item.videoSource] || __('Video URL', 'wp-carousel-free');
	const videoUrlInputId = `video-url-${item.id}`;
	const videoUrlFeedbackId = `${videoUrlInputId}-feedback`;
	const trimmedVideoUrl = String(item.videoUrl || '').trim();
	const videoUrlInvalid =
		!!trimmedVideoUrl && !isVideoUrlFieldValid(item.videoSource, item.videoUrl);

	const updateField = (field, value) => {
		const updated = { ...item, [field]: value };
		if (field === 'videoUrl') {
			updated.url = getThumbnailFromUrl(item.videoSource, value) || item.url;
		}
		if (field === 'videoSource' && item.videoUrl) {
			updated.url = getThumbnailFromUrl(value, item.videoUrl) || '';
		}
		onUpdate(updated);
	};

	const handleCustomThumbnailSelect = (selected) => {
		const selectedMedia = Array.isArray(selected) ? selected[0] : selected;
		onUpdate({
			...item,
			customThumbnail: selectedMedia.id,
			customThumbnailUrl: selectedMedia.url || '',
		});
	};

	const handleRemoveThumbnail = () => {
		onUpdate({
			...item,
			customThumbnail: null,
			customThumbnailUrl: '',
		});
	};

	const getHeaderText = () => {
		if (isExpanded) {
			return __('Add Video', 'wp-carousel-free');
		}
		if (item.videoUrl) {
			return `${sourceLabel}:  ${item.videoUrl}`;
		}
		return `${sourceLabel}:  ${urlLabel}`;
	};
	const headerText = getHeaderText();

	const socialSharingField = (
		<>
			<div className="wpcp-wizard-video-panel-field wpcp-wizard-video-panel-field--social wpcp-pro-locked-row">
				<span>
					{__('Allow Social Media for Sharing', 'wp-carousel-free')}{' '}
					<span className="wpcp-pro-inline-tag">{__('(Pro)', 'wp-carousel-free')}</span>
				</span>
				<SocialMediaSelectLocked />
			</div>
			<SpProNotice
				className="is-upsell"
				message={PRO_ITEM_SOCIAL_SHARE.message}
				linkText={PRO_ITEM_SOCIAL_SHARE.linkText}
			/>
		</>
	);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`wpcp-wizard-video-panel ${isDragging ? 'is-dragging' : ''} ${
				isExpanded ? 'is-expanded' : ''
			}`}
			{...attributes}
		>
			<div className="wpcp-wizard-video-panel-header">
				<span className="wpcp-wizard-video-panel-drag" {...listeners}>
					<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
						<circle cx="7" cy="4" r="1.5" />
						<circle cx="13" cy="4" r="1.5" />
						<circle cx="7" cy="10" r="1.5" />
						<circle cx="13" cy="10" r="1.5" />
						<circle cx="7" cy="16" r="1.5" />
						<circle cx="13" cy="16" r="1.5" />
					</svg>
				</span>
				<span
					className="wpcp-wizard-video-panel-header-text"
					onClick={onToggle}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => e.key === 'Enter' && onToggle()}
				>
					{headerText}
				</span>
				<div className="wpcp-wizard-video-panel-header-actions">
					<button
						type="button"
						className="wpcp-wizard-video-panel-action"
						onClick={onDelete}
						aria-label={__('Delete', 'wp-carousel-free')}
					>
						<svg
							viewBox="0 0 24 24"
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
					<button
						type="button"
						className="wpcp-wizard-video-panel-action"
						onClick={onToggle}
						aria-label={__('Toggle', 'wp-carousel-free')}
					>
						<svg
							viewBox="0 0 24 24"
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							{isExpanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
						</svg>
					</button>
				</div>
			</div>

			{isExpanded && (
				<div className="wpcp-wizard-video-panel-body">
					<p className="wpcp-wizard-video-panel-subtitle">
						{__('Choose a Video Source', 'wp-carousel-free')}
					</p>

					<div className="wpcp-wizard-grid wpcp-wizard-video-source-grid">
						{[
							...(getAllowedSubSources(blockName, 'video') || VIDEO_SUB_SOURCES),
							...PRO_VIDEO_SUB_SOURCES,
						].map((value) => {
							const meta = VIDEO_SOURCE_META[value];
							if (!meta) {
								return null;
							}
							// Pro providers keep their catalogue position; the card is a badged
							// teaser that opens the pricing page rather than selecting a source.
							const selectSource = () =>
								meta.pro ? openPricingPage() : updateField('videoSource', meta.value);
							return (
								<div
									key={meta.value}
									className={`wpcp-wizard-card wpcp-wizard-video-card ${
										item.videoSource === meta.value ? 'is-active' : ''
									}${meta.pro ? ' wpcp-pro-locked' : ''}`}
									role="button"
									tabIndex={0}
									aria-pressed={item.videoSource === meta.value}
									onClick={selectSource}
									onKeyDown={(e) => e.key === 'Enter' && selectSource()}
								>
									<span className="wpcp-wizard-card-icon">{meta.icon}</span>
									<span className="wpcp-wizard-card-label">{meta.label}</span>
									{meta.pro && <SpProBadge />}
								</div>
							);
						})}
					</div>

					<div className="wpcp-wizard-video-panel-field">
						<label htmlFor={videoUrlInputId}>{urlLabel}</label>
						<input
							id={videoUrlInputId}
							type="text"
							value={item.videoUrl || ''}
							onChange={(e) => updateField('videoUrl', e.target.value)}
							placeholder={__('Video URL', 'wp-carousel-free')}
							aria-invalid={videoUrlInvalid}
							aria-describedby={videoUrlFeedbackId}
						/>
						<VideoUrlFieldFeedback
							videoSource={item.videoSource}
							videoUrl={item.videoUrl || ''}
							feedbackId={videoUrlFeedbackId}
							errorClassName="wpcp-item-popup-url-error"
							helpClassName="wpcp-wizard-video-panel-help"
						/>
					</div>

					<div className="wpcp-wizard-video-panel-thumb-row">
						<span className="wpcp-wizard-video-panel-thumb-label">
							{__('Custom Thumbnail', 'wp-carousel-free')}
						</span>
						<MediaUploadCheck>
							<Button
								isSecondary
								onClick={() =>
									openWpMediaModal({
										tab: 'browse',
										allowedTypes: ['image'],
										onSelect: handleCustomThumbnailSelect,
									})
								}
								className="wpcp-wizard-video-panel-choose-image"
							>
								{item.customThumbnailUrl ? (
									<>
										<img src={item.customThumbnailUrl} alt="" className="wpcp-wizard-video-thumb-mini" />
										{__('Change Image', 'wp-carousel-free')}
									</>
								) : (
									__('Choose Image', 'wp-carousel-free')
								)}
							</Button>
						</MediaUploadCheck>
						{item.customThumbnailUrl && (
							<button
								type="button"
								className="wpcp-wizard-video-panel-remove-thumb"
								onClick={handleRemoveThumbnail}
								aria-label={__('Remove thumbnail', 'wp-carousel-free')}
							>
								<svg
									viewBox="0 0 24 24"
									width="16"
									height="16"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
									<path d="M10 11v6" />
									<path d="M14 11v6" />
								</svg>
							</button>
						)}
						<button
							type="button"
							className={`wpcp-wizard-video-panel-toggle-info ${showInfo ? 'is-active' : ''}`}
							onClick={() => setShowInfo(!showInfo)}
						>
							{showInfo
								? __('Hide video info', 'wp-carousel-free')
								: __('Add video info', 'wp-carousel-free')}
						</button>
					</div>

					{showInfo && (
						<div className="wpcp-wizard-video-panel-info">
							<div className="wpcp-wizard-video-panel-field">
								<label htmlFor={`video-title-${item.id}`}>{__('Video Title', 'wp-carousel-free')}</label>
								<input
									id={`video-title-${item.id}`}
									type="text"
									value={item.title || ''}
									onChange={(e) => updateField('title', e.target.value)}
									placeholder={__('Give a custom title', 'wp-carousel-free')}
								/>
							</div>
							<div className="wpcp-wizard-video-panel-field">
								<label htmlFor={`video-description-${item.id}`}>
									{__('Video Description', 'wp-carousel-free')}
								</label>
								<textarea
									id={`video-description-${item.id}`}
									value={item.description || ''}
									onChange={(e) => updateField('description', e.target.value)}
									placeholder={__('Give a custom description', 'wp-carousel-free')}
									rows={3}
								/>
							</div>
							<div className="wpcp-wizard-video-panel-field">
								<label htmlFor={`custom-url-${item.id}`}>{__('Custom URL', 'wp-carousel-free')}</label>
								<input
									id={`custom-url-${item.id}`}
									type="url"
									value={item.customUrl || ''}
									onChange={(e) => updateField('customUrl', e.target.value)}
								/>
							</div>
							{socialSharingField}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function StepVideoSource({ blockName, videoItems, onItemsChange, onInsert, onPrev }) {
	const [expandedId, setExpandedId] = useState(() => {
		if (videoItems.length > 0) {
			return videoItems[videoItems.length - 1].id;
		}
		return null;
	});
	const panelsRef = useRef(null);

	useEffect(() => {
		if (videoItems.length === 0) {
			const newItem = createEmptyVideoItem(blockName);
			onItemsChange([newItem]);
			setExpandedId(newItem.id);
			return;
		}
		const allowed = getAllowedSubSources(blockName, 'video');
		if (!allowed || allowed.length === 0) {
			return;
		}
		const allowedSet = new Set(allowed);
		const needsNormalize = videoItems.some((videoItem) => !allowedSet.has(videoItem.videoSource));
		if (needsNormalize) {
			const fallback = allowed[0];
			onItemsChange(
				videoItems.map((videoItem) =>
					allowedSet.has(videoItem.videoSource)
						? videoItem
						: { ...videoItem, videoSource: fallback, videoUrl: '' }
				)
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		})
	);

	const handleDragEnd = useCallback(
		(event) => {
			const { active, over } = event;
			if (active && over && active.id !== over.id) {
				const oldIndex = videoItems.findIndex((videoItem) => videoItem.id === active.id);
				const newIndex = videoItems.findIndex((videoItem) => videoItem.id === over.id);
				onItemsChange(arrayMove(videoItems, oldIndex, newIndex));
			}
		},
		[videoItems, onItemsChange]
	);

	const handleToggle = (id) => {
		setExpandedId(expandedId === id ? null : id);
	};

	const handleDelete = (id) => {
		const newItems = videoItems.filter((videoItem) => videoItem.id !== id);
		onItemsChange(newItems);
		if (expandedId === id && newItems.length > 0) {
			setExpandedId(newItems[newItems.length - 1].id);
		} else if (newItems.length === 0) {
			setExpandedId(null);
		}
	};

	const handleUpdate = (updatedItem) => {
		onItemsChange(
			videoItems.map((videoItem) => (videoItem.id === updatedItem.id ? updatedItem : videoItem))
		);
	};

	const handleAddNew = () => {
		const newItem = createEmptyVideoItem(blockName);
		onItemsChange([...videoItems, newItem]);
		setExpandedId(newItem.id);
		requestAnimationFrame(() => {
			setTimeout(() => {
				if (panelsRef.current) {
					panelsRef.current.scrollTo({ top: panelsRef.current.scrollHeight, behavior: 'smooth' });
				}
			}, 100);
		});
	};

	const hasValidItems = videoItems.some((videoItem) => isVideoItemInsertable(videoItem));
	const hasBlockingInvalidUrl = videoItems.some((videoItem) => {
		const trimmed = String(videoItem.videoUrl || '').trim();
		return trimmed && !isVideoUrlFieldValid(videoItem.videoSource, videoItem.videoUrl);
	});
	const canInsert = hasValidItems && !hasBlockingInvalidUrl;

	return (
		<>
			<div className="wpcp-wizard-header">
				<h2 className="wpcp-wizard-title">{__('Video', 'wp-carousel-free')}</h2>
			</div>

			<div className="wpcp-wizard-video-panels-wrap" ref={panelsRef}>
				<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
					<SortableContext
						items={videoItems.map((videoItem) => videoItem.id)}
						strategy={verticalListSortingStrategy}
					>
						{videoItems.map((item) => (
							<SortableVideoPanel
								key={item.id}
								blockName={blockName}
								item={item}
								isExpanded={expandedId === item.id}
								onToggle={() => handleToggle(item.id)}
								onDelete={() => handleDelete(item.id)}
								onUpdate={handleUpdate}
							/>
						))}
					</SortableContext>
				</DndContext>
			</div>

			<button type="button" className="wpcp-wizard-add-video-btn" onClick={handleAddNew}>
				<svg
					viewBox="0 0 24 24"
					width="16"
					height="16"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="16" />
					<line x1="8" y1="12" x2="16" y2="12" />
				</svg>
				{__('Add New Video', 'wp-carousel-free')}
			</button>

			<div className="wpcp-wizard-footer-actions">
				<Button
					isPrimary
					disabled={!canInsert}
					onClick={() =>
						onInsert(
							videoItems
								.filter((videoItem) => isVideoItemInsertable(videoItem))
								.map((videoItem) => prepareVideoItemForInsert(videoItem))
						)
					}
				>
					{__('Insert Videos', 'wp-carousel-free')}
				</Button>
			</div>

			<div className="wpcp-wizard-nav">
				<Button isLink className="wpcp-wizard-nav-btn" onClick={onPrev}>
					{__('Previous', 'wp-carousel-free')}
				</Button>
			</div>
		</>
	);
}

/* ── Step: Review (images / generic) ───────────────────────────────────── */

function SortableThumb({ item, onDelete, onItemEdit, isVideo }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	const thumbUrl = item.customThumbnailUrl || item.url || '';

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`wpcp-wizard-thumb ${isDragging ? 'is-dragging' : ''}`}
			{...attributes}
			{...listeners}
		>
			{thumbUrl ? (
				<img src={thumbUrl} alt="" />
			) : (
				<div className="wpcp-wizard-thumb-placeholder">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#aaa" strokeWidth="1">
						<rect x="2" y="3" width="20" height="14" rx="2" />
						<path d="M10 8l6 4-6 4V8z" />
					</svg>
				</div>
			)}
			{isVideo && (
				<div className="wpcp-wizard-thumb-play">
					<svg viewBox="0 0 24 24" width="28" height="28" fill="none">
						<circle cx="12" cy="12" r="12" fill="rgba(25, 148, 158, 0.85)" />
						<path d="M10 8l6 4-6 4V8z" fill="#fff" />
					</svg>
				</div>
			)}

			<div className="wpcp-wizard-thumb-overlay">
				<button
					type="button"
					className="wpcp-wizard-thumb-action"
					onClick={(e) => {
						e.stopPropagation();
						onItemEdit(item);
					}}
					aria-label={__('Edit item', 'wp-carousel-free')}
				>
					<svg
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 20h9" /> <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
					</svg>
				</button>
				<button
					type="button"
					className="wpcp-wizard-thumb-action wpcp-wizard-thumb-delete"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(item.id);
					}}
					aria-label={__('Delete item', 'wp-carousel-free')}
				>
					<svg
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="3 6 5 6 21 6" />
						<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
						<path d="M10 11v6" />
						<path d="M14 11v6" />
						<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
					</svg>
				</button>
			</div>
		</div>
	);
}

function StepReview({
	sourceType,
	items,
	onEdit,
	onContinue,
	onPrev,
	onReorder,
	onDeleteItem,
	onItemEdit,
}) {
	const title = SOURCE_LABELS[sourceType] || __('Images', 'wp-carousel-free');
	const subtitle =
		sourceType === 'image'
			? __('Drag and drop images, upload, or choose from your library.', 'wp-carousel-free')
			: __('Drag and drop Files, upload, or choose from your library.', 'wp-carousel-free');

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		})
	);

	const handleDragEnd = useCallback(
		(event) => {
			const { active, over } = event;
			if (active && over && active.id !== over.id) {
				const oldIndex = items.findIndex((wizardItem) => wizardItem.id === active.id);
				const newIndex = items.findIndex((wizardItem) => wizardItem.id === over.id);
				onReorder(arrayMove(items, oldIndex, newIndex));
			}
		},
		[items, onReorder]
	);

	return (
		<>
			<div className="wpcp-wizard-header">
				<h2 className="wpcp-wizard-title">{title}</h2>
				<p className="wpcp-wizard-subtitle">{subtitle}</p>
			</div>
			<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
				<SortableContext
					items={items.map((wizardItem) => wizardItem.id)}
					strategy={rectSortingStrategy}
				>
					<div className="wpcp-wizard-thumbs">
						{items.map((item) => (
							<SortableThumb
								key={item.id}
								item={item}
								onDelete={onDeleteItem}
								onItemEdit={onItemEdit}
								isVideo={sourceType === 'video'}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
			<div className="wpcp-wizard-edit-gallery">
				<Button isLink onClick={onEdit}>
					<svg
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 20h9" />
						<path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
					</svg>
					{sourceType === 'video'
						? __('Edit Videos', 'wp-carousel-free')
						: __('Edit Gallery', 'wp-carousel-free')}
				</Button>
			</div>
			<div className="wpcp-wizard-nav">
				<Button isLink className="wpcp-wizard-nav-btn" onClick={onPrev}>
					{__('Previous', 'wp-carousel-free')}
				</Button>
				<Button isLink className="wpcp-wizard-nav-btn wpcp-wizard-continue" onClick={onContinue}>
					{__('Continue', 'wp-carousel-free')}
				</Button>
			</div>
		</>
	);
}
/* ── Main Wizard ───────────────────────────────────────────────────────── */
/**
 * Renders the onboarding wizard used to configure block source and initial items.
 *
 * @param {Object}   props                        Component props.
 * @param {Object}   props.attributes             Current block attributes.
 * @param {Function} props.setAttributes          Gutenberg setter for attributes.
 * @param {string}   [props.initialStep]          Optional initial wizard step key.
 * @param {Function} [props.onComplete]           Optional callback after wizard completion.
 * @param {Function} [props.onOpenReadyPatterns]  Opens the Ready Patterns modal.
 * @param {boolean}  [props.readyPatternsEnabled] Whether Ready Patterns entry is shown.
 * @return {JSX.Element} Wizard UI.
 */
export default function WizardFlow({
	attributes,
	setAttributes,
	initialStep,
	onComplete,
	onOpenReadyPatterns,
	readyPatternsEnabled,
}) {
	const { sourceType, items = [], blockName } = attributes;
	const layoutOptions = attributes.layoutOptions || {};
	const allowedTopLevel = getAllowedTopLevelSources(blockName);
	const fallbackSource = allowedTopLevel[0] || 'image';
	const initialSource =
		sourceType && allowedTopLevel.includes(sourceType) ? sourceType : fallbackSource;

	const [step, setStep] = useState(initialStep || 'source');
	const [localSource, setLocalSource] = useState(initialSource);
	const [localOrientation, setLocalOrientation] = useState(
		layoutOptions.contentOrientation || getDefaultContentOrientation(initialSource, { blockName })
	);
	const [localItems, setLocalItems] = useState(items);
	const [editingItemId, setEditingItemId] = useState(null);

	const handleSourceSelect = (value) => {
		const nextOrientation = getDefaultContentOrientation(value, { blockName });
		setLocalSource(value);
		setLocalOrientation(nextOrientation);
		setStep('orientation');
	};

	const handleOrientationSelect = (value) => {
		setLocalOrientation(value);
		goToMediaStep(value);
	};

	const buildQueryOptions = () => {
		const queryOptions = attributes.queryOptions || {};
		if (localSource === 'post') {
			return { ...queryOptions, postTypes: ['post'] };
		}
		if (localSource === 'product') {
			return { ...queryOptions, postTypes: ['product'] };
		}
		return queryOptions;
	};

	const goToMediaStep = (orient) => {
		const nextOrientation = orient || localOrientation;
		const updates = {
			sourceType: localSource,
			layoutOptions: { ...layoutOptions, contentOrientation: nextOrientation },
			contentAreaOptions: {
				...(attributes.contentAreaOptions || {}),
				padding: getContentAreaPaddingDefault(),
			},
		};

		if (QUERY_SOURCES.includes(localSource)) {
			updates.queryOptions = buildQueryOptions();
		}

		setAttributes(updates);

		if (QUERY_SOURCES.includes(localSource)) {
			finishWizard(updates);
			return;
		}

		if (localSource === 'video') {
			setStep('videoSource');
			return;
		}

		setStep('media');
	};

	const handleMediaSelected = (selectedItems) => {
		setLocalItems(selectedItems);
		setStep('review');
	};

	const handleMediaSkip = () => {
		setLocalItems([]);
		setLocalSource(fallbackSource);
		setLocalOrientation(getDefaultContentOrientation(fallbackSource, { blockName }));
		setAttributes({
			sourceType: '',
			items: [],
		});
		setStep('source');
	};

	const finishWizard = (extraUpdates = {}) => {
		const updates = {
			sourceType: localSource,
			layoutOptions: { ...layoutOptions, contentOrientation: localOrientation },
			items: localItems,
			...extraUpdates,
		};
		if (QUERY_SOURCES.includes(localSource)) {
			updates.queryOptions = buildQueryOptions();
		}
		setAttributes(updates);
		if (onComplete) {
			onComplete();
		}
	};

	const handleEditGallery = () => {
		openWpMediaModal({
			tab: 'browse',
			allowedTypes: MEDIA_TYPES[localSource] || ['image'],
			// Match the initial Media Library picker and Gutenberg MediaUpload:
			// `true` replaces the selection on click; `'add'` keeps prior picks.
			multiple: 'add',
			selected: localItems.map((item) => item.id).filter(Boolean),
			onSelect: (mediaItems) => {
				const selected = Array.isArray(mediaItems) ? mediaItems : [mediaItems];
				handleMediaSelected(selected.map((mediaItem) => mapWizardMediaItem(mediaItem)));
			},
		});
	};

	const handleReorder = (reorderedItems) => {
		setLocalItems(reorderedItems);
	};

	const handleDeleteItem = (itemId) => {
		setLocalItems((prev) => prev.filter((i) => i.id !== itemId));
	};

	const handleItemEdit = (item) => {
		setEditingItemId(item.id);
	};

	const handleItemEditBack = () => {
		setEditingItemId(null);
	};

	const handleItemSave = (updatedItem) => {
		setLocalItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
	};

	const handleReplaceItem = (oldId, newData) => {
		setLocalItems((prev) => prev.map((i) => (i.id === oldId ? { ...i, ...newData } : i)));
		setEditingItemId(newData.id);
	};

	const handleNavigateItem = (index) => {
		const target = localItems[index];
		if (target) {
			setEditingItemId(target.id);
		}
	};

	/* ── Video-specific handlers ── */

	const handleVideoInsert = (videoItemsData) => {
		setLocalItems(videoItemsData);
		finishWizard({ items: videoItemsData });
	};

	/**
	 * Renders the source-specific item editing popup for the active wizard item.
	 *
	 * @return {JSX.Element|null} Active popup component or null.
	 */
	const renderEditingPopup = () => {
		if (editingItemId === null) {
			return null;
		}

		const currentIndex = localItems.findIndex((wizardItem) => wizardItem.id === editingItemId);
		const currentItem = currentIndex >= 0 ? localItems[currentIndex] : null;
		if (!currentItem) {
			return null;
		}

		const handleRemoveItem = (id) => {
			handleDeleteItem(id);
			handleItemEditBack();
		};

		return (
			<ItemEditPopup
				item={currentItem}
				items={localItems}
				currentIndex={currentIndex}
				blockName={blockName}
				onSave={handleItemSave}
				onBack={handleItemEditBack}
				onNavigate={handleNavigateItem}
				onRemoveItem={handleRemoveItem}
				onReplaceItem={handleReplaceItem}
			/>
		);
	};

	return (
		<div className="wpcp-wizard-canvas">
			{step === 'source' && (
				<StepSource
					blockName={blockName}
					sourceType={localSource}
					onSelect={handleSourceSelect}
					onOpenReadyPatterns={onOpenReadyPatterns}
					readyPatternsEnabled={readyPatternsEnabled}
				/>
			)}

			{step === 'orientation' && (
				<StepOrientation
					blockName={blockName}
					sourceType={localSource}
					orientation={localOrientation}
					onSelect={handleOrientationSelect}
					onPrev={() => setStep('source')}
					onSkip={() => goToMediaStep(localOrientation)}
					onOpenReadyPatterns={onOpenReadyPatterns}
					readyPatternsEnabled={readyPatternsEnabled}
				/>
			)}

			{step === 'media' && (
				<StepMedia
					sourceType={localSource}
					onMediaSelect={handleMediaSelected}
					onPrev={() => setStep('orientation')}
					onSkip={handleMediaSkip}
				/>
			)}

			{step === 'review' && (
				<StepReview
					sourceType={localSource}
					items={localItems}
					onEdit={handleEditGallery}
					onContinue={finishWizard}
					onPrev={() => setStep('media')}
					onReorder={handleReorder}
					onDeleteItem={handleDeleteItem}
					onItemEdit={handleItemEdit}
				/>
			)}

			{step === 'videoSource' && (
				<StepVideoSource
					blockName={blockName}
					videoItems={localItems}
					onItemsChange={setLocalItems}
					onInsert={handleVideoInsert}
					onPrev={() => setStep('orientation')}
				/>
			)}

			{renderEditingPopup()}
		</div>
	);
}
