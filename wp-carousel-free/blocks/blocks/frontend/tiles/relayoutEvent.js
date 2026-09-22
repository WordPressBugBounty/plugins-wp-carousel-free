/**
 * Tiles relayout bootstrap — lifecycle hooks and the public `wpcp:tiles:relayout` event.
 */

import { wpcpBootstrapTiles, wpcpLayoutAllTiles } from './layout';

/**
 * Wire tiles bin-pack bootstrap at the same lifecycle points as the original
 * inline IIFE block: DOMContentLoaded, window.load, resize (rAF-coalesced),
 * delayed retries, and the public custom event.
 */
export function bootTilesRelayout() {
	// Three entry points cover the lifecycle:
	//   1. `DOMContentLoaded` (or immediate run if the script loads later):
	//      first layout against the parsed DOM. Images may still be loading.
	//   2. `window.load`: re-layout once images report their intrinsic size —
	//      catches lazy-loaded thumbnails whose containers grow on load.
	//   3. `ResizeObserver` per container (set up inside bootstrap): catches
	//      any layout shift after that (sidebar collapse, font swap, etc.).
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', wpcpBootstrapTiles);
	} else {
		wpcpBootstrapTiles();
	}
	window.addEventListener('load', wpcpBootstrapTiles);

	// Window resize: rAF-coalesced. Multiple resize events in one frame fire
	// `wpcpLayoutAllTiles` exactly once, on the next paint.
	let wpcpTilesResizePending = false;
	window.addEventListener('resize', function () {
		if (wpcpTilesResizePending) {
			return;
		}
		wpcpTilesResizePending = true;
		requestAnimationFrame(function () {
			wpcpTilesResizePending = false;
			wpcpLayoutAllTiles();
		});
	});

	// Belt-and-suspenders for containers that mount late (page builders, AJAX
	// load-more, tab panels revealing the block on click). The 100ms tick
	// covers same-frame mount; the 500ms tick covers slower content pipelines.
	// `wpcpLayoutContainer` is idempotent — re-running is a no-op when the
	// computed positions match the current inline styles.
	setTimeout(wpcpBootstrapTiles, 100);
	setTimeout(wpcpBootstrapTiles, 500);

	// Public hook: third-party code (or our own AJAX handlers) can fire
	// `document.dispatchEvent(new Event('wpcp:tiles:relayout'))` after
	// inserting a new tiles block into the DOM.
	document.addEventListener('wpcp:tiles:relayout', wpcpLayoutAllTiles);
}
