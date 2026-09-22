<?php
/**
 * Ranger (single responsive value) CSS primitive for the dynamic-CSS generator.
 *
 * Mirrors the rangerCss() helper in the JS editor module
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
 * Responsive ranger attribute → CSS value with unit.
 */
trait RangerCss {

	/**
	 * Generate ranger CSS string from responsive ranger attribute.
	 *
	 * Mirrors: cssHelpers.js rangerCss()
	 *
	 * @param array  $attr   - Spacing attribute.
	 * @param string $device - Device name (Desktop, Tablet, Mobile).
	 * @return string CSS value with unit.
	 */
	private function ranger_css( $attr, $device = 'Desktop' ) {
		if ( empty( $attr['device'][ $device ] ) ) {
			return '';
		}
		$unit = Css_Helpers::sanitize_css_unit( $attr['unit'][ $device ] ?? '' );
		return $attr['device'][ $device ] . $unit;
	}

	/**
	 * Parse SPRangeControl-shaped attribute (device + unit) or scalar / legacy flat array.
	 *
	 * Mirrors: carouselDynamicCss.js getSocialRangerDimension()
	 *
	 * @param mixed  $attr        iconSize, iconAreaSize, or gap.
	 * @param string $device_type Desktop|Tablet|Mobile.
	 * @return array{0: float, 1: string}|null Numeric value and CSS unit, or null.
	 */
	private function social_ranger_dimension( $attr, $device_type ) {
		if ( null === $attr || '' === $attr ) {
			return null;
		}
		if ( is_numeric( $attr ) ) {
			return array( (float) $attr, 'px' );
		}
		if ( ! is_array( $attr ) ) {
			return null;
		}
		if ( isset( $attr['device'] ) && is_array( $attr['device'] ) && array_key_exists( $device_type, $attr['device'] ) ) {
			$raw = $attr['device'][ $device_type ];
			if ( '' === $raw || null === $raw ) {
				return null;
			}
			$unit = 'px';
			if ( isset( $attr['unit'] ) && is_array( $attr['unit'] ) ) {
				$unit = isset( $attr['unit'][ $device_type ] )
					? (string) $attr['unit'][ $device_type ]
					: (string) ( $attr['unit']['Desktop'] ?? 'px' );
			} elseif ( isset( $attr['unit'] ) && is_string( $attr['unit'] ) ) {
				$unit = $attr['unit'];
			}
			$unit = Css_Helpers::sanitize_css_unit( $unit );
			return array( (float) $raw, '' === $unit ? 'px' : $unit );
		}
		if ( isset( $attr[ $device_type ] ) && '' !== $attr[ $device_type ] && null !== $attr[ $device_type ] ) {
			return array( (float) $attr[ $device_type ], 'px' );
		}
		return null;
	}
}
