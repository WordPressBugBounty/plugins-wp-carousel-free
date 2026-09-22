/**
 * Layouts panel — Marquee tab (scroll direction, scroll speed, pause on hover,
 * play/pause button, fade edges).
 *
 * Marquee reuses the carousel "ticker" engine (carouselStyle locked to
 * `ticker`), so these controls drive `sliderOptions` motion settings and the
 * `layoutOptions` fade-edge settings. Orientation and the vertical Ticker
 * Height live in the Settings tab alongside the other layout controls.
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import {
	Toggle,
	SPRangeControl,
	SPToggleGroupControl,
	SpColorPicker,
	InfoIcon,
} from '@wp-carousel-pro/components';
import { LAYOUT_RANGES } from '../../constants';
import { useOptionSetter } from '../../../hooks/useOptionSetter';

// eslint-disable-next-line jsdoc/require-jsdoc
const LabelWithInfo = ({ label, tooltip }) => (
	<>
		<span>{label}</span>
		<InfoIcon tooltip={tooltip} label={__('More info', 'wp-carousel-free')} />
	</>
);

const DIRECTION_OPTIONS = [
	{ label: __('Left to Right', 'wp-carousel-free'), value: 'ltr' },
	{ label: __('Right to Left', 'wp-carousel-free'), value: 'rtl' },
];

export default memo(function LayoutsPanelMarqueeTab({ attributes, setAttributes }) {
	const lo = attributes.layoutOptions || {};
	const so = attributes.sliderOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'layoutOptions');
	const setSlider = useOptionSetter(attributes, setAttributes, 'sliderOptions');

	return (
		<>
			<SPToggleGroupControl
				label={__('Scroll Direction', 'wp-carousel-free')}
				attributes={so.direction === 'rtl' ? 'rtl' : 'ltr'}
				attributesKey="direction"
				setAttributes={setSlider}
				items={DIRECTION_OPTIONS}
				flexStyle={false}
			/>
			<SPRangeControl
				label={
					<LabelWithInfo
						label={__('Scroll Speed (ms)', 'wp-carousel-free')}
						tooltip={__(
							'Higher values scroll more slowly. Applies to horizontal and vertical.',
							'wp-carousel-free'
						)}
					/>
				}
				attributes={so.tickerSpeed ?? LAYOUT_RANGES.tickerSpeed.default}
				attributesKey="tickerSpeed"
				setAttributes={() => {}}
				onValueChange={({ value }) => setSlider({ tickerSpeed: value })}
				min={LAYOUT_RANGES.tickerSpeed.min}
				max={LAYOUT_RANGES.tickerSpeed.max}
				step={LAYOUT_RANGES.tickerSpeed.step}
				defaultValue={LAYOUT_RANGES.tickerSpeed.default}
				showResponsiveIcon={false}
				units={false}
			/>
			<Toggle
				label={__('Pause on Hover', 'wp-carousel-free')}
				attributes={so.pauseOnHover ?? true}
				attributesKey="pauseOnHover"
				setAttributes={setSlider}
			/>
			<Toggle
				label={
					<LabelWithInfo
						label={__('Play/Pause Button', 'wp-carousel-free')}
						tooltip={__(
							'Show a button that lets visitors pause and resume the marquee (recommended for accessibility).',
							'wp-carousel-free'
						)}
					/>
				}
				attributes={so.showPlayPause ?? true}
				attributesKey="showPlayPause"
				setAttributes={setSlider}
			/>
			<Toggle
				label={
					<LabelWithInfo
						label={__('Fade Edges', 'wp-carousel-free')}
						tooltip={__(
							'Fade the marquee in and out at its edges for a softer loop.',
							'wp-carousel-free'
						)}
					/>
				}
				attributes={lo.tickerGradient ?? false}
				attributesKey="tickerGradient"
				setAttributes={set}
			/>
			{lo.tickerGradient && (
				<>
					<SPRangeControl
						label={__('Fade Width', 'wp-carousel-free')}
						attributes={lo.tickerGradientWidth ?? 100}
						attributesKey="tickerGradientWidth"
						setAttributes={() => {}}
						onValueChange={({ value }) => set({ tickerGradientWidth: value })}
						min={0}
						max={500}
						step={1}
						defaultValue={100}
						showResponsiveIcon={false}
						units={false}
					/>
					<SpColorPicker
						label={__('Fade Color', 'wp-carousel-free')}
						attributes={lo.tickerGradientColor ?? '#ffffff'}
						attributesKey="tickerGradientColor"
						setAttributes={set}
					/>
				</>
			)}
		</>
	);
});
