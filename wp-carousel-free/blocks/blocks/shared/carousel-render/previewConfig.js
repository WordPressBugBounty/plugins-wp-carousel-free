/**
 * Pure derivation of everything the editor preview needs from block
 * attributes + the active editor device. No DOM access, no hooks — keeps
 * `CarouselRender.jsx` focused on refs, effects, and layout dispatch.
 */

import {
	ORIENTATION_CLASSES,
	VARIABLE_WIDTH_EXCLUDED_STYLES,
	SWIPER_SINGLE_SLIDE_EFFECTS,
} from './constants';
import { resolveContentOrientation } from '../inspector/fragments/contentOrientations';
import {
	defaultNavPosition,
	resolveNavPosition,
	resolvePaginationStyle,
} from '../constants/freeValues';

/**
 * @param {Object} attributes   Block attributes.
 * @param {string} activeDevice `Desktop` | `Tablet` | `Mobile`.
 * @return {Object} Derived preview configuration (style, responsive maps,
 *                  Swiper behavior flags, and the remount `swiperKey`).
 */
export default function buildPreviewConfig(attributes, activeDevice) {
	const {
		layoutOptions = {},
		sliderOptions = {},
		blockName = 'carousel',
		sourceType = 'image',
	} = attributes;

	let style = layoutOptions.carouselStyle || 'standard';
	// Marquee and Panorama each own one engine, so the style is pinned rather
	// than picked. Keyed on the saved `blockName` because that is all this
	// function receives — a spoofed value can only change an editor preview,
	// since neither block has a PHP render path.
	if ('carousel-panorama' === blockName) {
		style = 'panorama';
	}
	if ('marquee' === blockName) {
		style = 'ticker';
	}
	const contentOrientation = resolveContentOrientation(
		sourceType,
		layoutOptions.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const orientationClass = ORIENTATION_CLASSES[contentOrientation] || '';
	const displayStyle = layoutOptions.displayStyle || 'horizontal';
	const isVertical = displayStyle === 'vertical' && ['standard', 'center'].includes(style);
	// The vertical marquee is a separate component, not a Swiper axis flip.
	const isTickerVertical = 'ticker' === style && 'vertical' === displayStyle;
	const columns = {
		Desktop: layoutOptions.columns ?? 3,
		Tablet: layoutOptions.columnsTablet ?? 2,
		Mobile: layoutOptions.columnsMobile ?? 1,
	};
	const gapNum = {
		Desktop: layoutOptions.gap ?? 20,
		Tablet: layoutOptions.gapTablet ?? 20,
		Mobile: layoutOptions.gapMobile ?? 10,
	};
	const gapUnit = {
		Desktop: String(layoutOptions.gapUnit || 'px').toLowerCase(),
		Tablet: String(layoutOptions.gapTabletUnit || 'px').toLowerCase(),
		Mobile: String(layoutOptions.gapMobileUnit || 'px').toLowerCase(),
	};
	const showNav = layoutOptions.navigation !== false;
	const showPagin = layoutOptions.pagination !== false;
	const paginationOptions = attributes.paginationDotsOptions ?? {};
	const navigationOptions = attributes.navigationOptions ?? {};
	const navigationPosition = resolveNavPosition(
		navigationOptions.position,
		defaultNavPosition(blockName)
	);
	const isTiles = blockName === 'tiles' || style === 'grid';
	const effectiveVariableWidth =
		!!layoutOptions.variableWidth &&
		displayStyle !== 'vertical' &&
		!isTiles &&
		!VARIABLE_WIDTH_EXCLUDED_STYLES.has(style);

	const autoplay = sliderOptions.autoplay === true;
	const speed = Number(sliderOptions.speed ?? 500);
	const delay = Number(sliderOptions.autoplayDelay ?? 3000);
	const pauseHover = sliderOptions.pauseOnHover !== false;
	const loop = sliderOptions.infiniteLoop !== false;
	const rawEffect = sliderOptions.effect || 'slide';
	// Vertical Swiper and the Center style only support the default 'slide'
	// transition, so any saved effect resolves to 'slide'.
	// Mirrored by swiperCarousel.js (frontend), BlockRenderer + ConfigBuilder.
	let effect = rawEffect;
	if (isVertical || (style === 'center' && SWIPER_SINGLE_SLIDE_EFFECTS.has(rawEffect))) {
		effect = 'slide';
	}
	const singleSlideStackEffect = SWIPER_SINGLE_SLIDE_EFFECTS.has(effect);
	const freeMode = sliderOptions.freeScroll === true;
	const adaptive = sliderOptions.adaptiveHeight === true;
	const slidesScrollGroup = {
		Desktop: Number(sliderOptions.slidesToScroll ?? 1),
		Tablet: Number(sliderOptions.slidesToScrollTablet ?? sliderOptions.slidesToScroll ?? 1),
		Mobile: Number(sliderOptions.slidesToScrollMobile ?? sliderOptions.slidesToScroll ?? 1),
	};

	const slidesPerViewAt = (nCols) => nCols;
	const centeredSlides = style === 'center';
	const activeColumns = columns[activeDevice] ?? columns.Desktop;
	const activeSlidesScrollGroup = slidesScrollGroup[activeDevice] ?? slidesScrollGroup.Desktop;

	const slideDirection = sliderOptions.direction === 'rtl' ? 'rtl' : 'ltr';
	const sliderLayout = layoutOptions.sliderLayout || 'slide';

	// Per-block layout variant feeding the remount key — the slider block remounts
	// on its own layout switches, carousels on style change.
	const layoutVariantByBlock = {
		'carousel-panorama': layoutOptions.panoramaLayout || 'style-one',
		// The horizontal and vertical marquees are different components, so an
		// axis change has to remount.
		marquee: displayStyle,
		slider: sliderLayout,
		carousel: style,
	};
	// The key remounts Swiper only on changes Swiper cannot absorb in place:
	// layout/effect/loop/direction/axis/variable-width.
	// Autoplay delay is passed as a live prop that swiper/react diffs and applies
	// via swiper.update(), alongside columns, gap, gap unit, and slides-to-scroll;
	// keying on those forced needless remounts (flash, scroll reset, autoplay
	// restart) on every Columns/Gap slider drag.
	// Pause-on-hover and the autoplay enable toggle are the exceptions: Swiper's
	// autoplay module binds its pointerenter/pointerleave listeners once, at init,
	// and only when autoplay is enabled with pauseOnMouseEnter set — it never
	// re-binds when the params mutate, so enabling autoplay or pause-on-hover
	// after mount is only honored by a remount.
	const paginationRemountKey = resolvePaginationStyle(paginationOptions.paginationStyle);
	const swiperKey = JSON.stringify({
		style,
		layout: layoutVariantByBlock[blockName] || style,
		activeDevice,
		effect,
		loop,
		slideDirection,
		isVertical,
		isTickerVertical,
		effectiveVariableWidth,
		centeredSlides,
		autoplay,
		pauseHover,
		// Pagination *style* swaps Swiper's pagination type (bullets/progressbar),
		// which rebuilds the bullet DOM — a reinit-class change, so it stays keyed.
		// Dot color/size/gap/alignment still update in place via stable refs.
		paginationStyle: paginationRemountKey,
	});

	return {
		style,
		orientationClass,
		isVertical,
		isTickerVertical,
		columns,
		gapNum,
		gapUnit,
		showNav,
		showPagin,
		paginationOptions,
		navigationOptions,
		navigationPosition,
		isTiles,
		effectiveVariableWidth,
		autoplay,
		speed,
		delay,
		pauseHover,
		loop,
		effect,
		singleSlideStackEffect,
		freeMode,
		adaptive,
		slidesScrollGroup,
		slidesPerViewAt,
		centeredSlides,
		activeColumns,
		activeSlidesScrollGroup,
		slideDirection,
		sliderLayout,
		swiperKey,
	};
}
