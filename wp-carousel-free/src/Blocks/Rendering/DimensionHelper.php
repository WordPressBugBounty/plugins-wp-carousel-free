<?php
/**
 * Media dimension / aspect-ratio CSS helpers.
 *
 * Pure helpers extracted from BlockRenderer: resolve responsive
 * Desktop/Tablet/Mobile dimension triplets, normalize raw values, build the
 * custom aspect-box CSS variables, and convert dimensions / aspect ratios to
 * CSS. No instance state — every method is static.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

defined( 'ABSPATH' ) || exit;

/**
 * DimensionHelper class.
 */
class DimensionHelper {

	/**
	 * Carousel styles that never use variable-width slide sizing.
	 *
	 * Single source for both variable-width gates below. Mirrors
	 * `VARIABLE_WIDTH_EXCLUDED_STYLES` in `carousel-render/constants.js`.
	 *
	 * @var string[]
	 */
	private const VARIABLE_WIDTH_EXCLUDED_STYLES = array( 'grid' );

	/**
	 * Resolve the aspect ratio for the outer `.wpcp-item-media` wrapper.
	 *
	 * Video source sizing is owned by `videoOptions.aspectRatio` on the inner
	 * thumbnail; image aspect must not box the outer media for video items.
	 *
	 * @param string $source_type   Block sourceType attribute.
	 * @param array  $image_options Image panel options slice.
	 * @return string Aspect mode: 'original', 'custom', or 'W:H'.
	 */
	public static function resolve_outer_media_aspect( string $source_type, array $image_options ): string {
		if ( 'video' === $source_type ) {
			return 'original';
		}

		// Fallback matches CarouselBaseSchema (`4:3`). SliderSchema defaults to
		// `original`; slider callers force outer `original` for stage sizing.
		return $image_options['aspectRatio'] ?? '4:3';
	}

	/**
	 * Shared Variable Width gating: on, horizontal, and not an excluded source.
	 *
	 * @param array $attributes Block attributes.
	 * @return bool True when Variable Width applies at all.
	 */
	private static function is_variable_width_active( array $attributes ): bool {
		$layout_options = isset( $attributes['layoutOptions'] ) && is_array( $attributes['layoutOptions'] ) ? $attributes['layoutOptions'] : array();
		if ( empty( $layout_options['variableWidth'] ) ) {
			return false;
		}
		return 'vertical' !== ( $layout_options['displayStyle'] ?? 'horizontal' );
	}

	/**
	 * Resolve the carousel style key used by the Variable Width gates below.
	 *
	 * @param array $attributes Block attributes.
	 * @return array{block_name: string, style: string} Normalized block name + style.
	 */
	private static function resolve_variable_width_style( array $attributes ): array {
		$layout_options = isset( $attributes['layoutOptions'] ) && is_array( $attributes['layoutOptions'] ) ? $attributes['layoutOptions'] : array();
		$block_name     = str_replace( 'wp-carousel-pro/', '', (string) ( $attributes['blockName'] ?? 'carousel' ) );
		$style          = (string) ( $layout_options['carouselStyle'] ?? 'standard' );

		return array(
			'block_name' => $block_name,
			'style'      => $style,
		);
	}

	/**
	 * Whether image sizing is driven by variable width: the aspect-ratio box is
	 * replaced by the optional fixed Image Height.
	 *
	 * Mirrors `isVariableWidthImageSizing()` in `utils/variableWidthImageSizing.js`.
	 *
	 * @param array $attributes Block attributes.
	 * @return bool True when the variable-width image sizing model applies.
	 */
	public static function is_variable_width_image_sizing( array $attributes ): bool {
		if ( ! self::is_variable_width_active( $attributes ) ) {
			return false;
		}
		$resolved = self::resolve_variable_width_style( $attributes );
		if ( 'tiles' === $resolved['block_name'] ) {
			return false;
		}

		return ! in_array( $resolved['style'], self::VARIABLE_WIDTH_EXCLUDED_STYLES, true );
	}

	/**
	 * Whether the per-image aspect-ratio box must be replaced by natural
	 * ('original') image sizing. A variable-width slide measures its rendered
	 * image width; a boxed absolute image contributes no width, so the slide
	 * collapses to 0 unless the aspect box is skipped.
	 *
	 * Mirrors `needsOriginalAspectForVariableWidth()` in `utils/variableWidthImageSizing.js`.
	 *
	 * @param array $attributes Block attributes.
	 * @return bool True when the aspect box must be forced to 'original'.
	 */
	public static function needs_original_aspect_for_variable_width( array $attributes ): bool {
		if ( ! self::is_variable_width_active( $attributes ) ) {
			return false;
		}
		$resolved = self::resolve_variable_width_style( $attributes );
		if ( 'tiles' === $resolved['block_name'] || 'grid' === $resolved['style'] ) {
			return false;
		}

		return ! in_array( $resolved['style'], self::VARIABLE_WIDTH_EXCLUDED_STYLES, true );
	}

	/**
	 * Whether a fixed variable-width image height is set for any device.
	 *
	 * Mirrors `hasVariableWidthImageHeight()` in `utils/variableWidthImageSizing.js`.
	 *
	 * @param array $image_options Image panel options slice.
	 * @return bool True when at least one device has a positive height.
	 */
	public static function has_variable_width_image_height( array $image_options ): bool {
		$height_option = isset( $image_options['variableWidthImageHeight'] ) && is_array( $image_options['variableWidthImageHeight'] ) ? $image_options['variableWidthImageHeight'] : array();
		$device_values = isset( $height_option['device'] ) && is_array( $height_option['device'] ) ? $height_option['device'] : array();
		foreach ( array( 'Desktop', 'Tablet', 'Mobile' ) as $device ) {
			// (float) cast matches JS parseFloat on leading-numeric strings, so the
			// gate agrees with the token emitter on both sides.
			if ( isset( $device_values[ $device ] ) && ( is_numeric( $device_values[ $device ] ) || is_string( $device_values[ $device ] ) ) && (float) $device_values[ $device ] > 0 ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Active height sizing mode for variable-width image height controls.
	 *
	 * Mirrors `getVariableWidthImageHeightMode()` in `utils/variableWidthImageSizing.js`.
	 *
	 * @param array $image_options Image panel options slice.
	 * @return string `height` or `max-height`.
	 */
	public static function get_variable_width_image_height_mode( array $image_options ): string {
		$mode = isset( $image_options['variableWidthImageHeightMode'] ) ? (string) $image_options['variableWidthImageHeightMode'] : 'height';
		return 'max-height' === $mode ? 'max-height' : 'height';
	}

	/**
	 * Build the inline `style` attribute (responsive CSS vars) for a media box,
	 * honoring custom aspect sizing or a max-width plus optional aspect ratio.
	 *
	 * @param array  $image_options Image option attributes.
	 * @param string $aspect        Aspect mode: 'original', 'custom', or 'W:H'.
	 * @return string ` style="…"` attribute, or '' when no styles apply.
	 */
	public static function build_media_dimension_style_attr( array $image_options, string $aspect = 'original' ): string {
		$style_parts = array();

		if ( 'custom' === $aspect ) {
			$custom_width_options  = isset( $image_options['customImageWidth'] ) && is_array( $image_options['customImageWidth'] ) ? $image_options['customImageWidth'] : array();
			$custom_height_options = isset( $image_options['customImageHeight'] ) && is_array( $image_options['customImageHeight'] ) ? $image_options['customImageHeight'] : array();
			$custom_width_triplet  = self::resolve_responsive_dimension_triplet( $custom_width_options, 400, 'px' );
			$custom_height_triplet = self::resolve_responsive_dimension_triplet( $custom_height_options, 300, 'px' );

			foreach ( array(
				'Desktop' => 'd',
				'Tablet'  => 't',
				'Mobile'  => 'm',
			) as $device => $suffix ) {
				$box           = self::custom_aspect_box_css( $custom_width_triplet[ $device ], $custom_height_triplet[ $device ] );
				$style_parts[] = '--wpcp-cmw-' . $suffix . ':' . $box['width'];
				$style_parts[] = '--wpcp-cmh-' . $suffix . ':' . $box['height'];
				$style_parts[] = '--wpcp-cmar-' . $suffix . ':' . $box['aspect_ratio'];
				$style_parts[] = '--wpcp-cmmin-' . $suffix . ':' . $box['min_height'];
			}
			$style_parts[] = 'position:relative';
			$style_parts[] = 'overflow:hidden';
		} else {
			$max_width_triplet = self::resolve_responsive_dimension_triplet(
				$image_options['imageMaxWidth'] ?? array(),
				100,
				'%'
			);

			foreach ( array(
				'Desktop' => 'd',
				'Tablet'  => 't',
				'Mobile'  => 'm',
			) as $device => $suffix ) {
				$style_parts[] = '--wpcp-mwmx-' . $suffix . ':' . self::dimension_to_css_value( $max_width_triplet[ $device ], 'none' );
			}

			if ( 'original' !== $aspect ) {
				// Preset W:H via `--wpcp-mar-*` (static SCSS). Same value on all
				// breakpoints until the schema grows per-device preset ratios.
				// Parity: gapImageUtils.buildPresetAspectCssVars().
				$css_aspect = self::preset_aspect_to_css_value( $aspect );
				if ( '' !== $css_aspect ) {
					foreach ( array( 'd', 't', 'm' ) as $suffix ) {
						$style_parts[] = '--wpcp-mar-' . $suffix . ':' . $css_aspect;
					}
					$style_parts[] = 'position:relative';
					$style_parts[] = 'overflow:hidden';
				}
			}
		}

		return ! empty( $style_parts ) ? ' style="' . esc_attr( implode( ';', $style_parts ) ) . '"' : '';
	}

	/**
	 * Resolve Desktop/Tablet/Mobile dimension objects with cascading fallback.
	 *
	 * @param array  $attr         Responsive attribute.
	 * @param int    $default_value Numeric fallback value.
	 * @param string $default_unit Default CSS unit.
	 * @return array<string, array{value:int|float,unit:string}>
	 */
	public static function resolve_responsive_dimension_triplet( array $attr, $default_value, string $default_unit ): array {
		$device_map = isset( $attr['device'] ) && is_array( $attr['device'] ) ? $attr['device'] : array();
		$unit_map   = isset( $attr['unit'] ) && is_array( $attr['unit'] ) ? $attr['unit'] : array();

		$desktop = self::normalize_dimension_value( $device_map['Desktop'] ?? null, $unit_map['Desktop'] ?? $default_unit, $default_value, $default_unit );
		$tablet  = self::normalize_dimension_value( $device_map['Tablet'] ?? null, $unit_map['Tablet'] ?? $desktop['unit'], $desktop['value'], $desktop['unit'] );
		$mobile  = self::normalize_dimension_value( $device_map['Mobile'] ?? null, $unit_map['Mobile'] ?? $tablet['unit'], $tablet['value'], $tablet['unit'] );

		return array(
			'Desktop' => $desktop,
			'Tablet'  => $tablet,
			'Mobile'  => $mobile,
		);
	}

	/**
	 * Normalize a raw responsive value/unit pair against a fallback.
	 *
	 * @param mixed  $value         Raw responsive value.
	 * @param string $unit          Raw unit.
	 * @param mixed  $fallback      Fallback numeric value.
	 * @param string $fallback_unit Fallback CSS unit.
	 * @return array{value:int|float,unit:string}
	 */
	public static function normalize_dimension_value( $value, string $unit, $fallback, string $fallback_unit ): array {
		$normalized_value = is_numeric( $value ) && (float) $value > 0 ? (float) $value : (float) $fallback;
		$normalized_unit  = StyleHelper::css_unit( $unit );
		if ( '' === $normalized_unit ) {
			$normalized_unit = StyleHelper::css_unit( $fallback_unit );
		}

		return array(
			'value' => $normalized_value,
			'unit'  => $normalized_unit,
		);
	}

	/**
	 * Mirror the editor custom aspect sizing logic for frontend CSS vars.
	 *
	 * @param array{value:int|float,unit:string} $width  Width dimension.
	 * @param array{value:int|float,unit:string} $height Height dimension.
	 * @return array{width:string,height:string,aspect_ratio:string,min_height:string}
	 */
	public static function custom_aspect_box_css( array $width, array $height ): array {
		$width_css          = self::dimension_to_css_value( $width, 'auto' );
		$height_css         = self::dimension_to_css_value( $height, 'auto' );
		$can_use_aspect_css = in_array( $width['unit'], array( 'px', 'em' ), true )
			&& in_array( $height['unit'], array( 'px', 'em' ), true )
			&& $width['value'] > 0
			&& $height['value'] > 0;

		if ( $can_use_aspect_css ) {
			return array(
				'width'        => $width_css,
				'height'       => 'auto',
				'aspect_ratio' => $width['value'] . ' / ' . $height['value'],
				'min_height'   => 'unset',
			);
		}

		return array(
			'width'        => $width_css,
			'height'       => $height_css,
			'aspect_ratio' => 'unset',
			'min_height'   => '1px',
		);
	}

	/**
	 * Format a normalized dimension as a CSS length, or a fallback when empty.
	 *
	 * @param array{value:int|float,unit:string} $dimension Dimension pair.
	 * @param string                             $fallback  Value when empty.
	 * @return string CSS length (e.g. `400px`) or the fallback.
	 */
	public static function dimension_to_css_value( array $dimension, string $fallback ): string {
		if ( empty( $dimension['value'] ) || empty( $dimension['unit'] ) ) {
			return $fallback;
		}

		return $dimension['value'] . $dimension['unit'];
	}

	/**
	 * Convert a preset `W:H` ratio to a CSS `aspect-ratio` value.
	 *
	 * @param string $ratio Ratio like '16:9'.
	 * @return string CSS value (e.g. `16 / 9`), or '' when invalid.
	 */
	public static function preset_aspect_to_css_value( string $ratio ): string {
		$parts = explode( ':', $ratio );
		if ( 2 !== count( $parts ) || ! (float) $parts[0] || ! (float) $parts[1] ) {
			return '';
		}

		return (float) $parts[0] . ' / ' . (float) $parts[1];
	}

	/**
	 * Convert a `W:H` ratio to an aspect-box style using the modern
	 * `aspect-ratio` property. Prefer `build_media_dimension_style_attr()` for
	 * item media (emits responsive `--wpcp-mar-*` vars). Kept for callers that
	 * need a one-shot inline declaration.
	 *
	 * @param string $ratio Ratio like '16:9'.
	 * @return string CSS declarations, or '' when the ratio is invalid.
	 */
	public static function aspect_ratio_to_style( string $ratio ): string {
		$css_aspect = self::preset_aspect_to_css_value( $ratio );
		if ( '' === $css_aspect ) {
			return '';
		}
		return 'position:relative;aspect-ratio:' . $css_aspect . ';overflow:hidden;';
	}
}
