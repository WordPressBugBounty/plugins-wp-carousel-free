/**
 * WP Carousel Pro — frontend runtime module barrel.
 *
 * Re-exports the boot function of every frontend concern that has been split
 * into its own module. `frontend.js` (the webpack entry) imports these and calls
 * each one in the exact position its original IIFE occupied, so DOMContentLoaded
 * listener-registration order — and therefore behaviour — is preserved.
 */
export { bootSocialShare } from './socialShare/index';
export { bootAjaxPagination } from './ajaxPagination/index';
