/**
 * Layout / visibility dynamic-CSS concern (editor side).
 *
 * Split out of the carouselDynamicCss monolith; the composer imports these.
 * Layer-5 builders: the Swiper flex wrapper + align-items (editor preview may
 * not load Swiper CSS) and the per-device visibility `display:none` (conditional
 * rule presence). Mirrors the PHP twin in CarouselDynamicCss::base_styles /
 * responsive_css (layout + visibility branches).
 */

import { DEVICES } from './constants';
import {
	pushStylePropertyRuleIfDiffers,
	hasResponsiveSpacing,
	isZeroSpacingValue,
} from './cssRuleHelpers';
import { getBgValue, spacingGenerate } from './cssHelpers';

export const generateLayoutStyles = (selectors, layoutOptions, sliderOptions = {}) => {
	// Swiper expects a flex wrapper; editor preview may not load Swiper CSS, so
	// align-items from LayoutsPanel only works if display:flex is set here too.
	const styles = { display: 'flex' };
	// Adaptive height uses Swiper's .swiper-autoheight wrapper align-items (flex-start); do not override.
	if (sliderOptions.adaptiveHeight !== true) {
		styles['align-items'] = layoutOptions?.alignItems ?? 'center';
	}
	return [{ class: selectors.swiperWrapper, styles }];
};

/**
 * Editor-only dimming for device-hidden blocks.
 *
 * The frontend twin (Concerns/LayoutCss::visibility_rules()) really hides the
 * block with `display:none`. Doing that in the editor canvas too would make a
 * device-hidden block undiscoverable/uneditable once that breakpoint's preview
 * is active, so the editor instead dims it to opacity 0.3 as a visual cue —
 * the block stays in the layout and editable.
 *
 * @param {Object} selectors       Scoped selector bundle.
 * @param {Object} advancedOptions Advanced visibility options.
 * @param {string} device          Active device breakpoint.
 * @return {Array} Visibility rules for the editor preview.
 */
export const generateVisibilityRules = (selectors, advancedOptions, device) => {
	const rules = [];
	const hideDesktop = advancedOptions?.visibilityDesktop === false;
	const hideTablet = advancedOptions?.visibilityTablet === false;
	const hideMobile = advancedOptions?.visibilityMobile === false;
	const hide =
		(device === DEVICES.DESKTOP && hideDesktop) ||
		(device === DEVICES.TABLET && hideTablet) ||
		(device === DEVICES.MOBILE && hideMobile);
	const show =
		(device === DEVICES.TABLET && !hideTablet && hideDesktop) ||
		(device === DEVICES.MOBILE && !hideMobile && (hideDesktop || hideTablet));
	if (hide) {
		pushStylePropertyRuleIfDiffers(rules, selectors.wrapper, 'opacity', '0.3');
	} else if (show) {
		pushStylePropertyRuleIfDiffers(rules, selectors.wrapper, 'opacity', '1');
	}
	return rules;
};

/**
 * Advanced General-tab background on the block root wrapper.
 *
 * Static-first: emits nothing for the default (transparent) or an empty value.
 * Mirrors the PHP twin in Concerns/LayoutCss::advanced_background_rules().
 *
 * @param {Object} selectors          - Scoped selector bundle.
 * @param {Object} advancedBackground - `{ style, solid, gradient }` attribute group.
 * @return {Array} Zero or one `{ class, styles }` rule on the root wrapper.
 */
export const generateAdvancedBackgroundRules = (selectors, advancedBackground = {}) => {
	const rules = [];
	const style = advancedBackground?.style;
	if (!style || style === 'transparent') {
		return rules;
	}
	const value = getBgValue(advancedBackground);
	pushStylePropertyRuleIfDiffers(rules, selectors.wrapper, 'background', value);
	return rules;
};

/**
 * Advanced General-tab responsive spacing: margin on the root wrapper, padding
 * on the inner content wrapper. Reuses the shared spacing pipeline (skip when
 * empty / all-zero). Mirrors Concerns/LayoutCss::advanced_spacing_rules().
 *
 * @param {Object}                      selectors       - Scoped selector bundle.
 * @param {Object}                      advancedMargin  - Responsive margin attribute.
 * @param {Object}                      advancedPadding - Responsive padding attribute.
 * @param {'Desktop'|'Tablet'|'Mobile'} device          - Active breakpoint.
 * @return {Array} `{ class, styles }` rules for the device.
 */
export const generateAdvancedSpacingRules = (
	selectors,
	advancedMargin,
	advancedPadding,
	device
) => {
	const rules = [];
	if (advancedMargin && hasResponsiveSpacing(advancedMargin)) {
		const marginCss = spacingGenerate(advancedMargin, device);
		if (marginCss && !isZeroSpacingValue(marginCss)) {
			pushStylePropertyRuleIfDiffers(rules, selectors.wrapper, 'margin', marginCss);
		}
	}
	if (advancedPadding && hasResponsiveSpacing(advancedPadding)) {
		const paddingCss = spacingGenerate(advancedPadding, device);
		if (paddingCss && !isZeroSpacingValue(paddingCss)) {
			pushStylePropertyRuleIfDiffers(rules, selectors.inner, 'padding', paddingCss);
		}
	}
	return rules;
};

/**
 * Panorama "Style 1" (curve) side bleed.
 *
 * The static SCSS widens the panorama swiper (width + 2× gap, pulled left by 1×
 * gap) so the tilted edge cards bleed past the container and the foreshortened
 * side strip disappears. The bleed amount tracks the layout "Gap Between Items"
 * value, emitted as a responsive `--wpcp-*` token (positive gap, with unit) on
 * the block wrapper — it cascades into the static rule. Only the convex Style 1
 * layout carries the bleed, matching the SCSS scope. Emitted for every device so
 * the breakpoint dedup resolves the cascade.
 *
 * Editor-only: Panorama is a Pro editor preview, so there is no PHP mirror.
 *
 * @param {Object}                      selectors  - Scoped selector bundle.
 * @param {Object}                      attributes - Block attributes.
 * @param {'Desktop'|'Tablet'|'Mobile'} device     - Active breakpoint.
 * @return {Array} Zero or one `{ class, styles }` token rule on the wrapper.
 */
export const generatePanoramaSideMarginRules = (selectors, attributes, device) => {
	const layoutOptions = attributes?.layoutOptions ?? {};
	const blockName = String(attributes?.blockName ?? '').toLowerCase();
	const isPanoramaBlock =
		blockName === 'carousel-panorama' || blockName === 'wp-carousel-pro/carousel-panorama';
	const isPanoramaStyle = isPanoramaBlock || layoutOptions.carouselStyle === 'panorama';
	const panoramaLayout = layoutOptions.panoramaLayout || 'style-one';
	if (!isPanoramaStyle || panoramaLayout !== 'style-one') {
		return [];
	}

	const gapByDevice = {
		Desktop: { value: layoutOptions.gap ?? 20, unit: layoutOptions.gapUnit || 'px' },
		Tablet: { value: layoutOptions.gapTablet ?? 20, unit: layoutOptions.gapTabletUnit || 'px' },
		Mobile: { value: layoutOptions.gapMobile ?? 10, unit: layoutOptions.gapMobileUnit || 'px' },
	};
	const { value, unit } = gapByDevice[device] ?? gapByDevice.Desktop;
	const bleed = Number(value) === 0 ? '0' : `${value}${unit}`;

	return [{ class: selectors.wrapper, styles: { '--wpcp-panorama-side-margin': bleed } }];
};

/**
 * Panorama reflection bottom gutter.
 *
 * The static SCSS reserves a fixed 60px gutter under `.swiper-panorama` so the
 * absolutely-positioned reflection clone has room without inflating card
 * height. Once Reflection Height is pushed past 20, that gutter must grow with
 * it (4× the height, plus the Reflection Distance gap that offsets the clone
 * further down) or the taller reflection gets clipped — emit a `--wpcp-*`
 * token on the wrapper that the static rule consumes. Reflection Height is a
 * single (non-responsive) value, so this is a base rule, not per-device. Only
 * fires when reflection is on and the height clears the 20px threshold, so the
 * 60px static default holds otherwise.
 *
 * Editor-only: Panorama is a Pro editor preview, so there is no PHP mirror.
 *
 * @param {Object} selectors  - Scoped selector bundle.
 * @param {Object} attributes - Block attributes.
 * @return {Array} Zero or one `{ class, styles }` token rule on the wrapper.
 */
export const generatePanoramaReflectionPaddingRules = (selectors, attributes) => {
	const layoutOptions = attributes?.layoutOptions ?? {};
	const blockName = String(attributes?.blockName ?? '').toLowerCase();
	const isPanoramaBlock =
		blockName === 'carousel-panorama' || blockName === 'wp-carousel-pro/carousel-panorama';
	if (!(isPanoramaBlock || layoutOptions.carouselStyle === 'panorama')) {
		return [];
	}

	const reflectionEnabled =
		layoutOptions.showReflection === true || layoutOptions.panoramaReflection === true;
	if (!reflectionEnabled) {
		return [];
	}

	let reflectionHeight = 16;
	if (Number.isFinite(Number(layoutOptions.reflectionHeight))) {
		reflectionHeight = Number(layoutOptions.reflectionHeight);
	} else if (Number.isFinite(Number(layoutOptions.panoramaReflectionHeight))) {
		reflectionHeight = Number(layoutOptions.panoramaReflectionHeight);
	}

	if (!(reflectionHeight > 20)) {
		return [];
	}

	let reflectionDistance = 0;
	if (Number.isFinite(Number(layoutOptions.reflectionDistance))) {
		reflectionDistance = Number(layoutOptions.reflectionDistance);
	} else if (Number.isFinite(Number(layoutOptions.panoramaReflectionDistance))) {
		reflectionDistance = Number(layoutOptions.panoramaReflectionDistance);
	}

	return [
		{
			class: selectors.wrapper,
			styles: {
				'--wpcp-panorama-reflection-padding': `${reflectionHeight * 4 + reflectionDistance}px`,
			},
		},
	];
};
