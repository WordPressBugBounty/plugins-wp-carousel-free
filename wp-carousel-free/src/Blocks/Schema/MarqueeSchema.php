<?php
/**
 * Schema for the wp-carousel-pro/marquee block.
 *
 * Marquee is a Pro editor preview: the schema exists so the editor can bootstrap
 * defaults and the inspector can drive a live canvas, never so PHP can render.
 * `EditorPreviewBlock::render()` returns an empty string, so no value declared
 * here reaches any renderer, style class or source query.
 *
 * The block reuses the carousel "ticker" engine, so the carousel style defaults
 * to `ticker` and the carousel chrome (pagination/navigation defaults) is
 * intentionally omitted. `previewConfig.js` pins the style in the editor.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\DeepMerge;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\VideoOptionsDefaults;

defined( 'ABSPATH' ) || exit;

/**
 * MarqueeSchema class.
 */
class MarqueeSchema extends CarouselBaseSchema {

	/**
	 * Marquee attribute schema.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		return DeepMerge::recursive(
			parent::get_attributes(),
			array(
				'blockName'     => array( 'default' => 'marquee' ),
				'sourceType'    => array( 'default' => 'image' ),
				'layoutOptions' => array(
					'default' => array(
						'carouselStyle'       => 'ticker',
						'tickerGradient'      => false,
						'tickerGradientWidth' => 100,
						'tickerGradientColor' => '#ffffff',
					),
				),
				'sliderOptions' => array(
					'default' => array(
						// Scroll duration in ms. Must match LAYOUT_RANGES.tickerSpeed.default,
						// or the Scroll Speed control and the running marquee disagree.
						'tickerSpeed'   => 5000,
						'pauseOnFocus'  => true,
						'showPlayPause' => true,
					),
				),
				'imageOptions'  => array(
					'default' => array(
						'variableWidthImageHeightMode' => 'height',
					),
				),
				'videoOptions'  => VideoOptionsDefaults::get(),
			)
		);
	}
}
