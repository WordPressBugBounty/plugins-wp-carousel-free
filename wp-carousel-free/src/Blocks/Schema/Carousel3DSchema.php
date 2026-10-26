<?php
/**
 * Schema for the wp-carousel-pro/carousel-3d block.
 *
 * Coverflow (`style-one`) is the only Free style, and the 3D Settings popup is
 * Pro, so the staging rows it writes are absent: Free stages Coverflow at
 * Pro's defaults from `ConfigBuilder::CAROUSEL_3D_STAGING`.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\DeepMerge;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\PaginationNavigationDefaults;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\VideoOptionsDefaults;

defined( 'ABSPATH' ) || exit;

/**
 * Carousel3DSchema class.
 */
class Carousel3DSchema extends CarouselBaseSchema {

	/**
	 * Carousel 3D attribute schema.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		return DeepMerge::recursive(
			parent::get_attributes(),
			array(
				'blockName'             => array( 'default' => 'carousel-3d' ),
				'layoutOptions'         => array(
					'default' => array(
						'carousel3dStyle'    => 'style-one',
						'contentOrientation' => 'overlay',
						// Slides shown either side of the centered one; 'all' flanks it with every item.
						'sideItems'          => 4,
						'sideItemsTablet'    => 3,
						'sideItemsMobile'    => 2,
					),
				),
				'paginationDotsOptions' => PaginationNavigationDefaults::pagination_dots(),
				'navigationOptions'     => PaginationNavigationDefaults::navigation(),
				'videoOptions'          => VideoOptionsDefaults::get(),
			)
		);
	}
}
