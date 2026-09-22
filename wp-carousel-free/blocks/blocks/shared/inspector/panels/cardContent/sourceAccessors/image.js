/**
 * Style-tab routing accessor for the image source.
 *
 * Lifted verbatim from the former `ContentPanel` Style tab. `contentOptions` is
 * the canonical container, so typography is a single write here (no
 * post/product mirror).
 *
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Gutenberg setter.
 * @return {Object} Uniform Style-tab accessor bundle.
 */
import { __ } from '@wordpress/i18n';
import { TYPO_KEY_MAP, TYPO_MAP, mergeTypographyUpdate } from './typoMaps';
import { createSpacingDefaults, normalizeSpacingAttr } from './spacing';

export function createImageAccessor(attributes, setAttributes) {
	const co = attributes.contentOptions || {};

	const set = (updates) => setAttributes({ contentOptions: { ...co, ...updates } });

	const getNormalColor = (value) => {
		if (value && typeof value === 'object') {
			return value.color ?? '';
		}
		return value ?? '';
	};

	const setTitleTypography = (updates) => {
		setAttributes({
			contentOptions: {
				...co,
				titleTypography: mergeTypographyUpdate(co.titleTypography, updates),
			},
		});
	};

	const setDescTypography = (updates) => {
		setAttributes({
			contentOptions: {
				...co,
				descTypography: mergeTypographyUpdate(co.descTypography, updates),
			},
		});
	};

	const setButtonTypography = (updates) => {
		setAttributes({
			contentOptions: {
				...co,
				buttonTypography: mergeTypographyUpdate(co.buttonTypography, updates),
			},
		});
	};

	const titleTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(co.titleTypography || {}),
	};

	const descTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(co.descTypography || {}),
	};

	const buttonTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(co.buttonTypography || {}),
	};

	const titleApplyToAllTypography = [setDescTypography, setButtonTypography];
	const descApplyToAllTypography = [setTitleTypography, setButtonTypography];
	const buttonApplyToAllTypography = [setTitleTypography, setDescTypography];

	const titleMargin = normalizeSpacingAttr(co?.titleMargin, 0);
	const descMargin = normalizeSpacingAttr(co?.descMargin, 0);
	const marginDefaultValue = {
		unit: 'px',
		value: { top: 0, right: 0, bottom: 0, left: 0 },
		device: createSpacingDefaults(0).device,
	};

	return {
		descLabel: __('Description', 'wp-carousel-free'),
		descSlot: 'description',
		hasPrice: false,

		title: {
			typoAttributes: titleTypoAttributes,
			setTypography: setTitleTypography,
			applyToAll: titleApplyToAllTypography,
		},
		desc: {
			typoAttributes: descTypoAttributes,
			setTypography: setDescTypography,
			applyToAll: descApplyToAllTypography,
		},
		price: null,
		button: {
			typoAttributes: buttonTypoAttributes,
			setTypography: setButtonTypography,
			applyToAll: buttonApplyToAllTypography,
		},

		titleColorProps: (colorState) =>
			colorState === 'hover'
				? {
						label: __('Title Color', 'wp-carousel-free'),
						attributes: co.titleColor?.hoverColor ?? '',
						attributesKey: 'titleColor',
						onChange: (value) => set({ titleColor: { ...co?.titleColor, hoverColor: value } }),
				  }
				: {
						label: __('Title Color', 'wp-carousel-free'),
						attributes: co.titleColor?.color ?? '',
						attributesKey: 'color',
						onChange: (value) => set({ titleColor: { ...co?.titleColor, color: value } }),
				  },

		descColorProps: () => ({
			label: __('Description Color', 'wp-carousel-free'),
			attributes: getNormalColor(co.descColor),
			attributesKey: 'color',
			onChange: (value) =>
				set({
					descColor: {
						...(typeof co?.descColor === 'object' ? co.descColor : {}),
						color: value,
					},
				}),
		}),

		titleMarginProps: {
			attributes: titleMargin,
			attributesKey: 'titleMargin',
			setAttributes: set,
			units: ['px', '%', 'em'],
			defaultValue: marginDefaultValue,
		},
		descMarginProps: {
			attributes: descMargin,
			attributesKey: 'descMargin',
			setAttributes: set,
			units: ['px', '%', 'em'],
			defaultValue: marginDefaultValue,
		},
	};
}
