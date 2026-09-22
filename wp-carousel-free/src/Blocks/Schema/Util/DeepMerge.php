<?php
/**
 * Deep-merge helper for additive attribute schema overrides.
 *
 * Supports exactly two operations: ADD (a key in $override not in $base is
 * added) and REPLACE (a key in both has its $base value replaced or merged
 * with $override). No deletion primitive — no sentinel value removes a key.
 * Sequential arrays REPLACE wholesale; associative arrays merge recursively.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema\Util;

defined( 'ABSPATH' ) || exit;

/**
 * DeepMerge utility.
 */
class DeepMerge {

	/**
	 * Recursively merge $override into $base. See class docblock for semantics.
	 *
	 * @param array $base     Base map.
	 * @param array $override Override map.
	 * @return array
	 */
	public static function recursive( array $base, array $override ): array {
		foreach ( $override as $key => $override_value ) {
			if (
				array_key_exists( $key, $base )
				&& is_array( $base[ $key ] )
				&& is_array( $override_value )
				&& self::is_assoc( $base[ $key ] )
				&& self::is_assoc( $override_value )
			) {
				$base[ $key ] = self::recursive( $base[ $key ], $override_value );
			} else {
				$base[ $key ] = $override_value;
			}
		}
		return $base;
	}

	/**
	 * True when the input is empty or has all string keys (associative).
	 * False when it is sequential (numeric 0..n-1).
	 *
	 * @param array $candidate Array to test.
	 * @return bool
	 */
	private static function is_assoc( array $candidate ): bool {
		if ( empty( $candidate ) ) {
			return true;
		}
		return array_keys( $candidate ) !== range( 0, count( $candidate ) - 1 );
	}
}
