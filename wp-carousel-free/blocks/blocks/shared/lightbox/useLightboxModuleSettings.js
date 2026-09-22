const LIGHTBOX_MODULE = 'lightbox';

/**
 * Whether the global Lightbox module is enabled in dashboard settings.
 *
 * @return {boolean} True when the module toggle is on or unset.
 */
export function isLightboxModuleActive() {
	if (typeof window === 'undefined') {
		return true;
	}

	const localize = window.wpcpBlockLocalize;
	if (!localize || typeof localize !== 'object') {
		return true;
	}

	const modules = localize.extensionModules;
	if (
		modules &&
		typeof modules === 'object' &&
		Object.prototype.hasOwnProperty.call(modules, LIGHTBOX_MODULE)
	) {
		return Boolean(modules[LIGHTBOX_MODULE]);
	}

	// When module is off, block editor localize omits lightbox from extensionSettings.
	const settings = localize.extensionSettings;
	if (settings && typeof settings === 'object') {
		return Object.prototype.hasOwnProperty.call(settings, LIGHTBOX_MODULE);
	}

	return false;
}

/**
 * Global Lightbox module settings for block editor (from wpcpBlockLocalize).
 * Returns null when the module is disabled.
 *
 * @return {Object|null} Merged lightbox settings or null when inactive.
 */
export function getLightboxModuleSettings() {
	if (!isLightboxModuleActive()) {
		return null;
	}

	if (typeof window === 'undefined') {
		return null;
	}

	const all = window.wpcpBlockLocalize?.extensionSettings;
	if (!all || typeof all !== 'object') {
		return null;
	}

	const settings = all[LIGHTBOX_MODULE];
	return settings && typeof settings === 'object' ? settings : null;
}

/**
 * Dashboard Modules page URL, for a notice that asks the author to switch a
 * module on. Localized by AssetManager so it survives a non-default admin path.
 *
 * @return {string} Absolute admin URL, or an empty string when unavailable.
 */
export function getModulesPageUrl() {
	if (typeof window === 'undefined') {
		return '';
	}

	const url = window.wpcpBlockLocalize?.modulesUrl;
	return 'string' === typeof url ? url : '';
}
