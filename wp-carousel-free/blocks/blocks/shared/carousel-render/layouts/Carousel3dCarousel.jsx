/**
 * Editor preview for the 3D Carousel.
 *
 * The block keeps `carouselStyle` at the shared default and stages its slides
 * with its own Swiper effect (`shared/utils/carousel3dEffectModule.js`), which
 * the frontend runtime registers too.
 *
 * Mirrors `BlockRenderer::build_root_classes()` for the root classes and
 * `ConfigBuilder::build_carousel_3d_config()` for the effect params.
 */

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from '@wordpress/element';
import classNames from 'classnames';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import CarouselItem from '../CarouselItem';
import { resolveContentOrientation } from '../../inspector/fragments/contentOrientations';
import { ORIENTATION_CLASSES } from '../constants';
import {
	buildSwiperPaginationConfig,
	getPaginationDivProps,
	stripPaginationRootInlineStyle,
} from '../paginationConfig';
import useEditorPaginationSelect from '../useEditorPaginationSelect';
import { CarouselNavArrows, autoplayParams } from './StandardCenterLayouts';
import EffectCarousel3d from './carousel3d/effectCarousel3d';
import { carousel3dParamsFor } from '../../utils/carousel3dGeometry';
import { CAROUSEL_3D_FREE_STYLE } from '../../constants/carousel3d';
import { CAROUSEL_3D_EFFECT_ID, stageCarousel3dSlides } from '../../utils/carousel3dEffectModule';

/** Root classes the stage carries, so the stylesheet can scope per style. */
export const CAROUSEL_3D_ROOT_CLASSES = [
	'wpcp-style-carousel-3d',
	`wpcp-carousel-3d-${CAROUSEL_3D_FREE_STYLE}`,
];

/**
 * The lowest item count the block can loop at: one slide either side of the
 * active one. Mirrors `loopRequiredItems` in `frontend/carousel/swiperCarousel.js`.
 */
const CAROUSEL_3D_LOOP_MINIMUM = 3;

function assignCarousel3dParams(swiperInstance, params) {
	if (!swiperInstance || !params) {
		return;
	}

	swiperInstance.params.carousel3dEffect = {
		...(swiperInstance.params.carousel3dEffect || {}),
		...params,
	};
	swiperInstance.originalParams.carousel3dEffect = {
		...(swiperInstance.originalParams.carousel3dEffect || {}),
		...params,
	};
}

export default function Carousel3dCarousel({
	containerRef,
	swiperRef,
	items,
	attributes,
	isEditor,
	onItemEdit,
	speed,
	loop,
	autoplay,
	delay,
	pauseHover,
	showNav,
	showPagin,
	activeDevice,
	navigationPosition = 'nav-bottom-right',
	navigationOptions = {},
	onEditorPaginationClick,
	autoPlayDirection,
	swiperKey,
	socialIcons,
}) {
	const navPrevRef = useRef(null);
	const navNextRef = useRef(null);
	const paginRef = useRef(null);
	const swiperInstanceRef = useRef(null);

	useEditorPaginationSelect(
		onEditorPaginationClick,
		paginRef,
		isEditor && !!onEditorPaginationClick,
		showPagin
	);

	const { layoutOptions = {}, sourceType = 'image' } = attributes;
	const contentOrientation = resolveContentOrientation(
		sourceType,
		layoutOptions.contentOrientation,
		{ blockName: attributes.blockName }
	);
	const orientationClass = ORIENTATION_CLASSES[contentOrientation] || '';
	const paginationOptions = attributes.paginationDotsOptions ?? {};
	const paginationDivProps = getPaginationDivProps(paginationOptions);

	// A new class list drops the ones Swiper added, and those anchor the dots inside the stage.
	useLayoutEffect(() => {
		const instance = swiperInstanceRef.current;

		if (!showPagin || !paginRef.current || !instance || instance.destroyed || !instance.pagination) {
			return;
		}
		instance.pagination.init();
		instance.pagination.render();
		instance.pagination.update();
		stripPaginationRootInlineStyle(paginRef.current);
	}, [showPagin, paginationDivProps.className]);

	// The serialized bag says whether anything changed, which keeps the restage
	// below off every unrelated re-render.
	const effectSignature = JSON.stringify({
		...carousel3dParamsFor(layoutOptions, activeDevice),
		slideCount: items.length,
	});
	const effectParams = useMemo(() => JSON.parse(effectSignature), [effectSignature]);

	// Swiper reads its effect params once, at init; a Side Items change has to reach the live instance.
	useEffect(() => {
		const instance = swiperInstanceRef.current;

		if (!instance || instance.destroyed) {
			return;
		}
		assignCarousel3dParams(instance, effectParams);
		stageCarousel3dSlides(instance);
	}, [effectParams]);
	// The editor follows Gutenberg's device toggle rather than the canvas width,
	// so breakpoints — which read the real viewport — are left off there.
	const breakpointOptions = isEditor
		? undefined
		: {
				0: {
					spaceBetween: 0,
					slidesPerView: 'auto',
					carousel3dEffect: {
						...carousel3dParamsFor(layoutOptions, 'Mobile'),
						slideCount: items.length,
					},
				},
				600: {
					spaceBetween: 0,
					slidesPerView: 'auto',
					carousel3dEffect: {
						...carousel3dParamsFor(layoutOptions, 'Tablet'),
						slideCount: items.length,
					},
				},
				1024: {
					spaceBetween: 0,
					slidesPerView: 'auto',
					carousel3dEffect: {
						...carousel3dParamsFor(layoutOptions, 'Desktop'),
						slideCount: items.length,
					},
				},
		  };

	return (
		<div
			ref={containerRef}
			className={classNames(
				'wpcp-carousel-render',
				CAROUSEL_3D_ROOT_CLASSES,
				orientationClass,
				navigationPosition
			)}
		>
			<div className="wpcp-carousel-stage">
				<Fragment key={swiperKey || 'carousel-3d'}>
					<Swiper
						key={swiperKey}
						modules={[Navigation, Pagination, Autoplay, EffectCarousel3d]}
						dir="ltr"
						effect={CAROUSEL_3D_EFFECT_ID}
						slidesPerView="auto"
						spaceBetween={0}
						speed={speed}
						loop={loop && items.length > CAROUSEL_3D_LOOP_MINIMUM}
						autoplay={autoplayParams(autoplay, delay, pauseHover, autoPlayDirection)}
						simulateTouch={!isEditor}
						grabCursor={!isEditor}
						slidesPerGroup={1}
						navigation={showNav ? { prevEl: navPrevRef.current, nextEl: navNextRef.current } : false}
						pagination={buildSwiperPaginationConfig(showPagin, paginRef, paginationOptions)}
						breakpoints={breakpointOptions}
						className="wpcp-swiper"
						// Not a `carousel3dEffect` prop: `swiper/react` forwards props it
						// doesn't know onto the DOM element, which React rejects.
						onBeforeInit={(swiperInstance) => assignCarousel3dParams(swiperInstance, effectParams)}
						onSwiper={(swiperInstance) => {
							assignCarousel3dParams(swiperInstance, effectParams);
							swiperInstanceRef.current = swiperInstance;
							if (swiperRef) {
								swiperRef.current = swiperInstance;
							}
							if (typeof swiperInstance.changeLanguageDirection === 'function') {
								swiperInstance.changeLanguageDirection('ltr');
							}
							if (showNav && navPrevRef.current && navNextRef.current) {
								swiperInstance.params.navigation.prevEl = navPrevRef.current;
								swiperInstance.params.navigation.nextEl = navNextRef.current;
								swiperInstance.navigation.init();
								swiperInstance.navigation.update();
							}
							if (showPagin && paginRef.current) {
								const pagCfg = buildSwiperPaginationConfig(true, paginRef, paginationOptions);
								if (pagCfg && typeof pagCfg === 'object') {
									Object.assign(swiperInstance.params.pagination, pagCfg);
									swiperInstance.params.pagination.el = paginRef.current;
								}
								swiperInstance.pagination.init();
								swiperInstance.pagination.update();
								stripPaginationRootInlineStyle(paginRef.current);
							}
						}}
						onPaginationUpdate={() => stripPaginationRootInlineStyle(paginRef.current)}
					>
						{items.map((item, i) => (
							<SwiperSlide key={item.id || i} className="wpcp-item">
								<CarouselItem
									item={item}
									attributes={attributes}
									itemIndex={i}
									isEditor={isEditor}
									onItemEdit={onItemEdit}
									socialIcons={socialIcons}
								/>
								{/* Last in the slide so a hovered card can clear its own wash
								 * with a sibling rule. Mirrors `ItemRenderer::render_item()`. */}
								<span className="wpcp-carousel-3d-wash" aria-hidden="true" />
							</SwiperSlide>
						))}
					</Swiper>
				</Fragment>

				{showNav && (
					<CarouselNavArrows
						navPrevRef={navPrevRef}
						navNextRef={navNextRef}
						navigationOptions={navigationOptions}
					/>
				)}
			</div>

			{showPagin && <div ref={paginRef} {...paginationDivProps} />}
		</div>
	);
}
