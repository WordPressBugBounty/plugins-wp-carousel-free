/**
 * Content Orientations
 */

import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Layouts } from '@wp-carousel-pro/components';
import { isEditorPreviewBlock } from '../../constants/editorPreviewBlocks';
import {
	ContentOrientationClassicIcon,
	ContentOrientationOverlayIcon,
	ContentOrientationDiagonalIcon,
	ContentOrientationContentBoxIcon,
	ContentOrientationContentCustomIcon,
	SliderOrientationsIcon,
} from '@wp-carousel-pro/icons/contentOrientationIcons';

const OVERLAY_ITEM = {
	icon: <ContentOrientationOverlayIcon value={null} />,
	value: 'overlay',
	label: __('Overlay', 'wp-carousel-free'),
};

const CLASSIC_ITEM = {
	icon: <ContentOrientationClassicIcon value={null} />,
	value: 'image-top',
	label: __('Classic', 'wp-carousel-free'),
};

const DIAGONAL_ITEM = {
	icon: <ContentOrientationDiagonalIcon value={null} />,
	value: 'diagonal',
	label: __('Diagonal', 'wp-carousel-free'),
};

const CONTENT_BOX_ITEM = {
	icon: <ContentOrientationContentBoxIcon value={null} />,
	value: 'content-box',
	onlyPro: true,
	label: __('Content Box', 'wp-carousel-free'),
};

const FLY_CONTENT_ITEM = {
	icon: <ContentOrientationContentCustomIcon value={null} />,
	value: 'fly-content',
	onlyPro: true,
	label: __('Fly Content', 'wp-carousel-free'),
};

const OVERLAY_BOX_ITEM = {
	icon: <SliderOrientationsIcon value={null} />,
	value: 'overlay-box',
	onlyPro: true,
	label: __('Overlay Box', 'wp-carousel-free'),
};

/** Free options first, Pro teasers last — Fly Content closes the list. */
const DEFAULT_ITEMS = [
	OVERLAY_ITEM,
	CLASSIC_ITEM,
	DIAGONAL_ITEM,
	CONTENT_BOX_ITEM,
	FLY_CONTENT_ITEM,
];

/** Panorama: no stacked layout on a curved stage, so Classic is out. */
const PANORAMA_ITEMS = [OVERLAY_ITEM, DIAGONAL_ITEM, CONTENT_BOX_ITEM];

/**
 * Drops the `onlyPro` badge so every card in a list is selectable.
 *
 * @param {object[]} items Orientation cards.
 * @return {object[]} The same cards, none of them locked.
 */
const unlockProItems = (items) => items.map(({ onlyPro, ...item }) => item); // eslint-disable-line no-unused-vars

/**
 * Every orientation is live on the two Pro editor previews, locked everywhere
 * else — the same rule the marquee's Variable Width toggle already follows.
 * Safe because neither block has a PHP render path to disagree with:
 * `EditorPreviewBlock::render()` returns before it reads an attribute, so
 * `AllowedValues::content_orientation_items()` stays as it is and nothing a
 * user picks here reaches a visitor.
 */
const PANORAMA_PREVIEW_ITEMS = unlockProItems(PANORAMA_ITEMS);
const DEFAULT_PREVIEW_ITEMS = unlockProItems(DEFAULT_ITEMS);

/** Slider block: overlay-style orientations only — Classic has no stacked layout here. */
export const SLIDER_CONTENT_ORIENTATIONS = ['overlay', 'diagonal'];

const SLIDER_ITEMS = [OVERLAY_ITEM, DIAGONAL_ITEM, OVERLAY_BOX_ITEM];

/** Thumbnails Slider: Diagonal in place of Classic — one full-bleed stage has nowhere to stack content. */
const THUMBNAIL_ITEMS = [OVERLAY_ITEM, DIAGONAL_ITEM];

/** A Thumbnails Slider carrying a Classic or Pro orientation lands on Diagonal. */
const THUMBNAIL_FALLBACK = 'diagonal';

const isPanoramaContext = (context = {}) => {
	const blockName = String(context?.blockName || context?.layoutType || '');
	return blockName === 'carousel-panorama' || blockName === 'wp-carousel-pro/carousel-panorama';
};
const isSliderContext = (context = {}) => {
	const blockName = String(context?.blockName || context?.layoutType || '');
	return (
		blockName === 'slider' || blockName === 'wp-carousel-pro/slider' || blockName.endsWith('/slider')
	);
};
const isEditorPreviewContext = (context = {}) =>
	isEditorPreviewBlock(String(context?.blockName || context?.layoutType || ''));
const isThumbnailContext = (context = {}) => {
	const blockName = String(context?.blockName || context?.layoutType || '');
	return blockName === 'thumbnails-slider' || blockName === 'wp-carousel-pro/thumbnails-slider';
};

// `sourceType` no longer narrows the list; the parameter stays for the call
// signature every consumer shares with the PHP mirror.
// eslint-disable-next-line no-unused-vars
export function getContentOrientationItems(sourceType = 'image', context = {}) {
	if (isPanoramaContext(context)) {
		return PANORAMA_PREVIEW_ITEMS;
	}
	if (isSliderContext(context)) {
		return SLIDER_ITEMS;
	}
	if (isThumbnailContext(context)) {
		return THUMBNAIL_ITEMS;
	}
	if (isEditorPreviewContext(context)) {
		return DEFAULT_PREVIEW_ITEMS;
	}
	return DEFAULT_ITEMS;
}

export function getDefaultContentOrientation(sourceType = 'image', context = {}) {
	return getContentOrientationItems(sourceType, context)[0]?.value || 'image-top';
}

/**
 * The orientation a rejected value lands on. Mirrors
 * `AllowedValues::content_orientation_fallback()`.
 *
 * @param {string} sourceType Block sourceType attribute.
 * @param {Object} context    Block name / thumbs layout context.
 * @return {string} A Free content orientation.
 */
export function getContentOrientationFallback(sourceType = 'image', context = {}) {
	return isThumbnailContext(context)
		? THUMBNAIL_FALLBACK
		: getDefaultContentOrientation(sourceType, context);
}

export function resolveContentOrientation(sourceType = 'image', contentOrientation, context = {}) {
	const allowedValues = getContentOrientationItems(sourceType, context)
		.filter((item) => !item.onlyPro)
		.map((item) => item.value);
	if (allowedValues.includes(contentOrientation)) {
		return contentOrientation;
	}
	return getContentOrientationFallback(sourceType, context);
}

export function getContentAreaPaddingDefault() {
	const defaultValue = 0;

	return {
		allChange: true,
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		device: {
			Desktop: {
				top: defaultValue,
				right: defaultValue,
				bottom: defaultValue,
				left: defaultValue,
			},
		},
	};
}

export function isSameContentAreaPaddingValue(first, second) {
	const firstDesktop = first?.device?.Desktop;
	const secondDesktop = second?.device?.Desktop;
	const firstUnit = first?.unit?.Desktop || 'px';
	const secondUnit = second?.unit?.Desktop || 'px';

	if (!firstDesktop || !secondDesktop || firstUnit !== secondUnit) {
		return false;
	}

	return (
		firstDesktop.top === secondDesktop.top &&
		firstDesktop.right === secondDesktop.right &&
		firstDesktop.bottom === secondDesktop.bottom &&
		firstDesktop.left === secondDesktop.left
	);
}

const ContentOrientations = ({
	label = '',
	attributes,
	setAttributes,
	attributesKey,
	sourceType = 'image',
	blockName = '',
	thumbsLayout = '',
	onChange = false,
	className = '',
}) => {
	const items = getContentOrientationItems(sourceType, { blockName, thumbsLayout }).map((item) => ({
		...item,
		icon: item.icon?.type ? <item.icon.type value={attributes} /> : item.icon,
	}));
	const pickerClassName = className;

	return (
		<Layouts
			attributes={attributes}
			setAttributes={setAttributes}
			attributesKey={attributesKey}
			displayActive={true}
			grid={3}
			className={pickerClassName}
			label={label}
			onChange={onChange}
			items={items}
		/>
	);
};

export default memo(ContentOrientations);
