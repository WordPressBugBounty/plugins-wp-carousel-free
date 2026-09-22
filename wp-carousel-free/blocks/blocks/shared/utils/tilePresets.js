/**
 * Tiles bento preset span tables (declarative data only).
 *
 * Server mirror: `TilesBinPack::PRESETS`. Free ships the three presets
 * `AllowedValues::TILE_LAYOUTS` permits; the other six are Pro.
 */

const span = (colSpan, rowSpan) => ({ colSpan, rowSpan });
const pinned = (colSpan, rowSpan, gridColumn, gridRow) => ({
	colSpan,
	rowSpan,
	gridColumn,
	gridRow,
});

/**
 * 9-tile preset → /12 span tables. Each preset is
 * `{ spans: Array, overflow: Object, autoRowHeight?: boolean }`.
 */
export const TILE_LAYOUT_PRESETS = Object.freeze({
	one: {
		spans: [
			span(4, 1),
			span(4, 1),
			span(4, 1),
			span(4, 1),
			span(4, 1),
			span(4, 1),
			span(4, 1),
			span(4, 1),
			span(4, 1),
		],
		overflow: span(4, 1),
		autoRowHeight: true,
	},
	two: {
		spans: [
			pinned(6, 2, '1 / span 6', '1 / span 2'),
			pinned(6, 1, '7 / span 6', '1'),
			pinned(6, 1, '7 / span 6', '2'),
			pinned(6, 1, '1 / span 6', '3'),
			pinned(6, 1, '1 / span 6', '4'),
			pinned(6, 2, '7 / span 6', '3 / span 2'),
		],
		overflow: span(6, 1),
	},
	three: {
		spans: [
			pinned(12, 2, '1 / span 12', '1 / span 2'),
			pinned(6, 1, '1 / span 6', '3'),
			pinned(6, 1, '7 / span 6', '3'),
			pinned(6, 1, '1 / span 6', '4'),
			pinned(6, 1, '7 / span 6', '4'),
		],
		overflow: span(6, 1),
		autoRowHeight: true,
	},
});

export const TILE_SPAN_FALLBACK = Object.freeze(span(1, 1));

export const TILE_LAYOUT_VALUES = Object.freeze(Object.keys(TILE_LAYOUT_PRESETS));

/**
 * @param {Object} presetTable
 * @param {string} activeTileLayout
 * @return {boolean} True when the preset allows `grid-auto-rows: auto`.
 */
export function presetUsesAutoRowHeight(presetTable, activeTileLayout) {
	return presetTable?.[activeTileLayout]?.autoRowHeight === true;
}

/** Columns every bento preset pins against. */
export const TILE_BENTO_COLUMNS = 12;

/**
 * Whether a tile layout pins its tiles instead of flowing them uniformly.
 *
 * The preset table also carries `one` (the uniform grid) so the packer can
 * stamp it, so this is a `!== 'one'` test rather than a table lookup.
 *
 * @param {string} tileLayout Saved `layoutOptions.tileLayout`.
 * @return {boolean} True for a bento preset.
 */
export const isBentoTileLayout = (tileLayout) => 'one' !== String(tileLayout || 'one');

/**
 * Whether a tile layout sizes its rows automatically.
 *
 * Mirrors the `tile-row-height` gate in `styles/config/style-config.js` and
 * `Styles/StyleConfig.php` — an auto-row preset emits no row-height token.
 *
 * @param {string} tileLayout Saved `layoutOptions.tileLayout`.
 * @return {boolean} True when rows size to content.
 */
export const usesAutoRowHeight = (tileLayout) =>
	presetUsesAutoRowHeight(TILE_LAYOUT_PRESETS, tileLayout);
