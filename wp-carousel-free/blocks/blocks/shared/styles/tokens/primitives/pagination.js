/**
 * Pagination token transforms — mirrors paginationDotsDynamicCss.js / NavigationBuilder
 * pagination emission verbatim. Used by style-config rows whose `attr` is
 * `paginationDotsOptions`.
 */

import {
	getResolvedPaginationDims,
	getStyleDims,
	getDeviceValue,
} from '../../../utils/paginationDimsUtils';
import { sanitizeCssColor } from '../../sanitizeCssColor';
import { resolvePaginationStyle } from '../../../constants/freeValues';

const pagColorToken = (raw) => sanitizeCssColor(raw);

const ALLOWED_UNITS = new Set(['px', '%', 'em']);

const clamp = (value, min, max, fallback) => {
	const n = Number(value);
	if (!Number.isFinite(n)) {
		return fallback;
	}
	return Math.min(max, Math.max(min, n));
};

const sanitizeUnit = (raw) => {
	const u = String(raw || 'px').toLowerCase();
	return ALLOWED_UNITS.has(u) ? u : 'px';
};

const formatLength = (n, unit, ranges) => {
	if (!Number.isFinite(n)) {
		return null;
	}
	if (unit === 'px') {
		const [lo, hi] = ranges.px;
		return `${clamp(n, lo, hi, 12)}px`;
	}
	if (unit === 'em') {
		const [lo, hi] = ranges.em;
		return `${clamp(n, lo, hi, 0.75)}em`;
	}
	const [lo, hi] = ranges.pct;
	return `${clamp(n, lo, hi, 8)}%`;
};

const dimFieldToCss = (field, device, ranges, fallbackPx) => {
	if (!field?.device) {
		return `${fallbackPx}px`;
	}
	const n = Number(getDeviceValue(field.device, device, undefined));
	const unit = sanitizeUnit(getDeviceValue(field.unit, device, 'px'));
	return formatLength(n, unit, ranges) || `${fallbackPx}px`;
};

const R_ITEM = { px: [2, 80], em: [0.15, 5], pct: [2, 100] };
const R_STEP = { px: [2, 80], em: [0.1, 4], pct: [2, 50] };
const R_FRAC = { px: [8, 48], em: [0.3, 3], pct: [5, 100] };
const R_GAP = { px: [0, 64], em: [0, 4], pct: [0, 24] };

const isTransparentOrUnsetBg = (raw) => {
	if (raw === null || raw === undefined) {
		return true;
	}
	const s = String(raw).trim().toLowerCase();
	if (s === '' || s === 'transparent') {
		return true;
	}
	const rgba = s.match(
		/^rgba?\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*(?:,\s*([0-9.]+%?)\s*)?\)$/i
	);
	if (rgba && rgba[4] !== undefined && rgba[4] !== '') {
		const a = String(rgba[4]).replace('%', '');
		if (parseFloat(a) === 0) {
			return true;
		}
	}
	if (/^#[0-9a-f]{8}$/i.test(s) && s.slice(-2) === '00') {
		return true;
	}
	return false;
};

const pagStyle = (pag) => resolvePaginationStyle(pag?.paginationStyle);
const isTextColorStyle = (pag) => 'numbers' === pagStyle(pag);

/**
 * Clamped gap length for one device.
 *
 * @param {Object} pag    Pagination attribute branch.
 * @param {Object} _row   Style-config row metadata.
 * @param {string} device Responsive device key.
 */
export const paginationGap = (pag, _row, device) => {
	if (!pag || typeof pag !== 'object') {
		return '8px';
	}
	return dimFieldToCss(
		{
			device: pag?.gap?.device,
			unit: pag?.gap?.unit,
		},
		device,
		R_GAP,
		8
	);
};

/**
 * Style-aware dimension token (row.dimField + row.fallback + row.rangesKey).
 *
 * @param {Object} pag    Pagination attribute branch.
 * @param {Object} row    Style-config row metadata.
 * @param {string} device Responsive device key.
 */
export const paginationDim = (pag, row, device) => {
	if (!pag || typeof pag !== 'object') {
		return null;
	}
	const allDims = getResolvedPaginationDims(pag);
	const styleDims = getStyleDims(allDims, pagStyle(pag));
	const field = styleDims[row.dimField];
	const rangesMap = {
		item: R_ITEM,
		step: R_STEP,
		frac: R_FRAC,
	};
	const ranges = rangesMap[row.rangesKey] || R_ITEM;
	return dimFieldToCss(field, device, ranges, row.fallback ?? 12);
};

export const pagColor = (pag) => {
	if (!pag?.colorNormal || isTextColorStyle(pag)) {
		return null;
	}
	return pagColorToken(pag.colorNormal);
};

export const pagTextColor = (pag) => {
	if (!pag?.colorNormal) {
		return null;
	}
	return pagColorToken(pag.colorNormal);
};

export const pagActiveColor = (pag) => {
	if (isTextColorStyle(pag)) {
		return null;
	}
	const active = pag?.colorHover || pag?.colorNormal;
	if (!active) {
		return null;
	}
	return pagColorToken(active);
};

export const pagActiveTextColor = (pag) => {
	const activeFromHover = pag?.colorHover;
	const activeFallback = pag?.colorNormal;
	if (activeFromHover) {
		return pagColorToken(activeFromHover);
	}
	if (activeFallback) {
		return pagColorToken(activeFallback);
	}
	return null;
};

export const pagBg = (pag) => {
	if (isTransparentOrUnsetBg(pag?.bgNormal)) {
		return null;
	}
	return pagColorToken(pag.bgNormal);
};

export const pagActiveBg = (pag) => {
	if (!isTransparentOrUnsetBg(pag?.bgHover)) {
		return pagColorToken(pag.bgHover);
	}
	if (!isTransparentOrUnsetBg(pag?.bgNormal)) {
		return pagColorToken(pag.bgNormal);
	}
	return null;
};

export const pagBorderStyle = (pag) => {
	if (!pag?.borderNormal?.style) {
		return null;
	}
	return String(pag.borderNormal.style);
};

export const pagActiveBorderStyle = (pag) => {
	if (!pag?.borderNormal?.style) {
		return null;
	}
	return String(pag.borderNormal.style);
};

export const pagBorderColor = (pag) => {
	if (!pag?.borderNormal?.color) {
		return null;
	}
	return pagColorToken(pag.borderNormal.color);
};

export const pagActiveBorderColor = (pag) => {
	if (pag?.borderHover?.color) {
		return pagColorToken(pag.borderHover.color);
	}
	if (pag?.borderNormal?.color) {
		return pagColorToken(pag.borderNormal.color);
	}
	return null;
};

export const pagBorderWidth = (pag) => {
	if (typeof pag?.borderWidthNormal?.value?.top === 'undefined') {
		return null;
	}
	const unit = pag?.borderWidthNormal?.unit || 'px';
	return `${pag.borderWidthNormal.value.top}${unit}`;
};

export const pagActiveBorderWidth = (pag) => {
	if (typeof pag?.borderWidthNormal?.value?.top === 'undefined') {
		return null;
	}
	const unit = pag?.borderWidthNormal?.unit || 'px';
	return `${pag.borderWidthNormal.value.top}${unit}`;
};
