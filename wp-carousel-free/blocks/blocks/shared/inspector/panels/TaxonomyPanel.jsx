/**
 * Taxonomy Panel – category/tag display options.
 * Shown for: post, product only.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import {
	Toggle,
	SPRangeControl,
	SelectField,
	TabControls,
	SpColorPicker,
	Typography,
	Border,
	Spacing,
	Divider,
	BoxShadow,
} from '@wp-carousel-pro/components';
import { memo, useState } from '@wordpress/element';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import { useSelect } from '@wordpress/data';
import ToggleGroupControl from '@wp-carousel-pro/components/toggleGroupControl/toggleGroupControl';
import { mergeTypographyUpdate } from './cardContent/sourceAccessors/typoMaps';

const TAXONOMY_TYPES = [
	{ label: __('Category', 'wp-carousel-free'), value: 'category' },
	{ label: __('Tag', 'wp-carousel-free'), value: 'tag' },
	{ label: __('Both', 'wp-carousel-free'), value: 'both', pro: true },
];
const RANGER_DEFAULT = {
	device: {
		Desktop: '',
		Tablet: '',
		Mobile: '',
	},
	unit: {
		Desktop: 'px',
		Tablet: 'px',
		Mobile: 'px',
	},
};
const SPACING_DEFAULT = {
	device: {
		Desktop: {
			top: '',
			right: '',
			bottom: '',
			left: '',
		},
		Tablet: {
			top: '',
			right: '',
			bottom: '',
			left: '',
		},
		Mobile: {
			top: '',
			right: '',
			bottom: '',
			left: '',
		},
	},
	unit: {
		Desktop: 'px',
		Tablet: 'px',
		Mobile: 'px',
	},
	allChange: true,
};

const POSITIONS = [
	{ label: __('Default', 'wp-carousel-free'), value: '' },
	{ label: __('Beside Other Meta', 'wp-carousel-free'), value: 'beside-meta' },
	// Over The Thumb is Pro — kept last so Free options list first.
	{ label: __('Over The Thumb', 'wp-carousel-free'), value: 'over-thumb', pro: true },
];

const NORMAL_HOVER = [
	{ label: __('Normal', 'wp-carousel-free'), value: 'color' },
	{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
];

const TYPO_KEY_MAP = {
	familyKey: 'family',
	fontSizeKey: 'fontSize',
	lineHeightKey: 'lineHeight',
	fontSpacingKey: 'fontSpacing',
	wordSpacingKey: 'wordSpacing',
};
const TYPO_MAP = {
	family: '',
	fontSize: {
		device: {
			Desktop: '',
		},
		unit: {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
		},
	},
	lineHeight: {
		device: {
			Desktop: '',
		},
		unit: {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
		},
	},
	fontSpacing: {
		device: {
			Desktop: '',
		},
		unit: {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
		},
	},
	wordSpacing: {
		device: {
			Desktop: '',
		},
		unit: {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
		},
	},
};
const BORDER_DEFAULT = {
	style: 'none',
	color: '#ddd',
	hoverColor: '#ddd',
};

const normalizeBoxShadow = (val = {}) => ({
	selectDefault: val.selectDefault ?? 'custom',
	color: val.color ?? '#DDD',
	unit: val.unit ?? 'outset',
	value: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		...val.value,
	},
});

function GeneralTab({ attributes, setAttributes }) {
	const taxonomyOptions = attributes.taxonomyOptions || {};
	const setTaxonomyOptions = useOptionSetter(attributes, setAttributes, 'taxonomyOptions');

	const getTaxGap = () => ({
		...RANGER_DEFAULT,
		...taxonomyOptions?.taxGap,
	});
	/**
	 * Builds responsive handlers for range controls that store per-device values.
	 *
	 * @param {string}   key    - Target option key
	 * @param {Function} getter - Getter returning the current option object
	 * @return {Object} Range callbacks
	 */
	const createRangeHandlers = (key, getter) => ({
		onValueChange: ({ value, deviceType }) =>
			setTaxonomyOptions({
				[key]: {
					...getter(),
					device: {
						...RANGER_DEFAULT.device,
						...getter()?.device,
						[deviceType]: value,
					},
				},
			}),

		onUnitChange: ({ unit, deviceType }) =>
			setTaxonomyOptions({
				[key]: {
					...getter(),
					unit: {
						...RANGER_DEFAULT.unit,
						...getter()?.unit,
						[deviceType]: unit,
					},
				},
			}),
		onReset: ({ value, unit, deviceType }) =>
			setTaxonomyOptions({
				[key]: {
					...getter(),
					device: { ...getter()?.device, [deviceType]: value },
					unit: { ...getter()?.unit, [deviceType]: unit },
				},
			}),
	});

	// Get Taxonomy types based on source type.
	const productTaxonomies = useSelect(
		(select) => {
			if (attributes?.sourceType !== 'product') {
				return [];
			}
			return select('core').getTaxonomies({ type: 'product' });
		},
		[attributes?.sourceType]
	);
	const productTaxonomyOptions =
		productTaxonomies?.length > 0
			? productTaxonomies.map((taxonomy) => ({ label: taxonomy.name, value: taxonomy.slug }))
			: [];
	const taxonomyTypeOptions =
		attributes?.sourceType === 'product' ? productTaxonomyOptions : TAXONOMY_TYPES;
	const defaultSelectedType = attributes?.sourceType === 'product' ? 'product_cat' : 'category';
	const isProductSource = attributes?.sourceType === 'product';
	// Product source has no meta row, so "beside-meta" does not apply.
	const updatePosition = POSITIONS.filter((position) => {
		if (isProductSource && position.value === 'beside-meta') {
			return false;
		}

		return true;
	});

	const metaDataAttr = attributes?.metaOptions || {};

	// Meta Items key each taxonomy type occupies in the meta row. Product
	// taxonomies have no meta row, so they map to nothing.
	const TAXONOMY_META_KEYS = { category: 'category', tag: 'tags' };
	const TAXONOMY_META_VALUES = Object.values(TAXONOMY_META_KEYS);

	// Add or drop the taxonomy's Meta Items key without disturbing the author's
	// other meta items, so the editor matches the markup the PHP renderer builds.
	const syncShowMeta = (position, type) => {
		const current = Array.isArray(metaDataAttr.showMeta)
			? metaDataAttr.showMeta
			: ['date', 'author', 'category'];
		const withoutTaxonomy = current.filter((item) => !TAXONOMY_META_VALUES.includes(item));
		const metaKey = TAXONOMY_META_KEYS[type || defaultSelectedType];
		return 'beside-meta' === position && metaKey ? [...withoutTaxonomy, metaKey] : withoutTaxonomy;
	};

	const updateTaxonomyPositionOption = ({ position }) => {
		setAttributes({
			taxonomyOptions: {
				...taxonomyOptions,
				position,
			},
			metaOptions: {
				...metaDataAttr,
				showMeta: syncShowMeta(position, taxonomyOptions?.type),
			},
		});
	};

	// Switching type while beside the meta row swaps which key sits there.
	const updateTaxonomyTypeOption = ({ type }) => {
		setAttributes({
			taxonomyOptions: {
				...taxonomyOptions,
				type,
			},
			metaOptions: {
				...metaDataAttr,
				showMeta: syncShowMeta(taxonomyOptions?.position ?? '', type),
			},
		});
	};

	return (
		<>
			<SelectField
				label={__('Taxonomy Type', 'wp-carousel-free')}
				attributes={taxonomyOptions.type || defaultSelectedType}
				attributesKey="type"
				setAttributes={updateTaxonomyTypeOption}
				items={taxonomyTypeOptions}
				flexStyle={false}
			/>
			<SelectField
				label={__('Display Position', 'wp-carousel-free')}
				attributes={taxonomyOptions.position ?? ''}
				attributesKey="position"
				setAttributes={updateTaxonomyPositionOption}
				items={updatePosition}
				flexStyle={false}
			/>
			<SPRangeControl
				label={__('Gap Between Items', 'wp-carousel-free')}
				attributes={getTaxGap()}
				attributesKey="taxGap"
				setAttributes={() => {}}
				min={0}
				max={200}
				defaultValue={{ unit: 'px', value: 8 }}
				units={['px', '%', 'em']}
				{...createRangeHandlers('taxGap', getTaxGap)}
			/>
			<Toggle
				label={__('Link to Taxonomy Archive', 'wp-carousel-free')}
				attributes={taxonomyOptions.linkToArchive ?? true}
				attributesKey="linkToArchive"
				setAttributes={setTaxonomyOptions}
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const taxonomyOptions = attributes.taxonomyOptions || {};
	const pco = attributes.postContentOptions || {};
	const productContentOptions = attributes.productContentOptions || {};
	const co = attributes.contentOptions || {};
	const mo = attributes.metaOptions || {};
	const setTaxonomyOptions = useOptionSetter(attributes, setAttributes, 'taxonomyOptions');
	const [colorState, setColorState] = useState('color');

	const setTypography = (updates) => {
		setAttributes({
			taxonomyOptions: {
				...taxonomyOptions,
				typography: {
					...(taxonomyOptions.typography || {}),
					...updates,
				},
			},
		});
	};

	const taxonomyApplyToAllTypography = [
		(updates) => {
			if (!['post', 'product'].includes(attributes?.sourceType)) {
				return;
			}

			const nextAttributes = {
				contentOptions: {
					...co,
					titleTypography: mergeTypographyUpdate(co.titleTypography, updates),
					descTypography: mergeTypographyUpdate(co.descTypography, updates),
				},
				metaOptions: {
					...mo,
					typography: mergeTypographyUpdate(mo.typography, updates),
				},
			};

			if ('product' === attributes?.sourceType) {
				nextAttributes.productContentOptions = {
					...productContentOptions,
					titleTypography: mergeTypographyUpdate(productContentOptions.titleTypography, updates),
					descTypography: mergeTypographyUpdate(productContentOptions.descTypography, updates),
					priceTypography: mergeTypographyUpdate(productContentOptions.priceTypography, updates),
					buttonTypography: mergeTypographyUpdate(productContentOptions.buttonTypography, updates),
				};
			} else {
				nextAttributes.postContentOptions = {
					...pco,
					titleTypography: mergeTypographyUpdate(pco.titleTypography, updates),
					excerptTypography: mergeTypographyUpdate(pco.excerptTypography, updates),
					buttonTypography: mergeTypographyUpdate(pco.buttonTypography, updates),
				};
			}

			setAttributes(nextAttributes);
		},
	];

	const typoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(taxonomyOptions.typography || {}),
	};

	// Omitted `enabled` means on, mirroring isSlotVisible() and
	// SlotRenderer::render_slot_taxonomy — only an explicit `false` hides it.
	if (false === taxonomyOptions.enabled) {
		return (
			<p style={{ color: '#757575', fontSize: '12px' }}>
				{__('Enable taxonomy to access style options.', 'wp-carousel-free')}
			</p>
		);
	}

	const getCateBorder = () => ({
		...BORDER_DEFAULT,
		...taxonomyOptions?.cateBorder,
	});
	const getCateBorderWidth = () => ({
		...SPACING_DEFAULT,
		...taxonomyOptions?.cateBorderWidth,
	});
	const getBorderRadius = () => ({
		...SPACING_DEFAULT,
		...taxonomyOptions?.borderRadius,
	});
	const getPadding = () => ({
		...SPACING_DEFAULT,
		...taxonomyOptions?.padding,
	});

	/**
	 * Builds spacing handlers for controls that store responsive spacing data.
	 *
	 * @param {string}   key    - Target option key
	 * @param {Function} getter - Getter returning the current spacing object
	 * @return {Object} Spacing callbacks
	 */
	const createSpacingHandlers = (key, getter) => ({
		onChange: (value) => setTaxonomyOptions({ [key]: value }),

		onUnitChange: ({ unit, deviceType }) =>
			setTaxonomyOptions({
				[key]: {
					...getter(),
					unit: {
						...SPACING_DEFAULT?.unit,
						...getter()?.unit,
						[deviceType]: unit,
					},
				},
			}),

		updateAllChange: (value) =>
			setTaxonomyOptions({
				[key]: {
					...getter(),
					allChange: value,
				},
			}),
	});

	return (
		<>
			<Typography
				typographyLabel={__('Typography', 'wp-carousel-free')}
				attributes={typoAttributes}
				setAttributes={setTypography}
				applyToAllTypography={taxonomyApplyToAllTypography}
			/>

			<ToggleGroupControl
				attributes={colorState}
				onClick={(value) => setColorState(value)}
				items={NORMAL_HOVER}
			/>
			{colorState === 'color' && (
				<>
					<SpColorPicker
						label={__('Text Color', 'wp-carousel-free')}
						attributes={taxonomyOptions.textColor ?? ''}
						attributesKey="textColor"
						setAttributes={setTaxonomyOptions}
					/>
					<SpColorPicker
						label={__('Background Color', 'wp-carousel-free')}
						attributes={taxonomyOptions.backgroundColor ?? ''}
						attributesKey="backgroundColor"
						setAttributes={setTaxonomyOptions}
					/>
					<Toggle
						label={__('Box Shadow', 'wp-carousel-free')}
						attributes={taxonomyOptions?.boxShadowEnable || false}
						attributesKey="boxShadowEnable"
						onChange={() =>
							setAttributes({
								taxonomyOptions: {
									...taxonomyOptions,
									boxShadowEnable: !taxonomyOptions?.boxShadowEnable,
								},
							})
						}
					/>
					{taxonomyOptions?.boxShadowEnable && (
						<BoxShadow
							hideEnableToggle
							attributes={taxonomyOptions?.boxShadow || {}}
							attributesKey={'boxShadow'}
							setAttributes={() => {}}
							onChange={(key, updateValue) => {
								setAttributes({
									taxonomyOptions: {
										...taxonomyOptions,
										[key]: normalizeBoxShadow(updateValue),
									},
								});
							}}
							shadowColorBtn={false}
						/>
					)}
				</>
			)}
			{colorState === 'hover' && (
				<>
					<SpColorPicker
						label={__('Text Hover Color', 'wp-carousel-free')}
						attributes={taxonomyOptions.textHoverColor ?? ''}
						attributesKey="textHoverColor"
						setAttributes={setTaxonomyOptions}
					/>
					<SpColorPicker
						label={__('Background Hover Color', 'wp-carousel-free')}
						attributes={taxonomyOptions.backgroundHoverColor ?? ''}
						attributesKey="backgroundHoverColor"
						setAttributes={setTaxonomyOptions}
					/>
					<Toggle
						label={__('Box Shadow', 'wp-carousel-free')}
						attributes={taxonomyOptions?.shadowEnableHover || false}
						attributesKey="shadowEnableHover"
						onChange={() =>
							setAttributes({
								taxonomyOptions: {
									...taxonomyOptions,
									shadowEnableHover: !taxonomyOptions?.shadowEnableHover,
								},
							})
						}
					/>
					{taxonomyOptions?.shadowEnableHover && (
						<BoxShadow
							hideEnableToggle
							attributes={taxonomyOptions?.boxShadowHover || {}}
							attributesKey={'boxShadowHover'}
							setAttributes={() => {}}
							onChange={(key, updateValue) => {
								setAttributes({
									taxonomyOptions: {
										...taxonomyOptions,
										[key]: normalizeBoxShadow(updateValue),
									},
								});
							}}
							shadowColorBtn={false}
						/>
					)}
				</>
			)}
			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{
					border: {
						style: getCateBorder().style ?? 'solid',
						color:
							colorState === 'hover' ? getCateBorder().hoverColor ?? '' : getCateBorder().color ?? '',
					},
					borderWidth: getCateBorderWidth(),
				}}
				attributesKey={{ border: 'cateBorder', borderWidth: 'cateBorderWidth' }}
				setAttributes={() => {}}
				parentState={colorState === 'hover' ? 'hover' : 'normal'}
				onStateUpdate={(key, updateValue) => {
					if (key === 'cateBorder') {
						const nextBorder = { ...getCateBorder() };
						nextBorder.style = updateValue.style;
						if (colorState === 'hover') {
							nextBorder.hoverColor = updateValue.color;
						} else {
							nextBorder.color = updateValue.color;
						}
						setTaxonomyOptions({ cateBorder: nextBorder });
					} else if (key === 'cateBorderWidth') {
						setTaxonomyOptions({ cateBorderWidth: updateValue });
					}
				}}
			/>
			<Divider position="sp-w-100pct" />

			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={getBorderRadius()}
				attributesKey="borderRadius"
				{...createSpacingHandlers('borderRadius', getBorderRadius)}
			/>
			<Spacing
				label={__('Padding', 'wp-carousel-free')}
				attributes={getPadding()}
				attributesKey="padding"
				{...createSpacingHandlers('padding', getPadding)}
			/>
		</>
	);
}

function TaxonomyPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody title={__('Taxonomy', 'wp-carousel-free')} opened={panelOpen} onToggle={onPanelToggle}>
			<TabControls
				attributes={attributes}
				setAttributes={setAttributes}
				GeneralTab={GeneralTab}
				StyleTab={StyleTab}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</PanelBody>
	);
}

export default memo(TaxonomyPanel);
