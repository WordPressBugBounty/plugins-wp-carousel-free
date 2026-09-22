/**
 * Read the REST AJAX config object localized by PHP onto `window.wpcpBlocksAjax`.
 *
 * @return {Object|null} Config with `restUrl` and `nonce`, or null when absent.
 */
export function getAjaxConfig() {
	return window.wpcpBlocksAjax || null;
}
