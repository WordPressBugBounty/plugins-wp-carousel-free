<?php
/**
 * Pagination per-style dimension resolver (PHP side).
 *
 * Resolves the size of each pagination style (dots, dynamic, stepper) into
 * clamped CSS lengths for the `--wpcp-pag-*` variables
 * the static stylesheet reads. Merges a partial saved `dims` tree over the
 * built-in defaults. PHP parity with paginationDynamicCss.js; the Pagination
 * token primitive consumes the result.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * Resolves `dims` and emits clamped lengths for `--wpcp-pag-*`.
 */
final class PaginationDimsHelper {

	private const STYLE_KEYS = array( 'dots', 'dynamic', 'stepper' );

	/**
	 * The built-in per-style dimension defaults (each style → its sizable fields).
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private static function default_dims(): array {
		$px3                 = array(
			'Desktop' => 'px',
			'Tablet'  => 'px',
			'Mobile'  => 'px',
		);
		$build_device_values = static function ( $value, $unit = 'px' ) {
			return array(
				'device' => array(
					'Desktop' => $value,
					'Tablet'  => $value,
					'Mobile'  => $value,
				),
				'unit'   => array(
					'Desktop' => $unit,
					'Tablet'  => $unit,
					'Mobile'  => $unit,
				),
			);
		};
		$build_size_pair     = static function ( $width, $height, $unit = 'px' ) use ( $build_device_values ) {
			return array(
				'width'  => $build_device_values( $width, $unit ),
				'height' => $build_device_values( $height, $unit ),
			);
		};
		return array(
			'dots'    => $build_size_pair( 12, 12 ),
			'dynamic' => $build_size_pair( 12, 12 ),
			'stepper' => $build_size_pair( 14, 5 ),
		);
	}

	/**
	 * Overlay a partial saved `dims` tree onto the defaults so every style/field
	 * is present. The control only persists the fields the user touched; this
	 * back-fills the rest (per-device value + unit maps) from default_dims().
	 *
	 * @param array<string,mixed> $stored Partial saved dims.
	 * @return array<string,array<string,mixed>>
	 */
	public static function merge_defaults( array $stored ): array {
		$out = self::default_dims();
		foreach ( self::STYLE_KEYS as $key ) {
			if ( empty( $stored[ $key ] ) || ! is_array( $stored[ $key ] ) ) {
				continue;
			}
			foreach ( $stored[ $key ] as $field => $sav ) {
				if ( ! is_array( $sav ) || empty( $sav['device'] ) || ! is_array( $sav['device'] ) ) {
					continue;
				}
				$base                  = isset( $out[ $key ][ $field ]['device'] ) && is_array( $out[ $key ][ $field ]['device'] )
					? $out[ $key ][ $field ]
					: array(
						'device' => array(),
						'unit'   => array(),
					);
				$out[ $key ][ $field ] = array(
					'device' => array_merge( $base['device'] ?? array(), $sav['device'] ),
					'unit'   => array_merge( $base['unit'] ?? array(), $sav['unit'] ?? array() ),
				);
			}
		}
		return $out;
	}

	/**
	 * Resolve the effective per-style dims for a block: the saved `dims` merged
	 * over the built-in defaults.
	 *
	 * @param array<string,mixed> $pbo Pagination options.
	 * @return array<string,array<string,mixed>>
	 */
	public static function resolve_all( array $pbo ): array {
		return self::merge_defaults( is_array( $pbo['dims'] ?? null ) ? $pbo['dims'] : array() );
	}

	/**
	 * Clamp one dimension field to its per-unit range and return a CSS length.
	 *
	 * Pagination dims are user-entered, so each unit (px/em/%) carries its own sane
	 * min/max — a stray value can't blow out the layout. Resolves the device value
	 * (with Desktop fallback), clamps it against the range for its unit, and appends
	 * the unit; falls back to `$fallback_num . $fallback_unit` when the field is absent.
	 *
	 * @param array|null $field Responsive field `{ device: [], unit: [] }`, or null.
	 * @param string     $device Desktop|Tablet|Mobile.
	 * @param callable   $get_device_value Resolver: ( $map, $device, $fallback ) => value.
	 * @param array      $px_range [min, max] bounds for px values.
	 * @param array      $em_range [min, max] bounds for em values.
	 * @param array      $pct_range [min, max] bounds for percent values.
	 * @param float      $fallback_num Numeric fallback when the field is absent.
	 * @param string     $fallback_unit Unit paired with the fallback (default px).
	 * @return string Clamped length with unit (e.g. "12px").
	 */
	private static function dim_field_css(
		?array $field,
		string $device,
		callable $get_device_value,
		array $px_range,
		array $em_range,
		array $pct_range,
		float $fallback_num,
		string $fallback_unit = 'px'
	): string {
		if ( empty( $field['device'] ) || ! is_array( $field['device'] ) ) {
			return $fallback_num . $fallback_unit;
		}
		$n    = (float) $get_device_value( $field['device'], $device, $fallback_num );
		$unit = strtolower( (string) $get_device_value( $field['unit'] ?? array(), $device, 'px' ) );
		if ( ! in_array( $unit, array( 'px', 'em', '%' ), true ) ) {
			$unit = 'px';
		}
		if ( 'px' === $unit ) {
			$n = max( $px_range[0], min( $px_range[1], $n ) );
		} elseif ( 'em' === $unit ) {
			$n = max( $em_range[0], min( $em_range[1], $n ) );
		} else {
			$n = max( $pct_range[0], min( $pct_range[1], $n ) );
		}
		return $n . $unit;
	}

	/**
	 * Build the `--wpcp-pag-*` dimension variables for one breakpoint, keyed by the
	 * active pagination style (only that style's fields are emitted).
	 *
	 * @param array<string,mixed> $pbo Pagination block options.
	 * @param string              $device Desktop|Tablet|Mobile.
	 * @param callable            $get_device_value Resolver: ( $map, $device, $fallback ) => value.
	 * @return array<string,string> Variable name (with leading --) => value.
	 */
	public static function dimension_css_vars( array $pbo, string $device, callable $get_device_value ): array {
		$style    = AllowedValues::pagination_style( $pbo['paginationStyle'] ?? '' );
		$all_dims = self::resolve_all( $pbo );
		if ( ! isset( $all_dims[ $style ] ) ) {
			$style = 'dots';
		}
		$d = $all_dims[ $style ];

		$vars = array();

		switch ( $style ) {
			case 'dots':
			case 'dynamic':
				$vars['--wpcp-pag-item-w'] = self::dim_field_css( $d['width'] ?? null, $device, $get_device_value, array( 2, 80 ), array( 0.15, 5 ), array( 2, 100 ), 12 );
				$vars['--wpcp-pag-item-h'] = self::dim_field_css( $d['height'] ?? null, $device, $get_device_value, array( 2, 80 ), array( 0.15, 5 ), array( 2, 100 ), 12 );
				break;
			case 'stepper':
				$vars['--wpcp-pag-stepper-w'] = self::dim_field_css( $d['width'] ?? null, $device, $get_device_value, array( 2, 80 ), array( 0.1, 4 ), array( 2, 50 ), 14 );
				$vars['--wpcp-pag-stepper-h'] = self::dim_field_css( $d['height'] ?? null, $device, $get_device_value, array( 2, 80 ), array( 0.1, 4 ), array( 2, 50 ), 5 );
				break;
			default:
				$vars['--wpcp-pag-item-w'] = self::dim_field_css( $d['width'] ?? null, $device, $get_device_value, array( 2, 80 ), array( 0.15, 5 ), array( 2, 100 ), 12 );
				$vars['--wpcp-pag-item-h'] = self::dim_field_css( $d['height'] ?? null, $device, $get_device_value, array( 2, 80 ), array( 0.15, 5 ), array( 2, 100 ), 12 );
		}

		return $vars;
	}
}
