/**
 * Source-type config resolution for dynamic CSS generators.
 *
 * Leaf module split out of the carouselDynamicCss monolith so content-area,
 * button, and typography generators can import it without circular deps back
 * into the file being carved up.
 */

import { SOURCE_TYPES } from './constants';

const getAudioReadMoreButtonStyle = (audioOptions = {}, productContentOptions = {}) => {
	const readMoreButtonStyle = audioOptions?.readMoreButtonStyle || {};
	return Object.keys(readMoreButtonStyle).length > 0 ? readMoreButtonStyle : productContentOptions;
};

const hasResponsiveTypographyValue = (value) => {
	const deviceValues = value?.device || {};
	return Object.values(deviceValues).some((deviceValue) => {
		if (deviceValue && typeof deviceValue === 'object') {
			return Object.values(deviceValue).some(
				(nestedValue) => nestedValue !== '' && nestedValue !== null && nestedValue !== undefined
			);
		}
		return deviceValue !== '' && deviceValue !== null && deviceValue !== undefined;
	});
};

const hasTypographyValue = (typography) => {
	if (!typography || typeof typography !== 'object') {
		return false;
	}

	const family = typography?.family;
	const familyValue =
		family && typeof family === 'object'
			? family?.family || family?.googleFont?.family || family?.typography?.family
			: family;

	return (
		[
			familyValue,
			typography?.fontWeight,
			typography?.style,
			typography?.transform,
			typography?.decoration,
		].some((value) => value !== '' && value !== null && value !== undefined) ||
		[
			typography?.fontSize,
			typography?.lineHeight,
			typography?.fontSpacing,
			typography?.wordSpacing,
		].some(hasResponsiveTypographyValue)
	);
};

export const firstTypographyValue = (...candidates) =>
	candidates.find((candidate) => hasTypographyValue(candidate));

/**
 * Resolve source-specific margin, button, and typography handles.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Resolved margins, button fields, and typography handles.
 */
export const getSourceConfig = (attributes) => {
	const {
		sourceType: rawSource = SOURCE_TYPES.IMAGE,
		contentOptions = {},
		postContentOptions = {},
		productContentOptions = {},
		audioOptions = {},
	} = attributes;

	const sourceType = rawSource || SOURCE_TYPES.IMAGE;
	const audioReadMoreButtonStyle = getAudioReadMoreButtonStyle(audioOptions, productContentOptions);

	let titleMargin;
	let descMargin;
	let readMorePadding;
	let readMoreMargin;
	let readMoreRadius;

	if ([SOURCE_TYPES.POST, SOURCE_TYPES.EXTERNAL, SOURCE_TYPES.VIDEO].includes(sourceType)) {
		titleMargin = postContentOptions?.titleMargin ?? contentOptions?.titleMargin;
		descMargin = postContentOptions?.excerptMargin ?? contentOptions?.descMargin;
		readMorePadding = postContentOptions?.btnPadding;
		readMoreMargin = postContentOptions?.btnMargin;
		readMoreRadius = postContentOptions?.buttonBorderRadius;
	} else if (sourceType === SOURCE_TYPES.PRODUCT) {
		titleMargin = productContentOptions?.titleMargin ?? contentOptions?.titleMargin;
		descMargin =
			productContentOptions?.descMargin ??
			productContentOptions?.desMargin ??
			contentOptions?.descMargin;
		readMorePadding = productContentOptions?.cartPadding;
		readMoreRadius = productContentOptions?.cartBorderRadius;
	} else if (sourceType === SOURCE_TYPES.AUDIO) {
		titleMargin = contentOptions?.titleMargin;
		descMargin = contentOptions?.descMargin;
		readMorePadding = audioReadMoreButtonStyle?.cartPadding;
		readMoreRadius = audioReadMoreButtonStyle?.cartBorderRadius;
	} else {
		titleMargin = contentOptions?.titleMargin;
		descMargin = contentOptions?.descMargin;
		readMorePadding = contentOptions?.cartPadding;
		readMoreRadius = contentOptions?.cartBorderRadius;
	}

	let buttonTypography;

	if (sourceType === SOURCE_TYPES.AUDIO) {
		buttonTypography = firstTypographyValue(audioReadMoreButtonStyle?.buttonTypography);
	} else if ([SOURCE_TYPES.POST, SOURCE_TYPES.EXTERNAL, SOURCE_TYPES.VIDEO].includes(sourceType)) {
		buttonTypography = firstTypographyValue(
			postContentOptions?.buttonTypography,
			contentOptions?.buttonTypography
		);
	} else if (sourceType === SOURCE_TYPES.PRODUCT) {
		buttonTypography = firstTypographyValue(
			productContentOptions?.buttonTypography,
			contentOptions?.buttonTypography
		);
	} else {
		buttonTypography = firstTypographyValue(contentOptions?.buttonTypography);
	}

	const priceTypography = productContentOptions?.priceTypography;

	return {
		sourceType,
		titleMargin,
		descMargin,
		readMorePadding,
		readMoreMargin,
		readMoreRadius,
		buttonTypography,
		priceTypography,
		productPriceMargin: productContentOptions?.priceMargin,
	};
};

export { getAudioReadMoreButtonStyle };
