<?php
/**
 * Carousel Panorama block — Pro editor preview registration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\BlockTypes\CarouselPanorama;

use ShapedPlugin\WPCarouselFree\Blocks\EditorPreviewBlock;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\CarouselPanoramaSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Carousel Panorama editor preview.
 */
class CarouselPanorama extends EditorPreviewBlock {

	/**
	 * Block slug (wp-carousel-pro/carousel-panorama).
	 *
	 * @var string
	 */
	protected $block_name = 'carousel-panorama';

	/**
	 * Attribute schema for this block.
	 *
	 * @return AttributeSchema
	 */
	protected function get_schema(): ?AttributeSchema {
		return new CarouselPanoramaSchema();
	}
}
