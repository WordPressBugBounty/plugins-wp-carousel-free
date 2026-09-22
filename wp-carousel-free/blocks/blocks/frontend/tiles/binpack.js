/**
 * Tiles bin-pack runtime wrappers — thin DOM-facing adapters over the shared
 * packing core in `shared/utils/tileBinPack.js` (also mirrored by PHP
 * `src/Blocks/Rendering/TilesBinPack.php`). Only the leaf core is imported so
 * editor-only preset helpers in `tileSpans.js` stays out of this
 * bundle.
 */

import { packTiles, parsePinAxis } from '../../shared/utils/tileBinPack';

/**
 * Parse `"<start> / span <n>"` or bare `"<start>"` into a zero-indexed
 * integer. Returns `null` when missing/malformed.
 *
 * @param {string|null|undefined} value Raw pin axis attribute value.
 * @return {number|null} Zero-indexed pin position, or null when invalid.
 */
export const wpcpParsePinAxis = parsePinAxis;

/**
 * @param {Array<Object>} items          Tile span/pin descriptors.
 * @param {number}        columns        Grid column count.
 * @param {number}        gapH           Horizontal gap in px.
 * @param {number}        gapV           Vertical gap in px.
 * @param {number}        containerWidth Container width in px.
 * @param {number}        rowHeight      Row height in px (0 = square cells).
 * @return {{ positions: Array<Object>, containerHeight: number }} Tile positions and total container height in px.
 */
export function wpcpTilesBinPack(items, columns, gapH, gapV, containerWidth, rowHeight) {
	return packTiles(items, {
		columns,
		gapHorizontal: gapH,
		gapVertical: gapV,
		containerWidth,
		rowHeight,
	});
}

/**
 * @param {Array<Object>} items    Tile span descriptors.
 * @param {number}        fromCols Source column count.
 * @param {number}        toCols   Target column count.
 * @return {Array<Object>} Rescaled span descriptors.
 */
export function wpcpTilesRescale(items, fromCols, toCols) {
	const safeTo = Math.max(1, toCols);
	if (safeTo === 1) {
		return items.map(function () {
			return { colSpan: 1, rowSpan: 1 };
		});
	}
	const safeFrom = Math.max(1, fromCols);
	const ratio = safeTo / safeFrom;
	return items.map(function (it) {
		const cRaw = Math.round(it.colSpan);
		const rRaw = Math.round(it.rowSpan);
		const c = Math.max(1, cRaw > 0 ? cRaw : 1);
		const r = Math.max(1, rRaw > 0 ? rRaw : 1);
		const newC = Math.max(1, Math.min(safeTo, Math.round(c * ratio)));
		const newR = Math.max(1, Math.round(r * (newC / c)));
		return { colSpan: newC, rowSpan: newR };
	});
}

/**
 * Collects only the *direct* `.wpcp-tiles-tile` children of `parent`.
 *
 * @param {HTMLElement} parent Tiles grid container.
 * @return {HTMLElement[]} Direct tile elements.
 */
export function wpcpDirectTiles(parent) {
	const out = [];
	for (let i = 0; i < parent.children.length; i++) {
		const child = parent.children[i];
		const cls = child.className ? String(child.className) : '';
		if (cls.indexOf('wpcp-tiles-tile') !== -1) {
			out.push(child);
		}
	}
	return out;
}
