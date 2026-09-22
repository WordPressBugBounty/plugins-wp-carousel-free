/**
 * Run `callback` on DOMContentLoaded (or immediately if the DOM is ready) and
 * again on `window.load`. Matches the bootstrap pattern shared by the tiles
 * AJAX pagination, gallery filter, and AJAX search frontend modules.
 *
 * @param {Function} callback Init function to invoke at each lifecycle point.
 */
export function onDocumentReadyAndLoad(callback) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', callback);
	} else {
		callback();
	}
	window.addEventListener('load', callback);
}
