const PANORAMA_SLIDE_PERSPECTIVE = 1200;

/**
 * Panorama effect plugin — supports both convex (style-one) and concave/reverse (style-two).
 *
 * Pass `panoramaEffect: { reverse: true }` to enable the inward concave mode.
 * Reverse mode projects each slide through its own perspective() inside the
 * slide transform (the stylesheet disables the container perspective for
 * style-two): a shared container perspective magnifies slide positions
 * unevenly with distance from the center, which opens visibly wider gaps
 * toward the edges.
 *
 * @param {Object}   args              Swiper module args.
 * @param {Object}   args.swiper       Swiper instance.
 * @param {Function} args.extendParams Swiper extendParams helper.
 * @param {Function} args.on           Swiper event binding helper.
 */
export default function EffectPanorama({ swiper, extendParams, on }) {
	extendParams({
		panoramaEffect: {
			depth: 200,
			rotate: 30,
			reverse: false,
			zScale: 1,
			scaleStep: 0,
		},
	});

	on('beforeInit', () => {
		if (swiper.params.effect !== 'panorama') {
			return;
		}
		swiper.classNames.push(`${swiper.params.containerModifierClass}panorama`);
		swiper.classNames.push(`${swiper.params.containerModifierClass}3d`);
		const overwriteParams = { watchSlidesProgress: true };
		Object.assign(swiper.params, overwriteParams);
		Object.assign(swiper.originalParams, overwriteParams);
	});

	on('progress', () => {
		const swiperParams = swiper.params;

		if (swiperParams.effect !== 'panorama') {
			return;
		}

		const slides = swiper.slides;
		const slideCount = slides.length;

		if (0 === slideCount) {
			return;
		}

		const sizesGrid = swiper.slidesSizesGrid;
		const {
			depth = 200,
			rotate = 30,
			reverse = false,
			zScale = 1,
			scaleStep = 0,
		} = swiperParams.panoramaEffect;

		const angleRad = (rotate * Math.PI) / 180;
		const halfAngleRad = angleRad / 2;
		const sinHalfAngle = Math.sin(halfAngleRad) || 1;
		const progressModifier = swiperParams.centeredSlides ? 0 : 0.5 * (swiperParams.slidesPerView - 1);
		const minScale = reverse ? 0.92 : 1;
		const translateAxis = swiperParams.direction === 'horizontal' ? 'X' : 'Y';
		const rotateAxis = swiperParams.direction === 'horizontal' ? 'Y' : 'X';
		const rotateDirection = swiperParams.direction === 'horizontal' ? 1 : -1;

		for (let i = 0; i < slideCount; i += 1) {
			const slideEl = slides[i];
			const slideProgress = slideEl.progress;
			const slideSize = sizesGrid[i];

			if (!slideSize) {
				continue;
			}

			const modifiedProgress = slideProgress + progressModifier;
			const absProgress = Math.abs(modifiedProgress);
			const angleCos = 1 - Math.cos(modifiedProgress * angleRad);

			/**
			 * Reverse mode shrinks slides progressively away from the center
			 * (scale step + rotation foreshortening), and each shrunken slide
			 * donates half of its lost width to the gap on either side — the
			 * losses accumulate outward, so visual gaps grow toward the edges.
			 * Shift every slide inward by the accumulated projected width loss
			 * between it and the center: quadratic term for the scale step,
			 * cubic for rotation foreshortening, minus a linear term for the
			 * per-slide perspective magnification (translateZ depth plus the
			 * inner edge tilting toward the viewer). Progress is capped so far
			 * offscreen loop slides can't overtake neighbors. Slide progress
			 * is positive on the left/previous side, so inward (toward the
			 * center) shares the sign of modifiedProgress.
			 */
			const compensatedProgress = Math.min(absProgress, 4);
			const inwardShift =
				slideSize *
				(0.5 * scaleStep * compensatedProgress * compensatedProgress +
					(angleRad * angleRad * compensatedProgress ** 3) / 6 -
					((depth + slideSize * angleRad * 0.25) * compensatedProgress) / PANORAMA_SLIDE_PERSPECTIVE);
			const translateValue = reverse
				? `${Math.sign(modifiedProgress) * inwardShift}px`
				: `${modifiedProgress * (slideSize / 3) * angleCos}px`;

			/**
			 * STYLE-ONE  (convex / outward):
			 *   rotateY  =  modifiedProgress * rotate        → sides face away from center
			 *   translateZ = radius * angleCos - depth       → sides pushed back
			 *
			 * STYLE-TWO  (concave / inward  — reverse):
			 *   rotateY  = -modifiedProgress * rotate        → sides face toward center
			 *   translateZ = -(radius * angleCos) + depth    → sides pulled forward
			 */
			const rotateY = reverse ? -(modifiedProgress * rotate) : modifiedProgress * rotate;
			const radius = ((0.5 * slideSize) / sinHalfAngle) * angleCos * zScale;
			const translateZVal = reverse ? -radius + depth : radius - depth;
			const scale = Math.max(minScale, 1 - absProgress * scaleStep);

			const zIndex = 1000 - Math.abs(Math.round(modifiedProgress * 100));
			const zIndexString = String(zIndex);
			const transformValue = reverse
				? `translate${translateAxis}(${translateValue}) perspective(${PANORAMA_SLIDE_PERSPECTIVE}px) translateZ(${translateZVal}px) rotate${rotateAxis}(${
						rotateY * rotateDirection
				  }deg) scale(${scale})`
				: `translate${translateAxis}(${translateValue}) translateZ(${translateZVal}px) rotate${rotateAxis}(${
						rotateY * rotateDirection
				  }deg) scale(${scale})`;

			if (slideEl.style.transform !== transformValue) {
				slideEl.style.transform = transformValue;
			}

			if (slideEl.style.zIndex !== zIndexString) {
				slideEl.style.zIndex = zIndexString;
			}

			if (slideEl.style.getPropertyValue('--wpcp-panorama-slide-z-index') !== zIndexString) {
				slideEl.style.setProperty('--wpcp-panorama-slide-z-index', zIndexString);
			}
		}
	});

	on('setTransition', (_swiper, duration) => {
		if (swiper.params.effect !== 'panorama') {
			return;
		}
		swiper.slides.forEach((slideEl) => {
			slideEl.style.transitionDuration = `${duration}ms`;
		});
	});
}
