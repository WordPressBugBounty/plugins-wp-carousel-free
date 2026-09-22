/**
 * Editor side of the Ready Patterns deep link
 * (`post-new.php?post_type=page&wpcp_pattern_library[=<block-slug>]`).
 *
 * The dashboard builds the link (`@wp-carousel-pro/common/readyPatternsDeepLink`);
 * this module reads it once on load, strips it from the address bar so a reload
 * does not reopen the library, and asks the editor-level host to open — with the
 * block's category pre-selected when the slug names a real block.
 */

import {
	PATTERN_LIBRARY_QUERY_PARAM,
	parsePatternLibraryQuery,
} from '@wp-carousel-pro/common/readyPatternsDeepLink';
import { BLOCK_NAME_TO_CATEGORY } from './constants';
import { openReadyPatterns } from './openerRegistry';

const BLOCK_NAME_PREFIX = 'wp-carousel-pro/';

/**
 * Resolve a deep-link slug to a registered block name.
 *
 * @param {string} blockSlug Slug from the URL (e.g. `carousel`).
 * @return {string|null} `wp-carousel-pro/<slug>` when that block has a library category, else null.
 */
export function blockNameFromSlug(blockSlug) {
	const slug = String(blockSlug || '').trim();
	if (!slug) {
		return null;
	}
	const blockName = `${BLOCK_NAME_PREFIX}${slug}`;
	return Object.prototype.hasOwnProperty.call(BLOCK_NAME_TO_CATEGORY, blockName) ? blockName : null;
}

/**
 * Remove the deep-link flag from the address bar without navigating.
 *
 * @param {Location} location Page location.
 * @param {History}  history  Page history.
 */
function stripDeepLinkParam(location, history) {
	const url = new URL(location.href);
	url.searchParams.delete(PATTERN_LIBRARY_QUERY_PARAM);
	history.replaceState(null, '', url.toString());
}

/**
 * Consume a Ready Patterns deep link on the current page, if there is one.
 *
 * @param {Object}   [env]
 * @param {Location} [env.location] Defaults to `window.location`.
 * @param {History}  [env.history]  Defaults to `window.history`.
 * @return {boolean} True when the library was asked to open.
 */
export function consumePatternLibraryDeepLink({
	location = window.location,
	history = window.history,
} = {}) {
	const { requested, blockSlug } = parsePatternLibraryQuery(location.search);
	if (!requested) {
		return false;
	}
	// Strip first: even when nothing below can open the library, a reload must not retry.
	stripDeepLinkParam(location, history);
	const blockName = blockNameFromSlug(blockSlug);
	openReadyPatterns(blockName ? { blockName } : {});
	return true;
}
