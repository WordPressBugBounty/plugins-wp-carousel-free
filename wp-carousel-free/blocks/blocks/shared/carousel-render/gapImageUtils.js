/**
 * Gap → pixels for Swiper `spaceBetween`, and responsive image / aspect CSS variables for slide media.
 * Breakpoint keys (600 / 1024) mirror Swiper breakpoints in `CarouselRender.jsx`.
 *
 * `gapToPx` / `gapCssValue` live in `shared/utils/gapUnits` so the frontend
 * runtime can share them without importing from the editor render layer; they
 * are re-exported here for the existing editor call sites.
 */

export { gapToPx, gapCssValue } from '../utils/gapUnits';

/**
 * CSS length from image option `{ value, unit }` (px, %, em).
 *
 * @param {{ value?: number, unit?: string }|undefined} obj Image option object.
 * @return {string|undefined} CSS length value with unit, or undefined if invalid.
 */
export function imageSizeCss(obj) {
	if (!obj || typeof obj !== 'object') {
		return undefined;
	}
	const n = Number(obj.value);
	if (!Number.isFinite(n) || n <= 0) {
		return undefined;
	}
	const u = String(obj.unit || 'px').toLowerCase();
	if (u === 'px' || u === '%' || u === 'em') {
		return `${n}${u}`;
	}
	return `${n}px`;
}

/**
 * Ensures a valid `{ value, unit }` for saved block data (missing keys, legacy, etc.).
 *
 * @param {unknown}                         obj
 * @param {{ value: number, unit: string }} fallback
 */
export function normalizeImageSizeOption(obj, fallback) {
	if (!obj || typeof obj !== 'object') {
		return { ...fallback };
	}
	const unitRaw = obj.unit;
	const unit =
		typeof unitRaw === 'string' && unitRaw.trim() !== '' ? unitRaw.toLowerCase() : fallback.unit;
	const n = Number(obj.value);
	if (!Number.isFinite(n) || n <= 0) {
		return { ...fallback };
	}
	return { value: n, unit };
}

/**
 * Desktop / tablet / mobile `{ value, unit }` with tablet→desktop and mobile→tablet fallbacks.
 * Reads from responsive {device: {...}, unit: {...}} structure set by ImagePanel.
 *
 * @param {Object}                          io
 * @param {string}                          baseKey
 * @param {{ value: number, unit: string }} fallback
 */
export function resolveImageSizeTriplet(io, baseKey, fallback) {
	const attr = io[baseKey];
	if (!attr || typeof attr !== 'object') {
		return { Desktop: fallback, Tablet: fallback, Mobile: fallback };
	}

	// Extract device values with fallbacks: Tablet→Desktop, Mobile→Tablet
	const device = attr.device || {};
	const unit = attr.unit || {};

	const dValue = device.Desktop;
	const dUnit = unit.Desktop || fallback.unit;
	const d = { value: dValue, unit: dUnit };

	const tValue = device.Tablet !== undefined ? device.Tablet : dValue;
	const tUnit = unit.Tablet !== undefined ? unit.Tablet : dUnit;
	const t = { value: tValue, unit: tUnit };

	const mValue = device.Mobile !== undefined ? device.Mobile : tValue;
	const mUnit = unit.Mobile !== undefined ? unit.Mobile : tUnit;
	const m = { value: mValue, unit: mUnit };

	// Normalize each device's option
	const dn = normalizeImageSizeOption(d, fallback);
	const tn = normalizeImageSizeOption(t, dn);
	const mn = normalizeImageSizeOption(m, tn);

	return { Desktop: dn, Tablet: tn, Mobile: mn };
}

/**
 * Layout for custom aspect-ratio wrapper at one breakpoint.
 *
 * @param {{ value: number, unit: string }} cw
 * @param {{ value: number, unit: string }} ch
 */
export function customAspectBoxCss(cw, ch) {
	const w = imageSizeCss(cw) ?? '400px';
	const h = imageSizeCss(ch) ?? '300px';
	const uW = cw.unit;
	const uH = ch.unit;
	const canUseAspectRatio =
		(uW === 'px' || uW === 'em') && (uH === 'px' || uH === 'em') && cw.value > 0 && ch.value > 0;

	if (canUseAspectRatio) {
		return {
			width: w,
			height: 'auto',
			aspectRatio: `${cw.value} / ${ch.value}`,
			minHeight: 'unset',
		};
	}
	return {
		width: w,
		height: h,
		aspectRatio: 'unset',
		minHeight: '1px',
	};
}

/**
 * CSS variables for `.wpcp-item-media--custom-rsp` (breakpoints match Swiper in carousel render).
 *
 * @param {Object} io imageOptions
 */
export function buildCustomAspectCssVars(io) {
	const cw = resolveImageSizeTriplet(io, 'customImageWidth', { value: 400, unit: 'px' });
	const ch = resolveImageSizeTriplet(io, 'customImageHeight', { value: 300, unit: 'px' });
	const d = customAspectBoxCss(cw.Desktop, ch.Desktop);
	const t = customAspectBoxCss(cw.Tablet, ch.Tablet);
	const m = customAspectBoxCss(cw.Mobile, ch.Mobile);
	return {
		'--wpcp-cmw-d': d.width,
		'--wpcp-cmh-d': d.height,
		'--wpcp-cmar-d': d.aspectRatio,
		'--wpcp-cmmin-d': d.minHeight,
		'--wpcp-cmw-t': t.width,
		'--wpcp-cmh-t': t.height,
		'--wpcp-cmar-t': t.aspectRatio,
		'--wpcp-cmmin-t': t.minHeight,
		'--wpcp-cmw-m': m.width,
		'--wpcp-cmh-m': m.height,
		'--wpcp-cmar-m': m.aspectRatio,
		'--wpcp-cmmin-m': m.minHeight,
	};
}

/**
 * CSS `aspect-ratio` value for a preset/custom Image panel choice.
 *
 * @param {string} aspect       `imageOptions.aspectRatio` (e.g. `16:9`, `custom`, `original`).
 * @param {Object} imageOptions Full imageOptions object (for custom width/height).
 * @return {string|null} Value for the `aspect-ratio` property, or null when not applicable.
 */
export function aspectRatioToCssValue(aspect, imageOptions = {}) {
	if (!aspect || aspect === 'original') {
		return null;
	}
	if (aspect === 'custom') {
		const cw = resolveImageSizeTriplet(imageOptions, 'customImageWidth', {
			value: 400,
			unit: 'px',
		});
		const ch = resolveImageSizeTriplet(imageOptions, 'customImageHeight', {
			value: 300,
			unit: 'px',
		});
		const box = customAspectBoxCss(cw.Desktop, ch.Desktop);
		return box.aspectRatio !== 'unset' ? box.aspectRatio : null;
	}
	const parts = String(aspect).split(':').map(Number);
	if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
		return `${parts[0]} / ${parts[1]}`;
	}
	return null;
}

/**
 * Responsive CSS vars for preset `W:H` on `.wpcp-item-media--aspect-rsp`.
 * Today `aspectRatio` is a single string, so all three breakpoints share the
 * same value — emission still goes through `--wpcp-mar-{d,t,m}` so a future
 * per-device schema can diverge without another mechanism change.
 *
 * @param {string} aspect Preset like `16:9`.
 * @return {Object|null} CSS custom-property map, or null when invalid.
 */
export function buildPresetAspectCssVars(aspect) {
	const cssAspect = aspectRatioToCssValue(aspect);
	if (!cssAspect) {
		return null;
	}
	return {
		'--wpcp-mar-d': cssAspect,
		'--wpcp-mar-t': cssAspect,
		'--wpcp-mar-m': cssAspect,
	};
}

/**
 * CSS variables for `.wpcp-item-media--maxw-rsp`.
 *
 * @param {Object} io imageOptions
 */
export function buildMaxWidthCssVars(io) {
	const trip = resolveImageSizeTriplet(io, 'imageMaxWidth', { value: 100, unit: '%' });
	const toVal = (obj) => imageSizeCss(obj) ?? 'none';
	return {
		'--wpcp-mwmx-d': toVal(trip.Desktop),
		'--wpcp-mwmx-t': toVal(trip.Tablet),
		'--wpcp-mwmx-m': toVal(trip.Mobile),
	};
}
