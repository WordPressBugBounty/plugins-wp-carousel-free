/**
 * CSS Utilities
 *
 * Shared CSS generation helpers extracted.
 * Used by dynamicCss.js for per-instance attribute-driven CSS generation.
 */

/**
 * Merge rules that share the same selector so output is one block per selector.
 * Later rules override earlier ones for the same CSS property (matching cascade).
 *
 * @param {Array<{ class: string, styles: Record<string, string|number> }>} cssRules - CSS rules to merge
 * @return {Array<{ class: string, styles: Record<string, string|number> }>} Merged CSS rules
 */
export const mergeCssRulesBySelector = (cssRules) => {
	const map = new Map();
	for (const rule of cssRules) {
		if (!rule?.class || !rule.styles || typeof rule.styles !== 'object') {
			continue;
		}
		const prev = map.get(rule.class) || {};
		map.set(rule.class, { ...prev, ...rule.styles });
	}
	return [...map.entries()].map(([className, styles]) => ({ class: className, styles }));
};

/**
 * Build a { selector: { prop: value } } index from one or more merged-rule arrays.
 * Later arrays override earlier ones per selector + property (cascade order).
 *
 * @param {...Array} ruleArrays - Arrays of { class, styles } rules.
 * @return {Object} Selector → merged styles map.
 */
const indexRulesBySelector = (...ruleArrays) => {
	const index = {};
	for (const rules of ruleArrays) {
		for (const rule of rules || []) {
			if (!rule?.class || !rule.styles || typeof rule.styles !== 'object') {
				continue;
			}
			index[rule.class] = { ...(index[rule.class] || {}), ...rule.styles };
		}
	}
	return index;
};

/**
 * Strip declarations from a narrower breakpoint's rules when they repeat the value
 * already in effect from the wider breakpoint(s). A media-query declaration whose
 * value matches the cascade-inherited value is a no-op, so dropping it leaves every
 * computed style unchanged while shrinking the emitted CSS. Rules left with no
 * declarations are removed entirely. Mirrored in PHP as
 * `CssUtils::drop_rules_matching_baseline()`.
 *
 * @param {Array}        rules     - Merged rules for the narrower breakpoint (Tablet/Mobile).
 * @param {Array<Array>} baselines - Wider-breakpoint merged-rule arrays, widest first
 *                                 (`[desktop]` for Tablet, `[desktop, tablet]` for Mobile).
 * @return {Array} Rules with redundant declarations (and emptied rules) removed.
 */
export const dropRulesMatchingBaseline = (rules, baselines) => {
	const baseline = indexRulesBySelector(...baselines);
	const result = [];
	for (const rule of rules || []) {
		if (!rule?.class || !rule.styles || typeof rule.styles !== 'object') {
			continue;
		}
		const baselineStyles = baseline[rule.class] || {};
		const styles = {};
		for (const [prop, value] of Object.entries(rule.styles)) {
			if (baselineStyles[prop] !== value) {
				styles[prop] = value;
			}
		}
		if (Object.keys(styles).length > 0) {
			result.push({ class: rule.class, styles });
		}
	}
	return result;
};

/**
 * Convert CSS rules object to CSS string.
 *
 * @param {Array} cssRules - Array of { class: string, styles: Object } rules
 * @return {string} CSS string with rules
 */
export const objectToCssString = (cssRules) => {
	return cssRules
		.map((rule) => {
			const styles = Object.entries(rule.styles)
				.map(([prop, value]) => {
					// Allow 0 (opacity, flex-grow, etc.) — do not use !value
					if (value === undefined || value === null || value === '') {
						return '';
					}
					// Defense-in-depth, mirrored from Css_Helpers::object_to_css_string():
					// block attributes reach this assembly point unsanitized, and a
					// single CSS value never legitimately contains the characters that
					// terminate a declaration (`;`), a rule block (`{`/`}`), or an HTML
					// tag (`<`/`>`). Drop any value carrying one to neutralize breakout.
					if (typeof value === 'string' && /[;{}<>]/.test(value)) {
						return '';
					}
					// Convert camelCase to kebab-case
					const kebabProp = prop.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
					return `${kebabProp}: ${value};`;
				})
				.filter(Boolean)
				.join(' ');
			return styles ? `${rule.class} { ${styles} }` : '';
		})
		.filter(Boolean)
		.join('\n');
};

/**
 * Wrap CSS in media query.
 *
 * @param {string} css   - CSS string to wrap
 * @param {string} query - Media query (e.g., "only screen and (max-width: 1023px)")
 * @return {string} Wrapped CSS or empty string if CSS is empty
 */
export const wrapInMediaQuery = (css, query) => {
	if (!css.trim()) {
		return '';
	}
	return `@media ${query} {\n${css}\n}`;
};

/**
 * Whitelist a CSS unit appended to a numeric value.
 *
 * Units arrive as raw attribute strings; anything outside the editor's unit
 * set (e.g. a smuggled `url(//evil)`) is dropped so it cannot ride a
 * `<number><unit>` value into the emitted <style>. Mirrors
 * Css_Helpers::sanitize_css_unit() on the PHP side.
 *
 * @param {string} unit - Raw unit from an attribute
 * @return {string} Allowed unit, or '' when not allowed
 */
export const sanitizeCssUnit = (unit) => {
	if (typeof unit !== 'string') {
		return '';
	}
	const normalized = unit.trim().toLowerCase();
	const allowed = ['px', 'em', 'rem', '%', 's', 'ms', 'vh', 'vw', 'deg'];
	return allowed.includes(normalized) ? normalized : '';
};

/**
 * Whitelist a box-shadow preset token (`var(--wpcp-shadow-<slug>)`).
 * Mirrors Css_Helpers::sanitize_shadow_preset() on the PHP side.
 *
 * @param {string} preset - Raw selectDefault value
 * @return {string} Allowed preset token, or '' when not allowed
 */
export const sanitizeShadowPreset = (preset) => {
	if (typeof preset !== 'string') {
		return '';
	}
	const normalized = preset.trim();
	return /^var\(--wpcp-shadow-[a-z0-9-]+\)$/.test(normalized) ? normalized : '';
};

/**
 * Get unit for device from attributes.
 * Handles both string units (e.g., "px") and device-specific object units.
 *
 * @param {Object} attributes - Attributes object with unit property
 * @param {string} deviceType - Device type (Desktop, Tablet, Mobile)
 * @return {string|undefined} Unit value
 */
export const getUnit = (attributes, deviceType) => {
	if ('object' !== typeof attributes?.unit) {
		return attributes?.unit;
	}
	return attributes?.unit[deviceType];
};

/**
 * Format value with unit, return empty if undefined.
 *
 * @param {*}      value - Value to format
 * @param {string} unit  - Unit to append (e.g., "px", "em")
 * @return {string} Formatted value with unit or empty string
 */
export const cssDataCheck = (value, unit = '') => {
	if (value === undefined) {
		return '';
	}

	if (typeof value === 'object') {
		const filtered = Object.values(value).filter(
			(val) => val !== null && val !== undefined && val?.toString().trim().length > 0
		);

		// if nothing left, return empty string
		if (filtered.length === 0) {
			return '';
		}

		return filtered.map((val) => `${val}${sanitizeCssUnit(unit)}`).join(' ');
	}
	return value.toString().trim().length > 0 ? `${value}${sanitizeCssUnit(unit)}` : '';
};
