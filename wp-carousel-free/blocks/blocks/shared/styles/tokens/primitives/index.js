/**
 * Token transform primitives (editor side).
 *
 * Pure functions that convert a raw attribute value into a CSS token value, keyed
 * by the `transform` name a style-config row carries. Mirrored decision-for-value
 * on the PHP side by `Tokens/Primitives/Primitives.php`; the shared transform
 * fixtures (Phase 4) assert both sides produce the same output from the same input.
 *
 * Contract: `(value, row, device) => string | null`. Return `null` to emit
 * nothing (the emitter skips it). The emitter has already applied the
 * EmissionPolicy (unset / equals-default suppression) before calling a primitive,
 * so a primitive only formats a present, non-default value.
 *
 * Import invariant: primitives import nothing from the emitter or the composer.
 */

import { hasResponsiveSpacing } from '../../cssRuleHelpers';
import { sanitizeCssColor } from '../../sanitizeCssColor';
import { sanitizeCssUnit, sanitizeShadowPreset } from '../../cssUtils';

// Strict finite-number coercion (matches PHP is_numeric — a unit string like
// "8px" or "" → null, NOT a leading-number parse). Keeps JS↔PHP px parity.
const toFiniteNumber = (value) => {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}
	const trimmed = String(value ?? '').trim();
	if (trimmed === '') {
		return null;
	}
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) ? numeric : null;
};

// Spacing-side coercion. Unset sides arrive as '' (the Spacing control's empty
// marker) or null/undefined — not undefined-from-absence — so a destructuring
// default never fires. Without this, a margin edited on one side only emits
// `24px px px px`; this turns each unset side into 0 (`24px 0px 0px 0px`).
const toSpacingSide = (value) => toFiniteNumber(value) ?? 0;

/**
 * Verbatim string value.
 *
 * @param {*} value Raw value.
 * @return {string|null} Stringified value, or null when nullish.
 */
export const raw = (value) => (value === null || value === undefined ? null : String(value));

/**
 * Length with unit. Accepts a number/numeric string (→ `Npx`) or a
 * `{ value, unit }` pair (→ `<value><unit>`).
 *
 * @param {*} value Raw value.
 * @return {string|null} Length string, or null.
 */
export const px = (value) => {
	if (value && typeof value === 'object' && 'value' in value) {
		const numeric = toFiniteNumber(value.value);
		if (numeric === null) {
			return null;
		}
		const safeUnit = sanitizeCssUnit(value.unit || 'px');
		return `${numeric}${safeUnit === '' ? 'px' : safeUnit}`;
	}
	const numeric = toFiniteNumber(value);
	return numeric === null ? null : `${numeric}px`;
};

/**
 * Sanitized CSS color (hex, rgb/rgba, hsl/hsla, transparent, currentColor).
 *
 * @param {*} value Raw value.
 * @return {string|null} Safe color, or null when empty / invalid.
 */
export const color = (value) => sanitizeCssColor(value);

/**
 * Opacity clamped to [0, 1].
 *
 * @param {*} value Raw value.
 * @return {string|null} Clamped opacity, or null.
 */
export const opacity = (value) => {
	const numeric = toFiniteNumber(value);
	if (numeric === null) {
		return null;
	}
	return String(Math.min(1, Math.max(0, numeric)));
};

/**
 * Spacing shorthand from a four-side value object. Mirrors cssDataCheck() in
 * cssUtils.js: each side that stringifies non-empty is suffixed with the resolved
 * unit and the sides are space-joined (e.g. `{top:2,right:0,bottom:0,left:2}` →
 * `2px 0px 0px 2px`). Accepts the attribute wrapper
 * `{ value: { top, right, bottom, left }, unit }`; `unit` may be a per-device map.
 *
 * @param {*} value Raw value.
 * @return {string|null} Spacing shorthand, or null when empty.
 */
export const spacing = (value) => {
	if (!value || typeof value !== 'object') {
		return null;
	}
	const sides = 'value' in value ? value.value : value;
	if (!sides || typeof sides !== 'object') {
		return null;
	}
	let unit = value.unit;
	if (unit && typeof unit === 'object') {
		unit = unit.Desktop;
	}
	if (typeof unit !== 'string' || unit.trim() === '') {
		unit = 'px';
	}
	const parts = Object.values(sides)
		.filter((side) => side !== null && side !== undefined && String(side).trim().length > 0)
		.map((side) => `${side}${unit}`);
	return parts.length === 0 ? null : parts.join(' ');
};

/**
 * Responsive dimension → `<number><unit>`. Mirrors `getSocialRangerDimension`
 * and its `${num}${unit}` consumer: parse the leading number, default the unit to
 * `px`. Receives the per-device `{ value, unit }` the emitter extracts (the unit
 * already carries the Desktop fallback), or a bare scalar.
 *
 * @param {*} value Extracted device value.
 * @return {string|null} Dimension string, or null when not a finite number.
 */
export const dimension = (value) => {
	let rawValue = value;
	let unit = 'px';
	if (value && typeof value === 'object' && 'value' in value) {
		rawValue = value.value;
		unit = value.unit || 'px';
	}
	if (rawValue === null || rawValue === undefined || rawValue === '') {
		return null;
	}
	const num = parseFloat(rawValue);
	if (Number.isNaN(num)) {
		return null;
	}
	const safeUnit = sanitizeCssUnit(unit);
	return `${num}${safeUnit === '' ? 'px' : safeUnit}`;
};

/**
 * Spacing shorthand with missing sides filled to `0` — mirrors `spacingGenerate`:
 * `top right bottom left` (each suffixed with the unit), or only the `top` value
 * when the row sets `single`. Receives the per-device `{ value: sides, unit }`;
 * returns null when no side is set (the per-device gate, computed-equivalent to the
 * legacy device-agnostic `hasResponsiveSpacing` guard since the static defaults are
 * all `0`).
 *
 * @param {*}      value Extracted device value `{ value: sides, unit }`.
 * @param {Object} [row] Config row; `row.single` emits only the top value.
 * @return {string|null} Spacing string, or null when no side is set.
 */
export const spacingBox = (value, row) => {
	const sides = value && typeof value === 'object' && 'value' in value ? value.value : value;
	if (!sides || typeof sides !== 'object') {
		return null;
	}
	const sideKeys = ['top', 'right', 'bottom', 'left'];
	const hasSide = sideKeys.some(
		(key) => sides[key] !== null && sides[key] !== undefined && sides[key] !== ''
	);
	if (!hasSide) {
		return null;
	}
	let unit = value && typeof value === 'object' ? value.unit : 'px';
	if (typeof unit !== 'string' || unit.trim() === '') {
		unit = 'px';
	}
	const top = toSpacingSide(sides.top);
	if (row?.single) {
		return `${top}${unit}`;
	}
	const right = toSpacingSide(sides.right);
	const bottom = toSpacingSide(sides.bottom);
	const left = toSpacingSide(sides.left);
	return `${top}${unit} ${right}${unit} ${bottom}${unit} ${left}${unit}`;
};

/**
 * Responsive spacing shorthand with the legacy fill / zero-fill emission policy —
 * mirrors `spacingGenerate` (cssHelpers.js) used behind the device-agnostic
 * `hasResponsiveSpacing` guard. Unlike `spacingBox` (per-device, static-first, emits
 * only the breakpoints the user touched), this ALWAYS emits on every device once the
 * control holds any value, zero-filling missing sides AND missing breakpoints to
 * `0<unit>`. That reproduces the legacy content-margin behavior where a Desktop-only
 * value forces Tablet/Mobile to 0 (the inherited custom property would otherwise
 * carry Desktop's value down) and overrides per-orientation card defaults at every
 * breakpoint. Pair with `always: true` + `wholeAttr: true` + `device: true`.
 *
 * Always emits the four-value form (ignores `allChange`/`isSingle`); for a linked
 * control the four sides are equal so the computed margin is identical to the legacy
 * single value, and for an unlinked control the four-value form is what the editor
 * already renders — which also reconciles the legacy JS↔PHP `allChange` divergence
 * (JS collapsed to a single value on a truthy flag, PHP on key existence).
 *
 * @param {*}      attr   Whole spacing attribute `{ device, unit, allChange }`.
 * @param {Object} [row]  Config row (unused; signature parity).
 * @param {string} device Device key (Desktop|Tablet|Mobile).
 * @return {string|null} Four-value spacing shorthand, or null when the control is empty.
 */
export const spacingFill = (attr, row, device) => {
	if (!hasResponsiveSpacing(attr)) {
		return null;
	}
	let unit = 'px';
	if (typeof attr.unit === 'string') {
		unit = attr.unit;
	} else if (attr.unit && typeof attr.unit[device] === 'string') {
		unit = attr.unit[device];
	}
	const sides = (attr.device && attr.device[device]) || {};
	const top = toSpacingSide(sides.top);
	const right = toSpacingSide(sides.right);
	const bottom = toSpacingSide(sides.bottom);
	const left = toSpacingSide(sides.left);
	return `${top}${unit} ${right}${unit} ${bottom}${unit} ${left}${unit}`;
};

/**
 * Tiles grid dimension (gap / row-height) — resolves a flat per-device tiles
 * attribute off `layoutOptions` (NOT the responsive-object shape): given a base key
 * in `row.base` (e.g. `gapHorizontal`), it reads `<base>`, `<base>Tablet`,
 * `<base>Mobile` for the value and `<base>Unit`, `<base>TabletUnit`,
 * `<base>MobileUnit` for the unit, applying the same `mobile ?? tablet ?? desktop ??
 * fallback` cascade as getTilesModeSettings / tiles_mode_settings. Pair with
 * `always: true` + `wholeAttr: true` + `device: true`; the value is truncated to an
 * integer to match the PHP `(int)` cast (so the JS↔PHP value-map agrees). Only the
 * tile gap / row-height **values** are tokenized; the grid-template / auto-rows
 * decision / bin-pack mode stay Layer-5 (tilesDynamicCss.js ↔ TilesCss).
 *
 * @param {*}      layoutOptions Whole `layoutOptions` attribute.
 * @param {Object} row           Config row; `row.base` + `row.fallback`.
 * @param {string} device        Device key (Desktop|Tablet|Mobile).
 * @return {string|null} `<value><unit>`, or null when layoutOptions is missing.
 */
export const tileGridDim = (layoutOptions, row, device) => {
	if (!layoutOptions || typeof layoutOptions !== 'object') {
		return null;
	}
	const base = row?.base || '';
	const fallback = row?.fallback ?? 0;
	const pick = (desktopKey, tabletKey, mobileKey) => {
		const desktopValue = layoutOptions[desktopKey];
		const tabletValue = layoutOptions[tabletKey];
		const mobileValue = layoutOptions[mobileKey];
		if ('Mobile' === device) {
			return mobileValue ?? tabletValue ?? desktopValue;
		}
		if ('Tablet' === device) {
			return tabletValue ?? desktopValue;
		}
		return desktopValue;
	};
	const rawValue = pick(base, `${base}Tablet`, `${base}Mobile`);
	const numeric =
		rawValue === '' || rawValue === null || rawValue === undefined
			? NaN
			: Math.trunc(Number(rawValue));
	const value = Number.isFinite(numeric) ? numeric : fallback;
	const rawUnit = pick(`${base}Unit`, `${base}TabletUnit`, `${base}MobileUnit`);
	const unit = typeof rawUnit === 'string' && rawUnit !== '' ? rawUnit : 'px';
	return `${value}${unit}`;
};

/**
 * Post-meta inter-part gap → `<value/2><unit>`. Mirrors the legacy editor
 * `parseInt(spacing.device[device]) / 2` (cssRuleHelpers consumer): the control
 * value is halved because the gap renders on both sides of each `::after`
 * separator. Receives the per-device `{ value, unit }` the emitter extracts (pair
 * with `device: true`); returns null when the value is not a finite number.
 *
 * Reconciles a legacy JS↔PHP divergence: the old PHP frontend computed
 * `intval($v || 12) / 2` (always `0.5<unit>` — a bug), while the editor used
 * `parseInt($v) / 2`. The shared transform makes both sides emit the editor's
 * (correct) value.
 *
 * @param {*} value Extracted device value (`{ value, unit }` or a bare scalar).
 * @return {string|null} Halved gap with unit, or null.
 */
export const metaGap = (value) => {
	let rawValue = value;
	let unit = 'px';
	if (value && typeof value === 'object' && 'value' in value) {
		rawValue = value.value;
		unit = value.unit || 'px';
	}
	if (rawValue === null || rawValue === undefined || rawValue === '') {
		return null;
	}
	const num = parseInt(rawValue, 10);
	if (Number.isNaN(num)) {
		return null;
	}
	const safeUnit = sanitizeCssUnit(unit);
	return `${num / 2}${safeUnit === '' ? 'px' : safeUnit}`;
};

// Remaining compound transforms — implemented as each feature is migrated;
// until then they emit nothing.
export const border = () => null;

/**
 * Box-shadow value — mirrors `getBoxShadowValue` in cssHelpers.js (the content-area
 * caller forces `isActive: true`, which that helper ignores). Returns null for an
 * empty or `none` result so the emitter suppresses it (matching the PHP legacy
 * guard `'none' !== $shadow`).
 *
 * @param {*} value The boxShadow{Normal|Hover} attribute object.
 * @return {string|null} Box-shadow string, or null.
 */
export const shadow = (value) => {
	if (!value || typeof value !== 'object') {
		return null;
	}
	const { color: shadowColor, selectDefault, value: sides, unit } = value;
	if (shadowColor === '') {
		return null;
	}
	if (selectDefault !== 'custom') {
		const preset = selectDefault || '';
		if (preset === '' || preset === 'none') {
			return null;
		}
		// Presets are our own var(--wpcp-shadow-*) tokens; anything else is
		// an untrusted string and is dropped.
		return sanitizeShadowPreset(preset) || null;
	}
	const shadowUnit = String(unit ?? '').toLowerCase();
	if (sides && typeof sides === 'object') {
		// Coerce each side through the strict numeric gate so an array/NaN
		// side cannot stringify as "Array" or "NaN" inside the value.
		const top = toFiniteNumber(sides.top ?? 0) ?? 0;
		const right = toFiniteNumber(sides.right ?? 0) ?? 0;
		const bottom = toFiniteNumber(sides.bottom ?? 0) ?? 0;
		const left = toFiniteNumber(sides.left ?? 0) ?? 0;
		const inset = shadowUnit === 'inset' ? 'inset ' : '';
		const safeColor = sanitizeCssColor(shadowColor);
		if (!safeColor) {
			return null;
		}
		const out = `${inset}${top}px ${right}px ${bottom}px ${left}px ${safeColor}`.trim();
		return out === '' ? null : out;
	}
	const out = String(sides ?? '').trim();
	return out === '' || out === 'none' ? null : out;
};

/**
 * Content title/desc color — resolves the polymorphic `contentOptions.{title,desc}Color`
 * attribute (a plain color string, or a `{ color, hoverColor }` object → `.color`)
 * and suppresses the schema default so the static stylesheet fallback renders
 * untouched. Mirrors resolveContentColorValue + the pushStylePropertyRuleIfDiffers
 * default guard (the editor side reconciled the same way; this also fixes the legacy
 * PHP `color: Array` bug, which emitted the raw object).
 *
 * @param {*}      value Raw attribute (string or `{ color, hoverColor }`).
 * @param {Object} [row] Config row; `row.default` is the suppressed schema default.
 * @return {string|null} Color string, or null to emit nothing.
 */
export const contentColor = (value, row) => {
	const resolved = value && typeof value === 'object' ? value.color ?? '' : value;
	if (resolved === null || resolved === undefined || resolved === '' || resolved === row?.default) {
		return null;
	}
	return sanitizeCssColor(resolved);
};

export const typography = () => null;

import {
	paginationGap,
	paginationDim,
	pagColor,
	pagTextColor,
	pagActiveColor,
	pagActiveTextColor,
	pagBg,
	pagActiveBg,
	pagBorderStyle,
	pagActiveBorderStyle,
	pagBorderColor,
	pagActiveBorderColor,
	pagBorderWidth,
	pagActiveBorderWidth,
} from './pagination';

export {
	paginationGap,
	paginationDim,
	pagColor,
	pagTextColor,
	pagActiveColor,
	pagActiveTextColor,
	pagBg,
	pagActiveBg,
	pagBorderStyle,
	pagActiveBorderStyle,
	pagBorderColor,
	pagActiveBorderColor,
	pagBorderWidth,
	pagActiveBorderWidth,
} from './pagination';

/** Registry: transform name → primitive. The emitter dispatches by name. */
export const primitives = {
	raw,
	px,
	color,
	opacity,
	dimension,
	spacing,
	spacingBox,
	spacingFill,
	tileGridDim,
	metaGap,
	border,
	shadow,
	contentColor,
	typography,
	paginationGap,
	paginationDim,
	pagColor,
	pagTextColor,
	pagActiveColor,
	pagActiveTextColor,
	pagBg,
	pagActiveBg,
	pagBorderStyle,
	pagActiveBorderStyle,
	pagBorderColor,
	pagActiveBorderColor,
	pagBorderWidth,
	pagActiveBorderWidth,
};

export default primitives;
