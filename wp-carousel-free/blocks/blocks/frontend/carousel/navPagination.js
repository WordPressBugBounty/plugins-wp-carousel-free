/**
 * Map arrows + bullets onto a Swiper config (same DOM as `initSwiperCarousel`).
 *
 * @param {Object}      base      Swiper options (mutated).
 * @param {HTMLElement} blockRoot `.wpcp-block`
 * @param {Object}      cfg       Parsed `data-wpcp`.
 * @return {HTMLElement|null} Pagination root for `bindWpcpPaginationLayoutCleanup`, or null.
 */
export function attachWpcpNavPagination(base, blockRoot, cfg) {
	let wpcpPaginationRoot = null;
	if (cfg.navigation) {
		const prev = blockRoot.querySelector('.wpcp-nav-prev');
		const next = blockRoot.querySelector('.wpcp-nav-next');
		if (prev && next) {
			base.navigation = { prevEl: prev, nextEl: next };
		}
	}
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
	return wpcpPaginationRoot;
}
