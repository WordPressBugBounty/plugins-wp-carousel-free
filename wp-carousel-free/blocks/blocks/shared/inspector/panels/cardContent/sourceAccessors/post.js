/**
 * Style-tab routing accessor for the post family (post / external / video).
 *
 * Lifted verbatim from the former `PostContentPanel` Style tab. Typography is a
 * DUAL-WRITE: the canonical `contentOptions.{titleTypography,descTypography}`
 * (the only place the typography CSS reads) is mirrored alongside the
 * `postContentOptions` source container. Title color is likewise mirrored into
 * `contentOptions.titleColor` and excerpt color into `contentOptions.descColor`.
 * Apply-to-all additionally fans typography into `metaOptions`/`taxonomyOptions`.
 *
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Gutenberg setter.
 * @return {Object} Uniform Style-tab accessor bundle.
 */
import { __ } from '@wordpress/i18n';
import { TYPO_KEY_MAP, TYPO_MAP, mergeTypographyUpdate } from './typoMaps';

const TITLE_MARGIN_DEFAULT = {
	allChange: true,
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
	device: {
		Desktop: { top: 8, right: 0, bottom: 10, left: 0 },
		Tablet: { top: 0, right: 0, bottom: 10, left: 0 },
		Mobile: { top: 0, right: 0, bottom: 10, left: 0 },
	},
};

export function createPostAccessor(attributes, setAttributes) {
	const pco = attributes.postContentOptions || {};
	const co = attributes.contentOptions || {};
	const mo = attributes.metaOptions || {};
	const taxonomyOptions = attributes.taxonomyOptions || {};
	// Video shares the post-family attribute containers, but its Content Area
	// slot is `description` (post/external use `excerpt`) — the slot id and
	// labels must follow the source or the Style rows never show for video.
	const isVideoSource = 'video' === attributes?.sourceType;

	const set = (updates) =>
		setAttributes({
			postContentOptions: { ...pco, ...updates },
			contentOptions: {
				...co,
				...(Object.prototype.hasOwnProperty.call(updates, 'titleColor')
					? { titleColor: updates.titleColor }
					: {}),
				...(Object.prototype.hasOwnProperty.call(updates, 'excerptColor')
					? { descColor: updates.excerptColor }
					: {}),
			},
		});

	const setTitleTypography = (updates) => {
		setAttributes({
			postContentOptions: {
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

	const setExcerptTypography = (updates) => {
		setAttributes({
			postContentOptions: {
				...pco,
				excerptTypography: {
					...(pco.excerptTypography || {}),
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
			postContentOptions: {
				...pco,
				buttonTypography: {
					...(pco.buttonTypography || {}),
					...updates,
				},
			},
		});
	};

	const createPostApplyToAllTypography = (currentTypography) => [
		(updates) => {
			const nextPostContentOptions = { ...pco };
			const nextContentOptions = { ...co };
			const nextAttributes = {};

			if ('title' !== currentTypography) {
				nextPostContentOptions.titleTypography = mergeTypographyUpdate(pco.titleTypography, updates);
				nextContentOptions.titleTypography = mergeTypographyUpdate(co.titleTypography, updates);
			}

			if ('excerpt' !== currentTypography) {
				nextPostContentOptions.excerptTypography = mergeTypographyUpdate(
					pco.excerptTypography,
					updates
				);
				nextContentOptions.descTypography = mergeTypographyUpdate(co.descTypography, updates);
			}

			if ('button' !== currentTypography) {
				nextPostContentOptions.buttonTypography = mergeTypographyUpdate(pco.buttonTypography, updates);
			}

			nextAttributes.postContentOptions = nextPostContentOptions;
			nextAttributes.contentOptions = nextContentOptions;
			nextAttributes.metaOptions = {
				...mo,
				typography: mergeTypographyUpdate(mo.typography, updates),
			};
			nextAttributes.taxonomyOptions = {
				...taxonomyOptions,
				typography: mergeTypographyUpdate(taxonomyOptions.typography, updates),
			};

			setAttributes(nextAttributes);
		},
	];

	const titleTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(pco.titleTypography || {}),
	};

	const excerptTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(pco.excerptTypography || {}),
	};

	const buttonTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(pco.buttonTypography || {}),
	};

	return {
		descLabel: isVideoSource
			? __('Description', 'wp-carousel-free')
			: __('Excerpt', 'wp-carousel-free'),
		descSlot: isVideoSource ? 'description' : 'excerpt',
		hasPrice: false,

		title: {
			typoAttributes: titleTypoAttributes,
			setTypography: setTitleTypography,
			applyToAll: createPostApplyToAllTypography('title'),
		},
		desc: {
			typoAttributes: excerptTypoAttributes,
			setTypography: setExcerptTypography,
			applyToAll: createPostApplyToAllTypography('excerpt'),
		},
		price: null,
		button: {
			typoAttributes: buttonTypoAttributes,
			setTypography: setButtonTypography,
			applyToAll: createPostApplyToAllTypography('button'),
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
			label: isVideoSource
				? __('Description Color', 'wp-carousel-free')
				: __('Excerpt Color', 'wp-carousel-free'),
			attributes: pco.excerptColor ?? '',
			attributesKey: 'excerptColor',
			setAttributes: set,
		}),

		titleMarginProps: {
			attributes: pco.titleMargin || TITLE_MARGIN_DEFAULT,
			attributesKey: 'titleMargin',
			setAttributes: set,
		},
		descMarginProps: {
			attributes: pco.excerptMargin || TITLE_MARGIN_DEFAULT,
			attributesKey: 'excerptMargin',
			setAttributes: set,
		},
	};
}
