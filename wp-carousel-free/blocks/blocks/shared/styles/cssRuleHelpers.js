/**
 * Shared CSS rule-building + responsive-value helpers for the editor dynamic-CSS
 * generators.
 *
 * Leaf module: it imports nothing from the `carouselDynamicCss` monolith, so the
 * per-concern generators (slider, thumbnails-slider, tiles, content-area, …) can
 * consume these without a circular dependency back into the file being decomposed.
 * All pure, except `pushStylePropertyRuleIfDiffers` which mutates the `rules`
 * accumulator it is handed.
 */

import { sanitizeCssUnit } from './cssUtils';

/** @typedef {'Desktop'|'Tablet'|'Mobile'} DeviceType */

/**
 * SPRangeControl-shaped value: { device: { Desktop, Tablet, Mobile }, unit: { ... } } or legacy scalar / flat map.
 *
 * @param {*}          attr   - Range attribute from block JSON.
 * @param {DeviceType} device - Breakpoint.
 * @return {{ num: number, unit: string }|null} Numeric size and CSS unit, or null.
 */
export const getSocialRangerDimension = (attr, device) => {
	if (attr === null || attr === undefined || attr === '') {
		return null;
	}
	if (typeof attr === 'number' && !Number.isNaN(attr)) {
		return { num: attr, unit: 'px' };
	}
	if (typeof attr === 'string' && attr !== '') {
		const n = parseFloat(attr, 10);
		return Number.isNaN(n) ? null : { num: n, unit: 'px' };
	}
	if (typeof attr === 'object') {
		if (
			attr.device &&
			attr.device[device] !== null &&
			attr.device[device] !== undefined &&
			attr.device[device] !== ''
		) {
			const num = parseFloat(attr.device[device], 10);
			if (Number.isNaN(num)) {
				return null;
			}
			let unit = 'px';
			if (attr.unit && typeof attr.unit === 'object') {
				unit = attr.unit[device] || attr.unit.Desktop || 'px';
			} else if (typeof attr.unit === 'string') {
				unit = attr.unit;
			}
			// Reject smuggled unit payloads (mirrors the PHP Css_Helpers::sanitize_css_unit gate).
			const safeUnit = sanitizeCssUnit(unit);
			return { num, unit: safeUnit === '' ? 'px' : safeUnit };
		}
		if (attr[device] !== null && attr[device] !== undefined && attr[device] !== '') {
			const num = parseFloat(attr[device], 10);
			return Number.isNaN(num) ? null : { num, unit: 'px' };
		}
	}
	return null;
};

/**
 * Whether a spacing control has any per-side values in its device map.
 *
 * @param {*} attr - Spacing attribute with optional `.device` map.
 * @return {boolean} True when at least one side is set for some breakpoint.
 */
export const hasResponsiveSpacing = (attr) =>
	attr?.device &&
	Object.values(attr.device).some(
		(d) =>
			d && ['top', 'right', 'bottom', 'left'].some((key) => d[key] !== undefined && d[key] !== '')
	);

/**
 * Whether a generated spacing shorthand is all-zero (e.g. "0px 0px 0px 0px",
 * "0px", "0em 0%"). Such a value equals the schema default and the static
 * stylesheet, so emitting it is redundant. Mirrored in PHP as
 * `SpacingCss::is_zero_spacing_value()`.
 *
 * @param {*} value - Generated spacing CSS string.
 * @return {boolean} True when every length token resolves to zero.
 */
export const isZeroSpacingValue = (value) =>
	typeof value === 'string' &&
	value.trim() !== '' &&
	value
		.trim()
		.split(/\s+/)
		.every((token) => parseFloat(token) === 0);

/**
 * Shared emission policy — the single contract that decides whether an attribute
 * value becomes dynamic CSS. Mirrored decision-for-decision on the PHP frontend
 * side in `src/Blocks/Styles/Concerns/EmissionPolicy.php`; the css-parity
 * value-map gate and the EmissionPolicy fixtures assert both sides decide
 * identically for the same inputs.
 *
 * Decision table — `(value, schemaDefault)`:
 *   `undefined` / `null` / `''`                         → no   (unset)
 *   `NaN`, or a string built from an absent number such
 *     as `${undefined}px` → `"undefinedpx"` / `${NaN}%` → no   (invalid; browsers drop it)
 *   `value === schemaDefault`                            → no   (covers `0` when default `0`)
 *   `0` with a non-zero default, or with no default      → yes
 *   any other present value (incl. `false`)              → yes
 *
 * Editor-only chrome is excluded at the call site /
 * corpus, not here.
 */

// A composed value string that interpolated an absent number — `${undefined}px`
// → "undefinedpx", `${NaN}%` → "NaN%". No legitimate CSS value starts this way.
const isComposedInvalidValue = (value) =>
	typeof value === 'string' && /^(?:undefined|NaN)/.test(value);

// Control value is present (allows `0` / `false`; excludes nullish, empty string, and numeric NaN).
export const hasResolvedOptionValue = (value) =>
	value !== undefined &&
	value !== null &&
	value !== '' &&
	!(typeof value === 'number' && Number.isNaN(value));

/**
 * Canonical emission policy on a raw attribute value (the shared JS↔PHP contract).
 *
 * @param {*} value           - Candidate value.
 * @param {*} [schemaDefault] - Schema default; a value equal to it is suppressed.
 *                            Omit to compare on presence only.
 * @return {boolean} True when the value should produce dynamic CSS.
 */
export const shouldEmit = (value, schemaDefault) =>
	hasResolvedOptionValue(value) && !isComposedInvalidValue(value) && value !== schemaDefault;

// Value should generate CSS: resolved, valid, and not the same as the baseline/default.
export const shouldEmitStyleProperty = (value, comparedDefault = null) =>
	shouldEmit(value, comparedDefault);

/**
 * Push a single-property rule into `rules` only when the value should emit
 * (present and different from the supplied default).
 *
 * @param {Array}  rules               - Rule accumulator (mutated in place).
 * @param {string} selector            - CSS selector.
 * @param {string} property            - CSS property name (camelCase accepted).
 * @param {*}      value               - Candidate value.
 * @param {*}      [defaultValue=null] - Value treated as a no-op (no rule emitted).
 */
export const pushStylePropertyRuleIfDiffers = (
	rules,
	selector,
	property,
	value,
	defaultValue = null
) => {
	if (!shouldEmitStyleProperty(value, defaultValue)) {
		return;
	}
	rules.push({ class: selector, styles: { [property]: value } });
};
