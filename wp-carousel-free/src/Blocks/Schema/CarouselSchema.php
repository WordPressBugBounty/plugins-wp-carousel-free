<?php
/**
 * Schema for the wp-carousel-pro/carousel block.
 *
 * Per `BLOCK_ALLOWED_SOURCES['carousel']` (image, video, post, product), this
 * subclass adds the full `videoOptions` branch back onto the intersection base,
 * plus its pagination/navigation deltas.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\DeepMerge;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\PaginationNavigationDefaults;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\VideoOptionsDefaults;

defined( 'ABSPATH' ) || exit;

/**
 * CarouselSchema class.
 */
class CarouselSchema extends CarouselBaseSchema {

	/**
	 * Carousel attribute schema.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		return DeepMerge::recursive(
			parent::get_attributes(),
			array(
				'blockName'             => array( 'default' => 'carousel' ),
				// Autoplay delay is inherited from the base schema (3000 ms). The former
				// 1000 ms override advanced slides faster than text on a slide can be read.
				'paginationDotsOptions' => PaginationNavigationDefaults::pagination_dots(),
				'navigationOptions'     => PaginationNavigationDefaults::navigation(),
				'videoOptions'          => VideoOptionsDefaults::get(),
			)
		);
	}
}
