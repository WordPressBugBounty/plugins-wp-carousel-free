/**
 * Navigation arrows dynamic CSS generator.
 *
 * Owned by the carousel-style block. `--wpcp-nav-*` vars are set on the block
 * root (`#<uniqueId>`) so layout wrappers and arrow buttons inherit them; show-
 * on-hover opacity still targets `.wpcp-navigation`. There is no sub-block
 * uniqueId.
 *
 * Border style and width are shared across normal/hover; only color differs.
 *
 * PHP mirror: src/Blocks/Rendering/NavigationBuilder::render_navigation_dynamic_css().
 */

import {
	objectToCssString,
	mergeCssRulesBySelector,
	wrapInMediaQuery,
	dropRulesMatchingBaseline,
} from './cssUtils';
import { TABLET_MEDIA_QUERY, MOBILE_MEDIA_QUERY } from './constants';
import { getBoxShadowValue } from './cssHelpers';
import { resolveNavPosition } from '../constants/freeValues';

const DEVICES = ['Desktop', 'Tablet', 'Mobile'];

const clamp = (value, min, max, fallback) => {
	const n = Number(value);
	if (!Number.isFinite(n)) {
		return fallback;
	}
	return Math.min(max, Math.max(min, n));
};

const ALLOWED_UNITS = new Set(['px', '%', 'em']);

const sanitizeUnit = (raw) => {
	const u = String(raw || 'px').toLowerCase();
	return ALLOWED_UNITS.has(u) ? u : 'px';
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

// Arrow size is bounded identically here and in the PHP mirror. Clamping on one
// side only is what made an em value render at two different sizes.
const ARROW_SIZE_MIN = 0;
const ARROW_SIZE_MAX = 200;

const getArrowSize = (field, device, fallbackPx) => {
	if (!field?.device) {
		return { value: fallbackPx, unit: 'px' };
	}
	const n = Number(getDeviceValue(field.device, device, undefined));
	if (!Number.isFinite(n)) {
		return { value: fallbackPx, unit: 'px' };
	}
	return {
		value: Math.min(ARROW_SIZE_MAX, Math.max(ARROW_SIZE_MIN, n)),
		unit: sanitizeUnit(getDeviceValue(field.unit, device, 'px')),
	};
};

// A px resolution of the arrow size, for the vertical-nav rules that reserve
// room beside the stage — a margin or an offset in `em`/`%` would resolve
// against the wrong box there. 1em is taken as 16px; a percentage is read as a
// share of the device fallback.
const arrowSizeToPx = ({ value, unit }, fallbackPx) => {
	if ('em' === unit) {
		return value * 16;
	}
	if ('%' === unit) {
		return (value / 100) * fallbackPx;
	}
	return value;
};

const getSpacingDevice = (spacing, device) => {
	if (!spacing?.device?.[device]) {
		return null;
	}
	const unitRaw = spacing.unit;
	const unit =
		typeof unitRaw === 'object' && unitRaw !== null
			? getDeviceValue(unitRaw, device, 'px')
			: unitRaw || 'px';
	const v = spacing.device[device];
	return {
		unit,
		top: Number(v.top ?? 0),
		right: Number(v.right ?? 0),
		bottom: Number(v.bottom ?? 0),
		left: Number(v.left ?? 0),
	};
};

const getLengthValue = (field, fallback = 0) => {
	if (field && typeof field === 'object') {
		return {
			value: clamp(field.value, -200, 200, fallback),
			unit: sanitizeUnit(field.unit),
		};
	}
	return {
		value: clamp(field, -200, 200, fallback),
		unit: 'px',
	};
};

const formatOffset = ({ value, unit }) => `${clamp(value, -200, 200, 0)}${unit}`;

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

const VERTICAL_NAV_POSITIONS = new Set([
	'nav-vertical-center-inner',
	'nav-vertically-inner-and-outer',
	'nav-vertical-center',
]);

// Mirror of navigationDefaults.js — keep in sync with the panel gating/clamp.
const OFFSET_X_HIDDEN_POSITIONS = new Set(['nav-vertical-center']);
const OFFSET_X_POSITIVE_ONLY_POSITIONS = new Set([
	'nav-vertical-center-inner',
	'nav-vertically-inner-and-outer',
]);

const ALLOWED_BORDER_STYLES = new Set([
	'none',
	'hidden',
	'dotted',
	'dashed',
	'solid',
	'double',
	'groove',
	'ridge',
	'inset',
	'outset',
]);

const sanitizeBorderStyle = (raw) => {
	const value = String(raw || 'solid')
		.trim()
		.toLowerCase();
	return ALLOWED_BORDER_STYLES.has(value) ? value : 'solid';
};

/**
 * How far each side arrow is shifted off the stage edge, as a share of its own
 * button box.
 *
 * A percentage in `translate` resolves against the element it sits on, so the
 * browser measures the button for us and the arrow size never enters the
 * geometry. "Sides Center" straddles the edge; "Sides Outer" clears the stage on
 * desktop and falls back to straddling at tablet/mobile so the arrows stay
 * reachable on narrow viewports. Returns null for every other position.
 *
 * @param {string} position Navigation position preset key.
 * @param {string} device   Device key ('Desktop' | 'Tablet' | 'Mobile').
 * @return {string|null} Percentage for --wpcp-nav-straddle, or null.
 */
const getNavStraddle = (position, device) => {
	if ('nav-vertical-center' === position) {
		return '50%';
	}
	if ('nav-vertically-inner-and-outer' === position) {
		return 'Desktop' === device ? '100%' : '50%';
	}
	return null;
};

const navigationDynamicCss = (blockUniqueId, navigationOptions) => {
	if (!blockUniqueId) {
		return '';
	}
	const nav = navigationOptions ?? {};

	const position = resolveNavPosition(nav?.position);
	const showGap = !VERTICAL_NAV_POSITIONS.has(position);
	const offsetX = getLengthValue(nav?.offsetX);
	const offsetY = getLengthValue(nav?.offsetY);

	// Offset X is hidden (centered presets) or single-direction (side presets);
	// neutralize/clamp the emitted value so stale input can't shift centered
	// arrows and side arrows only move their one intended way.
	if (OFFSET_X_HIDDEN_POSITIONS.has(position)) {
		offsetX.value = 0;
	} else if (OFFSET_X_POSITIVE_ONLY_POSITIONS.has(position)) {
		offsetX.value = Math.max(0, offsetX.value);
	}
	const GAP_DEFAULT = 10;
	const rawGap = nav.gapBetweenArrows;
	const gapNum =
		rawGap === undefined || rawGap === null || rawGap === ''
			? GAP_DEFAULT
			: Math.max(0, Math.min(200, Number(rawGap) || 0));
	const gapPx = showGap ? gapNum : 0;

	// Scope CSS vars on the block root so layout rules (stage padding, arrow
	// offsets) and `.wpcp-nav` buttons inherit `--wpcp-nav-*` consistently.
	const blockRoot = `#${blockUniqueId}`;
	const varSelector = blockRoot;
	const rulesByDevice = {
		Desktop: [],
		Tablet: [],
		Mobile: [],
	};

	DEVICES.forEach((device) => {
		const styleVars = {};

		const arrowSizeFallback = 'Mobile' === device ? 14 : 16;
		const arrowSize = getArrowSize(nav?.arrowSize, device, arrowSizeFallback);
		styleVars['--wpcp-nav-arrow-size'] = `${arrowSize.value}${arrowSize.unit}`;
		styleVars['--wpcp-nav-arrow-space'] = `${arrowSizeToPx(arrowSize, arrowSizeFallback)}px`;

		if (showGap && gapPx > 0) {
			styleVars['--wpcp-nav-gap'] = `${gapPx}px`;
		}

		if (offsetX.value) {
			styleVars['--wpcp-nav-offset-x'] = formatOffset(offsetX);
		}
		if (offsetY.value) {
			styleVars['--wpcp-nav-offset-y'] = formatOffset(offsetY);
		}

		const padding = getSpacingDevice(nav?.padding, device);

		const straddle = getNavStraddle(position, device);
		if (straddle) {
			styleVars['--wpcp-nav-straddle'] = straddle;
		}

		if (nav?.colorNormal) {
			styleVars['--wpcp-nav-color'] = nav.colorNormal;
		}
		if (!isTransparentOrUnsetBg(nav?.bgNormal)) {
			styleVars['--wpcp-nav-bg'] = nav.bgNormal;
		}

		// Border style + width are shared across normal/hover; old blocks can
		// miss these keys until the Style tab is opened, so emit defaults here.
		styleVars['--wpcp-nav-border-style'] = sanitizeBorderStyle(nav?.borderNormal?.style);
		styleVars['--wpcp-nav-border-color'] = nav?.borderNormal?.color || '#cccccc';
		styleVars['--wpcp-nav-border-width'] = `${
			typeof nav?.borderWidthNormal?.value?.top !== 'undefined' ? nav.borderWidthNormal.value.top : 1
		}${nav?.borderWidthNormal?.unit || 'px'}`;

		if (nav?.colorHover) {
			styleVars['--wpcp-nav-hover-color'] = nav.colorHover;
		}
		if (!isTransparentOrUnsetBg(nav?.bgHover)) {
			styleVars['--wpcp-nav-hover-bg'] = nav.bgHover;
		}
		if (nav?.borderHover?.color) {
			styleVars['--wpcp-nav-hover-border-color'] = nav.borderHover.color;
		}

		// Box-shadow: emit only when the state's toggle is on (getBoxShadowValue
		// itself does not gate on isActive). Hover falls back to the normal shadow
		// via the static `var(--wpcp-nav-box-shadow)` fallback in style.scss.
		if (nav?.boxShadowNormal?.isActive) {
			const boxShadowNormalValue = getBoxShadowValue(nav.boxShadowNormal);
			if (boxShadowNormalValue) {
				styleVars['--wpcp-nav-box-shadow'] = boxShadowNormalValue;
			}
		}
		if (nav?.boxShadowHover?.isActive) {
			const boxShadowHoverValue = getBoxShadowValue(nav.boxShadowHover);
			if (boxShadowHoverValue) {
				styleVars['--wpcp-nav-hover-box-shadow'] = boxShadowHoverValue;
			}
		}

		const borderRadius = getSpacingDevice(nav?.borderRadius, device);
		if (borderRadius) {
			styleVars['--wpcp-nav-border-radius'] =
				borderRadius.top === borderRadius.right &&
				borderRadius.right === borderRadius.bottom &&
				borderRadius.bottom === borderRadius.left
					? `${borderRadius.top}${borderRadius.unit}`
					: `${borderRadius.top}${borderRadius.unit} ${borderRadius.right}${borderRadius.unit} ${borderRadius.bottom}${borderRadius.unit} ${borderRadius.left}${borderRadius.unit}`;
		}

		if (padding) {
			styleVars['--wpcp-nav-padding'] =
				padding.top === padding.right &&
				padding.right === padding.bottom &&
				padding.bottom === padding.left
					? `${padding.top}${padding.unit}`
					: `${padding.top}${padding.unit} ${padding.right}${padding.unit} ${padding.bottom}${padding.unit} ${padding.left}${padding.unit}`;
		}

		rulesByDevice[device].push({
			class: varSelector,
			styles: styleVars,
		});
	});

	// Declare each var once: a Tablet/Mobile value equal to the wider-breakpoint
	// cascade is a no-op, so only emit the device-specific deltas.
	const desktopMerged = mergeCssRulesBySelector(rulesByDevice.Desktop);
	const tabletMerged = mergeCssRulesBySelector(rulesByDevice.Tablet);
	const mobileMerged = mergeCssRulesBySelector(rulesByDevice.Mobile);

	const desktopCss = objectToCssString(desktopMerged);
	const tabletCss = wrapInMediaQuery(
		objectToCssString(dropRulesMatchingBaseline(tabletMerged, [desktopMerged])),
		TABLET_MEDIA_QUERY
	);
	const mobileCss = wrapInMediaQuery(
		objectToCssString(dropRulesMatchingBaseline(mobileMerged, [desktopMerged, tabletMerged])),
		MOBILE_MEDIA_QUERY
	);

	return `${desktopCss} ${tabletCss} ${mobileCss}`.trim();
};

export default navigationDynamicCss;
