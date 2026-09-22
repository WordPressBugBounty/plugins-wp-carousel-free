import {
	DEFAULT_LIGHTBOX_ICON_NAME,
	migrateLightboxDraft,
} from '../../../admin/modules/config/lightboxDefaults';
import { getLightboxModuleSettings, isLightboxModuleActive } from './useLightboxModuleSettings';

const BLOCK_DEFAULT_ICON = 'search';

const GLOBAL_POSITION_TO_OVERLAY = {
	'top-left': 'top-left',
	'top-right': 'top-right',
	center: 'center-center',
	'bottom-left': 'bottom-left',
	'bottom-right': 'bottom-right',
};

/**
 * Map dashboard global position to overlay CSS anchor slug.
 *
 * @param {string} globalPosition Dashboard iconDisplayPosition value.
 * @return {string} Overlay CSS slug for `.wpcp-overlay-pos-*`.
 */
export function mapGlobalPositionToOverlaySlug(globalPosition) {
	const key = String(globalPosition || 'top-right').toLowerCase();
	return GLOBAL_POSITION_TO_OVERLAY[key] || 'top-right';
}

/**
 * CSS class on `.wpcp-overlay-icons` that mirrors global `iconVisible`.
 *
 * @param {string} visibility `always` or `hover`.
 * @return {string} Modifier class, or '' when unknown.
 */
export function overlayIconsVisibilityClass(visibility) {
	if ('always' === visibility) {
		return 'wpcp-overlay-icons-visible-always';
	}
	if ('hover' === visibility) {
		return 'wpcp-overlay-icons-visible-hover';
	}
	return '';
}

/**
 * Resolve global lightbox icon fields for editor overlay preview.
 *
 * @param {Object|null} settings Global lightbox settings.
 * @return {Object} Resolved icon source, type, position, and style fields.
 */
export function resolveGlobalLightboxIcon(settings = null) {
	const raw = settings || getLightboxModuleSettings() || {};
	const migrated = migrateLightboxDraft(raw);
	const icon = migrated.lightboxIcon || {
		source: 'icon',
		iconName: DEFAULT_LIGHTBOX_ICON_NAME,
		image: {},
	};

	return {
		source: 'global',
		iconType: 'custom' === icon.source ? 'custom' : 'library',
		iconName: icon.iconName || DEFAULT_LIGHTBOX_ICON_NAME,
		customIcon: icon.image || {},
		position: mapGlobalPositionToOverlaySlug(migrated.iconDisplayPosition || 'top-right'),
		visibility: migrated.iconVisible || 'hover',
		iconStyle: migrated.iconStyle || {},
	};
}

/**
 * Resolve overlay lightbox icon presentation for editor preview.
 *
 * @param {Object}      clickActionOptions Block clickActionOptions.
 * @param {Object|null} globalSettings     Optional global settings override.
 * @return {Object} Resolved icon fields from global or block scope.
 */
export function resolveOverlayLightboxIcon(clickActionOptions = {}, globalSettings = null) {
	if (isLightboxModuleActive()) {
		return resolveGlobalLightboxIcon(globalSettings);
	}

	return {
		source: 'block',
		iconType: clickActionOptions.lightboxIconType || 'library',
		iconName: clickActionOptions.lightboxIcon || BLOCK_DEFAULT_ICON,
		customIcon: clickActionOptions.lightboxCustomIcon || {},
		position: clickActionOptions.lightboxIconPosition || 'top right',
		visibility: 'hover',
	};
}
