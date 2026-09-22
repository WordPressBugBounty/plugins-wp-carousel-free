<?php
/**
 * Ready Patterns category → block mapping.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns;

defined( 'ABSPATH' ) || exit;

/**
 * Maps demo-server category slugs to registered block names and display labels.
 *
 * Fallback resolver and label source only. Normalization never drops an item whose
 * category is missing here — a lookup table that decides which patterns exist is
 * how server-side terms silently vanished before. Explicit `blocks[]` on the item
 * wins; this map answers only when the source declares nothing.
 *
 * Only Free's four blocks are mapped. A Pro-block pattern still lists and still
 * previews; it simply resolves no block name, and its tier locks the insert.
 */
class CategoryMap {

	/**
	 * Category slug → block name.
	 *
	 * @var array<string, string>
	 */
	public const BLOCK_MAP = array(
		'carousel'          => 'wp-carousel-pro/carousel',
		'slider'            => 'wp-carousel-pro/slider',
		'thumbnails-slider' => 'wp-carousel-pro/thumbnails-slider',
		'tiles'             => 'wp-carousel-pro/tiles',
		'grid'              => 'wp-carousel-pro/tiles',
	);

	/**
	 * Pro block name → category slug, for the browse axis only.
	 *
	 * Kept apart from BLOCK_MAP on purpose: this resolves the row a Pro pattern is
	 * listed under, and must never resolve a block name for insertion.
	 *
	 * @var array<string, string>
	 */
	public const PRO_BLOCK_CATEGORIES = array(
		'wp-carousel-pro/carousel-panorama' => 'carousel-panorama',
		'wp-carousel-pro/marquee'           => 'marquee',
	);

	/**
	 * Category slug → sidebar label.
	 *
	 * @var array<string, string>
	 */
	public const LABEL_MAP = array(
		'carousel'          => 'Carousel',
		'slider'            => 'Slider',
		'thumbnails-slider' => 'Thumbnails Slider',
		'tiles'             => 'Tiles',
		'grid'              => 'Grid',
	);

	/**
	 * Sidebar category slugs in display order (excludes "all").
	 *
	 * @return string[]
	 */
	public static function sidebar_slugs(): array {
		return array_keys( self::BLOCK_MAP );
	}

	/**
	 * Resolve a block name from a source category slug.
	 *
	 * @param string $category_slug Source category slug.
	 * @return string|null Block name or null when unmapped.
	 */
	public static function block_name_for_category( string $category_slug ): ?string {
		return self::BLOCK_MAP[ $category_slug ] ?? null;
	}

	/**
	 * Resolve a category slug from a block name.
	 *
	 * A v2 item declares `blocks[]` and may omit `category` entirely; without this
	 * the block axis would show a zero badge for a pattern it plainly belongs to.
	 * The first mapping wins, so `tiles` beats its `grid` alias; a Pro block falls
	 * through to PRO_BLOCK_CATEGORIES.
	 *
	 * @param string $block_name Registered block name.
	 * @return string Category slug, or an empty string when unmapped.
	 */
	public static function category_for_block_name( string $block_name ): string {
		foreach ( self::BLOCK_MAP as $category_slug => $mapped_block ) {
			if ( $mapped_block === $block_name ) {
				return $category_slug;
			}
		}

		return self::PRO_BLOCK_CATEGORIES[ $block_name ] ?? '';
	}

	/**
	 * Resolve a display label from a source category slug.
	 *
	 * @param string $category_slug Source category slug.
	 * @return string
	 */
	public static function label_for_category( string $category_slug ): string {
		return self::LABEL_MAP[ $category_slug ] ?? ucwords( str_replace( '-', ' ', $category_slug ) );
	}
}
