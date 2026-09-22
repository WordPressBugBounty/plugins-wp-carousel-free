<?php
/**
 * Block type registry.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

defined( 'ABSPATH' ) || exit;

/**
 * Instantiates every block type.
 *
 * This list mirrors blocks/block-manifest.json, which is not shipped to
 * WordPress.org. Run lint:manifest after changing either.
 */
final class BlockTypesController {

	/**
	 * Block name namespace, kept identical to Pro so saved content is portable.
	 */
	const NAMESPACE_PREFIX = 'wp-carousel-pro';

	/**
	 * Hook block registration.
	 *
	 * @return void
	 */
	public function init() {
		add_action( 'init', array( $this, 'register_blocks' ), 20 );
		add_filter( 'allowed_block_types_all', array( BlockVisibility::class, 'filter_allowed_block_types' ), 10, 2 );
	}

	/**
	 * Instantiate each block type.
	 *
	 * @return void
	 */
	public function register_blocks() {
		if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
			return;
		}

		foreach ( $this->get_block_types() as $slug => $class_name ) {
			$fqcn = __NAMESPACE__ . '\\BlockTypes\\' . $class_name . '\\' . $class_name;

			if ( ! class_exists( $fqcn ) ) {
				continue;
			}

			new $fqcn();
		}
	}

	/**
	 * Registered block types, as slug to class name.
	 *
	 * @return array<string,string>
	 */
	private static function get_block_types() {
		return array(
			'carousel'          => 'Carousel',
			'marquee'           => 'Marquee',
			'carousel-panorama' => 'CarouselPanorama',
			'slider'            => 'Slider',
			'thumbnails-slider' => 'ThumbnailsSlider',
			'tiles'             => 'Tiles',
		);
	}

	/**
	 * Fully qualified block names, for callers that need the registered list
	 * before `init` 20 (e.g. editor settings).
	 *
	 * @return string[]
	 */
	public static function block_names(): array {
		$names = array();
		foreach ( array_keys( self::get_block_types() ) as $slug ) {
			$names[] = self::NAMESPACE_PREFIX . '/' . $slug;
		}

		return $names;
	}
}
