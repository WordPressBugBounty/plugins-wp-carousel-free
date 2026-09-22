import { Fragment, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, FreeMode } from 'swiper/modules';
import { getArrowIcon } from '../shared/carousel-render/navigationIconHelper';
import useEditorPaginationSelect from '../shared/carousel-render/useEditorPaginationSelect';
import { resolveContentOrientation } from '../shared/inspector/fragments/contentOrientations';
import { ORIENTATION_CLASSES } from '../shared/carousel-render/constants';
import {
	buildSwiperPaginationConfig,
	getPaginationDivProps,
	stripPaginationRootInlineStyle,
} from '../shared/carousel-render/paginationConfig';
import CarouselItem from '../shared/carousel-render/CarouselItem';
import { getEffectConfig, getEffectModules, isSingleSlideEffect } from './utils/effectConfig';
import { resolveSliderLayout } from '../shared/constants/freeValues';

function autoplayParams(autoplay, delay, pauseHover, autoPlayDirection = 'ltr') {
	return autoplay
		? {
				delay,
				disableOnInteraction: false,
				pauseOnMouseEnter: pauseHover,
				reverseDirection: autoPlayDirection === 'rtl',
		  }
		: false;
}

const SliderNavArrows = ({ navPrevRef, navNextRef, navigationOptions = {} }) => {
	const ArrowIcon = getArrowIcon(navigationOptions.arrowStyle);

	return (
		<div className={classNames('wpcp-nav-arrows', 'wpcp-navigation')}>
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
};

const SliderPreview = ({
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
	freeMode,
	showNav,
	showPagination,
	slidesScrollGroup,
	activeDevice,
	navigationPosition = 'nav-vertical-center',
	navigationOptions = {},
	onEditorPaginationClick,
	autoPlayDirection,
	swiperKey,
	socialIcons,
}) => {
	const navPrevRef = useRef(null);
	const navNextRef = useRef(null);
	const paginRef = useRef(null);

	useEditorPaginationSelect(
		onEditorPaginationClick,
		paginRef,
		isEditor && !!onEditorPaginationClick,
		showPagination
	);

	const { layoutOptions = {}, sourceType = 'image' } = attributes;
	const sliderLayout = resolveSliderLayout(layoutOptions.sliderLayout);

	const contentOrientation = resolveContentOrientation(
		sourceType,
		layoutOptions.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const orientationClass = ORIENTATION_CLASSES[contentOrientation] || '';
	const paginationOptions = attributes.paginationDotsOptions ?? {};
	const activeSlidesPerGroup = slidesScrollGroup[activeDevice] ?? slidesScrollGroup.Desktop;
	const effectConfig = getEffectConfig(sliderLayout, layoutOptions);
	const effectModules = getEffectModules(sliderLayout);
	const modules = [...[Navigation, Pagination, Autoplay, FreeMode], ...effectModules];

	const effectType = effectConfig.effect;
	const slidesPerView = isSingleSlideEffect(sliderLayout) ? 1 : 'auto';

	const handleSwiperInit = (swiperInstance) => {
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
		if (showPagination && paginRef.current) {
			const pagCfg = buildSwiperPaginationConfig(true, paginRef, paginationOptions);
			if (pagCfg && typeof pagCfg === 'object') {
				Object.assign(swiperInstance.params.pagination, pagCfg);
				swiperInstance.params.pagination.el = paginRef.current;
			}
			if (typeof swiperInstance.update === 'function') {
				swiperInstance.update();
			}
			swiperInstance.pagination.init();
			swiperInstance.pagination.render();
			swiperInstance.pagination.update();
			stripPaginationRootInlineStyle(paginRef.current, false);
		}
	};

	return (
		<div
			ref={containerRef}
			className={classNames(
				'wpcp-carousel-render',
				'wpcp-style-slider',
				`wpcp-slider-layout-${sliderLayout}`,
				orientationClass,
				navigationPosition
			)}
		>
			<div className="wpcp-carousel-stage">
				<Fragment key={swiperKey || `slider-${sliderLayout}`}>
					<Swiper
						modules={modules}
						dir="ltr"
						effect={effectType}
						slidesPerView={slidesPerView}
						speed={speed}
						{...(effectConfig.fadeEffect && { fadeEffect: effectConfig.fadeEffect })}
						{...(effectConfig.cubeEffect && { cubeEffect: effectConfig.cubeEffect })}
						{...(effectConfig.coverflowEffect && { coverflowEffect: effectConfig.coverflowEffect })}
						{...(effectConfig.creativeEffect && { creativeEffect: effectConfig.creativeEffect })}
						{...(effectConfig.centeredSlides && { centeredSlides: effectConfig.centeredSlides })}
						loop={loop}
						autoplay={autoplayParams(autoplay, delay, pauseHover, autoPlayDirection)}
						freeMode={freeMode}
						simulateTouch={!isEditor}
						grabCursor={!isEditor}
						slidesPerGroup={activeSlidesPerGroup}
						navigation={showNav ? { prevEl: navPrevRef.current, nextEl: navNextRef.current } : false}
						pagination={buildSwiperPaginationConfig(showPagination, paginRef, paginationOptions)}
						className="wpcp-swiper"
						onSwiper={handleSwiperInit}
						onPaginationUpdate={() => stripPaginationRootInlineStyle(paginRef.current, false)}
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
							</SwiperSlide>
						))}
					</Swiper>
				</Fragment>

				{showNav && (
					<SliderNavArrows
						navPrevRef={navPrevRef}
						navNextRef={navNextRef}
						navigationOptions={navigationOptions}
					/>
				)}
			</div>

			{showPagination && <div ref={paginRef} {...getPaginationDivProps(paginationOptions, false)} />}
		</div>
	);
};

export default SliderPreview;
