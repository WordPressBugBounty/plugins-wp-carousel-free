/**
 * Read a dashboard module's enabled state inside the block editor.
 *
 * PHP localizes the active flags onto `window.wpcpBlockLocalize.extensionModules`
 * (see AssetManager::enqueue_block_assets). Mirrors the PHP
 * `Dashboard::is_module_active()` default: when the flag is absent (no localize
 * data yet, or an older option set) the module is treated as on, so panels are
 * never hidden by missing data.
 *
 * @param {string} moduleName Module slug, matching the dashboard registry.
 * @return {boolean} True when the module toggle is on or unset.
 */
export function isBlockModuleActive(moduleName) {
	if (typeof window === 'undefined') {
		return true;
	}

	const modules = window.wpcpBlockLocalize?.extensionModules;
	if (
		modules &&
		typeof modules === 'object' &&
		Object.prototype.hasOwnProperty.call(modules, moduleName)
	) {
		return Boolean(modules[moduleName]);
	}

	return true;
}
