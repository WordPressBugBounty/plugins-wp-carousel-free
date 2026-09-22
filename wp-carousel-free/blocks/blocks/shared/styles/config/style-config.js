/**
 * Style config — the single authored source mapping block attributes to dynamic
 * CSS custom-property tokens. Authored here in JS and codegen'd to the PHP array
 * `src/Blocks/Styles/StyleConfig.php` at build (`npm run sync:style-config`, CI
 * `--check`); PHP never reads this file at runtime.
 *
 * Both emitters — `tokens/emitTokens.js` ↔ `Tokens/EmitTokens.php` — are a
 * mechanical walk over these rows. A simple styled option becomes one row here
 * (plus a schema default and one static SCSS rule), with no generator code on
 * either side. Genuinely algorithmic CSS (Tiles bento grid math, conditional
 * rule *presence*, Swiper overrides) stays in paired Layer-5 concern modules,
 * NOT here.
 *
 * Each row MUST be pure JSON-serializable data (no functions) so it codegens to
 * PHP. See `src/Blocks/Styles/README.md` for the conventions.
 *
 * Row schema:
 * @typedef {Object} StyleConfigRow
 * @property {string}                                                                                           id        Unique row id (debugging / fixtures).
 * @property {string}                                                                                           attr      Dot-path into the attribute tree, e.g.
 *                                                                                                                        `imageOptions.imageBorderNormal.color`. For a
 *                                                                                                                        responsive row this points at the trio object.
 * @property {string}                                                                                           var       Token name, e.g. `--wpcp-img-border-color`. For
 *                                                                                                                        a responsive row the emitter reads each device
 *                                                                                                                        off `attr` and writes the same `var` into that
 *                                                                                                                        device's bag (the static SCSS reads it inside
 *                                                                                                                        the matching fixed-breakpoint `@media`).
 * @property {('raw'|'px'|'color'|'opacity'|'dimension'|'spacing'|'spacingBox'|'border'|'shadow'|'typography')} transform
 *                                                                                                                        Primitive that converts the attribute value to
 *                                                                                                                        the token value. `dimension` mirrors
 *                                                                                                                        getSocialRangerDimension; `spacingBox` mirrors
 *                                                                                                                        spacingGenerate (fill-0 box, or single with
 *                                                                                                                        `single`); `spacing` mirrors cssDataCheck.
 * @property {boolean}                                                                                          [device]  True when `attr` is a responsive trio; the
 *                                                                                                                        emitter writes the token into the Desktop /
 *                                                                                                                        Tablet / Mobile bags.
 * @property {boolean}                                                                                          [single]  For `spacingBox`: emit only the top value
 *                                                                                                                        (border-radius), not the four-side shorthand.
 * @property {string}                                                                                           [scope]   Sub-scope selector the token attaches to,
 *                                                                                                                        appended after `#uniqueId`. Omit for the
 *                                                                                                                        wrapper itself.
 * @property {Object}                                                                                           [when]    Declarative gate `{ attr, op, value }` —
 *                                                                                                                        op ∈ `eq` | `neq` | `truthy` | `in`. The row
 *                                                                                                                        emits only when the gate passes.
 * @property {*}                                                                                                [default] Off-default to suppress against (the value the
 *                                                                                                                        static SCSS already renders / the `var()`
 *                                                                                                                        fallback). Omit for presence-only emission.
 *                                                                                                                        Mirrors the EmissionPolicy `schemaDefault`.
 */

import paginationStyleConfig from './pagination-style-config.js';

// Thumbnails-slider rows gate on `blockName` so only that block emits them — the
// `thumbsArea` / `thumbnail` attribute groups exist only on the thumbnails-slider
// schema, and the static SCSS consumers are scoped to its markup. Mirrors the tiles
// blockName gate.
const THUMBS_SLIDER_GATE = {
	attr: 'blockName',
	op: 'in',
	value: ['thumbnails-slider', 'wp-carousel-pro/thumbnails-slider'],
};

/** @type {StyleConfigRow[]} */
const styleConfig = [
	// ── Image border (normal + hover) ──────────────────────────────────────────
	// The image media selector reads these tokens from static SCSS. Border
	// Normal/Hover rule: style + width are shared across states; only the color
	// carries a `-hover` variant. The color/width rows gate on the normal style so
	// nothing emits while the border is off (style `none`), matching the legacy
	// `borderCss()` guard. Width is the four-side shorthand.
	{
		id: 'img-border-style',
		attr: 'imageOptions.imageBorderNormal.style',
		var: '--wpcp-img-border-style',
		transform: 'raw',
		default: 'none',
	},
	{
		id: 'img-border-color',
		attr: 'imageOptions.imageBorderNormal.color',
		var: '--wpcp-img-border-color',
		transform: 'color',
		when: { attr: 'imageOptions.imageBorderNormal.style', op: 'neq', value: 'none' },
	},
	{
		id: 'img-border-width',
		attr: 'imageOptions.imageBorderWidthNormal',
		var: '--wpcp-img-border-width',
		transform: 'spacing',
		when: { attr: 'imageOptions.imageBorderNormal.style', op: 'neq', value: 'none' },
	},
	{
		id: 'img-border-color-hover',
		attr: 'imageOptions.imageBorderHover.color',
		var: '--wpcp-img-border-color-hover',
		transform: 'color',
		when: { attr: 'imageOptions.imageBorderHover.style', op: 'neq', value: 'none' },
	},

	// ── Variable-width image height ─────────────────────────────────────────────
	// Fixed image height for the variable-width Swiper path (slide width follows
	// the scaled image). The static `.wpcp-variable-width` img rule reads the
	// token with an `auto` fallback; the per-slide `--wpcp-vw-slide-width` calc
	// multiplies it by the image's W/H ratio. Gated off for the
	// single-slide stack effects, whose editor previews don't run the
	// variable-width Swiper path (the frontend root still carries
	// `.wpcp-variable-width` there, so an ungated token would desync parity).
	{
		id: 'vw-image-height',
		attr: 'imageOptions.variableWidthImageHeight',
		var: '--wpcp-vw-image-height',
		transform: 'dimension',
		device: true,
		whenAll: [
			{ attr: 'layoutOptions.variableWidth', op: 'truthy' },
			{ attr: 'sliderOptions.effect', op: 'neq', value: 'flip' },
			{ attr: 'sliderOptions.effect', op: 'neq', value: 'cube' },
			{ attr: 'imageOptions.variableWidthImageHeightMode', op: 'neq', value: 'max-height' },
		],
	},
	{
		id: 'vw-image-max-height',
		attr: 'imageOptions.variableWidthImageHeight',
		var: '--wpcp-vw-image-max-height',
		transform: 'dimension',
		device: true,
		whenAll: [
			{ attr: 'layoutOptions.variableWidth', op: 'truthy' },
			{ attr: 'sliderOptions.effect', op: 'neq', value: 'flip' },
			{ attr: 'sliderOptions.effect', op: 'neq', value: 'cube' },
			{ attr: 'imageOptions.variableWidthImageHeightMode', op: 'eq', value: 'max-height' },
		],
	},

	// ── Marquee variable-width image height ────────────────────────────────────
	// Deliberately unmirrored in `src/Blocks/Styles/StyleConfig.php`: Marquee is a
	// Pro editor preview with no PHP render path, so there is no frontend output
	// for these rows to agree with. The ticker rows are separate from the Swiper
	// ones above because the ticker has no `sliderOptions.effect` to exclude.
	{
		id: 'marquee-vw-image-height',
		attr: 'imageOptions.variableWidthImageHeight',
		var: '--wpcp-vw-image-height',
		transform: 'dimension',
		device: true,
		whenAll: [
			{ attr: 'blockName', op: 'in', value: ['marquee', 'wp-carousel-pro/marquee'] },
			{ attr: 'layoutOptions.variableWidth', op: 'truthy' },
			{ attr: 'imageOptions.variableWidthImageHeightMode', op: 'neq', value: 'max-height' },
		],
	},
	{
		id: 'marquee-vw-image-max-height',
		attr: 'imageOptions.variableWidthImageHeight',
		var: '--wpcp-vw-image-max-height',
		transform: 'dimension',
		device: true,
		whenAll: [
			{ attr: 'blockName', op: 'in', value: ['marquee', 'wp-carousel-pro/marquee'] },
			{ attr: 'layoutOptions.variableWidth', op: 'truthy' },
			{ attr: 'imageOptions.variableWidthImageHeightMode', op: 'eq', value: 'max-height' },
		],
	},

	// ── Video play icon + thumbnail border (overlay carved out → task 10.5) ─────
	// The video selectors read these tokens from static SCSS. `iconColor` drives
	// both fill + color on the play icon (one token, two properties in SCSS). Border
	// follows the Normal rule: style + width shared, color gates on the style. The
	// dimension rows mirror getSocialRangerDimension; the radius/width rows are the
	// fill-0 spacing box (single = border-radius). The overlay (getBgValue gradient/
	// solid fan-out across selectors) is algorithmic and stays inline/L5 — task 10.5.
	{
		id: 'video-icon-color',
		attr: 'videoOptions.iconColor',
		var: '--wpcp-video-icon-color',
		transform: 'color',
		when: { attr: 'videoOptions.useSourceIcon', op: 'neq', value: true },
	},
	{
		id: 'video-icon-bg',
		attr: 'videoOptions.iconBg',
		var: '--wpcp-video-icon-bg',
		transform: 'color',
		whenAll: [
			{ attr: 'videoOptions.useSourceIcon', op: 'neq', value: true },
			{ attr: 'videoOptions.iconView', op: 'neq', value: 'normal' },
		],
	},
	{
		id: 'video-icon-color-hover',
		attr: 'videoOptions.iconHoverColor',
		var: '--wpcp-video-icon-color-hover',
		transform: 'color',
		when: { attr: 'videoOptions.useSourceIcon', op: 'neq', value: true },
	},
	{
		id: 'video-icon-bg-hover',
		attr: 'videoOptions.iconHoverBg',
		var: '--wpcp-video-icon-bg-hover',
		transform: 'color',
		whenAll: [
			{ attr: 'videoOptions.useSourceIcon', op: 'neq', value: true },
			{ attr: 'videoOptions.iconView', op: 'neq', value: 'normal' },
		],
	},
	{
		id: 'video-border-style',
		attr: 'videoOptions.videoBorder.style',
		var: '--wpcp-video-border-style',
		transform: 'raw',
		default: 'none',
	},
	{
		id: 'video-border-color',
		attr: 'videoOptions.videoBorder.color',
		var: '--wpcp-video-border-color',
		transform: 'color',
		when: { attr: 'videoOptions.videoBorder.style', op: 'neq', value: 'none' },
	},
	{
		id: 'video-icon-size',
		attr: 'videoOptions.iconSize',
		var: '--wpcp-video-icon-size',
		transform: 'dimension',
		device: true,
	},
	{
		id: 'video-icon-area',
		attr: 'videoOptions.iconAreaSize',
		var: '--wpcp-video-icon-area',
		transform: 'dimension',
		device: true,
		whenAll: [
			{ attr: 'videoOptions.useSourceIcon', op: 'neq', value: true },
			{ attr: 'videoOptions.iconView', op: 'neq', value: 'normal' },
		],
	},
	// Custom video media width/height are NOT tokenized — they stay a Layer-5 paired
	// rule-string builder (generateVideoResponsiveRules ↔ video_responsive_rules).
	// The legacy `#uid .wpcp-item-media { width/height }` (1,1,0) is load-bearing
	// specificity over the shared image-aspect system (`.wpcp-item-media.wpcp-item-media--custom-rsp`
	// at 0,2,0, present whenever aspect === 'custom' regardless of source) and the
	// content-box `width:100%` override; a static token consumer (0,1,0)
	// would be un-masked by them (same blocker as content-area card padding).
	// See src/Blocks/Styles/README.md (Layer-5 catalogue).
	{
		id: 'video-icon-radius',
		attr: 'videoOptions.iconBorderRadius',
		var: '--wpcp-video-icon-radius',
		transform: 'spacingBox',
		device: true,
		single: true,
		whenAll: [
			{ attr: 'videoOptions.useSourceIcon', op: 'neq', value: true },
			{ attr: 'videoOptions.iconView', op: 'neq', value: 'normal' },
		],
	},
	{
		id: 'video-border-width',
		attr: 'videoOptions.videoBorderWidth',
		var: '--wpcp-video-border-width',
		transform: 'spacingBox',
		device: true,
		when: { attr: 'videoOptions.videoBorder.style', op: 'neq', value: 'none' },
	},
	{
		id: 'video-border-radius',
		attr: 'videoOptions.videoBorderRadius',
		var: '--wpcp-video-border-radius',
		transform: 'spacingBox',
		device: true,
		single: true,
	},

	// ── Content area — title/desc normal color (defaults render from static SCSS,
	// per-orientation #fff fallbacks preserved inline). The `contentColor` transform
	// resolves the polymorphic `{ color, hoverColor }` shape (→ `.color`) — also the
	// fix for the legacy PHP `color: Array` bug. HOVER colors stay paired rule-string
	// builders (the legacy `#uid …:hover` rule out-specifies the per-orientation #fff;
	// a static consumer can't — see ContentAreaCss::content_area_base_styles).
	{
		id: 'content-title-color',
		attr: 'contentOptions.titleColor',
		var: '--wpcp-content-title-color',
		transform: 'contentColor',
		default: '#2f2f2f',
	},
	{
		id: 'content-desc-color',
		attr: 'contentOptions.descColor',
		var: '--wpcp-content-desc-color',
		transform: 'contentColor',
		default: '#757575',
	},

	// ── Product price colors (the price slot only renders for products) ────────
	// `priceColor` styles the whole `.wpcp-item-price`; `salePriceColor` styles the
	// WooCommerce sale `<ins>`. Both default '' (emit when set) and gate on the product
	// source so a non-product block never emits a product token. The static SCSS reads
	// each with its per-orientation default fallback (#2f2f2f normal / #fff overlay).
	{
		id: 'content-price-color',
		attr: 'productContentOptions.priceColor',
		var: '--wpcp-content-price-color',
		transform: 'color',
		when: { attr: 'sourceType', op: 'eq', value: 'product' },
	},
	{
		id: 'content-sale-price-color',
		attr: 'productContentOptions.salePriceColor',
		var: '--wpcp-content-sale-price-color',
		transform: 'color',
		when: { attr: 'sourceType', op: 'eq', value: 'product' },
	},

	// ── Content area — title/desc/price margins (source-gated, responsive) ─────
	// The control is source-specific: image/audio read `contentOptions`, post/external
	// read `postContentOptions` (desc → `excerptMargin`), product reads
	// `productContentOptions` (desc → `descMargin`, with a legacy `desMargin` typo
	// fallback), each falling back to `contentOptions`. The `??` chain is expressed as
	// rows that emit the SAME `--var` in priority order: the `contentOptions` row is
	// `always` (the base/fallback for every source), and the source-specific rows
	// override it via cascade (later same-key write wins) — so the highest-priority
	// source attr that is set wins, else the `contentOptions` value, mirroring
	// getSourceConfig(). The `spacingFill` transform + `always` reproduce the legacy
	// fill / zero-fill policy (see the transform docblock): the token emits on every
	// breakpoint once set, so the static SCSS `margin: var(--…, default)` consumers
	// (base + fly + audio, wrapped in place) clobber the per-orientation defaults
	// exactly as the legacy `#uid` rule did. The per-orientation 4px fallbacks stay
	// inline so a token-unset block is byte-identical.
	{
		id: 'content-title-margin',
		attr: 'contentOptions.titleMargin',
		var: '--wpcp-content-title-margin',
		transform: 'spacingFill',
		device: true,
		always: true,
		wholeAttr: true,
	},
	{
		id: 'content-title-margin-post',
		attr: 'postContentOptions.titleMargin',
		var: '--wpcp-content-title-margin',
		transform: 'spacingFill',
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'sourceType', op: 'in', value: ['post', 'video'] },
	},
	{
		id: 'content-title-margin-product',
		attr: 'productContentOptions.titleMargin',
		var: '--wpcp-content-title-margin',
		transform: 'spacingFill',
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'sourceType', op: 'eq', value: 'product' },
	},
	{
		id: 'content-desc-margin',
		attr: 'contentOptions.descMargin',
		var: '--wpcp-content-desc-margin',
		transform: 'spacingFill',
		device: true,
		always: true,
		wholeAttr: true,
	},
	{
		id: 'content-desc-margin-post',
		attr: 'postContentOptions.excerptMargin',
		var: '--wpcp-content-desc-margin',
		transform: 'spacingFill',
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'sourceType', op: 'in', value: ['post', 'video'] },
	},
	{
		id: 'content-desc-margin-product-legacy',
		attr: 'productContentOptions.desMargin',
		var: '--wpcp-content-desc-margin',
		transform: 'spacingFill',
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'sourceType', op: 'eq', value: 'product' },
	},
	{
		id: 'content-desc-margin-product',
		attr: 'productContentOptions.descMargin',
		var: '--wpcp-content-desc-margin',
		transform: 'spacingFill',
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'sourceType', op: 'eq', value: 'product' },
	},
	{
		id: 'content-price-margin',
		attr: 'productContentOptions.priceMargin',
		var: '--wpcp-content-price-margin',
		transform: 'spacingFill',
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'sourceType', op: 'eq', value: 'product' },
	},

	// ── Content area — rating colors (defaults render from static SCSS) ────────
	{
		id: 'content-rating-fill',
		attr: 'ratingOptions.fillColor',
		var: '--wpcp-content-rating-fill',
		transform: 'color',
		default: '#FFD700',
	},
	{
		id: 'content-rating-fill-hover',
		attr: 'ratingOptions.fillHoverColor',
		var: '--wpcp-content-rating-fill-hover',
		transform: 'color',
	},
	{
		id: 'content-rating-empty',
		attr: 'ratingOptions.emptyColor',
		var: '--wpcp-content-rating-empty',
		transform: 'color',
		default: '#E0E0E0',
	},

	// ── Content area — card border (orientation-routed in static SCSS: the card is
	// the content box for overlay-style orientations, the whole item for image-top).
	// Border Normal/Hover: style + width shared across states, only color carries
	// `-hover` (the inspector shares style/width). Source-agnostic (contentAreaOptions).
	{
		id: 'content-border-style',
		attr: 'contentAreaOptions.contentAreaStyle.normal.border.style',
		var: '--wpcp-content-border-style',
		transform: 'raw',
		default: 'none',
	},
	{
		id: 'content-border-color',
		attr: 'contentAreaOptions.contentAreaStyle.normal.border.color',
		var: '--wpcp-content-border-color',
		transform: 'color',
		when: {
			attr: 'contentAreaOptions.contentAreaStyle.normal.border.style',
			op: 'neq',
			value: 'none',
		},
	},
	{
		id: 'content-border-width',
		attr: 'contentAreaOptions.contentAreaStyle.normal.borderWidth',
		var: '--wpcp-content-border-width',
		transform: 'spacing',
		when: {
			attr: 'contentAreaOptions.contentAreaStyle.normal.border.style',
			op: 'neq',
			value: 'none',
		},
	},

	// ── Content area — card box-shadow (orientation-routed in static SCSS, same
	// routing as the border). Each state gates on its own enable flag; the `shadow`
	// transform mirrors getBoxShadowValue. Hover falls back to the normal shadow.
	{
		id: 'content-shadow',
		attr: 'contentAreaOptions.boxShadowNormal',
		var: '--wpcp-content-shadow',
		transform: 'shadow',
		when: { attr: 'contentAreaOptions.boxShadowNormalEnable', op: 'truthy' },
	},
	{
		id: 'content-shadow-hover',
		attr: 'contentAreaOptions.boxShadowHover',
		var: '--wpcp-content-shadow-hover',
		transform: 'shadow',
		when: { attr: 'contentAreaOptions.boxShadowHoverEnable', op: 'truthy' },
	},

	// ── Content area — card border-radius (orientation-routed in static SCSS, same
	// routing as the border, no audio special-case). Responsive full shorthand so
	// unlinked side edits do not collapse to the top value; default 0.
	{
		id: 'content-radius',
		attr: 'contentAreaOptions.borderRadius',
		var: '--wpcp-content-radius',
		transform: 'spacingBox',
		device: true,
	},

	// ── Post meta — colors + inter-part gap ────────────────────────────────────
	// Normal color emits for every source (both legacy branches set it). Separator
	// color (a CSS var consumed by the `::after` separators) and hover color are
	// non-external only. The static SCSS wraps the `.wpcp-content-slot--meta
	// .wpcp-item-meta` default (#1e1e1e) and the `.wpcp-item:hover .wpcp-item-meta`
	// rule in `var()`. The gap halves the control value (renders on both sides of
	// each separator) via the `metaGap` transform — which also fixes the legacy PHP
	// `intval($v || 12) / 2` → always-`0.5px` bug by emitting the editor's value.
	{
		id: 'meta-color',
		attr: 'metaOptions.color',
		var: '--wpcp-meta-color',
		transform: 'color',
	},
	{
		id: 'meta-separator-color',
		attr: 'metaOptions.separatorColor',
		var: '--wpcp-meta-separator-color',
		transform: 'color',
	},
	{
		id: 'meta-hover-color',
		attr: 'metaOptions.hoverColor',
		var: '--wpcp-meta-hover-color',
		transform: 'color',
	},
	{
		id: 'meta-gap',
		attr: 'metaOptions.spacing',
		var: '--wpcp-meta-gap',
		transform: 'metaGap',
		device: true,
	},

	// ── Rating row — icon size (font-size) + icon gap (responsive) ─────────────
	// Both default to an empty control (schema `array()`), so they emit only when
	// set. The static `.wpcp-item-rating` rule is `display: inline-flex` (required
	// for the gap to apply; the fill/empty spans render content-width either way in
	// the content-area column flex) with `font-size`/`gap` reading these tokens. The
	// fill/empty colors are tokenized separately (`--wpcp-content-rating-*`).
	{
		id: 'rating-size',
		attr: 'ratingOptions.iconSize',
		var: '--wpcp-rating-size',
		transform: 'dimension',
		device: true,
	},
	{
		id: 'rating-gap',
		attr: 'ratingOptions.iconGap',
		var: '--wpcp-rating-gap',
		transform: 'dimension',
		device: true,
	},

	// ── Taxonomy term — text/background colors (normal + hover) + box-shadow ───
	// Colors default to '' (emit when set); the static `.wpcp-item-taxonomy` rule
	// wraps its #1e1e1e bg + `var(--wpcp-white,#fff)` color, and a `:hover` rule
	// adds the hover variants (each falling back to the normal value). Box-shadow
	// gates on its enable flag (content-shadow template). The taxonomy **border**
	// (style emission coupled to width resolution), **radius** (polymorphic scalar
	// vs responsive object), **gap** (taxGap/gap polymorphic + stale 8px-vs-12px
	// default), and **padding** stay Layer-5 (slim generateTaxonomy* builders +
	// the PHP cateBorder/radius/gap blocks).
	{
		id: 'tax-color',
		attr: 'taxonomyOptions.textColor',
		var: '--wpcp-tax-color',
		transform: 'color',
	},
	{
		id: 'tax-hover-color',
		attr: 'taxonomyOptions.textHoverColor',
		var: '--wpcp-tax-hover-color',
		transform: 'color',
	},
	{
		id: 'tax-bg',
		attr: 'taxonomyOptions.backgroundColor',
		var: '--wpcp-tax-bg',
		transform: 'color',
	},
	{
		id: 'tax-bg-hover',
		attr: 'taxonomyOptions.backgroundHoverColor',
		var: '--wpcp-tax-bg-hover',
		transform: 'color',
	},
	{
		id: 'tax-shadow',
		attr: 'taxonomyOptions.boxShadow',
		var: '--wpcp-tax-shadow',
		transform: 'shadow',
		when: { attr: 'taxonomyOptions.boxShadowEnable', op: 'truthy' },
	},
	{
		id: 'tax-shadow-hover',
		attr: 'taxonomyOptions.boxShadowHover',
		var: '--wpcp-tax-shadow-hover',
		transform: 'shadow',
		when: { attr: 'taxonomyOptions.shadowEnableHover', op: 'truthy' },
	},

	// ── Tiles grid VALUES (gaps + row-height) — the grid-template / auto-rows
	// decision / bin-pack mode stay Layer-5 (tilesDynamicCss.js ↔ TilesCss). The
	// `tileGridDim` transform resolves the flat per-device layoutOptions attrs (with
	// the mobile→tablet→desktop cascade); `always` mirrors the legacy unconditional
	// per-device emission (and avoids the Desktop→Tablet/Mobile custom-property
	// inheritance leak). Gated on `blockName` so only tiles blocks emit. The static
	// SCSS `.wpcp-tiles-grid` consumes them; gaps/row-height on a non-grid bin-pack
	// container are inert. Row-height only emits for fixed-row presets
	// (`tileLayout` not in the auto-row presets one/three → grid-auto-rows is a value,
	// not `auto`); otherwise the static fallback `auto` renders.
	{
		id: 'tile-column-gap',
		attr: 'layoutOptions',
		var: '--wpcp-tile-column-gap',
		transform: 'tileGridDim',
		base: 'gapHorizontal',
		fallback: 20,
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'blockName', op: 'in', value: ['tiles', 'wp-carousel-pro/tiles'] },
	},
	{
		id: 'tile-row-gap',
		attr: 'layoutOptions',
		var: '--wpcp-tile-row-gap',
		transform: 'tileGridDim',
		base: 'gapVertical',
		fallback: 20,
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'blockName', op: 'in', value: ['tiles', 'wp-carousel-pro/tiles'] },
	},
	{
		id: 'tile-row-height',
		attr: 'layoutOptions',
		var: '--wpcp-tile-row-height',
		transform: 'tileGridDim',
		base: 'tileRowHeight',
		fallback: 220,
		device: true,
		always: true,
		wholeAttr: true,
		whenAll: [
			{ attr: 'blockName', op: 'in', value: ['tiles', 'wp-carousel-pro/tiles'] },
			// `truthy` excludes an absent tileLayout (legacy treats undefined as the
			// auto-row preset 'one'); the two `neq` gates exclude the auto presets.
			{ attr: 'layoutOptions.tileLayout', op: 'truthy' },
			{ attr: 'layoutOptions.tileLayout', op: 'neq', value: 'one' },
			{ attr: 'layoutOptions.tileLayout', op: 'neq', value: 'three' },
		],
	},

	// ── Thumbnails-slider — thumbs-area wrapper chrome (border / radius / shadow) ──
	// Sub-slice A of the thumbnails-slider conversion. The wrapper background, padding,
	// and margin stay Layer-5 (getBgValue polymorphism; padding/margin ride load-bearing
	// `#uid` specificity over the position/layout longhand overrides — `padding-bottom`,
	// `margin-right`, etc. — plus the per-device zero-fill). Border follows the Normal
	// rule (style + width + color, no hover state here); the width is the legacy
	// `Number(width) || 0` scalar (the static `0` fallback covers an on-but-unset width).
	// Border-radius is the Desktop-only four-value spacing box (no responsive re-emit on
	// the legacy side). All gated on `blockName` so only thumbnails-slider emits.
	{
		id: 'thumbs-area-border-style',
		attr: 'thumbsArea.border.style',
		var: '--wpcp-thumbs-area-border-style',
		transform: 'raw',
		default: 'none',
		when: THUMBS_SLIDER_GATE,
	},
	{
		id: 'thumbs-area-border-color',
		attr: 'thumbsArea.border.color',
		var: '--wpcp-thumbs-area-border-color',
		transform: 'color',
		whenAll: [THUMBS_SLIDER_GATE, { attr: 'thumbsArea.border.style', op: 'neq', value: 'none' }],
	},
	{
		id: 'thumbs-area-border-width',
		attr: 'thumbsArea.borderWidth',
		var: '--wpcp-thumbs-area-border-width',
		transform: 'spacingBox',
		device: true,
		whenAll: [THUMBS_SLIDER_GATE, { attr: 'thumbsArea.border.style', op: 'neq', value: 'none' }],
	},
	{
		id: 'thumbs-area-radius',
		attr: 'thumbsArea.borderRadius',
		var: '--wpcp-thumbs-area-radius',
		transform: 'spacingBox',
		device: true,
		when: THUMBS_SLIDER_GATE,
	},
	{
		id: 'thumbs-area-shadow',
		attr: 'thumbsArea.boxShadow',
		var: '--wpcp-thumbs-area-shadow',
		transform: 'shadow',
		whenAll: [THUMBS_SLIDER_GATE, { attr: 'thumbsArea.boxShadow.enable', op: 'truthy' }],
	},

	// ── Thumbnails-slider — per-thumb image states (opacity + border) ──────────
	// Sub-slice B. Opacity dims non-active thumbs (the static `.wpcp-thumb-active`
	// rule keeps the active thumb at 1, so no active override is emitted). Border
	// follows the Normal rule (style + width shared); color carries normal / hover /
	// active variants, each falling back to the normal color in static SCSS. Width is
	// the Desktop-only fill-0 spacing box (`spacingGenerate(..., 'Desktop') || '0px'`).
	// `activeThumbBorder` (conditional borderCss on the same `.wpcp-thumb img`),
	// image filter (algorithmic composeImageFilter), per-thumb dimensions (load-bearing
	// `#uid` over Swiper/position resets) and the thumb borderRadius (load-bearing `#uid`
	// over the `inherit` / `4px` static rules) stay as paired Layer-5 builders.
	{
		id: 'thumb-opacity',
		attr: 'thumbnail.opacity',
		var: '--wpcp-thumb-opacity',
		transform: 'raw',
		default: 1,
		when: THUMBS_SLIDER_GATE,
	},
	{
		id: 'thumb-border-style',
		attr: 'thumbnail.border.style',
		var: '--wpcp-thumb-border-style',
		transform: 'raw',
		default: 'none',
		when: THUMBS_SLIDER_GATE,
	},
	{
		id: 'thumb-border-color',
		attr: 'thumbnail.border.color',
		var: '--wpcp-thumb-border-color',
		transform: 'color',
		whenAll: [THUMBS_SLIDER_GATE, { attr: 'thumbnail.border.style', op: 'neq', value: 'none' }],
	},
	{
		id: 'thumb-border-width',
		attr: 'thumbnail.borderWidth',
		var: '--wpcp-thumb-border-width',
		transform: 'spacingBox',
		device: true,
		whenAll: [THUMBS_SLIDER_GATE, { attr: 'thumbnail.border.style', op: 'neq', value: 'none' }],
	},
	{
		id: 'thumb-border-color-hover',
		attr: 'thumbnail.border.hoverColor',
		var: '--wpcp-thumb-border-color-hover',
		transform: 'color',
		whenAll: [THUMBS_SLIDER_GATE, { attr: 'thumbnail.border.style', op: 'neq', value: 'none' }],
	},
	{
		id: 'thumb-border-color-active',
		attr: 'thumbnail.border.activeColor',
		var: '--wpcp-thumb-border-color-active',
		transform: 'color',
		whenAll: [THUMBS_SLIDER_GATE, { attr: 'thumbnail.border.style', op: 'neq', value: 'none' }],
	},

	// ── Pagination dots (Phase 1 proof — already-shipping `--wpcp-pag-*` bag) ──
	...paginationStyleConfig,

	// ── Click-action overlay icons (position stays class-based) ────────────────
];

export default styleConfig;
