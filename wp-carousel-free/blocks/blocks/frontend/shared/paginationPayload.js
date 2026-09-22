/**
 * Parse the pagination attribute payload from a `.wpcp-ajax-pagination` wrapper.
 *
 * @param {HTMLElement|null} element        Pagination wrapper element.
 * @param {string}           [errorMessage] Console message logged when JSON.parse fails.
 * @return {Object|null} Parsed payload, or null when missing/invalid.
 */
export function readPaginationPayload(element, errorMessage = 'wpcp: invalid pagination payload') {
	if (!element) {
		return null;
	}
	const raw = element.getAttribute('data-wpcp-pagination');
	if (!raw) {
		return null;
	}
	try {
		return JSON.parse(raw);
	} catch (e) {
		// Bad JSON — bail out rather than throw past this handler.
		// eslint-disable-next-line no-console
		console.error(errorMessage, e);
		return null;
	}
}
