/**
 * Slider block dynamic-CSS generators.
 *
 * Mirrors the slider branch of CarouselDynamicCss.php (the SliderCss trait). Split
 * out of the carouselDynamicCss monolith; the editor composes these through the
 * default `dynamicCss` export exactly as before. Keep rule-for-rule parity with the
 * PHP side — the tests/css-parity harness gates it.
 */

import { SOURCE_TYPES } from './constants';
import { getSocialRangerDimension } from './cssRuleHelpers';
import { aspectRatioToCssValue } from '../carousel-render/gapImageUtils';

/** @typedef {'Desktop'|'Tablet'|'Mobile'} DeviceType */

/**
 * Whether the block is the slider (gates the slider height + media-fill rules).
 *
 * @param {Object} attributes - Block attributes.
 * @return {boolean} True when blockName matches.
 */
const isSliderBlock = (attributes = {}) =>
	String(attributes?.blockName || '').toLowerCase() === 'slider';

/**
 * Fallback slider height (matches SliderSchema). Saved `layoutOptions` shallow-
 * overrides the schema default, so `sliderHeight` can be absent on older sliders
 * or any block that never touched the Height control — fall back to this.
 */
const SLIDER_HEIGHT_DEFAULT = {
	device: { Desktop: 600, Tablet: 450, Mobile: 300 },
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
};

/**
 * Aspect modes where the fixed `sliderHeight` drives the stage (the Height
 * control works). Original keeps each slide's intrinsic height; Custom keeps
 * Height too (the custom W/H box is hidden for the slider, so a Custom stage
 * would otherwise fall back to a 4:3 box with no Height). A preset ratio
 * (16:9, …) sizes the stage via aspect-ratio instead and wins over Height.
 *
 * @param {string} aspect Aspect ratio mode.
 * @return {boolean} True when Height drives the stage for this aspect mode.
 */
const aspectDrivesStageHeight = (aspect) => aspect === 'original' || aspect === 'custom';

/**
 * Resolves the image options that drive the slider stage aspect — nested under
 * `audioOptions.imageOptions` for the audio source (the audio card's artwork),
 * top-level `imageOptions` otherwise. Mirrors the PHP `sliderImageOptions()`.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Image options object.
 */
const sliderImageOptions = (attributes = {}) => {
	if ((attributes?.sourceType || SOURCE_TYPES.IMAGE) === SOURCE_TYPES.AUDIO) {
		return attributes?.audioOptions?.imageOptions || attributes?.imageOptions || {};
	}
	return attributes?.imageOptions || {};
};

/**
 * Static slider rules: make each slide's media + image fill the slide and crop
 * to it, so the stage size (fixed Height for Original/Custom, aspect-ratio for a
 * preset) crops the image rather than letting its natural height set the size.
 *
 * @param {Object} selectors  - createSelectors output.
 * @param {Object} attributes - Block attributes.
 * @return {Array} Rule objects.
 */
export const generateSliderBaseStyles = (selectors, attributes = {}) => {
	if (!isSliderBlock(attributes)) {
		return [];
	}
	return [
		{ class: selectors.sliderInner, styles: { height: '100%' } },
		{ class: selectors.sliderMedia, styles: { height: '100%' } },
		{ class: selectors.sliderImg, styles: { height: '100%', width: '100%', objectFit: 'cover' } },
	];
};

/**
 * Stage aspect ratio from the Image panel (Stage Aspect Ratio control).
 * A preset ratio (16:9, …) sizes `.wpcp-swiper` via `aspect-ratio` and wins
 * over the fixed `sliderHeight`; Original and Custom keep the fixed Height.
 *
 * @param {Object} selectors  - createSelectors output.
 * @param {Object} attributes - Block attributes.
 * @return {Array} Rule objects.
 */
export const generateSliderAspectRatioStyles = (selectors, attributes = {}) => {
	if (!isSliderBlock(attributes)) {
		return [];
	}
	const imageOptions = sliderImageOptions(attributes);
	const aspect = imageOptions?.aspectRatio ?? 'original';
	// Height-driven modes (Original / Custom) skip the aspect box; only preset
	// ratios (16:9, …) size `.wpcp-swiper` and win over fixed sliderHeight.
	if (aspectDrivesStageHeight(aspect)) {
		return [];
	}
	const cssAspect = aspectRatioToCssValue(aspect, imageOptions);
	if (!cssAspect) {
		return [];
	}
	// The aspect-sized stage has a definite height (ratio × width). Thread it
	// down through the flex wrapper + slide so the media/img fill emitted by
	// generateSliderBaseStyles resolves — otherwise the image's natural height
	// flows back up the flex chain and the preset never crops.
	return [
		{
			class: selectors.sliderStage,
			styles: { aspectRatio: cssAspect, height: 'auto' },
		},
		{ class: selectors.sliderWrapper, styles: { height: '100%' } },
		{ class: selectors.sliderSlide, styles: { height: '100%' } },
	];
};

/**
 * Responsive slider height: pins the stage and each slide to
 * `layoutOptions.sliderHeight` for the active breakpoint.
 *
 * A `%` unit cannot resolve as a plain CSS height — the stage's ancestors
 * (`.wpcp-block-inner`, `.wpcp-carousel-stage`) carry no explicit height, and
 * per spec a percentage height against an indefinite containing block
 * computes to `auto` and is silently dropped. `%` is instead read as a
 * fraction of the stage's own width (the classic slider convention, and the
 * one dimension that's always definite here) and applied via `aspectRatio`,
 * the same mechanism `generateSliderAspectRatioStyles` uses for a preset ratio.
 *
 * @param {Object}     selectors  - createSelectors output.
 * @param {Object}     attributes - Block attributes.
 * @param {DeviceType} device     - Active breakpoint.
 * @return {Array} Rule objects.
 */
export const generateSliderResponsiveStyles = (selectors, attributes = {}, device) => {
	if (!isSliderBlock(attributes)) {
		return [];
	}
	const imageOptions = sliderImageOptions(attributes);
	const aspect = imageOptions?.aspectRatio ?? 'original';
	// Preset stage aspect wins over fixed sliderHeight (all layouts); Original
	// and Custom keep the fixed Height.
	if (!aspectDrivesStageHeight(aspect)) {
		return [];
	}
	const layoutOptions = attributes.layoutOptions || {};
	const heightDim =
		getSocialRangerDimension(layoutOptions.sliderHeight, device) ||
		getSocialRangerDimension(SLIDER_HEIGHT_DEFAULT, device);
	if (!heightDim) {
		return [];
	}
	if (heightDim.unit === '%') {
		if (heightDim.num <= 0) {
			return [];
		}
		return [
			{
				class: selectors.sliderStage,
				styles: { aspectRatio: `100 / ${heightDim.num}`, height: 'auto' },
			},
			{ class: selectors.sliderWrapper, styles: { height: '100%' } },
			{ class: selectors.sliderSlide, styles: { height: '100%' } },
		];
	}
	const cssHeight = `${heightDim.num}${heightDim.unit}`;
	return [
		{ class: selectors.sliderStage, styles: { height: cssHeight } },
		{ class: selectors.sliderSlide, styles: { height: cssHeight } },
	];
};
