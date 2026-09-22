/**
 * Calculate Swiper 12's minimum slide count for loop mode.
 *
 * This mirrors the capacity check in Swiper's `loopFix()`. Centered and
 * offset layouts need slides available in both directions, while grouped
 * navigation rounds the loop buffer to a complete group.
 *
 * @param {Object}  options
 * @param {number}  options.slidesPerView
 * @param {number}  [options.slidesPerGroup]
 * @param {boolean} [options.bothDirections]
 * @param {number}  [options.loopAdditionalSlides]
 * @return {number} Minimum number of rendered slides required for loop mode.
 */
export function getSwiperLoopMinimumSlides({
	slidesPerView,
	slidesPerGroup = 1,
	bothDirections = false,
	loopAdditionalSlides = 0,
}) {
	let normalizedSlidesPerView = Math.max(1, Math.ceil(Number(slidesPerView) || 1));
	const normalizedSlidesPerGroup = Math.max(1, Math.ceil(Number(slidesPerGroup) || 1));

	if (bothDirections && normalizedSlidesPerView % 2 === 0) {
		normalizedSlidesPerView += 1;
	}

	let loopedSlides = bothDirections
		? Math.max(normalizedSlidesPerGroup, Math.ceil(normalizedSlidesPerView / 2))
		: normalizedSlidesPerGroup;

	if (loopedSlides % normalizedSlidesPerGroup !== 0) {
		loopedSlides += normalizedSlidesPerGroup - (loopedSlides % normalizedSlidesPerGroup);
	}

	return (
		normalizedSlidesPerView + loopedSlides + Math.max(0, Math.ceil(Number(loopAdditionalSlides) || 0))
	);
}

/**
 * @param {number} renderedSlideCount Number of SwiperSlide elements.
 * @param {Object} options            See `getSwiperLoopMinimumSlides`.
 * @return {boolean} Whether Swiper can safely enable loop mode.
 */
export function hasEnoughSlidesForSwiperLoop(renderedSlideCount, options) {
	return Math.max(0, Number(renderedSlideCount) || 0) >= getSwiperLoopMinimumSlides(options);
}
