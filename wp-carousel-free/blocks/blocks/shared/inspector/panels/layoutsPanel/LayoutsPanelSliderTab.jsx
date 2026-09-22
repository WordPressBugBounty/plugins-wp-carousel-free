/**
 * Layouts panel — Slider tab (autoplay, speed, effects).
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import { useDeviceType } from '../../../../../controls/controls';
import {
	Toggle,
	SPRangeControl,
	SelectField,
	SPToggleGroupControl,
} from '@wp-carousel-pro/components';
import { LAYOUT_RANGES } from '../../constants';
import { SWIPER_SINGLE_SLIDE_EFFECTS } from '../../../carousel-render/constants';
import { useOptionSetter } from '../../../hooks/useOptionSetter';

const SLIDER_BLOCK = 'wp-carousel-pro/slider';
const THUMBNAILS_SLIDER_BLOCK = 'wp-carousel-pro/thumbnails-slider';
const CAROUSEL_STYLE_STANDARD = 'standard';

const SLIDE_EFFECTS = [
	{ label: __('Slide', 'wp-carousel-free'), value: 'slide' },
	{ label: __('Flip', 'wp-carousel-free'), value: 'flip' },
	{ label: __('Cube', 'wp-carousel-free'), value: 'cube' },
	{ label: __('Fade', 'wp-carousel-free'), value: 'fade', pro: true },
	{ label: __('Coverflow', 'wp-carousel-free'), value: 'coverflow', pro: true },
	{ label: __('Ken Burns', 'wp-carousel-free'), value: 'kenburns', pro: true },
];

/** Main-stage transitions for thumbnails-slider (strip + overlay only). */
const THUMBNAILS_SLIDE_EFFECTS = [
	{ label: __('Slide', 'wp-carousel-free'), value: 'slide' },
	{ label: __('Fade', 'wp-carousel-free'), value: 'fade' },
];

const DIRECTION_OPTIONS = [
	{ label: __('Left to Right', 'wp-carousel-free'), value: 'ltr' },
	{ label: __('Right to Left', 'wp-carousel-free'), value: 'rtl' },
];
const DIRECTION_VERTICAL = [
	{ label: __('Bottom to Top', 'wp-carousel-free'), value: 'ltr' },
	{ label: __('Top to Bottom', 'wp-carousel-free'), value: 'rtl' },
];

export default memo(function LayoutsPanelSliderTab({ attributes, setAttributes, layoutType }) {
	const so = attributes.sliderOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'sliderOptions');
	const previewDeviceType = useDeviceType();
	const resetAutoplayDelay = () => set({ autoplayDelay: LAYOUT_RANGES.autoplayDelay.default });
	const resetTransitionSpeed = () => set({ speed: LAYOUT_RANGES.transitionSpeed.default });

	const isThumbnailsSliderBlock = layoutType === THUMBNAILS_SLIDER_BLOCK;
	const carouselStyle = attributes.layoutOptions?.carouselStyle ?? CAROUSEL_STYLE_STANDARD;
	const isSliderBlock = layoutType === SLIDER_BLOCK;
	const isVerticalDisplay = attributes.layoutOptions?.displayStyle === 'vertical';
	/** Swiper creative effects only apply to the standard layout (see CarouselRender). */
	const showCarouselSlideEffect =
		carouselStyle === CAROUSEL_STYLE_STANDARD &&
		!isVerticalDisplay &&
		!isThumbnailsSliderBlock &&
		!isSliderBlock;
	const showSlideEffect = showCarouselSlideEffect || isThumbnailsSliderBlock;
	const slideEffect = isVerticalDisplay ? 'slide' : so.effect ?? 'slide';
	/** Fade and cube always advance one slide; slidesPerGroup is forced to 1 on the frontend. */
	const showSlidesToScroll =
		!isSliderBlock && !isThumbnailsSliderBlock && !SWIPER_SINGLE_SLIDE_EFFECTS.has(slideEffect);

	const slidesScrollValue = {
		device: {
			Desktop: so.slidesToScroll ?? 1,
			Tablet: so.slidesToScrollTablet ?? so.slidesToScroll ?? 1,
			Mobile: so.slidesToScrollMobile ?? so.slidesToScroll ?? 1,
		},
	};
	const resetSlidesToScrollForDevice = () => {
		const map = {
			Desktop: 'slidesToScroll',
			Tablet: 'slidesToScrollTablet',
			Mobile: 'slidesToScrollMobile',
		};
		const device = previewDeviceType ?? 'Desktop';
		set({
			[map[device] ?? 'slidesToScroll']:
				LAYOUT_RANGES.slidesToScroll.default[device] ?? LAYOUT_RANGES.slidesToScroll.default.Desktop,
		});
	};
	return (
		<>
			<Toggle
				label={__('AutoPlay', 'wp-carousel-free')}
				attributes={so.autoplay ?? false}
				attributesKey="autoplay"
				setAttributes={set}
			/>
			{so.autoplay && (
				<SPRangeControl
					label={__('AutoPlay Delay (ms)', 'wp-carousel-free')}
					attributes={so.autoplayDelay ?? LAYOUT_RANGES.autoplayDelay.default}
					attributesKey="tempAutoplayDelay"
					setAttributes={() => {}}
					showResponsiveIcon={false}
					setCustomReset={resetAutoplayDelay}
					onValueChange={({ value }) => {
						set({ autoplayDelay: value });
					}}
					min={LAYOUT_RANGES.autoplayDelay.min}
					max={LAYOUT_RANGES.autoplayDelay.max}
					step={LAYOUT_RANGES.autoplayDelay.step}
					defaultValue={LAYOUT_RANGES.autoplayDelay.default}
					units={false}
				/>
			)}
			<SPRangeControl
				label={__('Transition Speed (ms)', 'wp-carousel-free')}
				attributes={so.speed ?? LAYOUT_RANGES.transitionSpeed.default}
				attributesKey="tempSpeed"
				setAttributes={() => {}}
				showResponsiveIcon={false}
				setCustomReset={resetTransitionSpeed}
				onValueChange={({ value }) => {
					set({ speed: value });
				}}
				min={LAYOUT_RANGES.transitionSpeed.min}
				max={LAYOUT_RANGES.transitionSpeed.max}
				step={LAYOUT_RANGES.transitionSpeed.step}
				defaultValue={LAYOUT_RANGES.transitionSpeed.default}
				units={false}
			/>

			{showSlidesToScroll && (
				<SPRangeControl
					label={__('Slides to Scroll', 'wp-carousel-free')}
					attributes={slidesScrollValue}
					attributesKey="tempSlidesScroll"
					setAttributes={() => {}}
					onValueChange={({ value, deviceType }) => {
						const map = {
							Desktop: 'slidesToScroll',
							Tablet: 'slidesToScrollTablet',
							Mobile: 'slidesToScrollMobile',
						};
						set({ [map[deviceType]]: value });
					}}
					min={LAYOUT_RANGES.slidesToScroll.min}
					max={LAYOUT_RANGES.slidesToScroll.max}
					defaultValue={LAYOUT_RANGES.slidesToScroll.default}
					setCustomReset={resetSlidesToScrollForDevice}
					units={false}
				/>
			)}
			{so.autoplay && (
				<SPToggleGroupControl
					label={__('Direction', 'wp-carousel-free')}
					attributes={so.direction === 'rtl' ? 'rtl' : 'ltr'}
					attributesKey="direction"
					setAttributes={set}
					items={isVerticalDisplay ? DIRECTION_VERTICAL : DIRECTION_OPTIONS}
					flexStyle={false}
				/>
			)}
			{so.autoplay && (
				<Toggle
					label={__('Pause on Hover', 'wp-carousel-free')}
					attributes={so.pauseOnHover ?? true}
					attributesKey="pauseOnHover"
					setAttributes={set}
				/>
			)}
			<Toggle
				label={__('Infinite Loop', 'wp-carousel-free')}
				attributes={so.infiniteLoop ?? true}
				attributesKey="infiniteLoop"
				setAttributes={set}
			/>
			<Toggle
				label={__('Adaptive Height', 'wp-carousel-free')}
				attributes={so.adaptiveHeight ?? false}
				attributesKey="adaptiveHeight"
				setAttributes={set}
				onlyPro
			/>
			<Toggle
				label={__('Keyboard Navigation', 'wp-carousel-free')}
				attributes={so.keyboardNav ?? true}
				attributesKey="keyboardNav"
				setAttributes={set}
			/>
			<Toggle
				label={__('Mouse Wheel Control', 'wp-carousel-free')}
				attributes={so.mousewheel ?? false}
				attributesKey="mousewheel"
				setAttributes={set}
			/>
			{!isSliderBlock && !isThumbnailsSliderBlock && (
				<Toggle
					label={__('Free Scroll Mode', 'wp-carousel-free')}
					attributes={so.freeScroll ?? false}
					attributesKey="freeScroll"
					setAttributes={set}
				/>
			)}
			{showSlideEffect && (
				<SelectField
					label={__('Slide Effect', 'wp-carousel-free')}
					attributes={so.effect ?? 'slide'}
					attributesKey="effect"
					setAttributes={set}
					items={isThumbnailsSliderBlock ? THUMBNAILS_SLIDE_EFFECTS : SLIDE_EFFECTS}
					flexStyle={false}
				/>
			)}
		</>
	);
});
