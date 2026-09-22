/**
 * Frontend runtime entry point.
 *
 * The only JavaScript shipped to the front of site. Depends on
 * `wpcpf-blocks-swiper` (the vendored copy) for `window.Swiper`.
 */

import { bootSocialShare, bootAjaxPagination } from './frontend/index';
import { bootTilesRelayout } from './frontend/tiles/relayoutEvent';
import './frontend/tiles/layout';
import { bootCarouselRuntime, initAllCarousels } from './frontend/carousel/blockInit';

bootCarouselRuntime();

// Page-builder editors inject saved markup after this bundle has booted, so the
// boot-time pass finds nothing to initialise. Expose the initialiser they call;
// initBlock guards on `dataset.wpcpInit`, so re-running only touches new roots.
window.WPCarouselFree = window.WPCarouselFree || {};
window.WPCarouselFree.initialize = initAllCarousels;

// Boot order matches Pro so listener registration order is unchanged.
// Social-share "Copy post URL" (delegated listener, window-guarded).
bootSocialShare();

// Tiles AJAX pagination.
bootAjaxPagination();

// Re-run the tiles bin-pack on `wpcp:tiles:relayout` (dispatched after a swap).
bootTilesRelayout();
