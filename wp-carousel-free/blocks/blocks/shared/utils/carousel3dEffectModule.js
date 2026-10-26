/**
 * The 3D Carousel's Swiper effect, built once and used by both contexts.
 *
 * The editor preview registers it through `swiper/react`
 * (`carousel-render/layouts/carousel3d/effectCarousel3d.js`) and the frontend
 * through `Swiper.use()` (`frontend/carousel/carousel3dEffect.js`), so the
 * preview cannot drift from the frontend.
 *
 * The effect takes the slides out of Swiper's flow (`virtualTranslate`) and
 * positions every one of them itself on the stage's center.
 */

import { effectVirtualTransitionEnd } from 'swiper/effect-utils';

import { CAROUSEL_3D_FREE_STYLE, CAROUSEL_3D_STAGING } from '../constants/carousel3d';
import {
	CAROUSEL_3D_STAGE_ROOM_RATIO,
	carousel3dPerspectivePx,
	carousel3dSlideState,
	carousel3dTransform,
} from './carousel3dGeometry';

/** Params the effect reads; Side Items and the slide count are replaced per device before init. */
export const CAROUSEL_3D_EFFECT_DEFAULTS = {
	style: CAROUSEL_3D_FREE_STYLE,
	sideItems: 'all',
	...CAROUSEL_3D_STAGING,
	slideCount: 0,
};

/** The `effect` value that turns this module on. */
export const CAROUSEL_3D_EFFECT_ID = 'carousel3d';

/** The settle runs outward from the centered card, a step later each time, up to a few steps. */
export const CAROUSEL_3D_STAGGER_MS = 30;
export const CAROUSEL_3D_STAGGER_STEPS = 4;

/**
 * Writes the stage's perspective and room for the stylesheet to pick up.
 *
 * @param {Object} swiper    Swiper instance.
 * @param {Object} params    Resolved effect params.
 * @param {number} slideSize Measured card width, 0 before one is laid out.
 */
function applyStageProperties(swiper, params, slideSize) {
	const rootEl = swiper.el;

	if (!rootEl || !rootEl.style) {
		return;
	}

	const perspective = carousel3dPerspectivePx(params.sidesPerspective, slideSize);

	rootEl.style.setProperty(
		'--wpcp-carousel-3d-perspective',
		0 < perspective ? `${Math.round(perspective)}px` : 'none'
	);

	// Where the wash stops on a card whose caption sits below its image.
	const mediaHeight = measureMediaHeight(swiper);
	if (0 < mediaHeight) {
		rootEl.style.setProperty('--wpcp-carousel-3d-media-height', `${mediaHeight}px`);
	} else {
		rootEl.style.removeProperty('--wpcp-carousel-3d-media-height');
	}

	const cardHeight = measureCardHeight(swiper);
	if (0 < cardHeight) {
		rootEl.style.setProperty(
			'--wpcp-carousel-3d-stage-room',
			`${Math.round(cardHeight * CAROUSEL_3D_STAGE_ROOM_RATIO)}px`
		);
	} else {
		rootEl.style.removeProperty('--wpcp-carousel-3d-stage-room');
	}
}

/**
 * The height of a staged card; the cards stretch to the tallest, so any one answers.
 *
 * @param {Object} swiper Swiper instance.
 * @return {number} Height in px, 0 before anything is laid out.
 */
function measureCardHeight(swiper) {
	const slideEl = (swiper.slides || [])[0];

	if (!slideEl) {
		return 0;
	}

	const cardEl = slideEl.querySelector('.wpcp-item-inner');

	return (cardEl || slideEl).offsetHeight || 0;
}

/**
 * The height of the image on a staged card.
 *
 * @param {Object} swiper Swiper instance.
 * @return {number} Height in px, 0 before anything is laid out.
 */
function measureMediaHeight(swiper) {
	const slideEl = (swiper.slides || [])[0];
	const mediaEl = slideEl ? slideEl.querySelector('.wpcp-item-media') : null;

	return mediaEl ? mediaEl.offsetHeight || 0 : 0;
}

/**
 * Places every slide for the current translate.
 *
 * @param {Object} swiper Swiper instance.
 */
export function stageCarousel3dSlides(swiper) {
	if (CAROUSEL_3D_EFFECT_ID !== swiper.params.effect) {
		return;
	}

	const params = swiper.params.carousel3dEffect || CAROUSEL_3D_EFFECT_DEFAULTS;
	const slides = swiper.slides || [];
	const sizesGrid = swiper.slidesSizesGrid || [];
	const slideCount = 0 < Number(params.slideCount) ? Number(params.slideCount) : slides.length;
	const stageSlideSize = sizesGrid[0] || (slides[0] && slides[0].offsetWidth) || 0;

	applyStageProperties(swiper, params, stageSlideSize);

	for (let i = 0; i < slides.length; i += 1) {
		const slideEl = slides[i];
		const slideSize = sizesGrid[i] || slideEl.swiperSlideSize || slideEl.offsetWidth || 0;

		if (!slideSize) {
			continue;
		}

		// Cancel each slide's own row offset so every slide starts on the stage's center.
		const centerOffset = -slideEl.swiperSlideOffset + (swiper.width - slideSize) / 2;
		const state = carousel3dSlideState({
			params,
			progress: slideEl.progress,
			slideSize,
			slideCount,
			loop: !!swiper.params.loop,
		});
		const transform = `translate3d(${centerOffset}px, 0, 0) ${carousel3dTransform(state)}`;
		const zIndex = String(state.zIndex);
		const opacity = String(state.opacity);

		if (slideEl.style.transform !== transform) {
			slideEl.style.transform = transform;
		}
		if (slideEl.style.transformOrigin !== state.origin) {
			slideEl.style.transformOrigin = state.origin;
		}
		if (slideEl.style.zIndex !== zIndex) {
			slideEl.style.zIndex = zIndex;
		}
		if (slideEl.style.opacity !== opacity) {
			slideEl.style.opacity = opacity;
		}
		// A slide faded out by Side Items must not swallow clicks; the card opts back in with its own `auto`, so it is switched off too.
		const pointerEvents = 0 < state.opacity ? '' : 'none';
		slideEl.style.pointerEvents = pointerEvents;
		const cardEl = slideEl.querySelector(':scope > .wpcp-item-inner');
		if (cardEl && cardEl.style.pointerEvents !== pointerEvents) {
			cardEl.style.pointerEvents = pointerEvents;
		}
		slideEl.style.setProperty('--wpcp-carousel-3d-wash-progress', String(state.wash ?? 0));
		slideEl.style.setProperty('--wpcp-carousel-3d-wash-flip', 0 > state.washSide ? '1' : '-1');
	}
}

/**
 * Builds the Swiper module.
 *
 * @return {Function} A Swiper module function.
 */
export function createCarousel3dEffectModule() {
	return function EffectCarousel3d({ swiper, extendParams, on }) {
		extendParams({ carousel3dEffect: { ...CAROUSEL_3D_EFFECT_DEFAULTS } });

		on('beforeInit', () => {
			if (CAROUSEL_3D_EFFECT_ID !== swiper.params.effect) {
				return;
			}
			swiper.classNames.push(`${swiper.params.containerModifierClass}carousel-3d`);
			swiper.classNames.push(`${swiper.params.containerModifierClass}3d`);
			// The effect places every slide itself; a centered active slide gives the flanks opposite signs.
			const overwriteParams = {
				watchSlidesProgress: true,
				virtualTranslate: true,
				centeredSlides: true,
			};
			Object.assign(swiper.params, overwriteParams);
			Object.assign(swiper.originalParams, overwriteParams);
		});

		on('setTranslate', () => stageCarousel3dSlides(swiper));
		on('resize', () => stageCarousel3dSlides(swiper));

		on('setTransition', (_swiper, duration) => {
			if (CAROUSEL_3D_EFFECT_ID !== swiper.params.effect) {
				return;
			}
			// A drag carries duration 0, where a stagger would only lag the finger.
			const staggered = 0 < duration;

			swiper.slides.forEach((slideEl) => {
				slideEl.style.transitionDuration = `${duration}ms`;
				slideEl.style.transitionDelay = staggered
					? `${Math.min(Math.abs(slideEl.progress), CAROUSEL_3D_STAGGER_STEPS) * CAROUSEL_3D_STAGGER_MS}ms`
					: '';
			});

			// `virtualTranslate` never transitions the wrapper, so hand Swiper the slides
			// to wait on — otherwise it stays `animating` and a looping `slideNext()` stalls.
			effectVirtualTransitionEnd({
				swiper,
				duration,
				transformElements: swiper.slides,
				allSlides: true,
			});
		});
	};
}
