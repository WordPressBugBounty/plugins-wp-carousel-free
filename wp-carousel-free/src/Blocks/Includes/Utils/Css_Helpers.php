<?php
/**
 * CSS Helper Utilities for WP Carousel Pro Blocks.
 *
 * @since 4.2.4
 * @version 1.0.0
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	die;
}

/**
 * Class Css_Helpers
 *
 * Utility functions for generating CSS from block attributes.
 * Mirrors functionality from blocks/blocks/shared/cssUtils.js and helpFn.js
 */
class Css_Helpers {

	/**
	 * Whitelist a CSS unit appended to a numeric value.
	 *
	 * Units arrive as raw attribute strings; anything outside the editor's unit
	 * set (e.g. a smuggled `url(//evil)`) is dropped so it cannot ride a
	 * `<number><unit>` value into the emitted <style>. Mirrors
	 * sanitizeCssUnit() in blocks/blocks/shared/styles/cssUtils.js.
	 *
	 * @param string $unit Raw unit from an attribute.
	 * @return string Allowed unit, or '' when not allowed.
	 */
	public static function sanitize_css_unit( $unit ) {
		if ( ! is_string( $unit ) ) {
			return '';
		}
		$unit = strtolower( trim( $unit ) );
		if ( '' === $unit ) {
			return '';
		}
		$allowed = array( 'px', 'em', 'rem', '%', 's', 'ms', 'vh', 'vw', 'deg' );
		return in_array( $unit, $allowed, true ) ? $unit : '';
	}

	/**
	 * Whitelist a box-shadow preset token (`var(--wpcp-shadow-<slug>)`).
	 *
	 * @param string $preset Raw selectDefault value.
	 * @return string Allowed preset token, or '' when not allowed.
	 */
	public static function sanitize_shadow_preset( $preset ) {
		if ( ! is_string( $preset ) ) {
			return '';
		}
		$preset = trim( $preset );
		if ( 1 !== preg_match( '/^var\(--wpcp-shadow-[a-z0-9-]+\)$/', $preset ) ) {
			return '';
		}
		return $preset;
	}

	/**
	 * Format a pagination-style box-shadow attribute (horizontal/vertical/blur/
	 * spread + color + inset position, or a preset token).
	 *
	 * The four near-identical builders this replaces diverged only in what a
	 * mismatched preset token returns; that policy is the parameter. Mirrors
	 * boxShadowCss() in ajaxPaginationDynamicCss.js.
	 *
	 * @param array|null $shadow               Shadow attribute.
	 * @param bool       $passthrough_mismatch True: return the raw preset on mismatch
	 *                                         on mismatch; false: null.
	 * @return string|null Box-shadow value, or null.
	 */
	public static function pagination_box_shadow_css( $shadow, $passthrough_mismatch = false ) {
		if ( ! is_array( $shadow ) ) {
			return null;
		}

		$selected_shadow = isset( $shadow['selectDefault'] ) ? (string) $shadow['selectDefault'] : '';
		if ( '' !== $selected_shadow && 'custom' !== $selected_shadow ) {
			$preset = self::sanitize_shadow_preset( $selected_shadow );
			return '' !== $preset ? $preset : ( $passthrough_mismatch ? $selected_shadow : null );
		}

		$shadow_value = isset( $shadow['value'] ) && is_array( $shadow['value'] ) ? $shadow['value'] : array();
		$horizontal   = (float) ( $shadow['horizontal'] ?? $shadow['x'] ?? $shadow_value['top'] ?? 0 );
		$vertical     = (float) ( $shadow['vertical'] ?? $shadow['y'] ?? $shadow_value['right'] ?? 0 );
		$blur         = (float) ( $shadow['blur'] ?? $shadow_value['bottom'] ?? 0 );
		$spread       = (float) ( $shadow['spread'] ?? $shadow['speared'] ?? $shadow_value['left'] ?? 0 );
		$color        = isset( $shadow['color'] ) && '' !== $shadow['color'] ? self::sanitize_color( $shadow['color'] ) : '';
		$color        = '' !== $color ? $color : '#4E4F521A';
		$position     = isset( $shadow['position'] ) ? (string) $shadow['position'] : (string) ( $shadow['shadowType'] ?? $shadow['unit'] ?? '' );
		$inset        = 'inset' === $position ? 'inset ' : '';
		return $inset . self::trim_num( $horizontal ) . 'px ' . self::trim_num( $vertical ) . 'px ' . self::trim_num( $blur ) . 'px ' . self::trim_num( $spread ) . 'px ' . $color;
	}

	/**
	 * Format a number without trailing zeros (12.0 → 12, 12.50 → 12.5).
	 *
	 * @param float $value Numeric value.
	 * @return string
	 */
	private static function trim_num( float $value ): string {
		if ( (float) (int) $value === $value ) {
			return (string) (int) $value;
		}
		return rtrim( rtrim( sprintf( '%.4f', $value ), '0' ), '.' );
	}

	/**
	 * Strict finite-number coercion. Mirrors toFiniteNumber() in
	 * tokens/primitives/index.js: a unit string like "8px" or "" coerces to 0
	 * here (callers treat 0 as the safe default), never a leading-number parse.
	 *
	 * @param mixed $value Candidate.
	 * @return int|float Finite number, or 0 when not numeric.
	 */
	public static function to_finite_number( $value ) {
		if ( is_int( $value ) || is_float( $value ) ) {
			return is_finite( $value ) ? $value : 0;
		}
		if ( is_string( $value ) && is_numeric( trim( $value ) ) ) {
			$numeric = (float) trim( $value );
			return is_finite( $numeric ) ? $numeric : 0;
		}
		return 0;
	}

	/**
	 * Convert CSS array to string.
	 *
	 * Mirrors: blocks/blocks/shared/cssUtils.js objectToCssString()
	 *
	 * @param array $dynamic_css Array of CSS rules with selector and styles.
	 * @return string CSS string.
	 */
	public static function object_to_css_string( $dynamic_css ) {
		$css = '';
		if ( ! empty( $dynamic_css ) && is_array( $dynamic_css ) ) {
			foreach ( $dynamic_css as $item ) {
				if ( isset( $item['styles'] ) && is_array( $item['styles'] ) ) {
					$styles = '';
					foreach ( $item['styles'] as $property => $value ) {
						if ( null !== $value && '' !== $value && false !== $value ) {
							// Handle array values (like spacing: [10, 20, 10, 20]).
							if ( is_array( $value ) ) {
								$value = implode( ' ', $value );
							}
							// Defense-in-depth: this is the single assembly point for
							// every dynamic-CSS rule, and block attributes reach it
							// unsanitized (attribute JSON in the block delimiter is not
							// kses-filtered, so a contributor-level author controls these
							// values). A single CSS declaration value never legitimately
							// contains the characters that terminate a declaration (`;`),
							// open/close a rule block (`{` / `}`), or start an HTML tag
							// (`<` / `>`). Drop any value carrying one rather than emit it,
							// which neutralizes CSS/markup breakout across every concern.
							if ( is_string( $value ) && preg_match( '/[;{}<>]/', $value ) ) {
								continue;
							}
							$styles .= "{$property}: {$value};";
						}
					}
					if ( $styles ) {
						$css .= "{$item['selector']} {{$styles}}";
					}
				}
			}
		}
		return $css;
	}

	/**
	 * Merge duplicate CSS selectors and their styles.
	 *
	 * Mirrors: blocks/blocks/shared/cssUtils.js mergeCssRulesBySelector()
	 *
	 * @param array $css_array Array of CSS selector/style definitions.
	 * @return array Filtered array with merged selectors.
	 */
	public static function filter_duplicate_selector( $css_array ) {
		if ( empty( $css_array ) || ! is_array( $css_array ) ) {
			return array();
		}

		$selector_map = array();

		foreach ( $css_array as $css ) {
			if ( empty( $css ) || ! isset( $css['selector'], $css['styles'] ) || ! is_array( $css['styles'] ) ) {
				continue;
			}

			$selector = $css['selector'];
			$styles   = $css['styles'];

			if ( empty( $styles ) ) {
				continue;
			}

			if ( isset( $selector_map[ $selector ] ) ) {
				// Merge existing styles with new ones (new overrides old).
				$selector_map[ $selector ]['styles'] = array_merge(
					$selector_map[ $selector ]['styles'],
					$styles
				);
			} else {
				$selector_map[ $selector ] = array(
					'selector' => $selector,
					'styles'   => $styles,
				);
			}
		}

		return array_values( $selector_map );
	}

	/**
	 * Convert HEX color to RGBA or RGB components.
	 *
	 * @param string     $hex     Hex color (e.g. #ff0000 or ff0000).
	 * @param float|null $opacity Opacity value (0–1). Optional.
	 * @return string RGBA or RGB string.
	 */
	public static function hex_to_rgba( $hex, $opacity = null ) {

		$hex = str_replace( '#', '', $hex );

		// Support short hex (fff).
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		if ( 6 !== strlen( $hex ) ) {
			return '';
		}

		$int = hexdec( $hex );

		$red   = ( $int >> 16 ) & 255;
		$green = ( $int >> 8 ) & 255;
		$blue  = $int & 255;

		if ( null !== $opacity ) {
			return sprintf(
				'rgba(%d, %d, %d, %s)',
				$red,
				$green,
				$blue,
				$opacity
			);
		}

		// Return RGB values only (same as JS behavior).
		return sprintf(
			'%d, %d, %d',
			$red,
			$green,
			$blue
		);
	}

	/**
	 * Sanitize a CSS color for safe use inside an inline `<style>` block.
	 *
	 * Block color attributes are stored as plain strings with no save-time
	 * sanitization, so a value such as `red}</style><script>…</script>` would
	 * break out of an inline `<style>` element and execute. This allow-lists
	 * hex / rgb / rgba / hsl / hsla and the `transparent` / `currentColor`
	 * keywords, returning an empty string for anything else.
	 *
	 * @param mixed $raw Raw color value.
	 * @return string Safe color, or empty string when the value is not a valid color.
	 */
	public static function sanitize_color( $raw ) {
		if ( ! is_string( $raw ) ) {
			return '';
		}
		$value = trim( $raw );
		if ( '' === $value ) {
			return '';
		}
		$lower = strtolower( $value );
		if ( 'transparent' === $lower ) {
			return 'transparent';
		}
		if ( 'currentcolor' === $lower ) {
			return 'currentColor';
		}
		$hex = sanitize_hex_color( $value );
		if ( $hex ) {
			return $hex;
		}
		// 4- and 8-digit hex (alpha) — not always covered by sanitize_hex_color.
		if ( preg_match( '/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i', $value ) ) {
			return $value;
		}
		// rgb( r, g, b ) — integers 0–255 only.
		if ( preg_match( '/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i', $value, $matches ) ) {
			$red   = (int) $matches[1];
			$green = (int) $matches[2];
			$blue  = (int) $matches[3];
			if ( $red <= 255 && $green <= 255 && $blue <= 255 ) {
				return sprintf( 'rgb(%d,%d,%d)', $red, $green, $blue );
			}
			return '';
		}
		// rgba( r, g, b, a ) — alpha 0–1.
		if ( preg_match( '/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1(?:\.0+)?|0?\.\d+)\s*\)$/i', $value, $matches ) ) {
			$red   = (int) $matches[1];
			$green = (int) $matches[2];
			$blue  = (int) $matches[3];
			if ( $red <= 255 && $green <= 255 && $blue <= 255 ) {
				return sprintf( 'rgba(%d,%d,%d,%s)', $red, $green, $blue, $matches[4] );
			}
			return '';
		}
		// hsl( h, s%, l% ) — degrees 0–360, percentages 0–100.
		if ( preg_match( '/^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i', $value, $matches ) ) {
			$hue        = (int) $matches[1];
			$saturation = (int) $matches[2];
			$lightness  = (int) $matches[3];
			if ( $hue <= 360 && $saturation <= 100 && $lightness <= 100 ) {
				return sprintf( 'hsl(%d,%d%%,%d%%)', $hue, $saturation, $lightness );
			}
			return '';
		}
		// hsla( h, s%, l%, a ) — alpha 0–1.
		if ( preg_match( '/^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(0|1(?:\.0+)?|0?\.\d+)\s*\)$/i', $value, $matches ) ) {
			$hue        = (int) $matches[1];
			$saturation = (int) $matches[2];
			$lightness  = (int) $matches[3];
			if ( $hue <= 360 && $saturation <= 100 && $lightness <= 100 ) {
				return sprintf( 'hsla(%d,%d%%,%d%%,%s)', $hue, $saturation, $lightness, $matches[4] );
			}
			return '';
		}
		return '';
	}

	/**
	 * Convert spacing attribute to CSS shorthand.
	 *
	 * Mirrors Styble/WPCP block inspector spacing shape.
	 *
	 * @param array<string, mixed> $attr Spacing attribute.
	 * @return string
	 */
	public static function get_spacing_css( array $attr ) {
		if ( empty( $attr['value'] ) || ! is_array( $attr['value'] ) ) {
			return '';
		}

		$value = $attr['value'];
		$unit  = isset( $attr['unit'] ) ? $attr['unit'] : '';

		$top    = $value['top'] ?? 0;
		$right  = $value['right'] ?? 0;
		$bottom = $value['bottom'] ?? 0;
		$left   = $value['left'] ?? 0;

		if ( 0 === $top && 0 === $right && 0 === $bottom && 0 === $left ) {
			return '';
		}

		if ( ! empty( $attr['allChange'] ) ) {
			return $top . $unit;
		}

		return sprintf(
			'%1$s%5$s %2$s%5$s %3$s%5$s %4$s%5$s',
			$top,
			$right,
			$bottom,
			$left,
			$unit
		);
	}

	/**
	 * Generate CSS value for a ranger control based on attributes and device type.
	 *
	 * @param mixed  $attr   Range attribute.
	 * @param string $device Device type (Desktop, Tablet, Mobile).
	 * @return string
	 */
	public static function ranger_css( $attr, $device = 'Desktop' ) {
		if ( ! is_array( $attr ) ) {
			return is_scalar( $attr ) ? (string) $attr : '';
		}

		if ( array_key_exists( 'value', $attr ) && ! isset( $attr['device'] ) ) {
			$raw_value = $attr['value'];
			if ( '' === $raw_value || null === $raw_value ) {
				return '';
			}
			$unit = isset( $attr['unit'] ) ? (string) $attr['unit'] : '';
			$unit = 'sec' === $unit ? 's' : $unit;
			return $raw_value . $unit;
		}

		if ( isset( $attr['device'][ $device ] ) && '' === $attr['device'][ $device ] ) {
			return '';
		}

		$unit  = isset( $attr['unit'][ $device ] ) ? $attr['unit'][ $device ] : '';
		$value = isset( $attr['device'][ $device ] ) ? $attr['device'][ $device ] : '';

		if ( ! is_numeric( $value ) && '' === (string) $value ) {
			if ( 'Desktop' !== $device && isset( $attr['device']['Desktop'] ) && is_numeric( $attr['device']['Desktop'] ) ) {
				return self::ranger_css( $attr, 'Desktop' );
			}
			return '';
		}

		$unit = 'sec' === $unit ? 's' : $unit;
		return $value . $unit;
	}
}
