/**
 * Tiles AJAX pagination dynamic CSS generator.
 *
 * Emits CSS scoped under `#{uniqueId} .wpcp-ajax-pagination` for
 * two-instance safety. The PHP mirror lives in
 * `src/Blocks/Styles/AjaxPaginationStyle.php` and must stay byte-equivalent
 * for canonical attribute sets — keep both in sync.
 *
 * Selectors used (BEM):
 *   .wpcp-ajax-pagination                              wrapper
 *   .wpcp-ajax-pagination__btn                         number / ellipsis
 *   .wpcp-ajax-pagination__btn:hover,
 *     .wpcp-ajax-pagination__btn.is-active             hover-state target
 */

import { objectToCssString, mergeCssRulesBySelector, wrapInMediaQuery } from './cssUtils';
import { getTypographyStyles } from './cssHelpers';
import { TABLET_MEDIA_QUERY, MOBILE_MEDIA_QUERY } from './constants';

const DEVICES = ['Desktop', 'Tablet', 'Mobile'];

// Schema defaults mirrored from `TilesSchema.php > paginationOptions`.
// Matching values are skipped so the static SCSS baseline shows through.
const DEFAULTS = {
	justifyContent: 'center',
	gap: { value: 10, unit: 'px' },
	padding: {
		Desktop: { top: 15, right: 0, bottom: 15, left: 0, unit: 'px' },
	},
	margin: {
		Desktop: { top: 48, right: 0, bottom: 0, left: 0, unit: 'px' },
	},
	color: '#2c2d2f',
	backgroundColor: '#ffffff',
	colorHover: '#ffffff',
	backgroundColorHover: '#19949e',
	borderStyle: 'solid',
	borderWidth: { top: 1, right: 1, bottom: 1, left: 1, unit: 'px' },
	borderColor: '#dddddd',
	borderColorHover: '#19949e',
	borderRadius: {
		Desktop: { top: 3, right: 3, bottom: 3, left: 3, unit: 'px' },
	},
};

const normalizeColor = (value) => {
	if (typeof value !== 'string') {
		return '';
	}
	return value.trim().toLowerCase();
};

const colorDiffers = (value, defaultValue) =>
	typeof value === 'string' && value !== '' && normalizeColor(value) !== defaultValue;

const getDeviceValue = (obj, device, fallback) => {
	if (!obj || typeof obj !== 'object') {
		return fallback;
	}
	if (typeof obj[device] !== 'undefined' && obj[device] !== '') {
		return obj[device];
	}
	if (typeof obj.Desktop !== 'undefined' && obj.Desktop !== '') {
		return obj.Desktop;
	}
	return fallback;
};

const getUnitForDevice = (unitAttr, device, fallback = 'px') => {
	if (typeof unitAttr === 'string') {
		return unitAttr || fallback;
	}
	return getDeviceValue(unitAttr, device, fallback);
};

const spacingDeviceParts = (spacing, device) => {
	if (!spacing?.device?.[device]) {
		return null;
	}
	const unit = getUnitForDevice(spacing.unit, device, 'px');
	const value = spacing.device[device];
	return {
		top: Number(value.top ?? 0),
		right: Number(value.right ?? 0),
		bottom: Number(value.bottom ?? 0),
		left: Number(value.left ?? 0),
		unit,
	};
};

const spacingPartsMatchDefault = (parts, defaults) => {
	if (!parts || !defaults) {
		return false;
	}
	return (
		parts.unit === defaults.unit &&
		parts.top === defaults.top &&
		parts.right === defaults.right &&
		parts.bottom === defaults.bottom &&
		parts.left === defaults.left
	);
};

const spacingCssFromParts = (parts) =>
	`${parts.top}${parts.unit} ${parts.right}${parts.unit} ${parts.bottom}${parts.unit} ${parts.left}${parts.unit}`;

const borderWidthParts = (borderWidth) => {
	if (!borderWidth?.value) {
		return null;
	}
	const unit = typeof borderWidth.unit === 'string' ? borderWidth.unit : 'px';
	const value = borderWidth.value;
	return {
		top: Number(value.top ?? 0),
		right: Number(value.right ?? 0),
		bottom: Number(value.bottom ?? 0),
		left: Number(value.left ?? 0),
		unit,
	};
};

const boxShadowCss = (shadow) => {
	if (!shadow || typeof shadow !== 'object') {
		return null;
	}

	if (
		typeof shadow.selectDefault === 'string' &&
		shadow.selectDefault !== '' &&
		shadow.selectDefault !== 'custom'
	) {
		return shadow.selectDefault;
	}

	const shadowValue = shadow.value && typeof shadow.value === 'object' ? shadow.value : {};
	const horizontal = Number(shadow.horizontal ?? shadow.x ?? shadowValue.top ?? 0);
	const vertical = Number(shadow.vertical ?? shadow.y ?? shadowValue.right ?? 0);
	const blur = Number(shadow.blur ?? shadowValue.bottom ?? 0);
	const spread = Number(shadow.spread ?? shadow.speared ?? shadowValue.left ?? 0);
	const color = shadow.color || '#4E4F521A';
	const shadowPosition = shadow.position || shadow.shadowType || shadow.unit;
	const inset = shadowPosition === 'inset' ? 'inset ' : '';
	return `${inset}${horizontal}px ${vertical}px ${blur}px ${spread}px ${color}`;
};

const collectWrapperStyles = (po, device) => {
	const styles = {};

	if (device === 'Desktop') {
		const justifyContent = po.justifyContent;
		if (justifyContent && justifyContent !== DEFAULTS.justifyContent) {
			styles['justify-content'] = justifyContent;
		}
	}

	const gapValue = Number(getDeviceValue(po.gap?.device, device, undefined));
	if (Number.isFinite(gapValue)) {
		const gapUnit = getUnitForDevice(po.gap?.unit, device, 'px');
		if (gapValue !== DEFAULTS.gap.value || gapUnit !== DEFAULTS.gap.unit) {
			styles.gap = `${gapValue}${gapUnit}`;
		}
	}

	const marginParts = spacingDeviceParts(po.margin, device);
	if (marginParts && !spacingPartsMatchDefault(marginParts, DEFAULTS.margin[device])) {
		styles.margin = spacingCssFromParts(marginParts);
	}

	return styles;
};

const collectButtonStyles = (po, device, isHover) => {
	const styles = {};

	if (!isHover) {
		const paddingParts = spacingDeviceParts(po.padding, device);
		if (paddingParts && !spacingPartsMatchDefault(paddingParts, DEFAULTS.padding[device])) {
			styles.padding = spacingCssFromParts(paddingParts);
		}
	}

	if (device !== 'Desktop') {
		return styles;
	}

	if (!isHover) {
		if (po.color && normalizeColor(po.color) !== DEFAULTS.color) {
			styles.color = po.color;
		}
		if (po.backgroundColor && normalizeColor(po.backgroundColor) !== DEFAULTS.backgroundColor) {
			styles['background-color'] = po.backgroundColor;
		}
		if (po.borderStyle && po.borderStyle !== 'none') {
			if (po.borderStyle !== DEFAULTS.borderStyle) {
				styles['border-style'] = po.borderStyle;
			}
			const widthParts = borderWidthParts(po.borderWidth);
			if (widthParts && !spacingPartsMatchDefault(widthParts, DEFAULTS.borderWidth)) {
				styles['border-width'] = spacingCssFromParts(widthParts);
			}
			if (po.borderColor && normalizeColor(po.borderColor) !== DEFAULTS.borderColor) {
				styles['border-color'] = po.borderColor;
			}
		} else if (po.borderStyle === 'none') {
			styles['border-style'] = 'none';
		}
		if (po.boxShadowEnable) {
			const shadow = boxShadowCss(po.boxShadow);
			if (shadow) {
				styles['box-shadow'] = shadow;
			}
		}
		const radiusParts = spacingDeviceParts(po.borderRadius, device);
		if (radiusParts && !spacingPartsMatchDefault(radiusParts, DEFAULTS.borderRadius[device])) {
			styles['border-radius'] = spacingCssFromParts(radiusParts);
		}
	} else {
		const colorHover = po.colorHover || DEFAULTS.colorHover;
		if (colorDiffers(colorHover, DEFAULTS.colorHover) || colorDiffers(po.color, DEFAULTS.color)) {
			styles.color = colorHover;
		}
		const backgroundColorHover = po.backgroundColorHover || DEFAULTS.backgroundColorHover;
		if (
			colorDiffers(backgroundColorHover, DEFAULTS.backgroundColorHover) ||
			colorDiffers(po.backgroundColor, DEFAULTS.backgroundColor)
		) {
			styles['background-color'] = backgroundColorHover;
		}
		const borderColorHover = po.borderColorHover || DEFAULTS.borderColorHover;
		if (
			po.borderStyle &&
			po.borderStyle !== 'none' &&
			(colorDiffers(borderColorHover, DEFAULTS.borderColorHover) ||
				colorDiffers(po.borderColor, DEFAULTS.borderColor))
		) {
			styles['border-color'] = borderColorHover;
		}
		if (po.boxShadowHoverEnable) {
			const shadow = boxShadowCss(po.boxShadowHover);
			if (shadow) {
				styles['box-shadow'] = shadow;
			}
		} else if (po.boxShadowEnable) {
			styles['box-shadow'] = 'none';
		}
	}

	return styles;
};

const collectTypographyStyles = (po, device) => {
	const typography = po.typography;
	if (!typography || typeof typography !== 'object') {
		return {};
	}
	return getTypographyStyles({
		typography,
		fontSize: typography.fontSize,
		fontSpacing: typography.fontSpacing,
		lineHeight: typography.lineHeight,
		wordSpacing: typography.wordSpacing,
		device,
	});
};

const ajaxPaginationDynamicCss = (attributes) => {
	const uniqueId = attributes?.uniqueId;
	const po = attributes?.paginationOptions;
	if (!uniqueId || !po) {
		return '';
	}

	const root = `#${uniqueId} .wpcp-ajax-pagination`;
	const numberRoot = `${root}.wpcp-ajax-pagination--number`;
	const buttonSelector = `${root} .wpcp-ajax-pagination__btn:not(.is-ellipsis)`;
	const hoverActiveSelector = `${root} .wpcp-ajax-pagination__btn:not(.is-ellipsis):hover:not(:disabled), ${root} .wpcp-ajax-pagination__btn.is-active`;

	const rulesByDevice = { Desktop: [], Tablet: [], Mobile: [] };

	DEVICES.forEach((device) => {
		const wrapperStyles = collectWrapperStyles(po, device);
		const justifyContent = wrapperStyles['justify-content'];
		delete wrapperStyles['justify-content'];

		if (Object.keys(wrapperStyles).length) {
			rulesByDevice[device].push({ class: root, styles: wrapperStyles });
		}
		if (justifyContent) {
			rulesByDevice[device].push({
				class: numberRoot,
				styles: { 'justify-content': justifyContent },
			});
		}

		const normalButton = collectButtonStyles(po, device, false);
		if (Object.keys(normalButton).length) {
			rulesByDevice[device].push({ class: buttonSelector, styles: normalButton });
		}

		const typographyStyles = collectTypographyStyles(po, device);
		if (Object.keys(typographyStyles).length) {
			rulesByDevice[device].push({ class: buttonSelector, styles: typographyStyles });
		}

		const hoverButton = collectButtonStyles(po, device, true);
		if (Object.keys(hoverButton).length) {
			rulesByDevice[device].push({ class: hoverActiveSelector, styles: hoverButton });
		}
	});

	const desktopCss = objectToCssString(mergeCssRulesBySelector(rulesByDevice.Desktop));
	const tabletCss = wrapInMediaQuery(
		objectToCssString(mergeCssRulesBySelector(rulesByDevice.Tablet)),
		TABLET_MEDIA_QUERY
	);
	const mobileCss = wrapInMediaQuery(
		objectToCssString(mergeCssRulesBySelector(rulesByDevice.Mobile)),
		MOBILE_MEDIA_QUERY
	);

	return [desktopCss, tabletCss, mobileCss].filter(Boolean).join('\n');
};

export default ajaxPaginationDynamicCss;
