/**
 * Layouts Panel – General tab (layout style, columns, gap, nav) +
 *                 Slider tab (autoplay, speed, effects, etc.).
 *
 * General tab lives in `layoutsPanel/LayoutsPanelGeneralTab.jsx`.
 * Slider tab lives in `layoutsPanel/LayoutsPanelSliderTab.jsx`.
 *
 * Shown for: all source types.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo } from '@wordpress/element';
import { TabControls } from '@wp-carousel-pro/components';

import LayoutsPanelGeneralTab from './layoutsPanel/LayoutsPanelGeneralTab';
import LayoutsPanelSliderTab from './layoutsPanel/LayoutsPanelSliderTab';
import LayoutsPanelMarqueeTab from './layoutsPanel/LayoutsPanelMarqueeTab';

/** Blocks that have slider behavior */
const SLIDER_BLOCKS = [
	'wp-carousel-pro/carousel',
	'wp-carousel-pro/slider',
	'wp-carousel-pro/thumbnails-slider',
	'wp-carousel-pro/carousel-panorama',
	'wp-carousel-pro/marquee',
];

const MARQUEE_BLOCK = 'wp-carousel-pro/marquee';

/**
 * Layouts sidebar panel: General + optional Slider tab for slider-style blocks.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.layoutType    Block name (e.g. wp-carousel-pro/slider); tiles omit the Slider tab.
 * @param {boolean}  props.panelOpen
 * @param {Function} props.onPanelToggle
 * @param {string}   props.activeTab
 * @param {Function} props.onTabChange
 */
function LayoutsPanel({
	attributes,
	setAttributes,
	layoutType,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	const isSliderBlock = !layoutType || SLIDER_BLOCKS.includes(layoutType);
	// The marquee has no Swiper, so its second tab is the ticker's own motion
	// controls rather than the shared slider set.
	const isMarquee = MARQUEE_BLOCK === layoutType;
	const SecondaryTab = isMarquee ? LayoutsPanelMarqueeTab : LayoutsPanelSliderTab;

	// Slider/thumbnails-slider keep "Slider"; the carousel family labels it "Carousel".
	let sliderTabTitle = __('Carousel', 'wp-carousel-free');
	if (
		'wp-carousel-pro/slider' === layoutType ||
		'wp-carousel-pro/thumbnails-slider' === layoutType
	) {
		sliderTabTitle = __('Slider', 'wp-carousel-free');
	}
	if (isMarquee) {
		sliderTabTitle = __('Marquee', 'wp-carousel-free');
	}

	return (
		<PanelBody title={__('Layouts', 'wp-carousel-free')} opened={panelOpen} onToggle={onPanelToggle}>
			{isSliderBlock ? (
				<TabControls
					attributes={attributes}
					setAttributes={setAttributes}
					GeneralTab={LayoutsPanelGeneralTab}
					SliderTab={SecondaryTab}
					generalTabTitle={__('Settings', 'wp-carousel-free')}
					sliderTabTitle={sliderTabTitle}
					activeTab={activeTab}
					onTabChange={onTabChange}
					layoutType={layoutType}
				/>
			) : (
				<LayoutsPanelGeneralTab
					attributes={attributes}
					setAttributes={setAttributes}
					layoutType={layoutType}
				/>
			)}
		</PanelBody>
	);
}

export default memo(LayoutsPanel);
