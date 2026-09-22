/**
 * Tile span clamp / stamp / pack math (pure functions).
 *
 * Server mirror: `Rendering\TilesBinPack`. Free stamps spans from the preset
 * table on every render — there is no saved `tileSpans` attribute to reconcile,
 * so the Pro sync/convert/seed helpers have no counterpart here.
 */

import { packTiles, parsePinAxis } from './tileBinPack';
import { TILE_LAYOUT_PRESETS, TILE_SPAN_FALLBACK } from './tilePresets';

export const TILE_COL_SPAN_MIN = 1;
export const TILE_COL_SPAN_MAX = 12;
export const TILE_ROW_SPAN_MIN = 1;
export const TILE_ROW_SPAN_MAX = 12;
// Assumed desktop width for the first pack, before the container is measured.
export const TILE_BINPACK_FALLBACK_WIDTH_PX = 1200;
export const TILE_PRESET_ROW_HEIGHT_PX = 220;

const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production';

const clampInt = (value, min, max, fallback) => {
	const num = Number(value);
	if (!Number.isFinite(num)) {
		return fallback;
	}
	const rounded = Math.round(num);
	if (rounded < min) {
		return min;
	}
	if (rounded > max) {
		return max;
	}
	return rounded;
};

const isMeaningfulPin = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Normalise one entry: clamp colSpan / rowSpan, drop empty pins.
 *
 * @param {*} entry
 * @return {{colSpan:number,rowSpan:number,gridColumn?:string,gridRow?:string}} Normalised entry.
 */
export function clampSpan(entry) {
	const colSpan = clampInt(
		entry?.colSpan,
		TILE_COL_SPAN_MIN,
		TILE_COL_SPAN_MAX,
		TILE_SPAN_FALLBACK.colSpan
	);
	const rowSpan = clampInt(
		entry?.rowSpan,
		TILE_ROW_SPAN_MIN,
		TILE_ROW_SPAN_MAX,
		TILE_SPAN_FALLBACK.rowSpan
	);

	if (
		isDev &&
		entry &&
		(Number(entry.colSpan) !== colSpan || Number(entry.rowSpan) !== rowSpan) &&
		(entry.colSpan !== undefined || entry.rowSpan !== undefined)
	) {
		// eslint-disable-next-line no-console
		console.warn('[wp-carousel-pro] tileSpans entry clamped', {
			from: { colSpan: entry.colSpan, rowSpan: entry.rowSpan },
			to: { colSpan, rowSpan },
		});
	}

	const out = { colSpan, rowSpan };
	if (isMeaningfulPin(entry?.gridColumn)) {
		out.gridColumn = entry.gridColumn;
	}
	if (isMeaningfulPin(entry?.gridRow)) {
		out.gridRow = entry.gridRow;
	}
	return out;
}

/**
 * Clamp every entry. Drops empty-string pin keys so persisted JSON stays clean.
 *
 * @param {Array} tileSpans Source array.
 * @return {Array} Clamped/cleaned copy.
 */
export function clampSpans(tileSpans) {
	if (!Array.isArray(tileSpans)) {
		return [];
	}
	return tileSpans.map(clampSpan);
}

/**
 * Resolve the default span for a given index under the active preset.
 *
 * - `tileLayout = "one"` is a uniform grid driven entirely by `columns`:
 *   every entry resolves to `{ colSpan: floor(12 / columns), rowSpan: 1 }`,
 *   so the bento layout reflows when the user moves the Columns slider.
 * - Other presets use `spans[index]` (with explicit `gridColumn` / `gridRow`
 *   pins) for in-preset indices.
 * - For overflow indices (i ≥ `spans.length`), the span is derived from
 *   `columns` when provided so overflow tiles follow the user's Columns
 *   setting (Bug B2 fix). When `columns` is missing, falls back to
 *   `preset.overflow` and finally to the global `{1,1}` fallback.
 *
 * @param {Object}        presetTable
 * @param {string}        activeTileLayout
 * @param {number}        index
 * @param {number|string} [columns]        Active Columns slider value (1–12).
 * @return {{colSpan:number,rowSpan:number,gridColumn?:string,gridRow?:string}} Default span for that index.
 */
export function presetDefaultAt(presetTable, activeTileLayout, index, columns) {
	if (activeTileLayout === 'one') {
		return columnsDerivedSpan(columns);
	}
	const preset = presetTable?.[activeTileLayout];
	if (!preset) {
		return { ...TILE_SPAN_FALLBACK };
	}
	const spans = Array.isArray(preset.spans) ? preset.spans : null;
	if (spans && spans[index]) {
		return clampSpan(spans[index]);
	}
	const colsNum = Number(columns);
	if (Number.isFinite(colsNum) && colsNum > 0) {
		return columnsDerivedSpan(colsNum);
	}
	if (preset.overflow) {
		return clampSpan(preset.overflow);
	}
	return { ...TILE_SPAN_FALLBACK };
}

/**
 * Derive an overflow span from a Columns slider value. Falls back to
 * `columns = 3` when the input is missing or non-positive.
 *
 * @param {number|string|undefined} columns
 * @return {{colSpan:number,rowSpan:number}} Span derived from the given column count.
 */
function columnsDerivedSpan(columns) {
	const colsNum = Number(columns);
	const safeCols = Number.isFinite(colsNum) && colsNum > 0 ? colsNum : 3;
	const colSpan = Math.max(1, Math.min(12, Math.floor(12 / safeCols)));
	return { colSpan, rowSpan: 1 };
}

/**
 * Stamp every tile from a preset, ignoring existing entries. Used when the
 * user picks a new preset and confirms the wipe of manual edits.
 *
 * @param {number}        itemCount
 * @param {string}        activeTileLayout
 * @param {Object}        presetTable      Preset table to read from.
 * @param {number|string} [columns]        Active Columns slider value, used for
 *                                         overflow + the uniform `'one'` preset.
 * @return {Array} Fresh tileSpans of length itemCount.
 */
export function stampPreset(
	itemCount,
	activeTileLayout,
	presetTable = TILE_LAYOUT_PRESETS,
	columns
) {
	const out = [];
	for (let i = 0; i < itemCount; i++) {
		out.push(presetDefaultAt(presetTable, activeTileLayout, i, columns));
	}
	return out;
}

/**
 * Column unit width for bin-pack math at a given container width.
 *
 * @param {number} containerWidth
 * @param {number} [columns]
 * @param {number} [gapH]
 * @return {number} Column unit width in pixels for bin-pack layout.
 */
export function deriveBinpackUnitPx(containerWidth, columns = 12, gapH = 0) {
	const width = Math.max(0, Number(containerWidth) || 0);
	if (width <= 0) {
		return 0;
	}
	const safeColumns = Math.max(1, Math.min(12, Math.floor(Number(columns) || 12)));
	const gap = Math.max(0, Number(gapH) || 0);
	return (width - (safeColumns - 1) * gap) / safeColumns;
}

/**
 * Parse the leading track index out of a CSS Grid `gridColumn` / `gridRow`
 * value of the form `"<start> / span <n>"` or a bare `"<start>"`. Returns
 * zero-indexed `x` / `y`, or `null` when the input is missing/malformed.
 *
 * Used by `binPackTiles` (and its PHP / frontend-bootstrap mirrors) to honor
 * preset pins. Tiles without pins fall back to the row-major auto-pack scan.
 *
 * @param {*} entry Span entry with optional `gridColumn` / `gridRow` strings.
 * @return {{x:number, y:number} | null} Zero-indexed cell coords, or `null` when no parseable pin is present.
 */
export function parsePinPosition(entry) {
	const x = parsePinAxis(entry?.gridColumn);
	const y = parsePinAxis(entry?.gridRow);
	if (x === null || y === null) {
		return null;
	}
	return { x, y };
}

/**
 * Packery-style bin-pack — places tiles in array order on a `columns`-track
 * grid. Tiles with a parseable `gridColumn` / `gridRow` pin are placed at
 * the exact pinned cell; tiles without pins fall back to row-major scan
 * (first free `w × h` rectangle). Returns absolute-positioned pixel
 * coordinates plus the derived container height. Pure, deterministic, no
 * React, no DOM.
 *
 * Algorithm: for each tile, attempt to honor its pin first; otherwise scan
 * (y = 0..∞, x = 0..columns-w) for the first (x, y) where the rectangle
 * (x..x+w-1, y..y+h-1) is entirely free. Mark the rectangle occupied; emit
 * pixel coords; continue. Equivalent to Packery's Maximal-Free-Rectangles
 * for grid-aligned content, extended with explicit pin support so preset
 * layouts (TILE_LAYOUT_PRESETS) render exactly as the SVG icon depicts.
 *
 * Pixel formulas:
 *   unit_px  = (containerWidth - (columns - 1) * gapH) / columns
 *   row_h    = rowHeight ?? unit_px   // square cells by default (Modula-style)
 *   width    = colSpan * unit_px + (colSpan - 1) * gapH
 *   height   = rowSpan * row_h + (rowSpan - 1) * gapV
 *   left     = x * (unit_px + gapH)
 *   top      = y * (row_h + gapV)
 *
 * When `rowHeight` is supplied the bin-pack uses non-square cells — both
 * preset and Custom Layout modes pass the user-tunable `tileRowHeight`
 * (default 220px) so toggling Custom Layout never changes the geometry.
 * When omitted, falls back to Modula's square unit (row height = unit width).
 *
 * @param {Object} params
 * @param {Array}  params.items          Source items (only `.length` is used).
 * @param {Array}  params.tileSpans      Index-aligned with items.
 * @param {number} params.columns        Grid track count (1–12 typical).
 * @param {number} params.gapHorizontal  Horizontal gap in px.
 * @param {number} params.gapVertical    Vertical gap in px.
 * @param {number} params.containerWidth Container width in px.
 * @param {number} [params.rowHeight]    Optional non-square row height in px.
 * @return {{ positions: Array<{x:number,y:number,leftPx:number,topPx:number,widthPx:number,heightPx:number}>, containerHeight: number, unitPx: number }}
 *   positions: aligned to items.length;
 *   containerHeight: max(top + height) across all tiles, in px;
 *   unitPx: derived per-cell column width in px.
 */
export function binPackTiles({
	items,
	tileSpans,
	columns,
	gapHorizontal,
	gapVertical,
	containerWidth,
	rowHeight,
}) {
	const itemCount = Array.isArray(items) ? items.length : 0;
	const tiles = new Array(itemCount);
	for (let i = 0; i < itemCount; i++) {
		const entry = Array.isArray(tileSpans) ? tileSpans[i] : null;
		const pin = parsePinPosition(entry);
		tiles[i] = {
			colSpan: entry?.colSpan,
			rowSpan: entry?.rowSpan,
			pinX: pin ? pin.x : null,
			pinY: pin ? pin.y : null,
		};
	}
	return packTiles(tiles, { columns, gapHorizontal, gapVertical, containerWidth, rowHeight });
}

/**
 * Proportionally rescale `tileSpans` from a source column count to a target
 * column count, preserving aspect ratio. Used by Responsive Rescale at smaller
 * breakpoints. Pure.
 *
 * Formula (improves on Modula's hardcoded /12):
 *   ratio = max(1, toCols) / max(1, fromCols)
 *   newCol = max(1, round(colSpan * ratio))
 *   newRow = max(1, round(rowSpan * (newCol / colSpan)))
 *
 * Special case: when `toCols === 1`, every tile becomes 1×1 (1-column stack).
 *
 * @param {Array}  spans    Source tileSpans.
 * @param {number} fromCols Source column count (typically tileGridColumns).
 * @param {number} toCols   Target column count (typically the responsive breakpoint).
 * @return {Array} New tileSpans aligned to input length.
 */
export function rescaleSpansForBreakpoint(spans, fromCols, toCols) {
	if (!Array.isArray(spans) || spans.length === 0) {
		return [];
	}
	const safeFrom = Math.max(1, Math.floor(Number(fromCols) || 12));
	const safeTo = Math.max(1, Math.floor(Number(toCols) || safeFrom));

	if (safeTo === 1) {
		return spans.map(() => ({ colSpan: 1, rowSpan: 1 }));
	}

	const ratio = safeTo / safeFrom;
	return spans.map((entry) => {
		const colSpan = Math.max(1, Math.round(Number(entry?.colSpan) || 1));
		const rowSpan = Math.max(1, Math.round(Number(entry?.rowSpan) || 1));
		const newCol = Math.max(1, Math.min(safeTo, Math.round(colSpan * ratio)));
		const aspectRatio = newCol / colSpan;
		const newRow = Math.max(1, Math.round(rowSpan * aspectRatio));
		return { colSpan: newCol, rowSpan: newRow };
	});
}
