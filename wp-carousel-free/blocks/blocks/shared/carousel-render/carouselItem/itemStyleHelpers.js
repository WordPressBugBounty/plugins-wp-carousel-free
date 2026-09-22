/**
 * Pure style/class helpers for the editor item preview (`CarouselItem`).
 * Class slugs emitted here must stay aligned with the static rules in
 * `blocks/blocks/style.scss` and the PHP renderer.
 */

import {
	buildCustomAspectCssVars,
	buildMaxWidthCssVars,
	buildPresetAspectCssVars,
	imageSizeCss,
	resolveImageSizeTriplet,
} from '../gapImageUtils';

// The 9 anchor slugs accepted by the static `.wpcp-overlay-pos-*` CSS rules
// in `blocks/blocks/style.scss`. Anything else collapses to the default.
const CONTENT_POSITION_SLUGS = new Set([
	'top-left',
	'top-center',
	'top-right',
	'center-left',
	'center-center',
	'center-right',
	'bottom-left',
	'bottom-center',
	'bottom-right',
]);
const OVERLAY_POSITION_DEFAULT_SLUG = 'top-right';

export function getDefaultOverlayPositionRaw() {
	return 'top right';
}

/**
 * Map a raw `lightboxIconPosition` attribute value to a CSS-rule slug.
 *
 * Handles three real inputs that used to break the rendered position:
 *  - `undefined` / `null` / empty string → fallback to the default anchor.
 *  - `'center'` (single token emitted by `AlignmentMatrixControl` for the
 *    centre cell) → expand to `'center-center'` so the CSS rule matches.
 *  - Unknown / typo values → fallback. Without this, an unrecognised value
 *    produced an orphan class (`wpcp-overlay-pos-foo`) and the icon fell to
 *    the parent's 0,0 because no rule set top/left/right/bottom.
 *
 * @param {string|undefined|null} raw `lightboxIconPosition` attribute value.
 * @return {string} One of the 9 anchor slugs.
 */
export function resolveOverlayPositionSlug(raw) {
	if (typeof raw !== 'string' || raw.trim() === '') {
		return OVERLAY_POSITION_DEFAULT_SLUG;
	}
	const slug = raw.trim().toLowerCase().replace(/\s+/g, '-');
	if (slug === 'center') {
		return 'center-center';
	}
	return CONTENT_POSITION_SLUGS.has(slug) ? slug : OVERLAY_POSITION_DEFAULT_SLUG;
}

export function resolveContentPositionClass(raw) {
	if (typeof raw !== 'string' || raw.trim() === '') {
		return '';
	}
	const slug = raw.trim().toLowerCase().replace(/\s+/g, '-');
	const normalizedSlug = slug === 'center' ? 'center-center' : slug;

	return CONTENT_POSITION_SLUGS.has(normalizedSlug)
		? `wpcp-content-position--${normalizedSlug}`
		: '';
}

export function resolveContentBoxPositionClass(raw) {
	const position = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
	return ['left', 'center', 'right'].includes(position)
		? `wpcp-content-box-position--${position}`
		: '';
}

export function resolveContentFlowPositionClass(contentOrientation, rawPosition = 'bottom') {
	if (contentOrientation !== 'image-top') {
		return '';
	}

	const position = typeof rawPosition === 'string' ? rawPosition.trim().toLowerCase() : 'bottom';
	return ['top', 'center', 'bottom'].includes(position)
		? `wpcp-content-${position}`
		: 'wpcp-content-bottom';
}

export function getContentBoxWidthStyle(contentWidth) {
	const width = contentWidth?.device?.Desktop;
	if (width === undefined || width === null || String(width).trim() === '') {
		return undefined;
	}

	const numericWidth = Number(width);
	if (!Number.isFinite(numericWidth) || numericWidth < 0) {
		return undefined;
	}

	const rawUnit = contentWidth?.unit?.Desktop || 'px';
	const unit = ['px', '%', 'em'].includes(rawUnit) ? rawUnit : 'px';
	return {
		width: `${numericWidth}${unit}`,
	};
}

export function getContentDimensionStyle(dimension, cssProperty) {
	const value = dimension?.device?.Desktop;
	if (value === undefined || value === null || String(value).trim() === '') {
		return undefined;
	}

	const numericValue = Number(value);
	if (!Number.isFinite(numericValue) || numericValue < 0) {
		return undefined;
	}

	const rawUnit = dimension?.unit?.Desktop || 'px';
	const unit = ['px', '%', 'em'].includes(rawUnit) ? rawUnit : 'px';

	return {
		[cssProperty]: `${numericValue}${unit}`,
	};
}

export function getResponsiveDimensionValue(dimension) {
	if (dimension === null || dimension === undefined || dimension === '') {
		return undefined;
	}

	if (typeof dimension === 'number' && Number.isFinite(dimension) && dimension >= 0) {
		return `${dimension}px`;
	}

	if (typeof dimension === 'string' && '' !== dimension.trim()) {
		const numericValue = Number.parseFloat(dimension);
		return Number.isFinite(numericValue) && numericValue >= 0 ? `${numericValue}px` : undefined;
	}

	const desktopValue = dimension?.device?.Desktop;
	if (desktopValue !== undefined && desktopValue !== null && String(desktopValue).trim() !== '') {
		const numericValue = Number(desktopValue);
		if (!Number.isFinite(numericValue) || numericValue < 0) {
			return undefined;
		}

		const rawUnit = dimension?.unit?.Desktop || dimension?.unit || 'px';
		const unit = ['px', '%', 'em', 'rem'].includes(rawUnit) ? rawUnit : 'px';
		return `${numericValue}${unit}`;
	}

	if (
		dimension?.Desktop !== undefined &&
		dimension?.Desktop !== null &&
		String(dimension.Desktop).trim() !== ''
	) {
		const numericValue = Number(dimension.Desktop);
		if (!Number.isFinite(numericValue) || numericValue < 0) {
			return undefined;
		}

		const rawUnit = dimension?.unit || 'px';
		const unit = ['px', '%', 'em', 'rem'].includes(rawUnit) ? rawUnit : 'px';
		return `${numericValue}${unit}`;
	}

	if (
		dimension?.value !== undefined &&
		dimension?.value !== null &&
		String(dimension.value).trim() !== ''
	) {
		const numericValue = Number(dimension.value);
		if (!Number.isFinite(numericValue) || numericValue < 0) {
			return undefined;
		}

		const rawUnit = dimension?.unit || 'px';
		const unit = ['px', '%', 'em', 'rem'].includes(rawUnit) ? rawUnit : 'px';
		return `${numericValue}${unit}`;
	}

	return undefined;
}

export function getOverlayContentStyle(contentOptions, blockName) {
	const widthStyle = getContentDimensionStyle(contentOptions?.contentWidth, 'width');
	const heightStyle = getContentDimensionStyle(contentOptions?.contentHeight, 'height');

	if (!widthStyle && !heightStyle && blockName !== 'thumbnails-slider') {
		return { width: '-webkit-fill-available' };
	}

	return {
		...widthStyle,
		...heightStyle,
	};
}

/**
 * Inline styles for the item media wrapper and the image inside it, driven by
 * the Image panel's aspect-ratio / max-width settings.
 *
 * @param {Object} imageOptions Image panel options.
 * @param {string} aspect       Resolved aspect ratio (`original`, `custom`, or `w:h`).
 * @return {{mediaStyle: Object, imageStyle: Object}} Wrapper + image inline styles.
 */
export function buildItemMediaStyles(imageOptions, aspect) {
	const mediaStyle = {};
	let imageStyle = {};
	const maxWidthTriplet = resolveImageSizeTriplet(imageOptions, 'imageMaxWidth', {
		value: 100,
		unit: '%',
	});

	if (aspect === 'custom') {
		Object.assign(mediaStyle, buildCustomAspectCssVars(imageOptions));
		mediaStyle.position = 'relative';
		mediaStyle.overflow = 'hidden';

		imageStyle = {
			position: 'absolute',
			inset: 0,
			width: '100%',
			height: '100%',
			objectFit: 'cover',
			display: 'block',
		};
	} else {
		Object.assign(mediaStyle, buildMaxWidthCssVars(imageOptions));
		if (aspect !== 'original') {
			// Preset W:H via responsive `--wpcp-mar-*` vars (static SCSS applies
			// `aspect-ratio`). Parity: DimensionHelper::build_media_dimension_style_attr().
			const presetVars = buildPresetAspectCssVars(aspect);
			if (presetVars) {
				Object.assign(mediaStyle, presetVars);
				mediaStyle.position = 'relative';
				mediaStyle.overflow = 'hidden';
				imageStyle = {
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
				};
			}
		} else if (imageSizeCss(maxWidthTriplet.Desktop)) {
			imageStyle = { maxWidth: '100%', height: 'auto' };
		}
	}

	return { mediaStyle, imageStyle };
}
