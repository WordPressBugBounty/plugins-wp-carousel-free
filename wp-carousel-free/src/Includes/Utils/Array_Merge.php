<?php
/**
 * Shared deep array merge for settings blobs.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Includes\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * Array_Merge utility.
 *
 * Consolidates the identical private deep-merge copies the Dashboard module
 * settings classes used to carry. Note the semantics differ from
 * `Blocks\Schema\Util\DeepMerge::recursive()`: this helper merges *all*
 * nested arrays recursively (sequential arrays merge index-by-index), which
 * is the behavior saved settings blobs rely on — do not swap one for the
 * other.
 */
class Array_Merge {

	/**
	 * Deep-merge two arrays (override wins; nested arrays merge recursively).
	 *
	 * @param array<string, mixed> $base     Base array (defaults).
	 * @param array<string, mixed> $override Overrides (saved values).
	 * @return array<string, mixed>
	 */
	public static function deep( array $base, array $override ) {
		foreach ( $override as $key => $value ) {
			if ( is_array( $value ) && isset( $base[ $key ] ) && is_array( $base[ $key ] ) ) {
				$base[ $key ] = self::deep( $base[ $key ], $value );
			} else {
				$base[ $key ] = $value;
			}
		}

		return $base;
	}
}
