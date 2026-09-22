/**
 * Dynamic CSS composer for WP Carousel Pro blocks (editor side).
 *
 * Mirrors server-side CarouselDynamicCss.php:
 * - mode `base`: colors, alignment, card chrome, taxonomy, meta, etc.
 * - mode `Desktop` | `Tablet` | `Mobile`: typography, spacing, responsive image/social, visibility
 *
 * Desktop output merges base + responsive('Desktop'); tablet/mobile wrap responsive only.
 *
 * This is the thin composer: it walks the style config for `--wpcp-*` token bags
 * (the static-first path) and assembles the per-feature Layer-5 rule builders,
 * each of which lives in its own `*DynamicCss.js` concern module.
 */

import {
	objectToCssString,
	mergeCssRulesBySelector,
	dropRulesMatchingBaseline,
	wrapInMediaQuery,
} from './cssUtils';
import { createSelectors } from './selectors';
import { applyCustomCss } from './applyCustomCss';
import { TABLET_MEDIA_QUERY, MOBILE_MEDIA_QUERY, DEVICES } from './constants';
import {
	generateSliderBaseStyles,
	generateSliderAspectRatioStyles,
	generateSliderResponsiveStyles,
} from './sliderDynamicCss';
import {
	generateThumbnailsSliderBaseStyles,
	generateThumbnailsSliderResponsiveStyles,
} from './thumbnailsSliderDynamicCss';
import {
	generateTilesBaseStyles,
	generateTilesResponsiveStyles,
	generateTilesCollapseCss,
} from './tilesDynamicCss';
import { generateContentAreaAndColors, generateCardResponsiveRules } from './contentAreaDynamicCss';
import { generateVideoBaseStyles, generateVideoResponsiveRules } from './videoDynamicCss';
import {
	generateImageBaseStyles,
	generateImageResponsiveRules,
	getEffectiveImageOptions,
} from './imageDynamicCss';
import { generateTaxonomyBaseStyles, generateTaxonomyResponsiveRules } from './taxonomyDynamicCss';
import { generateSocialBaseStyles, generateSocialResponsiveRules } from './socialDynamicCss';
import { generateButtonBaseStyles, generateButtonRules } from './buttonDynamicCss';
import { generateTypographyRules } from './typographyDynamicCss';
import {
	generateLayoutStyles,
	generateVisibilityRules,
	generateAdvancedBackgroundRules,
	generateAdvancedSpacingRules,
	generatePanoramaSideMarginRules,
	generatePanoramaReflectionPaddingRules,
} from './layoutDynamicCss';
import {
	generateOverlayGlobalIconBaseRules,
	generateOverlayGlobalIconResponsiveRules,
} from './overlayGlobalIconCss';
import { buildGoogleFontsImport } from './googleFontsImport';
import { emitTokens } from './tokens/emitTokens';
import styleConfig from './config/style-config';

// Re-export the formerly-public helpers so any external importer keeps working.
export { getSocialRangerDimension, hasResponsiveSpacing } from './cssRuleHelpers';
export { getSourceConfig } from './sourceConfigHelpers';
export { getTaxonomyGap } from './taxonomyDynamicCss';
export { createSelectors };

const getBaseRules = (attributes) => {
	const {
		uniqueId,
		contentAreaOptions = {},
		contentOptions = {},
		ratingOptions = {},
		taxonomyOptions = {},
		socialShareOptions = {},
		videoOptions = {},
		layoutOptions = {},
		advancedOptions = {},
	} = attributes;
	const imageOptions = getEffectiveImageOptions(attributes);

	const selectors = createSelectors(uniqueId, attributes.sourceType);

	return [
		...generateAdvancedBackgroundRules(selectors, advancedOptions.background),
		...generateContentAreaAndColors(
			selectors,
			contentAreaOptions,
			contentOptions,
			ratingOptions,
			attributes
		),
		...generateImageBaseStyles(selectors, imageOptions, attributes),
		...generateTaxonomyBaseStyles(selectors, taxonomyOptions),
		...generateButtonBaseStyles(selectors, attributes),
		...generateSocialBaseStyles(selectors, socialShareOptions),
		...generateLayoutStyles(selectors, layoutOptions, attributes.sliderOptions),
		...generateTilesBaseStyles(selectors, attributes),
		...generateThumbnailsSliderBaseStyles(selectors, attributes),
		...generateSliderBaseStyles(selectors, attributes),
		...generateSliderAspectRatioStyles(selectors, attributes),
		...generateVideoBaseStyles(selectors, videoOptions),
		...generateOverlayGlobalIconBaseRules(selectors, attributes),
		...generatePanoramaReflectionPaddingRules(selectors, attributes),
	];
};

const getResponsiveRules = (attributes, device) => {
	const {
		uniqueId,
		contentAreaOptions = {},
		taxonomyOptions = {},
		socialShareOptions = {},
		videoOptions = {},
		advancedOptions = {},
	} = attributes;
	const imageOptions = getEffectiveImageOptions(attributes);

	const selectors = createSelectors(uniqueId, attributes.sourceType);

	return [
		...generateTypographyRules(selectors, attributes, device),
		...generateButtonRules(selectors, attributes, device),
		...generateTaxonomyResponsiveRules(selectors, taxonomyOptions, device),
		...generateCardResponsiveRules(selectors, contentAreaOptions, device, attributes),
		...generateImageResponsiveRules(
			selectors,
			imageOptions,
			device,
			attributes.sourceType || 'image',
			attributes
		),
		...generateSocialResponsiveRules(selectors, socialShareOptions, device),
		...generateVideoResponsiveRules(selectors, videoOptions, device),
		...generateTilesResponsiveStyles(selectors, attributes, device),
		...generateThumbnailsSliderResponsiveStyles(selectors, attributes, device),
		...generateSliderResponsiveStyles(selectors, attributes, device),
		...generateVisibilityRules(selectors, advancedOptions, device),
		...generatePanoramaSideMarginRules(selectors, attributes, device),
		...generateAdvancedSpacingRules(
			selectors,
			advancedOptions.margin,
			advancedOptions.padding,
			device
		),
		...generateOverlayGlobalIconResponsiveRules(selectors, attributes, device),
	];
};

const getCarouselStyleRules = (mode, attributes) => {
	if (mode === 'base') {
		return getBaseRules(attributes);
	}
	return getResponsiveRules(attributes, mode);
};

/**
 * Wrap one device's config-driven `--wpcp-*` token bag as static-consumer rules.
 * Most tokens land on the block wrapper; click-action geometry lands closer to
 * the overlay nodes so block overrides have parity with global lightbox CSS.
 *
 * @param {Object} selectors createSelectors() output.
 * @param {Object} bag       The `{ '--wpcp-*': value }` map for one device.
 * @return {Array} Zero or more `{ class, styles }` rules.
 */
const tokenBagRules = (selectors, bag) => {
	if (!bag || Object.keys(bag).length === 0) {
		return [];
	}

	const wrapperBag = { ...bag };
	const rules = [];
	const overlayOffset = wrapperBag['--wpcp-overlay-offset'];
	const overlayIconBag = Object.fromEntries(
		Object.entries(wrapperBag).filter(([token]) => token.startsWith('--wpcp-click-'))
	);

	if (wrapperBag['--wpcp-icon-size'] !== undefined) {
		overlayIconBag['--wpcp-icon-size'] = wrapperBag['--wpcp-icon-size'];
	}

	delete wrapperBag['--wpcp-overlay-offset'];
	Object.keys(overlayIconBag).forEach((token) => delete wrapperBag[token]);

	if (Object.keys(wrapperBag).length > 0) {
		rules.push({ class: selectors.wrapper, styles: wrapperBag });
	}
	if (overlayOffset !== undefined) {
		rules.push({
			class: selectors.clickActionWrapper,
			styles: { '--wpcp-overlay-offset': overlayOffset },
		});
	}
	if (Object.keys(overlayIconBag).length > 0) {
		rules.push({
			class: `${selectors.wrapper} .wpcp-overlay-icon.wpcp-lightbox-icon, ${selectors.wrapper} .wpcp-overlay-icon.wpcp-link-icon`,
			styles: overlayIconBag,
		});
	}

	return rules;
};

/**
 * Build scoped CSS for one block instance (desktop + tablet + mobile).
 *
 * @param {Object}          attributes - Block attributes.
 * @param {'editor'|'base'} mode       - `editor` adds Google Fonts import; `base` omits it.
 * @return {string} Merged CSS string for the carousel instance.
 */
const dynamicCss = (attributes, mode = 'base') => {
	if (!attributes?.uniqueId) {
		// eslint-disable-next-line no-console
		console.warn('carouselDynamicCss: uniqueId is required');
		return '';
	}

	// Editor preview needs to load Google Fonts too (frontend enqueues via PHP).
	const googleFontsImport = buildGoogleFontsImport(attributes, mode);

	// Config-driven token bags (one walk over the style config), merged onto the
	// wrapper per device alongside the per-concern rules. Carousel feature rows
	// only — pagination is scoped separately via paginationDotsDynamicCss /
	// NavigationBuilder.
	const selectors = createSelectors(attributes.uniqueId, attributes.sourceType);
	const carouselTokenConfig = styleConfig.filter((row) => !String(row.id).startsWith('pag-'));
	const tokenBags = emitTokens(carouselTokenConfig, attributes);

	const desktopMerged = mergeCssRulesBySelector([
		...getCarouselStyleRules('base', attributes),
		...getCarouselStyleRules(DEVICES.DESKTOP, attributes),
		...tokenBagRules(selectors, tokenBags.Desktop),
	]);
	const tabletMerged = mergeCssRulesBySelector([
		...getCarouselStyleRules(DEVICES.TABLET, attributes),
		...tokenBagRules(selectors, tokenBags.Tablet),
	]);
	const mobileMerged = mergeCssRulesBySelector([
		...getCarouselStyleRules(DEVICES.MOBILE, attributes),
		...tokenBagRules(selectors, tokenBags.Mobile),
	]);

	// Tablet/Mobile only carry declarations that differ from the value already in
	// effect from the wider breakpoint(s); a media-query rule identical to the
	// cascade-inherited value is a no-op. Keeps the per-instance CSS minimal.
	const tabletDeduped = dropRulesMatchingBaseline(tabletMerged, [desktopMerged]);
	const mobileDeduped = dropRulesMatchingBaseline(mobileMerged, [desktopMerged, tabletMerged]);
	const tilesCollapseCss = generateTilesCollapseCss(attributes);
	const customCssString = applyCustomCss(attributes.advancedOptions?.customCss, selectors.wrapper);

	return [
		googleFontsImport,
		objectToCssString(desktopMerged),
		wrapInMediaQuery(objectToCssString(tabletDeduped), TABLET_MEDIA_QUERY),
		wrapInMediaQuery(objectToCssString(mobileDeduped), MOBILE_MEDIA_QUERY),
		tilesCollapseCss,
		customCssString,
	]
		.filter(Boolean)
		.join('\n\n');
};

export default dynamicCss;
