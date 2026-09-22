<?php
/**
 * Border CSS primitive for the dynamic-CSS generator (PHP side).
 *
 * Mirrors the borderCss() helper in the JS editor module
 * `blocks/blocks/shared/styles/cssHelpers.js`. Any change here MUST land on the
 * JS side in the same commit — the JS↔PHP parity harness in `tests/css-parity/`
 * will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Border attribute → CSS property map.
 */
trait BorderCss {

	/**
	 * Generate border CSS object.
	 *
	 * Mirrors: cssHelpers.js borderCss()
	 *
	 * @param array $border       Border attributes.
	 * @param array $border_width Border width attributes.
	 * @return array Border CSS properties.
	 */
	private function border_css( $border, $border_width ) {
		$border_style = $border['style'] ?? '';

		if ( 'none' === $border_style ) {
			return array( 'border' => 'none' );
		}

		$bw_unit = $border_width['unit'] ?? '';
		if ( is_array( $bw_unit ) ) {
			$bw_unit = isset( $bw_unit['Desktop'] ) && is_string( $bw_unit['Desktop'] ) && '' !== trim( $bw_unit['Desktop'] )
				? $bw_unit['Desktop']
				: 'px';
		}

		$desktop_width = $border_width['device']['Desktop'] ?? null;
		$width_value   = $border_width['value'] ?? null;
		if ( null === $width_value ) {
			$width_value = ! empty( $border_width['allChange'] ) && is_array( $desktop_width )
				? $desktop_width['top'] ?? null
				: $desktop_width;
		}

		return array(
			'border-style' => $border_style,
			'border-color' => $border['color'] ?? '',
			'border-width' => $this->css_data_check( $width_value, is_string( $bw_unit ) ? $bw_unit : 'px' ),
		);
	}
}
