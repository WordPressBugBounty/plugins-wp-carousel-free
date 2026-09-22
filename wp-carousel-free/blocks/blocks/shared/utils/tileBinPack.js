/**
 * Tiles bin-pack core — the single packing scan shared by the editor preview
 * (`tileSpans.js#binPackTiles`) and the frontend runtime
 * (`frontend/tiles/binpack.js`), and mirrored rule-for-rule by PHP
 * (`src/Blocks/Rendering/TilesBinPack.php`).
 *
 * This module must stay a leaf: no imports. The frontend bundle pulls it in,
 * and the historic duplication existed precisely to keep editor-only
 * preset helpers (the rest of `tileSpans.js`) out of that bundle.
 *
 * Geometry parity across all three runners is locked by
 * `npm run test:tiles-binpack` against the golden fixtures in
 * `tests/css-parity/fixtures/tiles-binpack.json`.
 */

/**
 * Hard upper bound for the row-scan. A 12-column board with ~10k rows is
 * ~120k cells — far above any sane gallery. Pure safety net against
 * pathological input; spans are clamped to the column count, so the scan
 * always places within finite rows under normal operation.
 */
export const TILE_BINPACK_MAX_ROWS = 10000;

/**
 * Parse the leading track index out of a CSS Grid `gridColumn` / `gridRow`
 * value of the form `"<start> / span <n>"` or a bare `"<start>"`.
 *
 * @param {string|null|undefined} value Raw pin axis value.
 * @return {number|null} Zero-indexed track, or `null` when missing/malformed.
 */
export function parsePinAxis(value) {
	if (typeof value !== 'string' || value === '') {
		return null;
	}
	const slash = value.indexOf('/');
	const head = slash === -1 ? value : value.slice(0, slash);
	const start = parseInt(head, 10);
	if (!Number.isFinite(start) || start < 1) {
		return null;
	}
	return start - 1;
}

/**
 * Packery-style bin-pack — places tiles in array order on a `columns`-track
 * grid. Tiles with a numeric `pinX` / `pinY` are placed at the exact pinned
 * cell when it fits; tiles without pins fall back to row-major scan (first
 * free `w × h` rectangle). Pure, deterministic, no DOM.
 *
 * Pixel formulas:
 *   unit_px  = (containerWidth - (columns - 1) * gapH) / columns
 *   row_h    = rowHeight > 0 ? rowHeight : unit_px   // square cells by default
 *   width    = colSpan * unit_px + (colSpan - 1) * gapH
 *   height   = rowSpan * row_h + (rowSpan - 1) * gapV
 *   left     = x * (unit_px + gapH)
 *   top      = y * (row_h + gapV)
 *
 * @param {Array<{colSpan?: *, rowSpan?: *, pinX?: number|null, pinY?: number|null}>} tiles
 *                                                                                                           One entry per tile. Missing/invalid spans default to 2×2 (Custom Layout
 *                                                                                                           default); fractional spans round; spans clamp to the grid.
 * @param {Object}                                                                    options
 * @param {number}                                                                    options.columns        Grid track count (clamped to 1–12).
 * @param {number}                                                                    options.gapHorizontal  Horizontal gap in px (clamped ≥ 0).
 * @param {number}                                                                    options.gapVertical    Vertical gap in px (clamped ≥ 0).
 * @param {number}                                                                    options.containerWidth Container width in px.
 * @param {number}                                                                    [options.rowHeight]    Optional non-square row height in px.
 * @return {{ positions: Array<{x:number,y:number,leftPx:number,topPx:number,widthPx:number,heightPx:number}>, containerHeight: number, unitPx: number }}
 *   positions aligned to `tiles.length`; containerHeight in px; unitPx the
 *   derived per-cell column width in px.
 */
export function packTiles(
	tiles,
	{ columns, gapHorizontal, gapVertical, containerWidth, rowHeight }
) {
	const width = Math.max(0, Number(containerWidth) || 0);
	const tileCount = Array.isArray(tiles) ? tiles.length : 0;

	if (tileCount === 0 || width <= 0) {
		return { positions: [], containerHeight: 0, unitPx: 0 };
	}

	const safeColumns = Math.max(1, Math.min(12, Math.floor(Number(columns) || 12)));
	const gapH = Math.max(0, Number(gapHorizontal) || 0);
	const gapV = Math.max(0, Number(gapVertical) || 0);
	const unitPx = (width - (safeColumns - 1) * gapH) / safeColumns;
	const rowPx =
		Number.isFinite(Number(rowHeight)) && Number(rowHeight) > 0 ? Number(rowHeight) : unitPx;
	const stepX = unitPx + gapH;
	const stepY = rowPx + gapV;

	// Sparse occupancy: Set of "x,y" keys.
	const occupied = new Set();
	const positions = new Array(tileCount);
	let maxRowEnd = 0;

	const isFree = (startX, startY, w, h) => {
		for (let dy = 0; dy < h; dy++) {
			for (let dx = 0; dx < w; dx++) {
				if (occupied.has(`${startX + dx},${startY + dy}`)) {
					return false;
				}
			}
		}
		return true;
	};

	const markOccupied = (startX, startY, w, h) => {
		for (let dy = 0; dy < h; dy++) {
			for (let dx = 0; dx < w; dx++) {
				occupied.add(`${startX + dx},${startY + dy}`);
			}
		}
	};

	const place = (i, x, y, w, h) => {
		markOccupied(x, y, w, h);
		positions[i] = {
			x,
			y,
			leftPx: x * stepX,
			topPx: y * stepY,
			widthPx: w * unitPx + (w - 1) * gapH,
			heightPx: h * rowPx + (h - 1) * gapV,
		};
		maxRowEnd = Math.max(maxRowEnd, y + h);
	};

	for (let i = 0; i < tileCount; i++) {
		const tile = tiles[i] || {};
		const rawCol = tile.colSpan ?? 2;
		const rawRow = tile.rowSpan ?? 2;
		const w = Math.max(1, Math.min(safeColumns, Math.round(Number(rawCol) || 1)));
		const h = Math.max(1, Math.round(Number(rawRow) || 1));

		// Honor an explicit pin when present and it still fits the current grid.
		// Falls back to row-major scan when the pin would overflow the column
		// count (e.g. responsive rescale shrunk `safeColumns` below the pin).
		const pinX = typeof tile.pinX === 'number' ? tile.pinX : null;
		const pinY = typeof tile.pinY === 'number' ? tile.pinY : null;
		if (pinX !== null && pinY !== null && pinX + w <= safeColumns && isFree(pinX, pinY, w, h)) {
			place(i, pinX, pinY, w, h);
			continue;
		}

		// Row-major scan for first free w×h rectangle.
		let placed = false;
		for (let y = 0; !placed; y++) {
			for (let x = 0; x <= safeColumns - w; x++) {
				if (isFree(x, y, w, h)) {
					place(i, x, y, w, h);
					placed = true;
					break;
				}
			}
			// Safety: cap at a sane row count to avoid infinite loops on bad input.
			if (y > TILE_BINPACK_MAX_ROWS) {
				positions[i] = {
					x: 0,
					y,
					leftPx: 0,
					topPx: y * stepY,
					widthPx: w * unitPx + (w - 1) * gapH,
					heightPx: h * rowPx + (h - 1) * gapV,
				};
				placed = true;
			}
		}
	}

	const containerHeight = maxRowEnd > 0 ? maxRowEnd * stepY - gapV : 0;
	return { positions, containerHeight, unitPx };
}
