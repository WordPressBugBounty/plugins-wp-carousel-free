import { __ } from '@wordpress/i18n';
import LightboxSettingsPanel from '../lightbox/LightboxSettingsPanel';
import WatermarkShowcasePanel from '../watermark/WatermarkShowcasePanel';
import { LightboxIcon, WatermarkIcon } from '../../pages/modules/icons';

// Lightbox is the only Free module whose drawer settings work; `hasSettings`
// drives that, and the PHP allow-list rejects any slug without it on save.
// Watermark is Pro, so it carries `showcase` instead: the drawer opens and shows
// the Pro design, dimmed and inert, and writes nothing anywhere.
export const MODULE_SETTINGS_REGISTRY = {
	lightbox: {
		hasSettings: true,
		title: __('Lightbox', 'wp-carousel-free'),
		icon: <LightboxIcon fill="currentColor" />,
		Panel: LightboxSettingsPanel,
	},
	watermark: {
		showcase: true,
		title: __('Watermark', 'wp-carousel-free'),
		icon: <WatermarkIcon fill="currentColor" />,
		Panel: WatermarkShowcasePanel,
	},
};

/**
 * @param {string} moduleName Module slug.
 * @return {Object|null} Registry entry or null when the module has no drawer.
 */
export function getModuleSettingsEntry(moduleName) {
	return MODULE_SETTINGS_REGISTRY[moduleName] || null;
}

/**
 * @param {string} moduleName Module slug.
 * @return {boolean} True when the module exposes a settings drawer.
 */
export function moduleHasDrawerSettings(moduleName) {
	return Boolean(MODULE_SETTINGS_REGISTRY[moduleName]?.hasSettings);
}
