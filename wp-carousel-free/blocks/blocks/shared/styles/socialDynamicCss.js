/**
 * Social-share dynamic-CSS concern (editor side).
 *
 * Split out of the carouselDynamicCss monolith; the composer imports these.
 * Layer-5 remainder (rule-string builders): icon fill/background colors (gated
 * on `customStyling`) and the per-device size/area/gap/radius/margin. Mirrors
 * the PHP twin in CarouselDynamicCss::base_styles / responsive_css (social
 * branches).
 */

import { DEVICES } from './constants';
import { spacingGenerate } from './cssHelpers';
import {
	getSocialRangerDimension,
	hasResponsiveSpacing,
	isZeroSpacingValue,
	pushStylePropertyRuleIfDiffers,
} from './cssRuleHelpers';

/** Defaults per breakpoint (matches block.json socialShareOptions). */
const SOCIAL_RANGER_DEFAULTS = {
	[DEVICES.DESKTOP]: { iconSize: 20, iconAreaSize: 40, gap: 10 },
	[DEVICES.TABLET]: { iconSize: 18, iconAreaSize: 36, gap: 8 },
	[DEVICES.MOBILE]: { iconSize: 16, iconAreaSize: 32, gap: 6 },
};

export const generateSocialBaseStyles = (selectors, socialShareOptions) => {
	const rules = [];
	if (!socialShareOptions?.customStyling) {
		return rules;
	}
	const { socialSvg, socialLink, socialHoverSvg, socialHoverLink } = selectors;

	// Framed view keeps the background transparent (static CSS) and colors the
	// outline instead, so iconBg/iconHoverBg drive border-color there.
	const fillProperty =
		socialShareOptions.iconView === 'framed' ? 'border-color' : 'background-color';

	pushStylePropertyRuleIfDiffers(rules, socialSvg, 'fill', socialShareOptions.iconColor);
	pushStylePropertyRuleIfDiffers(rules, socialLink, fillProperty, socialShareOptions.iconBg);
	pushStylePropertyRuleIfDiffers(rules, socialHoverSvg, 'fill', socialShareOptions.iconHoverColor);
	pushStylePropertyRuleIfDiffers(
		rules,
		socialHoverLink,
		fillProperty,
		socialShareOptions.iconHoverBg
	);

	return rules;
};

export const generateSocialResponsiveRules = (selectors, socialShareOptions, device) => {
	const rules = [];
	const { social, socialLink } = selectors;
	const defs = SOCIAL_RANGER_DEFAULTS[device] || SOCIAL_RANGER_DEFAULTS[DEVICES.DESKTOP];

	const iconDim = getSocialRangerDimension(socialShareOptions?.iconSize, device);
	if (iconDim) {
		const cssSize = `${iconDim.num}${iconDim.unit}`;
		const defaultSize = `${defs.iconSize}px`;
		pushStylePropertyRuleIfDiffers(rules, `${social} svg`, 'width', cssSize, defaultSize);
		pushStylePropertyRuleIfDiffers(rules, `${social} svg`, 'height', cssSize, defaultSize);
	}

	// Icon area size (width/height) only applies when iconView is not 'normal'
	const iconView = socialShareOptions?.iconView ?? 'stacked';
	if (iconView !== 'normal') {
		const areaDim = getSocialRangerDimension(socialShareOptions?.iconAreaSize, device);
		if (areaDim) {
			const cssArea = `${areaDim.num}${areaDim.unit}`;
			const defaultArea = `${defs.iconAreaSize}px`;
			pushStylePropertyRuleIfDiffers(rules, socialLink, 'width', cssArea, defaultArea);
			pushStylePropertyRuleIfDiffers(rules, socialLink, 'height', cssArea, defaultArea);
		}
	}

	const gapDim = getSocialRangerDimension(socialShareOptions?.gap, device);
	if (gapDim) {
		const cssGap = `${gapDim.num}${gapDim.unit}`;
		const defaultGap = `${defs.gap}px`;
		pushStylePropertyRuleIfDiffers(rules, social, 'gap', cssGap, defaultGap);
	}
	if (socialShareOptions?.borderRadius && hasResponsiveSpacing(socialShareOptions.borderRadius)) {
		pushStylePropertyRuleIfDiffers(
			rules,
			socialLink,
			'border-radius',
			spacingGenerate(socialShareOptions.borderRadius, device)
		);
	}
	if (socialShareOptions?.margin && hasResponsiveSpacing(socialShareOptions.margin)) {
		const socialMarginCss = spacingGenerate(socialShareOptions.margin, device);
		if (!isZeroSpacingValue(socialMarginCss)) {
			pushStylePropertyRuleIfDiffers(rules, social, 'margin', socialMarginCss);
		}
	}

	return rules;
};
