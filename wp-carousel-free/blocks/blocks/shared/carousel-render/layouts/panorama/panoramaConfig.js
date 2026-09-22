const PANORAMA_REFLECTION_DEFAULTS = {
	distance: 12,
	height: 80,
};

/**
 * Responsive depth/rotate values per device.
 *
 * Style-two uses shallower depth and slightly higher rotation so the
 * concave tunnel reads clearly without feeling too extreme.
 *
 * @param {string}  device  Desktop | Tablet | Mobile
 * @param {boolean} reverse true = style-two (concave)
 * @return {{ depth: number, rotate: number, reverse: boolean }} Panorama effect parameters.
 */
export function panoramaEffectForDevice(device, reverse = false) {
	if (reverse) {
		// Style-two (concave / inward)
		if ('Mobile' === device) {
			return {
				rotate: 12,
				depth: 8,
				reverse: true,
				zScale: 0.035,
				scaleStep: 0.03,
			};
		}
		if ('Tablet' === device) {
			return {
				rotate: 10,
				depth: 7,
				reverse: true,
				zScale: 0.03,
				scaleStep: 0.026,
			};
		}
		return {
			rotate: 6,
			depth: 8,
			reverse: true,
			zScale: 0.02,
			scaleStep: 0.015,
		};
	}

	// Style-one (convex / outward) — original values
	if ('Mobile' === device) {
		return { rotate: 35, depth: 150, reverse: false, zScale: 1, scaleStep: 0 };
	}
	if ('Tablet' === device) {
		return { rotate: 30, depth: 150, reverse: false, zScale: 1, scaleStep: 0 };
	}
	return { rotate: 18, depth: 100, reverse: false, zScale: 1, scaleStep: 0 };
}

export function autoplayParams(autoplay, delay, pauseHover, autoPlayDirection = 'ltr') {
	return autoplay
		? {
				delay,
				disableOnInteraction: false,
				pauseOnMouseEnter: pauseHover,
				reverseDirection: 'rtl' === autoPlayDirection,
		  }
		: false;
}

function positiveNumberOr(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getPanoramaReflectionState(layoutOptions = {}, contentOrientation = '') {
	// The Content Box orientation has no reflective surface, so the mirror
	// layer is suppressed there regardless of the reflection toggle.
	const suppressesReflection = contentOrientation === 'content-box';
	const enabled =
		!suppressesReflection &&
		(layoutOptions?.showReflection === true || layoutOptions?.panoramaReflection === true);
	const distance = positiveNumberOr(
		layoutOptions?.reflectionDistance ?? layoutOptions?.panoramaReflectionDistance,
		PANORAMA_REFLECTION_DEFAULTS.distance
	);
	const height = positiveNumberOr(
		layoutOptions?.reflectionHeight ?? layoutOptions?.panoramaReflectionHeight,
		PANORAMA_REFLECTION_DEFAULTS.height
	);
	const usesNewHeight = Object.prototype.hasOwnProperty.call(layoutOptions, 'reflectionHeight');

	return {
		enabled,
		style: enabled
			? {
					'--wpcp-panorama-reflection-distance': `${distance}px`,
					'--wpcp-panorama-reflection-height': `${height}${usesNewHeight ? '%' : 'px'}`,
			  }
			: undefined,
	};
}

export function buildPanoramaBreakpoints({
	columns,
	gapPxSwiper,
	slidesScrollGroup,
	usePanoramaEffect,
	isStyleTwo,
}) {
	return {
		0: {
			slidesPerView: columns.Mobile,
			spaceBetween: gapPxSwiper.Mobile,
			slidesPerGroup: slidesScrollGroup.Mobile,
			...(usePanoramaEffect ? { panoramaEffect: panoramaEffectForDevice('Mobile', isStyleTwo) } : {}),
		},
		600: {
			slidesPerView: columns.Tablet,
			spaceBetween: gapPxSwiper.Tablet,
			slidesPerGroup: slidesScrollGroup.Tablet,
			...(usePanoramaEffect ? { panoramaEffect: panoramaEffectForDevice('Tablet', isStyleTwo) } : {}),
		},
		1024: {
			slidesPerView: columns.Desktop,
			spaceBetween: gapPxSwiper.Desktop,
			slidesPerGroup: slidesScrollGroup.Desktop,
			...(usePanoramaEffect ? { panoramaEffect: panoramaEffectForDevice('Desktop', isStyleTwo) } : {}),
		},
	};
}
