/**
 * Post Meta Panel – date, category, author etc.
 * Shown for: post, product.
 */

import { __ } from '@wordpress/i18n';
import { memo, useState } from '@wordpress/element';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import { PanelBody } from '@wordpress/components';
import {
	SPRangeControl,
	SelectField,
	MultiSelectDndKit,
	TabControls,
	SpColorPicker,
	Typography,
} from '@wp-carousel-pro/components';
import ToggleGroupControl from '@wp-carousel-pro/components/toggleGroupControl/toggleGroupControl';
import { mergeTypographyUpdate } from './cardContent/sourceAccessors/typoMaps';

const metaDataOptions = (withMeta) => {
	if (withMeta) {
		return [
			{ label: __('Date', 'wp-carousel-free'), value: 'date' },
			{ label: __('Author', 'wp-carousel-free'), value: 'author' },
			{ label: __('Category', 'wp-carousel-free'), value: 'category' },
			{ label: __('Tags', 'wp-carousel-free'), value: 'tags' },
			{ label: __('Comment Count', 'wp-carousel-free'), value: 'comments' },
		];
	}
	return [
		{ label: __('Date', 'wp-carousel-free'), value: 'date' },
		{ label: __('Author', 'wp-carousel-free'), value: 'author' },
		{ label: __('Comment Count', 'wp-carousel-free'), value: 'comments' },
	];
};

// Bullet and None are Free; the remaining separators are Pro and stay listed
// last so the picker matches Pro while the Free options come first.
const SEPARATORS = [
	{ label: __('Bullet (•)', 'wp-carousel-free'), value: 'bullet' },
	{ label: __('None', 'wp-carousel-free'), value: 'none' },
	{ label: __('Dash (-)', 'wp-carousel-free'), value: 'dash', pro: true },
	{ label: __('Pipe (|)', 'wp-carousel-free'), value: 'pipe', pro: true },
	{ label: __('Slash (/)', 'wp-carousel-free'), value: 'slash', pro: true },
	{ label: __('Back Slash (\\)', 'wp-carousel-free'), value: 'back-slash', pro: true },
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

function GeneralTab({ attributes, setAttributes }) {
	const mo = attributes.metaOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'metaOptions');

	const getGapValue = () => ({
		...RANGER_DEFAULT,
		...mo.spacing,
	});
	const createRangeHandlers = (key, getter) => ({
		onValueChange: ({ value, deviceType }) =>
			set({
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
			set({
				[key]: {
					...getter(),
					unit: {
						...RANGER_DEFAULT.unit,
						...getter()?.unit,
						[deviceType]: unit,
					},
				},
			}),
	});

	return (
		<>
			{attributes?.sourceType !== 'external' && (
				<>
					<MultiSelectDndKit
						label={__('Meta Items', 'wp-carousel-free')}
						attributes={mo.showMeta ?? ['date', 'author', 'category']}
						attributesKey="showMeta"
						setAttributes={set}
						options={metaDataOptions(attributes?.taxonomyOptions?.position === 'beside-meta')}
						// Reordering Meta Items is Pro; Free can only add/remove items.
						sortable={false}
					/>
					<SelectField
						label={__('Separator', 'wp-carousel-free')}
						attributes={mo.separator ?? 'bullet'}
						attributesKey="separator"
						setAttributes={set}
						items={SEPARATORS}
						flexStyle={false}
					/>
				</>
			)}
			<SPRangeControl
				label={__('Gap Between Meta', 'wp-carousel-free')}
				attributes={getGapValue()}
				attributesKey="spacing"
				setAttributes={() => {}}
				min={0}
				max={200}
				defaultValue={10}
				units={['px', '%', 'em']}
				{...createRangeHandlers('spacing', getGapValue)}
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const mo = attributes.metaOptions || {};
	const pco = attributes.postContentOptions || {};
	const productContentOptions = attributes.productContentOptions || {};
	const co = attributes.contentOptions || {};
	const taxonomyOptions = attributes.taxonomyOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'metaOptions');

	const [colorState, setColorState] = useState('color');

	const setMetaTypography = (updates) => {
		setAttributes({
			metaOptions: {
				...mo,
				typography: {
					...(mo.typography || {}),
					...updates,
				},
			},
		});
	};

	const metaApplyToAllTypography = [
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
				taxonomyOptions: {
					...taxonomyOptions,
					typography: mergeTypographyUpdate(taxonomyOptions.typography, updates),
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

	const metaTypoAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_MAP,
		...(mo.typography || {}),
	};
	const isExternalSource = attributes?.sourceType === 'external';

	return (
		<>
			<Typography
				typographyLabel={__('Meta Typography', 'wp-carousel-free')}
				attributes={metaTypoAttributes}
				setAttributes={setMetaTypography}
				applyToAllTypography={metaApplyToAllTypography}
			/>
			{isExternalSource && (
				<SpColorPicker
					label={__('Meta Color', 'wp-carousel-free')}
					attributes={mo.color ?? ''}
					attributesKey="color"
					setAttributes={set}
				/>
			)}
			{!isExternalSource && (
				<>
					<SpColorPicker
						label={__('Meta Separator Color', 'wp-carousel-free')}
						attributes={mo.separatorColor ?? ''}
						attributesKey="separatorColor"
						setAttributes={set}
					/>
					<ToggleGroupControl
						attributes={colorState}
						attributesKey={'colorState'}
						onClick={(value) => setColorState(value)}
						items={NORMAL_HOVER}
					/>
					{colorState === 'color' && (
						<>
							<SpColorPicker
								label={__('Meta Color', 'wp-carousel-free')}
								attributes={mo.color ?? ''}
								attributesKey="color"
								setAttributes={set}
							/>
						</>
					)}
					{colorState === 'hover' && (
						<>
							<SpColorPicker
								label={__('Meta Color', 'wp-carousel-free')}
								attributes={mo.hoverColor ?? ''}
								attributesKey="hoverColor"
								setAttributes={set}
							/>
						</>
					)}
				</>
			)}
		</>
	);
}

function PostMetaPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody
			title={__('Meta Data', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
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

export default memo(PostMetaPanel);
