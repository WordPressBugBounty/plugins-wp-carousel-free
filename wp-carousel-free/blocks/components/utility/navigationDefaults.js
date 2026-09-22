// All defaults and pure helpers live here so they are never recreated mid-render.

export const DEFAULT_BORDER = { style: 'none', color: '#cccccc' };
export const DEFAULT_BORDER_WIDTH = { unit: 'px', value: { top: 0, right: 0, bottom: 0, left: 0 } };
export const DEFAULT_SPACING_VALUE = { top: 0, right: 0, bottom: 0, left: 0 };
export const DEFAULT_BORDER_RADIUS_VALUE = { top: 50, right: 50, bottom: 50, left: 50 };

export const POSITION_OPTIONS = [
	{ label: 'Vertical Inner', value: 'nav-vertical-center-inner' },
	{ label: 'Vertical Outer', value: 'nav-vertically-inner-and-outer' },
	{ label: 'Vertical Center', value: 'nav-vertical-center' },
];

// Positions where arrows stack vertically — horizontal gap control does not apply.
export const VERTICAL_NAV_POSITIONS = new Set([
	'nav-vertical-center-inner',
	'nav-vertically-inner-and-outer',
	'nav-vertical-center',
]);

export function createSpacingDefaults(initial = 0, unit = 'px') {
	return {
		allChange: true,
		unit: { Desktop: unit, Tablet: unit, Mobile: unit },
		device: { Desktop: { top: initial, right: initial, bottom: initial, left: initial } },
	};
}

export function normalizeSpacingAttr(value, fallback = 0, unit = 'px') {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	const initial = Number.isFinite(Number(value)) ? Number(value) : fallback;
	return createSpacingDefaults(initial, unit);
}

/**
 * Returns a merged arrowSize object that preserves any existing per-device values.
 * @param {Object} prev
 * @param {string} deviceType
 * @param {number} value
 */
export function mergeArrowSize(prev = {}, deviceType, value) {
	return {
		device: { Desktop: 44, Tablet: 44, Mobile: 44, ...prev.device, [deviceType]: value },
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px', ...prev.unit },
	};
}

export function mergeArrowSizeUnit(prev = {}, deviceType, unit) {
	return {
		device: { Desktop: 44, Tablet: 44, Mobile: 44, ...prev.device },
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px', ...prev.unit, [deviceType]: unit },
	};
}
