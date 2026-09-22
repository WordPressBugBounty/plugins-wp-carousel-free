/**
 * Card Content — Settings tab.
 *
 * Reuses the former General-tab controls verbatim (Decision #7 defers the
 * Settings redesign until its Figma lands): the sortable element list +
 * visibility and the orientation-gated layout controls (both from the former
 * "Card Elements" panel), with the source-routed content settings (title tag,
 * lengths, read-more options) rendered between them by `sourceType`
 * (image/audio/document → `contentOptions`, post/external/video →
 * `postContentOptions`, product → `productContentOptions`). The source settings
 * show for every orientation, so their
 * length/tag options must stay editable there too.
 */

import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { Toggle, getPricingUrl, SpProNotice } from '@wp-carousel-pro/components';
import ToggleGroupControl from '@wp-carousel-pro/components/toggleGroupControl/toggleGroupControl';
import { BorderIcon } from '@wp-carousel-pro/icons/icons';
import { PRO_CARD_CONTENT_SETTINGS } from '../../../constants/proFeatures';
import { useOptionSetter } from '../../../hooks/useOptionSetter';
import { buildSlotToggleUpdates, isReadMoreSuppressedByClickAction } from '../../visibility';
import { resolveContentOrientation } from '../../fragments/contentOrientations';
import { isContentHoverOrientation } from '../../../utils';
import {
	ALIGNMENTS,
	SORT_ITEMS_BY_SOURCE,
	SortableList,
	isContentOverlayOptionsOrientation,
	isContentAlignmentOrientation,
} from './contentAreaHelpers';
import ImageContentSettings from './settingsSources/ImageContentSettings';
import PostContentSettings from './settingsSources/PostContentSettings';
import ProductContentSettings from './settingsSources/ProductContentSettings';

const POST_FAMILY_SOURCES = ['post', 'video'];

function SourceContentSettings({ attributes, setAttributes }) {
	const sourceType = attributes?.sourceType || 'image';
	if ('product' === sourceType) {
		return <ProductContentSettings attributes={attributes} setAttributes={setAttributes} />;
	}
	if (POST_FAMILY_SOURCES.includes(sourceType)) {
		return <PostContentSettings attributes={attributes} setAttributes={setAttributes} />;
	}
	return <ImageContentSettings attributes={attributes} setAttributes={setAttributes} />;
}

export default function SettingsTab({ attributes, setAttributes }) {
	const { sourceType } = attributes;
	const cao = useMemo(() => attributes.contentAreaOptions || {}, [attributes.contentAreaOptions]);
	const co = attributes.contentOptions || {};
	const contentOrientation = resolveContentOrientation(
		sourceType || 'image',
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const showContentOverlayOptions = isContentOverlayOptionsOrientation(contentOrientation);
	const showContentAlignmentOptions = isContentAlignmentOrientation(contentOrientation);
	const showContentHoverOptions = isContentHoverOrientation(contentOrientation);
	const isClassicOrientation = contentOrientation === 'image-top';
	const suppressReadMore = isReadMoreSuppressedByClickAction(attributes);
	const defaultItems = SORT_ITEMS_BY_SOURCE[sourceType] || SORT_ITEMS_BY_SOURCE.image;
	const defaultOrder = defaultItems.map((item) => item.id);
	const set = useOptionSetter(attributes, setAttributes, 'contentAreaOptions');
	const setContentOptions = useOptionSetter(attributes, setAttributes, 'contentOptions');

	const handleReorder = useCallback(
		(newOrder) => {
			set({ order: newOrder });
		},
		[set]
	);

	const handleToggleVisibility = useCallback(
		(slotId, next) => {
			setAttributes(buildSlotToggleUpdates(attributes, slotId, next));
		},
		[attributes, setAttributes]
	);
	const updateSortableSource = sourceType;
	// Remove slots that cannot render so their controls cannot imply otherwise.
	const sortableExcludeSlots = useMemo(
		() => (suppressReadMore ? ['readmore'] : []),
		[suppressReadMore]
	);

	return (
		<>
			<SortableList
				sourceType={updateSortableSource}
				order={cao.order || defaultOrder}
				attributes={attributes}
				contentOrientation={contentOrientation}
				onReorder={handleReorder}
				onToggleVisibility={handleToggleVisibility}
				excludeSlots={sortableExcludeSlots}
			/>

			<SourceContentSettings attributes={attributes} setAttributes={setAttributes} />

			{sourceType !== 'audio' &&
				showContentHoverOptions &&
				!['slider', 'thumbnails-slider'].includes(attributes?.blockName) && (
					<Toggle
						label={__('Display Content on Hover Only', 'wp-carousel-free')}
						attributes={co.displayOnHover ?? false}
						attributesKey="displayOnHover"
						setAttributes={setContentOptions}
					/>
				)}
			<div style={{ marginTop: 16 }}>
				{sourceType !== 'audio' && showContentOverlayOptions && (
					<>
						<div className="wpcp-header-control wpcp-component-mb">
							<div className="wpcp-header-control-left">
								<span className="wpcp-component-title wpcp-pro-inline-title">
									{__('Content Position', 'wp-carousel-free')}
								</span>
								<a
									className="wpcp-pro-inline-tag"
									href={getPricingUrl()}
									target="_blank"
									rel="noopener noreferrer"
								>
									{__('(Pro)', 'wp-carousel-free')}
								</a>
							</div>
							<div className="wpcp-header-control-right">
								<span className="wpcp-pro-static-icon" aria-hidden="true">
									<BorderIcon />
								</span>
							</div>
						</div>
					</>
				)}

				{isClassicOrientation && (
					// Zigzag Orientation is Pro.
					<Toggle label={__('Zig Zag Orientation', 'wp-carousel-free')} attributes={false} onlyPro />
				)}
				{sourceType !== 'audio' && showContentAlignmentOptions && (
					<ToggleGroupControl
						label={__('Content Alignment', 'wp-carousel-free')}
						attributes={co.alignment ?? 'left'}
						attributesKey="alignment"
						setAttributes={setContentOptions}
						items={ALIGNMENTS}
					/>
				)}
			</div>

			<SpProNotice
				title={PRO_CARD_CONTENT_SETTINGS.title}
				subtitle={PRO_CARD_CONTENT_SETTINGS.subtitle}
				features={PRO_CARD_CONTENT_SETTINGS.features}
				icon={false}
				linkButton
				className="is-upsell"
			/>
		</>
	);
}
