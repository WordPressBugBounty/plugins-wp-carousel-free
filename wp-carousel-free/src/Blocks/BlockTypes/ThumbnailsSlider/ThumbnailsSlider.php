<?php
/**
 * Thumbnails Slider block PHP registration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\ThumbnailsSlider;

use ShapedPlugin\WPCarouselFree\Blocks\AbstractBlock;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\ThumbnailsSliderSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Thumbnails Slider block.
 */
class ThumbnailsSlider extends AbstractBlock {

	/**
	 * Block slug (wp-carousel-pro/thumbnails-slider).
	 *
	 * @var string
	 */
	protected $block_name = 'thumbnails-slider';

	/**
	 * Attribute schema for this block.
	 *
	 * @return AttributeSchema
	 */
	protected function get_schema(): ?AttributeSchema {
		return new ThumbnailsSliderSchema();
	}
}
