/**
 * The “classic” Swiper stack: **standard** and **center** — one Swiper with
 * effects + breakpoints.
 *
 * Markup and classes stay aligned with `BlockRenderer.php` — only structure/helpers change here.
 */

import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFlip, EffectCube, FreeMode } from 'swiper/modules';
import CarouselItem from '../CarouselItem';
import { SWIPER_SINGLE_SLIDE_EFFECTS } from '../constants';
import {
	buildSwiperPaginationConfig,
	getPaginationDivProps,
	stripPaginationRootInlineStyle,
} from '../paginationConfig';
import { getArrowIcon } from '../navigationIconHelper';
import useEditorPaginationSelect from '../useEditorPaginationSelect';
import { hasEnoughSlidesForSwiperLoop } from '../../utils/swiperLoop';
import {
	getVariableWidthImageHeightMode,
	hasVariableWidthImageHeight,
} from '../../utils/variableWidthImageSizing';

/** Swiper breakpoints: mobile / tablet / desktop widths used across this file. */
const BP = { mobile: 0, tablet: 600, desktop: 1024 };

/**
 * @param {boolean} autoplay
 * @param {number}  delay
 * @param {boolean} pauseHover
 * @param {string}  autoPlayDirection
 * @return {false|{ delay: number, disableOnInteraction: boolean, pauseOnMouseEnter: boolean }} Swiper autoplay config or disabled.
 */
function autoplayParams(autoplay, delay, pauseHover, autoPlayDirection = 'rtl') {
	return autoplay
		? {
				delay,
				disableOnInteraction: false,
				pauseOnMouseEnter: pauseHover,
				reverseDirection: autoPlayDirection === 'rtl' ? true : false,
		  }
		: false;
}

/**
 * Swiper HTML `dir` on the root: always LTR for horizontal carousels.
 * Slider “Direction” RTL does not set `dir="rtl"`; RTL autoplay uses `reverseDirection` only (see `autoplayParams`).
 *
 * @param {boolean} isVertical
 * @return {string|undefined} 'ltr', or undefined when vertical.
 */
function swiperHtmlDir(isVertical) {
	if (isVertical) {
		return undefined;
	}
	return 'ltr';
}

/**
 * After mount, attach external arrow + pagination DOM (Swiper needs real elements).
 *
 * @param {import('swiper').Swiper}   swiper
 * @param {Object}                    opts
 * @param {boolean}                   opts.showNav
 * @param {import('react').RefObject} opts.navPrevRef
 * @param {import('react').RefObject} opts.navNextRef
 * @param {boolean}                   opts.showPagin
 * @param {import('react').RefObject} opts.paginRef
 * @param {Object}                    opts.paginationOptions
 */
function wireSwiperNavPagination(
	swiper,
	{ showNav, navPrevRef, navNextRef, showPagin, paginRef, paginationOptions }
) {
	if (showNav && navPrevRef.current && navNextRef.current) {
		swiper.params.navigation.prevEl = navPrevRef.current;
		swiper.params.navigation.nextEl = navNextRef.current;
		swiper.navigation.init();
		swiper.navigation.update();
	}
	if (showPagin && paginRef.current) {
		const pagCfg = buildSwiperPaginationConfig(true, paginRef, paginationOptions);
		if (pagCfg && typeof pagCfg === 'object') {
			Object.assign(swiper.params.pagination, pagCfg);
			swiper.params.pagination.el = paginRef.current;
		}
		if (typeof swiper.update === 'function') {
			swiper.update();
		}
		swiper.pagination.init();
		swiper.pagination.render();
		swiper.pagination.update();
		stripPaginationRootInlineStyle(paginRef.current);
	}
}

/**
 * Prev / next arrow markup.
 *
 * @param {Object}                    props
 * @param {import('react').RefObject} props.navPrevRef
 * @param {import('react').RefObject} props.navNextRef
 * @param {boolean}                   [props.vertical]          Add `wpcp-nav-vertical` on the wrapper.
 * @param {Object}                    [props.navigationOptions] Navigation block options (arrow style, etc.).
 */
export function CarouselNavArrows({
	navPrevRef,
	navNextRef,
	vertical = false,
	navigationOptions = {},
}) {
	const ArrowIcon = getArrowIcon(navigationOptions.arrowStyle);

	return (
		<div
			className={classNames('wpcp-nav-arrows', 'wpcp-navigation', vertical && 'wpcp-nav-vertical')}
		>
			<button
				type="button"
				ref={navPrevRef}
				className="wpcp-nav wpcp-nav-prev"
				aria-label={__('Previous', 'wp-carousel-free')}
			>
				<ArrowIcon />
			</button>
			<button
				type="button"
				ref={navNextRef}
				className="wpcp-nav wpcp-nav-next"
				aria-label={__('Next', 'wp-carousel-free')}
			>
				<ArrowIcon />
			</button>
		</div>
	);
}

/**
 * @param {string} effect Slider `effect` attribute.
 * @return {import('swiper').SwiperModule[]} Modules array (mutated Swiper array pattern).
 */
function modulesForStandardEffect(effect) {
	const modules = [Navigation, Pagination, Autoplay, FreeMode];
	const effectMap = {
		flip: EffectFlip,
		cube: EffectCube,
	};
	const mod = effectMap[effect];
	if (mod) {
		modules.push(mod);
	}
	return modules;
}

/**
 * @param {Object}   opts
 * @param {boolean}  opts.isVertical
 * @param {boolean}  opts.effectiveVariableWidth
 * @param {Object}   opts.gapPxSwiper
 * @param {Object}   opts.slidesScrollGroup
 * @param {Object}   opts.columns
 * @param {Function} opts.slidesPerViewAt        `(nCols, deviceKey) => number`
 * @return {Object|undefined} Swiper `breakpoints` or `undefined` when vertical (Swiper uses root props only).
 */
function standardBreakpoints({
	isVertical,
	effectiveVariableWidth,
	gapPxSwiper,
	slidesScrollGroup,
	columns,
	slidesPerViewAt,
}) {
	if (isVertical) {
		return undefined;
	}
	if (effectiveVariableWidth) {
		return {
			[BP.mobile]: {
				slidesPerView: 'auto',
				spaceBetween: gapPxSwiper.Mobile,
				slidesPerGroup: 1,
			},
			[BP.tablet]: {
				slidesPerView: 'auto',
				spaceBetween: gapPxSwiper.Tablet,
				slidesPerGroup: 1,
			},
			[BP.desktop]: {
				slidesPerView: 'auto',
				spaceBetween: gapPxSwiper.Desktop,
				slidesPerGroup: 1,
			},
		};
	}
	return {
		[BP.mobile]: {
			slidesPerView: slidesPerViewAt(columns.Mobile, 'Mobile'),
			spaceBetween: gapPxSwiper.Mobile,
			slidesPerGroup: slidesScrollGroup.Mobile,
		},
		[BP.tablet]: {
			slidesPerView: slidesPerViewAt(columns.Tablet, 'Tablet'),
			spaceBetween: gapPxSwiper.Tablet,
			slidesPerGroup: slidesScrollGroup.Tablet,
		},
		[BP.desktop]: {
			slidesPerView: slidesPerViewAt(columns.Desktop, 'Desktop'),
			spaceBetween: gapPxSwiper.Desktop,
			slidesPerGroup: slidesScrollGroup.Desktop,
		},
	};
}

/**
 * @param {Object} item         Slide item (optional `extra.intrinsicWidth`/`extra.intrinsicHeight`).
 * @param {Object} imageOptions Image panel options slice (Image Height option).
 * @return {Object|undefined} Inline style for horizontal variable-width, or undefined.
 */
function variableWidthSlideStyle(item, imageOptions) {
	const intrinsicWidth = Number(item?.extra?.intrinsicWidth);
	// Expose the intrinsic width as a custom property, not an inline `width`:
	// Swiper resets each slide's inline width to re-measure them under
	// `slidesPerView: 'auto'`, so an inline width would be wiped. The static
	// stylesheet reads the property (and falls back to max-content when it is
	// absent), matching ItemRenderer::build_slide_outer_attr on the frontend.
	if (!Number.isFinite(intrinsicWidth) || intrinsicWidth <= 0) {
		return undefined;
	}
	const clampedWidth = Math.min(4000, Math.max(1, intrinsicWidth));
	// With the Image Height option set, the image is scaled to the fixed height,
	// so the slide width must follow the scaled width: height × (W / H). The
	// var() fallback is the intrinsic height, which resolves the calc back to
	// the intrinsic width when no height token is emitted.
	const intrinsicHeight = Number(item?.extra?.intrinsicHeight);
	if (
		hasVariableWidthImageHeight(imageOptions) &&
		Number.isFinite(intrinsicHeight) &&
		intrinsicHeight > 0
	) {
		const widthPerHeight = Math.round((clampedWidth / intrinsicHeight) * 10000) / 10000;
		if ('max-height' === getVariableWidthImageHeightMode(imageOptions)) {
			return {
				'--wpcp-vw-slide-width': `calc(min(var(--wpcp-vw-image-max-height, ${intrinsicHeight}px), ${intrinsicHeight}px) * ${widthPerHeight})`,
			};
		}
		return {
			'--wpcp-vw-slide-width': `calc(var(--wpcp-vw-image-height, ${intrinsicHeight}px) * ${widthPerHeight})`,
		};
	}
	return { '--wpcp-vw-slide-width': `${clampedWidth}px` };
}

/**
 * @param {number|null} verticalItemMaxPx Measured max inner height (px).
 * @return {Object} Slide style for vertical Swiper.
 */
function verticalSlideStyle(verticalItemMaxPx) {
	return {
		height:
			Number.isFinite(verticalItemMaxPx) && verticalItemMaxPx > 0 ? `${verticalItemMaxPx}px` : 'auto',
		flexShrink: 0,
	};
}

/**
 * @param {boolean}     isVertical
 * @param {boolean}     effectiveVariableWidth
 * @param {number|null} verticalItemMaxPx
 * @param {Object}      item
 * @param {Object}      imageOptions
 * @return {Object|undefined} SwiperSlide `style` prop.
 */
function resolveSlideOuterStyle(
	isVertical,
	effectiveVariableWidth,
	verticalItemMaxPx,
	item,
	imageOptions
) {
	if (isVertical) {
		return verticalSlideStyle(verticalItemMaxPx);
	}
	if (effectiveVariableWidth) {
		return variableWidthSlideStyle(item, imageOptions);
	}
	return undefined;
}

/**
 * @param {object[]} itemsToChunk Items to group.
 * @param {number}   chunkSize    Items per group.
 * @return {object[][]} Item groups.
 */
function chunkItems(itemsToChunk, chunkSize) {
	const size = Math.max(1, Number(chunkSize) || 1);
	const chunks = [];
	for (let i = 0; i < itemsToChunk.length; i += size) {
		chunks.push(itemsToChunk.slice(i, i + size));
	}
	return chunks;
}

/**
 * @param {Object} columnsByDevice Column counts per device.
 * @param {Object} gapByDevice     Gap values per device.
 * @return {Object} CSS vars for grouped single-slide effects.
 */
function groupedSlideStyle(columnsByDevice, gapByDevice) {
	return {
		'--wpcp-slide-group-cols-d': Math.max(1, Number(columnsByDevice.Desktop) || 1),
		'--wpcp-slide-group-cols-t': Math.max(1, Number(columnsByDevice.Tablet) || 1),
		'--wpcp-slide-group-cols-m': Math.max(1, Number(columnsByDevice.Mobile) || 1),
		'--wpcp-slide-group-gap-d': `${Number(gapByDevice.Desktop) || 0}px`,
		'--wpcp-slide-group-gap-t': `${Number(gapByDevice.Tablet) || 0}px`,
		'--wpcp-slide-group-gap-m': `${Number(gapByDevice.Mobile) || 0}px`,
	};
}

/**
 * Standard / center.
 *
 * @param {Object}                    props
 * @param {string}                    props.style                     `layoutOptions.carouselStyle`
 * @param {import('react').RefObject} props.containerRef
 * @param {import('react').RefObject} props.carouselRef
 * @param {import('react').RefObject} props.swiperRef
 * @param {import('react').RefObject} props.navPrevRef
 * @param {import('react').RefObject} props.navNextRef
 * @param {import('react').RefObject} props.paginRef
 * @param {string}                    props.swiperKey                 Key string for `Fragment`
 * @param {string}                    props.orientationClass
 * @param {string}                    props.navigationPosition        Navigation position class.
 * @param {boolean}                   props.isVertical
 * @param {boolean}                   props.effectiveVariableWidth
 * @param {Object}                    props.gapPxSwiper
 * @param {Object}                    props.paginationOptions
 * @param {Object}                    props.navigationOptions         Navigation block options.
 * @param {boolean}                   props.centeredSlides
 * @param {boolean}                   props.loop
 * @param {boolean}                   props.autoplay
 * @param {number}                    props.delay
 * @param {boolean}                   props.pauseHover
 * @param {number}                    props.speed
 * @param {string}                    props.effect
 * @param {boolean}                   props.freeMode
 * @param {boolean}                   props.adaptive
 * @param {Object}                    props.slidesScrollGroup
 * @param {boolean}                   props.showNav
 * @param {boolean}                   props.showPagin
 * @param {number}                    props.verticalHeight
 * @param {number|null}               props.verticalItemMaxPx
 * @param {object[]}                  props.items
 * @param {Object}                    props.attributes
 * @param {boolean}                   props.isEditor
 * @param {Function}                  [props.onItemEdit]
 * @param {Object}                    props.columns
 * @param {Function}                  props.slidesPerViewAt           `(nCols, deviceKey) => number`
 * @param {string}                    props.activeDevice
 * @param {number}                    props.activeColumns
 * @param {number}                    props.activeSlidesScrollGroup
 * @param {Function}                  [props.onEditorPaginationClick]
 * @param {string}                    [props.autoPlayDirection]
 * @param {Object}                    [props.socialIcons]             Parent-owned social icon lookup.
 */
function StandardCenterSwiperLayout({
	style,
	containerRef,
	carouselRef,
	swiperRef,
	navPrevRef,
	navNextRef,
	paginRef,
	swiperKey,
	orientationClass,
	navigationPosition,
	isVertical,
	effectiveVariableWidth,
	gapPxSwiper,
	paginationOptions,
	navigationOptions,
	centeredSlides,
	loop,
	autoplay,
	delay,
	pauseHover,
	speed,
	effect,
	freeMode,
	adaptive,
	slidesScrollGroup,
	showNav,
	showPagin,
	verticalHeight,
	verticalItemMaxPx,
	items,
	attributes,
	isEditor,
	onItemEdit,
	columns,
	slidesPerViewAt,
	activeDevice,
	activeColumns,
	activeSlidesScrollGroup,
	onEditorPaginationClick,
	autoPlayDirection,
	socialIcons,
}) {
	useEditorPaginationSelect(
		onEditorPaginationClick,
		paginRef,
		isEditor && !!onEditorPaginationClick,
		showPagin
	);

	const rawSelectedEffect = attributes?.sliderOptions?.effect || effect || 'slide';
	// Vertical Swiper and the Center style only support the default 'slide'
	// transition. Mirrors previewConfig.js + the frontend/PHP renderers.
	const selectedEffect = isVertical || style === 'center' ? 'slide' : rawSelectedEffect;
	const swiperModules = modulesForStandardEffect(selectedEffect);
	const singleSlideStackEffect = SWIPER_SINGLE_SLIDE_EFFECTS.has(selectedEffect);
	/** Variable-width Swiper is incompatible with fade/cube/flip (must be one slide per view). */
	const effectiveVariableWidthForSwiper = effectiveVariableWidth && !singleSlideStackEffect;
	const standardSwiperBreakpointsRaw = standardBreakpoints({
		isVertical,
		effectiveVariableWidth: effectiveVariableWidthForSwiper,
		gapPxSwiper,
		slidesScrollGroup,
		columns,
		slidesPerViewAt,
	});
	const standardSwiperBreakpoints =
		singleSlideStackEffect && standardSwiperBreakpointsRaw
			? Object.fromEntries(
					Object.entries(standardSwiperBreakpointsRaw).map(([key, bp]) => [
						key,
						{ ...bp, slidesPerView: 1, slidesPerGroup: 1 },
					])
			  )
			: standardSwiperBreakpointsRaw;
	let standardSlidesPerViewProp;
	if (singleSlideStackEffect) {
		standardSlidesPerViewProp = 1;
	} else if (isVertical || effectiveVariableWidthForSwiper) {
		standardSlidesPerViewProp = 'auto';
	} else {
		standardSlidesPerViewProp = slidesPerViewAt(activeColumns);
	}
	const activeGap = gapPxSwiper[activeDevice] ?? gapPxSwiper.Desktop;
	const htmlDir = swiperHtmlDir(isVertical);
	const groupedEffectSlides =
		singleSlideStackEffect && !isVertical
			? chunkItems(items, columns[activeDevice] ?? columns.Desktop)
			: null;
	const effectSlideGroupStyle = groupedEffectSlides
		? groupedSlideStyle(columns, gapPxSwiper)
		: undefined;
	const renderedSlideCount = groupedEffectSlides?.length ?? items.length;
	const loopSlidesPerView =
		standardSlidesPerViewProp === 'auto' ? slidesPerViewAt(activeColumns) : standardSlidesPerViewProp;
	const loopSlidesPerGroup =
		singleSlideStackEffect || effectiveVariableWidthForSwiper ? 1 : activeSlidesScrollGroup;
	const hasLoopCapacity = hasEnoughSlidesForSwiperLoop(renderedSlideCount, {
		slidesPerView: loopSlidesPerView,
		slidesPerGroup: loopSlidesPerGroup,
		bothDirections: centeredSlides,
	});

	const onSwiper = (swiper) => {
		swiperRef.current = swiper;
		// Swiper reads `el.dir` only at mount; React can apply `dir` slightly later.
		if (!isVertical && htmlDir && typeof swiper.changeLanguageDirection === 'function') {
			swiper.changeLanguageDirection(htmlDir);
		}
		wireSwiperNavPagination(swiper, {
			showNav,
			navPrevRef,
			navNextRef,
			showPagin,
			paginRef,
			paginationOptions,
			isVertical,
		});
	};

	return (
		<div
			ref={containerRef}
			className={classNames(
				'wpcp-carousel-render',
				`wpcp-style-${style}`,
				isVertical && 'wpcp-vertical',
				effectiveVariableWidthForSwiper && 'wpcp-variable-width',
				orientationClass,
				navigationPosition
			)}
		>
			<div className="wpcp-carousel-stage">
				<Fragment key={swiperKey}>
					<div ref={carouselRef}>
						<Swiper
							modules={swiperModules}
							direction={isVertical ? 'vertical' : 'horizontal'}
							slidesPerView={standardSlidesPerViewProp}
							spaceBetween={selectedEffect === 'cube' ? 0 : activeGap}
							centeredSlides={centeredSlides}
							{...(htmlDir ? { dir: htmlDir } : {})}
							loop={loop && hasLoopCapacity}
							autoplay={autoplayParams(autoplay, delay, pauseHover, autoPlayDirection)}
							speed={speed}
							effect={selectedEffect}
							freeMode={freeMode}
							autoHeight={!isVertical && adaptive}
							slidesPerGroup={
								singleSlideStackEffect || effectiveVariableWidthForSwiper ? 1 : activeSlidesScrollGroup
							}
							{...(selectedEffect === 'cube'
								? {
										cubeEffect: {
											shadow: true,
											slideShadows: true,
											shadowOffset: 20,
											shadowScale: 0.94,
										},
								  }
								: {})}
							simulateTouch={!isEditor}
							grabCursor={!isEditor}
							navigation={
								showNav ? { prevEl: navPrevRef.current, nextEl: navNextRef.current, enabled: true } : false
							}
							pagination={buildSwiperPaginationConfig(showPagin, paginRef, paginationOptions)}
							breakpoints={isEditor ? undefined : standardSwiperBreakpoints}
							className={classNames('wpcp-swiper', `wpcp-effect-${selectedEffect}`)}
							onSwiper={onSwiper}
							onPaginationUpdate={() => stripPaginationRootInlineStyle(paginRef.current)}
							style={isVertical ? { height: `${verticalHeight}px` } : undefined}
						>
							{groupedEffectSlides
								? groupedEffectSlides.map((group, groupIndex) => (
										<SwiperSlide
											key={`effect-group-${groupIndex}`}
											className="wpcp-slide-group"
											style={effectSlideGroupStyle}
										>
											{group.map((item, itemIndex) => {
												const originalIndex =
													groupIndex * Math.max(1, Number(columns[activeDevice] ?? columns.Desktop) || 1) +
													itemIndex;
												return (
													<div key={item.id || originalIndex} className="wpcp-item">
														<CarouselItem
															item={item}
															attributes={attributes}
															itemIndex={originalIndex}
															isEditor={isEditor}
															onItemEdit={onItemEdit}
															socialIcons={socialIcons}
														/>
													</div>
												);
											})}
										</SwiperSlide>
								  ))
								: items.map((item, i) => (
										<SwiperSlide
											key={item.id || i}
											className="wpcp-item"
											style={resolveSlideOuterStyle(
												isVertical,
												effectiveVariableWidthForSwiper,
												verticalItemMaxPx,
												item,
												attributes?.imageOptions
											)}
										>
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
					</div>
				</Fragment>

				{showNav && (
					<CarouselNavArrows
						navPrevRef={navPrevRef}
						navNextRef={navNextRef}
						vertical={isVertical}
						navigationOptions={navigationOptions}
					/>
				)}
			</div>
			{showPagin && <div ref={paginRef} {...getPaginationDivProps(paginationOptions, isVertical)} />}
		</div>
	);
}

/**
 * @param {Object} props Full prop bag from `CarouselRender`.
 */
export default function StandardCenterLayouts(props) {
	return <StandardCenterSwiperLayout {...props} />;
}
