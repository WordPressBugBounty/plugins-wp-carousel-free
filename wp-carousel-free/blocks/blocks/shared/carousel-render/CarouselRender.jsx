/**
 * Editor carousel preview — derives render config from attributes
 * (`previewConfig.js`), owns the shared refs + DOM-measure effects, and
 * dispatches to a layout component. Keep markup/classes aligned with
 * `BlockRenderer.php`.
 *
 * Submodules: `layouts/` (special styles + tiles grids), `CarouselItem.jsx`,
 * the `use*` preview hooks, and `previewConfig.js`.
 */

import { useRef, useState, useLayoutEffect, useMemo } from '@wordpress/element';
import { useDeviceType } from '../../../controls/controls';
import useIconList from '../../../components/iconLibrary/useIconList';
import buildPreviewConfig from './previewConfig';
import { gapToPx } from './gapImageUtils';
import useVerticalSlideHeight from './useVerticalSlideHeight';
import useVariableWidthImageRefresh from './useVariableWidthImageRefresh';
import useEditorPreviewLightbox from './useEditorPreviewLightbox';
import TilesGridLayout from './layouts/tiles/TilesGridLayout';
import StandardCenterLayouts from './layouts/StandardCenterLayouts';
import ThumbnailsSliderLayout from './layouts/ThumbnailsSliderLayout';
import TickerCarousel from './layouts/TickerCarousel';
import PanoramaCarousel from './layouts/PanoramaCarousel';
import SliderPreview from '../../slider/sliderPreview';

const VERTICAL_FALLBACK_ITEM_PX = 320;
const EMPTY_SOCIAL_ICONS = Object.freeze({});

function getLocalizedSocialIcons() {
	if (
		'undefined' === typeof window ||
		!window.wpcpIconLibraryConfig ||
		!window.wpcpIconLibraryConfig.socialIcons ||
		'object' !== typeof window.wpcpIconLibraryConfig.socialIcons
	) {
		return EMPTY_SOCIAL_ICONS;
	}

	const { socialIcons } = window.wpcpIconLibraryConfig;
	return Object.keys(socialIcons).length ? socialIcons : EMPTY_SOCIAL_ICONS;
}

/**
 * @param {Object}   props
 * @param {object[]} [props.items]
 * @param {Object}   [props.attributes]
 * @param {boolean}  [props.isEditor]
 * @param {Function} [props.onItemEdit]
 * @param {Function} [props.onEditorPaginationClick] Editor: click preview pagination to select the pagination inner block.
 * @param {Function} [props.onUpdateLayoutOptions]   Commit layoutOptions updates from in-canvas interactions.
 * @param {Function} [props.onUpdateItems]           Commit a new items array (used by Custom Layout drag-to-move). Receives the reordered derived items; parent maps back to source items by id.
 */
export default function CarouselRender({
	items = [],
	attributes = {},
	isEditor = false,
	onItemEdit,
	onEditorPaginationClick,
	onUpdateLayoutOptions,
	onUpdateItems,
}) {
	const navPrevRef = useRef(null);
	const navNextRef = useRef(null);
	const paginRef = useRef(null);
	const containerRef = useRef(null);
	const swiperRef = useRef(null);
	const carouselRef = useRef(null);
	const tilesContainerRef = useRef(null);

	const previewDeviceType = useDeviceType();
	const activeDevice = isEditor ? previewDeviceType : 'Desktop';
	const localizedSocialIcons = useMemo(() => getLocalizedSocialIcons(), []);
	const socialIcons = useIconList({
		initialIcons: localizedSocialIcons,
		enabled: localizedSocialIcons === EMPTY_SOCIAL_ICONS,
	});

	const {
		style,
		orientationClass,
		isVertical,
		columns,
		gapNum,
		gapUnit,
		showNav,
		showPagin,
		paginationOptions,
		navigationOptions,
		navigationPosition,
		isTiles,
		isTickerVertical,
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
		swiperKey,
	} = buildPreviewConfig(attributes, activeDevice);

	// %-based gaps resolve against the container width — re-render on resize
	// so `gapToPx` recomputes with fresh measurements. The width comes from
	// the observer-committed state, never a `containerRef.current` read during
	// render (null on first render, stale when the layout branch attaches the
	// ref elsewhere).
	const [gapMeasureWidth, setGapMeasureWidth] = useState(0);
	const gapMeasureElement = gapMeasureWidth > 0 ? containerRef.current : null;
	const gapPxSwiper = {
		Desktop: gapToPx(gapNum.Desktop, gapUnit.Desktop, gapMeasureElement),
		Tablet: gapToPx(gapNum.Tablet, gapUnit.Tablet, gapMeasureElement),
		Mobile: gapToPx(gapNum.Mobile, gapUnit.Mobile, gapMeasureElement),
	};
	const activeGapPx = gapPxSwiper[activeDevice] ?? gapPxSwiper.Desktop;

	useLayoutEffect(() => {
		if (isTiles || 'ticker' === style) {
			return;
		}
		const el = containerRef.current;
		if (!el) {
			return;
		}
		const update = () => {
			const rect = el.getBoundingClientRect();
			const width = Number.isFinite(rect.width) && rect.width > 0 ? rect.width : el.clientWidth || 0;
			setGapMeasureWidth((prev) => (prev === width ? prev : width));
		};
		update();
		const resizeObserver = new ResizeObserver(update);
		resizeObserver.observe(el);
		return () => resizeObserver.disconnect();
	}, [
		isTiles,
		style,
		gapNum.Desktop,
		gapNum.Tablet,
		gapNum.Mobile,
		gapUnit.Desktop,
		gapUnit.Tablet,
		gapUnit.Mobile,
	]);

	const verticalItemMaxPx = useVerticalSlideHeight({
		isVertical,
		carouselRef,
		swiperRef,
		items,
		activeColumns,
		activeDevice,
		activeGapPx,
		swiperKey,
	});

	useVariableWidthImageRefresh({
		effectiveVariableWidth,
		isVertical,
		isTiles,
		style,
		swiperKey,
		itemsLength: items.length,
		swiperRef,
		carouselRef,
	});

	useEditorPreviewLightbox({
		isEditor,
		isTiles,
		style,
		loop,
		swiperKey,
		itemsLength: items.length,
		containerRef,
		carouselRef,
		tilesContainerRef,
		swiperRef,
	});

	const cols = activeColumns || 1;
	const verticalViewportCols = singleSlideStackEffect && isVertical ? 1 : cols;
	const gap = gapPxSwiper[activeDevice] || gapPxSwiper.Desktop || 0;
	const verticalHeight =
		Number.isFinite(verticalItemMaxPx) && verticalItemMaxPx > 0
			? verticalItemMaxPx * verticalViewportCols + gap * Math.max(0, verticalViewportCols - 1)
			: VERTICAL_FALLBACK_ITEM_PX * verticalViewportCols + gap * Math.max(0, verticalViewportCols - 1);

	/* ── Thumbnails-slider: main + thumb-strip Swipers synced via Thumbs ─ */
	if (style === 'thumbnails') {
		return (
			<ThumbnailsSliderLayout
				items={items}
				attributes={attributes}
				isEditor={isEditor}
				onItemEdit={onItemEdit}
				activeDevice={activeDevice}
				swiperKey={swiperKey}
				showNav={showNav}
				containerRef={containerRef}
				navigationPosition={navigationPosition}
				navigationOptions={navigationOptions}
				socialIcons={socialIcons}
			/>
		);
	}

	/* ── Tiles / Grid: static grid, no Swiper ─────────────────────────── */
	if (isTiles) {
		return (
			<TilesGridLayout
				items={items}
				attributes={attributes}
				isEditor={isEditor}
				onItemEdit={onItemEdit}
				onUpdateLayoutOptions={onUpdateLayoutOptions}
				onUpdateItems={onUpdateItems}
				activeDevice={activeDevice}
				orientationClass={orientationClass}
				activeColumns={activeColumns}
				containerRef={tilesContainerRef}
				socialIcons={socialIcons}
			/>
		);
	}

	/* ── Ticker / marquee ─────────────────────────────────────────────── */
	if ('ticker' === style) {
		return (
			<TickerCarousel
				containerRef={containerRef}
				items={items}
				attributes={attributes}
				isEditor={isEditor}
				onItemEdit={onItemEdit}
				gapNum={gapNum}
				gapUnit={gapUnit}
				columns={columns}
				isVertical={isTickerVertical}
				activeDevice={activeDevice}
				autoPlayDirection={slideDirection}
				socialIcons={socialIcons}
			/>
		);
	}

	/* ── Panorama ─────────────────────────────────────────────────────── */
	if ('panorama' === style) {
		return (
			<PanoramaCarousel
				containerRef={containerRef}
				swiperRef={swiperRef}
				items={items}
				attributes={attributes}
				isEditor={isEditor}
				onItemEdit={onItemEdit}
				columns={columns}
				gapPxSwiper={gapPxSwiper}
				speed={speed}
				loop={loop}
				autoplay={autoplay}
				delay={delay}
				pauseHover={pauseHover}
				freeMode={freeMode}
				showNav={showNav}
				showPagin={showPagin}
				slidesScrollGroup={slidesScrollGroup}
				navigationPosition={navigationPosition}
				navigationOptions={navigationOptions}
				activeDevice={activeDevice}
				swiperKey={swiperKey}
				onEditorPaginationClick={isEditor ? onEditorPaginationClick : undefined}
				autoPlayDirection={slideDirection}
				socialIcons={socialIcons}
			/>
		);
	}

	/* ── Slider block ─────────────────────────────────────────────────── */
	if ('slider' === attributes.blockName) {
		return (
			<SliderPreview
				containerRef={containerRef}
				swiperRef={swiperRef}
				items={items}
				attributes={attributes}
				isEditor={isEditor}
				onItemEdit={onItemEdit}
				columns={columns}
				gapPxSwiper={gapPxSwiper}
				speed={speed}
				loop={loop}
				autoplay={autoplay}
				delay={delay}
				pauseHover={pauseHover}
				freeMode={freeMode}
				showNav={showNav}
				showPagination={showPagin}
				slidesScrollGroup={slidesScrollGroup}
				navigationPosition={navigationPosition}
				navigationOptions={navigationOptions}
				activeDevice={activeDevice}
				swiperKey={swiperKey}
				onEditorPaginationClick={isEditor ? onEditorPaginationClick : undefined}
				autoPlayDirection={slideDirection}
				socialIcons={socialIcons}
			/>
		);
	}

	/* ── Standard / Center (shared module) ────────────────────────────── */
	return (
		<StandardCenterLayouts
			style={style}
			containerRef={containerRef}
			carouselRef={carouselRef}
			swiperRef={swiperRef}
			navPrevRef={navPrevRef}
			navNextRef={navNextRef}
			paginRef={paginRef}
			swiperKey={swiperKey}
			orientationClass={orientationClass}
			navigationPosition={navigationPosition}
			isVertical={isVertical}
			effectiveVariableWidth={effectiveVariableWidth}
			gapPxSwiper={gapPxSwiper}
			paginationOptions={paginationOptions}
			centeredSlides={centeredSlides}
			loop={loop}
			autoplay={autoplay}
			delay={delay}
			pauseHover={pauseHover}
			speed={speed}
			effect={effect}
			freeMode={freeMode}
			adaptive={adaptive}
			slidesScrollGroup={slidesScrollGroup}
			showNav={showNav}
			showPagin={showPagin}
			verticalHeight={verticalHeight}
			verticalItemMaxPx={verticalItemMaxPx}
			items={items}
			attributes={attributes}
			isEditor={isEditor}
			onItemEdit={onItemEdit}
			columns={columns}
			slidesPerViewAt={slidesPerViewAt}
			activeDevice={activeDevice}
			activeColumns={activeColumns}
			activeSlidesScrollGroup={activeSlidesScrollGroup}
			navigationOptions={navigationOptions}
			onEditorPaginationClick={isEditor ? onEditorPaginationClick : undefined}
			autoPlayDirection={slideDirection}
			socialIcons={socialIcons}
		/>
	);
}
