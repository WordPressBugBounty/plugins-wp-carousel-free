/**
 * Standard Swiper carousel init for the carousel and slider blocks.
 */

import { getEffectOptions } from '../../slider/utils/effectOptions';
import { isTilesLayout, isVariableWidthEffective } from './config';
import { bindWpcpPaginationLayoutCleanup } from './paginationCleanup';
import { getSwiperLoopMinimumSlides } from '../../shared/utils/swiperLoop';
import { bindCubeFaceClicks } from './cubeFaceClicks';
import { SWIPER_SINGLE_SLIDE_EFFECTS } from '../../shared/carousel-render/constants';

/**
 * @param {HTMLElement} blockRoot Block root element.
 * @param {Object}      cfg       Parsed `data-wpcp` JSON.
 * @return {boolean} True when Swiper initialized (or not applicable).
 */
export function initSwiperCarousel(blockRoot, cfg) {
	/* Tiles / grid: static layout, no Swiper — do not touch Swiper or query carousel DOM. */
	if (isTilesLayout(cfg)) {
		return true;
	}

	const style = cfg.style || 'standard';
	if ('thumbnails' === style) {
		return true;
	}

	const SwiperCtor = window.Swiper;
	if (typeof SwiperCtor !== 'function') {
		return false;
	}
	const swiperEl = blockRoot.querySelector('.wpcp-carousel-container.swiper');
	if (!swiperEl) {
		return false;
	}

	// The Slider block's transition comes from its Slider Style (`cfg.style`);
	// every other block reads the Slide Effect option.
	const isSlider = 'slider' === cfg.slug;
	const sliderEffect = isSlider ? getEffectOptions(cfg.style || 'slide') : null;
	let effectId = isSlider ? sliderEffect.effect : cfg.effect || 'slide';
	if (style === 'center') {
		// The Center style only supports the default 'slide' transition; force
		// any saved effect to 'slide'. Mirrors the editor preview resolution.
		effectId = 'slide';
	}
	const col = cfg.columns || {};
	const gap = cfg.gap || {};
	const scroll = cfg.slidesToScroll || {};
	const spvPreset = cfg.swiperSlidesPerView || {};

	const slidesPerViewDesktop = Number(spvPreset.desktop ?? col.desktop ?? 3);
	const slidesPerViewTablet = Number(spvPreset.tablet ?? col.tablet ?? 2);
	const slidesPerViewMobile = Number(spvPreset.mobile ?? col.mobile ?? 1);

	const gapDesktop = Number(gap.desktop ?? 20);
	const gapTablet = Number(gap.tablet ?? 20);
	const gapMobile = Number(gap.mobile ?? 10);
	const effectGapDesktop = gapDesktop;
	const effectGapTablet = gapTablet;
	const effectGapMobile = gapMobile;

	const groupD = Number(scroll.desktop ?? 1);
	const groupT = Number(scroll.tablet ?? groupD);
	const groupM = Number(scroll.mobile ?? groupD);

	// Coverflow shows neighbouring slides; every other slider style is single-slide.
	const sliderAutoSpv = isSlider && sliderEffect.slidesPerView === 'auto';
	const stackSingleSpv = (isSlider && !sliderAutoSpv) || SWIPER_SINGLE_SLIDE_EFFECTS.has(effectId);
	const variableWidth = isVariableWidthEffective(cfg) && !stackSingleSpv;

	const loopBothDirections = cfg.centeredSlides === true || cfg.style === 'center';
	const loopMinimumItems = variableWidth
		? 2
		: Math.max(
				...[
					[stackSingleSpv ? 1 : slidesPerViewDesktop, stackSingleSpv ? 1 : groupD],
					[stackSingleSpv ? 1 : slidesPerViewTablet, stackSingleSpv ? 1 : groupT],
					[stackSingleSpv ? 1 : slidesPerViewMobile, stackSingleSpv ? 1 : groupM],
				].map(([slidesPerView, slidesPerGroup]) =>
					getSwiperLoopMinimumSlides({
						slidesPerView,
						slidesPerGroup,
						bothDirections: loopBothDirections,
					})
				)
		  );
	const loopRequiredItems = loopMinimumItems;
	const loop = !!cfg.loop && Number(cfg.totalItems || 0) >= loopRequiredItems;

	const slideDir = cfg.direction === 'rtl' ? 'rtl' : 'ltr';

	const base = {
		loop,
		speed: Number(cfg.speed || 500),
		effect: effectId,
		autoHeight: !!cfg.adaptiveHeight,
		direction: 'horizontal',
		watchOverflow: true,
		grabCursor: true,
		// Prevent Swiper from intercepting touch/pointer events that originate inside
		// audio player controls. Without this, Swiper calls preventDefault() on
		// touchstart before the audio guard's stopPropagation() can act, which
		// swallows the subsequent click event and makes controls unresponsive on
		// non-first slides. `closest()` semantics mean all child elements match.
		noSwiping: true,
		noSwipingSelector: '.wpcp-audio-card__player',
		// The frontend swiper-bundle auto-registers the A11y module, whose
		// `scrollOnFocus` (on by default) slides the carousel whenever focus
		// lands inside a non-active slide. Clicking native <audio>/<video>
		// controls focuses them, so the click slid the carousel instead of
		// toggling playback. The editor never registers A11y — mirror it.
		a11y: { scrollOnFocus: false },
	};
	// Slider Style: the effect-specific Swiper options, mirroring the editor
	// preview (`effectOptions.js`).
	if (isSlider) {
		if (sliderEffect.cubeEffect) {
			base.cubeEffect = sliderEffect.cubeEffect;
		}
		if (sliderEffect.coverflowEffect) {
			base.coverflowEffect = sliderEffect.coverflowEffect;
		}
		if (sliderEffect.centeredSlides) {
			base.centeredSlides = sliderEffect.centeredSlides;
		}
	}
	if (effectId === 'cube') {
		// Cube rotates each face by a multiple of 90deg, and a face that is edge-on
		// in its own parent's coordinate space is unreachable by Chromium's
		// hit-testing. Swiper's default drag target is the wrapper, which lives
		// inside that broken subtree, so after the first swipe no pointer press
		// reached Swiper again. The container sits outside the rotation.
		base.touchEventsTarget = 'container';
	}
	if (cfg.autoplay) {
		base.autoplay = {
			delay: Number(cfg.autoplayDelay || 3000),
			disableOnInteraction: false,
			pauseOnMouseEnter: !!cfg.pauseOnHover,
			// Matches editor `autoplayParams` in StandardCenterLayouts.
			reverseDirection: slideDir === 'rtl' ? true : false,
		};
	} else {
		base.autoplay = false;
	}

	if (cfg.navigation) {
		const prev = blockRoot.querySelector('.wpcp-nav-prev');
		const next = blockRoot.querySelector('.wpcp-nav-next');
		if (prev && next) {
			base.navigation = { prevEl: prev, nextEl: next };
		}
	}

	let wpcpPaginationRoot = null;
	if (cfg.pagination) {
		const pag = blockRoot.querySelector('.wpcp-pagination');
		if (pag) {
			wpcpPaginationRoot = pag;
			const po =
				cfg.paginationOptions && typeof cfg.paginationOptions === 'object' ? cfg.paginationOptions : {};
			const pstyle = po.paginationStyle || 'dots';
			base.pagination = { el: pag, clickable: true, type: 'bullets' };
			switch (pstyle) {
				case 'stepper':
					base.pagination.bulletClass = 'swiper-pagination-bullet wpcp-pagination-bullet--stepper';
					break;
				case 'dynamic':
					base.pagination.dynamicBullets = true;
					base.pagination.dynamicMainBullets = 1;
					break;
				case 'dots':
				default:
					base.pagination.type = 'bullets';
					break;
			}
		}
	}

	if (cfg.keyboard) {
		base.keyboard = { enabled: true };
	}

	if (cfg.mousewheel) {
		base.mousewheel = true;
	}

	if (cfg.freeMode) {
		base.freeMode = true;
	}

	if (!variableWidth) {
		base.centeredSlides = !!cfg.centeredSlides;
	}

	// Root `dir` stays LTR. Slider RTL does not use `dir="rtl"`;
	// RTL autoplay uses `reverseDirection` only (see `base.autoplay` above).
	const htmlDir = 'ltr';
	swiperEl.setAttribute('dir', htmlDir);

	if (variableWidth) {
		base.breakpoints = {
			0: {
				slidesPerView: 'auto',
				spaceBetween: effectGapMobile,
				slidesPerGroup: 1,
			},
			601: {
				slidesPerView: 'auto',
				spaceBetween: effectGapTablet,
				slidesPerGroup: 1,
			},
			1025: {
				slidesPerView: 'auto',
				spaceBetween: effectGapDesktop,
				slidesPerGroup: 1,
			},
		};
	} else {
		base.breakpoints = {
			0: {
				slidesPerView: slidesPerViewMobile,
				spaceBetween: effectGapMobile,
				slidesPerGroup: groupM,
			},
			601: {
				slidesPerView: slidesPerViewTablet,
				spaceBetween: effectGapTablet,
				slidesPerGroup: groupT,
			},
			1025: {
				slidesPerView: slidesPerViewDesktop,
				spaceBetween: effectGapDesktop,
				slidesPerGroup: groupD,
			},
		};
	}

	if (stackSingleSpv && base.breakpoints) {
		Object.keys(base.breakpoints).forEach(function (bpKey) {
			const bp = base.breakpoints[bpKey];
			if (bp && typeof bp === 'object') {
				bp.slidesPerView = 1;
				bp.slidesPerGroup = 1;
			}
		});
	}

	blockRoot.dataset.wpcpSwiperInit = '1';
	// eslint-disable-next-line no-new
	const swiperInstance = new SwiperCtor(swiperEl, base);

	if ('cube' === effectId) {
		bindCubeFaceClicks(swiperEl);
	}

	if (swiperInstance && typeof swiperInstance.changeLanguageDirection === 'function') {
		swiperInstance.changeLanguageDirection(htmlDir === 'rtl' ? 'rtl' : 'ltr');
	}
	bindWpcpPaginationLayoutCleanup(swiperInstance, wpcpPaginationRoot, {
		forceHorizontalClass: false,
	});

	if (variableWidth && swiperInstance && typeof swiperInstance.update === 'function') {
		const imgs = swiperEl.querySelectorAll('.swiper-slide img.wpcp-item-img');
		let pending = 0;
		const bump = function () {
			window.requestAnimationFrame(function () {
				swiperInstance.update();
			});
		};
		if (!imgs.length) {
			bump();
		} else {
			imgs.forEach(function (img) {
				if (img.complete && img.naturalWidth !== 0) {
					return;
				}
				pending++;
				const done = function () {
					pending--;
					if (pending <= 0) {
						bump();
					}
				};
				img.addEventListener('load', done, { once: true });
				img.addEventListener('error', done, { once: true });
			});
			if (pending === 0) {
				bump();
			}
		}
	}

	return true;
}
