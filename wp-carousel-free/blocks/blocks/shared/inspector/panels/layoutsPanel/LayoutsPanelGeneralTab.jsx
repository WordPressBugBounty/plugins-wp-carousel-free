/**
 * Layouts panel — General tab (layout style, columns, gap, nav).
 *
 * Range min/max/defaults for controls come from `../../constants`
 * (`LAYOUT_RANGES`) so they stay aligned with similar limits elsewhere in
 * the editor. Variable-width and partial-view rules mirror `BlockRenderer` /
 * `ConfigBuilder` (e.g. excluded styles, vertical display).
 *
 * Tiles branch: when the active block is `wp-carousel-pro/tiles`, the panel
 * renders the bento-layout controls (Layout Style preset picker, Custom
 * Layout toggle, split horizontal/vertical gap rows, info-iconed toggles)
 * and hides the rows the bento layout owns (single `gap`, Align Items,
 * Navigation Arrows, Carousel Style).
 */

import { __ } from '@wordpress/i18n';
import { memo, useMemo } from '@wordpress/element';
import { useDeviceType } from '../../../../../controls/controls';
import {
	Toggle,
	SPRangeControl,
	SPToggleGroupControl,
	SelectField,
	InfoIcon,
	PanelNotice,
	SpProNotice,
} from '@wp-carousel-pro/components';
import {
	FlexAlignStart,
	FlexAlignCenter,
	FlexAlignEnd,
	FlexAlignStretch,
} from '@wp-carousel-pro/icons/icons';

import {
	PRO_SLIDER_LAYOUT,
	PRO_THUMBNAILS_SLIDER_LAYOUT,
	PRO_TILES_LAYOUT,
	PRO_TILES_LAYOUT_POST_PRODUCT,
	PRO_TILES_LAYOUT_VIDEO,
} from '../../../constants/proFeatures';
import ContentOrientations, {
	getContentOrientationItems,
	getContentOrientationFallback,
} from '../../fragments/contentOrientations';
import CarouselStyles from '../../fragments/carouselStyles';
import { isCarouselStylePickerBlock } from '../../../constants/carouselStyles';
import PanoramaLayouts from '../../fragments/panoramaLayouts';
import TileLayouts from '../../fragments/tileLayouts';
import ThumbsLayouts from '../../fragments/thumbsLayouts';
import { LAYOUT_RANGES, CONTENT_ANIMATIONS } from '../../constants';
import SliderLayouts from '../../fragments/SliderLayouts';
import {
	resolveSliderLayout,
	resolveThumbsLayout,
	resolveTileLayout,
} from '../../../constants/freeValues';
import { usesAutoRowHeight } from '../../../utils/tilePresets';
import { useOptionSetter } from '../../../hooks/useOptionSetter';

const DISPLAY_STYLES = [
	{ label: __('Horizontal', 'wp-carousel-free'), value: 'horizontal' },
	{ label: __('Vertical', 'wp-carousel-free'), value: 'vertical', pro: true },
];

const ALIGN_ITEMS = [
	{ label: <FlexAlignStart />, value: 'flex-start', tooltip: 'Flex Start' },
	{ label: <FlexAlignCenter />, value: 'center', tooltip: 'Center' },
	{ label: <FlexAlignEnd />, value: 'flex-end', tooltip: 'Flex End' },
	{ label: <FlexAlignStretch />, value: 'stretch', tooltip: 'Stretch' },
];

const CAROUSEL_STYLE_STANDARD = 'standard';
const CAROUSEL_STYLE_CENTER = 'center';
const TILES_BLOCK = 'wp-carousel-pro/tiles';
const THUMBNAILS_SLIDER_BLOCK = 'wp-carousel-pro/thumbnails-slider';
const SLIDER_BLOCK = 'wp-carousel-pro/slider';
const PANORAMA_BLOCK = 'wp-carousel-pro/carousel-panorama';
const MARQUEE_BLOCK = 'wp-carousel-pro/marquee';

/**
 * The marquee's axis. Vertical is Pro elsewhere in Free, but a Pro editor
 * preview reaches no PHP render path, so the preview may draw it —
 * `useFreeLayoutGuard` skips these blocks for the same reason.
 */
const MARQUEE_DISPLAY_STYLES = [
	{ label: __('Horizontal', 'wp-carousel-free'), value: 'horizontal' },
	{ label: __('Vertical', 'wp-carousel-free'), value: 'vertical' },
];

/** Matches `VARIABLE_WIDTH_EXCLUDED_STYLES` in CarouselRender / BlockRenderer — no variable-width UI. */
const VARIABLE_WIDTH_UNSUPPORTED_STYLES = new Set(['grid']);

/** Diagonal caption cut direction (Content Style = Diagonal only). */
const DIAGONAL_STYLES = [
	{ label: __('Left', 'wp-carousel-free'), value: 'left' },
	{ label: __('Right', 'wp-carousel-free'), value: 'right' },
];

/** Vertical Swiper is supported by the Standard and Center styles only. */
const VERTICAL_SUPPORTED_STYLES = [CAROUSEL_STYLE_STANDARD, CAROUSEL_STYLE_CENTER];

// eslint-disable-next-line jsdoc/require-jsdoc
const ToggleWithInfo = ({ label, tooltip, attributes, setAttributes, attributesKey }) => (
	<Toggle
		label={
			<>
				<span>{label}</span>
				<InfoIcon tooltip={tooltip} label={__('More info', 'wp-carousel-free')} />
			</>
		}
		attributes={attributes}
		attributesKey={attributesKey}
		setAttributes={setAttributes}
	/>
);

function LayoutsPanelGeneralTab({ attributes, setAttributes, layoutType }) {
	const lo = attributes.layoutOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'layoutOptions');
	// Content Animation attributes live in `sliderOptions` (the control was moved
	// here from the Slider tab); write them with a sliderOptions-scoped setter.
	const so = attributes.sliderOptions || {};
	const setSliderOption = useOptionSetter(attributes, setAttributes, 'sliderOptions');
	const isTilesBlock = layoutType === TILES_BLOCK;
	const isThumbnailsSliderBlock = layoutType === THUMBNAILS_SLIDER_BLOCK;
	const isSliderBlock = layoutType === SLIDER_BLOCK;
	const isPanoramaBlock = layoutType === PANORAMA_BLOCK;
	const isMarqueeBlock = layoutType === MARQUEE_BLOCK;
	// Both engines are pinned, so neither shows the Carousel Style picker.
	const isPreviewBlock = isPanoramaBlock || isMarqueeBlock;
	const sourceType = attributes.sourceType || 'image';
	const layoutsProNoticeMessage = (() => {
		if (isSliderBlock) {
			return PRO_SLIDER_LAYOUT.message;
		}
		if (isThumbnailsSliderBlock) {
			return PRO_THUMBNAILS_SLIDER_LAYOUT.message;
		}
		if (isTilesBlock) {
			if (sourceType === 'post' || sourceType === 'product') {
				return PRO_TILES_LAYOUT_POST_PRODUCT.message;
			}
			if (sourceType === 'video') {
				return PRO_TILES_LAYOUT_VIDEO.message;
			}
			return PRO_TILES_LAYOUT.message;
		}
		return __(
			'Unlock exclusive layouts and advanced display controls to create more dynamic,engaging carousels.',
			'wp-carousel-free'
		);
	})();
	// Slider Stage Aspect Ratio: a preset ratio (not Original/Custom) wins over
	// the fixed Height, so the Height control is a no-op then — the note below
	// surfaces that.
	const sliderStageImageOptions = attributes?.imageOptions || {};
	const sliderStageAspectIsPreset =
		isSliderBlock &&
		!['original', 'custom'].includes(sliderStageImageOptions.aspectRatio ?? 'original');
	const carouselStyle = lo.carouselStyle ?? CAROUSEL_STYLE_STANDARD;
	const sliderLayout = resolveSliderLayout(lo.sliderLayout);
	const supportsVariableWidthCarousel = !VARIABLE_WIDTH_UNSUPPORTED_STYLES.has(carouselStyle);
	const supportsVertical = VERTICAL_SUPPORTED_STYLES.includes(carouselStyle);
	const displayStyle = lo.displayStyle ?? 'horizontal';
	const isLayoutVertical = supportsVertical && displayStyle === 'vertical';
	const previewDeviceType = useDeviceType();

	const panoramaLayout = lo.panoramaLayout ?? 'style-one';
	const isTickerVertical = isMarqueeBlock && displayStyle === 'vertical';
	const tickerVerticalHeightValue = {
		device: {
			Desktop: lo.tickerVerticalHeight ?? 900,
			Tablet: lo.tickerVerticalHeightTablet ?? 600,
			Mobile: lo.tickerVerticalHeightMobile ?? 400,
		},
		unit: {
			Desktop: lo.tickerVerticalHeightUnit ?? 'px',
			Tablet: lo.tickerVerticalHeightTabletUnit ?? 'px',
			Mobile: lo.tickerVerticalHeightMobileUnit ?? 'px',
		},
	};
	// `showReflection` supersedes the legacy `panoramaReflection*` trio, but a
	// block authored in an older Pro carries only the legacy keys.
	const panoramaReflectionEnabled = lo.showReflection === true || lo.panoramaReflection === true;
	let panoramaReflectionDistance = 0;
	if (Number.isFinite(Number(lo.reflectionDistance))) {
		panoramaReflectionDistance = Number(lo.reflectionDistance);
	} else if (Number.isFinite(Number(lo.panoramaReflectionDistance))) {
		panoramaReflectionDistance = Number(lo.panoramaReflectionDistance);
	}
	let panoramaReflectionHeight = 16;
	if (Number.isFinite(Number(lo.reflectionHeight))) {
		panoramaReflectionHeight = Number(lo.reflectionHeight);
	} else if (Number.isFinite(Number(lo.panoramaReflectionHeight))) {
		panoramaReflectionHeight = Number(lo.panoramaReflectionHeight);
	}

	const thumbsLayout = resolveThumbsLayout(lo.thumbsLayout);
	const thumbsPerViewValue = {
		device: {
			Desktop: lo.thumbsPerView ?? 5,
			Tablet: lo.thumbsPerViewTablet ?? lo.thumbsPerView ?? 4,
			Mobile: lo.thumbsPerViewMobile ?? lo.thumbsPerViewTablet ?? lo.thumbsPerView ?? 3,
		},
	};
	const resetThumbsPerViewForDevice = () => {
		const map = {
			Desktop: 'thumbsPerView',
			Tablet: 'thumbsPerViewTablet',
			Mobile: 'thumbsPerViewMobile',
		};
		const defaults = { Desktop: 5, Tablet: 4, Mobile: 3 };
		set({ [map[previewDeviceType] ?? 'thumbsPerView']: defaults[previewDeviceType] ?? 5 });
	};
	const tileLayout = resolveTileLayout(lo.tileLayout);
	// Only a fixed-row preset emits `--wpcp-tile-row-height`; the auto-row ones
	// would give the control nothing to drive.
	const showRowHeightControl = isTilesBlock && !usesAutoRowHeight(tileLayout);

	const diagonalStyle = ['left', 'right'].includes(lo.diagonalStyle) ? lo.diagonalStyle : 'left';

	const resetColumnsForDevice = () => {
		const map = {
			Desktop: 'columns',
			Tablet: 'columnsTablet',
			Mobile: 'columnsMobile',
		};
		const defaults = { Desktop: 3, Tablet: 2, Mobile: 1 };
		set({ [map[previewDeviceType] ?? 'columns']: defaults[previewDeviceType] ?? 3 });
	};

	const resetGapForDevice = () => {
		const valueMap = {
			Desktop: 'gap',
			Tablet: 'gapTablet',
			Mobile: 'gapMobile',
		};
		const unitMap = {
			Desktop: 'gapUnit',
			Tablet: 'gapTabletUnit',
			Mobile: 'gapMobileUnit',
		};
		const device = previewDeviceType ?? 'Desktop';
		set({
			[valueMap[device] ?? 'gap']:
				LAYOUT_RANGES.gap.default[device] ?? LAYOUT_RANGES.gap.default.Desktop,
			[unitMap[device] ?? 'gapUnit']: 'px',
		});
	};

	const resetGapHorizontalForDevice = () => {
		const map = {
			Desktop: 'gapHorizontal',
			Tablet: 'gapHorizontalTablet',
			Mobile: 'gapHorizontalMobile',
		};
		const device = previewDeviceType ?? 'Desktop';
		const defaults = LAYOUT_RANGES.gapHorizontal.default;
		set({ [map[device] ?? 'gapHorizontal']: defaults[device] ?? defaults.Desktop });
	};

	const resetGapVerticalForDevice = () => {
		const map = { Desktop: 'gapVertical', Tablet: 'gapVerticalTablet', Mobile: 'gapVerticalMobile' };
		const device = previewDeviceType ?? 'Desktop';
		const defaults = LAYOUT_RANGES.gapVertical.default;
		set({ [map[device] ?? 'gapVertical']: defaults[device] ?? defaults.Desktop });
	};

	const resetTileRowHeightForDevice = () => {
		const map = {
			Desktop: 'tileRowHeight',
			Tablet: 'tileRowHeightTablet',
			Mobile: 'tileRowHeightMobile',
		};
		const unitMap = {
			Desktop: 'tileRowHeightUnit',
			Tablet: 'tileRowHeightTabletUnit',
			Mobile: 'tileRowHeightMobileUnit',
		};
		const device = previewDeviceType ?? 'Desktop';
		const defaults = LAYOUT_RANGES.tileRowHeight.default;
		set({
			[map[device] ?? 'tileRowHeight']: defaults[device] ?? defaults.Desktop,
			[unitMap[device] ?? 'tileRowHeightUnit']: 'px',
		});
	};

	const tileRowHeightValue = {
		device: {
			Desktop: lo.tileRowHeight ?? 220,
			Tablet: lo.tileRowHeightTablet ?? 220,
			Mobile: lo.tileRowHeightMobile ?? 220,
		},
		unit: {
			Desktop: lo.tileRowHeightUnit ?? 'px',
			Tablet: lo.tileRowHeightTabletUnit ?? 'px',
			Mobile: lo.tileRowHeightMobileUnit ?? 'px',
		},
	};

	const columnValue = {
		device: {
			Desktop: lo.columns ?? 3,
			Tablet: lo.columnsTablet ?? 2,
			Mobile: lo.columnsMobile ?? 1,
		},
	};
	const gapValue = {
		device: {
			Desktop: lo.gap ?? 20,
			Tablet: lo.gapTablet ?? 20,
			Mobile: lo.gapMobile ?? 10,
		},
		unit: {
			Desktop: lo.gapUnit ?? 'px',
			Tablet: lo.gapTabletUnit ?? 'px',
			Mobile: lo.gapMobileUnit ?? 'px',
		},
	};
	const gapHorizontalValue = {
		device: {
			Desktop: lo.gapHorizontal ?? 20,
			Tablet: lo.gapHorizontalTablet ?? 20,
			Mobile: lo.gapHorizontalMobile ?? 20,
		},
		unit: {
			Desktop: lo.gapHorizontalUnit ?? 'px',
			Tablet: lo.gapHorizontalTabletUnit ?? 'px',
			Mobile: lo.gapHorizontalMobileUnit ?? 'px',
		},
	};
	const gapVerticalValue = {
		device: {
			Desktop: lo.gapVertical ?? 20,
			Tablet: lo.gapVerticalTablet ?? 20,
			Mobile: lo.gapVerticalMobile ?? 20,
		},
		unit: {
			Desktop: lo.gapVerticalUnit ?? 'px',
			Tablet: lo.gapVerticalTabletUnit ?? 'px',
			Mobile: lo.gapVerticalMobileUnit ?? 'px',
		},
	};
	const allowedOrientations = useMemo(
		() =>
			getContentOrientationItems(sourceType, { layoutType, thumbsLayout }).map((item) => item.value),
		[sourceType, layoutType, thumbsLayout]
	);
	const fallbackOrientation = getContentOrientationFallback(sourceType, {
		layoutType,
		thumbsLayout,
	});
	const currentOrientation = allowedOrientations.includes(lo.contentOrientation)
		? lo.contentOrientation
		: fallbackOrientation;
	// Only update layoutOptions.contentOrientation. Card Elements styles are shared
	// across orientations, so contentAreaOptions is intentionally left untouched —
	// rebuilding it here from a memoized panel's stale value would wipe styles set
	// in the (separately rendered) Card Elements panel. Per-orientation default
	// padding is applied at render time by getEffectiveContentAreaPadding (JS) and
	// its PHP mirror, so no padding write is needed on switch.
	const setContentOrientation = set;

	return (
		<>
			{isSliderBlock && (
				<SliderLayouts
					label={__('Select Slider Style', 'wp-carousel-free')}
					attributes={sliderLayout}
					setAttributes={set}
					attributesKey="sliderLayout"
				/>
			)}
			{isPanoramaBlock && (
				<PanoramaLayouts
					label={__('Select Panorama Style', 'wp-carousel-free')}
					attributes={panoramaLayout}
					setAttributes={set}
					attributesKey="panoramaLayout"
				/>
			)}
			{isMarqueeBlock && (
				<SPToggleGroupControl
					label={__('Display Direction', 'wp-carousel-free')}
					attributes={displayStyle}
					attributesKey="displayStyle"
					setAttributes={set}
					items={MARQUEE_DISPLAY_STYLES}
				/>
			)}
			{isTickerVertical && (
				<SPRangeControl
					label={__('Ticker Height', 'wp-carousel-free')}
					attributes={tickerVerticalHeightValue}
					attributesKey="tempTickerVerticalHeight"
					setAttributes={() => {}}
					onValueChange={({ value, deviceType }) => {
						const map = {
							Desktop: 'tickerVerticalHeight',
							Tablet: 'tickerVerticalHeightTablet',
							Mobile: 'tickerVerticalHeightMobile',
						};
						set({ [map[deviceType]]: value });
					}}
					onUnitChange={({ unit, deviceType }) => {
						const map = {
							Desktop: 'tickerVerticalHeightUnit',
							Tablet: 'tickerVerticalHeightTabletUnit',
							Mobile: 'tickerVerticalHeightMobileUnit',
						};
						set({ [map[deviceType]]: unit });
					}}
					units={['px', '%', 'em']}
					min={100}
					max={20000}
					defaultValue={{
						device: { Desktop: 900, Tablet: 600, Mobile: 400 },
						unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
					}}
					setCustomReset={true}
				/>
			)}
			{/* Reflection has no reflective surface under the Content Box overlay
			 * geometry, so the whole group is hidden for that orientation. */}
			{isPanoramaBlock && currentOrientation !== 'content-box' && (
				<>
					<Toggle
						label={__('Show Reflection', 'wp-carousel-free')}
						attributes={panoramaReflectionEnabled}
						attributesKey="showReflection"
						setAttributes={(updates) =>
							set({
								...updates,
								panoramaReflection: updates.showReflection === true,
							})
						}
					/>
					{panoramaReflectionEnabled && (
						<>
							<SPRangeControl
								label={__('Reflection Distance', 'wp-carousel-free')}
								attributes={panoramaReflectionDistance}
								attributesKey="reflectionDistance"
								setAttributes={(updates) =>
									set({
										...updates,
										panoramaReflectionDistance: updates.reflectionDistance,
									})
								}
								min={0}
								max={100}
								step={1}
								defaultValue={0}
								units={false}
								showResponsiveIcon={false}
							/>
							<SPRangeControl
								label={__('Reflection Height', 'wp-carousel-free')}
								attributes={panoramaReflectionHeight}
								attributesKey="reflectionHeight"
								setAttributes={(updates) =>
									set({
										...updates,
										panoramaReflectionHeight: updates.reflectionHeight,
									})
								}
								min={0}
								max={100}
								step={1}
								defaultValue={16}
								units={false}
								showResponsiveIcon={false}
							/>
						</>
					)}
				</>
			)}
			{isCarouselStylePickerBlock(layoutType) && (
				<>
					<CarouselStyles
						label={__('Select Carousel Style', 'wp-carousel-free')}
						attributes={carouselStyle}
						setAttributes={set}
						attributesKey="carouselStyle"
					/>
					{/*
					 * Orientation (horizontal/vertical) for the carousel-style blocks
					 * that support it.
					 */}
					{supportsVertical && (
						<SPToggleGroupControl
							label={__('Display Direction', 'wp-carousel-free')}
							attributes={displayStyle}
							attributesKey="displayStyle"
							setAttributes={set}
							items={DISPLAY_STYLES}
						/>
					)}
				</>
			)}

			{isThumbnailsSliderBlock && (
				<ThumbsLayouts
					label={__('Thumbnails Style', 'wp-carousel-free')}
					attributes={attributes}
					setAttributes={set}
					attributesKey="thumbsLayout"
				/>
			)}

			{isTilesBlock && (
				<>
					<TileLayouts
						label={__('Layout Style', 'wp-carousel-free')}
						attributes={tileLayout}
						setAttributes={set}
						attributesKey="tileLayout"
					/>
					{sourceType === 'image' && <Toggle label={__('Custom Layout', 'wp-carousel-free')} onlyPro />}
				</>
			)}

			<ContentOrientations
				label={__('Select Content Style', 'wp-carousel-free')}
				attributes={currentOrientation}
				setAttributes={setContentOrientation}
				attributesKey="contentOrientation"
				sourceType={sourceType}
				blockName={layoutType}
				thumbsLayout={thumbsLayout}
			/>

			{currentOrientation === 'diagonal' && (
				<SPToggleGroupControl
					label={__('Diagonal Style', 'wp-carousel-free')}
					attributes={diagonalStyle}
					attributesKey="diagonalStyle"
					setAttributes={set}
					items={DIAGONAL_STYLES}
					flexStyle={false}
				/>
			)}

			{/* The marquee's hallmark logo-strip mode, so it is live on the two Pro
			 * editor previews and still locked everywhere else. Safe because
			 * neither block has a PHP render path to disagree with. */}
			{isMarqueeBlock && !isTickerVertical && (
				<Toggle
					label={__('Variable Width', 'wp-carousel-free')}
					attributes={lo.variableWidth ?? false}
					attributesKey="variableWidth"
					setAttributes={set}
				/>
			)}
			{!isSliderBlock &&
				!isTilesBlock &&
				!isThumbnailsSliderBlock &&
				!isPreviewBlock &&
				!isLayoutVertical &&
				supportsVariableWidthCarousel && (
					<Toggle label={__('Variable Width', 'wp-carousel-free')} attributes={false} onlyPro />
				)}
			{/* Columns also drives Tiles: uniform mode, plus overflow tiles in bento mode. */}
			{!isSliderBlock && !isThumbnailsSliderBlock && (
				<SPRangeControl
					label={isLayoutVertical ? __('Row', 'wp-carousel-free') : __('Columns', 'wp-carousel-free')}
					attributes={columnValue}
					attributesKey="tempColumns"
					setAttributes={() => {}}
					onValueChange={({ value, deviceType }) => {
						const map = { Desktop: 'columns', Tablet: 'columnsTablet', Mobile: 'columnsMobile' };
						set({ [map[deviceType]]: value });
					}}
					min={LAYOUT_RANGES.columns.min}
					max={LAYOUT_RANGES.columns.max}
					defaultValue={{ device: LAYOUT_RANGES.columns.default }}
					setCustomReset={resetColumnsForDevice}
				/>
			)}

			{isThumbnailsSliderBlock && (
				<SPRangeControl
					label={__('Number of Thumbnails', 'wp-carousel-free')}
					attributes={thumbsPerViewValue}
					attributesKey="tempThumbsPerView"
					setAttributes={() => {}}
					onValueChange={({ value, deviceType }) => {
						const map = {
							Desktop: 'thumbsPerView',
							Tablet: 'thumbsPerViewTablet',
							Mobile: 'thumbsPerViewMobile',
						};
						set({ [map[deviceType]]: value });
					}}
					min={1}
					max={12}
					defaultValue={{ device: { Desktop: 5, Tablet: 4, Mobile: 3 } }}
					setCustomReset={resetThumbsPerViewForDevice}
				/>
			)}

			{!isSliderBlock && !isTilesBlock && !isThumbnailsSliderBlock && (
				<SPRangeControl
					label={__('Gap Between Items', 'wp-carousel-free')}
					attributes={gapValue}
					attributesKey="tempGap"
					setAttributes={() => {}}
					onValueChange={({ value, deviceType }) => {
						const map = { Desktop: 'gap', Tablet: 'gapTablet', Mobile: 'gapMobile' };
						set({ [map[deviceType]]: value });
					}}
					onUnitChange={({ unit, deviceType }) => {
						const map = {
							Desktop: 'gapUnit',
							Tablet: 'gapTabletUnit',
							Mobile: 'gapMobileUnit',
						};
						set({ [map[deviceType]]: unit });
					}}
					units={['px', '%', 'em']}
					min={LAYOUT_RANGES.gap.min}
					max={LAYOUT_RANGES.gap.max}
					defaultValue={{
						device: LAYOUT_RANGES.gap.default,
						unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
					}}
					setCustomReset={resetGapForDevice}
				/>
			)}

			{isTilesBlock && (
				<>
					<SPRangeControl
						label={__('Horizontal Gap', 'wp-carousel-free')}
						attributes={gapHorizontalValue}
						attributesKey="tempGapHorizontal"
						setAttributes={() => {}}
						onValueChange={({ value, deviceType }) => {
							const map = {
								Desktop: 'gapHorizontal',
								Tablet: 'gapHorizontalTablet',
								Mobile: 'gapHorizontalMobile',
							};
							set({ [map[deviceType]]: value });
						}}
						onUnitChange={({ unit, deviceType }) => {
							const map = {
								Desktop: 'gapHorizontalUnit',
								Tablet: 'gapHorizontalTabletUnit',
								Mobile: 'gapHorizontalMobileUnit',
							};
							set({ [map[deviceType]]: unit });
						}}
						units={['px', '%', 'em']}
						min={LAYOUT_RANGES.gapHorizontal.min}
						max={LAYOUT_RANGES.gapHorizontal.max}
						defaultValue={{
							device: LAYOUT_RANGES.gapHorizontal.default,
							unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
						}}
						setCustomReset={resetGapHorizontalForDevice}
					/>
					<SPRangeControl
						label={__('Vertical Gap', 'wp-carousel-free')}
						attributes={gapVerticalValue}
						attributesKey="tempGapVertical"
						setAttributes={() => {}}
						onValueChange={({ value, deviceType }) => {
							const map = {
								Desktop: 'gapVertical',
								Tablet: 'gapVerticalTablet',
								Mobile: 'gapVerticalMobile',
							};
							set({ [map[deviceType]]: value });
						}}
						onUnitChange={({ unit, deviceType }) => {
							const map = {
								Desktop: 'gapVerticalUnit',
								Tablet: 'gapVerticalTabletUnit',
								Mobile: 'gapVerticalMobileUnit',
							};
							set({ [map[deviceType]]: unit });
						}}
						units={['px', '%', 'em']}
						min={LAYOUT_RANGES.gapVertical.min}
						max={LAYOUT_RANGES.gapVertical.max}
						defaultValue={{
							device: LAYOUT_RANGES.gapVertical.default,
							unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
						}}
						setCustomReset={resetGapVerticalForDevice}
					/>
					{showRowHeightControl && (
						<SPRangeControl
							label={__('Row Height', 'wp-carousel-free')}
							attributes={tileRowHeightValue}
							attributesKey="tempTileRowHeight"
							setAttributes={() => {}}
							onValueChange={({ value, deviceType }) => {
								const map = {
									Desktop: 'tileRowHeight',
									Tablet: 'tileRowHeightTablet',
									Mobile: 'tileRowHeightMobile',
								};
								set({ [map[deviceType]]: value });
							}}
							onUnitChange={({ unit, deviceType }) => {
								const map = {
									Desktop: 'tileRowHeightUnit',
									Tablet: 'tileRowHeightTabletUnit',
									Mobile: 'tileRowHeightMobileUnit',
								};
								set({ [map[deviceType]]: unit });
							}}
							units={['px', 'em']}
							min={LAYOUT_RANGES.tileRowHeight.min}
							max={LAYOUT_RANGES.tileRowHeight.max}
							defaultValue={{
								device: LAYOUT_RANGES.tileRowHeight.default,
								unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
							}}
							setCustomReset={resetTileRowHeightForDevice}
						/>
					)}
				</>
			)}

			{!isLayoutVertical && !isSliderBlock && !isTilesBlock && !isThumbnailsSliderBlock && (
				<SPToggleGroupControl
					label={__('Align Items', 'wp-carousel-free')}
					attributes={lo.alignItems ?? 'flex-start'}
					attributesKey="alignItems"
					setAttributes={set}
					items={ALIGN_ITEMS}
					extraClass="wpcp-svg-rotate-90"
				/>
			)}
			{isSliderBlock && (
				<SPRangeControl
					label={__('Height', 'wp-carousel-free')}
					attributes={lo.sliderHeight}
					attributesKey={'sliderHeight'}
					setAttributes={set}
					units={['px', 'vh', '%', 'em']}
					capUnits={['%', 'vh']}
					min={50}
					max={1000}
					defaultValue={{ value: 600, unit: 'px' }}
				/>
			)}
			{sliderStageAspectIsPreset && (
				<PanelNotice>
					<p>
						{__(
							'Height has no effect while Stage Aspect Ratio is set to a preset (such as 1:1 or 16:9). Set it to Original or Custom to control the stage height with the Height control.',
							'wp-carousel-free'
						)}
					</p>
				</PanelNotice>
			)}

			{(isSliderBlock || isThumbnailsSliderBlock) && (
				<SelectField
					label={__('Content Animation', 'wp-carousel-free')}
					attributes={so.contentAnimation ?? 'none'}
					attributesKey="contentAnimation"
					setAttributes={setSliderOption}
					items={CONTENT_ANIMATIONS}
					flexStyle={false}
				/>
			)}

			{isTilesBlock ? (
				<ToggleWithInfo
					label={__('Random Order', 'wp-carousel-free')}
					tooltip={__(
						'Shuffle the saved tile order on render. Custom span edits travel with each item.',
						'wp-carousel-free'
					)}
					attributes={lo.randomOrder ?? false}
					attributesKey="randomOrder"
					setAttributes={set}
				/>
			) : (
				<Toggle
					label={__('Random Order', 'wp-carousel-free')}
					attributes={lo.randomOrder ?? false}
					attributesKey="randomOrder"
					setAttributes={set}
				/>
			)}

			{isTilesBlock && ['image', 'post', 'product'].includes(sourceType) && (
				<Toggle
					label={
						sourceType === 'post' || sourceType === 'product'
							? __('Category Filter', 'wp-carousel-free')
							: __('Gallery Filter', 'wp-carousel-free')
					}
					onlyPro
				/>
			)}

			{isTilesBlock && sourceType === 'image' && (
				<Toggle label={__('Ajax Search', 'wp-carousel-free')} onlyPro />
			)}

			<>
				{!isTilesBlock && !isMarqueeBlock && (
					<Toggle
						label={__('Navigation Arrow', 'wp-carousel-free')}
						attributes={lo.navigation ?? true}
						attributesKey="navigation"
						setAttributes={set}
					/>
				)}
				{!isThumbnailsSliderBlock &&
					!isMarqueeBlock &&
					(() => {
						const tilesSourceSupportsAjax =
							sourceType === 'post' ||
							sourceType === 'product' ||
							sourceType === 'image' ||
							sourceType === 'video';
						if (isTilesBlock && !tilesSourceSupportsAjax) {
							return null;
						}
						const paginationLabel = isTilesBlock
							? __('Ajax Pagination', 'wp-carousel-free')
							: __('Pagination Dots', 'wp-carousel-free');
						return (
							<Toggle
								label={paginationLabel}
								attributes={lo.pagination ?? true}
								attributesKey="pagination"
								setAttributes={set}
							/>
						);
					})()}
			</>

			<SpProNotice
				className="is-upsell"
				message={layoutsProNoticeMessage}
				linkText={__('Upgrade to Pro!', 'wp-carousel-free')}
			/>
		</>
	);
}

export default memo(LayoutsPanelGeneralTab);
