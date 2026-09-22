<?php
/**
 * Stateless CSS helpers for block frontend render.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

defined( 'ABSPATH' ) || exit;

/**
 * Static helpers extracted from BlockRenderer for clarity and reuse.
 */
final class StyleHelper {

	/**
	 * Normalise a CSS length unit to an allowed keyword, defaulting to px.
	 *
	 * @param string $unit Unit string.
	 * @return string
	 */
	public static function css_unit( string $unit ): string {
		$normalized_unit = strtolower( trim( $unit ) );
		$allowed         = array( 'px', '%', 'em', 'rem', 'vw', 'vh' );
		return in_array( $normalized_unit, $allowed, true ) ? $normalized_unit : 'px';
	}
}
