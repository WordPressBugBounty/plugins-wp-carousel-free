/**
 * Video Panel – video play icon and options.
 * Shown for: video source only.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo, useState } from '@wordpress/element';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import {
	Toggle,
	SPRangeControl,
	SelectField,
	TabControls,
	SpColorPicker,
	IconGrid,
	Divider,
	InputControl,
	Background,
	Border,
	SpProNotice,
	getPricingUrl,
} from '@wp-carousel-pro/components';
import { BorderIcon } from '@wp-carousel-pro/icons/icons';
import ToggleGroupControl from '@wp-carousel-pro/components/toggleGroupControl/toggleGroupControl';
import ComponentsTopSection from '@wp-carousel-pro/components/componentsTopControl/ComponentsTopSection';
import Spacing from '@wp-carousel-pro/components/spacing/spacing';
import { PlayIconSet } from '@wp-carousel-pro/icons/videoSourceIcons';
import { VIDEO_ASPECT_RATIOS } from '../../constants/aspectRatios';
import { PRO_CLICK_ACTIONS } from '../../constants/proFeatures';

const PLAY_MODES = [
	{ label: __('Popup', 'wp-carousel-free'), value: 'popup' },
	{ label: __('Inline', 'wp-carousel-free'), value: 'inline', pro: true },
];

const ICON_VIEWS = [
	{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
	{ label: __('Stacked', 'wp-carousel-free'), value: 'stacked' },
	{ label: __('Framed', 'wp-carousel-free'), value: 'framed' },
];

const ANIMATIONS = [
	{ label: __('None', 'wp-carousel-free'), value: 'none' },
	{ label: __('Pulse', 'wp-carousel-free'), value: 'pulse' },
	{ label: __('Bounce', 'wp-carousel-free'), value: 'bounce' },
	{ label: __('Spin', 'wp-carousel-free'), value: 'spin' },
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
const THUMBNAIL_SIZES = [
	{ label: __('Cover', 'wp-carousel-free'), value: 'cover' },
	{ label: __('Contain', 'wp-carousel-free'), value: 'contain' },
	{ label: __('Fill', 'wp-carousel-free'), value: 'fill' },
];
const NORMAL_HOVER = [
	{ label: __('Normal', 'wp-carousel-free'), value: 'color' },
	{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
];
const SPACING_DEFAULT = {
	device: {
		Desktop: { top: '', right: '', bottom: '', left: '' },
		Tablet: { top: '', right: '', bottom: '', left: '' },
		Mobile: { top: '', right: '', bottom: '', left: '' },
	},
	unit: {
		Desktop: 'px',
		Tablet: 'px',
		Mobile: 'px',
	},
	allChange: true,
};
const BORDER_DEFAULT = {
	style: 'none',
	color: '#ddd',
};
const CONTENT_AREA_BG_ITEMS = ['solid', 'gradient'];

function GeneralTab({ attributes, setAttributes }) {
	const vo = attributes.videoOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'videoOptions');
	const useCustomIcon = !vo.useSourceIcon;

	const getIconSize = () => ({
		...RANGER_DEFAULT,
		...vo?.iconSize,
	});
	const getIconAreaSize = () => ({
		...RANGER_DEFAULT,
		...vo?.iconAreaSize,
	});
	const getCustomVideoWidth = () => ({
		...RANGER_DEFAULT,
		...vo?.customVideoWidth,
	});
	const getCustomVideoHeight = () => ({
		...RANGER_DEFAULT,
		...vo?.customVideoHeight,
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
		onReset: ({ value, unit, deviceType }) =>
			set({
				[key]: {
					...getter(),
					device: { ...getter()?.device, [deviceType]: value },
					unit: { ...getter()?.unit, [deviceType]: unit },
				},
			}),
	});

	return (
		<>
			<ToggleGroupControl
				label={__('Play Mode', 'wp-carousel-free')}
				attributes="popup"
				attributesKey="playMode"
				setAttributes={set}
				items={PLAY_MODES}
			/>
			<Toggle
				label={__('Use Source Video Icon', 'wp-carousel-free')}
				attributes={vo.useSourceIcon ?? false}
				attributesKey="useSourceIcon"
				setAttributes={set}
			/>
			{useCustomIcon && (
				<IconGrid
					label={__('Play Icon', 'wp-carousel-free')}
					value={vo.videoIcon || 'playIconOne'}
					options={PlayIconSet}
					onChange={(videoIcon) => set({ videoIcon })}
					col={6}
					extClass="wpcp-video-icon-set"
				/>
			)}
			<div className="wpcp-button wpcp-component-mb">
				<div className="wpcp-header-left">
					<span className="wpcp-component-title wpcp-pro-inline-title">
						{__('Icon Position', 'wp-carousel-free')}
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

			{useCustomIcon && (
				<ToggleGroupControl
					label={__('Icon View', 'wp-carousel-free')}
					attributes={vo.iconView ?? 'stacked'}
					attributesKey="iconView"
					setAttributes={set}
					items={ICON_VIEWS}
				/>
			)}
			<SPRangeControl
				label={__('Icon Size', 'wp-carousel-free')}
				attributes={getIconSize()}
				attributesKey="iconSize"
				setAttributes={() => {}}
				min={0}
				max={100}
				defaultValue={{ unit: 'px', value: '' }}
				units={['px', '%', 'em']}
				{...createRangeHandlers('iconSize', getIconSize)}
			/>
			{useCustomIcon && vo.iconView !== 'normal' && (
				<SPRangeControl
					label={__('Icon Area Size', 'wp-carousel-free')}
					attributes={getIconAreaSize()}
					attributesKey="iconAreaSize"
					setAttributes={() => {}}
					min={0}
					max={200}
					defaultValue={{ unit: 'px', value: '' }}
					units={['px', '%', 'em']}
					{...createRangeHandlers('iconAreaSize', getIconAreaSize)}
				/>
			)}
			<Toggle
				label={__('Show Icon on Hover', 'wp-carousel-free')}
				attributes={vo.showOnHover ?? false}
				attributesKey="showOnHover"
				setAttributes={set}
			/>
			<SelectField
				label={__('Icon Animation', 'wp-carousel-free')}
				attributes={vo.animation ?? 'none'}
				attributesKey="animation"
				setAttributes={set}
				items={ANIMATIONS}
				flexStyle={false}
			/>
			<Divider position="sp-w-100pct" />
			<SelectField
				label={__('Aspect Ratio', 'wp-carousel-free')}
				attributes={vo.aspectRatio ?? '16:9'}
				attributesKey="aspectRatio"
				setAttributes={set}
				items={VIDEO_ASPECT_RATIOS}
				flexStyle={false}
			/>
			{vo.aspectRatio === 'custom' && (
				<>
					{/* Image Width and Height components */}
					<div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginBottom: '24px' }}>
						<div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
							<ComponentsTopSection
								label={__('Width', 'wp-carousel-free')}
								attributes={getCustomVideoWidth()}
								attributesKey={'customVideoWidth'}
								setAttributes={() => {}}
								units={['px', '%', 'em']}
								onUnitChange={({ unit, deviceType }) => {
									const current = getCustomVideoWidth();
									set({
										customVideoWidth: {
											...current,
											unit: {
												...current?.unit,
												[deviceType]: unit,
											},
										},
									});
								}}
								defaultUnit={'px'}
							/>
							<InputControl
								attributes={getCustomVideoWidth()}
								attributesKey={'customVideoWidth'}
								setAttributes={() => {}}
								onChange={(value, deviceType) => {
									const current = getCustomVideoWidth();
									set({
										customVideoWidth: {
											...current,
											device: {
												...current?.device,
												[deviceType]: value,
											},
										},
									});
								}}
								placeholder={'auto'}
								flex={false}
								responsive={false}
							/>
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
							<ComponentsTopSection
								label={__('Height', 'wp-carousel-free')}
								attributes={getCustomVideoHeight()}
								attributesKey={'customVideoHeight'}
								setAttributes={() => {}}
								units={['px', '%', 'em']}
								onUnitChange={({ unit, deviceType }) => {
									const current = getCustomVideoHeight();
									set({
										customVideoHeight: {
											...current,
											unit: {
												...current?.unit,
												[deviceType]: unit,
											},
										},
									});
								}}
								defaultUnit={'px'}
							/>
							<InputControl
								attributes={getCustomVideoHeight()}
								attributesKey={'customVideoHeight'}
								setAttributes={() => {}}
								onChange={(value, deviceType) => {
									const current = getCustomVideoHeight();
									set({
										customVideoHeight: {
											...current,
											device: {
												...current?.device,
												[deviceType]: value,
											},
										},
									});
								}}
								placeholder={'auto'}
								flex={false}
								responsive={false}
							/>
						</div>
					</div>
				</>
			)}
			<ToggleGroupControl
				label={__('Thumbnail Size', 'wp-carousel-free')}
				attributes={vo.thumbnailSize ?? 'cover'}
				attributesKey="thumbnailSize"
				setAttributes={set}
				items={THUMBNAIL_SIZES}
			/>
			<SpProNotice
				className="is-upsell"
				message={PRO_CLICK_ACTIONS.message}
				linkText={PRO_CLICK_ACTIONS.linkText}
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const vo = attributes.videoOptions || {};
	const set = (updates) => setAttributes({ videoOptions: { ...vo, ...updates } });
	const [colorState, setColorState] = useState('color');
	const useCustomIcon = !vo.useSourceIcon;

	const getIconBorderRadius = () => ({
		...SPACING_DEFAULT,
		...vo?.iconBorderRadius,
	});
	const getVideoBorder = () => ({
		...BORDER_DEFAULT,
		...vo?.videoBorder,
	});
	const getVideoBorderWidth = () => ({
		...SPACING_DEFAULT,
		...vo?.videoBorderWidth,
	});
	const getVideoBorderRadius = () => ({
		...SPACING_DEFAULT,
		...vo?.videoBorderRadius,
	});

	const createSpacingHandlers = (key, getter) => ({
		onChange: (value) => set({ [key]: value }),

		onUnitChange: ({ unit, deviceType }) =>
			set({
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
			set({
				[key]: {
					...getter(),
					allChange: value,
				},
			}),
	});

	return (
		<>
			{useCustomIcon && (
				<ToggleGroupControl
					attributes={colorState}
					onClick={(value) => setColorState(value)}
					items={NORMAL_HOVER}
				/>
			)}
			{useCustomIcon && colorState === 'color' && (
				<>
					<SpColorPicker
						label={__('Primary Color', 'wp-carousel-free')}
						attributes={vo.iconColor ?? ''}
						attributesKey="iconColor"
						setAttributes={set}
					/>
					{vo.iconView !== 'normal' && (
						<SpColorPicker
							label={__('Secondary Color', 'wp-carousel-free')}
							attributes={vo.iconBg ?? ''}
							attributesKey="iconBg"
							setAttributes={set}
						/>
					)}
				</>
			)}
			{useCustomIcon && colorState === 'hover' && (
				<>
					<SpColorPicker
						label={__('Primary Color', 'wp-carousel-free')}
						attributes={vo.iconHoverColor ?? ''}
						attributesKey="iconHoverColor"
						setAttributes={set}
					/>
					{vo.iconView !== 'normal' && (
						<SpColorPicker
							label={__('Secondary Color', 'wp-carousel-free')}
							attributes={vo.iconHoverBg ?? ''}
							attributesKey="iconHoverBg"
							setAttributes={set}
						/>
					)}
				</>
			)}
			{useCustomIcon && <Divider position="sp-w-100pct" />}
			{useCustomIcon && vo.iconView !== 'normal' && (
				<>
					<Spacing
						label={__('Border Radius', 'wp-carousel-free')}
						attributes={getIconBorderRadius()}
						attributesKey="iconBorderRadius"
						indicator="radius"
						{...createSpacingHandlers('iconBorderRadius', getIconBorderRadius)}
					/>
					<Divider />
				</>
			)}
			<Toggle
				label={__('Overlay', 'wp-carousel-free')}
				attributes={vo?.overlayEnable}
				attributesKey={'overlayEnable'}
				setAttributes={set}
			/>
			{vo?.overlayEnable && (
				<>
					<Background
						label={__('Overlay Type', 'wp-carousel-free')}
						attributes={vo?.overlayColor || { color: { style: 'bgColor', solidColor: '', gradient: '' } }}
						attributesKey="overlayColor"
						setAttributes={set}
						colorType={'color'}
						items={CONTENT_AREA_BG_ITEMS}
						colorLabel={__('Overlay Color', 'wp-carousel-free')}
					/>
				</>
			)}

			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{
					border: getVideoBorder(),
					borderWidth: getVideoBorderWidth(),
				}}
				attributesKey={{ border: 'videoBorder', borderWidth: 'videoBorderWidth' }}
				setAttributes={() => {}}
				btnType={'color'}
				onStateUpdate={(key, updateValue) => {
					const borderStyle = key === 'videoBorder' ? { [key]: updateValue } : vo?.videoBorder;
					const borderWidth = key === 'videoBorderWidth' ? { [key]: updateValue } : vo?.videoBorderWidth;
					setAttributes({
						videoOptions: {
							...vo,
							...borderStyle,
							...borderWidth,
						},
					});
				}}
			/>
			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={getVideoBorderRadius()}
				attributesKey="videoBorderRadius"
				indicator="radius"
				{...createSpacingHandlers('videoBorderRadius', getVideoBorderRadius)}
			/>
		</>
	);
}

function VideoPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody title={__('Video', 'wp-carousel-free')} opened={panelOpen} onToggle={onPanelToggle}>
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

export default memo(VideoPanel);
