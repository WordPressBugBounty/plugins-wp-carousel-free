/**
 * Swiper pagination DOM/config helpers (aligned with `blocks/blocks/frontend.js`).
 */

import classNames from 'classnames';
import { resolvePaginationStyle } from '../constants/freeValues';

/**
 * Build Swiper pagination params from the pagination inner block.
 *
 * @param {boolean}                         showPagin Show pagination.
 * @param {{ current: HTMLElement | null }} paginRef  Ref to the pagination element.
 * @param {Record<string, unknown>}         pagOpts   Nested options from the pagination block.
 * @return {false|Record<string, unknown>} Params for Swiper or false.
 */
export function buildSwiperPaginationConfig(showPagin, paginRef, pagOpts) {
	if (!showPagin) {
		return false;
	}
	const style = resolvePaginationStyle(pagOpts?.paginationStyle);
	const base = { el: paginRef.current, clickable: true, type: 'bullets' };
	switch (style) {
		case 'stepper':
			return {
				...base,
				type: 'bullets',
				bulletClass: 'swiper-pagination-bullet wpcp-pagination-bullet--stepper',
			};
		case 'dynamic':
			return { ...base, type: 'bullets', dynamicBullets: true, dynamicMainBullets: 1 };
		case 'dots':
		default:
			return { ...base, type: 'bullets' };
	}
}

/**
 * Normalize Swiper's runtime pagination axis class when a layout wants horizontal dots.
 *
 * @param {HTMLElement|null} pagEl                Pagination root element.
 * @param {boolean}          forceHorizontalClass Force Swiper's runtime axis class to horizontal.
 * @return {void}
 */
export function normalizePaginationAxisClass(pagEl, forceHorizontalClass = false) {
	if (!pagEl || true !== forceHorizontalClass) {
		return;
	}
	pagEl.classList.remove('swiper-pagination-vertical');
	pagEl.classList.add('swiper-pagination-horizontal');
}

/**
 * Swiper sets inline width/left/transform on the pagination root. Scoped static
 * + dynamic CSS owns layout.
 *
 * @param {HTMLElement|null} pagEl                Pagination root element.
 * @param {boolean}          forceHorizontalClass Force Swiper's runtime axis class to horizontal.
 * @return {void}
 */
export function stripPaginationRootInlineStyle(pagEl, forceHorizontalClass = false) {
	if (!pagEl) {
		return;
	}
	normalizePaginationAxisClass(pagEl, forceHorizontalClass);
	pagEl.removeAttribute('style');
	if (!pagEl.classList.contains('wpcp-pagination--dynamic')) {
		return;
	}
	pagEl.querySelectorAll('.swiper-pagination-bullet').forEach((bullet) => {
		bullet.removeAttribute('style');
	});
}

/**
 * Props for the pagination container (classes only; sizing/colors from scoped CSS).
 *
 * @param {Record<string, unknown>} pagOpts    Options from the pagination inner block.
 * @param {boolean}                 isVertical Whether the carousel display is vertical.
 * @return {Object} React props for the wrapper div.
 */
export function getPaginationDivProps(pagOpts, isVertical = false) {
	const style = resolvePaginationStyle(pagOpts?.paginationStyle);
	const align = pagOpts?.alignment ?? 'center';
	const verticalPos = pagOpts?.verticalPos ?? 'bottom';

	const idRaw = pagOpts?.cssId ? String(pagOpts.cssId) : '';
	const cleanId = idRaw.replace(/[^a-zA-Z0-9_-]/g, '');

	return {
		className: classNames(
			'wpcp-pagination',
			'swiper-pagination',
			`wpcp-pagination--${style}`,
			`wpcp-pagination--align-${align}`,
			`wpcp-pagination--vpos-${verticalPos}`,
			isVertical && 'wpcp-pagination--vertical',
			pagOpts?.hideOnDesktop && 'wpcp-pagination--hide-desktop',
			pagOpts?.hideOnTablet && 'wpcp-pagination--hide-tablet',
			pagOpts?.hideOnMobile && 'wpcp-pagination--hide-mobile',
			pagOpts?.cssClass
		),
		...(cleanId ? { id: cleanId } : {}),
	};
}
