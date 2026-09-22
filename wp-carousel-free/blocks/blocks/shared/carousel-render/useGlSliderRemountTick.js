/**
 * The WebGL slider layouts (shaders / shutters) sample their textures from
 * `img.swiper-gl-image` elements at mount. If the Swiper mounts before those
 * images decode, the effect renders black frames. This hook waits for every
 * GL image to decode and returns a tick the parent appends to `swiperKey`,
 * forcing one clean remount once textures are ready.
 */

import { useState, useEffect } from '@wordpress/element';

/**
 * @param {Object}   options
 * @param {string}   options.blockName
 * @param {string}   options.sliderLayout
 * @param {object[]} options.items
 * @param {string}   options.swiperKey
 * @param {Object}   options.containerRef
 * @return {number} Increments once the GL images are decoded.
 */
export default function useGlSliderRemountTick({
	blockName,
	sliderLayout,
	items,
	swiperKey,
	containerRef,
}) {
	const [glMountTick, setGlMountTick] = useState(0);

	useEffect(() => {
		if (blockName !== 'slider') {
			return undefined;
		}
		if (sliderLayout !== 'shaders' && sliderLayout !== 'shutters') {
			return undefined;
		}
		if (!items?.length) {
			return undefined;
		}
		let cancelled = false;
		const waitForImages = async () => {
			await new Promise((resolve) => {
				window.requestAnimationFrame(resolve);
			});
			const root = containerRef.current;
			if (!root) {
				return;
			}
			const images = Array.from(root.querySelectorAll('img.swiper-gl-image'));
			await Promise.all(
				images.map((imageEl) => {
					if (imageEl.complete && imageEl.naturalWidth) {
						return Promise.resolve();
					}
					if (typeof imageEl.decode === 'function') {
						return imageEl.decode().catch(() => undefined);
					}
					return new Promise((resolve) => {
						imageEl.onload = resolve;
						imageEl.onerror = resolve;
					});
				})
			);
			if (!cancelled) {
				setGlMountTick((tick) => tick + 1);
			}
		};
		waitForImages();
		return () => {
			cancelled = true;
		};
	}, [blockName, sliderLayout, items, swiperKey, containerRef]);

	return glMountTick;
}
