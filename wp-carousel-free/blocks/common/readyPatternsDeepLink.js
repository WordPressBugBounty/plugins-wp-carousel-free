/**
 * Ready Patterns deep link — the one contract shared by the dashboard (which
 * builds the link) and the editor (which consumes it).
 *
 * `post-new.php?post_type=page&wpcp_pattern_library[=<block-slug>]` opens a new
 * page with the Ready Patterns Library already open. A block slug pre-filters
 * the library to that block; a bare flag opens it unfiltered.
 *
 * Kept free of editor-only imports so the dashboard bundle can share it.
 */

export const PATTERN_LIBRARY_QUERY_PARAM = 'wpcp_pattern_library';

export const PATTERN_LIBRARY_EDITOR_PATH = 'post-new.php?post_type=page';

/**
 * Build the editor URL that opens the Ready Patterns Library.
 *
 * @param {string} adminUrl  Admin base URL as WordPress localizes it (`admin_url( '/' )`).
 * @param {string} blockSlug Block slug to pre-filter by (e.g. `carousel`); empty for unfiltered.
 * @return {string} Editor URL.
 */
export function buildPatternLibraryEditorUrl(adminUrl, blockSlug = '') {
	const base = `${String(adminUrl || '').replace(/\/+$/, '')}/${PATTERN_LIBRARY_EDITOR_PATH}`;
	const slug = String(blockSlug || '').trim();
	return slug
		? `${base}&${PATTERN_LIBRARY_QUERY_PARAM}=${encodeURIComponent(slug)}`
		: `${base}&${PATTERN_LIBRARY_QUERY_PARAM}`;
}

/**
 * Read the deep-link request out of a query string.
 *
 * @param {string} search `location.search` (leading `?` optional).
 * @return {{ requested: boolean, blockSlug: string }} `requested` is false when the flag is
 *                                                     absent; `blockSlug` is '' for a bare flag.
 */
export function parsePatternLibraryQuery(search) {
	const params = new URLSearchParams(String(search || ''));
	if (!params.has(PATTERN_LIBRARY_QUERY_PARAM)) {
		return { requested: false, blockSlug: '' };
	}
	return {
		requested: true,
		blockSlug: String(params.get(PATTERN_LIBRARY_QUERY_PARAM) || '').trim(),
	};
}
