/**
 * Read-more / add-to-cart button dynamic-CSS concern (editor side).
 *
 * Split out of the carouselDynamicCss monolith; the composer imports these.
 * Layer-5 remainder (rule-string builders): source-gated (post/external/
 * product/audio/image) color/background/hover + border (view-gated) +
 * padding/margin/radius + icon gap/size and the static icon-wrap flex. Mirrors
 * the PHP twin in CarouselDynamicCss::base_styles / responsive_css (button
 * branches).
 */

import { SOURCE_TYPES } from './constants';
import { spacingGenerate, getBoxShadowValue } from './cssHelpers';
import {
	hasResolvedOptionValue,
	hasResponsiveSpacing,
	isZeroSpacingValue,
	pushStylePropertyRuleIfDiffers,
} from './cssRuleHelpers';
import { getSourceConfig, getAudioReadMoreButtonStyle } from './sourceConfigHelpers';

// Default read-more icon box. The static stylesheet already sizes the icon to
// 16px, so an explicit 16px value is redundant and must not be re-emitted.
const READ_MORE_ICON_DEFAULT_SIZE = '16px';

const getReadMoreIconDimension = (attr, device) => {
	if (attr === null || attr === undefined || attr === '') {
		return null;
	}

	if (typeof attr === 'number' && !Number.isNaN(attr)) {
		return { value: attr, unit: 'px' };
	}

	if (typeof attr === 'string' && '' !== attr.trim()) {
		const numericValue = parseFloat(attr);
		return Number.isNaN(numericValue) ? null : { value: numericValue, unit: 'px' };
	}

	if ('object' !== typeof attr) {
		return null;
	}

	const responsiveValue = attr?.device?.[device];
	if (hasResolvedOptionValue(responsiveValue)) {
		const numericValue = parseFloat(responsiveValue);
		if (Number.isNaN(numericValue)) {
			return null;
		}

		const responsiveUnit =
			attr?.unit && 'object' === typeof attr.unit
				? attr.unit?.[device] || attr.unit?.Desktop || 'px'
				: attr?.unit || 'px';

		return { value: numericValue, unit: responsiveUnit };
	}

	if (hasResolvedOptionValue(attr?.[device])) {
		const numericValue = parseFloat(attr[device]);
		if (Number.isNaN(numericValue)) {
			return null;
		}

		return { value: numericValue, unit: attr?.unit || 'px' };
	}

	if (hasResolvedOptionValue(attr?.value)) {
		const numericValue = parseFloat(attr.value);
		if (Number.isNaN(numericValue)) {
			return null;
		}

		return { value: numericValue, unit: attr?.unit || 'px' };
	}

	return null;
};

export const generateButtonBaseStyles = (selectors, attributes) => {
	const rules = [];
	const {
		sourceType,
		contentOptions = {},
		postContentOptions = {},
		productContentOptions = {},
		audioOptions = {},
	} = attributes;
	const audioReadMoreButtonStyle = getAudioReadMoreButtonStyle(audioOptions, productContentOptions);

	let buttonBorder;
	let buttonBorderWidth;
	let buttonColor;
	let buttonBg;
	let buttonHoverColor;
	let buttonHoverBg;
	let buttonView;
	let btnBoxShadow;
	let btnShadowHover;

	if ([SOURCE_TYPES.POST, SOURCE_TYPES.EXTERNAL, SOURCE_TYPES.VIDEO].includes(sourceType)) {
		buttonBorder = postContentOptions.buttonBorder;
		buttonBorderWidth = postContentOptions.btnBorderWidth;
		buttonColor = postContentOptions.buttonColor;
		buttonBg = postContentOptions.buttonBg;
		buttonHoverColor = postContentOptions.buttonHoverColor;
		buttonHoverBg = postContentOptions.buttonHoverBg;
		buttonView = postContentOptions.buttonType;
		btnBoxShadow = postContentOptions.btnBoxShadow;
		btnShadowHover = postContentOptions.btnShadowHover;
	} else if (sourceType === SOURCE_TYPES.PRODUCT) {
		buttonBorder = productContentOptions.cartBorder;
		buttonBorderWidth = productContentOptions.cartBorderWidth;
		buttonColor = productContentOptions.buttonColor;
		buttonBg = productContentOptions.buttonBg;
		buttonHoverColor = productContentOptions.buttonHoverColor;
		buttonHoverBg = productContentOptions.buttonHoverBg;
		buttonView = 'button';
	} else if (sourceType === SOURCE_TYPES.AUDIO) {
		buttonBorder = audioReadMoreButtonStyle.cartBorder;
		buttonBorderWidth = audioReadMoreButtonStyle.cartBorderWidth;
		buttonColor = audioReadMoreButtonStyle.buttonColor;
		buttonBg = audioReadMoreButtonStyle.buttonBg;
		buttonHoverColor = audioReadMoreButtonStyle.buttonHoverColor;
		buttonHoverBg = audioReadMoreButtonStyle.buttonHoverBg;
		buttonView = contentOptions.buttonType;
	} else {
		buttonBorder = contentOptions.cartBorder;
		buttonBorderWidth = contentOptions.cartBorderWidth;
		buttonColor = contentOptions.buttonColor;
		buttonBg = contentOptions.buttonBg;
		buttonHoverColor = contentOptions.buttonHoverColor;
		buttonHoverBg = contentOptions.buttonHoverBg;
		buttonView = contentOptions.buttonType;
	}

	const buttonStyles = {};
	if (buttonColor) {
		buttonStyles.color = buttonColor;
	}
	if (Object.keys(buttonStyles).length > 0) {
		rules.push({
			class: selectors.readMore,
			styles: buttonStyles,
		});
	}

	const buttonHoverStyles = {};
	if (buttonHoverColor) {
		buttonHoverStyles.color = buttonHoverColor;
	}
	// if (buttonHoverBg) {
	// 	buttonHoverStyles['background-color'] = buttonHoverBg;
	// }
	if (Object.keys(buttonHoverStyles).length > 0) {
		rules.push({
			class: `${selectors.readMore}:hover`,
			styles: buttonHoverStyles,
		});
	}

	if (buttonView === 'button' && buttonBorder?.style) {
		rules.push({
			class: selectors.readMore,
			styles: {
				'border-style': buttonBorder.style,
				'border-color': buttonBorder?.color || '',
			},
		});
	}

	if (buttonBorder?.style && buttonBorder.style !== 'none') {
		const widthCss = spacingGenerate(buttonBorderWidth, 'Desktop');
		if (widthCss) {
			rules.push({
				class: selectors.readMore,
				styles: {
					'border-width': widthCss,
				},
			});
		}

		if (buttonBorder.hoverColor && buttonView === 'button') {
			rules.push({
				class: `${selectors.readMore}:hover`,
				styles: { 'border-color': buttonBorder.hoverColor },
			});
		}
	}

	// Button style for readMoreBtn selector with comprehensive styling.
	const buttonStyleBtn = {};
	if (buttonBg) {
		buttonStyleBtn['background-color'] = buttonBg;
	}
	if (buttonBorder?.style && buttonView === 'button') {
		buttonStyleBtn['border-style'] = buttonBorder.style;
	}
	if (buttonBorder?.color && buttonView === 'button') {
		buttonStyleBtn['border-color'] = buttonBorder.color;
	}
	if (buttonBorderWidth && buttonView === 'button') {
		const btnWidthCss = spacingGenerate(buttonBorderWidth, 'Desktop');
		if (btnWidthCss) {
			buttonStyleBtn['border-width'] = btnWidthCss;
		}
	}
	const btnShadowValue = getBoxShadowValue(btnBoxShadow);
	if (btnShadowValue) {
		buttonStyleBtn['box-shadow'] = btnShadowValue;
	}
	if (Object.keys(buttonStyleBtn).length > 0) {
		rules.push({
			class: selectors.readMoreBtn,
			styles: buttonStyleBtn,
		});
	}

	// Button style hover state for readMoreBtn selector.
	const buttonStyleBtnHover = {};
	if (buttonHoverBg) {
		buttonStyleBtnHover['background-color'] = buttonHoverBg;
	}
	if (buttonBorder?.hoverColor && buttonView === 'button') {
		buttonStyleBtnHover['border-color'] = buttonBorder.hoverColor;
	}
	const btnShadowHoverValue = getBoxShadowValue(btnShadowHover);
	if (btnShadowHoverValue) {
		buttonStyleBtnHover['box-shadow'] = btnShadowHoverValue;
	}
	if (Object.keys(buttonStyleBtnHover).length > 0) {
		rules.push({
			class: `${selectors.readMoreBtn}:hover`,
			styles: buttonStyleBtnHover,
		});
	}

	return rules;
};

export const generateButtonRules = (selectors, attributes, device) => {
	const { readMorePadding, readMoreMargin, readMoreRadius } = getSourceConfig(attributes);
	const { postContentOptions = {}, contentOptions = {}, sourceType } = attributes;
	const rules = [];

	if (readMorePadding && hasResponsiveSpacing(readMorePadding)) {
		pushStylePropertyRuleIfDiffers(
			rules,
			selectors.readMore,
			'padding',
			spacingGenerate(readMorePadding, device)
		);
	}
	if (readMoreMargin && hasResponsiveSpacing(readMoreMargin)) {
		pushStylePropertyRuleIfDiffers(
			rules,
			selectors.readMore,
			'margin',
			spacingGenerate(readMoreMargin, device)
		);
	}
	if (readMoreRadius && hasResponsiveSpacing(readMoreRadius)) {
		// Border-radius takes four distinct corners (top/right/bottom/left), so emit
		// all sides — the `true` (single) collapse dropped three corners and turned
		// `8px 12px 16px 0px` into `8px`. Suppress all-zero for the static default.
		// Mirrors ButtonCss::button_responsive_rules().
		const radiusCss = spacingGenerate(readMoreRadius, device, false);
		if (radiusCss && !isZeroSpacingValue(radiusCss)) {
			pushStylePropertyRuleIfDiffers(rules, selectors.readMore, 'border-radius', radiusCss);
		}
	}

	// Read More icon gap/size follow the source-specific option bag. Show Icon
	// is Pro for post/video, so that family contributes no icon CSS at all —
	// mirrors ButtonCss::button_responsive_rules(). External keeps using
	// postContentOptions; media sources read from contentOptions so the shared
	// Content panel preview stays in sync.
	let readMoreIconOptions = contentOptions;
	if ([SOURCE_TYPES.POST, SOURCE_TYPES.VIDEO].includes(sourceType)) {
		readMoreIconOptions = {};
	} else if (SOURCE_TYPES.EXTERNAL === sourceType) {
		readMoreIconOptions = postContentOptions;
	}

	const iconPositions = readMoreIconOptions?.iconPosition;
	const marginProperty = {
		left: 'margin-right',
		right: 'margin-left',
	};
	const readmoreSelector = readMoreIconOptions?.showIconHover
		? `${selectors.readMore}:hover.wpcp-icon-position-${iconPositions} .wpcp-readmore-icon`
		: `${selectors.readMore}.wpcp-icon-position-${iconPositions} .wpcp-readmore-icon`;
	if (readMoreIconOptions) {
		const iconGapDimension = getReadMoreIconDimension(readMoreIconOptions?.iconGap, device);
		if (iconGapDimension) {
			pushStylePropertyRuleIfDiffers(
				rules,
				readmoreSelector,
				marginProperty[iconPositions],
				`${iconGapDimension.value}${iconGapDimension.unit}`
			);
		}

		// Size both the wrapper and the inner asset so frontend PHP output matches
		// the editor's inline preview sizing for library and custom icons.
		const iconSizeDimension = getReadMoreIconDimension(readMoreIconOptions?.iconSize, device);
		if (iconSizeDimension) {
			const iconSize = `${iconSizeDimension.value}${iconSizeDimension.unit}`;
			if (iconSize !== READ_MORE_ICON_DEFAULT_SIZE) {
				rules.push({
					class: selectors.readMoreIconWrap,
					styles: {
						'font-size': iconSize,
						width: iconSize,
						height: iconSize,
					},
				});
				rules.push({
					class: selectors.readMoreIcon,
					styles: {
						width: iconSize,
						height: iconSize,
					},
				});
			}
		}
	}

	return rules;
};
