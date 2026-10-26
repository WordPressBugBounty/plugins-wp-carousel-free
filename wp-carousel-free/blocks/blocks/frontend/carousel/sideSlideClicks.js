/**
 * Frontend binding of the staged-slide click routing.
 *
 * The listener is bound on the Swiper container in the capture phase, which is
 * where it has to be: the lightbox, the card link and the overlay-icon proxy
 * are all delegated from the block root and would otherwise act on a flanking
 * card before anything could decide the click meant "center this one".
 *
 * Must be called AFTER the Swiper instance is constructed. Swiper binds its own
 * capture-phase click handler at init, so it runs first and marks a
 * drag-release click as handled — which is what keeps a swipe that ends over a
 * flanking card from also centering it.
 */

import { activateSideSlide, findSideSlide } from '../../shared/utils/sideSlideActivation';

/**
 * @param {HTMLElement} swiperEl `.swiper` container.
 * @param {Object}      swiper   The Swiper instance on that container.
 */
export function bindSideSlideClicks(swiperEl, swiper) {
	if (!swiperEl || '1' === swiperEl.dataset.wpcpSideSlideClicksInit) {
		return;
	}
	swiperEl.dataset.wpcpSideSlideClicksInit = '1';

	swiperEl.addEventListener(
		'click',
		function (event) {
			if (event.defaultPrevented || 0 !== event.button) {
				return;
			}

			const slide = findSideSlide(event.target, swiperEl);
			if (!slide) {
				return;
			}

			// Swallow first and move second: a flanking card never opens the
			// item, whether or not the carousel is free to travel right now.
			event.preventDefault();
			event.stopPropagation();
			activateSideSlide(swiper, slide);
		},
		true
	);
}
