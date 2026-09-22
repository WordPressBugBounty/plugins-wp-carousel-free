/**
 * Tiles layout runtime — applies bin-pack positions to DOM containers.
 */

import {
	WPCP_TILES_TABLET_BREAKPOINT_PX,
	WPCP_TILES_MOBILE_BREAKPOINT_PX,
	wpcpIntOr,
} from '../carousel/config';
import { wpcpParsePinAxis, wpcpTilesBinPack, wpcpTilesRescale, wpcpDirectTiles } from './binpack';

/**
 * @param {HTMLElement|null} container Tiles grid container.
 */
export function wpcpLayoutContainer(container) {
	if (!container || !container.getBoundingClientRect) {
		return;
	}
	const allTiles = wpcpDirectTiles(container);
	if (!allTiles.length) {
		return;
	}
	// Pack only the tiles that are actually displayed. Gallery-filter hides
	// non-matching tiles with the `hidden` attribute (display:none); those must
	// not occupy bin-pack cells or the surviving tiles get pushed down/right
	// and the container keeps its full-set height — the classic filter "gap".
	const tiles = allTiles.filter(function (tile) {
		return !tile.hasAttribute('hidden');
	});
	if (!tiles.length) {
		container.style.height = '0px';
		return;
	}
	// A filter is active when some tiles are hidden. The preset pins place tiles
	// at fixed cells of the FULL set, so honoring them for a visible subset would
	// reproduce the gap. Drop the pins while filtering so the subset packs densely
	// from the top-left; pins are restored automatically once "All" is reselected.
	const filterActive = tiles.length !== allTiles.length;
	const width = container.getBoundingClientRect().width;
	if (width <= 0) {
		// In page builder contexts (Elementor, Divi, etc.), containers may start
		// with zero width. Ensure visibility is set even when layout is skipped,
		// so the ResizeObserver can retry when the container becomes visible.
		// Check if visibility was set to hidden by PHP (inline style).
		if (container.style.visibility === 'hidden') {
			container.style.visibility = '';
		}
		return;
	}
	const cols = wpcpIntOr(container.getAttribute('data-tile-grid-columns'), 12);
	const gapH = wpcpIntOr(container.getAttribute('data-tile-col-gap'), 0);
	const gapV = wpcpIntOr(container.getAttribute('data-tile-row-gap'), 0);
	// Both preset and Custom Layout containers emit `data-tile-row-height`
	// (0 = square unit_px cells). The rescaled tablet/mobile pass below relies
	// on that for cramped widths.
	const rowHeightPx = wpcpIntOr(container.getAttribute('data-tile-row-height'), 0);

	// Responsive rescale settings emitted by PHP (BlockRenderer.php). When
	// the toggle is off (`data-tile-responsive-rescale="0"`), the desktop
	// column count is used at all widths — same UX as Modula with rescale
	// disabled. Tablet/mobile counts default to 2/1 to match PHP defaults
	// in case the attrs are missing.
	const rescaleEnabled = wpcpIntOr(container.getAttribute('data-tile-responsive-rescale'), 1) !== 0;
	const colsTablet = wpcpIntOr(container.getAttribute('data-tile-cols-tablet'), 2);
	const colsMobile = wpcpIntOr(container.getAttribute('data-tile-cols-mobile'), 1);

	const items = [];
	for (let t = 0; t < tiles.length; t++) {
		const pinX = wpcpParsePinAxis(tiles[t].getAttribute('data-pin-col'));
		const pinY = wpcpParsePinAxis(tiles[t].getAttribute('data-pin-row'));
		const tileItem = {
			colSpan: wpcpIntOr(tiles[t].getAttribute('data-col-span'), 2),
			rowSpan: wpcpIntOr(tiles[t].getAttribute('data-row-span'), 2),
		};
		if (!filterActive && pinX !== null && pinY !== null) {
			tileItem.pinX = pinX;
			tileItem.pinY = pinY;
		}
		items.push(tileItem);
	}

	// Pick the effective column count for this viewport. Use the viewport
	// width (matches CSS media queries) — NOT the container's own width:
	// theme content areas (sidebars, narrow page templates) are often <768px
	// on a desktop, and using the container width would mistakenly trigger
	// tablet-rescale and drop preset pin positions on desktop viewports.
	// Mobile takes precedence over tablet so the order of checks matters —
	// the more restrictive breakpoint wins.
	const viewportWidth =
		typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : width;
	let effectiveCols = cols;
	let packItems = items;
	// Drop the preset row height on responsive rescale — tablet/mobile widths
	// collapse to fewer columns, so single-row tiles want to be near-square
	// rather than the desktop default (220px would feel oversized at 480px).
	let effectiveRowHeight = rowHeightPx;
	if (rescaleEnabled && viewportWidth <= WPCP_TILES_MOBILE_BREAKPOINT_PX) {
		effectiveCols = Math.max(1, colsMobile);
		packItems = wpcpTilesRescale(items, cols, effectiveCols);
		effectiveRowHeight = 0;
	} else if (rescaleEnabled && viewportWidth <= WPCP_TILES_TABLET_BREAKPOINT_PX) {
		effectiveCols = Math.max(1, colsTablet);
		packItems = wpcpTilesRescale(items, cols, effectiveCols);
		effectiveRowHeight = 0;
	}

	const result = wpcpTilesBinPack(packItems, effectiveCols, gapH, gapV, width, effectiveRowHeight);
	container.style.height = Math.ceil(result.containerHeight) + 'px';
	container.style.visibility = 'visible';
	for (let i = 0; i < tiles.length; i++) {
		const p = result.positions[i];
		if (!p) {
			continue;
		}
		const s = tiles[i].style;
		s.position = 'absolute';
		s.left = Math.round(p.leftPx) + 'px';
		s.top = Math.round(p.topPx) + 'px';
		s.width = Math.round(p.widthPx) + 'px';
		s.height = Math.round(p.heightPx) + 'px';
		// Reveal tiles emitted by `render_tiles_ajax_page` with the
		// `visibility:hidden` placeholder — now that real positions are
		// written, the 0x0 first-frame flash is masked. No-op for tiles
		// that didn't set inline visibility (initial PHP render).
		if (s.visibility === 'hidden') {
			s.visibility = '';
		}
	}
	container.setAttribute('data-wpcp-laid-out', '1');
}

export function wpcpLayoutAllTiles() {
	const containers = document.querySelectorAll('.wpcp-tiles-grid--binpack');
	for (let i = 0; i < containers.length; i++) {
		wpcpLayoutContainer(containers[i]);
	}
}

export function wpcpSetupTilesObservers() {
	const containers = document.querySelectorAll('.wpcp-tiles-grid--binpack');
	for (let i = 0; i < containers.length; i++) {
		const c = containers[i];
		if (c.getAttribute('data-wpcp-observed') === '1') {
			continue;
		}
		c.setAttribute('data-wpcp-observed', '1');
		(function (container) {
			if (typeof ResizeObserver !== 'function') {
				return;
			}
			let pending = false;
			const ro = new ResizeObserver(function () {
				if (pending) {
					return;
				}
				pending = true;
				requestAnimationFrame(function () {
					pending = false;
					wpcpLayoutContainer(container);
				});
			});
			ro.observe(container);
		})(c);
	}
}

export function wpcpBootstrapTiles() {
	wpcpLayoutAllTiles();
	wpcpSetupTilesObservers();
}
