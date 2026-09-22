<?php
/**
 * Carousel block PHP registration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Carousel;

use ShapedPlugin\WPCarouselFree\Blocks\AbstractBlock;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\CarouselSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Carousel block.
 */
class Carousel extends AbstractBlock {

	/**
	 * Block slug (wp-carousel-pro/carousel).
	 *
	 * @var string
	 */
	protected $block_name = 'carousel';

	/**
	 * Attribute schema for this block.
	 *
	 * @return AttributeSchema
	 */
	protected function get_schema(): ?AttributeSchema {
		return new CarouselSchema();
	}
}
