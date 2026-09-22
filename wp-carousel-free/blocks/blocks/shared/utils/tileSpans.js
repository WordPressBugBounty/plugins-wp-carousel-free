/**
 * Tile-span helpers for the Tiles bento layout (re-export façade).
 *
 * Spans are interpreted against a fixed 12-track grid (Bootstrap-style) and
 * stamped from the preset table on every render. Implementation lives in
 * `tilePresets`, `tileSpanMath`, and `tileBinPack`.
 */

export {
	TILE_LAYOUT_PRESETS,
	TILE_LAYOUT_VALUES,
	TILE_SPAN_FALLBACK,
	presetUsesAutoRowHeight,
} from './tilePresets';

export { TILE_BINPACK_MAX_ROWS } from './tileBinPack';

export {
	TILE_COL_SPAN_MIN,
	TILE_COL_SPAN_MAX,
	TILE_ROW_SPAN_MIN,
	TILE_ROW_SPAN_MAX,
	TILE_BINPACK_FALLBACK_WIDTH_PX,
	TILE_PRESET_ROW_HEIGHT_PX,
	clampSpan,
	clampSpans,
	presetDefaultAt,
	stampPreset,
	deriveBinpackUnitPx,
	parsePinPosition,
	binPackTiles,
	rescaleSpansForBreakpoint,
} from './tileSpanMath';
