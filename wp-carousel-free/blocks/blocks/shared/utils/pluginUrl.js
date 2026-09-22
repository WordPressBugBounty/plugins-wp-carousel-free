/**
 * Plugin base URL for editor assets shipped under `src/`.
 *
 * Comes from `wpcpfBlocks.pluginUrl` (localized in AssetManager). Assets are
 * referenced by runtime URL rather than imported, so nothing is duplicated into
 * `assets/editor/` and no webpack `publicPath` has to be configured.
 */

/**
 * Trailing-slashed plugin URL, or an empty string outside the browser.
 *
 * @return {string} Plugin base URL.
 */
export default function getPluginUrl() {
	if ('undefined' === typeof window) {
		return '';
	}
	return window.wpcpfBlocks?.pluginUrl || '';
}
