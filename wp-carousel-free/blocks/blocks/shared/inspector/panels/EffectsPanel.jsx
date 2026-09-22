/**
 * Effects Panel – hover, overlay, content animation.
 * Shown for: all sources.
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import { SelectField, SPRangeControl, SpProNotice } from '@wp-carousel-pro/components';
import ToggleGroupControl from '@wp-carousel-pro/components/toggleGroupControl/toggleGroupControl';
import { PRO_HOVER_ANIMATION } from '../../constants/proFeatures';

// Scale and Animation Duration are Pro on every axis, so both rows are locked
// and Free renders every effect at the static 300ms in the stylesheet.
const DURATION_RANGE = { min: 100, max: 2000, step: 50, defaultValue: 300 };
const HOVER_SCALE_RANGE = { min: 1, max: 2, step: 0.01, defaultValue: 1.05 };

const ANIMATION_TYPE = [
	{ label: __('Premade', 'wp-carousel-free'), value: 'premade' },
	{ label: __('Custom', 'wp-carousel-free'), value: 'custom' },
];

// Every list below runs Free options first, then the Pro ones — SelectField
// draws a `pro` item as a disabled `(Pro)` option and refuses the write.
const PREMADE_ANIMATIONS = [
	{ label: __('None', 'wp-carousel-free'), value: 'none' },
	{ label: __('Move Left', 'wp-carousel-free'), value: 'move-left' },
	{ label: __('Move Right', 'wp-carousel-free'), value: 'move-right' },
	{ label: __('Move Top', 'wp-carousel-free'), value: 'move-top' },
	{ label: __('Move Bottom', 'wp-carousel-free'), value: 'move-bottom' },
	{ label: __('Jazz', 'wp-carousel-free'), value: 'jazz', pro: true },
	{ label: __('Apollo', 'wp-carousel-free'), value: 'apollo', pro: true },
	{ label: __('Selena', 'wp-carousel-free'), value: 'selena', pro: true },
	{ label: __('Oscar', 'wp-carousel-free'), value: 'oscar', pro: true },
	{ label: __('Layla', 'wp-carousel-free'), value: 'layla', pro: true },
	{ label: __('Bubba', 'wp-carousel-free'), value: 'bubba', pro: true },
	{ label: __('Push Image', 'wp-carousel-free'), value: 'pushImage', pro: true },
	{ label: __('Flash', 'wp-carousel-free'), value: 'flash', pro: true },
	{ label: __('Fold Up', 'wp-carousel-free'), value: 'foldUp', pro: true },
	{ label: __('Ripple Expand', 'wp-carousel-free'), value: 'rippleExpand', pro: true },
	{ label: __('Curtain Close', 'wp-carousel-free'), value: 'curtainClose', pro: true },
];

const IMAGE_HOVER = [
	{ label: __('None', 'wp-carousel-free'), value: 'none' },
	{ label: __('Zoom In', 'wp-carousel-free'), value: 'zoom' },
	{ label: __('Zoom Out', 'wp-carousel-free'), value: 'zoom-out' },
	{ label: __('Move Left', 'wp-carousel-free'), value: 'move-left', pro: true },
	{ label: __('Move Right', 'wp-carousel-free'), value: 'move-right', pro: true },
	{ label: __('Move Top', 'wp-carousel-free'), value: 'move-top', pro: true },
	{ label: __('Move Bottom', 'wp-carousel-free'), value: 'move-bottom', pro: true },
	{ label: __('Rotate', 'wp-carousel-free'), value: 'rotate', pro: true },
	{ label: __('Grow Rotate', 'wp-carousel-free'), value: 'grow-rotate', pro: true },
	{ label: __('Shine', 'wp-carousel-free'), value: 'shine', pro: true },
	{ label: __('Shine and Zoom In', 'wp-carousel-free'), value: 'shine-zoom-in', pro: true },
	{ label: __('Shine and Zoom Out', 'wp-carousel-free'), value: 'shine-zoom-out', pro: true },
];

const OVERLAY_EFFECT = [
	{ label: __('None', 'wp-carousel-free'), value: 'none' },
	{ label: __('Zoom Out', 'wp-carousel-free'), value: 'zoomOut' },
	{ label: __('Zoom In', 'wp-carousel-free'), value: 'zoomInCenter' },
	{ label: __('Simple Fade In', 'wp-carousel-free'), value: 'simpleFadeIn', pro: true },
	{ label: __('Slide In Left', 'wp-carousel-free'), value: 'slideInFromLeft', pro: true },
	{ label: __('Slide In Right', 'wp-carousel-free'), value: 'slideInFromRight', pro: true },
	{ label: __('Slide In Top', 'wp-carousel-free'), value: 'slideInFromTop', pro: true },
	{ label: __('Slide In Bottom', 'wp-carousel-free'), value: 'slideInFromBottom', pro: true },
	{ label: __('Slide In Top Left', 'wp-carousel-free'), value: 'slideFromTopLeft', pro: true },
	{ label: __('Slide In Top Right', 'wp-carousel-free'), value: 'slideFromTopRight', pro: true },
	{ label: __('Slide In Bottom Left', 'wp-carousel-free'), value: 'slideFromBottomLeft', pro: true },
	{
		label: __('Slide In Bottom Right', 'wp-carousel-free'),
		value: 'slideFromBottomRight',
		pro: true,
	},
	{ label: __('Directional Slide', 'wp-carousel-free'), value: 'directionalSlide', pro: true },
	{ label: __('Venetian Blind H', 'wp-carousel-free'), value: 'venetianBlindH', pro: true },
	{ label: __('Venetian Blind V', 'wp-carousel-free'), value: 'venetianBlindV', pro: true },
	{ label: __('Diagonal Wipe Left to Right', 'wp-carousel-free'), value: 'diagonalWipe', pro: true },
	{
		label: __('Diagonal Wipe Right to Left', 'wp-carousel-free'),
		value: 'diagonalWipeReverse',
		pro: true,
	},
	{ label: __('Expand From Center', 'wp-carousel-free'), value: 'expandFromCenter', pro: true },
	{ label: __('Circle Expand', 'wp-carousel-free'), value: 'circleExpand', pro: true },
	{ label: __('Circle from Top', 'wp-carousel-free'), value: 'circleFromTop', pro: true },
	{ label: __('Circle from Bottom', 'wp-carousel-free'), value: 'circleFromBottom', pro: true },
	{ label: __('Circle from Top Corner', 'wp-carousel-free'), value: 'circleFromCorner', pro: true },
	{
		label: __('Circle from Bottom Corner', 'wp-carousel-free'),
		value: 'circleFromBottomCorner',
		pro: true,
	},
	{ label: __('Rotate Fade', 'wp-carousel-free'), value: 'rotateFade', pro: true },
	{ label: __('Spin From Center', 'wp-carousel-free'), value: 'spinFromCenter', pro: true },
	{ label: __('Split Top Bottom', 'wp-carousel-free'), value: 'splitTopBottom', pro: true },
	{ label: __('Split Left Right', 'wp-carousel-free'), value: 'splitLeftRight', pro: true },
	{ label: __('Four Corner Split', 'wp-carousel-free'), value: 'fourCornerSplit', pro: true },
	{ label: __('Fold Down From Top', 'wp-carousel-free'), value: 'foldDownFromTop', pro: true },
	{ label: __('Fold Up From Bottom', 'wp-carousel-free'), value: 'foldUpFromBottom', pro: true },
	{ label: __('3D Tilt Overlay', 'wp-carousel-free'), value: '3DTiltOverlay', pro: true },
	{ label: __('Ripple Expand', 'wp-carousel-free'), value: 'rippleExpand', pro: true },
	{
		label: __('Ripple Expand From Bottom', 'wp-carousel-free'),
		value: 'rippleExpandFromBottom',
		pro: true,
	},
	{ label: __('Push Image Left', 'wp-carousel-free'), value: 'pushImageLeft', pro: true },
	{ label: __('Push Image Right', 'wp-carousel-free'), value: 'pushImageRight', pro: true },
	{ label: __('Push Image Up', 'wp-carousel-free'), value: 'pushImageUp', pro: true },
	{ label: __('Push Image Down', 'wp-carousel-free'), value: 'pushImageDown', pro: true },
];

// The Effects panel's own content list — the Slider panel's CONTENT_ANIMATIONS
// is a different feature with a different Free subset.
const CONTENT_EFFECT = [
	{ label: __('None', 'wp-carousel-free'), value: 'none' },
	{ label: __('Zoom In', 'wp-carousel-free'), value: 'zoomIn' },
	{ label: __('Zoom In Down', 'wp-carousel-free'), value: 'zoomInDown' },
	{ label: __('Zoom In Left', 'wp-carousel-free'), value: 'zoomInLeft' },
	{ label: __('Zoom In Right', 'wp-carousel-free'), value: 'zoomInRight' },
	{ label: __('Zoom In Up', 'wp-carousel-free'), value: 'zoomInUp', pro: true },
	{ label: __('Bounce', 'wp-carousel-free'), value: 'bounce', pro: true },
	{ label: __('Flash', 'wp-carousel-free'), value: 'flash', pro: true },
	{ label: __('Pulse', 'wp-carousel-free'), value: 'pulse', pro: true },
	{ label: __('Rubber Band', 'wp-carousel-free'), value: 'rubberBand', pro: true },
	{ label: __('Shake X', 'wp-carousel-free'), value: 'shakeX', pro: true },
	{ label: __('Shake Y', 'wp-carousel-free'), value: 'shakeY', pro: true },
	{ label: __('Head Shake', 'wp-carousel-free'), value: 'headShake', pro: true },
	{ label: __('Swing', 'wp-carousel-free'), value: 'swing', pro: true },
	{ label: __('Tada', 'wp-carousel-free'), value: 'tada', pro: true },
	{ label: __('Wobble', 'wp-carousel-free'), value: 'wobble', pro: true },
	{ label: __('Jello', 'wp-carousel-free'), value: 'jello', pro: true },
	{ label: __('Heart Beat', 'wp-carousel-free'), value: 'heartBeat', pro: true },
	{ label: __('Slide In Down', 'wp-carousel-free'), value: 'slideInDown', pro: true },
	{ label: __('Slide In Left', 'wp-carousel-free'), value: 'slideInLeft', pro: true },
	{ label: __('Slide In Right', 'wp-carousel-free'), value: 'slideInRight', pro: true },
	{ label: __('Slide In Up', 'wp-carousel-free'), value: 'slideInUp', pro: true },
	{ label: __('Back In Down', 'wp-carousel-free'), value: 'backInDown', pro: true },
	{ label: __('Back In Left', 'wp-carousel-free'), value: 'backInLeft', pro: true },
	{ label: __('Back In Right', 'wp-carousel-free'), value: 'backInRight', pro: true },
	{ label: __('Back In Up', 'wp-carousel-free'), value: 'backInUp', pro: true },
	{ label: __('Bounce In', 'wp-carousel-free'), value: 'bounceIn', pro: true },
	{ label: __('Bounce In Down', 'wp-carousel-free'), value: 'bounceInDown', pro: true },
	{ label: __('Bounce In Left', 'wp-carousel-free'), value: 'bounceInLeft', pro: true },
	{ label: __('Bounce In Right', 'wp-carousel-free'), value: 'bounceInRight', pro: true },
	{ label: __('Bounce In Up', 'wp-carousel-free'), value: 'bounceInUp', pro: true },
	{ label: __('Fade In', 'wp-carousel-free'), value: 'fadeIn', pro: true },
	{ label: __('Fade In Down', 'wp-carousel-free'), value: 'fadeInDown', pro: true },
	{ label: __('Fade In Left', 'wp-carousel-free'), value: 'fadeInLeft', pro: true },
	{ label: __('Fade In Right', 'wp-carousel-free'), value: 'fadeInRight', pro: true },
	{ label: __('Fade In Up', 'wp-carousel-free'), value: 'fadeInUp', pro: true },
	{ label: __('Flip In X', 'wp-carousel-free'), value: 'flipInX', pro: true },
	{ label: __('Light Speed In Right', 'wp-carousel-free'), value: 'lightSpeedInRight', pro: true },
	{ label: __('Light Speed In Left', 'wp-carousel-free'), value: 'lightSpeedInLeft', pro: true },
];

/**
 * Locked Animation Duration row — Pro on every axis, so it shows the shared
 * default and writes nothing.
 *
 * @return {Element} The disabled range control.
 */
const ProDurationControl = () => (
	<SPRangeControl
		label={__('Animation Duration', 'wp-carousel-free')}
		attributes={DURATION_RANGE.defaultValue}
		min={DURATION_RANGE.min}
		step={DURATION_RANGE.step}
		max={DURATION_RANGE.max}
		staticUnit="ms"
		defaultValue={DURATION_RANGE.defaultValue}
		showResponsiveIcon={false}
		onlyPro
	/>
);

function EffectsPanel({ attributes, setAttributes, panelOpen, onPanelToggle }) {
	const eo = attributes.effectsOptions || {};
	const set = (updates) => setAttributes({ effectsOptions: { ...eo, ...updates } });
	const { effectType, animationEffect, imageHover, overlayEffect, contentAnimation } = eo;

	return (
		<PanelBody
			title={__('Hover Animations', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
			<ToggleGroupControl
				label={__('Effects and Animation Type', 'wp-carousel-free')}
				attributes={effectType}
				attributesKey={'effectType'}
				setAttributes={set}
				items={ANIMATION_TYPE}
			/>

			{effectType === 'premade' && (
				<>
					<SelectField
						label={__('Choose an Animation Effect', 'wp-carousel-free')}
						attributes={animationEffect}
						attributesKey={'animationEffect'}
						setAttributes={set}
						items={PREMADE_ANIMATIONS}
					/>
					<ProDurationControl />
				</>
			)}

			{effectType === 'custom' && (
				<>
					<SelectField
						label={__('Image Effects', 'wp-carousel-free')}
						attributes={imageHover}
						attributesKey="imageHover"
						setAttributes={set}
						items={IMAGE_HOVER}
						flexStyle={false}
					/>
					<SPRangeControl
						label={__('Scale', 'wp-carousel-free')}
						attributes={HOVER_SCALE_RANGE.defaultValue}
						min={HOVER_SCALE_RANGE.min}
						step={HOVER_SCALE_RANGE.step}
						max={HOVER_SCALE_RANGE.max}
						defaultValue={HOVER_SCALE_RANGE.defaultValue}
						showResponsiveIcon={false}
						onlyPro
					/>
					<ProDurationControl />

					<SelectField
						label={__('Overlay Effects', 'wp-carousel-free')}
						attributes={overlayEffect}
						attributesKey="overlayEffect"
						setAttributes={set}
						items={OVERLAY_EFFECT}
						flexStyle={false}
					/>
					<ProDurationControl />

					<SelectField
						label={__('Content Effects', 'wp-carousel-free')}
						attributes={contentAnimation}
						attributesKey="contentAnimation"
						setAttributes={set}
						items={CONTENT_EFFECT}
						flexStyle={false}
					/>
					<ProDurationControl />
				</>
			)}

			<SpProNotice
				className="is-upsell"
				message={PRO_HOVER_ANIMATION.message}
				linkText={PRO_HOVER_ANIMATION.linkText}
			/>
		</PanelBody>
	);
}

export default memo(EffectsPanel);
