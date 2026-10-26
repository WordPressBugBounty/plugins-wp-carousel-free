<?php
/**
 * Inserter categories.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the block inserter categories.
 */
final class BlockCategories {

	/**
	 * Main category slug. Shared with Pro.
	 */
	const CATEGORY = 'wp-carousel-pro';

	/**
	 * Hook the category filter.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'block_categories_all', array( __CLASS__, 'register' ), 10, 1 );
	}

	/**
	 * Prepend our category to the inserter.
	 *
	 * @param array $categories Registered block categories.
	 * @return array
	 */
	public static function register( $categories ) {
		if ( ! is_array( $categories ) ) {
			return $categories;
		}

		return array_merge(
			array(
				array(
					'slug'  => self::CATEGORY,
					'title' => __( 'WP Carousel', 'wp-carousel-free' ),
					'icon'  => null,
				),
			),
			$categories
		);
	}
}
