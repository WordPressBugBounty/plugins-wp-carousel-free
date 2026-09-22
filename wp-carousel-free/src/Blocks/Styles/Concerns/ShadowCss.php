<?php
/**
 * Box-shadow CSS primitive for the dynamic-CSS generator (PHP side).
 *
 * Mirrors the getBoxShadowValue() helper in the JS editor module
 * `blocks/blocks/shared/styles/cssHelpers.js`. Any change here MUST land on the
 * JS side in the same commit — the JS↔PHP parity harness in `tests/css-parity/`
 * will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Box-shadow attribute → CSS value.
 */
trait ShadowCss {

	/**
	 * Generate box-shadow CSS string.
	 *
	 * Mirrors: cssHelpers.js getBoxShadowValue()
	 *
	 * @param array $shadow Shadow settings.
	 * @return string CSS box-shadow value.
	 */
	private function get_box_shadow_value( $shadow ) {
		if ( ! $shadow || ! is_array( $shadow ) ) {
			return '';
		}

		$is_active      = $shadow['isActive'] ?? false;
		$color          = $shadow['color'] ?? '';
		$select_default = $shadow['selectDefault'] ?? '';
		$value          = $shadow['value'] ?? array();
		$unit           = $shadow['unit'] ?? '';

		if ( '' === $color ) {
			return '';
		}

		// Predefined shadow (not custom): presets are our own
		// var(--wpcp-shadow-*) tokens; anything else is dropped.
		if ( 'custom' !== $select_default ) {
			return $select_default ? Css_Helpers::sanitize_shadow_preset( (string) $select_default ) : '';
		}

		// Custom shadow.
		$shadow_unit = strtolower( (string) $unit );

		// Responsive object value (top/right/bottom/left).
		if ( is_array( $value ) && null !== $value ) {
			$safe_color = Css_Helpers::sanitize_color( (string) $color );
			if ( '' === $safe_color ) {
				return '';
			}
			// Coerce each side through the strict numeric gate so an array/NaN
			// side cannot stringify as "Array" or "NaN" inside the value.
			$top    = Css_Helpers::to_finite_number( isset( $value['top'] ) ? $value['top'] : 0 );
			$right  = Css_Helpers::to_finite_number( isset( $value['right'] ) ? $value['right'] : 0 );
			$bottom = Css_Helpers::to_finite_number( isset( $value['bottom'] ) ? $value['bottom'] : 0 );
			$left   = Css_Helpers::to_finite_number( isset( $value['left'] ) ? $value['left'] : 0 );
			$inset  = 'inset' === $shadow_unit ? 'inset ' : '';

			return trim( $inset . $top . 'px ' . $right . 'px ' . $bottom . 'px ' . $left . 'px ' . $safe_color );
		}

		// Fallback: if value is a raw string/number (very old format).
		return isset( $value ) ? trim( (string) $value ) : 'none';
	}
}
