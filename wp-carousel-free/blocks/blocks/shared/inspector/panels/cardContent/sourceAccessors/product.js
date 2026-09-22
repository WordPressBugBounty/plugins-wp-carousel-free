/**
 * Style-tab routing accessor for the product source.
 *
 * Lifted verbatim from the former `ProductContentPanel` Style tab. Typography is
 * a DUAL-WRITE (title/desc mirror into the canonical `contentOptions`); price
 * and button typography stay in `productContentOptions`. Apply-to-all fans
 * typography into title/desc/price/button + `metaOptions`/`taxonomyOptions`.
 * Description margin keeps the legacy `desMargin` merge-read but writes
 * `descMargin` (do not switch keys — legacy `desMargin`-only content relies on
 * the read fallback in the dynamic-CSS layer).
 *
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Gutenberg setter.
 * @return {Object} Uniform Style-tab accessor bundle.
 */
import { __ } from '@wordpress/i18n';
import { TYPO_KEY_MAP, TYPO_MAP, mergeTypographyUpdate } from './typoMaps';
import { SPACING_DEFAULT, makeCreateSpacingHandlers } from './spacing';

export function createProductAccessor(attributes, setAttributes) {
	const pco = attributes.productContentOptions || {};
	const co = attributes.contentOptions || {};
	const mo = attributes.metaOptions || {};
	const taxonomyOptions = attributes.taxonomyOptions || {};

	const set = (updates) =>
		setAttributes({
			productContentOptions: { ...pco, ...updates },
			contentOptions: {
				...co,
				...(Object.prototype.hasOwnProperty.call(updates, 'titleColor')
					? { titleColor: updates.titleColor }
					: {}),
				...(Object.prototype.hasOwnProperty.call(updates, 'descColor')
					? { descColor: updates.descColor }
					: {}),
			},
		});

	const setTitleTypography = (updates) => {
		setAttributes({
			productContentOptions: {
				...pco,
				titleTypography: {
					...(pco.titleTypography || {}),
					...updates,
				},
			},
			contentOptions: {
				...co,
				titleTypography: {
					...(co.titleTypography || {}),
					...updates,
				},
			},
		});
	};

	const setPriceTypography = (updates) => {
		setAttributes({
			productContentOptions: {
				...pco,
				priceTypography: {
					...(pco.priceTypography || {}),
					...updates,
				},
			},
		});
	};

	const setDescTypography = (updates) => {
		setAttributes({
			productContentOptions: {
				...pco,
				descTypography: {
					...(pco.descTypography || {}),
					...updates,
				},
			},
			contentOptions: {
				...co,
				descTypography: {
					...(co.descTypography || {}),
					...updates,
				},
			},
		});
	};

	const setButtonTypography = (updates) => {
		setAttributes({
			productContentOptions: {
				...pco,
				buttonTypography: {
					...(pco.buttonTypography || {}),
					...updates,
				},
			},
		});
	};

	const createProductApplyToAllTypography = (currentTypography) => [
		(updates) => {
			const nextProductContentOptions = { ...pco };
			const nextContentOptions = { ...co };

			if ('title' !== currentTypography) {
				nextProductContentOptions.titleTypography = mergeTypographyUpdate(pco.titleTypography, updates);
				nextContentOptions.titleTypography = mergeTypographyUpdate(co.titleTypography, updates);
			}

			if ('desc' !== currentTypography) {
				nextProductContentOptions.descTypography = mergeTypographyUpdate(pco.descTypography, updates);
				nextContentOptions.descTypography = mergeTypographyUpdate(co.descTypography, updates);
			}

			if ('price' !== currentTypography) {
				nextProductContentOptions.priceTypography = mergeTypographyUpdate(pco.priceTypography, updates);
			}

			if ('button' !== currentTypography) {
				nextProductContentOptions.buttonTypography = mergeTypographyUpdate(
					pco.buttonTypography,
					updates
				);
			}

			setAttributes({
				productContentOptions: nextProductContentOptions,
				contentOptions: nextContentOptions,
				metaOptions: {
					...mo,
					typography: mergeTypographyUpdate(mo.typography, updates),
				},
				taxonomyOptions: {
					...taxonomyOptions,
					typography: mergeTypographyUpdate(taxonomyOptions.typography, updates),
				},
			});
		},
	];

	const titleTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(pco.titleTypography || {}),
	};

	const priceTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(pco.priceTypography || {}),
	};

	const descTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(pco.descTypography || {}),
	};

	const buttonTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(pco.buttonTypography || {}),
	};

	const getTitleMargin = () => ({
		...SPACING_DEFAULT,
		...pco?.titleMargin,
	});
	const getDesMargin = () => ({
		...SPACING_DEFAULT,
		...pco?.desMargin,
		...pco?.descMargin,
	});
	const getPriceMargin = () => ({
		...SPACING_DEFAULT,
		...pco?.priceMargin,
	});

	const createSpacingHandlers = makeCreateSpacingHandlers(set);

	return {
		descLabel: __('Description', 'wp-carousel-free'),
		descSlot: 'excerpt',
		hasPrice: true,

		title: {
			typoAttributes: titleTypoAttributes,
			setTypography: setTitleTypography,
			applyToAll: createProductApplyToAllTypography('title'),
		},
		desc: {
			typoAttributes: descTypoAttributes,
			setTypography: setDescTypography,
			applyToAll: createProductApplyToAllTypography('desc'),
		},
		price: {
			typoAttributes: priceTypoAttributes,
			setTypography: setPriceTypography,
			applyToAll: createProductApplyToAllTypography('price'),
		},
		button: {
			typoAttributes: buttonTypoAttributes,
			setTypography: setButtonTypography,
			applyToAll: createProductApplyToAllTypography('button'),
		},

		titleColorProps: (colorState) =>
			colorState === 'hover'
				? {
						label: __('Title Hover Color', 'wp-carousel-free'),
						attributes: pco.titleHoverColor ?? '',
						attributesKey: 'titleHoverColor',
						setAttributes: set,
				  }
				: {
						label: __('Title Color', 'wp-carousel-free'),
						attributes: pco.titleColor ?? '',
						attributesKey: 'titleColor',
						setAttributes: set,
				  },

		descColorProps: () => ({
			label: __('Description Color', 'wp-carousel-free'),
			attributes: pco.descColor ?? '',
			attributesKey: 'descColor',
			setAttributes: set,
		}),

		priceColorProps: () => ({
			label: __('Price Color', 'wp-carousel-free'),
			attributes: pco.priceColor ?? '',
			attributesKey: 'priceColor',
			setAttributes: set,
		}),

		salePriceColorProps: () => ({
			label: __('Sale Price Color', 'wp-carousel-free'),
			attributes: pco.salePriceColor ?? '',
			attributesKey: 'salePriceColor',
			setAttributes: set,
		}),

		titleMarginProps: {
			attributes: getTitleMargin(),
			attributesKey: 'titleMargin',
			...createSpacingHandlers('titleMargin', getTitleMargin),
		},
		descMarginProps: {
			attributes: getDesMargin(),
			attributesKey: 'descMargin',
			...createSpacingHandlers('descMargin', getDesMargin),
		},
		priceMarginProps: {
			attributes: getPriceMargin(),
			attributesKey: 'priceMargin',
			...createSpacingHandlers('priceMargin', getPriceMargin),
		},
	};
}
