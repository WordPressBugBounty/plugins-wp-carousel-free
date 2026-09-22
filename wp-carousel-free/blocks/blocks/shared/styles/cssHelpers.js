/**
 * Attribute → CSS string helpers used by carouselDynamicCss.js.
 *
 * These take block attribute objects (spacing, border, typography, background, shadow)
 * and produce CSS-ready strings/objects. Pure CSS string utilities live in `./cssUtils`.
 */

import { cssDataCheck, getUnit, sanitizeCssUnit, sanitizeShadowPreset } from './cssUtils';
import { sanitizeCssColor } from './sanitizeCssColor';

// Strict finite-number coercion (matches PHP is_numeric — a unit string like
// "8px" or "" → null, NOT a leading-number parse).
const toFiniteNumber = (value) => {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}
	const trimmed = String(value ?? '').trim();
	if (trimmed === '') {
		return null;
	}
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) ? numeric : null;
};

/**
 * Sanitize a font-family name for CSS emission — mirrors
 * TypographyCss::sanitize_font_family() on the PHP side.
 *
 * @param {string} family - Raw family name
 * @return {string} Safe family name, or '' when rejected
 */
const sanitizeFontFamily = (family) => {
	if (typeof family !== 'string') {
		return '';
	}
	const trimmed = family.trim();
	return /^[\w\s'",-]{1,120}$/u.test(trimmed) ? trimmed : '';
};

/**
 * Sanitize a font-weight value (numeric 1–1000 or keyword) — mirrors
 * TypographyCss::sanitize_font_weight().
 *
 * @param {*} weight - Raw weight
 * @return {string} Safe weight, or '' when rejected
 */
const sanitizeFontWeight = (weight) => {
	if (typeof weight === 'number' && Number.isFinite(weight)) {
		return weight >= 1 && weight <= 1000 ? String(weight) : '';
	}
	if (typeof weight !== 'string') {
		return '';
	}
	const trimmed = weight.trim();
	return ['normal', 'bold', 'bolder', 'lighter'].includes(trimmed.toLowerCase()) ? trimmed : '';
};

/**
 * Sanitize a keyword-constrained typography sub-value — mirrors
 * TypographyCss::sanitize_typography_keyword().
 *
 * @param {*}        value    - Raw value
 * @param {string[]} keywords - Allowed keyword set (lowercase)
 * @return {string} Safe value, or '' when rejected
 */
const sanitizeTypographyKeyword = (value, keywords) => {
	if (typeof value !== 'string') {
		return '';
	}
	const trimmed = value.trim();
	return keywords.includes(trimmed.toLowerCase()) ? trimmed : '';
};

/**
 * Generate ranger CSS string from responsive ranger attribute.
 * @param {Object} attr   - Spacing attribute
 * @param {string} device - Device name (Desktop, Tablet, Mobile)
 */
export const rangerCss = (attr, device = 'Desktop') => {
	const value = attr?.device?.[device];
	if (value === undefined || value === null || value === '') {
		return '';
	}
	const unit = sanitizeCssUnit(attr?.unit?.[device] || '');
	return `${value}${unit}`;
};

/**
 * Generate spacing CSS string from responsive spacing attribute.
 * @param {Object}  attr     - Spacing attribute
 * @param {string}  device   - Device name (Desktop, Tablet, Mobile)
 * @param {boolean} isSingle - Whether to generate single value
 */
export const spacingGenerate = (attr, device = 'Desktop', isSingle = false) => {
	if (!attr) {
		return '';
	}

	// Unset sides arrive as '' (the Spacing control's empty marker), not undefined,
	// so a destructuring default never fires — coerce each side to 0 or a partially
	// edited control emits `24px px px px`. Mirrors SpacingCss::coerce_spacing_side().
	const side = (value) => (value === '' || value === null || value === undefined ? 0 : value);

	// Legacy flat structure (old attribute format)
	if (!attr?.device && typeof attr?.value === 'object') {
		const unit = typeof attr?.unit === 'string' ? attr.unit : 'px';
		const val = attr.value;

		const top = side(val.top);
		if (isSingle || attr?.allChange) {
			return `${top}${unit}`;
		}
		return `${top}${unit} ${side(val.right)}${unit} ${side(val.bottom)}${unit} ${side(
			val.left
		)}${unit}`;
	}

	// Modern responsive structure
	let unit = 'px';
	if (typeof attr?.unit === 'string') {
		unit = attr.unit;
	} else if (typeof attr?.unit?.[device] === 'string') {
		unit = attr.unit[device];
	}

	const deviceData = attr?.device?.[device] || {};

	const top = side(deviceData.top);
	if (isSingle || attr?.allChange) {
		return `${top}${unit}`;
	}

	return `${top}${unit} ${side(deviceData.right)}${unit} ${side(deviceData.bottom)}${unit} ${side(
		deviceData.left
	)}${unit}`;
};

/**
 * True when a spacing CSS string is all zeros (omit the var so static SCSS defaults apply).
 *
 * @param {string} css Spacing value e.g. `0px` or `0px 0px 0px 0px`.
 * @return {boolean} Whether every component is zero.
 */
export const isZeroSpacingCss = (css) => {
	if (!css || typeof css !== 'string') {
		return true;
	}
	return css
		.trim()
		.split(/\s+/)
		.every((part) => /^0(\.0+)?(px|em|rem|%)?$/.test(part));
};

/**
 * Generate border CSS object.
 * @param {Object} border      - Border options
 * @param {Object} borderWidth - Border width options
 */
export const borderCss = (border, borderWidth) => {
	const borderStyle = border?.style;

	if (borderStyle === 'none') {
		return { border: 'none' };
	}

	const fromDevice = getUnit(borderWidth, 'Desktop');
	let widthUnit = fromDevice;
	if (typeof widthUnit !== 'string' || String(widthUnit).trim() === '') {
		widthUnit = typeof borderWidth?.unit === 'string' ? borderWidth.unit : 'px';
	}
	const desktopWidth = borderWidth?.device?.Desktop;
	let widthValue = borderWidth?.value;
	if (widthValue === undefined) {
		widthValue = borderWidth?.allChange ? desktopWidth?.top : desktopWidth;
	}

	return {
		'border-style': borderStyle,
		'border-color': border?.color,
		'border-width': cssDataCheck(widthValue, widthUnit),
	};
};

/**
 * Generate box-shadow CSS string.
 * @param {Object} shadow - Shadow options
 */
export const getBoxShadowValue = (shadow) => {
	if (!shadow || typeof shadow !== 'object') {
		return '';
	}

	const { color, selectDefault, value, unit } = shadow;

	if (color === '') {
		return '';
	}

	// Predefined shadow (not custom): presets are our own var(--wpcp-shadow-*)
	// tokens; anything else is dropped.
	if (selectDefault !== 'custom') {
		return selectDefault ? sanitizeShadowPreset(selectDefault) : '';
	}

	// Custom shadow
	// Responsive object value (top/right/bottom/left)
	if (typeof value === 'object' && value !== null) {
		const safeColor = sanitizeCssColor(color);
		if (!safeColor) {
			return '';
		}
		// Coerce each side through the strict numeric gate so an array/NaN
		// side cannot stringify as "Array" or "NaN" inside the value.
		const top = toFiniteNumber(value.top ?? 0) ?? 0;
		const right = toFiniteNumber(value.right ?? 0) ?? 0;
		const bottom = toFiniteNumber(value.bottom ?? 0) ?? 0;
		const left = toFiniteNumber(value.left ?? 0) ?? 0;
		const shadowUnit = String(unit ?? '').toLowerCase();
		const inset = shadowUnit === 'inset' ? 'inset ' : '';
		return `${inset}${top}px ${right}px ${bottom}px ${left}px ${safeColor}`.trim();
	}

	// Fallback: if value is a raw string/number (very old format)
	return String(value ?? '').trim() || 'none';
};

/**
 * Generate background value.
 * @param {Object} background  - Background options
 * @param {Object} bgImgObject - Background image object
 */
export const getBgValue = (background, bgImgObject = {}) => {
	const bgType = background?.style;
	if (!bgType) {
		return '';
	}

	const imageUrl = bgImgObject?.url;

	const backgroundMap = {
		transparent: 'transparent',
		solid: background?.solid,
		gradient: background?.gradient,
		image: imageUrl ? `url(${imageUrl})` : 'none',
	};

	return backgroundMap[bgType] ?? '';
};

/**
 * Resolve an overlay color attribute into the CSS property + value to emit on the
 * overlay tint layer.
 *
 * The Overlay control is a Background picker, so the saved value is a
 * `{ style, solid, gradient }` object; older posts store a bare solid-color
 * string. For a solid overlay this resolves to `background-color` + the solid
 * color (identical to the legacy string path); for a gradient it resolves to
 * `background` + the gradient. The resolved `solid` also feeds the audio style-1
 * gradient recipe and the alpha-baked anim tint (both solid-only). Twin of
 * ImageCss::resolve_overlay_bg.
 *
 * @param {*}      raw          Saved value — object, legacy string, or undefined.
 * @param {string} defaultColor Solid fallback when no solid color is set.
 * @return {{ style: string, solid: string, gradient: string, css: string, prop: string }} Resolved background state.
 */
export const resolveOverlayBg = (raw, defaultColor) => {
	const isObject = raw && typeof raw === 'object';
	const style = isObject && raw.style ? raw.style : 'solid';
	const gradient = isObject ? raw.gradient || '' : '';

	let solid;
	if (isObject) {
		solid = raw.solid || defaultColor;
	} else if (typeof raw === 'string' && raw) {
		solid = raw;
	} else {
		solid = defaultColor;
	}

	if ('gradient' === style) {
		return { style, solid, gradient, css: gradient, prop: 'background' };
	}
	return { style, solid, gradient, css: solid, prop: 'background-color' };
};

/**
 * @param {string} name - Font family name
 */
const isDefaultOrEmptyFontFamily = (name) => {
	if (name === null || name === undefined) {
		return true;
	}
	const s = String(name).trim();
	return s === '' || /^default$/i.test(s);
};

export const getTypographyStyles = ({
	typography,
	fontSize,
	fontSpacing,
	lineHeight,
	wordSpacing,
	device = 'Desktop',
}) => {
	const root = typography || {};
	const fam = root.family;
	const famObj = fam && typeof fam === 'object' && !Array.isArray(fam) ? fam : null;

	// Typography control stores font face + weight/style/transform/decoration on `family` (flat), not family.typography.*
	const rawFamily =
		(typeof fam === 'string' && fam.trim() !== '' ? fam : '') ||
		famObj?.typography?.family ||
		famObj?.googleFont?.family ||
		(typeof famObj?.family === 'string' ? famObj.family : '');

	const fontWeight = sanitizeFontWeight(famObj?.fontWeight ?? root.fontWeight);
	const decoration = sanitizeTypographyKeyword(famObj?.decoration ?? root.decoration, [
		'underline',
		'overline',
		'line-through',
		'underline overline',
	]);
	const transform = sanitizeTypographyKeyword(famObj?.transform ?? root.transform, [
		'uppercase',
		'lowercase',
		'capitalize',
		'full-width',
		'full-size-kana',
	]);
	const fontStyle = sanitizeTypographyKeyword(famObj?.style ?? root.style, ['italic', 'oblique']);

	const typographyStyles = {
		...(isDefaultOrEmptyFontFamily(rawFamily)
			? {}
			: { 'font-family': sanitizeFontFamily(rawFamily) }),
		'font-weight': fontWeight,
		'text-decoration': decoration,
		'text-transform': transform,
		'font-style': fontStyle,
	};

	const fontStyles = {};

	const styleProperties = [
		{ key: 'font-size', source: fontSize },
		{ key: 'letter-spacing', source: fontSpacing },
		{ key: 'word-spacing', source: wordSpacing },
	];

	styleProperties.forEach(({ key, source }) => {
		const deviceValue = source?.device?.[device];
		if (deviceValue !== null && deviceValue !== undefined && deviceValue !== '') {
			const unit = source?.unit?.[device] ?? (typeof source?.unit === 'string' ? source.unit : 'px');
			fontStyles[key] = `${deviceValue}${sanitizeCssUnit(unit)}`;
		} else if (source?.value !== null && source?.value !== undefined && source.value !== '') {
			const unit = source?.unit ?? 'px';
			fontStyles[key] = `${source.value}${sanitizeCssUnit(unit)}`;
		}
	});

	// Line height is special (no unit in most cases)
	const lh = lineHeight?.device?.[device];
	if (lh !== null && lh !== undefined && lh !== '') {
		fontStyles['line-height'] = lh;
	}

	// Final cleanup - keep 0 values!
	return Object.fromEntries(
		Object.entries({ ...typographyStyles, ...fontStyles }).filter(
			// eslint-disable-next-line no-unused-vars
			([_, value]) => value !== null && value !== undefined && value !== ''
		)
	);
};

/** Re-export so callers that imported `cssDataCheck` from helpFn keep working through the new module. */
export { cssDataCheck };
