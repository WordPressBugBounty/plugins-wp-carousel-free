/**
 * Image Panel – image display settings (General + Style tabs).
 * Shown for: image, post, product (not video — video uses the Video panel).
 * Lazy Loading is Free. Preloader, watermark and right-click protection are
 * Pro: those rows stay visible as locked toggles and write nothing.
 * Aspect ratio: shown unless structurally inapplicable (Tiles bento/bin-pack,
 * Variable Width forcing original). On Slider the control is
 * stage-level (`.wpcp-swiper`), not a per-item media box. Custom is Pro — the
 * option renders disabled; `AllowedValues::image_aspect_ratio()` rejects a
 * saved `custom` value on read.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody, Button } from '@wordpress/components';
import { memo, useState, useRef } from '@wordpress/element';
import {
	Toggle,
	SelectField,
	TabControls,
	Background,
	Border,
	SPToggleGroupControl,
	Divider,
	Spacing,
	InputControl,
	SPRangeControl,
	SpProNotice,
	getPricingUrl,
} from '@wp-carousel-pro/components';
import { BorderIcon } from '@wp-carousel-pro/icons/icons';
import { PRO_IMAGE_SIZE_PROTECTION, PRO_IMAGE_POST_PRODUCT } from '../../constants/proFeatures';
import ComponentsTopSection from '@wp-carousel-pro/components/componentsTopControl/ComponentsTopSection';
import { Units } from '@wp-carousel-pro/components/utility';
import Responsive from '@wp-carousel-pro/components/responsive/responsive';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import {
	isAspectRatioControlVisible,
	isVariableWidthImageSizing,
} from '../../utils/variableWidthImageSizing';
import { ASPECT_RATIOS } from '../../constants/aspectRatios';

// Custom is Pro — its dimension controls are locked below, so the option
// itself is disabled rather than left free to select with nothing to size it.
const IMAGE_ASPECT_RATIO_ITEMS = ASPECT_RATIOS.map((item) =>
	'custom' === item.value ? { ...item, pro: true } : item
);

/**
 * Reset-safe setter for image options, including audio source nested branch.
 *
 * @param {Object}   attributes
 * @param {Function} setAttributes
 * @return {{ imageOptions: Object, set: Function }} Current slice and reset-safe setter.
 */
function useImageOptionsSetter(attributes, setAttributes) {
	const attributesRef = useRef(attributes);
	attributesRef.current = attributes;
	const setImageOptions = useOptionSetter(attributes, setAttributes, 'imageOptions');
	const imageOptions = attributes.imageOptions || {};
	const set = setImageOptions;

	return { imageOptions, set };
}

const RESOLUTIONS = [
	{ label: __('Full Size', 'wp-carousel-free'), value: 'full' },
	{ label: __('Large', 'wp-carousel-free'), value: 'large' },
	{ label: __('Medium Large', 'wp-carousel-free'), value: 'medium_large' },
	{ label: __('Medium', 'wp-carousel-free'), value: 'medium' },
	{ label: __('Thumbnail', 'wp-carousel-free'), value: 'thumbnail' },
];

const DEFAULT_IMAGE_BORDER = { style: 'none', color: '#cccccc' };
const DEFAULT_IMAGE_BORDER_WIDTH = {
	allChange: true,
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
	value: { top: 0, right: 0, bottom: 0, left: 0 },
};
const DEFAULT_SPACING_VALUE = { top: 0, right: 0, bottom: 0, left: 0 };

function createSpacingDefaults(initial = 0) {
	return {
		allChange: true,
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		device: {
			Desktop: { top: initial, right: initial, bottom: initial, left: initial },
		},
	};
}

function normalizeSpacingAttr(value, fallback = 0) {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}

	const initial = Number.isFinite(Number(value)) ? Number(value) : fallback;
	return createSpacingDefaults(initial);
}

/**
 * Border width for `Border` / `Spacing`: per-device units + link state; avoids string `unit` spread bugs.
 *
 * @param {Object|undefined} value Saved `imageBorderWidth*` attribute.
 */
function normalizeBorderWidthAttr(value) {
	const base = { ...DEFAULT_IMAGE_BORDER_WIDTH };
	if (!value || typeof value !== 'object') {
		return base;
	}
	const rawUnit = value.unit;
	const unit =
		typeof rawUnit === 'string'
			? { Desktop: rawUnit, Tablet: rawUnit, Mobile: rawUnit }
			: { ...base.unit, ...(rawUnit && typeof rawUnit === 'object' ? rawUnit : {}) };
	const rawVal = value.value;
	const mergedValue =
		rawVal && typeof rawVal === 'object' ? { ...base.value, ...rawVal } : base.value;
	return {
		...base,
		...value,
		allChange: value.allChange === undefined ? true : !!value.allChange,
		unit,
		value: mergedValue,
	};
}

/**
 * Background-control shape for the overlay color attribute.
 *
 * The Overlay control is a `<Background>` picker expecting `{ style, solid, gradient }`.
 * Existing posts may store a legacy bare solid-color string; normalize it (and the
 * default) into the object form for display. Edits always store the object form,
 * migrating legacy strings on first change.
 *
 * @param {*}      raw          Saved `overlayColor` / `overlayColorHover`.
 * @param {string} defaultColor Solid fallback when unset.
 * @return {{ style: string, solid: string, gradient: string }} Background state for the control.
 */
function resolveOverlayColorAttr(raw, defaultColor) {
	if (raw && typeof raw === 'object') {
		return {
			style: raw.style || 'solid',
			solid: raw.solid || '',
			gradient: raw.gradient || '',
		};
	}
	const solid = typeof raw === 'string' && raw ? raw : defaultColor;
	return { style: 'solid', solid, gradient: '' };
}

/**
 * Gets the label for the active image height mode.
 *
 * @param {string} mode Height or max-height mode.
 * @return {string} User-facing mode label.
 */
function getImageHeightModeLabel(mode) {
	return 'max-height' === mode
		? __('Max height', 'wp-carousel-free')
		: __('Height', 'wp-carousel-free');
}

/**
 * Responsive dimension input with optional height/max-height mode switch.
 *
 * @param {Object}   props
 * @param {string}   props.label
 * @param {string}   props.attributeKey
 * @param {Object}   props.value
 * @param {Function} props.set
 * @param {string[]} [props.units]
 * @param {string}   [props.placeholder]
 * @param {string[]} [props.modes]        When set, shows height | max-height style toggle.
 * @param {string}   [props.mode]
 * @param {Function} [props.onModeChange]
 * @return {Element} Responsive dimension field.
 */
function ResponsiveDimensionField({
	label,
	attributeKey,
	value,
	set,
	units = ['px', 'em', 'vh'],
	placeholder = 'auto',
	modes = null,
	mode = 'height',
	onModeChange,
}) {
	const unitChange = ({ unit, deviceType }) =>
		set({
			[attributeKey]: {
				...value,
				unit: {
					...value?.unit,
					[deviceType]: unit,
				},
			},
		});

	const modeChip = getImageHeightModeLabel(mode);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
			{Array.isArray(modes) && modes.length > 0 ? (
				<div className="wpcp-header-control sp-mb-8px">
					<div className="wpcp-header-control-left">
						<span className="wpcp-component-title">{label}</span>
						{value?.device && <Responsive />}
					</div>
					<div className="wpcp-header-control-right wpcp-header-control-right--height-mode">
						<div className="wpcp-units wpcp-units--css-prop">
							<span className="wpcp-units-indicator-label" title={modeChip} aria-label={modeChip}>
								{modeChip}
							</span>
							<div
								className="wpcp-units-btn"
								role="listbox"
								aria-label={__('Height mode', 'wp-carousel-free')}
							>
								{modes.map((item) => (
									<Button
										key={item}
										className={mode === item ? 'active' : ''}
										onClick={() => onModeChange?.(item)}
										aria-selected={mode === item}
									>
										{getImageHeightModeLabel(item)}
									</Button>
								))}
							</div>
						</div>
						<Units
							attributes={value}
							setAttributes={() => {}}
							attributesKey={attributeKey}
							units={units}
							onUnitChange={unitChange}
							defaultUnit="px"
						/>
					</div>
				</div>
			) : (
				<ComponentsTopSection
					label={label}
					attributes={value}
					attributesKey={attributeKey}
					setAttributes={() => {}}
					units={units}
					onUnitChange={unitChange}
					defaultUnit="px"
				/>
			)}
			<InputControl
				attributes={value}
				attributesKey={attributeKey}
				setAttributes={() => {}}
				onChange={(nextValue, deviceType) =>
					set({
						[attributeKey]: {
							...value,
							device: {
								...value?.device,
								[deviceType]: nextValue,
							},
						},
					})
				}
				placeholder={placeholder}
				flex={false}
				responsive={false}
			/>
		</div>
	);
}

function GeneralTab({ attributes, setAttributes }) {
	const isSliderBlock =
		String(attributes?.blockName || '').replace('wp-carousel-pro/', '') === 'slider';
	const { imageOptions, set } = useImageOptionsSetter(attributes, setAttributes);
	// Stage Height lives in `layoutOptions.sliderHeight` (not imageOptions), so it
	// needs its own reset-safe setter — mirrors the Height control in the Layouts panel.
	const setLayoutOption = useOptionSetter(attributes, setAttributes, 'layoutOptions');
	const layoutOptions = attributes?.layoutOptions || {};
	// Slider schema default is `original`; carousel-style blocks default to `4:3`.
	const aspectRatio = imageOptions.aspectRatio ?? (isSliderBlock ? 'original' : '4:3');
	// Variable width sizes each slide from its image, so the aspect-ratio box is
	// replaced by an optional fixed Image Height (width follows the ratio).
	const variableWidthSizing = isVariableWidthImageSizing(attributes);
	// The ticker is excluded from `isVariableWidthImageSizing()` because it keeps
	// its aspect-ratio control, but it still wants the Image Height row.
	const isMarqueeTickerVariableWidth =
		'marquee' === String(attributes?.blockName || '').replace('wp-carousel-pro/', '') &&
		'ticker' === (attributes?.layoutOptions?.carouselStyle || 'standard') &&
		!!attributes?.layoutOptions?.variableWidth &&
		'vertical' !== (attributes?.layoutOptions?.displayStyle || 'horizontal');
	const showVariableWidthImageHeight = variableWidthSizing || isMarqueeTickerVariableWidth;
	// Structurally hide Aspect Ratio for Tiles bento / Variable Width. Slider
	// keeps a stage-level control. Exception to always-editable — see
	// isAspectRatioControlVisible().
	const showAspectRatio = isAspectRatioControlVisible(attributes);
	const showCustomDimensions =
		showAspectRatio && aspectRatio === 'custom' && !isSliderBlock && !variableWidthSizing;
	const isImageSource = attributes?.sourceType === 'image';
	const imagePanelProNotice = isImageSource ? PRO_IMAGE_SIZE_PROTECTION : PRO_IMAGE_POST_PRODUCT;

	return (
		<>
			<SelectField
				label={__('Image Resolution', 'wp-carousel-free')}
				attributes={imageOptions.resolution ?? 'large'}
				attributesKey="resolution"
				setAttributes={set}
				items={RESOLUTIONS}
				flexStyle={false}
			/>
			{showAspectRatio && (
				<SelectField
					label={
						isSliderBlock
							? __('Stage Aspect Ratio', 'wp-carousel-free')
							: __('Aspect Ratio', 'wp-carousel-free')
					}
					attributes={aspectRatio}
					attributesKey="aspectRatio"
					setAttributes={set}
					items={IMAGE_ASPECT_RATIO_ITEMS}
					flexStyle={false}
				/>
			)}
			{/*
			 * Slider Stage Height — a copy of the Layouts panel Height control, shown
			 * next to Stage Aspect Ratio so the two related settings sit together.
			 * Only Original / Custom let the fixed Height drive the stage; a preset
			 * ratio (16:9, …) wins and the control is hidden here.
			 */}
			{isSliderBlock && showAspectRatio && ['original', 'custom'].includes(aspectRatio) && (
				<SPRangeControl
					label={__('Height', 'wp-carousel-free')}
					attributes={layoutOptions.sliderHeight}
					attributesKey={'sliderHeight'}
					setAttributes={setLayoutOption}
					units={['px', 'vh', '%', 'em']}
					capUnits={['%', 'vh']}
					min={50}
					max={1000}
					defaultValue={{ value: 600, unit: 'px' }}
				/>
			)}
			{showVariableWidthImageHeight && (
				<ResponsiveDimensionField
					label={__('Image Height', 'wp-carousel-free')}
					attributeKey="variableWidthImageHeight"
					value={imageOptions?.variableWidthImageHeight}
					set={set}
					modes={['height', 'max-height']}
					mode={imageOptions?.variableWidthImageHeightMode === 'max-height' ? 'max-height' : 'height'}
					onModeChange={(nextMode) => set({ variableWidthImageHeightMode: nextMode })}
				/>
			)}
			{showCustomDimensions && (
				<div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginBottom: '24px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
						<ComponentsTopSection
							label={__('Width', 'wp-carousel-free')}
							attributes={imageOptions?.customImageWidth}
							attributesKey="customImageWidth"
							setAttributes={() => {}}
							units={['px', '%', 'em']}
							onUnitChange={({ unit, deviceType }) =>
								set({
									customImageWidth: {
										...imageOptions?.customImageWidth,
										unit: { ...imageOptions?.customImageWidth?.unit, [deviceType]: unit },
									},
								})
							}
							defaultUnit="px"
						/>
						<InputControl
							attributes={imageOptions?.customImageWidth}
							attributesKey="customImageWidth"
							setAttributes={() => {}}
							onChange={(value, deviceType) =>
								set({
									customImageWidth: {
										...imageOptions?.customImageWidth,
										device: { ...imageOptions?.customImageWidth?.device, [deviceType]: value },
									},
								})
							}
							placeholder="auto"
							flex={false}
							responsive={false}
						/>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
						<ComponentsTopSection
							label={__('Height', 'wp-carousel-free')}
							attributes={imageOptions?.customImageHeight}
							attributesKey="customImageHeight"
							setAttributes={() => {}}
							units={['px', '%', 'em']}
							onUnitChange={({ unit, deviceType }) =>
								set({
									customImageHeight: {
										...imageOptions?.customImageHeight,
										unit: { ...imageOptions?.customImageHeight?.unit, [deviceType]: unit },
									},
								})
							}
							defaultUnit="px"
						/>
						<InputControl
							attributes={imageOptions?.customImageHeight}
							attributesKey="customImageHeight"
							setAttributes={() => {}}
							onChange={(value, deviceType) =>
								set({
									customImageHeight: {
										...imageOptions?.customImageHeight,
										device: { ...imageOptions?.customImageHeight?.device, [deviceType]: value },
									},
								})
							}
							placeholder="auto"
							flex={false}
							responsive={false}
						/>
					</div>
				</div>
			)}
			<Toggle
				label={__('Lazy Loading', 'wp-carousel-free')}
				attributes={imageOptions.lazyLoad ?? true}
				attributesKey="lazyLoad"
				setAttributes={set}
			/>
			{isImageSource && (
				<>
					{!isSliderBlock && <Toggle label={__('Image Preloader', 'wp-carousel-free')} onlyPro />}
					<Toggle label={__('Watermark', 'wp-carousel-free')} onlyPro />
					<Toggle label={__('Right Click Protection', 'wp-carousel-free')} onlyPro />
				</>
			)}
			<SpProNotice
				className="is-upsell"
				title={imagePanelProNotice.title}
				subtitle={imagePanelProNotice.subtitle}
				features={imagePanelProNotice.features}
				linkText={imagePanelProNotice.linkText}
				icon={false}
				linkButton
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const isSliderBlock =
		String(attributes?.blockName || '').replace('wp-carousel-pro/', '') === 'slider';
	const { imageOptions, set } = useImageOptionsSetter(attributes, setAttributes);
	const io = imageOptions;
	const [stateTab, setStateTab] = useState('normal');

	const overlayColorKey = stateTab === 'normal' ? 'overlayColor' : 'overlayColorHover';
	const overlayColorValue =
		stateTab === 'normal' ? io.overlayColor ?? '#000000' : io.overlayColorHover ?? '#000000';

	// Overlay defaults to a hover-only darken: invisible (0%) in Normal, black 60% on Hover.
	// Opacity is a separate control; the color picker carries no alpha.
	const overlayOpacityKey = stateTab === 'normal' ? 'opacity' : 'opacityHover';
	const overlayOpacityDefault =
		stateTab === 'normal' ? { value: 0, unit: '%' } : { value: 60, unit: '%' };
	const overlayOpacityValue =
		stateTab === 'normal'
			? io.opacity ?? overlayOpacityDefault
			: io.opacityHover ?? overlayOpacityDefault;

	return (
		<>
			<SPToggleGroupControl
				attributes={stateTab}
				items={[
					{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
					{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
				]}
				onClick={(value) => setStateTab(value)}
			/>

			<div className="wpcp-button wpcp-component-mb">
				<div className="wpcp-header-left">
					<span className="wpcp-component-title wpcp-pro-inline-title">
						{__('Image Filter', 'wp-carousel-free')}
					</span>
					<a
						className="wpcp-pro-inline-tag"
						href={getPricingUrl()}
						target="_blank"
						rel="noopener noreferrer"
					>
						{__('(Pro)', 'wp-carousel-free')}
					</a>
				</div>
				<div className="wpcp-header-right">
					<span className="wpcp-pro-static-icon" aria-hidden="true">
						<BorderIcon />
					</span>
				</div>
			</div>

			<Toggle
				label={__('Overlay', 'wp-carousel-free')}
				attributes={imageOptions.overlay ?? true}
				attributesKey="overlay"
				setAttributes={set}
			/>
			{io.overlay && (
				<>
					<Background
						label={__('Overlay Type', 'wp-carousel-free')}
						attributes={resolveOverlayColorAttr(overlayColorValue, '#000000')}
						attributesKey={overlayColorKey}
						setAttributes={set}
						items={['solid', 'gradient']}
						colorLabel={__('Overlay Color', 'wp-carousel-free')}
						defaultColor="#000000"
					/>
					<SPRangeControl
						label={__('Overlay Opacity', 'wp-carousel-free')}
						attributes={overlayOpacityValue}
						attributesKey={overlayOpacityKey}
						setAttributes={set}
						min={0}
						max={100}
						units={['%']}
						defaultValue={overlayOpacityDefault}
					/>
				</>
			)}
			{!isSliderBlock && (
				<>
					<Border
						label={__('Border', 'wp-carousel-free')}
						attributes={{
							border: {
								style: io.imageBorderNormal?.style ?? DEFAULT_IMAGE_BORDER.style,
								color:
									stateTab === 'hover'
										? io.imageBorderHover?.color ?? DEFAULT_IMAGE_BORDER.color
										: io.imageBorderNormal?.color ?? DEFAULT_IMAGE_BORDER.color,
							},
							borderWidth: normalizeBorderWidthAttr(io.imageBorderWidthNormal),
						}}
						attributesKey={{ border: 'imageBorderNormal', borderWidth: 'imageBorderWidthNormal' }}
						setAttributes={() => {}}
						parentState={stateTab}
						onStateUpdate={(key, updateValue) => {
							if (key === 'imageBorderNormal') {
								const sharedStyle = updateValue.style;
								const stateColor = updateValue.color;
								if (stateTab === 'hover') {
									set({
										imageBorderNormal: { ...(io.imageBorderNormal || {}), style: sharedStyle },
										imageBorderHover: {
											...(io.imageBorderHover || {}),
											style: sharedStyle,
											color: stateColor,
										},
									});
								} else {
									set({
										imageBorderNormal: {
											...(io.imageBorderNormal || {}),
											style: sharedStyle,
											color: stateColor,
										},
										imageBorderHover: { ...(io.imageBorderHover || {}), style: sharedStyle },
									});
								}
							} else if (key === 'imageBorderWidthNormal') {
								set({
									imageBorderWidthNormal: updateValue,
								});
							}
						}}
					/>
				</>
			)}

			<Divider position="sp-w-100pct" />

			{!isSliderBlock && (
				<>
					<Spacing
						label={__('Border Radius', 'wp-carousel-free')}
						attributes={normalizeSpacingAttr(io.borderRadius, 0)}
						attributesKey="borderRadius"
						setAttributes={set}
						units={['px', '%', 'em']}
						defaultValue={{
							unit: 'px',
							value: DEFAULT_SPACING_VALUE,
							device: createSpacingDefaults(0).device,
						}}
						indicator="radius"
					/>
				</>
			)}
		</>
	);
}

function ImagePanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	const panelTitle =
		'image' === attributes?.sourceType
			? __('Image Size & Protection', 'wp-carousel-free')
			: __('Image', 'wp-carousel-free');
	return (
		<PanelBody title={panelTitle} opened={panelOpen} onToggle={onPanelToggle}>
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

export default memo(ImagePanel);
