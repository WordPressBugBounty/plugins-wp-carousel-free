<?php
/**
 * Tiles AJAX pagination dynamic CSS generator.
 *
 * Distinct from `PaginationDimsHelper.php` — that helper belongs to the
 * carousel-style slide-bullet pagination (kept on `.wpcp-pagination`). Do not
 * edit it for Tiles work.
 *
 * Default-value short-circuit: values matching the `TilesSchema` defaults
 * are NOT emitted here — the static baseline in `blocks/blocks/style.scss`
 * already provides them. Only user-customised values become inline overrides.
 * Mirrors `blocks/blocks/shared/styles/ajaxPaginationDynamicCss.js` byte-for-byte.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Class AjaxPaginationStyle.
 */
class AjaxPaginationStyle {

	const TABLET_BREAKPOINT = Breakpoints::TABLET;
	const MOBILE_BREAKPOINT = Breakpoints::MOBILE;

	/**
	 * Schema defaults mirrored from `TilesSchema::paginationOptions`.
	 * Matching values are skipped so the static SCSS baseline shows through.
	 */
	private static function defaults(): array {
		return array(
			'justifyContent'       => 'center',
			'gap'                  => array(
				'value' => 10,
				'unit'  => 'px',
			),
			'padding'              => array(
				'Desktop' => array(
					'top'    => 15,
					'right'  => 0,
					'bottom' => 15,
					'left'   => 0,
					'unit'   => 'px',
				),
			),
			'margin'               => array(
				'Desktop' => array(
					'top'    => 48,
					'right'  => 0,
					'bottom' => 0,
					'left'   => 0,
					'unit'   => 'px',
				),
			),
			'color'                => '#2c2d2f',
			'backgroundColor'      => '#ffffff',
			'colorHover'           => '#ffffff',
			'backgroundColorHover' => '#19949e',
			'borderStyle'          => 'solid',
			'borderWidth'          => array(
				'top'    => 1,
				'right'  => 1,
				'bottom' => 1,
				'left'   => 1,
				'unit'   => 'px',
			),
			'borderColor'          => '#dddddd',
			'borderColorHover'     => '#19949e',
			'borderRadius'         => array(
				'Desktop' => array(
					'top'    => 3,
					'right'  => 3,
					'bottom' => 3,
					'left'   => 3,
					'unit'   => 'px',
				),
			),
		);
	}

	/**
	 * Generate scoped CSS for the Tiles AJAX pagination wrapper.
	 *
	 * @param array $attributes Block attributes.
	 * @return string CSS string (may be empty).
	 */
	public static function generate( array $attributes ): string {
		$unique_id          = isset( $attributes['uniqueId'] ) ? (string) $attributes['uniqueId'] : '';
		$pagination_options = isset( $attributes['paginationOptions'] ) && is_array( $attributes['paginationOptions'] )
			? $attributes['paginationOptions']
			: array();
		if ( '' === $unique_id || empty( $pagination_options ) ) {
			return '';
		}

		$root             = '#' . $unique_id . ' .wpcp-ajax-pagination';
		$number_root      = $root . '.wpcp-ajax-pagination--number';
		$button_selector  = $root . ' .wpcp-ajax-pagination__btn:not(.is-ellipsis)';
		$hover_active_sel = $root . ' .wpcp-ajax-pagination__btn:not(.is-ellipsis):hover:not(:disabled), ' . $root . ' .wpcp-ajax-pagination__btn.is-active';

		$by_device = array(
			'Desktop' => array(),
			'Tablet'  => array(),
			'Mobile'  => array(),
		);

		foreach ( array( 'Desktop', 'Tablet', 'Mobile' ) as $device ) {
			$wrapper = self::collect_wrapper_styles( $pagination_options, $device );
			$justify = $wrapper['justify-content'] ?? '';
			unset( $wrapper['justify-content'] );

			if ( ! empty( $wrapper ) ) {
				$by_device[ $device ][] = array(
					'selector' => $root,
					'styles'   => $wrapper,
				);
			}
			if ( '' !== $justify ) {
				$by_device[ $device ][] = array(
					'selector' => $number_root,
					'styles'   => array( 'justify-content' => $justify ),
				);
			}

			$normal_button = self::collect_button_styles( $pagination_options, $device, false );
			if ( ! empty( $normal_button ) ) {
				$by_device[ $device ][] = array(
					'selector' => $button_selector,
					'styles'   => $normal_button,
				);
			}

			$typography = self::collect_typography_styles( $pagination_options, $device );
			if ( ! empty( $typography ) ) {
				$by_device[ $device ][] = array(
					'selector' => $button_selector,
					'styles'   => $typography,
				);
			}

			$hover_button = self::collect_button_styles( $pagination_options, $device, true );
			if ( ! empty( $hover_button ) ) {
				$by_device[ $device ][] = array(
					'selector' => $hover_active_sel,
					'styles'   => $hover_button,
				);
			}
		}

		$desktop_css = self::rules_to_css( $by_device['Desktop'] );
		$tablet_css  = self::wrap_media( self::rules_to_css( $by_device['Tablet'] ), 'only screen and (max-width: ' . self::TABLET_BREAKPOINT . 'px)' );
		$mobile_css  = self::wrap_media( self::rules_to_css( $by_device['Mobile'] ), 'only screen and (max-width: ' . self::MOBILE_BREAKPOINT . 'px)' );

		return trim( implode( "\n", array_filter( array( $desktop_css, $tablet_css, $mobile_css ) ) ) );
	}

	/**
	 * Collect wrapper-level styles for one breakpoint.
	 *
	 * @param array  $pagination_options Pagination options.
	 * @param string $device             Desktop|Tablet|Mobile.
	 */
	private static function collect_wrapper_styles( array $pagination_options, string $device ): array {
		$styles   = array();
		$defaults = self::defaults();

		if ( 'Desktop' === $device ) {
			$justify = isset( $pagination_options['justifyContent'] ) ? (string) $pagination_options['justifyContent'] : '';
			if ( '' !== $justify && $defaults['justifyContent'] !== $justify ) {
				$styles['justify-content'] = $justify;
			}
		}

		$gap_value = self::get_device_value( $pagination_options['gap']['device'] ?? null, $device, null );
		if ( null !== $gap_value && '' !== $gap_value && is_numeric( $gap_value ) ) {
			$gap_unit = self::get_unit_for_device( $pagination_options['gap']['unit'] ?? null, $device, 'px' );
			$gap_num  = (float) $gap_value;
			if ( $gap_num !== (float) $defaults['gap']['value'] || $gap_unit !== $defaults['gap']['unit'] ) {
				$styles['gap'] = self::trim_num( $gap_num ) . $gap_unit;
			}
		}

		$margin_parts = self::spacing_device_parts( $pagination_options['margin'] ?? null, $device );
		if ( null !== $margin_parts && ! self::spacing_parts_match_default( $margin_parts, $defaults['margin'][ $device ] ?? null ) ) {
			$styles['margin'] = self::spacing_css_from_parts( $margin_parts );
		}

		return $styles;
	}

	/**
	 * Button styles per state — only emitted on Desktop (state-bound rows are not responsive).
	 *
	 * @param array  $pagination_options Pagination options.
	 * @param string $device             Breakpoint key.
	 * @param bool   $is_hover           Whether to emit the hover/active state.
	 */
	private static function collect_button_styles( array $pagination_options, string $device, bool $is_hover ): array {
		$styles   = array();
		$defaults = self::defaults();

		if ( ! $is_hover ) {
			$padding_parts = self::spacing_device_parts( $pagination_options['padding'] ?? null, $device );
			if ( null !== $padding_parts && ! self::spacing_parts_match_default( $padding_parts, $defaults['padding'][ $device ] ?? null ) ) {
				$styles['padding'] = self::spacing_css_from_parts( $padding_parts );
			}
		}

		if ( 'Desktop' !== $device ) {
			return $styles;
		}

		if ( ! $is_hover ) {
			if ( ! empty( $pagination_options['color'] ) && self::normalize_color( $pagination_options['color'] ) !== $defaults['color'] ) {
				$styles['color'] = Css_Helpers::sanitize_color( $pagination_options['color'] );
			}
			if (
				! empty( $pagination_options['backgroundColor'] ) &&
				self::normalize_color( $pagination_options['backgroundColor'] ) !== $defaults['backgroundColor']
			) {
				$styles['background-color'] = Css_Helpers::sanitize_color( $pagination_options['backgroundColor'] );
			}
			$border_style = isset( $pagination_options['borderStyle'] ) ? (string) $pagination_options['borderStyle'] : 'none';
			if ( '' !== $border_style && 'none' !== $border_style ) {
				if ( $border_style !== $defaults['borderStyle'] ) {
					$styles['border-style'] = $border_style;
				}
				$width_parts = self::border_width_parts( $pagination_options['borderWidth'] ?? null );
				if ( null !== $width_parts && ! self::spacing_parts_match_default( $width_parts, $defaults['borderWidth'] ) ) {
					$styles['border-width'] = self::spacing_css_from_parts( $width_parts );
				}
				if (
					! empty( $pagination_options['borderColor'] ) &&
					self::normalize_color( $pagination_options['borderColor'] ) !== $defaults['borderColor']
				) {
					$styles['border-color'] = Css_Helpers::sanitize_color( $pagination_options['borderColor'] );
				}
			} elseif ( 'none' === $border_style ) {
				$styles['border-style'] = 'none';
			}
			if ( ! empty( $pagination_options['boxShadowEnable'] ) ) {
				$shadow = self::box_shadow_css( $pagination_options['boxShadow'] ?? null );
				if ( null !== $shadow ) {
					$styles['box-shadow'] = $shadow;
				}
			}
			$radius_parts = self::spacing_device_parts( $pagination_options['borderRadius'] ?? null, $device );
			if ( null !== $radius_parts && ! self::spacing_parts_match_default( $radius_parts, $defaults['borderRadius'][ $device ] ?? null ) ) {
				$styles['border-radius'] = self::spacing_css_from_parts( $radius_parts );
			}
		} else {
			$color_hover = ! empty( $pagination_options['colorHover'] ) ? (string) $pagination_options['colorHover'] : $defaults['colorHover'];
			if (
				self::color_differs( $color_hover, $defaults['colorHover'] ) ||
				self::color_differs( $pagination_options['color'] ?? '', $defaults['color'] )
			) {
				$styles['color'] = Css_Helpers::sanitize_color( $color_hover );
			}

			$background_color_hover = ! empty( $pagination_options['backgroundColorHover'] ) ? (string) $pagination_options['backgroundColorHover'] : $defaults['backgroundColorHover'];
			if (
				self::color_differs( $background_color_hover, $defaults['backgroundColorHover'] ) ||
				self::color_differs( $pagination_options['backgroundColor'] ?? '', $defaults['backgroundColor'] )
			) {
				$styles['background-color'] = Css_Helpers::sanitize_color( $background_color_hover );
			}
			$border_style       = isset( $pagination_options['borderStyle'] ) ? (string) $pagination_options['borderStyle'] : 'none';
			$border_color_hover = ! empty( $pagination_options['borderColorHover'] ) ? (string) $pagination_options['borderColorHover'] : $defaults['borderColorHover'];
			if (
				'' !== $border_style &&
				'none' !== $border_style &&
				(
					self::color_differs( $border_color_hover, $defaults['borderColorHover'] ) ||
					self::color_differs( $pagination_options['borderColor'] ?? '', $defaults['borderColor'] )
				)
			) {
				$styles['border-color'] = Css_Helpers::sanitize_color( $border_color_hover );
			}
			if ( ! empty( $pagination_options['boxShadowHoverEnable'] ) ) {
				$shadow = self::box_shadow_css( $pagination_options['boxShadowHover'] ?? null );
				if ( null !== $shadow ) {
					$styles['box-shadow'] = $shadow;
				}
			} elseif ( ! empty( $pagination_options['boxShadowEnable'] ) ) {
				$styles['box-shadow'] = 'none';
			}
		}

		return $styles;
	}

	/**
	 * Collect button typography styles for one breakpoint.
	 *
	 * @param array  $pagination_options Pagination options.
	 * @param string $device             Breakpoint key.
	 * @return array Typography CSS declarations.
	 */
	private static function collect_typography_styles( array $pagination_options, string $device ): array {
		$typography = isset( $pagination_options['typography'] ) && is_array( $pagination_options['typography'] )
			? $pagination_options['typography']
			: array();
		if ( empty( $typography ) ) {
			return array();
		}

		$styles      = array();
		$family_node = $typography['family'] ?? null;
		$family      = self::resolve_typography_font_family( $family_node );
		$family_obj  = is_array( $family_node ) ? $family_node : array();

		if ( '' !== $family ) {
			$styles['font-family'] = sanitize_text_field( $family );
		}

		$font_weight = $family_obj['fontWeight'] ?? $typography['fontWeight'] ?? '';
		if ( '' !== $font_weight && null !== $font_weight ) {
			$styles['font-weight'] = sanitize_text_field( (string) $font_weight );
		}

		$decoration = $family_obj['decoration'] ?? $typography['decoration'] ?? '';
		if ( '' !== $decoration && null !== $decoration ) {
			$styles['text-decoration'] = sanitize_text_field( (string) $decoration );
		}

		$transform = $family_obj['transform'] ?? $typography['transform'] ?? '';
		if ( '' !== $transform && null !== $transform ) {
			$styles['text-transform'] = sanitize_text_field( (string) $transform );
		}

		$font_style = $family_obj['style'] ?? $typography['style'] ?? '';
		if ( '' !== $font_style && null !== $font_style ) {
			$styles['font-style'] = sanitize_text_field( (string) $font_style );
		}

		foreach (
			array(
				'font-size'      => 'fontSize',
				'letter-spacing' => 'fontSpacing',
				'word-spacing'   => 'wordSpacing',
			) as $property => $key
		) {
			$value = self::typography_device_value( $typography[ $key ] ?? null, $device );
			if ( '' !== $value ) {
				$styles[ $property ] = $value;
			}
		}

		$line_height = $typography['lineHeight']['device'][ $device ] ?? null;
		if ( null !== $line_height && '' !== $line_height ) {
			$styles['line-height'] = sanitize_text_field( (string) $line_height );
		}

		return $styles;
	}

	/**
	 * Break out a 4-side spacing attr into numeric parts + unit for one device.
	 *
	 * @param array|null $spacing Spacing attribute.
	 * @param string     $device  Breakpoint key.
	 * @return array|null Associative array with top/right/bottom/left/unit, or null if absent.
	 */
	private static function spacing_device_parts( $spacing, string $device ) {
		if ( ! is_array( $spacing ) || empty( $spacing['device'][ $device ] ) ) {
			return null;
		}
		$unit  = self::get_unit_for_device( $spacing['unit'] ?? null, $device, 'px' );
		$value = $spacing['device'][ $device ];
		return array(
			'top'    => (float) ( $value['top'] ?? 0 ),
			'right'  => (float) ( $value['right'] ?? 0 ),
			'bottom' => (float) ( $value['bottom'] ?? 0 ),
			'left'   => (float) ( $value['left'] ?? 0 ),
			'unit'   => $unit,
		);
	}

	/**
	 * Border-width helper — single (non-responsive) attribute.
	 *
	 * @param array|null $border_width Border width attribute.
	 */
	private static function border_width_parts( $border_width ) {
		if ( ! is_array( $border_width ) || empty( $border_width['value'] ) ) {
			return null;
		}
		$unit  = is_string( $border_width['unit'] ?? null ) ? $border_width['unit'] : 'px';
		$value = $border_width['value'];
		return array(
			'top'    => (float) ( $value['top'] ?? 0 ),
			'right'  => (float) ( $value['right'] ?? 0 ),
			'bottom' => (float) ( $value['bottom'] ?? 0 ),
			'left'   => (float) ( $value['left'] ?? 0 ),
			'unit'   => $unit,
		);
	}

	/**
	 * Compare 4-side parts to a default block.
	 *
	 * @param array|null $parts    Parts from spacing_device_parts / border_width_parts.
	 * @param array|null $defaults Default block with the same shape.
	 */
	private static function spacing_parts_match_default( $parts, $defaults ): bool {
		if ( ! is_array( $parts ) || ! is_array( $defaults ) ) {
			return false;
		}
		return ( $parts['unit'] ?? '' ) === ( $defaults['unit'] ?? '' )
			&& (float) ( $parts['top'] ?? 0 ) === (float) ( $defaults['top'] ?? 0 )
			&& (float) ( $parts['right'] ?? 0 ) === (float) ( $defaults['right'] ?? 0 )
			&& (float) ( $parts['bottom'] ?? 0 ) === (float) ( $defaults['bottom'] ?? 0 )
			&& (float) ( $parts['left'] ?? 0 ) === (float) ( $defaults['left'] ?? 0 );
	}

	/**
	 * Render a 4-side parts block as CSS shorthand.
	 *
	 * @param array $parts Parts block with top/right/bottom/left/unit.
	 */
	private static function spacing_css_from_parts( array $parts ): string {
		$unit = $parts['unit'];
		return self::trim_num( (float) $parts['top'] ) . $unit . ' '
			. self::trim_num( (float) $parts['right'] ) . $unit . ' '
			. self::trim_num( (float) $parts['bottom'] ) . $unit . ' '
			. self::trim_num( (float) $parts['left'] ) . $unit;
	}

	/**
	 * Box-shadow helper — shared implementation in Css_Helpers (preset
	 * mismatches return null, the pagination policy).
	 *
	 * @param array|null $shadow Shadow attribute.
	 */
	private static function box_shadow_css( $shadow ) {
		return Css_Helpers::pagination_box_shadow_css( $shadow, false );
	}

	/**
	 * Normalise a hex/color string for case-insensitive comparison.
	 *
	 * @param mixed $value Color value.
	 */
	private static function normalize_color( $value ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}
		return strtolower( trim( $value ) );
	}

	/**
	 * Whether a color value is non-empty and differs from a normalized default.
	 *
	 * @param mixed  $value         Color value.
	 * @param string $default_value Normalized default color.
	 */
	private static function color_differs( $value, string $default_value ): bool {
		return is_string( $value ) && '' !== $value && self::normalize_color( $value ) !== $default_value;
	}

	/**
	 * Resolve a typography font family from string or nested control shapes.
	 *
	 * @param mixed $family Font family node.
	 */
	private static function resolve_typography_font_family( $family ): string {
		if ( is_string( $family ) ) {
			$value = trim( $family );
			return ( '' === $value || 'default' === strtolower( $value ) ) ? '' : $value;
		}
		if ( ! is_array( $family ) ) {
			return '';
		}
		$value = $family['typography']['family'] ?? $family['googleFont']['family'] ?? $family['family'] ?? '';
		if ( ! is_string( $value ) ) {
			return '';
		}
		$value = trim( $value );
		return ( '' === $value || 'default' === strtolower( $value ) ) ? '' : $value;
	}

	/**
	 * Resolve a responsive typography scalar with unit for one breakpoint.
	 *
	 * @param mixed  $attribute Typography responsive attribute.
	 * @param string $device    Breakpoint key.
	 */
	private static function typography_device_value( $attribute, string $device ): string {
		if ( ! is_array( $attribute ) ) {
			return '';
		}

		$value = $attribute['device'][ $device ] ?? null;
		if ( null !== $value && '' !== $value ) {
			$unit = self::get_unit_for_device( $attribute['unit'] ?? null, $device, 'px' );
			return sanitize_text_field( (string) $value ) . $unit;
		}

		$value = $attribute['value'] ?? null;
		if ( null === $value || '' === $value ) {
			return '';
		}

		$unit = is_string( $attribute['unit'] ?? null ) ? $attribute['unit'] : 'px';
		return sanitize_text_field( (string) $value ) . $unit;
	}

	/**
	 * Get device value with Desktop fallback.
	 *
	 * @param array|null $map      Device map.
	 * @param string     $device   Requested device.
	 * @param mixed      $fallback Final fallback.
	 */
	private static function get_device_value( $map, string $device, $fallback ) {
		if ( ! is_array( $map ) ) {
			return $fallback;
		}
		if ( isset( $map[ $device ] ) && '' !== $map[ $device ] ) {
			return $map[ $device ];
		}
		if ( isset( $map['Desktop'] ) && '' !== $map['Desktop'] ) {
			return $map['Desktop'];
		}
		return $fallback;
	}

	/**
	 * Resolve a unit attribute (string or device map).
	 *
	 * @param mixed  $unit_attr Unit attribute.
	 * @param string $device    Breakpoint.
	 * @param string $fallback  Final fallback.
	 */
	private static function get_unit_for_device( $unit_attr, string $device, string $fallback ): string {
		if ( is_string( $unit_attr ) ) {
			$unit = '' === $unit_attr ? $fallback : $unit_attr;
		} else {
			$value = self::get_device_value( $unit_attr, $device, $fallback );
			$unit  = is_string( $value ) ? $value : $fallback;
		}
		// Whitelist before the unit is concatenated into literal CSS lengths.
		if ( ! in_array( $unit, array( 'px', 'em', 'rem', '%', 'vw', 'vh' ), true ) ) {
			$unit = 'px';
		}
		return $unit;
	}

	/**
	 * Drop trailing zeros from numeric output so PHP and JS produce identical text.
	 *
	 * @param float $value Numeric value.
	 */
	private static function trim_num( float $value ): string {
		if ( (float) (int) $value === $value ) {
			return (string) (int) $value;
		}
		return rtrim( rtrim( sprintf( '%.4f', $value ), '0' ), '.' );
	}

	/**
	 * Convert collected rules to CSS, merging by selector.
	 *
	 * @param array $rules Rules array.
	 */
	private static function rules_to_css( array $rules ): string {
		if ( empty( $rules ) ) {
			return '';
		}
		$merged = array();
		foreach ( $rules as $rule ) {
			$selector = $rule['selector'];
			$styles   = $rule['styles'];
			if ( ! isset( $merged[ $selector ] ) ) {
				$merged[ $selector ] = array();
			}
			foreach ( $styles as $prop => $value ) {
				$merged[ $selector ][ $prop ] = $value;
			}
		}
		$out = array();
		foreach ( $merged as $selector => $styles ) {
			$declarations = array();
			foreach ( $styles as $prop => $value ) {
				if ( null === $value || '' === $value ) {
					continue;
				}
				$declarations[] = $prop . ': ' . $value . ';';
			}
			if ( ! empty( $declarations ) ) {
				$out[] = $selector . ' { ' . implode( ' ', $declarations ) . ' }';
			}
		}
		return implode( "\n", $out );
	}

	/**
	 * Wrap CSS in a media query if non-empty.
	 *
	 * @param string $css   CSS string.
	 * @param string $query Media query.
	 */
	private static function wrap_media( string $css, string $query ): string {
		if ( '' === trim( $css ) ) {
			return '';
		}
		return '@media ' . $query . " {\n" . $css . "\n}";
	}
}
