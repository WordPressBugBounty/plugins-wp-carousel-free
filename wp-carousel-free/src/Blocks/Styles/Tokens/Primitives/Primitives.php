<?php
/**
 * Token transform primitives (frontend side).
 *
 * Pure functions that convert a raw attribute value into a CSS token value, keyed
 * by the `transform` name a style-config row carries. Mirrors
 * `blocks/blocks/shared/styles/tokens/primitives/index.js` value-for-value; the
 * shared transform fixtures (Phase 4) assert both sides produce the same output
 * from the same input.
 *
 * Contract: apply( $name, $value, $row, $device ) => string|null. Returns null to
 * emit nothing. The emitter applies the EmissionPolicy (unset / equals-default
 * suppression) before calling a primitive, so a primitive only formats a present,
 * non-default value.
 *
 * Import invariant: primitives depend on nothing from the emitter or the composer.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Tokens\Primitives;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Stateless transform registry consumed by EmitTokens.
 */
final class Primitives {

	/**
	 * Dispatch a transform by name. Row-aware transforms (e.g. `spacingBox` reads
	 * `$row['single']`) receive the config row; value-only transforms ignore it.
	 *
	 * @param string $name  Transform name (raw|px|color|opacity|dimension|spacing|spacingBox).
	 * @param mixed  $value Raw attribute value.
	 * @param array  $row   Config row (for row-aware transforms).
	 * @param string $device Device key (Desktop|Tablet|Mobile) for responsive transforms.
	 * @return string|null Token value, or null to emit nothing.
	 */
	public static function apply( $name, $value, $row = array(), $device = 'Desktop' ) {
		switch ( $name ) {
			case 'paginationGap':
				return Pagination::pagination_gap( is_array( $value ) ? $value : array(), $row, $device );
			case 'paginationDim':
				return Pagination::pagination_dim( is_array( $value ) ? $value : array(), $row, $device );
			case 'pagColor':
				return Pagination::pag_color( is_array( $value ) ? $value : array() );
			case 'pagTextColor':
				return Pagination::pag_text_color( is_array( $value ) ? $value : array() );
			case 'pagActiveColor':
				return Pagination::pag_active_color( is_array( $value ) ? $value : array() );
			case 'pagActiveTextColor':
				return Pagination::pag_active_text_color( is_array( $value ) ? $value : array() );
			case 'pagBg':
				return Pagination::pag_bg( is_array( $value ) ? $value : array() );
			case 'pagActiveBg':
				return Pagination::pag_active_bg( is_array( $value ) ? $value : array() );
			case 'pagBorderStyle':
				return Pagination::pag_border_style( is_array( $value ) ? $value : array() );
			case 'pagActiveBorderStyle':
				return Pagination::pag_active_border_style( is_array( $value ) ? $value : array() );
			case 'pagBorderColor':
				return Pagination::pag_border_color( is_array( $value ) ? $value : array() );
			case 'pagActiveBorderColor':
				return Pagination::pag_active_border_color( is_array( $value ) ? $value : array() );
			case 'pagBorderWidth':
				return Pagination::pag_border_width( is_array( $value ) ? $value : array() );
			case 'pagActiveBorderWidth':
				return Pagination::pag_active_border_width( is_array( $value ) ? $value : array() );
			case 'raw':
				return self::raw( $value );
			case 'px':
				return self::px( $value );
			case 'color':
				return self::color( $value );
			case 'opacity':
				return self::opacity( $value );
			case 'dimension':
				return self::dimension( $value );
			case 'spacing':
				return self::spacing( $value );
			case 'spacingBox':
				return self::spacing_box( $value, $row );
			case 'spacingFill':
				return self::spacing_fill( $value, $device );
			case 'tileGridDim':
				return self::tile_grid_dim( $value, $row, $device );
			case 'metaGap':
				return self::meta_gap( $value );
			case 'shadow':
				return self::shadow( $value );
			case 'contentColor':
				return self::content_color( $value, $row );
			default:
				return null;
		}
	}

	/**
	 * Strict finite-number coercion (a unit string like "8px" or "" → null, NOT a
	 * leading-number parse). Keeps JS↔PHP px parity with the editor side.
	 *
	 * @param mixed $value Candidate.
	 * @return int|float|null Finite number, or null.
	 */
	private static function to_finite_number( $value ) {
		if ( is_int( $value ) || is_float( $value ) ) {
			return is_finite( (float) $value ) ? $value : null;
		}
		$trimmed = trim( (string) ( $value ?? '' ) );
		if ( '' === $trimmed || ! is_numeric( $trimmed ) ) {
			return null;
		}
		return $trimmed + 0;
	}

	/**
	 * Spacing-side coercion. Unset sides arrive as '' (the editor Spacing control's
	 * empty marker) or null, not as an absent key, so a `?? 0` default never fires.
	 * Without this, a margin edited on one side only emits `24px px px px`; this
	 * turns each unset side into 0 (`24px 0px 0px 0px`). Mirrors toFiniteNumber on
	 * the editor side.
	 *
	 * @param mixed $value Candidate side value.
	 * @return int|float 0 when unset/non-numeric, else the finite side value.
	 */
	private static function to_spacing_side( $value ) {
		return self::to_finite_number( $value ) ?? 0;
	}

	/**
	 * Verbatim string value.
	 *
	 * @param mixed $value Candidate.
	 * @return string|null Stringified value, or null.
	 */
	private static function raw( $value ) {
		return null === $value ? null : (string) $value;
	}

	/**
	 * Length with unit. Accepts a number / numeric string (→ `Npx`) or a
	 * `array( 'value' => …, 'unit' => … )` pair.
	 *
	 * @param mixed $value Candidate.
	 * @return string|null Length, or null.
	 */
	private static function px( $value ) {
		if ( is_array( $value ) && array_key_exists( 'value', $value ) ) {
			$numeric = self::to_finite_number( $value['value'] );
			if ( null === $numeric ) {
				return null;
			}
			$unit = Css_Helpers::sanitize_css_unit( ! empty( $value['unit'] ) ? (string) $value['unit'] : 'px' );
			return $numeric . ( '' === $unit ? 'px' : $unit );
		}
		$numeric = self::to_finite_number( $value );
		return null === $numeric ? null : $numeric . 'px';
	}

	/**
	 * Color string passthrough (already a valid CSS color).
	 *
	 * @param mixed $value Candidate.
	 * @return string|null Color, or null.
	 */
	private static function color( $value ) {
		if ( null === $value ) {
			return null;
		}
		$sanitized = Css_Helpers::sanitize_color( (string) $value );
		return '' === $sanitized ? null : $sanitized;
	}

	/**
	 * Opacity clamped to [0, 1].
	 *
	 * @param mixed $value Candidate.
	 * @return string|null Clamped opacity, or null.
	 */
	private static function opacity( $value ) {
		$numeric = self::to_finite_number( $value );
		if ( null === $numeric ) {
			return null;
		}
		return (string) min( 1, max( 0, $numeric ) );
	}

	/**
	 * Spacing shorthand from a four-side value array. Mirrors css_data_check() in
	 * the CssUtils trait: each side that stringifies non-empty is suffixed with
	 * the resolved unit and the sides are space-joined (e.g.
	 * `array( 2, 0, 0, 2 )` → `2px 0px 0px 2px`). Accepts the attribute wrapper
	 * array( 'value' => array( 'top', 'right', 'bottom', 'left' ), 'unit' => … );
	 * `unit` may be a per-device map.
	 *
	 * @param mixed $value Candidate.
	 * @return string|null Spacing shorthand, or null when empty.
	 */
	private static function spacing( $value ) {
		if ( ! is_array( $value ) ) {
			return null;
		}
		$sides = array_key_exists( 'value', $value ) ? $value['value'] : $value;
		if ( ! is_array( $sides ) ) {
			return null;
		}
		$unit = $value['unit'] ?? 'px';
		if ( is_array( $unit ) ) {
			$unit = $unit['Desktop'] ?? 'px';
		}
		if ( ! is_string( $unit ) || '' === trim( $unit ) ) {
			$unit = 'px';
		}
		$parts = array();
		foreach ( $sides as $side ) {
			if ( null !== $side && '' !== trim( (string) $side ) ) {
				$parts[] = $side . $unit;
			}
		}
		return empty( $parts ) ? null : implode( ' ', $parts );
	}

	/**
	 * Responsive dimension → `<number><unit>`. Mirrors social_ranger_dimension and
	 * its `$num . $unit` consumer: cast the leading number, default the unit to
	 * `px`. Receives the per-device `array( 'value', 'unit' )` the emitter extracts
	 * (the unit already carries the Desktop fallback), or a bare scalar.
	 *
	 * @param mixed $value Extracted device value.
	 * @return string|null Dimension, or null when not numeric.
	 */
	private static function dimension( $value ) {
		$raw_value = $value;
		$unit      = 'px';
		if ( is_array( $value ) && array_key_exists( 'value', $value ) ) {
			$raw_value = $value['value'];
			$unit      = ! empty( $value['unit'] ) ? $value['unit'] : 'px';
		}
		if ( null === $raw_value || '' === $raw_value || is_array( $raw_value ) ) {
			return null;
		}
		$unit = Css_Helpers::sanitize_css_unit( (string) $unit );
		return ( (float) $raw_value ) . ( '' === $unit ? 'px' : $unit );
	}

	/**
	 * Spacing shorthand with missing sides filled to `0` — mirrors spacing_generate:
	 * `top right bottom left` (each suffixed with the unit), or only the `top` value
	 * when the row sets `single`. Receives the per-device
	 * array( 'value' => sides, 'unit' => … ); returns null when no side is set (the
	 * per-device gate, computed-equivalent to the legacy device-agnostic
	 * has_spacing_changed guard since the static defaults are all `0`).
	 *
	 * @param mixed $value Extracted device value array( 'value' => sides, 'unit' => … ).
	 * @param array $row   Config row; `single` emits only the top value.
	 * @return string|null Spacing string, or null when no side is set.
	 */
	private static function spacing_box( $value, $row = array() ) {
		$sides = ( is_array( $value ) && array_key_exists( 'value', $value ) ) ? $value['value'] : $value;
		if ( ! is_array( $sides ) ) {
			return null;
		}
		$has_side = false;
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$candidate = $sides[ $side ] ?? null;
			if ( null !== $candidate && '' !== $candidate ) {
				$has_side = true;
				break;
			}
		}
		if ( ! $has_side ) {
			return null;
		}
		$unit = ( is_array( $value ) && isset( $value['unit'] ) ) ? $value['unit'] : 'px';
		if ( ! is_string( $unit ) || '' === trim( $unit ) ) {
			$unit = 'px';
		}
		$top    = self::to_spacing_side( $sides['top'] ?? null );
		$right  = self::to_spacing_side( $sides['right'] ?? null );
		$bottom = self::to_spacing_side( $sides['bottom'] ?? null );
		$left   = self::to_spacing_side( $sides['left'] ?? null );
		if ( ! empty( $row['single'] ) ) {
			return $top . $unit;
		}
		return $top . $unit . ' ' . $right . $unit . ' ' . $bottom . $unit . ' ' . $left . $unit;
	}

	/**
	 * Responsive spacing shorthand with the legacy fill / zero-fill emission policy —
	 * mirrors `spacingFill` in tokens/primitives/index.js (the editor side) and the
	 * legacy spacing_generate() behind the device-agnostic has_spacing_changed guard.
	 * Always emits on every device once the control holds any value, zero-filling
	 * missing sides AND missing breakpoints to `0<unit>`; always the four-value form
	 * (ignores allChange/is_single). Pair with `always` + `wholeAttr` + `device`.
	 *
	 * @param mixed  $attr   Whole spacing attribute array.
	 * @param string $device Device key (Desktop|Tablet|Mobile).
	 * @return string|null Four-value spacing shorthand, or null when the control is empty.
	 */
	private static function spacing_fill( $attr, $device = 'Desktop' ) {
		if ( ! self::has_responsive_spacing( $attr ) ) {
			return null;
		}
		$unit = 'px';
		if ( isset( $attr['unit'] ) && is_string( $attr['unit'] ) ) {
			$unit = $attr['unit'];
		} elseif ( isset( $attr['unit'][ $device ] ) && is_string( $attr['unit'][ $device ] ) ) {
			$unit = $attr['unit'][ $device ];
		}
		$sides  = ( isset( $attr['device'][ $device ] ) && is_array( $attr['device'][ $device ] ) ) ? $attr['device'][ $device ] : array();
		$top    = self::to_spacing_side( $sides['top'] ?? null );
		$right  = self::to_spacing_side( $sides['right'] ?? null );
		$bottom = self::to_spacing_side( $sides['bottom'] ?? null );
		$left   = self::to_spacing_side( $sides['left'] ?? null );
		return $top . $unit . ' ' . $right . $unit . ' ' . $bottom . $unit . ' ' . $left . $unit;
	}

	/**
	 * Whether a spacing control holds any per-side value across any breakpoint —
	 * mirrors hasResponsiveSpacing (editor) / has_spacing_changed (legacy frontend).
	 *
	 * @param mixed $attr Spacing attribute.
	 * @return bool True when at least one side is set for some breakpoint.
	 */
	private static function has_responsive_spacing( $attr ) {
		if ( ! is_array( $attr ) || ! isset( $attr['device'] ) || ! is_array( $attr['device'] ) ) {
			return false;
		}
		foreach ( $attr['device'] as $device_spacing ) {
			if ( ! is_array( $device_spacing ) ) {
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
	 * Tiles grid dimension (gap / row-height) — mirrors `tileGridDim` in
	 * tokens/primitives/index.js and the gap/row-height resolution in
	 * tiles_mode_settings(). Resolves a flat per-device tiles attribute off
	 * `layoutOptions` (`<base>`/`<base>Tablet`/`<base>Mobile` + `<base>Unit` etc.)
	 * with the `mobile ?? tablet ?? desktop ?? fallback` cascade; the value is cast
	 * to int to match the JS `Math.trunc`. Pair with `always` + `wholeAttr` +
	 * `device`. Only the gap / row-height values are tokenized; the grid-template /
	 * auto-rows decision / bin-pack mode stay Layer-5 (TilesCss).
	 *
	 * @param mixed  $layout_options Whole layoutOptions array.
	 * @param array  $row            Config row; `base` + `fallback`.
	 * @param string $device         Device key (Desktop|Tablet|Mobile).
	 * @return string|null `<value><unit>`, or null when layoutOptions is missing.
	 */
	private static function tile_grid_dim( $layout_options, $row, $device ) {
		if ( ! is_array( $layout_options ) ) {
			return null;
		}
		$base      = $row['base'] ?? '';
		$fallback  = $row['fallback'] ?? 0;
		$pick      = function ( $desktop_key, $tablet_key, $mobile_key ) use ( $layout_options, $device ) {
			$desktop_value = $layout_options[ $desktop_key ] ?? null;
			$tablet_value  = $layout_options[ $tablet_key ] ?? null;
			$mobile_value  = $layout_options[ $mobile_key ] ?? null;
			if ( 'Mobile' === $device ) {
				return $mobile_value ?? $tablet_value ?? $desktop_value;
			}
			if ( 'Tablet' === $device ) {
				return $tablet_value ?? $desktop_value;
			}
			return $desktop_value;
		};
		$raw_value = $pick( $base, $base . 'Tablet', $base . 'Mobile' );
		$value     = ( null !== $raw_value && is_numeric( $raw_value ) ) ? (int) $raw_value : (int) $fallback;
		$raw_unit  = $pick( $base . 'Unit', $base . 'TabletUnit', $base . 'MobileUnit' );
		$unit      = ( is_string( $raw_unit ) && '' !== $raw_unit ) ? $raw_unit : 'px';
		return $value . $unit;
	}

	/**
	 * Post-meta inter-part gap → `<value/2><unit>`. Mirrors `metaGap` in
	 * tokens/primitives/index.js and the legacy editor `parseInt(spacing) / 2`
	 * consumer (the gap renders on both sides of each `::after` separator).
	 * Receives the per-device array( 'value', 'unit' ) the emitter extracts (pair
	 * with `device`); returns null when the value is not numeric.
	 *
	 * Reconciles a legacy JS↔PHP divergence: the old frontend computed
	 * `intval( $v || 12 ) / 2` (always `0.5<unit>` — a bug); this emits the
	 * editor's (correct) halved value on both sides.
	 *
	 * @param mixed $value Extracted device value (array( 'value', 'unit' ) or scalar).
	 * @return string|null Halved gap with unit, or null.
	 */
	private static function meta_gap( $value ) {
		$raw_value = $value;
		$unit      = 'px';
		if ( is_array( $value ) && array_key_exists( 'value', $value ) ) {
			$raw_value = $value['value'];
			$unit      = ! empty( $value['unit'] ) ? $value['unit'] : 'px';
		}
		if ( null === $raw_value || '' === $raw_value || is_array( $raw_value ) || ! is_numeric( (string) $raw_value ) ) {
			return null;
		}
		$num  = (int) $raw_value;
		$unit = Css_Helpers::sanitize_css_unit( (string) $unit );
		return ( $num / 2 ) . ( '' === $unit ? 'px' : $unit );
	}

	/**
	 * Box-shadow value — mirrors `shadow` in tokens/primitives/index.js and the
	 * getBoxShadowValue() helper (the content-area caller forces `isActive: true`,
	 * which the helper ignores). Returns null for an empty or `none` result so the
	 * emitter suppresses it (matching the legacy `'none' !== $shadow` guard).
	 *
	 * @param mixed $value The boxShadow{Normal|Hover} attribute array.
	 * @return string|null Box-shadow value, or null.
	 */
	private static function shadow( $value ) {
		if ( ! is_array( $value ) ) {
			return null;
		}
		$color          = $value['color'] ?? null;
		$select_default = $value['selectDefault'] ?? '';
		$sides          = $value['value'] ?? null;
		$unit           = $value['unit'] ?? '';
		if ( '' === $color ) {
			return null;
		}
		if ( 'custom' !== $select_default ) {
			$preset = $select_default ? $select_default : '';
			if ( '' === $preset || 'none' === $preset ) {
				return null;
			}
			// Presets are our own var(--wpcp-shadow-*) tokens; anything else is
			// an untrusted string and is dropped.
			$sanitized = Css_Helpers::sanitize_shadow_preset( (string) $preset );

			return '' !== $sanitized ? $sanitized : null;
		}
		$shadow_unit = strtolower( (string) $unit );
		if ( is_array( $sides ) ) {
			// Coerce each side through the strict numeric gate so an array/NaN
			// side cannot stringify as "Array" or "NaN" inside the value.
			$top        = self::to_finite_number( $sides['top'] ?? 0 ) ?? 0;
			$right      = self::to_finite_number( $sides['right'] ?? 0 ) ?? 0;
			$bottom     = self::to_finite_number( $sides['bottom'] ?? 0 ) ?? 0;
			$left       = self::to_finite_number( $sides['left'] ?? 0 ) ?? 0;
			$inset      = 'inset' === $shadow_unit ? 'inset ' : '';
			$safe_color = Css_Helpers::sanitize_color( (string) $color );
			if ( '' === $safe_color ) {
				return null;
			}
			$out = trim( $inset . $top . 'px ' . $right . 'px ' . $bottom . 'px ' . $left . 'px ' . $safe_color );
			return '' === $out ? null : $out;
		}
		$out = trim( (string) $sides );
		return ( '' === $out || 'none' === $out ) ? null : $out;
	}

	/**
	 * Content title/desc color — resolves the polymorphic
	 * `contentOptions.{title,desc}Color` (a plain color string, or an
	 * `array( 'color', 'hoverColor' )` → `color`) and suppresses the schema default.
	 * Mirrors `contentColor` in tokens/primitives/index.js (and fixes the legacy
	 * `color: Array` bug, which emitted the raw array).
	 *
	 * @param mixed $value Raw attribute (string or array).
	 * @param array $row   Config row; `default` is the suppressed schema default.
	 * @return string|null Color string, or null.
	 */
	private static function content_color( $value, $row = array() ) {
		$resolved = is_array( $value ) ? ( $value['color'] ?? '' ) : $value;
		$default  = $row['default'] ?? null;
		if ( null === $resolved || '' === $resolved || $resolved === $default ) {
			return null;
		}
		$sanitized = Css_Helpers::sanitize_color( (string) $resolved );
		return '' === $sanitized ? null : $sanitized;
	}
}
