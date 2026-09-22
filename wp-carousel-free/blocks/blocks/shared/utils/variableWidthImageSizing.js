/**
 * Variable-width image sizing — shared predicates for the standard Swiper
 * variable-width path (slide width follows the image).
 *
 * Mirrored by `DimensionHelper::is_variable_width_image_sizing()` /
 * `DimensionHelper::has_variable_width_image_height()` in PHP.
 */

import { VARIABLE_WIDTH_EXCLUDED_STYLES } from '../carousel-render/constants';

/**
 * Shared Variable Width gating: on, horizontal, and not an excluded source.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} True when Variable Width applies at all.
 */
function isVariableWidthActive(attributes = {}) {
	const layoutOptions = attributes.layoutOptions || {};
	if (!layoutOptions.variableWidth) {
		return false;
	}
	if ((layoutOptions.displayStyle || 'horizontal') === 'vertical') {
		return false;
	}
	return true;
}

/**
 * Resolve the carousel style key used by the Variable Width gates below.
 * `blockName` is stored both bare and namespaced (see THUMBS_SLIDER_GATE).
 *
 * @param {Object} attributes Block attributes.
 * @return {{blockName: string, style: string}} Normalized block name + style.
 */
function resolveVariableWidthStyle(attributes = {}) {
	const layoutOptions = attributes.layoutOptions || {};
	const blockName = String(attributes.blockName || 'carousel').replace('wp-carousel-pro/', '');
	return {
		blockName,
		style: 'carousel-panorama' === blockName ? 'panorama' : layoutOptions.carouselStyle || 'standard',
	};
}

/**
 * Whether image sizing is driven by variable width: the Aspect Ratio box is
 * replaced by the optional fixed Image Height. Ticker keeps its own intrinsic
 * sizing (and the aspect-ratio control), so it is excluded here even though it
 * reads the same `variableWidth` attribute.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} True when the variable-width image sizing model applies.
 */
export function isVariableWidthImageSizing(attributes = {}) {
	if (!isVariableWidthActive(attributes)) {
		return false;
	}
	const { blockName, style } = resolveVariableWidthStyle(attributes);
	if (blockName === 'tiles' || style === 'grid' || style === 'ticker') {
		return false;
	}
	return !VARIABLE_WIDTH_EXCLUDED_STYLES.has(style);
}

/**
 * Whether the per-image aspect-ratio box must be replaced by natural
 * ('original') image sizing. A variable-width slide measures its rendered image
 * width; a boxed absolute image contributes no width, so the slide collapses to
 * 0 unless the aspect box is skipped. Ticker is included here even though
 * `isVariableWidthImageSizing()` excludes it — its aspect-ratio control is gated
 * through `isAspectRatioControlVisible()` instead.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} True when the aspect box must be forced to 'original'.
 */
export function needsOriginalAspectForVariableWidth(attributes = {}) {
	if (!isVariableWidthActive(attributes)) {
		return false;
	}
	const { blockName, style } = resolveVariableWidthStyle(attributes);
	if (blockName === 'tiles' || style === 'grid') {
		return false;
	}
	return !VARIABLE_WIDTH_EXCLUDED_STYLES.has(style);
}

/**
 * Whether the Image Aspect Ratio control should be shown.
 *
 * Scoped exception to the always-editable guideline: hide when aspect is
 * structurally inapplicable — Tiles bento/bin-pack (`tileLayout` ≠ `one`),
 * or Variable Width that forces outer aspect to `original`.
 * Slider keeps a stage-level Aspect Ratio control (not a per-item box).
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} True when the control is applicable.
 */
export function isAspectRatioControlVisible(attributes = {}) {
	const blockName = String(attributes.blockName || 'carousel').replace('wp-carousel-pro/', '');
	if (blockName === 'tiles') {
		const tileLayout = attributes.layoutOptions?.tileLayout || 'one';
		if (tileLayout !== 'one') {
			return false;
		}
	}
	if (needsOriginalAspectForVariableWidth(attributes)) {
		return false;
	}
	return true;
}

/**
 * Whether a fixed variable-width image height is set for any device.
 *
 * @param {Object} imageOptions Image panel options slice.
 * @return {boolean} True when at least one device has a positive height.
 */
export function hasVariableWidthImageHeight(imageOptions = {}) {
	const deviceValues = imageOptions.variableWidthImageHeight?.device || {};
	return ['Desktop', 'Tablet', 'Mobile'].some((device) => {
		const parsed = parseFloat(deviceValues[device]);
		return Number.isFinite(parsed) && parsed > 0;
	});
}

/**
 * Active height sizing mode for variable-width image height controls.
 *
 * @param {Object} imageOptions Image panel options slice.
 * @return {'height'|'max-height'} Current mode (defaults to height).
 */
export function getVariableWidthImageHeightMode(imageOptions = {}) {
	return imageOptions.variableWidthImageHeightMode === 'max-height' ? 'max-height' : 'height';
}

/**
 * Whether Swiper variable-width image height should be applied only from dynamic
 * CSS (`--wpcp-vw-image-height` / `--wpcp-vw-image-max-height`).
 *
 * @param {Object} attributes   Block attributes.
 * @param {Object} imageOptions Image panel options slice.
 * @return {boolean} True when inline image sizing should be deferred to CSS vars.
 */
export function shouldDeferVariableWidthSwiperImageSizing(attributes = {}, imageOptions = {}) {
	if (!hasVariableWidthImageHeight(imageOptions)) {
		return false;
	}
	return isVariableWidthImageSizing(attributes);
}

/**
 * Whether ticker/marquee variable-width image height should be applied only
 * from dynamic CSS (`--wpcp-vw-image-height` / `--wpcp-vw-image-max-height`).
 * The default inline `height: auto` / `maxWidth: 100%` would otherwise shadow
 * those rules in the editor preview.
 *
 * @param {Object} attributes   Block attributes.
 * @param {Object} imageOptions Image panel options slice.
 * @return {boolean} True when inline image sizing should be deferred to CSS vars.
 */
export function shouldDeferVariableWidthTickerImageSizing(attributes = {}, imageOptions = {}) {
	if (!hasVariableWidthImageHeight(imageOptions)) {
		return false;
	}
	if (!isVariableWidthActive(attributes)) {
		return false;
	}
	const { style } = resolveVariableWidthStyle(attributes);
	return 'ticker' === style;
}
