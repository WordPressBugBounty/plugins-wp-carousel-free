<?php
/**
 * Shared default tree for the videoOptions attribute.
 *
 * The videoOptions object is identical on every carousel-style block (carousel,
 * slider, thumbnails-slider, tiles). Sourcing it from one place keeps those
 * schemas in sync and makes a new video option a single-file edit, mirroring
 * PaginationNavigationDefaults.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema\Util;

defined( 'ABSPATH' ) || exit;

/**
 * VideoOptionsDefaults helper.
 */
class VideoOptionsDefaults {

	/**
	 * Default tree for the videoOptions attribute.
	 *
	 * @return array<string,mixed>
	 */
	public static function get(): array {
		return array(
			'type'    => 'object',
			'default' => array(
				'useSourceIcon'     => false,
				'iconView'          => 'stacked',
				'iconSize'          => array(),
				'iconAreaSize'      => array(),
				'showOnHover'       => false,
				'animation'         => 'none',
				'aspectRatio'       => '16:9',
				'thumbnailSize'     => 'cover',
				'iconSource'        => 'library',
				'videoIcon'         => '',
				'currentIcon'       => array(),
				'customThumbnail'   => array(),
				'customVideoWidth'  => array(),
				'customVideoHeight' => array(),
			),
		);
	}
}
