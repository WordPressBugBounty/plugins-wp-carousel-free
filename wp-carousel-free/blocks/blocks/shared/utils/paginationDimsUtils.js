/**
 * Per-style pagination dimensions (responsive device + unit).
 * Shared by edit UI and paginationDynamicCss.
 */

/**
 * @param {number} v   Value for Desktop/Tablet/Mobile.
 * @param {string} [u] Unit.
 */
function dev3(v, u = 'px') {
	return {
		device: { Desktop: v, Tablet: v, Mobile: v },
		unit: { Desktop: u, Tablet: u, Mobile: u },
	};
}

/**
 * @param {number} w   Width.
 * @param {number} h   Height.
 * @param {string} [u] Unit.
 */
function pairWH(w, h, u = 'px') {
	return {
		width: dev3(w, u),
		height: dev3(h, u),
	};
}

export const PAGINATION_STYLE_KEYS = ['dots', 'dynamic', 'stepper'];

/** Defaults when no saved `dims` (or partial). */
export const DEFAULT_PAGINATION_DIMS = {
	dots: pairWH(12, 12),
	dynamic: pairWH(12, 12),
	stepper: pairWH(14, 5),
};

const getDeviceValue = (obj, device, fallback) => {
	if (!obj || typeof obj !== 'object') {
		return fallback;
	}
	if (typeof obj[device] !== 'undefined') {
		return obj[device];
	}
	if (typeof obj.Desktop !== 'undefined') {
		return obj.Desktop;
	}
	return fallback;
};

/**
 * Shallow-merge saved dims over defaults (per style, per field).
 *
 * @param {Record<string, unknown>|undefined} stored Saved dims from block attributes.
 * @return {typeof DEFAULT_PAGINATION_DIMS} Full dims with defaults filled in.
 */
export function mergePaginationDims(stored) {
	const out = JSON.parse(JSON.stringify(DEFAULT_PAGINATION_DIMS));
	if (!stored || typeof stored !== 'object') {
		return out;
	}
	PAGINATION_STYLE_KEYS.forEach((key) => {
		if (!stored[key] || typeof stored[key] !== 'object') {
			return;
		}
		const defStyle = out[key];
		Object.keys(stored[key]).forEach((field) => {
			const sav = stored[key][field];
			if (!sav || typeof sav !== 'object' || !sav.device) {
				return;
			}
			const base =
				defStyle[field] && defStyle[field].device ? defStyle[field] : { device: {}, unit: {} };
			defStyle[field] = {
				device: { ...base.device, ...sav.device },
				unit: { ...base.unit, ...sav.unit },
			};
		});
	});
	return out;
}

/**
 * Resolved dims for all styles (saved `dims` merged over the defaults).
 *
 * @param {Record<string, unknown>} options Pagination block options.
 * @return {typeof DEFAULT_PAGINATION_DIMS} Resolved dimensions for every style.
 */
export function getResolvedPaginationDims(options) {
	return mergePaginationDims(options.dims);
}

/**
 * @param {typeof DEFAULT_PAGINATION_DIMS} allDims Merged dims object.
 * @param {string}                         style   Active pagination style key.
 * @return {Record<string, unknown>} Dimension fields for that style.
 */
export function getStyleDims(allDims, style) {
	const key = PAGINATION_STYLE_KEYS.includes(style) ? style : 'dots';
	return allDims[key] || allDims.dots;
}

export { getDeviceValue };
