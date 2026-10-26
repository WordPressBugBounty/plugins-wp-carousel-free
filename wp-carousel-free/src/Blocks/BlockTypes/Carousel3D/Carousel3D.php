<?php
/**
 * 3D Carousel block PHP registration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Carousel3D;

use ShapedPlugin\WPCarouselFree\Blocks\AbstractBlock;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Carousel3DSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Carousel 3D block.
 */
class Carousel3D extends AbstractBlock {

	/**
	 * Block slug (wp-carousel-pro/carousel-3d).
	 *
	 * @var string
	 */
	protected $block_name = 'carousel-3d';

	/**
	 * Attribute schema for this block.
	 *
	 * @return AttributeSchema
	 */
	protected function get_schema(): ?AttributeSchema {
		return new Carousel3DSchema();
	}
}
