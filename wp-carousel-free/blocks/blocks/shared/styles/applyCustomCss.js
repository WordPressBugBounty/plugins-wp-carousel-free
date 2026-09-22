/**
 * Apply per-block custom CSS with the `selector` keyword swapped for the
 * instance wrapper (`#uniqueId`). Must stay byte-identical to
 * CarouselDynamicCss::custom_css() on the PHP side.
 *
 * Every literal `selector` substring is replaced (plain global swap —
 * not CSS-aware, so substrings inside other identifiers are also swapped).
 *
 * @param {string} css             Author CSS (may contain the `selector` token).
 * @param {string} wrapperSelector Instance root selector, e.g. `#wpcp-abc123`.
 * @return {string} Ready-to-emit CSS, or '' when empty.
 */
export function applyCustomCss(css, wrapperSelector) {
	if (!css || 'string' !== typeof css) {
		return '';
	}

	const trimmed = css.trim();
	if (!trimmed) {
		return '';
	}

	// Defense-in-depth: strip </style so a payload cannot break out of <style>.
	const stripped = trimmed.replace(/<\/style/gi, '');

	return stripped.split('selector').join(wrapperSelector);
}

export default applyCustomCss;
