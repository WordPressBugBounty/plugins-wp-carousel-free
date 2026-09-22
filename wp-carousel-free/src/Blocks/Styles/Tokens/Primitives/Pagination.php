<?php
/**
 * Pagination token transform primitives (frontend side).
 *
 * Convert the paginationOptions tree into `--wpcp-pag-*` token values for
 * EmitTokens — colors, backgrounds, borders, and clamped dimensions — applying
 * the per-style gating the dots vs numbers styles need (e.g.
 * the text styles suppress the dot fill color). Mirrors
 * blocks/blocks/shared/styles/tokens/primitives/pagination.js value-for-value;
 * both sides must agree (the css-parity value-map gate).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Tokens\Primitives;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\PaginationDimsHelper;
use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Pagination-specific token transforms (the `pag*` / `pagination*` transform
 * names dispatched by Primitives::apply).
 */
final class Pagination {

	/**
	 * The [min, max] px clamp bounds from a px/em/pct range triple.
	 *
	 * @param array<string,mixed> $ranges Range triple keyed px/em/pct.
	 * @return array{0:float,1:float}
	 */
	private static function px_range( array $ranges ): array {
		return array( (float) $ranges['px'][0], (float) $ranges['px'][1] );
	}

	/**
	 * The [min, max] em clamp bounds from a px/em/pct range triple.
	 *
	 * @param array<string,mixed> $ranges Range triple keyed px/em/pct.
	 * @return array{0:float,1:float}
	 */
	private static function em_range( array $ranges ): array {
		return array( (float) $ranges['em'][0], (float) $ranges['em'][1] );
	}

	/**
	 * The [min, max] percent clamp bounds from a px/em/pct range triple.
	 *
	 * @param array<string,mixed> $ranges Range triple keyed px/em/pct.
	 * @return array{0:float,1:float}
	 */
	private static function pct_range( array $ranges ): array {
		return array( (float) $ranges['pct'][0], (float) $ranges['pct'][1] );
	}

	/**
	 * Clamp a number into [min, max], substituting the fallback for a non-finite value.
	 *
	 * @param mixed $value Candidate number.
	 * @param float $min   Minimum.
	 * @param float $max   Maximum.
	 * @param float $fallback Fallback when non-finite.
	 * @return float Clamped value.
	 */
	private static function clamp_num( $value, float $min, float $max, float $fallback ): float {
		$n = (float) $value;
		if ( ! is_finite( $n ) ) {
			return $fallback;
		}
		return min( $max, max( $min, $n ) );
	}

	/**
	 * Resolve a responsive dim field to a clamped CSS length for one device.
	 *
	 * @param array<string,mixed>|null $field        Responsive field.
	 * @param string                   $device       Device key.
	 * @param array<string,mixed>      $ranges       Clamp ranges.
	 * @param float                    $fallback_num Numeric fallback.
	 * @return string Length with unit.
	 */
	private static function dim_field_to_css( ?array $field, string $device, array $ranges, float $fallback_num ): string {
		$get_device_value = static function ( $arr, string $device_key, $fallback ) {
			if ( ! is_array( $arr ) ) {
				return $fallback;
			}
			if ( array_key_exists( $device_key, $arr ) ) {
				return $arr[ $device_key ];
			}
			if ( array_key_exists( 'Desktop', $arr ) ) {
				return $arr['Desktop'];
			}
			return $fallback;
		};

		if ( empty( $field['device'] ) || ! is_array( $field['device'] ) ) {
			return $fallback_num . 'px';
		}
		$n    = (float) $get_device_value( $field['device'], $device, $fallback_num );
		$unit = strtolower( (string) $get_device_value( $field['unit'] ?? array(), $device, 'px' ) );
		if ( ! in_array( $unit, array( 'px', 'em', '%' ), true ) ) {
			$unit = 'px';
		}
		if ( 'px' === $unit ) {
			list( $lo, $hi ) = self::px_range( $ranges );
			$n               = self::clamp_num( $n, $lo, $hi, $fallback_num );
		} elseif ( 'em' === $unit ) {
			list( $lo, $hi ) = self::em_range( $ranges );
			$n               = self::clamp_num( $n, $lo, $hi, 0.75 );
		} else {
			list( $lo, $hi ) = self::pct_range( $ranges );
			$n               = self::clamp_num( $n, $lo, $hi, 8 );
		}
		return $n . $unit;
	}

	/**
	 * Whether a background value is effectively absent — null, empty, the
	 * `transparent` keyword, or a zero-alpha rgba()/8-digit hex. Such a background
	 * is left to the static stylesheet, so no token is emitted.
	 *
	 * @param mixed $raw Color candidate.
	 * @return bool True when transparent/unset.
	 */
	private static function is_transparent_or_unset_bg( $raw ): bool {
		if ( null === $raw ) {
			return true;
		}
		$s = strtolower( trim( (string) $raw ) );
		if ( '' === $s || 'transparent' === $s ) {
			return true;
		}
		if ( preg_match( '/^rgba?\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*(?:,\s*([0-9.]+%?)\s*)?\)$/i', $s, $rgba ) ) {
			if ( isset( $rgba[4] ) && '' !== $rgba[4] ) {
				$a = (float) str_replace( '%', '', $rgba[4] );
				if ( 0.0 === $a ) {
					return true;
				}
			}
		}
		if ( preg_match( '/^#[0-9a-f]{8}$/i', $s ) && '00' === strtolower( substr( $s, -2 ) ) ) {
			return true;
		}
		return false;
	}

	/**
	 * The active pagination style key (defaults to `dots`).
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string Style key.
	 */
	private static function pag_style( array $pag ): string {
		return AllowedValues::pagination_style( $pag['paginationStyle'] ?? '' );
	}

	/**
	 * Whether the style renders text rather than dots — it routes color to the
	 * text-color tokens, not the dot fill/background tokens.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return bool True for the numbers style.
	 */
	private static function is_text_color_style( array $pag ): bool {
		return 'numbers' === self::pag_style( $pag );
	}

	/**
	 * Gap between pagination items, clamped per unit (default 8px).
	 *
	 * @param array<string,mixed> $pag    Pagination options.
	 * @param array<string,mixed> $row    Config row.
	 * @param string              $device Device key.
	 * @return string Gap length.
	 */
	public static function pagination_gap( array $pag, array $row, string $device ): string {
		unset( $row );
		$ranges = array(
			'px'  => array( 0, 64 ),
			'em'  => array( 0, 4 ),
			'pct' => array( 0, 24 ),
		);
		return self::dim_field_to_css(
			array(
				'device' => $pag['gap']['device'] ?? null,
				'unit'   => $pag['gap']['unit'] ?? null,
			),
			$device,
			$ranges,
			8
		);
	}

	/**
	 * One dimension token for the active style — picks the style's field
	 * (`$row['dimField']`) and clamp range (`$row['rangesKey']`), then clamps.
	 *
	 * @param array<string,mixed> $pag    Pagination options.
	 * @param array<string,mixed> $row    Config row (dimField, rangesKey, fallback).
	 * @param string              $device Device key.
	 * @return string|null Dimension token value.
	 */
	public static function pagination_dim( array $pag, array $row, string $device ): ?string {
		$get_device_value = static function ( $arr, string $device_key, $fallback ) {
			if ( ! is_array( $arr ) ) {
				return $fallback;
			}
			if ( array_key_exists( $device_key, $arr ) ) {
				return $arr[ $device_key ];
			}
			if ( array_key_exists( 'Desktop', $arr ) ) {
				return $arr['Desktop'];
			}
			return $fallback;
		};

		$style    = self::pag_style( $pag );
		$all_dims = PaginationDimsHelper::resolve_all( $pag );
		if ( ! isset( $all_dims[ $style ] ) ) {
			$style = 'dots';
		}
		$style_dims = $all_dims[ $style ];
		$dim_field  = $row['dimField'] ?? 'width';
		$field      = $style_dims[ $dim_field ] ?? null;

		$ranges_map = array(
			'item'         => array(
				'px'  => array( 2, 80 ),
				'em'  => array( 0.15, 5 ),
				'pct' => array( 2, 100 ),
			),
			'strokeActive' => array(
				'px'  => array( 8, 120 ),
				'em'  => array( 0.3, 6 ),
				'pct' => array( 10, 100 ),
			),
			'scrollH'      => array(
				'px'  => array( 2, 24 ),
				'em'  => array( 0.1, 2 ),
				'pct' => array( 1, 30 ),
			),
			'step'         => array(
				'px'  => array( 2, 80 ),
				'em'  => array( 0.1, 4 ),
				'pct' => array( 2, 50 ),
			),
			'frac'         => array(
				'px'  => array( 8, 48 ),
				'em'  => array( 0.3, 3 ),
				'pct' => array( 5, 100 ),
			),
			'fracW'        => array(
				'px'  => array( 24, 220 ),
				'em'  => array( 2, 16 ),
				'pct' => array( 20, 100 ),
			),
		);
		$ranges_key = $row['rangesKey'] ?? 'item';
		$ranges     = $ranges_map[ $ranges_key ] ?? $ranges_map['item'];
		$fallback   = isset( $row['fallback'] ) ? (float) $row['fallback'] : 12.0;

		unset( $get_device_value );
		return self::dim_field_to_css( is_array( $field ) ? $field : null, $device, $ranges, $fallback );
	}

	/**
	 * Sanitize a pagination color token value.
	 *
	 * @param mixed $raw Raw color from pagination options.
	 * @return string|null Safe color, or null when invalid.
	 */
	private static function pag_color_token( $raw ): ?string {
		$sanitized = Css_Helpers::sanitize_color( (string) $raw );
		return '' === $sanitized ? null : $sanitized;
	}

	/**
	 * Normal dot color (suppressed for the numbers text style).
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Color token.
	 */
	public static function pag_color( array $pag ): ?string {
		if ( empty( $pag['colorNormal'] ) || self::is_text_color_style( $pag ) ) {
			return null;
		}
		return self::pag_color_token( $pag['colorNormal'] );
	}

	/**
	 * Normal text color for the numbers style.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Text color token.
	 */
	public static function pag_text_color( array $pag ): ?string {
		if ( empty( $pag['colorNormal'] ) ) {
			return null;
		}
		return self::pag_color_token( $pag['colorNormal'] );
	}

	/**
	 * Active dot color — the hover color if set, else the normal color; suppressed
	 * for the text styles.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Active color token.
	 */
	public static function pag_active_color( array $pag ): ?string {
		if ( self::is_text_color_style( $pag ) ) {
			return null;
		}
		$active = ! empty( $pag['colorHover'] ) ? $pag['colorHover'] : ( $pag['colorNormal'] ?? '' );
		if ( '' === $active ) {
			return null;
		}
		return self::pag_color_token( $active );
	}

	/**
	 * Active text color (numbers) — prefers the hover color, else the
	 * normal color.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Active text color token.
	 */
	public static function pag_active_text_color( array $pag ): ?string {
		if ( ! empty( $pag['colorHover'] ) ) {
			return self::pag_color_token( $pag['colorHover'] );
		}
		if ( ! empty( $pag['colorNormal'] ) ) {
			return self::pag_color_token( $pag['colorNormal'] );
		}
		return null;
	}

	/**
	 * Normal item background (skipped when transparent/unset).
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Background token.
	 */
	public static function pag_bg( array $pag ): ?string {
		if ( self::is_transparent_or_unset_bg( $pag['bgNormal'] ?? null ) ) {
			return null;
		}
		return self::pag_color_token( $pag['bgNormal'] );
	}

	/**
	 * Active background — the hover background if set, else the normal
	 * background; skipped when transparent/unset.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Active background token.
	 */
	public static function pag_active_bg( array $pag ): ?string {
		if ( ! self::is_transparent_or_unset_bg( $pag['bgHover'] ?? null ) ) {
			return self::pag_color_token( $pag['bgHover'] );
		}
		if ( ! self::is_transparent_or_unset_bg( $pag['bgNormal'] ?? null ) ) {
			return self::pag_color_token( $pag['bgNormal'] );
		}
		return null;
	}

	/**
	 * Normal border style.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Border style token.
	 */
	public static function pag_border_style( array $pag ): ?string {
		if ( empty( $pag['borderNormal']['style'] ) ) {
			return null;
		}
		return (string) $pag['borderNormal']['style'];
	}

	/**
	 * Active border style — shares the normal style.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Active border style token.
	 */
	public static function pag_active_border_style( array $pag ): ?string {
		if ( empty( $pag['borderNormal']['style'] ) ) {
			return null;
		}
		return (string) $pag['borderNormal']['style'];
	}

	/**
	 * Normal border color.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Border color token.
	 */
	public static function pag_border_color( array $pag ): ?string {
		if ( empty( $pag['borderNormal']['color'] ) ) {
			return null;
		}
		return self::pag_color_token( $pag['borderNormal']['color'] );
	}

	/**
	 * Active border color — the hover color if set, else the normal color.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Active border color token.
	 */
	public static function pag_active_border_color( array $pag ): ?string {
		if ( ! empty( $pag['borderHover']['color'] ) ) {
			return self::pag_color_token( $pag['borderHover']['color'] );
		}
		if ( ! empty( $pag['borderNormal']['color'] ) ) {
			return self::pag_color_token( $pag['borderNormal']['color'] );
		}
		return null;
	}

	/**
	 * Normal border width (the single top value + unit).
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Border width token.
	 */
	public static function pag_border_width( array $pag ): ?string {
		if ( ! isset( $pag['borderWidthNormal']['value']['top'] ) ) {
			return null;
		}
		$unit = isset( $pag['borderWidthNormal']['unit'] ) ? (string) $pag['borderWidthNormal']['unit'] : 'px';
		return (string) $pag['borderWidthNormal']['value']['top'] . $unit;
	}

	/**
	 * Active border width — shares the normal width.
	 *
	 * @param array<string,mixed> $pag Pagination options.
	 * @return string|null Active border width token.
	 */
	public static function pag_active_border_width( array $pag ): ?string {
		if ( ! isset( $pag['borderWidthNormal']['value']['top'] ) ) {
			return null;
		}
		$unit = isset( $pag['borderWidthNormal']['unit'] ) ? (string) $pag['borderWidthNormal']['unit'] : 'px';
		return (string) $pag['borderWidthNormal']['value']['top'] . $unit;
	}
}
