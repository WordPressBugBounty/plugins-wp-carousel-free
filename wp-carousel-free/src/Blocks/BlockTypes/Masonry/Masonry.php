<?php
/**
 * Masonry block — a Pro teaser in Free.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Masonry;

use ShapedPlugin\WPCarouselFree\Blocks\ProTeaserBlock;

defined( 'ABSPATH' ) || exit;

/**
 * Masonry teaser.
 */
class Masonry extends ProTeaserBlock {

	/**
	 * Block slug (wp-carousel-pro/masonry).
	 *
	 * @var string
	 */
	protected $block_name = 'masonry';

	/**
	 * Keep a Pro-saved block's settings across a re-save in Free.
	 *
	 * @var bool
	 */
	protected $preserve_layout_attributes = true;
}
