/**
 * Content Area panel dynamic-CSS generators.
 *
 * Mirrors the content-area branch of CarouselDynamicCss.php (the ContentAreaCss
 * trait). Split out of the carouselDynamicCss monolith; the editor composes these
 * through the default `dynamicCss` export exactly as before. Keep rule-for-rule
 * parity with the PHP side — the tests/css-parity harness gates it.
 */

import { DEVICES, SOURCE_TYPES } from './constants';
import { getBgValue, spacingGenerate } from './cssHelpers';
import {
	hasResponsiveSpacing,
	isZeroSpacingValue,
	pushStylePropertyRuleIfDiffers,
} from './cssRuleHelpers';
import { resolveContentOrientation } from '../inspector/fragments/contentOrientations';
import { sanitizeCssColor } from './sanitizeCssColor';

/** @typedef {'Desktop'|'Tablet'|'Mobile'} DeviceType */

const hasNonZeroResponsiveSpacing = (attr) =>
	attr?.device &&
	Object.values(attr.device).some(
		(d) =>
			d &&
			['top', 'right', 'bottom', 'left'].some((key) => {
				const value = d[key];
				return value !== undefined && value !== '' && Number(value) !== 0;
			})
	);

const hasExplicitResponsiveSpacing = (attr, customized = false) =>
	customized === true || hasNonZeroResponsiveSpacing(attr);

// Scalars fan out to all four sides. Diagonal needs a taller top inset than the
// other three sides, so it carries a per-side map; getDefaultContentAreaPadding
// then emits with allChange:false so spacingGenerate writes every side.
const CONTENT_AREA_DEFAULT_PADDING_BY_ORIENTATION = {
	'image-top': 0,
	overlay: 15,
	diagonal: { top: 24, right: 15, bottom: 15, left: 15 },
};

const getDefaultContentAreaPadding = (attributes = {}, device = DEVICES.DESKTOP) => {
	const sourceType = attributes?.sourceType || SOURCE_TYPES.IMAGE;
	const contentOrientation = resolveContentOrientation(
		sourceType,
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const paddingValue = CONTENT_AREA_DEFAULT_PADDING_BY_ORIENTATION[contentOrientation] ?? 15;

	if (!paddingValue) {
		return null;
	}

	// A per-side map (diagonal) emits every side explicitly (allChange:false);
	// a scalar fans out to all four sides as a single value (allChange:true).
	const isPerSide = typeof paddingValue === 'object';
	const sides = isPerSide
		? paddingValue
		: { top: paddingValue, right: paddingValue, bottom: paddingValue, left: paddingValue };

	return {
		allChange: !isPerSide,
		unit: { [device]: 'px' },
		device: {
			[device]: sides,
		},
	};
};

export const getEffectiveContentAreaPadding = (
	contentAreaOptions = {},
	device,
	attributes = {}
) => {
	if (
		hasExplicitResponsiveSpacing(contentAreaOptions.padding, contentAreaOptions.paddingCustomized)
	) {
		return contentAreaOptions.padding;
	}

	return getDefaultContentAreaPadding(attributes, device);
};

const sanitizeHoverColor = (raw) => sanitizeCssColor(raw) ?? '';

const resolveContentHoverColorValue = (value) => {
	if (value && typeof value === 'object') {
		return sanitizeHoverColor(value.hoverColor ?? '');
	}
	return '';
};

// Title hover color is stored per source: post/external use postContentOptions.titleHoverColor,
// product uses productContentOptions.titleHoverColor (both flat strings), while image/audio use
// the polymorphic contentOptions.titleColor.hoverColor. Without this routing the post/product
// "Title Hover Color" control writes an attribute no CSS reads. Mirrors
// ContentAreaCss::resolve_title_hover_color.
const resolveTitleHoverColor = (attributes, contentOptions) => {
	const sourceType = attributes?.sourceType || SOURCE_TYPES.IMAGE;
	if (
		sourceType === SOURCE_TYPES.POST ||
		sourceType === SOURCE_TYPES.EXTERNAL ||
		sourceType === SOURCE_TYPES.VIDEO
	) {
		return sanitizeHoverColor(attributes?.postContentOptions?.titleHoverColor || '');
	}
	if (sourceType === SOURCE_TYPES.PRODUCT) {
		return sanitizeHoverColor(attributes?.productContentOptions?.titleHoverColor || '');
	}
	return resolveContentHoverColorValue(contentOptions?.titleColor);
};

export const getContentAreaPaddingSelector = (selectors, attributes = {}) => {
	const sourceType = attributes?.sourceType || SOURCE_TYPES.IMAGE;
	const contentOrientation = resolveContentOrientation(
		sourceType,
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);

	if (
		sourceType === SOURCE_TYPES.AUDIO &&
		['style2', 'style3', 'style4'].includes(contentOrientation)
	) {
		return `${selectors.wrapper} .wpcp-item > .wpcp-item-inner--audio > .wpcp-audio-card`;
	}

	if (contentOrientation === 'diagonal') {
		return selectors.diagonalCaption;
	}

	return contentOrientation === 'image-top' ? selectors.item : selectors.content;
};

const getContentAreaStyleSelector = (selectors, attributes = {}) => {
	const sourceType = attributes?.sourceType || SOURCE_TYPES.IMAGE;
	const contentOrientation = resolveContentOrientation(
		sourceType,
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);

	if (
		sourceType === SOURCE_TYPES.AUDIO &&
		['style2', 'style3', 'style4'].includes(contentOrientation)
	) {
		return `${selectors.wrapper} .wpcp-item > .wpcp-item-inner--audio > .wpcp-audio-card`;
	}

	if (contentOrientation === 'diagonal') {
		return selectors.diagonalCaption;
	}

	return contentOrientation === 'image-top' ? selectors.item : selectors.content;
};

const getContentAreaStyleHoverSelector = (selectors, attributes = {}) => {
	const sourceType = attributes?.sourceType || SOURCE_TYPES.IMAGE;
	const contentOrientation = resolveContentOrientation(
		sourceType,
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);

	if (
		sourceType === SOURCE_TYPES.AUDIO &&
		['style2', 'style3', 'style4'].includes(contentOrientation)
	) {
		return `${selectors.wrapper} .wpcp-item:hover > .wpcp-item-inner--audio > .wpcp-audio-card`;
	}

	if (contentOrientation === 'diagonal') {
		return `${selectors.wrapper} .wpcp-item:hover .wpcp-diagonal-caption`;
	}

	return contentOrientation === 'image-top'
		? selectors.itemHover
		: `${selectors.wrapper} .wpcp-item:hover .wpcp-item-content`;
};

export const generateContentAreaAndColors = (
	selectors,
	contentAreaOptions,
	contentOptions,
	ratingOptions,
	attributes = {}
) => {
	const rules = [];
	const { itemHover } = selectors;
	const sourceType = attributes?.sourceType || SOURCE_TYPES.IMAGE;
	const contentOrientation = resolveContentOrientation(
		sourceType,
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const contentAreaStyleSelector = getContentAreaStyleSelector(selectors, attributes);
	const contentAreaStyleHoverSelector = getContentAreaStyleHoverSelector(selectors, attributes);
	// ── Layer-5 remainder: card background (NOT tokenized). It fails the D7
	// "set <property> to <value>" test, so it stays a paired rule-string builder
	// gated by CSS-string css-parity (it emits no --wpcp-*): `getBgValue`
	// resolves a polymorphic value by `background.style` (transparent keyword /
	// solid color / gradient / `url()` image) — no single static fallback fits,
	// and it is orientation-routed (image-top → item, others → content).
	// See src/Blocks/Styles/README.md (Layer-5 catalogue).
	// Card Element background defaults are shared by Image/Post/Product sources:
	// an empty solid color means "no authored background rule." Source-specific
	// defaults should be normalized before this generator receives attributes,
	// and explicit user-selected colors/gradients/images take precedence because
	// only non-empty resolved values are emitted below.
	if (contentAreaOptions?.contentAreaBackground?.color) {
		const bg = getBgValue(contentAreaOptions.contentAreaBackground.color);
		pushStylePropertyRuleIfDiffers(rules, contentAreaStyleSelector, 'background', bg);
	}
	if (contentAreaOptions?.contentAreaBackground?.hover) {
		const bg = getBgValue(contentAreaOptions.contentAreaBackground.hover);
		pushStylePropertyRuleIfDiffers(rules, contentAreaStyleHoverSelector, 'background', bg);
	}
	if ('overlay' === contentOrientation) {
		const postContentOptions = attributes?.postContentOptions || {};
		const productContentOptions = attributes?.productContentOptions || {};
		const sourceSpecificContentColors =
			{
				[SOURCE_TYPES.POST]: {
					title: postContentOptions.titleColor,
					desc: postContentOptions.excerptColor,
				},
				[SOURCE_TYPES.EXTERNAL]: {
					title: postContentOptions.titleColor,
					desc: postContentOptions.excerptColor,
				},
				[SOURCE_TYPES.PRODUCT]: {
					title: productContentOptions.titleColor,
					desc: productContentOptions.descColor,
				},
			}[sourceType] || {};

		// Overlay and Content Box intentionally follow Diagonal: their default
		// title/description color is the static stylesheet's white fallback. Do not
		// seed Classic dark defaults here; only emit legacy source-specific custom
		// colors so older Post/Product saves still override the shared white default.
		// New saves mirror those controls into `contentOptions`, and the token bag
		// emitted later wins over this compatibility bridge.
		pushStylePropertyRuleIfDiffers(
			rules,
			selectors.wrapper,
			'--wpcp-content-title-color',
			sanitizeCssColor(sourceSpecificContentColors.title)
		);
		pushStylePropertyRuleIfDiffers(
			rules,
			selectors.wrapper,
			'--wpcp-content-desc-color',
			sanitizeCssColor(sourceSpecificContentColors.desc)
		);
	}

	// Card border + box-shadow are emitted as --wpcp-content-border-* /
	// --wpcp-content-shadow{,-hover} tokens via the style config; the static
	// stylesheet consumes them, orientation-routed (image-top → .wpcp-item,
	// generic overlay → .wpcp-item-content, audio style2/3/4 →
	// .wpcp-audio-card) to match the legacy contentAreaStyleSelector. See
	// config/style-config.js and the content-area card rules in style.scss.

	// Normal title/desc color → --wpcp-content-title-color / -desc-color tokens.
	// Defaults render from static SCSS: Classic stays dark, while Overlay,
	// Content Box, and Diagonal share the white fallback unless the user has
	// selected a custom normal color.
	// The titleLink `color:inherit; text-decoration:none` is now an unconditional
	// static rule. See config/style-config.js and style.scss. Title hover remains a
	// paired rule-string because it is still emitted dynamically.
	pushStylePropertyRuleIfDiffers(
		rules,
		`${selectors.title}:hover`,
		'color',
		resolveTitleHoverColor(attributes, contentOptions)
	);
	pushStylePropertyRuleIfDiffers(
		rules,
		`${itemHover} .wpcp-item-desc`,
		'color',
		resolveContentHoverColorValue(contentOptions?.descColor)
	);

	// Card text alignment: handled via `.wpcp-content-align--*` on `.wpcp-item-content` (style.scss).

	// Rating fill/empty colors are emitted as --wpcp-content-rating-fill/-empty
	// tokens via the style config; the static stylesheet consumes them (defaults
	// #ffd700 / #e0e0e0 render from static SCSS). See config/style-config.js.

	return rules;
};

// Title/desc/price margins are emitted via the config-driven `--wpcp-content-*-margin`
// tokens (config/style-config.js, `spacingFill` transform) and consumed by the static
// SCSS in place. See the style-config rows for the source-gating and the transform
// docblock for the fill / zero-fill policy that preserves the legacy clobber behavior.

/**
 * Responsive card/content padding rules (Layer-5 remainder).
 *
 * Padding stays a paired rule-string builder (gated by the css-parity per-side
 * baseline, not the value-map) rather than a config-row token, because it can't be
 * reproduced static-first without changing behavior:
 *  - **Load-bearing #uid specificity + orientation routing.** The emitted padding
 *    selector still needs the legacy `#uid …` specificity and must route by
 *    orientation (`.wpcp-item`, `.wpcp-item-content`, audio card, or diagonal's
 *    `.wpcp-diagonal-caption`). A static token-consuming rule cannot preserve that
 *    mix of selector targets and legacy clobber behavior.
 *  - **Per-device zero-fill.** The Spacing control writes only the active device;
 *    `spacingGenerate` then zero-fills the untouched breakpoints to an explicit
 *    `0` once customized — the inverse of the static `var(…, default)` fallback.
 *  - Conditional rule presence + 3-way selector routing (image-top → `.wpcp-item`,
 *    others → `.wpcp-item-content`, audio style2/3/4 → `.wpcp-audio-card`) plus a
 *    separate `contentPadding` (image-top inner). See src/Blocks/Styles/README.md.
 *
 * Mirror: ContentAreaCss::content_area_card_responsive_rules().
 *
 * @param {Object} selectors          Scoped selector map.
 * @param {Object} contentAreaOptions contentAreaOptions attribute group.
 * @param {string} device             Device type (Desktop|Tablet|Mobile).
 * @param {Object} [attributes]       Full block attribute tree (orientation routing).
 * @return {Array} CSS rules in the {class, styles} shape.
 */
export const generateCardResponsiveRules = (
	selectors,
	contentAreaOptions,
	device,
	attributes = {}
) => {
	const rules = [];
	const sourceType = attributes?.sourceType || SOURCE_TYPES.IMAGE;
	const contentOrientation = resolveContentOrientation(
		sourceType,
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const isClassicOrientation = contentOrientation === 'image-top';
	const paddingSelector = getContentAreaPaddingSelector(selectors, attributes);
	const effectivePadding = getEffectiveContentAreaPadding(contentAreaOptions, device, attributes);

	if (contentAreaOptions?.cardPadding && hasResponsiveSpacing(contentAreaOptions.cardPadding)) {
		const cardPaddingCss = spacingGenerate(contentAreaOptions.cardPadding, device);
		if (cardPaddingCss && !isZeroSpacingValue(cardPaddingCss)) {
			pushStylePropertyRuleIfDiffers(rules, paddingSelector, 'padding', cardPaddingCss);
		}
	}
	if (effectivePadding) {
		pushStylePropertyRuleIfDiffers(
			rules,
			paddingSelector,
			'padding',
			spacingGenerate(effectivePadding, device)
		);
	}
	if (
		isClassicOrientation &&
		contentAreaOptions?.contentPadding &&
		hasExplicitResponsiveSpacing(
			contentAreaOptions.contentPadding,
			contentAreaOptions.contentPaddingCustomized
		)
	) {
		pushStylePropertyRuleIfDiffers(
			rules,
			selectors.content,
			'padding',
			spacingGenerate(contentAreaOptions.contentPadding, device)
		);
	}
	// Card margin wraps the same content-area surface as padding (image-top →
	// .wpcp-item, others → .wpcp-item-content). Static-first: the all-zero schema
	// default emits nothing (isZeroSpacingValue guard), so only an authored margin
	// produces a rule. Mirrors ContentAreaCss::content_area_card_responsive_rules().
	if (contentAreaOptions?.cardMargin && hasResponsiveSpacing(contentAreaOptions.cardMargin)) {
		const cardMarginCss = spacingGenerate(contentAreaOptions.cardMargin, device);
		if (cardMarginCss && !isZeroSpacingValue(cardMarginCss)) {
			pushStylePropertyRuleIfDiffers(rules, paddingSelector, 'margin', cardMarginCss);
		}
	}
	// Card border-radius is emitted as the --wpcp-content-radius token (responsive,
	// single) via the style config; the static stylesheet consumes it, orientation-
	// routed like the border/shadow. See config/style-config.js and style.scss.

	return rules;
};
