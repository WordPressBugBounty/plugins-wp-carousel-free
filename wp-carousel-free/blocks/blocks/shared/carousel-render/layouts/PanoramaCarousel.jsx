import { Fragment, useRef } from '@wordpress/element';
import classNames from 'classnames';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, FreeMode } from 'swiper/modules';
import CarouselItem from '../CarouselItem';
import { resolveContentOrientation } from '../../inspector/fragments/contentOrientations';
import { ORIENTATION_CLASSES } from '../constants';
import {
	buildSwiperPaginationConfig,
	getPaginationDivProps,
	stripPaginationRootInlineStyle,
} from '../paginationConfig';
import useEditorPaginationSelect from '../useEditorPaginationSelect';
import PanoramaNavArrows from './panorama/PanoramaNavArrows';
import EffectPanorama from './panorama/effectPanorama';
import {
	autoplayParams,
	buildPanoramaBreakpoints,
	getPanoramaReflectionState,
	panoramaEffectForDevice,
} from './panorama/panoramaConfig';

function PanoramaItemReflection({ item, attributes, itemIndex, isEditor, socialIcons }) {
	return (
		<div className="wpcp-panorama-reflection" aria-hidden="true" inert="" data-lightbox-ignore="true">
			<div className="wpcp-panorama-reflection__inner" data-lightbox-ignore="true">
				{/* Mirror the parent isEditor flag: the reflection must clone the
				 * editor slide, and CarouselItem gates some markup on it (video
				 * thumbnails render only in editor previews) — forcing false left
				 * video reflections empty while the PHP frontend clones the full
				 * video card into its reflection. Inertness comes from isReflection
				 * plus the inert/pointer-events shell above. */}
				<CarouselItem
					item={item}
					attributes={attributes}
					itemIndex={itemIndex}
					isEditor={isEditor}
					onItemEdit={undefined}
					isReflection
					socialIcons={socialIcons}
				/>
			</div>
		</div>
	);
}

function assignPanoramaEffectParams(swiperInstance, panoramaEffect) {
	if (!swiperInstance || !panoramaEffect) {
		return;
	}

	swiperInstance.params.panoramaEffect = {
		...(swiperInstance.params.panoramaEffect || {}),
		...panoramaEffect,
	};
	swiperInstance.originalParams.panoramaEffect = {
		...(swiperInstance.originalParams.panoramaEffect || {}),
		...panoramaEffect,
	};
}

export default function PanoramaCarousel({
	containerRef,
	swiperRef,
	items,
	attributes,
	isEditor,
	onItemEdit,
	columns,
	gapPxSwiper,
	speed,
	loop,
	autoplay,
	delay,
	pauseHover,
	freeMode,
	showNav,
	showPagin,
	slidesScrollGroup,
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

	useEditorPaginationSelect(
		onEditorPaginationClick,
		paginRef,
		isEditor && !!onEditorPaginationClick,
		showPagin
	);

	const { layoutOptions = {}, sourceType = 'image' } = attributes;
	const panoramaLayout = layoutOptions.panoramaLayout || 'style-one';
	const isStyleOne = panoramaLayout === 'style-one';
	const isStyleTwo = panoramaLayout === 'style-two';

	// Both style-one and style-two use the EffectPanorama plugin and 'panorama' effect.
	// style-two just passes reverse: true inside panoramaEffect params.
	const usePanoramaEffect = isStyleOne || isStyleTwo;

	const contentOrientation = resolveContentOrientation(
		sourceType,
		layoutOptions.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const orientationClass = ORIENTATION_CLASSES[contentOrientation] || '';
	const paginationOptions = attributes.paginationDotsOptions ?? {};
	const reflection = getPanoramaReflectionState(layoutOptions, contentOrientation);

	const activeColumns = columns[activeDevice] ?? columns.Desktop;
	const activeGap = gapPxSwiper[activeDevice] ?? gapPxSwiper.Desktop;
	const activeSlidesPerGroup = slidesScrollGroup[activeDevice] ?? slidesScrollGroup.Desktop;

	const modules = usePanoramaEffect
		? [Navigation, Pagination, Autoplay, FreeMode, EffectPanorama]
		: [Navigation, Pagination, Autoplay, FreeMode];
	const effect = usePanoramaEffect ? 'panorama' : 'slide';
	const activePanoramaEffect = panoramaEffectForDevice(activeDevice, isStyleTwo);
	// Editor preview follows Gutenberg's device toggle (`activeDevice`), not the
	// canvas pixel width. Swiper breakpoints use real viewport width and would
	// keep Desktop columns when Tablet/Mobile is selected in a wide editor.
	const breakpointOptions = isEditor
		? undefined
		: buildPanoramaBreakpoints({
				columns,
				gapPxSwiper,
				slidesScrollGroup,
				usePanoramaEffect,
				isStyleTwo,
		  });

	return (
		<div
			ref={containerRef}
			className={classNames(
				'wpcp-carousel-render',
				'wpcp-style-panorama',
				`wpcp-panorama-layout-${panoramaLayout}`,
				reflection.enabled && 'wpcp-panorama-has-reflection',
				orientationClass,
				navigationPosition
			)}
			style={reflection.style}
		>
			<div className="wpcp-carousel-stage">
				<Fragment key={swiperKey || `panorama-${panoramaLayout}`}>
					<Swiper
						key={swiperKey}
						modules={modules}
						dir="ltr"
						effect={effect}
						slidesPerView={activeColumns}
						spaceBetween={activeGap}
						speed={speed}
						loop={loop && items.length > activeColumns + 1}
						autoplay={autoplayParams(autoplay, delay, pauseHover, autoPlayDirection)}
						freeMode={freeMode}
						simulateTouch={!isEditor}
						grabCursor={!isEditor}
						slidesPerGroup={activeSlidesPerGroup}
						navigation={showNav ? { prevEl: navPrevRef.current, nextEl: navNextRef.current } : false}
						pagination={buildSwiperPaginationConfig(showPagin, paginRef, paginationOptions)}
						breakpoints={breakpointOptions}
						className="wpcp-swiper"
						onBeforeInit={(swiperInstance) => {
							if (usePanoramaEffect) {
								assignPanoramaEffectParams(swiperInstance, activePanoramaEffect);
							}
						}}
						onSwiper={(swiperInstance) => {
							if (usePanoramaEffect) {
								assignPanoramaEffectParams(swiperInstance, activePanoramaEffect);
							}
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
								{reflection.enabled && (
									<PanoramaItemReflection
										item={item}
										attributes={attributes}
										itemIndex={i}
										isEditor={isEditor}
										socialIcons={socialIcons}
									/>
								)}
							</SwiperSlide>
						))}
					</Swiper>
				</Fragment>

				{showNav && (
					<PanoramaNavArrows
						navPrevRef={navPrevRef}
						navNextRef={navNextRef}
						navigationOptions={navigationOptions}
					/>
				)}
			</div>

			{showPagin && <div ref={paginRef} {...getPaginationDivProps(paginationOptions, false)} />}
		</div>
	);
}
