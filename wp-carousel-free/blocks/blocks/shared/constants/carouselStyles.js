/**
 * Which blocks let an author choose a carousel style, and which styles.
 *
 * Every other block pins its own style, so `carouselStyleFallback` in
 * `freeValues.js` is the whole answer for them. Both the inspector picker and
 * the block transform read this, because a style is only safe to carry across a
 * transform if the target's inspector could have offered it.
 *
 * Keep this module free of @wordpress/* imports — Node CI scripts load it
 * without a WordPress runtime, the same constraint as `allowedSources.js`.
 */

import { CAROUSEL_STYLES, carouselStyleFallback } from './freeValues';

/** The blocks whose inspector draws the Select Carousel Style picker. */
export const STYLE_PICKER_SLUGS = ['carousel'];

/**
 * The styles that picker actually offers.
 *
 * `CAROUSEL_STYLES` is the union of every style Free renders, so it also holds
 * the ones owned by a block that pins its own — Tiles' `grid` and the
 * Thumbnails Slider's `thumbnails`. Subtracting those fallbacks leaves the
 * picker's own cards, which keeps this in step with `freeValues.js` rather than
 * restating it. The four Pro cards are `onlyPro` and are not in the union.
 */
const PINNED_STYLES = ['tiles', 'thumbnails-slider'].map(carouselStyleFallback);

export const SELECTABLE_STYLES = CAROUSEL_STYLES.filter((style) => !PINNED_STYLES.includes(style));

/**
 * @param {string} blockName Block slug or full block name.
 * @return {boolean} True when the block draws the style picker.
 */
export function isCarouselStylePickerBlock(blockName) {
	return STYLE_PICKER_SLUGS.includes(String(blockName || '').replace('wp-carousel-pro/', ''));
}

/**
 * @param {string} blockName Block slug or full block name.
 * @param {*}      style     Candidate carousel style.
 * @return {boolean} True when that block's picker could have produced the style.
 */
export function isSelectableCarouselStyle(blockName, style) {
	return isCarouselStylePickerBlock(blockName) && SELECTABLE_STYLES.includes(style);
}
