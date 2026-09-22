/**
 * Date and text formatters.
 */

/**
 * Format a date string to match WordPress's get_the_date() format.
 * Uses WordPress's default date format: "F j, Y" (e.g., "April 21, 2026").
 * @param {string} dateString - ISO date string or any date string parsable by Date
 * @return {string} Formatted date string or empty string if parsing fails
 */
export const formatDate = (dateString) => {
	if (!dateString || typeof dateString !== 'string') {
		return '';
	}
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) {
		// Return original if not parseable
		return dateString;
	}
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date);
};

/**
 * Convert an HTML fragment to its visible plain text.
 *
 * Resolves entities (e.g. &amp;) and drops tags while keeping their text
 * content, so markup like "Aut H<sub>2</sub>O" becomes "Aut H2O" for display
 * in plain-text labels such as dropdown options. Parsing goes through
 * DOMParser, which produces an inert document — unlike innerHTML on a detached
 * element, an <img src=x onerror> in the fragment never requests its source
 * or fires handlers.
 *
 * @param {string} html HTML fragment, typically a REST-rendered field.
 * @return {string} Trimmed plain text.
 */
export const stripHtml = (html) => {
	if (!html || typeof html !== 'string') {
		return '';
	}
	const doc = new window.DOMParser().parseFromString(html, 'text/html');
	// Script/style source would otherwise surface as visible text.
	doc.body.querySelectorAll('script,style').forEach((element) => element.remove());
	return (doc.body.textContent || '').trim();
};

/**
 * Truncate plain text by word or character count, appending an ellipsis when shortened.
 *
 * Mirrors PHP `wp_trim_words()` / `wp_html_excerpt()` behavior used in SlotRenderer.
 *
 * @param {string} text               Raw text (may contain HTML).
 * @param {Object} options            Truncation options.
 * @param {number} options.limit      Maximum words or characters.
 * @param {string} [options.unit]     `'word'` or `'char'` (default `'word'`).
 * @param {string} [options.ellipsis] Suffix when truncated (default `'...'`).
 * @return {string} Truncated plain text with ellipsis when shortened.
 */
export const truncateLimitedText = (text, { limit, unit = 'word', ellipsis = '...' } = {}) => {
	if (!text || typeof text !== 'string') {
		return '';
	}
	const numericLimit = Number(limit);
	if (!Number.isFinite(numericLimit) || 1 > numericLimit) {
		return text;
	}

	const plain = stripHtml(text);

	if ('char' === unit || 'letter' === unit) {
		if (plain.length <= numericLimit) {
			return plain;
		}
		return plain.slice(0, numericLimit) + ellipsis;
	}

	const words = plain.split(/\s+/).filter(Boolean);
	if (words.length <= numericLimit) {
		return plain;
	}
	return words.slice(0, numericLimit).join(' ') + ellipsis;
};

export const getWordLimitText = (text, wordLimit) => {
	return truncateLimitedText(text, { limit: wordLimit, unit: 'word', ellipsis: '' });
};
