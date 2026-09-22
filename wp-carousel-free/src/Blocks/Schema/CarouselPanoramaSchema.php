<?php
/**
 * Schema for the wp-carousel-pro/carousel-panorama block.
 *
 * Panorama is a Pro editor preview: the schema exists so the editor can
 * bootstrap defaults and the inspector can drive a live canvas, never so PHP can
 * render. `EditorPreviewBlock::render()` returns an empty string, so no value
 * declared here reaches any renderer, style class or source query.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\DeepMerge;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\PaginationNavigationDefaults;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\VideoOptionsDefaults;

defined( 'ABSPATH' ) || exit;

/**
 * CarouselPanoramaSchema class.
 */
class CarouselPanoramaSchema extends CarouselBaseSchema {

	/**
	 * Carousel Panorama attribute schema.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		return DeepMerge::recursive(
			parent::get_attributes(),
			array(
				'blockName'             => array( 'default' => 'carousel-panorama' ),
				'sourceType'            => array( 'default' => 'image' ),
				'layoutOptions'         => array(
					'default' => array(
						'carouselStyle'              => 'panorama',
						'panoramaLayout'             => 'style-one',
						// Panorama's signature look is the partial-slide reveal at the edges,
						// so this defaults true even though sibling blocks default false.
						'partialView'                => true,
						'contentOrientation'         => 'overlay',
						'showReflection'             => false,
						'reflectionDistance'         => 0,
						'reflectionHeight'           => 16,
						// Legacy saved keys kept so a block authored in Pro keeps its look.
						'panoramaReflection'         => false,
						'panoramaReflectionDistance' => 0,
						'panoramaReflectionHeight'   => 16,
					),
				),
				'paginationDotsOptions' => PaginationNavigationDefaults::pagination_dots(),
				'navigationOptions'     => PaginationNavigationDefaults::navigation(),
				'videoOptions'          => VideoOptionsDefaults::get(),
			)
		);
	}
}
