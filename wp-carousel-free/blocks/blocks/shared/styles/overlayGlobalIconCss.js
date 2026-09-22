/**
 * Global lightbox-icon styling for the click-action overlay icon (editor side).
 *
 * When the Lightbox module is active, the overlay lightbox icon mirrors the
 * global Lightbox Settings instead of the block's own clickActionOptions. The block's
 * static SCSS already reads these CSS variables on `.wpcp-overlay-icons` and
 * `.wpcp-overlay-icon.wpcp-lightbox-icon`; here we feed the global values into
 * those same variables, scoped one selector level deeper than the per-block
 * token bag (which lands on the `#uniqueId` wrapper) so they win by selector
 * closeness without having to gate the block tokens.
 *
 * Frontend counterpart: `Lightbox_Icon_Helper::build_overlay_global_icon_css()`.
 */

import { isZeroSpacingCss, rangerCss, spacingGenerate, borderCss } from './cssHelpers';
import {
	isLightboxModuleActive,
	getLightboxModuleSettings,
} from '../lightbox/useLightboxModuleSettings';
import { migrateLightboxDraft } from '../../../admin/modules/config/lightboxDefaults';

const ICON_STYLE_PRESETS = ['default', 'filled', 'outlined', 'minimal'];

/**
 * Whether this block instance should source its overlay lightbox icon from the
 * global module (lightbox action and module active).
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} True when the global icon should drive the overlay.
 */
const usesGlobalLightboxIcon = (attributes) => {
	const clickActionOptions = attributes.clickActionOptions || {};
	if ('lightbox' !== (clickActionOptions.type || 'lightbox')) {
		return false;
	}
	return isLightboxModuleActive();
};

/**
 * Migrated global lightbox settings, or null when the module is inactive.
 *
 * @return {Object|null} Normalized settings (mirrors PHP Lightbox_Settings).
 */
const getMigratedGlobalSettings = () => {
	const raw = getLightboxModuleSettings();
	return raw ? migrateLightboxDraft(raw) : null;
};

/**
 * Whether the global icon style defines an explicit surface (bg / border) in
 * either state — when it does, the icon-style preset fallback is skipped.
 * Mirrors `Lightbox_Icon_Helper::icon_style_has_surface_styles()`.
 *
 * @param {Object} normal Normal-state style.
 * @param {Object} hover  Hover-state style.
 * @return {boolean} True when an explicit surface style exists.
 */
const hasSurfaceStyles = (normal, hover) =>
	[normal, hover].some((state) => {
		if (state?.backgroundColor) {
			return true;
		}
		const border = state?.border;
		return Boolean(border?.color) || (border?.style && border.style !== 'none');
	});

/**
 * Resolve the effective border for a state. Hover inherits the normal border
 * style/width when its style is left as `none`, matching the PHP helper.
 *
 * @param {Object} state        State style.
 * @param {Object} inheritState Normal-state style for hover inheritance.
 * @return {Object} Effective border pieces.
 */
const resolveIconBorderState = (state = {}, inheritState = {}) => {
	const border = { ...(state.border || {}) };
	let borderWidth = state.borderWidth;

	if (Object.keys(inheritState || {}).length) {
		const inheritBorder = inheritState.border || {};
		const inheritStyle = inheritBorder.style || 'none';
		const currentStyle = border.style || 'none';

		if (currentStyle === 'none' && inheritStyle !== 'none') {
			border.style = inheritStyle;
			if (!borderCss(border, borderWidth)['border-width']) {
				borderWidth = inheritState.borderWidth;
			}
		}
	}

	const hasExplicitStyle = Object.prototype.hasOwnProperty.call(border, 'style');
	let style = hasExplicitStyle ? border.style || 'none' : '';
	if (!hasExplicitStyle && border.color) {
		style = 'solid';
		border.style = style;
	}
	if (!style) {
		style = 'none';
	}

	return {
		border,
		borderWidth,
		style,
	};
};

const applyBorderVars = (styles, state, inheritState, prefix) => {
	const borderState = resolveIconBorderState(state, inheritState);
	if (borderState.style === 'none') {
		return;
	}

	const decls = borderCss(borderState.border, borderState.borderWidth);
	if (decls['border-style']) {
		styles[`${prefix}-border-style`] = decls['border-style'];
	}
	if (decls['border-color']) {
		styles[`${prefix}-border-color`] = decls['border-color'];
	}
	if (decls['border-width']) {
		styles[`${prefix}-border-width`] = decls['border-width'];
	}
};

/**
 * Build the color / border / preset variables (non-responsive, base pass only).
 *
 * @param {Object} iconStyle Global iconStyle config.
 * @param {string} preset    Global lightboxIconStyle preset.
 * @return {Object} `{ '--wpcp-*': value }` surface variables.
 */
const buildSurfaceVars = (iconStyle, preset) => {
	const styles = {};
	const normal = iconStyle.normal || {};
	const hover = iconStyle.hover || {};

	if (normal.iconColor) {
		styles['--wpcp-click-lightbox-color'] = normal.iconColor;
	}
	if (normal.backgroundColor) {
		styles['--wpcp-click-lightbox-bg'] = normal.backgroundColor;
	}
	if (hover.iconColor) {
		styles['--wpcp-click-lightbox-color-hover'] = hover.iconColor;
	}
	if (hover.backgroundColor) {
		styles['--wpcp-click-lightbox-bg-hover'] = hover.backgroundColor;
	}

	applyBorderVars(styles, normal, {}, '--wpcp-click-icon');
	applyBorderVars(styles, hover, normal, '--wpcp-click-icon-hover');

	if (!hasSurfaceStyles(normal, hover)) {
		if (preset === 'filled' && !styles['--wpcp-click-lightbox-bg']) {
			styles['--wpcp-click-lightbox-bg'] = 'rgba(0,0,0,0.45)';
		} else if (preset === 'outlined') {
			styles['--wpcp-click-icon-border-style'] = 'solid';
			styles['--wpcp-click-icon-border-color'] = 'currentColor';
			styles['--wpcp-click-icon-border-width'] = '2px';
			styles['--wpcp-click-lightbox-bg'] = 'transparent';
		} else if (preset === 'minimal') {
			styles['--wpcp-click-lightbox-bg'] = 'transparent';
		}
	}

	return styles;
};

/**
 * Build the icon-selector variable map for one device.
 *
 * @param {Object} settings Migrated global settings.
 * @param {string} device   Device key (Desktop / Tablet / Mobile).
 * @return {Object} `{ '--wpcp-*': value }` for the lightbox icon.
 */
const buildIconVars = (settings, device) => {
	const styles = {};
	const iconStyle = settings.iconStyle || {};

	const size = rangerCss(iconStyle.size, device);
	if (size) {
		styles['--wpcp-icon-size'] = size;
	}

	const padding = spacingGenerate(iconStyle.padding, device, false);
	if (padding && !isZeroSpacingCss(padding)) {
		styles['--wpcp-click-icon-padding'] = padding;
	}

	if (device === 'Desktop') {
		const radius = spacingGenerate(iconStyle.borderRadius, device, true);
		if (radius && !isZeroSpacingCss(radius)) {
			styles['--wpcp-click-icon-radius'] = radius;
		}
		const preset = ICON_STYLE_PRESETS.includes(settings.lightboxIconStyle)
			? settings.lightboxIconStyle
			: 'default';
		Object.assign(styles, buildSurfaceVars(iconStyle, preset));
	}

	return styles;
};

/**
 * Build `{ class, styles }` rules for one device.
 *
 * @param {Object} selectors createSelectors() output (uses `.wrapper`).
 * @param {Object} settings  Migrated global settings.
 * @param {string} device    Device key.
 * @return {Array} Zero or more rules.
 */
const buildRulesForDevice = (selectors, settings, device) => {
	const rules = [];
	const wrapperSel = `${selectors.wrapper} .wpcp-overlay-icons`;
	const iconSel = `${selectors.wrapper} .wpcp-overlay-icon.wpcp-lightbox-icon`;

	if (device === 'Desktop') {
		const offset = settings.iconOffset || {};
		const offsetCss =
			offset.value !== undefined && offset.value !== '' ? `${offset.value}${offset.unit || 'px'}` : '';
		if (offsetCss) {
			rules.push({ class: wrapperSel, styles: { '--wpcp-overlay-offset': offsetCss } });
		}
	}

	const iconVars = buildIconVars(settings, device);
	if (Object.keys(iconVars).length > 0) {
		rules.push({ class: iconSel, styles: iconVars });
	}

	return rules;
};

/**
 * Base (Desktop) overlay global-icon rules.
 *
 * @param {Object} selectors  createSelectors() output.
 * @param {Object} attributes Block attributes.
 * @return {Array} `{ class, styles }` rules.
 */
export const generateOverlayGlobalIconBaseRules = (selectors, attributes) => {
	if (!usesGlobalLightboxIcon(attributes)) {
		return [];
	}
	const settings = getMigratedGlobalSettings();
	return settings ? buildRulesForDevice(selectors, settings, 'Desktop') : [];
};

/**
 * Responsive (Tablet / Mobile) overlay global-icon rules.
 *
 * @param {Object} selectors  createSelectors() output.
 * @param {Object} attributes Block attributes.
 * @param {string} device     Device key.
 * @return {Array} `{ class, styles }` rules.
 */
export const generateOverlayGlobalIconResponsiveRules = (selectors, attributes, device) => {
	if (device === 'Desktop' || !usesGlobalLightboxIcon(attributes)) {
		return [];
	}
	const settings = getMigratedGlobalSettings();
	return settings ? buildRulesForDevice(selectors, settings, device) : [];
};
