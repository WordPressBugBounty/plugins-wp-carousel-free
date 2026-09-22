/**
 * Carousel block bootstrap — per-block init dispatch and lifecycle wiring.
 */

import { parseConfig, isTilesLayout } from './config';
import { initSwiperCarousel } from './swiperCarousel';
import { initThumbnailsSliderCarousel } from './thumbnailsSlider';
import { initBlockLightbox } from './lightbox';

function initBlock(blockRoot) {
	if (blockRoot.dataset.wpcpInit) {
		return;
	}

	const cfg = parseConfig(blockRoot);

	initBlockLightbox(blockRoot);

	if (isTilesLayout(cfg)) {
		blockRoot.dataset.wpcpInit = 'tiles';
		return;
	}

	const finishInit = (initLayout, flag) => {
		initLayout();
		blockRoot.dataset.wpcpInit = blockRoot.dataset.wpcpSwiperInit ? flag : 'idle';
	};

	if ('thumbnails' === (cfg.style || 'standard')) {
		finishInit(() => initThumbnailsSliderCarousel(blockRoot, cfg), 'swiper');
		return;
	}

	finishInit(() => initSwiperCarousel(blockRoot, cfg), 'swiper');
}

function initAll() {
	document.querySelectorAll('.wpcp-block[data-wpcp]').forEach(function (el) {
		try {
			initBlock(el);
		} catch (error) {
			// One broken block must not kill initialization for every block
			// after it on the page.
			el.dataset.wpcpInit = 'error';
			// eslint-disable-next-line no-console
			console.error('[wp-carousel-free] block init failed', el, error);
		}
	});
}

/**
 * Initialize every carousel block on the page.
 *
 * Exported for page-builder integrations that re-render content after boot;
 * `initBlock` guards on `dataset.wpcpInit`, so re-running only touches roots
 * that are not initialised yet.
 */
export function initAllCarousels() {
	initAll();
}

/**
 * Wire the carousel runtime.
 */
export function bootCarouselRuntime() {
	if ('loading' === document.readyState) {
		document.addEventListener('DOMContentLoaded', initAll);
	} else {
		initAll();
	}
}
