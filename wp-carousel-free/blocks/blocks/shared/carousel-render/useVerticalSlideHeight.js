/**
 * Vertical carousels size the Swiper viewport from the tallest slide. This
 * hook measures `.wpcp-item-inner` heights (waiting for slide images first),
 * re-measures on container resize, and nudges Swiper to update afterwards.
 */

import { useState, useEffect, useLayoutEffect, useCallback } from '@wordpress/element';

/**
 * @param {Object}   options
 * @param {boolean}  options.isVertical
 * @param {Object}   options.carouselRef
 * @param {Object}   options.swiperRef
 * @param {object[]} options.items
 * @param {number}   options.activeColumns
 * @param {string}   options.activeDevice
 * @param {number}   options.activeGapPx
 * @param {string}   options.swiperKey
 * @return {?number} Tallest measured slide height in px (null when not vertical / unmeasured).
 */
export default function useVerticalSlideHeight({
	isVertical,
	carouselRef,
	swiperRef,
	items,
	activeColumns,
	activeDevice,
	activeGapPx,
	swiperKey,
}) {
	const [verticalItemMaxPx, setVerticalItemMaxPx] = useState(null);

	const calculateVerticalHeight = useCallback(() => {
		if (!carouselRef.current) {
			return;
		}

		const root = carouselRef.current;
		const inners = root.querySelectorAll('.swiper-slide .wpcp-item-inner');
		if (!inners || inners.length === 0) {
			return;
		}

		// Once a height is applied, `.wpcp-item-media`'s `flex: 1` stretches the
		// item to fill it, so re-measuring returns the applied height and the
		// carousel can never grow to fit its aspect box or content. Lift the
		// inline heights for the read and restore them in the same frame.
		const swiperEl = root.querySelector('.wpcp-swiper');
		const slides = root.querySelectorAll('.swiper-slide');
		const savedRootHeight = swiperEl ? swiperEl.style.height : '';
		const savedSlideHeights = [];
		slides.forEach((slide, index) => {
			savedSlideHeights[index] = slide.style.height;
			slide.style.height = 'auto';
		});
		if (swiperEl) {
			swiperEl.style.height = 'auto';
		}

		let maxInner = 0;
		inners.forEach((inner) => {
			const height = inner.getBoundingClientRect().height;
			if (height > maxInner) {
				maxInner = height;
			}
		});

		slides.forEach((slide, index) => {
			slide.style.height = savedSlideHeights[index];
		});
		if (swiperEl) {
			swiperEl.style.height = savedRootHeight;
		}

		if (maxInner <= 0) {
			return;
		}

		const measured = Math.ceil(maxInner);
		setVerticalItemMaxPx((previous) =>
			null !== previous && Math.abs(previous - measured) <= 1 ? previous : measured
		);
	}, [carouselRef]);

	useEffect(() => {
		if (!isVertical) {
			setVerticalItemMaxPx(null);
		}
	}, [isVertical]);

	useEffect(() => {
		if (!isVertical) {
			return;
		}

		const domTimer = setTimeout(() => {
			if (!carouselRef.current) {
				return;
			}

			const images = carouselRef.current.querySelectorAll('.wpcp-item-img');
			const imagesArray = Array.from(images);

			const runMeasure = () => {
				requestAnimationFrame(() => {
					calculateVerticalHeight();
				});
			};

			if (imagesArray.length === 0) {
				runMeasure();
				return;
			}

			const allImagesLoaded = imagesArray.every((img) => img.complete && img.naturalHeight !== 0);

			if (allImagesLoaded) {
				runMeasure();
				return;
			}

			const maxWaitTime = 3000;
			const startTime = Date.now();

			const checkImagesLoaded = () => {
				const allLoaded = imagesArray.every((img) => img.complete && img.naturalHeight !== 0);
				const elapsed = Date.now() - startTime;

				if (allLoaded || elapsed > maxWaitTime) {
					runMeasure();
				} else {
					requestAnimationFrame(checkImagesLoaded);
				}
			};

			checkImagesLoaded();
		}, 100);

		return () => clearTimeout(domTimer);
		// Why: re-measure on the same signals as the original CarouselRender
		// effect — item set, columns, device, and gap changes — plus every
		// Swiper remount, which replaces the node we measure.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		isVertical,
		items,
		calculateVerticalHeight,
		activeColumns,
		activeDevice,
		activeGapPx,
		swiperKey,
	]);

	// `swiperKey` is a dependency because a remount swaps in a fresh wrapper
	// node: an observer still attached to the detached one never fires again,
	// which would strand the height at whatever the last measurement produced.
	useLayoutEffect(() => {
		if (!isVertical || !carouselRef.current) {
			return;
		}
		const el = carouselRef.current;
		const resizeObserver = new ResizeObserver(() => {
			calculateVerticalHeight();
		});
		resizeObserver.observe(el);
		return () => resizeObserver.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isVertical, calculateVerticalHeight, items.length, swiperKey]);

	useEffect(() => {
		if (!isVertical || !swiperRef.current) {
			return;
		}
		const id = requestAnimationFrame(() => {
			swiperRef.current?.update?.();
		});
		return () => cancelAnimationFrame(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isVertical, verticalItemMaxPx, activeColumns, activeDevice, activeGapPx]);

	return verticalItemMaxPx;
}
