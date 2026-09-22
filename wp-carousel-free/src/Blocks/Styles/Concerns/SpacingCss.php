<?php
/**
 * Spacing (top/right/bottom/left) CSS primitive for the dynamic-CSS generator.
 *
 * Mirrors the spacingGenerate() helper in the JS editor module
 * `blocks/blocks/shared/styles/cssHelpers.js`. Any change here MUST land on the
 * JS side in the same commit — the JS↔PHP parity harness in `tests/css-parity/`
 * will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Responsive spacing attribute → CSS shorthand value.
 */
trait SpacingCss {

	/**
	 * Generate spacing CSS string.
	 *
	 * Mirrors: cssHelpers.js spacingGenerate()
	 *
	 * @param array  $attr        Spacing attribute.
	 * @param string $device      Device type.
	 * @param bool   $is_single   Return single value only.
	 * @return string CSS spacing value.
	 */
	private function spacing_generate( $attr, $device = 'Desktop', $is_single = false ) {
		if ( ! $attr ) {
			return '';
		}

		// Legacy flat structure (old attribute format).
		if ( ! isset( $attr['device'] ) && isset( $attr['value'] ) && is_array( $attr['value'] ) ) {
			$unit = isset( $attr['unit'] ) && is_string( $attr['unit'] ) ? $attr['unit'] : 'px';
			$val  = $attr['value'];

			$top    = $this->coerce_spacing_side( $val['top'] ?? null );
			$right  = $this->coerce_spacing_side( $val['right'] ?? null );
			$bottom = $this->coerce_spacing_side( $val['bottom'] ?? null );
			$left   = $this->coerce_spacing_side( $val['left'] ?? null );

			if ( $is_single || ! empty( $attr['allChange'] ) ) {
				return $top . $unit;
			}
			return $top . $unit . ' ' . $right . $unit . ' ' . $bottom . $unit . ' ' . $left . $unit;
		}

		// Modern responsive structure.
		$unit = 'px';
		if ( isset( $attr['unit'] ) && is_string( $attr['unit'] ) ) {
			$unit = $attr['unit'];
		} elseif ( isset( $attr['unit'][ $device ] ) && is_string( $attr['unit'][ $device ] ) ) {
			$unit = $attr['unit'][ $device ];
		}

		$device_data = isset( $attr['device'][ $device ] ) ? $attr['device'][ $device ] : array();

		$top    = $this->coerce_spacing_side( $device_data['top'] ?? null );
		$right  = $this->coerce_spacing_side( $device_data['right'] ?? null );
		$bottom = $this->coerce_spacing_side( $device_data['bottom'] ?? null );
		$left   = $this->coerce_spacing_side( $device_data['left'] ?? null );

		if ( $is_single || ! empty( $attr['allChange'] ) ) {
			return $top . $unit;
		}
		return $top . $unit . ' ' . $right . $unit . ' ' . $bottom . $unit . ' ' . $left . $unit;
	}

	/**
	 * Coerce an unset spacing side to 0. Unset sides arrive as '' (the editor
	 * Spacing control's empty marker) or the legacy 'undefined' string rather than
	 * an absent key, so an isset() guard leaves them empty and a partially edited
	 * control emits `24px px px px`. Mirrors cssHelpers.js spacingGenerate().
	 *
	 * @param mixed $value Candidate side value.
	 * @return mixed 0 when unset, else the value verbatim.
	 */
	private function coerce_spacing_side( $value ) {
		return ( null === $value || '' === $value || 'undefined' === $value ) ? 0 : $value;
	}

	/**
	 * Whether a spacing attribute holds any set side on any breakpoint.
	 *
	 * Guards the per-concern spacing rule-string builders so an untouched control
	 * (all sides empty) emits no rule and the static stylesheet shows through.
	 *
	 * @param array $attr Spacing attribute with device/unit properties.
	 * @return bool True when at least one side is set on some device.
	 */
	private function has_spacing_changed( $attr ) {
		if ( ! $attr || ! isset( $attr['device'] ) ) {
			return false;
		}
		foreach ( $attr['device'] as $device_spacing ) {
			if ( ! $device_spacing ) {
				continue;
			}
			foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
				$value = $device_spacing[ $side ] ?? null;
				if ( null !== $value && '' !== $value && 'undefined' !== $value ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Whether a generated spacing shorthand is all-zero (e.g. "0px 0px 0px 0px",
	 * "0px"). Such a value equals the schema default and the static stylesheet,
	 * so emitting it is redundant.
	 *
	 * Mirrors: cssRuleHelpers.js isZeroSpacingValue().
	 *
	 * @param string $value Generated spacing CSS string.
	 * @return bool True when every length token resolves to zero.
	 */
	private function is_zero_spacing_value( $value ) {
		if ( ! is_string( $value ) || '' === trim( $value ) ) {
			return false;
		}
		foreach ( preg_split( '/\s+/', trim( $value ) ) as $token ) {
			if ( 0.0 !== (float) $token ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Get device spacing sides.
	 *
	 * Mirrors: carouselDynamicCss.js getDeviceSpacingSides()
	 *
	 * @param array  $attr        Spacing attribute.
	 * @param string $device_type Device type.
	 * @return array|null Spacing sides or null.
	 */
	private function get_device_spacing_sides( $attr, $device_type ) {
		if ( ! isset( $attr['device'][ $device_type ] ) ) {
			return null;
		}

		$unit_raw = $attr['unit'] ?? 'px';
		$unit     = is_array( $unit_raw )
			? ( $unit_raw[ $device_type ] ?? $unit_raw['Desktop'] ?? 'px' )
			: $unit_raw;

		$device_spacing = $attr['device'][ $device_type ];
		$top            = isset( $device_spacing['top'] ) ? (int) $device_spacing['top'] : 0;
		$right          = isset( $device_spacing['right'] ) ? (int) $device_spacing['right'] : $top;
		$bottom         = isset( $device_spacing['bottom'] ) ? (int) $device_spacing['bottom'] : $top;
		$left           = isset( $device_spacing['left'] ) ? (int) $device_spacing['left'] : $right;

		// All-zero device must not emit rules (inherit Desktop).
		if ( 0 === $top && 0 === $right && 0 === $bottom && 0 === $left ) {
			return null;
		}

		return array(
			'unit'   => $unit,
			'top'    => $top,
			'right'  => $right,
			'bottom' => $bottom,
			'left'   => $left,
		);
	}
}
