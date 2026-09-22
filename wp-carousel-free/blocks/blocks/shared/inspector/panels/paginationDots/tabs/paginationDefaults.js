import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from '@wp-carousel-pro/icons/icons';
import {
	DEFAULT_PAGINATION_DIMS,
	getResolvedPaginationDims,
} from '../../../../utils/paginationDimsUtils';

export const ALIGN_ITEMS = [
	{ label: <AlignLeftIcon />, value: 'left' },
	{ label: <AlignCenterIcon />, value: 'center' },
	{ label: <AlignRightIcon />, value: 'right' },
];

export const DEFAULT_BORDER = { style: 'none', color: '#cccccc' };
export const DEFAULT_BORDER_WIDTH = {
	unit: 'px',
	value: { top: 0, right: 0, bottom: 0, left: 0 },
};
export const DEFAULT_SPACING_VALUE = { top: 0, right: 0, bottom: 0, left: 0 };
export const EMPTY_OBJECT = {};
export const NOOP = () => {};
export const DEFAULT_DIM_UNITS = ['px', '%', 'em'];

export const DOTS_DYNAMIC_SIZE_DEFAULT = {
	device: { Desktop: 12, Tablet: 12, Mobile: 12 },
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
};

export const STEPPER_WIDTH_DEFAULT = {
	device: { Desktop: 14, Tablet: 14, Mobile: 14 },
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
};
export const STEPPER_HEIGHT_DEFAULT = {
	device: { Desktop: 5, Tablet: 5, Mobile: 5 },
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
};

export function createSpacingDefaults(initial = 0) {
	return {
		allChange: true,
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		device: {
			Desktop: { top: initial, right: initial, bottom: initial, left: initial },
		},
	};
}

export function normalizeMarginAttr(value, fallback = 0) {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	const initial = Number.isFinite(Number(value)) ? Number(value) : fallback;
	return createSpacingDefaults(initial);
}

export const DEFAULT_MARGIN_CONTROL = {
	unit: 'px',
	value: DEFAULT_SPACING_VALUE,
	device: createSpacingDefaults(0).device,
};

/**
 * @param {Record<string, unknown>}                                            options  Block options.
 * @param {string}                                                             style    Pagination style key.
 * @param {string}                                                             fieldKey Dim field (e.g. width).
 * @param {{ device?: Record<string, number>, unit?: Record<string, string> }} partial  Partial update.
 */
export function mergeDimField(options, style, fieldKey, partial) {
	const full = getResolvedPaginationDims(options);
	const prev = full[style]?.[fieldKey] || DEFAULT_PAGINATION_DIMS[style][fieldKey];
	const mergedField = {
		device: { ...prev.device, ...partial.device },
		unit: { ...prev.unit, ...partial.unit },
	};
	return {
		dims: {
			...(options.dims || {}),
			[style]: {
				...full[style],
				[fieldKey]: mergedField,
			},
		},
	};
}
