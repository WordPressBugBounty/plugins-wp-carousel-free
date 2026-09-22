/**
 * Ajax Pagination Panel (Tiles only).
 *
 * Surfaces only when the block is `wp-carousel-pro/tiles`,
 * `layoutOptions.pagination === true`, AND `sourceType ∈ {post, product, image, video}`.
 * Post/product paginate at the WP_Query layer (page size = `queryOptions.limit`).
 * Image/video sources have no underlying query; they paginate the saved
 * `attributes.items` array client-server in PHP using a dedicated page-size key
 * (`paginationOptions.imageItemsPerPage`). Settings tab covers per-mode controls
 * (plus the manual-items Items per page control for image/video); Style tab covers state-bound
 * color/background/border-color/box-shadow with shared border-style/width, plus
 * button padding and wrapper margin.
 *
 * Attribute home: `attributes.paginationOptions` (declared in TilesSchema.php).
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo, useState } from '@wordpress/element';
import {
	SPRangeControl,
	SPToggleGroupControl,
	Spacing,
	SpColorPicker,
	Border,
	BoxShadow,
	Toggle,
	Typography,
	Divider,
	TabControls,
	SelectField,
	InputControl,
	InfoIcon,
	SpProNotice,
} from '@wp-carousel-pro/components';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from '@wp-carousel-pro/icons/icons';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import { PRO_AJAX_PAGINATION } from '../../constants/proFeatures';

const TILES_BLOCK = 'wp-carousel-pro/tiles';

const PAGINATION_TYPES = [
	{ label: __('Number', 'wp-carousel-free'), value: 'number' },
	{ label: __('Load More', 'wp-carousel-free'), value: 'loadMore', pro: true },
];

const DISPLAY_STYLES = [
	{ label: __('Number', 'wp-carousel-free'), value: 'number' },
	{ label: __('Number + Next/Previous', 'wp-carousel-free'), value: 'number-prev-next', pro: true },
];

const JUSTIFY_ITEMS = [
	{ label: <AlignLeftIcon />, value: 'flex-start' },
	{ label: <AlignCenterIcon />, value: 'center' },
	{ label: <AlignRightIcon />, value: 'flex-end' },
];

const GAP_DEFAULT = {
	device: { Desktop: 10, Tablet: 10, Mobile: 10 },
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
};

const TYPO_KEY_MAP = {
	familyKey: 'family',
	fontSizeKey: 'fontSize',
	lineHeightKey: 'lineHeight',
	fontSpacingKey: 'fontSpacing',
	wordSpacingKey: 'wordSpacing',
};

const TYPO_DEFAULT = {
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

function createSpacingDefaults(initial = 0) {
	return {
		allChange: true,
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		device: {
			Desktop: { top: initial, right: initial, bottom: initial, left: initial },
		},
	};
}

function normalizeSpacing(value, fallback = 0) {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	const initial = Number.isFinite(Number(value)) ? Number(value) : fallback;
	return createSpacingDefaults(initial);
}

function normalizeResponsive(value, defaults) {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	return defaults;
}

function SettingsTab({ attributes, setAttributes }) {
	const options = attributes.paginationOptions || {};
	const updateOption = useOptionSetter(attributes, setAttributes, 'paginationOptions');

	const gap = normalizeResponsive(options.gap, GAP_DEFAULT);
	const sourceType = attributes.sourceType;
	const imageItemsPerPage = Number.isFinite(Number(options.imageItemsPerPage))
		? Math.max(1, Math.floor(Number(options.imageItemsPerPage)))
		: 10;

	return (
		<>
			{(sourceType === 'image' || sourceType === 'video') && (
				<InputControl
					label={
						<>
							<span>{__('Items per page', 'wp-carousel-free')}</span>
							<InfoIcon
								tooltip={__(
									'Number of items shown per page. Total pages is computed from the item count divided by this value.',
									'wp-carousel-free'
								)}
							/>
						</>
					}
					attributes={imageItemsPerPage}
					attributesKey="imageItemsPerPage"
					setAttributes={(updates) =>
						updateOption({
							imageItemsPerPage: Math.max(1, Number(updates.imageItemsPerPage) || 1),
						})
					}
					min={1}
					max={100}
					step={1}
					responsive={false}
				/>
			)}

			<SPToggleGroupControl
				label={__('Pagination Type', 'wp-carousel-free')}
				attributes={options.type ?? 'number'}
				items={PAGINATION_TYPES}
				onClick={(value) => updateOption({ type: value })}
			/>

			<SelectField
				label={__('Display Style', 'wp-carousel-free')}
				attributes={options.numberDisplayStyle ?? 'number'}
				attributesKey="numberDisplayStyle"
				setAttributes={updateOption}
				items={DISPLAY_STYLES}
			/>

			<Toggle
				label={__('Show Ellipsis', 'wp-carousel-free')}
				attributes={options.showEllipsis ?? true}
				attributesKey="showEllipsis"
				setAttributes={updateOption}
			/>

			<SPToggleGroupControl
				label={__('Justify content', 'wp-carousel-free')}
				attributes={options.justifyContent ?? 'center'}
				items={JUSTIFY_ITEMS}
				onClick={(value) => updateOption({ justifyContent: value })}
			/>

			<SPRangeControl
				label={__('Gap Between Items', 'wp-carousel-free')}
				attributes={gap}
				attributesKey="gap"
				setAttributes={() => {}}
				onValueChange={({ value, deviceType }) =>
					updateOption({
						gap: { ...gap, device: { ...gap.device, [deviceType]: value } },
					})
				}
				onUnitChange={({ unit, deviceType }) =>
					updateOption({
						gap: { ...gap, unit: { ...gap.unit, [deviceType]: unit } },
					})
				}
				onReset={({ value, unit, deviceType }) =>
					updateOption({
						gap: {
							...gap,
							device: { ...gap.device, [deviceType]: value },
							unit: { ...gap.unit, [deviceType]: unit },
						},
					})
				}
				min={0}
				max={50}
				units={['px', 'em', 'rem']}
				defaultValue={GAP_DEFAULT}
			/>

			<Toggle
				label={__('Scroll to Top', 'wp-carousel-free')}
				attributes={options.scrollToTop ?? false}
				attributesKey="scrollToTop"
				setAttributes={updateOption}
			/>
			{options.scrollToTop && (
				<SPRangeControl
					label={__('Scroll Offset', 'wp-carousel-free')}
					attributes={{ unit: options.scrollOffsetUnit ?? 'px', value: options.scrollOffset ?? 0 }}
					attributesKey="scrollOffset"
					setAttributes={() => {}}
					onValueChange={({ value }) =>
						updateOption({ scrollOffset: Number.isFinite(Number(value)) ? Number(value) : 0 })
					}
					onUnitChange={({ unit }) => updateOption({ scrollOffsetUnit: unit })}
					onReset={({ value, unit }) =>
						updateOption({
							scrollOffset: Number.isFinite(Number(value)) ? Number(value) : 0,
							scrollOffsetUnit: unit,
						})
					}
					min={0}
					max={400}
					units={['px']}
					defaultValue={{ unit: 'px', value: 0 }}
				/>
			)}

			<SpProNotice
				className="is-upsell"
				message={PRO_AJAX_PAGINATION.message}
				linkText={PRO_AJAX_PAGINATION.linkText}
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const options = attributes.paginationOptions || {};
	const updateOption = useOptionSetter(attributes, setAttributes, 'paginationOptions');
	const [stateTab, setStateTab] = useState('normal');

	const hoverLabel = __('Active & Hover', 'wp-carousel-free');

	const borderRadius = normalizeSpacing(options.borderRadius, 3);
	const borderWidth = options.borderWidth || {
		allChange: true,
		unit: 'px',
		value: { top: 1, right: 1, bottom: 1, left: 1 },
	};
	const padding = normalizeSpacing(options.padding, 15);
	const margin = normalizeSpacing(options.margin, 0);
	const borderForControl = {
		style: options.borderStyle ?? 'solid',
		color: stateTab === 'hover' ? options.borderColorHover ?? '' : options.borderColor ?? '',
		hoverColor: options.borderColorHover ?? '',
	};

	const boxShadow = stateTab === 'hover' ? options.boxShadowHover : options.boxShadow;
	const boxShadowKey = stateTab === 'hover' ? 'boxShadowHover' : 'boxShadow';
	const boxShadowEnable =
		stateTab === 'hover' ? !!options.boxShadowHoverEnable : !!options.boxShadowEnable;
	const boxShadowEnableKey = stateTab === 'hover' ? 'boxShadowHoverEnable' : 'boxShadowEnable';
	const typographyAttributes = {
		...TYPO_KEY_MAP,
		...TYPO_DEFAULT,
		...(options.typography || {}),
	};

	return (
		<>
			<Typography
				typographyLabel={__('Typography', 'wp-carousel-free')}
				attributes={typographyAttributes}
				setAttributes={(updates) =>
					updateOption({ typography: { ...(options.typography || {}), ...updates } })
				}
			/>

			<SPToggleGroupControl
				attributes={stateTab}
				items={[
					{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
					{ label: hoverLabel, value: 'hover' },
				]}
				onClick={(value) => setStateTab(value)}
			/>

			{stateTab === 'normal' && (
				<>
					<SpColorPicker
						label={__('Color', 'wp-carousel-free')}
						attributes={options.color ?? ''}
						attributesKey="color"
						setAttributes={updateOption}
					/>
					<SpColorPicker
						label={__('Background Color', 'wp-carousel-free')}
						attributes={options.backgroundColor ?? ''}
						attributesKey="backgroundColor"
						setAttributes={updateOption}
					/>
				</>
			)}
			{stateTab === 'hover' && (
				<>
					<SpColorPicker
						label={__('Color', 'wp-carousel-free')}
						attributes={options.colorHover ?? ''}
						attributesKey="colorHover"
						setAttributes={updateOption}
					/>
					<SpColorPicker
						label={__('Background Color', 'wp-carousel-free')}
						attributes={options.backgroundColorHover ?? ''}
						attributesKey="backgroundColorHover"
						setAttributes={updateOption}
					/>
				</>
			)}

			<Divider />

			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{ border: borderForControl, borderWidth }}
				attributesKey={{ border: 'paginationBorder', borderWidth: 'borderWidth' }}
				setAttributes={() => {}}
				parentState={stateTab === 'hover' ? 'hover' : 'normal'}
				units={['px']}
				defaultValue={{
					unit: 'px',
					value: { top: 1, right: 1, bottom: 1, left: 1 },
				}}
				onStateUpdate={(key, updateValue) => {
					if (key === 'paginationBorder') {
						updateOption({
							borderStyle: updateValue.style ?? options.borderStyle ?? 'solid',
							...(stateTab === 'hover'
								? { borderColorHover: updateValue.color ?? options.borderColorHover ?? '' }
								: { borderColor: updateValue.color ?? options.borderColor ?? '' }),
						});
					} else if (key === 'borderWidth') {
						updateOption({ borderWidth: updateValue });
					}
				}}
			/>

			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={borderRadius}
				attributesKey="borderRadius"
				setAttributes={updateOption}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 3, right: 3, bottom: 3, left: 3 },
					device: createSpacingDefaults(3).device,
				}}
				indicator="radius"
			/>

			<Toggle
				label={__('Box Shadow', 'wp-carousel-free')}
				attributes={boxShadowEnable}
				attributesKey={boxShadowEnableKey}
				setAttributes={updateOption}
			/>
			{boxShadowEnable && (
				<BoxShadow
					hideEnableToggle
					attributes={boxShadow || {}}
					attributesKey={boxShadowKey}
					setAttributes={updateOption}
					defaultColor="#4E4F521A"
				/>
			)}

			<Divider />

			<Spacing
				label={__('Padding', 'wp-carousel-free')}
				attributes={padding}
				attributesKey="padding"
				setAttributes={updateOption}
				units={['px']}
				defaultValue={{
					unit: 'px',
					value: { top: 15, right: 0, bottom: 15, left: 0 },
					device: createSpacingDefaults(15).device,
				}}
			/>

			<Spacing
				label={__('Margin', 'wp-carousel-free')}
				attributes={margin}
				attributesKey="margin"
				setAttributes={updateOption}
				units={['px']}
				defaultValue={{
					unit: 'px',
					value: { top: 48, right: 0, bottom: 0, left: 0 },
					device: createSpacingDefaults(0).device,
				}}
			/>
		</>
	);
}

function AjaxPaginationPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	const isTilesBlock = attributes.blockName === 'tiles';
	const paginationEnabled = attributes.layoutOptions?.pagination === true;
	const sourceType = attributes.sourceType;
	const sourceSupportsAjax =
		sourceType === 'post' ||
		sourceType === 'product' ||
		sourceType === 'image' ||
		sourceType === 'video';

	if (!isTilesBlock || !paginationEnabled || !sourceSupportsAjax) {
		return null;
	}

	return (
		<PanelBody
			title={__('Ajax Pagination', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
			<TabControls
				attributes={attributes}
				setAttributes={setAttributes}
				GeneralTab={SettingsTab}
				StyleTab={StyleTab}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</PanelBody>
	);
}

export { TILES_BLOCK };
export default memo(AjaxPaginationPanel);
