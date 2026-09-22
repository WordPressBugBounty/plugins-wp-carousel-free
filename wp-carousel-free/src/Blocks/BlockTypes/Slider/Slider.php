<?php
/**
 * Slider block PHP registration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Slider;

use ShapedPlugin\WPCarouselFree\Blocks\AbstractBlock;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\SliderSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Slider block.
 */
class Slider extends AbstractBlock {

	/**
	 * Block slug (wp-carousel-pro/slider).
	 *
	 * @var string
	 */
	protected $block_name = 'slider';

	/**
	 * Attribute schema for this block.
	 *
	 * @return AttributeSchema
	 */
	protected function get_schema(): ?AttributeSchema {
		return new SliderSchema();
	}
}
