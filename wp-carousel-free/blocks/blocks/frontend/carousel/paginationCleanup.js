/**
 * Normalize Swiper's runtime pagination axis class when a layout wants horizontal dots.
 *
 * @param {HTMLElement|null} pag                  Pagination container.
 * @param {boolean}          forceHorizontalClass Force Swiper's runtime axis class to horizontal.
 * @return {void}
 */
export function normalizeWpcpPaginationAxisClass(pag, forceHorizontalClass) {
	if (!pag || true !== forceHorizontalClass) {
		return;
	}
	pag.classList.remove('swiper-pagination-vertical');
	pag.classList.add('swiper-pagination-horizontal');
}

/**
 * Strip Swiper-applied inline pagination styles; WPCP layout uses CSS only.
 *
 * @param {HTMLElement|null} pag                  Pagination container.
 * @param {boolean}          forceHorizontalClass Force Swiper's runtime axis class to horizontal.
 * @return {void}
 */
export function stripWpcpPaginationInline(pag, forceHorizontalClass = false) {
	if (!pag) {
		return;
	}
	normalizeWpcpPaginationAxisClass(pag, forceHorizontalClass);
	pag.removeAttribute('style');
	if (!pag.classList.contains('wpcp-pagination--dynamic')) {
		return;
	}
	pag.querySelectorAll('.swiper-pagination-bullet').forEach(function (bullet) {
		bullet.removeAttribute('style');
	});
}

/**
 * Keep pagination layout class/CSS-driven after Swiper updates.
 *
 * @param {Object}           swiper                               Swiper instance.
 * @param {HTMLElement|null} pag                                  Pagination container.
 * @param {Object}           [options]                            Cleanup options.
 * @param {boolean}          [options.forceHorizontalClass=false] Force Swiper's runtime axis class to horizontal.
 * @return {void}
 */
export function bindWpcpPaginationLayoutCleanup(swiper, pag, options = {}) {
	if (!swiper || !pag || typeof swiper.on !== 'function') {
		return;
	}
	const { forceHorizontalClass = false } = options;
	const cleanup = function () {
		stripWpcpPaginationInline(pag, forceHorizontalClass);
	};
	cleanup();
	swiper.on('paginationUpdate', cleanup);
	swiper.on('slideChange', cleanup);
	swiper.on('slideChangeTransitionEnd', cleanup);
	swiper.on('loopFix', cleanup);
	swiper.on('resize', cleanup);
	swiper.on('breakpoint', cleanup);
	swiper.on('autoplay', cleanup);
}
