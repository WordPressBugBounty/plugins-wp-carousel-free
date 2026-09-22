/**
 * Slider effect parameters — the single source of truth shared by:
 *   - the editor (`effectConfig.js`, which attaches Swiper module classes), and
 *   - the frontend (`blocks/blocks/frontend.js`, which runs against the CDN
 *     `window.Swiper` bundle and therefore must NOT import `swiper/modules`).
 *
 * Keep this file import-free so the frontend bundle stays free of Swiper module
 * code. Keys are kebab-case and match the Slider Style picker values
 * (`SliderLayouts.jsx`).
 */

export const EFFECT_OPTIONS = {
	slide: { effect: 'slide', slidesPerView: 'auto' },
	flip: { effect: 'flip', slidesPerView: 1 },
	coverflow: {
		effect: 'coverflow',
		coverflowEffect: { rotate: 50, stretch: 0, depth: 100, modifier: 1, slideShadows: true },
		centeredSlides: true,
		slidesPerView: 'auto',
	},
	cube: {
		effect: 'cube',
		cubeEffect: { shadow: true, slideShadows: true },
		slidesPerView: 1,
	},
};

/**
 * Effect parameters for a slider layout, falling back to `slide`.
 *
 * @param {string} effectType Slider layout key (kebab-case).
 * @return {Object} Effect parameter object.
 */
export const getEffectOptions = (effectType) => EFFECT_OPTIONS[effectType] || EFFECT_OPTIONS.slide;

/**
 * Whether an effect must render a single slide (slidesPerView: 1).
 *
 * @param {string} effectType Slider layout key.
 * @return {boolean} True for single-slide effects.
 */
export const isSingleSlideEffect = (effectType) => getEffectOptions(effectType).slidesPerView === 1;
