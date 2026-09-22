/**
 * Thumbnails-slider block dynamic-CSS generators.
 *
 * Mirrors the thumbnails-slider branch of CarouselDynamicCss.php (the
 * ThumbnailsSliderCss trait). Split out of the carouselDynamicCss monolith; the
 * editor composes these through the default `dynamicCss` export exactly as before.
 * Keep rule-for-rule parity with the PHP side — the tests/css-parity harness gates
 * it.
 */

import { DEVICES } from './constants';
import { spacingGenerate, borderCss, getBgValue } from './cssHelpers';
import { pushStylePropertyRuleIfDiffers, hasResponsiveSpacing } from './cssRuleHelpers';

/** @typedef {'Desktop'|'Tablet'|'Mobile'} DeviceType */

/**
 * Whether the block is the thumbnails-slider (gates `generateThumbnailsSlider*`).
 *
 * @param {Object} attributes - Block attributes.
 * @return {boolean} True when blockName matches.
 */
const isThumbnailsSliderBlock = (attributes = {}) =>
	attributes?.blockName === 'thumbnails-slider' ||
	attributes?.blockName === 'wp-carousel-pro/thumbnails-slider';

/**
 * Compose a CSS `filter:` string from a 6-key image-filter options object.
 *
 * Mirrors `CarouselDynamicCss::compose_image_filter()` in PHP — both copies
 * must produce byte-identical output so render-parity tests stay green.
 * Skip-emission rules:
 *   - falsy `filterOpts` → return ''
 *   - default-value parts (grayscale 0, brightness 1, contrast 1, blur 0,
 *     saturation 0, hue 1) are omitted so the cascade is preserved when only a subset
 *     of filters is tuned.
 *
 * @param {Object} filterOpts - `{ enable, grayscale, brightness, contrast, blur, saturation, hue }`.
 * @return {string} CSS filter value, e.g. `"grayscale(1) blur(2px)"`, or `''`.
 */
const composeImageFilter = (filterOpts = {}) => {
	if (!filterOpts) {
		return '';
	}
	const parts = [];
	if (Number(filterOpts.brightness) !== 1) {
		parts.push(`brightness(${Number(filterOpts.brightness)})`);
	}
	if (Number(filterOpts.contrast) !== 1) {
		parts.push(`contrast(${Number(filterOpts.contrast)})`);
	}
	if (Number(filterOpts.blur) > 0) {
		parts.push(`blur(${Number(filterOpts.blur)}px)`);
	}
	if (Number(filterOpts.saturation) > 0) {
		parts.push(`saturate(${Number(filterOpts.saturation)})`);
	}
	if (Number(filterOpts.hue) !== 1) {
		parts.push(`hue-rotate(${Number(filterOpts.hue)}deg)`);
	}
	return parts.join(' ');
};

/**
 * Base CSS for the new thumbnails-slider attribute groups.
 *
 * Selectors target `.wpcp-thumbs-area` / `.wpcp-thumb` etc. — these elements
 * are emitted by the thumbnails-slider render branch (currently scaffolding;
 * the main-stage / thumb-strip architecture lands separately). Rules below
 * activate the moment that markup appears.
 *
 * @param {Object} selectors  - Selector bundle from `createSelectors`.
 * @param {Object} attributes - Block attributes.
 * @return {Array<{class: string, styles: Record<string,string>}>} CSS rule objects.
 */
export const generateThumbnailsSliderBaseStyles = (selectors, attributes = {}) => {
	if (!isThumbnailsSliderBlock(attributes)) {
		return [];
	}
	const rules = [];
	const ta = attributes.thumbsArea || {};
	const t = attributes.thumbnail || {};
	const { thumbsAreaStrip, thumbActiveImg, thumbInactiveImg, thumbImg } = selectors;

	// Style-tab background / padding / margin target `.wpcp-swiper-thumb-wrapper` — the
	// div that wraps the thumb-strip Swiper (the visible framed box), separate from the
	// outer `.wpcp-thumbs-area` wrapper (which carries structural position/layout longhands
	// like `padding-top/bottom`, `margin-left/right`), so there's no specificity battle.
	// Border / radius / box-shadow are tokenized (style-config.js `thumbs-area-*` rows →
	// static SCSS consumers, also on the wrapper). Background stays a Layer-5 paired
	// builder for the polymorphic getBgValue fan-out.
	if (ta.background && Object.keys(ta.background).length) {
		const bg = getBgValue(ta.background);
		pushStylePropertyRuleIfDiffers(rules, thumbsAreaStrip, 'background', bg);
	}
	if (ta.padding && hasResponsiveSpacing(ta.padding)) {
		pushStylePropertyRuleIfDiffers(
			rules,
			thumbsAreaStrip,
			'padding',
			spacingGenerate(ta.padding, DEVICES.DESKTOP)
		);
	}
	if (ta.margin && hasResponsiveSpacing(ta.margin)) {
		pushStylePropertyRuleIfDiffers(
			rules,
			thumbsAreaStrip,
			'margin',
			spacingGenerate(ta.margin, DEVICES.DESKTOP)
		);
	}
	// thumbnail.opacity (non-active dimming) + thumbnail.border (style/width/color +
	// hover/active color) are tokenized (style-config.js `thumb-opacity` /
	// `thumb-border-*` rows → static SCSS consumers; the active thumb stays at 1 via a
	// static rule). The thumb borderRadius stays a paired Layer-5 builder: the legacy
	// `#uid .wpcp-thumb img` (1,1,1) is load-bearing specificity over the static
	// `border-radius: inherit` / `4px` rules, so a static token consumer would be
	// un-masked (needs an in-place wrap of every radius rule — deferred).
	if (t.borderRadius && hasResponsiveSpacing(t.borderRadius)) {
		pushStylePropertyRuleIfDiffers(
			rules,
			thumbImg,
			'border-radius',
			spacingGenerate(t.borderRadius, DEVICES.DESKTOP)
		);
	}

	// Image filter — the Style tab's control writes `imageFilter.normal`, which
	// dims every inactive thumb.
	const normalFilter = composeImageFilter(t.imageFilter?.normal);
	if (normalFilter) {
		pushStylePropertyRuleIfDiffers(rules, thumbInactiveImg, 'filter', normalFilter);
	}

	// Active thumb border — the Free `none` style draws it on the image itself.
	const activeThumbBorder = t.activeThumbBorder || {};
	if (activeThumbBorder.style && activeThumbBorder.style !== 'none') {
		const borderStyles = borderCss(activeThumbBorder, t.activeThumbBorderWidth);
		if (Object.keys(borderStyles).length > 0) {
			rules.push({ class: thumbActiveImg, styles: borderStyles });
		}
	}

	return rules;
};

/**
 * Responsive CSS for `thumbsArea.gap`, the thumb dimensions and thumbs-per-view.
 *
 * @param {Object} selectors  - Selector bundle.
 * @param {Object} attributes - Block attributes.
 * @param {string} device     - 'Desktop' | 'Tablet' | 'Mobile'.
 * @return {Array<{class: string, styles: Record<string,string>}>} CSS rule objects.
 */
export const generateThumbnailsSliderResponsiveStyles = (selectors, attributes = {}, device) => {
	if (!isThumbnailsSliderBlock(attributes)) {
		return [];
	}
	const rules = [];
	const ta = attributes.thumbsArea || {};
	const t = attributes.thumbnail || {};
	const lo = attributes.layoutOptions || {};
	const { thumbsArea, thumbImg } = selectors;

	// Gap moved to `thumbsArea` in the redesign; fall back to legacy `thumbnail.gap*`
	// so unsaved posts keep rendering until they're re-saved.
	const gapMap = {
		Desktop: ta.gap ?? t.gap,
		Tablet: ta.gapTablet ?? t.gapTablet,
		Mobile: ta.gapMobile ?? t.gapMobile,
	};
	const gapValue = gapMap[device];
	if (gapValue !== undefined && gapValue !== '' && gapValue !== null) {
		pushStylePropertyRuleIfDiffers(rules, thumbsArea, 'gap', `${Number(gapValue)}px`);
	}

	// Thumbnail dimensions — responsive { width, height } object. Bare numbers
	// get a `px` unit so user-supplied "120" works without unit.
	const dimensions = t.dimensions || {};
	const slot = dimensions.device?.[device] || {};
	const unit = dimensions.unit?.[device] || { width: 'px', height: 'px' };
	const unitize = (v, dimUnit = 'px') => {
		const s = String(v ?? '').trim();
		if (!s || s === 'auto') {
			return '';
		}
		return /^-?\d+(\.\d+)?$/.test(s) ? `${s}${dimUnit}` : s;
	};
	const w = unitize(slot.width, unit.width);
	const h = unitize(slot.height, unit.height);
	if (w) {
		pushStylePropertyRuleIfDiffers(rules, thumbImg, 'width', w);
	}
	if (h) {
		pushStylePropertyRuleIfDiffers(rules, thumbImg, 'height', h);
	}
	const thumbsPerViewMap = {
		Desktop: lo.thumbsPerView,
		Tablet: lo.thumbsPerViewTablet,
		Mobile: lo.thumbsPerViewMobile,
	};
	const tpv = thumbsPerViewMap[device];
	if (tpv !== undefined && tpv !== '' && tpv !== null) {
		// `--wpcp-thumbs-per-view` consumed by the thumb-strip flex layout (each
		// thumb claims `calc(100% / var(--wpcp-thumbs-per-view))`).
		pushStylePropertyRuleIfDiffers(rules, thumbsArea, '--wpcp-thumbs-per-view', String(Number(tpv)));
	}

	return rules;
};
