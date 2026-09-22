<?php
/**
 * Tiles block PHP registration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Tiles;

use ShapedPlugin\WPCarouselFree\Blocks\AbstractBlock;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\TilesSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Tiles block.
 */
class Tiles extends AbstractBlock {

	/**
	 * Block slug (wp-carousel-pro/tiles).
	 *
	 * @var string
	 */
	protected $block_name = 'tiles';

	/**
	 * Attribute schema for this block.
	 *
	 * @return AttributeSchema
	 */
	protected function get_schema(): ?AttributeSchema {
		return new TilesSchema();
	}
}
