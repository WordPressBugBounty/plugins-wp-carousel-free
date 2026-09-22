/**
 * Thumbnails-slider runtime — thumb strip + main stage Swiper wiring.
 */

/**
 * Thumbnails-slider runtime: build the thumb-strip Swiper first, then build
 * the main slide Swiper with `thumbs: { swiper: thumbsSwiper }` so Swiper's
 * Thumbs module syncs them. Active thumb is tracked via `slideChange` and
 * marked with `wpcp-thumb-active` so the dynamic CSS in
 * `style.scss:96` and `carouselDynamicCss.js:133` (which targets
 * `.wpcp-thumb.wpcp-thumb-active`) lights up the indicator visual.
 *
 * @param {HTMLElement} blockRoot `.wpcp-block`
 * @param {Object}      cfg       Parsed `data-wpcp`.
 */
export function initThumbnailsSliderCarousel(blockRoot, cfg) {
	if (!blockRoot || blockRoot.dataset.wpcpThumbnailsInit === '1') {
		return;
	}
	const SwiperCtor = window.Swiper;
	if (typeof SwiperCtor !== 'function') {
		return;
	}
	const stageEl = blockRoot.querySelector('.wpcp-thumbs-main.swiper');
	const stripEl = blockRoot.querySelector('.wpcp-thumbs-strip.swiper');
	if (!stageEl || !stripEl) {
		return;
	}
	const thumbsArea = blockRoot.querySelector('.wpcp-thumbs-area');

	const ts =
		cfg.thumbnailsSlider && typeof cfg.thumbnailsSlider === 'object' ? cfg.thumbnailsSlider : {};
	const thumbsPerView = ts.thumbsPerView || {};
	const thumbGap = ts.thumbGap || {};
	const slideDir = cfg.direction === 'rtl' ? 'rtl' : 'ltr';

	const thumbsLoop = !!cfg.loop && Number(cfg.totalItems || 0) > 1;

	const stripSwiper = new SwiperCtor(stripEl, {
		direction: 'horizontal',
		slidesPerView: Math.max(1, Number(thumbsPerView.mobile ?? 3)),
		spaceBetween: Number(thumbGap.mobile ?? thumbGap.desktop ?? 24),
		centeredSlides: false,
		watchSlidesProgress: true,
		slideToClickedSlide: true,
		freeMode: true,
		observer: true,
		observeParents: true,
		grabCursor: true,
		loop: thumbsLoop,
		breakpoints: {
			601: {
				slidesPerView: Math.max(1, Number(thumbsPerView.tablet ?? 4)),
				spaceBetween: Number(thumbGap.tablet ?? thumbGap.desktop ?? 24),
			},
			1025: {
				slidesPerView: Math.max(1, Number(thumbsPerView.desktop ?? 5)),
				spaceBetween: Number(thumbGap.desktop ?? 24),
			},
		},
	});

	const mainEffect = cfg.effect || 'slide';
	const mainOpts = {
		slidesPerView: 1,
		spaceBetween: 0,
		speed: Number(cfg.speed || 500),
		loop: !!cfg.loop && Number(cfg.totalItems || 0) > 1,
		effect: mainEffect,
		// Stage adapts to each image's natural rendered height so the dark stage
		// backdrop never shows below the active image (which happened with a fixed
		// aspect-ratio frame + `object-fit: contain`). Matches the editor preview
		// wiring in `ThumbnailsSliderLayout.jsx`.
		autoHeight: true,
		grabCursor: true,
		watchOverflow: true,
		thumbs: { swiper: stripSwiper },
	};
	if (mainEffect === 'fade') {
		mainOpts.fadeEffect = { crossFade: true };
	}
	if (cfg.autoplay) {
		mainOpts.autoplay = {
			delay: Number(cfg.autoplayDelay || 3000),
			disableOnInteraction: false,
			pauseOnMouseEnter: !!cfg.pauseOnHover,
			reverseDirection: slideDir === 'rtl',
		};
	}
	if (cfg.keyboard) {
		mainOpts.keyboard = { enabled: true };
	}
	if (cfg.mousewheel) {
		mainOpts.mousewheel = true;
	}
	if (cfg.navigation) {
		const prev = blockRoot.querySelector('.wpcp-nav-prev');
		const next = blockRoot.querySelector('.wpcp-nav-next');
		if (prev && next) {
			mainOpts.navigation = { prevEl: prev, nextEl: next };
		}
	}

	// Reveal the strip — was hidden via `wpcp-thumbs-area--no-js` to prevent
	// pre-init layout shift while the two Swipers initialize.
	if (thumbsArea) {
		thumbsArea.classList.remove('wpcp-thumbs-area--no-js');
	}

	const mainSwiper = new SwiperCtor(stageEl, mainOpts);

	const syncActiveThumb = function () {
		const realIndex =
			typeof mainSwiper.realIndex === 'number' ? mainSwiper.realIndex : mainSwiper.activeIndex;
		const slides = stripEl.querySelectorAll('.swiper-slide.wpcp-thumb');
		slides.forEach(function (slide, idx) {
			if (idx === realIndex) {
				slide.classList.add('wpcp-thumb-active');
			} else {
				slide.classList.remove('wpcp-thumb-active');
			}
		});
	};
	if (typeof mainSwiper.on === 'function') {
		mainSwiper.on('slideChange', syncActiveThumb);
		mainSwiper.on('init', syncActiveThumb);
	}
	syncActiveThumb();

	blockRoot.dataset.wpcpSwiperInit = '1';
	blockRoot.dataset.wpcpThumbnailsInit = '1';

	if (mainSwiper && typeof mainSwiper.changeLanguageDirection === 'function') {
		mainSwiper.changeLanguageDirection('ltr');
	}
}
