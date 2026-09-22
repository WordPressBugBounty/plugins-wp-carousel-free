<?php
/**
 * Marquee block — Pro editor preview registration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Marquee;

use ShapedPlugin\WPCarouselFree\Blocks\EditorPreviewBlock;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\MarqueeSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Marquee editor preview.
 */
class Marquee extends EditorPreviewBlock {

	/**
	 * Block slug (wp-carousel-pro/marquee).
	 *
	 * @var string
	 */
	protected $block_name = 'marquee';

	/**
	 * Attribute schema for this block.
	 *
	 * @return AttributeSchema
	 */
	protected function get_schema(): ?AttributeSchema {
		return new MarqueeSchema();
	}
}
