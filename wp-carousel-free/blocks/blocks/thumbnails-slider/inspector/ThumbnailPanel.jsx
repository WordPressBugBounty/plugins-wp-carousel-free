/**
 * Thumbnail (singular) panel — per-tile controls for the thumbnails strip.
 *
 * Renders only when the active block is `wp-carousel-pro/thumbnails-slider`.
 *
 * Settings tab covers image visibility/size/dimensions/opacity plus the 6-tile
 * Active Indicator Style picker. Free renders only the Default style, so the
 * one sub-control left under the picker is Active Thumb Border; Frame,
 * Indicator, Grayscale, Overlay and Countdown are locked cards with no
 * settings behind them.
 *
 * Style tab covers per-tile typography, image filter, image border (state-
 * aware), border radius, and content-area style — all driven by a 3-segment
 * state switch (`Normal | Hover | Active`). Title/description colors and the
 * image filter write to the matching state slot; the shared Border component
 * shares its style + width across states (Border Normal/Hover memory rule)
 * and writes color into `border.{color,hoverColor,activeColor}`.
 *
 * Thumbnail Title and Thumbnail Description are Pro — locked toggles that
 * write nothing. Main slide title/description visibility stays owned by the
 * Content Area panel.
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import {
	Divider,
	InputControl,
	Popup,
	SPRangeControl,
	SelectField,
	Spacing,
	SpProNotice,
	TabControls,
	Toggle,
	Border,
} from '@wp-carousel-pro/components';
import ActiveStylePicker from './ActiveStylePicker';
import ComponentsTopSection from '@wp-carousel-pro/components/componentsTopControl/ComponentsTopSection';
import { PRO_THUMBNAIL } from '../../shared/constants/proFeatures';
import { resolveThumbnailActiveStyle } from '../../shared/constants/freeValues';

const IMAGE_SIZE_OPTIONS = [
	{ label: __('Default', 'wp-carousel-free'), value: 'default' },
	{ label: __('Thumbnail', 'wp-carousel-free'), value: 'thumbnail' },
	{ label: __('Medium', 'wp-carousel-free'), value: 'medium' },
	{ label: __('Large', 'wp-carousel-free'), value: 'large' },
	{ label: __('Full', 'wp-carousel-free'), value: 'full' },
];

const SPACING_DEFAULT = {
	allChange: true,
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
	device: { Desktop: { top: 0, right: 0, bottom: 0, left: 0 } },
};

/**
 * Read a per-device value from the new dimensions shape, falling back through
 * Tablet → Desktop so the preview always has a usable number.
 *
 * @param {Object} dimensions `thumbnail.dimensions` attribute object.
 * @param {string} device     'Desktop' | 'Tablet' | 'Mobile'.
 * @param {string} key        'width' | 'height'.
 * @return {string|number} Resolved value (or 'auto').
 */
function readDimensionsValue(dimensions, device, key) {
	const slot = dimensions?.device?.[device];
	if (slot && Object.prototype.hasOwnProperty.call(slot, key)) {
		return slot[key];
	}
	if ('Mobile' === device) {
		const tablet = dimensions?.device?.Tablet;
		if (tablet && Object.prototype.hasOwnProperty.call(tablet, key)) {
			return tablet[key];
		}
	}
	if ('Mobile' === device || 'Tablet' === device) {
		const desktop = dimensions?.device?.Desktop;
		if (desktop && Object.prototype.hasOwnProperty.call(desktop, key)) {
			return desktop[key];
		}
	}
	return 'auto';
}

function normalizeSpacingAttr(value) {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	return SPACING_DEFAULT;
}

function SettingsTab({ attributes, setAttributes }) {
	const t = attributes.thumbnail || {};
	const set = (updates) => setAttributes({ thumbnail: { ...t, ...updates } });

	const dimensions = t.dimensions || { device: { Desktop: { width: 'auto', height: 'auto' } } };
	const setDimension = (device, key, value) => {
		const next = {
			...dimensions,
			device: {
				...(dimensions.device || {}),
				[device]: {
					...(dimensions.device?.[device] || {}),
					[key]: value,
				},
			},
		};
		set({ dimensions: next });
	};
	const setDimensionUnit = (deviceType, newValue, key) => {
		const next = {
			...dimensions,
			unit: {
				...(dimensions.unit || {}),
				[deviceType]: {
					...(dimensions.unit?.[deviceType] || {}),
					[key]: newValue,
				},
			},
		};
		set({ dimensions: next });
	};

	const widthAttrs = {
		device: {
			Desktop: readDimensionsValue(dimensions, 'Desktop', 'width'),
			Tablet: readDimensionsValue(dimensions, 'Tablet', 'width'),
			Mobile: readDimensionsValue(dimensions, 'Mobile', 'width'),
		},
		unit: {
			Desktop: t.dimensions?.unit?.Desktop?.width ?? 'px',
			Tablet: t.dimensions?.unit?.Tablet?.width ?? 'px',
			Mobile: t.dimensions?.unit?.Mobile?.width ?? 'px',
		},
	};
	const heightAttrs = {
		device: {
			Desktop: readDimensionsValue(dimensions, 'Desktop', 'height'),
			Tablet: readDimensionsValue(dimensions, 'Tablet', 'height'),
			Mobile: readDimensionsValue(dimensions, 'Mobile', 'height'),
		},
		unit: {
			Desktop: t.dimensions?.unit?.Desktop?.height ?? 'px',
			Tablet: t.dimensions?.unit?.Tablet?.height ?? 'px',
			Mobile: t.dimensions?.unit?.Mobile?.height ?? 'px',
		},
	};

	// A block saved in Pro opens here on a locked style — show Default instead.
	const activeStyle = resolveThumbnailActiveStyle(t.activeStyle);

	return (
		<>
			<Toggle
				label={__('Thumbnail Image', 'wp-carousel-free')}
				attributes={t.showImage ?? true}
				attributesKey="showImage"
				setAttributes={set}
			/>
			{t.showImage !== false && (
				<>
					<SelectField
						label={__('Thumbnail Size', 'wp-carousel-free')}
						attributes={t.imageSize ?? 'thumbnail'}
						attributesKey="imageSize"
						setAttributes={set}
						items={IMAGE_SIZE_OPTIONS}
					/>

					<div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
						<div style={{ flex: 1 }}>
							<ComponentsTopSection
								label={__('Width', 'wp-carousel-free')}
								attributes={widthAttrs}
								attributesKey="thumbnailWidth"
								setAttributes={() => {}}
								units={['px', '%', 'em']}
								onUnitChange={({ unit, deviceType }) => setDimensionUnit(deviceType, unit, 'width')}
							/>
							<InputControl
								attributes={widthAttrs}
								attributesKey="thumbnailWidth"
								setAttributes={() => {}}
								onChange={(value, deviceType) => setDimension(deviceType, 'width', value)}
								placeholder="auto"
								flex={false}
								responsive={false}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<ComponentsTopSection
								label={__('Height', 'wp-carousel-free')}
								attributes={heightAttrs}
								attributesKey="thumbnailHeight"
								setAttributes={() => {}}
								units={['px', '%', 'em']}
								onUnitChange={({ unit, deviceType }) => setDimensionUnit(deviceType, unit, 'height')}
							/>
							<InputControl
								attributes={heightAttrs}
								attributesKey="thumbnailHeight"
								setAttributes={() => {}}
								onChange={(value, deviceType) => setDimension(deviceType, 'height', value)}
								placeholder="auto"
								flex={false}
								responsive={false}
							/>
						</div>
					</div>
				</>
			)}

			<Toggle onlyPro label={__('Thumbnail Title', 'wp-carousel-free')} />

			<Toggle onlyPro label={__('Thumbnail Description', 'wp-carousel-free')} />

			<Divider position="sp-w-100pct" />

			<ActiveStylePicker
				label={__('Active Thumbnail Style', 'wp-carousel-free')}
				attributes={activeStyle}
				attributesKey="activeStyle"
				setAttributes={set}
			/>

			<Border
				label={__('Active Thumb Border', 'wp-carousel-free')}
				attributes={{
					border: t.activeThumbBorder,
					borderWidth: t.activeThumbBorderWidth,
				}}
				attributesKey={{
					border: 'activeThumbBorder',
					borderWidth: 'activeThumbBorderWidth',
				}}
				setAttributes={set}
				btnType={'color'}
			/>

			<SpProNotice
				className="is-upsell"
				message={PRO_THUMBNAIL.message}
				linkText={PRO_THUMBNAIL.linkText}
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const t = attributes.thumbnail || {};
	const set = (updates) => setAttributes({ thumbnail: { ...t, ...updates } });

	const imageFilterNormal = t.imageFilter?.normal || {
		blur: 0,
		brightness: 1,
		contrast: 1,
		saturation: 0,
		hue: 1,
	};
	const setImageFilter = (updates) =>
		set({ imageFilter: { normal: { ...imageFilterNormal, ...updates } } });

	return (
		<>
			<Popup
				label={__('Thumbnail Filter', 'wp-carousel-free')}
				divClassName="wpcp-thumbnail-slider-popup"
			>
				<>
					<SPRangeControl
						label={__('Blur', 'wp-carousel-free')}
						attributes={imageFilterNormal.blur ?? 0}
						attributesKey="tempBlur"
						setAttributes={() => {}}
						onValueChange={({ value }) => setImageFilter({ blur: value })}
						min={0}
						max={20}
						defaultValue={0}
						units={false}
						showResponsiveIcon={false}
					/>
					<SPRangeControl
						label={__('Brightness', 'wp-carousel-free')}
						attributes={imageFilterNormal.brightness ?? 1}
						attributesKey="tempBrightness"
						setAttributes={() => {}}
						onValueChange={({ value }) => setImageFilter({ brightness: value })}
						min={0}
						max={2}
						step={0.1}
						defaultValue={1}
						units={false}
						showResponsiveIcon={false}
					/>
					<SPRangeControl
						label={__('Contrast', 'wp-carousel-free')}
						attributes={imageFilterNormal.contrast ?? 1}
						attributesKey="tempContrast"
						setAttributes={() => {}}
						onValueChange={({ value }) => setImageFilter({ contrast: value })}
						min={0}
						max={2}
						step={0.1}
						defaultValue={1}
						units={false}
						showResponsiveIcon={false}
					/>
					<SPRangeControl
						label={__('Saturation', 'wp-carousel-free')}
						attributes={imageFilterNormal.saturation ?? 0}
						attributesKey="tempSaturation"
						setAttributes={() => {}}
						onValueChange={({ value }) => setImageFilter({ saturation: value })}
						min={0}
						max={100}
						defaultValue={0}
						units={false}
						showResponsiveIcon={false}
					/>
					<SPRangeControl
						label={__('Hue', 'wp-carousel-free')}
						attributes={imageFilterNormal.hue ?? 1}
						attributesKey="tempHue"
						setAttributes={() => {}}
						onValueChange={({ value }) => setImageFilter({ hue: value })}
						min={0}
						max={360}
						defaultValue={1}
						units={false}
						showResponsiveIcon={false}
					/>
				</>
			</Popup>

			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{ border: t.border, borderWidth: t.borderWidth }}
				attributesKey={{ border: 'border', borderWidth: 'borderWidth' }}
				setAttributes={set}
				btnType={'color'}
			/>
			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={t.borderRadius}
				attributesKey="borderRadius"
				setAttributes={set}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 0, right: 0, bottom: 0, left: 0 },
					device: SPACING_DEFAULT.device,
				}}
				indicator="radius"
			/>
		</>
	);
}

function ThumbnailPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody
			title={__('Thumbnail', 'wp-carousel-free')}
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
				styleTabTitle={__('Style', 'wp-carousel-free')}
			/>
		</PanelBody>
	);
}

export default memo(ThumbnailPanel);

// Export helper functions for testing
export { readDimensionsValue, normalizeSpacingAttr };
