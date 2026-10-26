/**
 * Frontend registration of the 3D Carousel effect, plus the per-device read of
 * its `data-wpcp` config.
 *
 * The module itself is built in `shared/utils/carousel3dEffectModule.js`, which
 * the editor preview registers too, so both contexts stage from one set of
 * numbers.
 */

import {
	CAROUSEL_3D_EFFECT_DEFAULTS,
	createCarousel3dEffectModule,
} from '../../shared/utils/carousel3dEffectModule';

let carousel3dEffectInstalled = false;

/**
 * The staging numbers for one device out of the block's frontend config.
 *
 * Mirrors `ConfigBuilder::build_carousel_3d_config()`.
 *
 * @param {Object} config `cfg.carousel3d` from `data-wpcp`.
 * @param {string} device `Desktop`, `Tablet` or `Mobile`.
 * @return {Object} Effect params.
 */
export function carousel3dEffectForDevice(config, device) {
	const source = config || {};
	const perDevice = source[String(device).toLowerCase()] || {};

	return {
		...CAROUSEL_3D_EFFECT_DEFAULTS,
		slideCount: Number(source.slideCount || 0),
		...perDevice,
	};
}

/**
 * Registers the effect on a Swiper constructor, once per page.
 *
 * @param {Function} SwiperCtor The global Swiper constructor.
 */
export function ensureCarousel3dEffect(SwiperCtor) {
	if (carousel3dEffectInstalled || !SwiperCtor || 'function' !== typeof SwiperCtor.use) {
		return;
	}

	SwiperCtor.use([createCarousel3dEffectModule()]);
	carousel3dEffectInstalled = true;
}
