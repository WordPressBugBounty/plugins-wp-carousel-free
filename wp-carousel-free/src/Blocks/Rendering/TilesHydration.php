<?php
/**
 * Tiles AJAX two-step fetch: stub IDs to full items.
 *
 * A Tiles post/product source returns lightweight ID stubs from `get_items()`,
 * so only the page actually on screen is hydrated. Both the frontend render
 * (BlockRenderer's Tiles branch) and the editor preview route go through here,
 * so one page of stubs always costs one `post__in` query on either side.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

defined( 'ABSPATH' ) || exit;

/**
 * TilesHydration class.
 */
class TilesHydration {

	/**
	 * Hydrate one page of ID stubs into full items.
	 *
	 * @param object $source     Content source, expected to expose `hydrate_ids()`.
	 * @param array  $page_items Page slice of stubs, each `array( 'id' => int )`.
	 * @param array  $attributes Projected block attributes.
	 * @return array Full items, or the stubs unchanged when the source cannot hydrate.
	 */
	public static function hydrate_page( $source, array $page_items, array $attributes ): array {
		if ( ! is_object( $source ) || ! method_exists( $source, 'hydrate_ids' ) ) {
			return $page_items;
		}

		$ids = array();
		foreach ( $page_items as $stub ) {
			$id = is_array( $stub ) ? (int) ( $stub['id'] ?? 0 ) : 0;
			if ( $id > 0 ) {
				$ids[] = $id;
			}
		}

		return $source->hydrate_ids( $ids, $attributes );
	}
}
