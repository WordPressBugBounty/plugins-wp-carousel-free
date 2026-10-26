<?php
/**
 * Justified block — a Pro teaser in Free.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\Justified;

use ShapedPlugin\WPCarouselFree\Blocks\ProTeaserBlock;

defined( 'ABSPATH' ) || exit;

/**
 * Justified teaser.
 */
class Justified extends ProTeaserBlock {

	/**
	 * Block slug (wp-carousel-pro/justified).
	 *
	 * @var string
	 */
	protected $block_name = 'justified';

	/**
	 * Keep a Pro-saved block's settings across a re-save in Free.
	 *
	 * @var bool
	 */
	protected $preserve_layout_attributes = true;
}
