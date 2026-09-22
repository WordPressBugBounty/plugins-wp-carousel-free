/**
 * Shared carousel/tiles frontend config helpers and constants.
 * Promoted from the main `frontend.js` IIFE closure for cross-module reuse.
 */

export const WPCP_AUDIO_INTERACTIVE_SELECTOR =
	'.wpcp-audio-card__player, .wpcp-audio-card__player *, .wpcp-audio-card__player-element';

// Algorithm constants. Keep in sync with `TILE_BINPACK_MAX_ROWS` in
// `blocks/blocks/shared/utils/tileSpans.js` and `TILES_BINPACK_MAX_ROWS`
// in `BlockRenderer.php`.
export const WPCP_TILES_BINPACK_MAX_ROWS = 10000;

// Responsive rescale breakpoints (px). At or below these widths the
// bin-pack runs against a reduced column count from the block's tablet /
// mobile settings. Matches the global plugin breakpoints used elsewhere
// (e.g. `src/Frontend/css/dynamic/responsive.php`).
export const WPCP_TILES_TABLET_BREAKPOINT_PX = 768;
export const WPCP_TILES_MOBILE_BREAKPOINT_PX = 480;

/**
 * @param {HTMLElement} blockRoot .wpcp-block with `data-wpcp`
 */
export function parseConfig(blockRoot) {
	try {
		const raw = blockRoot.getAttribute('data-wpcp');
		return raw ? JSON.parse(raw) : {};
	} catch (e) {
		return {};
	}
}

/**
 * Matches editor: `isTiles = blockName === 'tiles' || style === 'grid'` (CarouselRender.jsx).
 *
 * @param {Object} cfg Parsed `data-wpcp`.
 * @return {boolean} True when this block is tiles/grid (no Swiper).
 */
export function isTilesLayout(cfg) {
	if (!cfg || typeof cfg !== 'object') {
		return false;
	}
	if (cfg.isTiles === true) {
		return true;
	}
	if (cfg.slug === 'tiles') {
		return true;
	}
	const style = cfg.style || 'standard';
	return style === 'grid';
}

/**
 * Matches editor / PHP: variable width only for horizontal Swiper styles.
 *
 * @param {Object} cfg Parsed `data-wpcp`.
 * @return {boolean} True when variable-width Swiper rules apply for this config.
 */
export function isVariableWidthEffective(cfg) {
	if (!cfg || typeof cfg !== 'object') {
		return false;
	}
	if (isTilesLayout(cfg)) {
		return false;
	}
	if (!cfg.variableWidth) {
		return false;
	}
	const st = cfg.style || 'standard';
	return 'grid' !== st;
}

/**
 * Robust int parse: returns `fallback` when the input is missing or
 * non-numeric (parseInt('', 10) → NaN). Used for all `data-*` reads.
 *
 * @param {string|number|null|undefined} value
 * @param {number}                       fallback
 * @return {number} Parsed integer, or the fallback when missing or non-numeric.
 */
export function wpcpIntOr(value, fallback) {
	const n = parseInt(value, 10);
	if (isNaN(n)) {
		return fallback;
	}
	return n;
}
