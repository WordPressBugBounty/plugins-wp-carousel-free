import { __ } from '@wordpress/i18n';
import { ARROW_ICON_OPTIONS } from '@wp-carousel-pro/icons/arrowIcons';
import { ARROW_STYLES as FREE_ARROW_STYLES } from '../../../../constants/freeValues';

/**
 * Arrow position presets. The three side presets are Free; the six top/bottom
 * presets stay listed as locked `(Pro)` options — SelectField renders them
 * disabled and refuses the write.
 */
export const POSITION_OPTIONS = [
	{ label: __('Sides Inner', 'wp-carousel-free'), value: 'nav-vertical-center-inner' },
	{ label: __('Sides Outer', 'wp-carousel-free'), value: 'nav-vertically-inner-and-outer' },
	{ label: __('Sides Center', 'wp-carousel-free'), value: 'nav-vertical-center' },
	{ label: __('Top Right', 'wp-carousel-free'), value: 'nav-top-right', pro: true },
	{ label: __('Top Center', 'wp-carousel-free'), value: 'nav-top-center', pro: true },
	{ label: __('Top Left', 'wp-carousel-free'), value: 'nav-top-left', pro: true },
	{ label: __('Bottom Left', 'wp-carousel-free'), value: 'nav-bottom-left', pro: true },
	{ label: __('Bottom Center', 'wp-carousel-free'), value: 'nav-bottom-center', pro: true },
	{ label: __('Bottom Right', 'wp-carousel-free'), value: 'nav-bottom-right', pro: true },
];

/**
 * Arrow Style picker options. Free renders the first preset only; the rest are
 * locked tiles that open the pricing page instead of writing the attribute.
 * Built from the shared icon set, which the Read More button icon library also
 * consumes unlocked — so the `pro` flags live here, not on ARROW_ICON_OPTIONS.
 */
export const ARROW_STYLE_OPTIONS = ARROW_ICON_OPTIONS.map((option) => ({
	...option,
	...(FREE_ARROW_STYLES.includes(option.value) ? {} : { pro: true }),
}));

/**
 * Side-arrow presets (arrows on the left & right edges); the horizontal "gap
 * between arrows" does not apply to opposite-side arrows — hide that control.
 */
export const VERTICAL_NAV_POSITIONS = new Set([
	'nav-vertical-center-inner',
	'nav-vertically-inner-and-outer',
	'nav-vertical-center',
]);

/** Presets where Offset X has no meaningful direction (arrows centered) — hide it. */
export const OFFSET_X_HIDDEN_POSITIONS = new Set(['nav-vertical-center']);

/**
 * Side presets where Offset X pushes arrows a single way (inward / outward) —
 * clamp the control to non-negative so it only moves in that direction.
 */
export const OFFSET_X_POSITIVE_ONLY_POSITIONS = new Set([
	'nav-vertical-center-inner',
	'nav-vertically-inner-and-outer',
]);

export { defaultNavPosition } from '../../../../constants/freeValues';

export const DEFAULT_BORDER = { style: 'solid', color: '#cccccc' };
export const DEFAULT_BORDER_WIDTH = {
	unit: 'px',
	value: { top: 1, right: 1, bottom: 1, left: 1 },
};
export const DEFAULT_SPACING_VALUE = { top: 0, right: 0, bottom: 0, left: 0 };
export const DEFAULT_BORDER_RADIUS_VALUE = { top: 50, right: 50, bottom: 50, left: 50 };
export const EMPTY_OBJECT = {};
export const NOOP = () => {};
export const DEFAULT_ARROW_SIZE = {
	device: { Desktop: 16, Tablet: 16, Mobile: 14 },
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
};
export const DEFAULT_OFFSET = { value: 0, unit: 'px' };

/** Box-shadow default — mirrors the navigationOptions schema default. */
export const DEFAULT_BOX_SHADOW = {
	isActive: false,
	selectDefault: 'var(--wpcp-shadow-medium-4dp)',
	color: 'rgba(0, 0, 0, 0.16)',
	unit: 'outset',
	value: { top: 0, right: 4, bottom: 6, left: 0 },
};

export function createSpacingDefaults(initial = 0, unit = 'px') {
	return {
		allChange: true,
		unit: { Desktop: unit, Tablet: unit, Mobile: unit },
		device: {
			Desktop: { top: initial, right: initial, bottom: initial, left: initial },
		},
	};
}

export function normalizeSpacingAttr(value, fallback = 0, unit = 'px') {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	const initial = Number.isFinite(Number(value)) ? Number(value) : fallback;
	return createSpacingDefaults(initial, unit);
}

export function normalizeLengthAttr(value, fallback = 0, unit = 'px') {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return {
			value: Number.isFinite(Number(value.value)) ? Number(value.value) : fallback,
			unit: typeof value.unit === 'string' ? value.unit : unit,
		};
	}
	return {
		value: Number.isFinite(Number(value)) ? Number(value) : fallback,
		unit,
	};
}

export const DEFAULT_BORDER_RADIUS_CONTROL = {
	unit: '%',
	value: DEFAULT_BORDER_RADIUS_VALUE,
	device: createSpacingDefaults(50, '%').device,
};

export const DEFAULT_PADDING_CONTROL = {
	unit: 'px',
	value: DEFAULT_SPACING_VALUE,
	device: createSpacingDefaults(0).device,
};
