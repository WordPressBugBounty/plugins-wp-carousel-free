/**
 * Thumbnails-slider editor preview: main slide Swiper synced with a thumb-strip
 * Swiper via Swiper's `Thumbs` module. Mirrors the PHP renderer in
 * `src/Blocks/BlockRenderer.php` (thumbnails-slider branch) and the runtime
 * wiring in `blocks/blocks/frontend.js` (`initThumbnailsSliderCarousel`).
 *
 * Markup contract (consumed by `blocks/blocks/thumbnails-slider/style.scss` and
 * `blocks/blocks/shared/styles/carouselDynamicCss.js`):
 *   <div class="wpcp-stage">main Swiper</div>
 *   <div class="wpcp-thumbs-area" data-active-style="…">
 *     <div class="wpcp-thumb wpcp-active-style-{value} [wpcp-thumb-active]">…</div>
 *   </div>
 */

import { Fragment, useState, useCallback, useRef, useLayoutEffect } from '@wordpress/element';
import classNames from 'classnames';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
	Navigation,
	Pagination,
	Autoplay,
	Thumbs,
	Mousewheel,
	FreeMode,
	EffectFade,
} from 'swiper/modules';
import CarouselItem from '../CarouselItem';
import { resolveThumbnailActiveStyle } from '../../constants/freeValues';
import { resolveOuterMediaAspect } from '../../utils/resolveMediaAspect';
import { CarouselNavArrows } from './StandardCenterLayouts';

/**
 * @param {Object}                    props
 * @param {object[]}                  props.items
 * @param {Object}                    props.attributes
 * @param {boolean}                   props.isEditor
 * @param {Function}                  [props.onItemEdit]
 * @param {string}                    props.activeDevice         'Desktop' | 'Tablet' | 'Mobile'
 * @param {string}                    props.swiperKey            Forces remount when layout/slider options change.
 * @param {boolean}                   props.showNav              Show/Hide Navigation.
 * @param {import('react').RefObject} [props.containerRef]       Container ref for editor lightbox click handling.
 * @param {string}                    [props.navigationPosition] Navigation position class.
 * @param {Object}                    [props.socialIcons]        Parent-owned social icon lookup.
 */
export default function ThumbnailsSliderLayout({
	items,
	attributes,
	isEditor,
	onItemEdit,
	activeDevice = 'Desktop',
	swiperKey,
	showNav,
	containerRef,
	navigationPosition = 'nav-vertical-center-inner',
	socialIcons,
}) {
	const [thumbsSwiper, setThumbsSwiper] = useState(null);
	const [mainSwiper, setMainSwiper] = useState(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const renderShellRef = useRef(null);

	// Sync the internal ref to the containerRef for lightbox click handling
	useLayoutEffect(() => {
		if (containerRef && typeof containerRef !== 'function') {
			containerRef.current = renderShellRef.current;
		}
	}, [containerRef]);

	const navPrevRef = useRef(null);
	const navNextRef = useRef(null);

	const { layoutOptions = {}, sliderOptions = {}, thumbnail = {}, thumbsArea = {} } = attributes;

	const thumbsPerViewByDevice = {
		Desktop: Number(layoutOptions.thumbsPerView ?? 5),
		Tablet: Number(layoutOptions.thumbsPerViewTablet ?? 4),
		Mobile: Number(layoutOptions.thumbsPerViewMobile ?? 3),
	};
	// Gap-between-thumbs lives under `thumbsArea` in the redesigned schema;
	// fall back to legacy `thumbnail.gap*` so unsaved posts still preview.

	const thumbsPerView = thumbsPerViewByDevice[activeDevice] ?? thumbsPerViewByDevice.Desktop;
	const thumbGap = thumbsArea.gap?.device?.[activeDevice] ?? 24;
	const activeStyle = resolveThumbnailActiveStyle(thumbnail.activeStyle);
	const thumbsLayout = String(layoutOptions.thumbsLayout ?? 'strip');
	const showImage = thumbnail.showImage !== false;

	const renderedThumbsPerView = Math.max(1, thumbsPerView);

	// Signature of the image options that resize the media box (aspect ratio,
	// max width, custom dimensions, padding). The autoHeight nudge below keys on
	// it so the stage height only re-syncs when one of these actually changes.
	const effectiveImageOptions =
		attributes?.sourceType === 'audio'
			? attributes?.audioOptions?.imageOptions ?? {}
			: attributes?.imageOptions ?? {};
	const mediaHeightKey = JSON.stringify({
		aspect: resolveOuterMediaAspect(attributes?.sourceType, effectiveImageOptions),
		imageMaxWidth: effectiveImageOptions.imageMaxWidth,
		customImageWidth: effectiveImageOptions.customImageWidth,
		customImageHeight: effectiveImageOptions.customImageHeight,
		padding: effectiveImageOptions.padding,
	});
	const thumbsPosition = String(thumbsArea.position ?? 'bottom');

	const autoplay = sliderOptions.autoplay === true;
	const speed = Number(sliderOptions.speed ?? 500);
	const delay = Number(sliderOptions.autoplayDelay ?? 3000);
	const pauseHover = sliderOptions.pauseOnHover !== false;
	const loop = sliderOptions.infiniteLoop !== false && items.length > 1;
	const effect = sliderOptions.effect || 'slide';
	const slideDirection = sliderOptions.direction === 'rtl' ? 'rtl' : 'ltr';

	const handleMainSlideChange = useCallback((swiper) => {
		setActiveIndex(swiper.realIndex ?? swiper.activeIndex ?? 0);
	}, []);

	// `simulateTouch={!isEditor}` disables Swiper's mouse-driven click events,
	// so the thumbs Swiper's `slideToClickedSlide` no longer fires in the
	// editor. Drive the main swiper directly from a DOM click instead.
	const handleThumbClick = useCallback(
		(index) => {
			if (mainSwiper && !mainSwiper.destroyed) {
				if (loop && typeof mainSwiper.slideToLoop === 'function') {
					mainSwiper.slideToLoop(index);
				} else {
					mainSwiper.slideTo(index);
				}
			}
			setActiveIndex(index);
		},
		[mainSwiper, loop]
	);

	const thumbStyleVars = {
		'--wpcp-thumbs-per-view': renderedThumbsPerView,
		'--wpcp-thumbs-gap': `${thumbGap}px`,
	};

	// Position/layout modifiers mirror the classes BlockRenderer.php emits on
	// the outer `.wpcp-carousel-render` wrapper. The editor preview wraps
	// `.wpcp-stage` + `.wpcp-thumbs-area` in its own inner
	// `.wpcp-carousel-render`, so the same classes need to land here for the
	// static flex/layout rules to take effect.
	useLayoutEffect(() => {
		if (!mainSwiper || mainSwiper.destroyed || !mainSwiper.params) {
			return;
		}

		if (!showNav || !navPrevRef.current || !navNextRef.current) {
			if (mainSwiper.navigation?.initialized) {
				mainSwiper.navigation.destroy();
			}

			if (typeof mainSwiper.update === 'function') {
				mainSwiper.update();
			}

			return;
		}

		if (!mainSwiper.params.navigation || 'object' !== typeof mainSwiper.params.navigation) {
			mainSwiper.params.navigation = {};
		}

		mainSwiper.params.navigation.prevEl = navPrevRef.current;
		mainSwiper.params.navigation.nextEl = navNextRef.current;
		mainSwiper.params.navigation.enabled = true;

		if (mainSwiper.navigation?.initialized) {
			mainSwiper.navigation.destroy();
		}

		mainSwiper.navigation.init();
		mainSwiper.navigation.update();

		if (typeof mainSwiper.update === 'function') {
			mainSwiper.update();
		}
	}, [mainSwiper, showNav, swiperKey]);

	// Swiper's `autoHeight` caches a fixed px height on the wrapper and only
	// refreshes it on slide change/resize — not when the media box resizes from
	// an inline aspect-ratio/max-width edit. Without this nudge the stage keeps a
	// stale height (image crops or leaves a gap) until the author switches slides
	// or reloads. Editor-only: the frontend rebuilds on load.
	useLayoutEffect(() => {
		if (!mainSwiper || mainSwiper.destroyed) {
			return;
		}
		if (typeof mainSwiper.updateAutoHeight !== 'function') {
			return;
		}
		mainSwiper.updateAutoHeight();
	}, [mainSwiper, mediaHeightKey]);

	const placeholderEl = (
		<span className="wpcp-item-placeholder">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<circle cx="8.5" cy="8.5" r="1.5" />
				<path d="M21 15l-5-5L5 21" />
			</svg>
		</span>
	);

	return (
		<Fragment>
			<div
				ref={renderShellRef}
				className={classNames(
					'wpcp-carousel-render',
					'wpcp-style-thumbnails',
					`wpcp-thumbs-layout-${thumbsLayout}`,
					`wpcp-thumbs-position-${thumbsPosition}`,
					`wpcp-active-style-${activeStyle}`,
					navigationPosition
				)}
			>
				<div className="wpcp-stage">
					{items?.length > 0 && (
						<Swiper
							key={`${swiperKey}-${thumbsLayout}-${autoplay}`}
							modules={[Navigation, Pagination, Autoplay, Thumbs, Mousewheel, EffectFade]}
							onSwiper={setMainSwiper}
							thumbs={{
								swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
							}}
							initialSlide={0}
							slidesPerView={1}
							spaceBetween={0}
							effect={effect}
							{...(effect === 'fade' ? { fadeEffect: { crossFade: true } } : {})}
							// Stage matches each image's natural rendered height — no dark gap
							// below shorter images, no cropping of taller ones. User's
							// `sliderOptions.adaptiveHeight` is honored as a no-op (the
							// behavior is always on).
							autoHeight
							loop={loop}
							speed={speed}
							mousewheel={sliderOptions.mousewheel === true}
							simulateTouch={!isEditor}
							grabCursor={!isEditor}
							autoplay={
								autoplay
									? {
											delay,
											disableOnInteraction: false,
											pauseOnMouseEnter: pauseHover,
											reverseDirection: slideDirection === 'rtl',
									  }
									: false
							}
							navigation={
								showNav ? { prevEl: navPrevRef.current, nextEl: navNextRef.current, enabled: true } : false
							}
							onSlideChange={handleMainSlideChange}
							className="wpcp-swiper wpcp-thumbs-main"
						>
							{items.map((item, i) => (
								<SwiperSlide key={item.id || i} className="wpcp-item" onClick={() => handleThumbClick(i)}>
									<CarouselItem
										item={item}
										attributes={attributes}
										itemIndex={i}
										isEditor={isEditor}
										onItemEdit={onItemEdit}
										socialIcons={socialIcons}
									/>
								</SwiperSlide>
							))}
						</Swiper>
					)}
					{showNav && (
						<CarouselNavArrows
							navPrevRef={navPrevRef}
							navNextRef={navNextRef}
							navigationOptions={attributes?.navigationOptions}
						/>
					)}
				</div>

				<div className="wpcp-thumbs-area" data-active-style={activeStyle} style={thumbStyleVars}>
					{items.length > 0 && (
						<div className="wpcp-swiper-thumb-wrapper">
							<Swiper
								modules={[Thumbs, FreeMode]}
								onSwiper={setThumbsSwiper}
								direction="horizontal"
								slidesPerView={renderedThumbsPerView}
								spaceBetween={thumbGap}
								centeredSlides={false}
								freeMode
								slideToClickedSlide
								watchSlidesProgress
								observer
								observeParents
								simulateTouch={!isEditor}
								grabCursor={!isEditor}
								className="wpcp-swiper wpcp-thumbs-strip"
								initialSlide={1}
							>
								{items.map((item, i) => (
									<SwiperSlide
										key={item.id || i}
										className={classNames('wpcp-thumb', `wpcp-active-style-${activeStyle}`, {
											'wpcp-thumb-active': i === activeIndex,
										})}
										onClick={() => handleThumbClick(i)}
									>
										{showImage && (
											<span className="wpcp-thumb-img-wrapper">
												{item?.thumbImg || item.image_url ? (
													<img
														src={item?.thumbImg || item.image_url}
														alt={item.image_alt || item.title || ''}
														loading="lazy"
														className="wpcp-thumb-img"
													/>
												) : (
													<span className="wpcp-thumb-img wpcp-thumb-img--placeholder" aria-hidden="true">
														{placeholderEl}
													</span>
												)}
											</span>
										)}
									</SwiperSlide>
								))}
							</Swiper>
						</div>
					)}
				</div>
			</div>
		</Fragment>
	);
}
