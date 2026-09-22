/**
 * Social Share Panel.
 * Shown for: all sources. The per-item sharing upsell shows for image and video —
 * the sources with a per-item edit popup carrying a Pro sharing override.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo, useState } from '@wordpress/element';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import {
	SPRangeControl,
	ButtonSet,
	MultiSelectDndKit,
	TabControls,
	SpColorPicker,
	SPToggleGroupControl,
	Divider,
	Spacing,
	Toggle,
	SpProNotice,
} from '@wp-carousel-pro/components';
import { PRO_SOCIAL_SHARE, PRO_SOCIAL_SHARE_VIDEO } from '../../constants/proFeatures';

const NETWORKS = [
	{ label: __('Facebook', 'wp-carousel-free'), value: 'facebook-f' },
	{ label: __('Twitter-X', 'wp-carousel-free'), value: 'x' },
	{ label: __('LinkedIn', 'wp-carousel-free'), value: 'linkedin-in' },
	{ label: __('Pinterest', 'wp-carousel-free'), value: 'pinterest' },
	{ label: __('Email', 'wp-carousel-free'), value: 'mail' },
	{ label: __('Instagram', 'wp-carousel-free'), value: 'instagram' },
	{ label: __('VK', 'wp-carousel-free'), value: 'vkontakte' },
	{ label: __('Digg', 'wp-carousel-free'), value: 'digg' },
	{ label: __('Tumblr', 'wp-carousel-free'), value: 'tumblr' },
	{ label: __('Reddit', 'wp-carousel-free'), value: 'reddit' },
	{ label: __('WhatsApp', 'wp-carousel-free'), value: 'whatsapp' },
	{ label: __('Pocket', 'wp-carousel-free'), value: 'pocket' },
	{ label: __('Xing', 'wp-carousel-free'), value: 'xing' },
	{ label: __('Copy Post URL', 'wp-carousel-free'), value: 'clone' },
];

const ICON_VIEWS = [
	{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
	{ label: __('Stacked', 'wp-carousel-free'), value: 'stacked' },
	{ label: __('Framed', 'wp-carousel-free'), value: 'framed' },
];

function GeneralTab({ attributes, setAttributes }) {
	const ss = attributes.socialShareOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'socialShareOptions');

	// Default values for responsive controls
	const iconSizeDefault = {
		device: { Desktop: 20, Tablet: 18, Mobile: 16 },
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
	};
	const iconAreaSizeDefault = {
		device: { Desktop: 40, Tablet: 36, Mobile: 32 },
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
	};
	const gapDefault = {
		device: { Desktop: 10, Tablet: 8, Mobile: 6 },
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
	};

	const iconSize = ss.iconSize || iconSizeDefault;
	const iconAreaSize = ss.iconAreaSize || iconAreaSizeDefault;
	const gap = ss.gap || gapDefault;

	return (
		<>
			<MultiSelectDndKit
				label={__('Social Media', 'wp-carousel-free')}
				attributes={ss?.networks ?? ['facebook-f', 'x', 'linkedin-in']}
				attributesKey="networks"
				setAttributes={set}
				options={NETWORKS}
				// Reordering Social Media is Pro; Free can only add/remove items.
				sortable={false}
			/>
			<ButtonSet
				label={__('Icon View', 'wp-carousel-free')}
				attributes={ss?.iconView ?? 'stacked'}
				attributesKey="iconView"
				setAttributes={set}
				items={ICON_VIEWS}
				columns={3}
			/>
			<SPRangeControl
				label={__('Icon Size', 'wp-carousel-free')}
				attributes={iconSize}
				attributesKey="iconSize"
				setAttributes={() => {}}
				onValueChange={({ value, deviceType }) => {
					set({ iconSize: { ...iconSize, device: { ...iconSize?.device, [deviceType]: value } } });
				}}
				onUnitChange={({ unit, deviceType }) => {
					set({ iconSize: { ...iconSize, unit: { ...iconSize?.unit, [deviceType]: unit } } });
				}}
				onReset={({ value, unit, deviceType }) => {
					set({
						iconSize: {
							...iconSize,
							device: { ...iconSize?.device, [deviceType]: value },
							unit: { ...iconSize?.unit, [deviceType]: unit },
						},
					});
				}}
				units={['px', 'rem', 'em']}
				min={10}
				max={60}
				defaultValue={iconSizeDefault}
			/>
			{ss?.iconView !== 'normal' && (
				<SPRangeControl
					label={__('Icon Area Size', 'wp-carousel-free')}
					attributes={iconAreaSize}
					attributesKey="iconAreaSize"
					setAttributes={() => {}}
					onValueChange={({ value, deviceType }) => {
						set({
							iconAreaSize: { ...iconAreaSize, device: { ...iconAreaSize?.device, [deviceType]: value } },
						});
					}}
					onUnitChange={({ unit, deviceType }) => {
						set({
							iconAreaSize: { ...iconAreaSize, unit: { ...iconAreaSize?.unit, [deviceType]: unit } },
						});
					}}
					onReset={({ value, unit, deviceType }) => {
						set({
							iconAreaSize: {
								...iconAreaSize,
								device: { ...iconAreaSize?.device, [deviceType]: value },
								unit: { ...iconAreaSize?.unit, [deviceType]: unit },
							},
						});
					}}
					min={10}
					max={80}
					defaultValue={iconAreaSizeDefault}
					units={['px', 'rem', 'em']}
				/>
			)}
			<SPRangeControl
				label={__('Gap Between Icons', 'wp-carousel-free')}
				attributes={gap}
				attributesKey="gap"
				setAttributes={() => {}}
				onValueChange={({ value, deviceType }) => {
					set({ gap: { ...gap, device: { ...gap.device, [deviceType]: value } } });
				}}
				onUnitChange={({ unit, deviceType }) => {
					set({ gap: { ...gap, unit: { ...gap?.unit, [deviceType]: unit } } });
				}}
				onReset={({ value, unit, deviceType }) => {
					set({
						gap: {
							...gap,
							device: { ...gap?.device, [deviceType]: value },
							unit: { ...gap?.unit, [deviceType]: unit },
						},
					});
				}}
				min={0}
				max={40}
				defaultValue={gapDefault}
				units={['px', 'rem', 'em']}
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const ss = attributes.socialShareOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'socialShareOptions');
	const [stateTab, setStateTab] = useState('normal');

	// Normalize spacing attributes for Spacing component
	const createSpacingDefaults = (initial = 0) => ({
		allChange: true,
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		device: {
			Desktop: { top: initial, right: initial, bottom: initial, left: initial },
		},
	});

	const normalizeSpacingAttr = (value, fallback = 0) => {
		if (value && typeof value === 'object' && value.device && value.unit) {
			return value;
		}
		const initial = Number.isFinite(Number(value)) ? Number(value) : fallback;
		return createSpacingDefaults(initial);
	};

	const borderRadius = normalizeSpacingAttr(ss?.borderRadius, 0);
	const margin = normalizeSpacingAttr(ss?.margin, 0);
	// Framed view draws an outline instead of a fill, so the color labels follow suit.
	const isFramed = ss?.iconView === 'framed';
	return (
		<>
			<Toggle
				label={__('Custom Styling', 'wp-carousel-free')}
				attributes={ss.customStyling ?? false}
				attributesKey="customStyling"
				setAttributes={set}
			/>
			{ss?.customStyling && (
				<>
					<SPToggleGroupControl
						attributes={stateTab}
						items={[
							{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
							{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
						]}
						onClick={setStateTab}
					/>

					{stateTab === 'normal' && (
						<>
							<SpColorPicker
								label={__('Icon Color', 'wp-carousel-free')}
								attributes={ss?.iconColor ?? ''}
								attributesKey="iconColor"
								setAttributes={set}
							/>
							{ss?.iconView !== 'normal' && (
								<SpColorPicker
									label={
										isFramed
											? __('Border Color', 'wp-carousel-free')
											: __('Background Color', 'wp-carousel-free')
									}
									attributes={ss?.iconBg ?? ''}
									attributesKey="iconBg"
									setAttributes={set}
								/>
							)}
						</>
					)}

					{stateTab === 'hover' && (
						<>
							<SpColorPicker
								label={__('Icon Hover Color', 'wp-carousel-free')}
								attributes={ss?.iconHoverColor ?? ''}
								attributesKey="iconHoverColor"
								setAttributes={set}
							/>
							{ss?.iconView !== 'normal' && (
								<SpColorPicker
									label={
										isFramed
											? __('Border Hover Color', 'wp-carousel-free')
											: __('Background Hover Color', 'wp-carousel-free')
									}
									attributes={ss?.iconHoverBg ?? ''}
									attributesKey="iconHoverBg"
									setAttributes={set}
								/>
							)}
						</>
					)}
					<Divider />
				</>
			)}

			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={borderRadius}
				attributesKey="borderRadius"
				setAttributes={set}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 0, right: 0, bottom: 0, left: 0 },
					device: createSpacingDefaults(0).device,
				}}
				indicator="radius"
			/>
			<Spacing
				label={__('Margin', 'wp-carousel-free')}
				attributes={margin}
				attributesKey="margin"
				setAttributes={set}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 0, right: 0, bottom: 0, left: 0 },
					device: createSpacingDefaults(0).device,
				}}
			/>
		</>
	);
}

function SocialSharePanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody
			title={__('Social Share', 'wp-carousel-free')}
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
			{'image' === attributes.sourceType && (
				<SpProNotice
					className="is-upsell"
					message={PRO_SOCIAL_SHARE.message}
					linkText={PRO_SOCIAL_SHARE.linkText}
				/>
			)}
			{'video' === attributes.sourceType && (
				<SpProNotice
					className="is-upsell"
					message={PRO_SOCIAL_SHARE_VIDEO.message}
					linkText={PRO_SOCIAL_SHARE_VIDEO.linkText}
				/>
			)}
		</PanelBody>
	);
}

export default memo(SocialSharePanel);
