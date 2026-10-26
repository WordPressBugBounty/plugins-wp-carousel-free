<?php
/**
 * Grid block PHP registration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Grid;

use ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Tiles\Tiles;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\GridSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Grid block — the Tiles grid engine without the tile layout presets.
 */
class Grid extends Tiles {

	/**
	 * Block slug (wp-carousel-pro/grid).
	 *
	 * @var string
	 */
	protected $block_name = 'grid';

	/**
	 * Attribute schema for this block.
	 *
	 * @return AttributeSchema
	 */
	protected function get_schema(): ?AttributeSchema {
		return new GridSchema();
	}
}
