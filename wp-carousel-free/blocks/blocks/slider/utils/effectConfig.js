import { EffectFlip, EffectCoverflow, EffectCube } from 'swiper/modules';
// No CSS side-effect imports here: this module rides the editor bundle and the
// effect CSS is loaded by the block's own stylesheet.
import { EFFECT_OPTIONS, getEffectOptions, isSingleSlideEffect } from './effectOptions';

/**
 * Editor-side Swiper effect configuration for the slider block.
 */

/** Swiper module classes keyed by slider layout key. */
const MODULES_BY_LAYOUT = {
	slide: [],
	flip: [EffectFlip],
	coverflow: [EffectCoverflow],
	cube: [EffectCube],
};

/** Back-compat alias — parameters now live in effectOptions.js. */
export const EFFECT_CONFIG = EFFECT_OPTIONS;

/**
 * Get effect configuration by effect type.
 *
 * @param {string} effectType         - The effect type key (kebab-case)
 * @param {Object} [layoutOptions={}] - Slider layout options branch
 * @return {Object} Effect configuration object
 */
export const getEffectConfig = (effectType, layoutOptions = {}) =>
	getEffectOptions(effectType, layoutOptions);

/**
 * Get Swiper modules required for a slider layout.
 *
 * @param {string} effectType - Slider layout key (kebab-case)
 * @return {Array} Array of Swiper module classes
 */
export const getEffectModules = (effectType) => {
	const layoutModules = MODULES_BY_LAYOUT[effectType];
	if (layoutModules) {
		return layoutModules;
	}
	return MODULES_BY_LAYOUT[getEffectOptions(effectType).effect] || [];
};

export { isSingleSlideEffect };

/**
 * Get all available effects as options array.
 *
 * @return {Array} Array of effect option objects
 */
export const getAvailableEffects = () =>
	Object.keys(EFFECT_OPTIONS).map((key) => ({
		value: key,
		...EFFECT_OPTIONS[key],
	}));
