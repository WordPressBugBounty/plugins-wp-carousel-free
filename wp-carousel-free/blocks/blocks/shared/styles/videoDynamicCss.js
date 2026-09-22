/**
 * Video source dynamic-CSS generators.
 *
 * Mirrors the video branch of CarouselDynamicCss.php (the VideoCss trait). Split
 * out of the carouselDynamicCss monolith; the editor composes these through the
 * default `dynamicCss` export exactly as before. Keep rule-for-rule parity with the
 * PHP side — the tests/css-parity harness gates it.
 */

import { getBgValue } from './cssHelpers';
import { getSocialRangerDimension, pushStylePropertyRuleIfDiffers } from './cssRuleHelpers';

/** @typedef {'Desktop'|'Tablet'|'Mobile'} DeviceType */

/**
 * Video overlay — base (non-responsive) styles.
 *
 * Layer-5 (algorithmic) remainder, kept as a paired rule-string builder rather
 * than a token: `getBgValue` chooses *which* property exists from the value
 * shape — `background` for a gradient/image object, `background-color` for a
 * solid string — so it changes the rule itself, not just a value, which a config
 * row cannot express. The play icon (fill/color/bg, hover) and thumbnail border
 * are token-driven from static SCSS; only this overlay fan-out stays here.
 *
 * Gated by CSS-string css-parity against its PHP twin
 * (`VideoCss::video_base_styles`), not the value-map — it emits no `--wpcp-*`.
 *
 * @param {Object} selectors    - Result of `createSelectors`.
 * @param {Object} videoOptions - Block attribute slice.
 * @return {Array<{ class: string, styles: Record<string, string> }>} CSS rule list.
 */
export const generateVideoBaseStyles = (selectors, videoOptions) => {
	const rules = [];
	const { videoThumbnailWrapperOverlay } = selectors;

	if (videoOptions?.overlayEnable && videoOptions?.overlayColor) {
		if (typeof videoOptions.overlayColor === 'object') {
			const bg = getBgValue(videoOptions.overlayColor);
			pushStylePropertyRuleIfDiffers(rules, videoThumbnailWrapperOverlay, 'background', bg);
		} else {
			pushStylePropertyRuleIfDiffers(
				rules,
				videoThumbnailWrapperOverlay,
				'background-color',
				videoOptions.overlayColor
			);
		}
	}

	return rules;
};

/**
 * Custom video media dimensions — per-device rules. Icon size/area and the border
 * radius/width are token-driven from static SCSS now; the custom media width/height
 * stay a **Layer-5** paired rule-string builder (NOT tokenized, gated by CSS-string
 * css-parity against `VideoCss::video_responsive_rules`). The legacy
 * `#uid .wpcp-item-media { width/height }` (1,1,0) is load-bearing specificity over
 * the shared image-aspect system (`.wpcp-item-media.wpcp-item-media--custom-rsp` at
 * 0,2,0, applied whenever `aspect === 'custom'` regardless of source) and the
 * content-box `width:100%` override; a static token consumer (0,1,0)
 * would be un-masked by them — the same blocker as content-area card padding. See
 * src/Blocks/Styles/README.md (Layer-5 catalogue).
 *
 * @param {Object}     selectors    - Result of `createSelectors`.
 * @param {Object}     videoOptions - Block attribute slice.
 * @param {DeviceType} device       - 'Desktop' | 'Tablet' | 'Mobile'.
 * @return {Array<{ class: string, styles: Record<string, string> }>} CSS rule list.
 */
export const generateVideoResponsiveRules = (selectors, videoOptions, device) => {
	const rules = [];

	// Width/height are only meaningful for a custom aspect ratio — the panel hides
	// these controls for every preset ratio, so a value left from a prior 'custom'
	// choice must not leak out when the user switches back to a preset.
	if (videoOptions?.aspectRatio !== 'custom') {
		return rules;
	}

	const { media } = selectors;
	// The img carries an inline `height:auto` default that shadows any stylesheet
	// height rule (inline beats specificity), so the rule must land on the img
	// element itself — `.wpcp-item-media img` — not just the wrapper. Mirrors the
	// PHP `$this->image_media_selector . ' img'` target in VideoCss.
	const mediaImage = `${media} img`;

	const widthDim = getSocialRangerDimension(videoOptions?.customVideoWidth, device);
	if (widthDim) {
		const cssWidth = `${widthDim.num}${widthDim.unit}`;
		pushStylePropertyRuleIfDiffers(rules, media, 'width', cssWidth);
		pushStylePropertyRuleIfDiffers(rules, mediaImage, 'width', cssWidth);
	}

	const heightDim = getSocialRangerDimension(videoOptions?.customVideoHeight, device);
	if (heightDim) {
		const cssHeight = `${heightDim.num}${heightDim.unit}`;
		pushStylePropertyRuleIfDiffers(rules, media, 'height', cssHeight);
		pushStylePropertyRuleIfDiffers(rules, mediaImage, 'height', cssHeight);
	}

	return rules;
};
