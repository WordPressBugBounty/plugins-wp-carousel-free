/**
 * Click routing for the layouts that stage the whole gallery at once.
 *
 * The 3D Carousel keeps every card on screen, so a click on one of them has two
 * possible readings. The centered card is the one the viewer is looking at, so
 * it keeps the item's own actions — the lightbox, the card link, the play icon.
 * A flanking card is not being looked at yet, so clicking it means "bring this
 * one to the front" and nothing else; opening a lightbox on a card the viewer
 * has not centered yet is the reading nobody asks for.
 *
 * The routing lives here rather than in either runtime because both sides make
 * the same decision: `frontend/carousel/sideSlideClicks.js` for the published
 * block and `carousel-render/useEditorPreviewLightbox.js` for the preview. The
 * stylesheet states the same rule visually — `style/_carousel-3d.scss` keeps the
 * overlay icons off a flanking card, so nothing on one offers to open it.
 */

const SLIDE_SELECTOR = '.swiper-slide';
const ACTIVE_SLIDE_CLASS = 'swiper-slide-active';

/**
 * Elements that own the pointer themselves. A video that slid off center while
 * playing still has to answer its own controls, or the only way back to them
 * would be to pause it first.
 */
const SELF_HANDLED_SELECTOR = 'video, audio';

/**
 * The staged slide a click landed on, when that slide is not the centered one.
 *
 * @param {EventTarget}      target   Click target.
 * @param {HTMLElement|null} swiperEl Container the slide must belong to.
 * @return {HTMLElement|null} The flanking slide, or null when the click belongs
 *                            to the centered slide or to nothing staged.
 */
export function findSideSlide(target, swiperEl = null) {
	if (!target || 'function' !== typeof target.closest) {
		return null;
	}
	if (target.closest(SELF_HANDLED_SELECTOR)) {
		return null;
	}

	const slide = target.closest(SLIDE_SELECTOR);
	if (!slide || (swiperEl && !swiperEl.contains(slide))) {
		return null;
	}

	return slide.classList.contains(ACTIVE_SLIDE_CLASS) ? null : slide;
}

/**
 * Bring a flanking slide to the center.
 *
 * Loop mode is addressed by the item's own index rather than by its position in
 * the rendered strip, because the strip holds Swiper's loop copies too and the
 * copy under the pointer is not the seat the carousel counts from.
 *
 * @param {Object}      swiper  Swiper instance.
 * @param {HTMLElement} slideEl Slide to center.
 * @return {boolean} Whether the carousel was asked to move.
 */
export function activateSideSlide(swiper, slideEl) {
	if (!swiper || swiper.destroyed || !slideEl) {
		return false;
	}
	// A click that lands mid-transition names a card that is already on its way
	// somewhere else, and Swiper refuses a loop hop while one is in flight.
	if (swiper.animating) {
		return false;
	}

	const params = swiper.params || {};

	if (params.loop && 'function' === typeof swiper.slideToLoop) {
		const realIndex = parseInt(slideEl.getAttribute('data-swiper-slide-index'), 10);
		if (Number.isInteger(realIndex)) {
			swiper.slideToLoop(realIndex);
			return true;
		}
	}

	const slideIndex = Array.prototype.indexOf.call(swiper.slides || [], slideEl);
	if (0 > slideIndex || 'function' !== typeof swiper.slideTo) {
		return false;
	}

	swiper.slideTo(slideIndex);
	return true;
}
