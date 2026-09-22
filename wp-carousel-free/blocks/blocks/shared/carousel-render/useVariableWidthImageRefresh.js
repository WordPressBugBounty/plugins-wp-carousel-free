/**
 * Variable-width slides size themselves from intrinsic image widths, so
 * Swiper must recalculate once slide images finish loading. Bumps
 * `swiper.update()` after every pending image settles.
 */

import { useEffect } from '@wordpress/element';

/**
 * @param {Object}  options
 * @param {boolean} options.effectiveVariableWidth
 * @param {boolean} options.isVertical
 * @param {boolean} options.isTiles
 * @param {string}  options.style
 * @param {string}  options.swiperKey
 * @param {number}  options.itemsLength
 * @param {Object}  options.swiperRef
 * @param {Object}  options.carouselRef
 */
export default function useVariableWidthImageRefresh({
	effectiveVariableWidth,
	isVertical,
	isTiles,
	style,
	swiperKey,
	itemsLength,
	swiperRef,
	carouselRef,
}) {
	useEffect(() => {
		if (!effectiveVariableWidth || isVertical || isTiles || 'ticker' === style) {
			return;
		}
		const swiper = swiperRef.current;
		const root = carouselRef.current;
		if (!swiper || !root) {
			return;
		}
		const imgs = root.querySelectorAll('.swiper-slide img.wpcp-item-img');
		const bump = () => {
			requestAnimationFrame(() => {
				swiper.update?.();
			});
		};
		if (!imgs.length) {
			bump();
			return;
		}
		let pending = 0;
		imgs.forEach((img) => {
			if (img.complete && img.naturalWidth !== 0) {
				return;
			}
			pending++;
			const done = () => {
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
		return undefined;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [effectiveVariableWidth, isVertical, isTiles, style, swiperKey, itemsLength]);
}
