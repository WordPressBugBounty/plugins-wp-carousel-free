<?php
/**
 * Thumbnails-slider block dynamic-CSS generators (PHP side).
 *
 * Mirrors the thumbnails-slider branch of the JS editor module
 * `blocks/blocks/shared/styles/thumbnailsSliderDynamicCss.js`. Any change here
 * MUST land on the JS side in the same commit — the JS↔PHP parity harness in
 * `tests/css-parity/` will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Thumbnails-slider main-stage + thumb-strip base/responsive rules and the
 * image-filter / dimension helpers they rely on.
 */
trait ThumbnailsSliderCss {

	/**
	 * Whether the block is the thumbnails-slider (gates the thumbs_* generators).
	 *
	 * @return bool True when blockName matches.
	 */
	private function is_thumbnails_slider_block() {
		$block_name = isset( $this->attributes['blockName'] ) ? strtolower( (string) $this->attributes['blockName'] ) : '';
		return 'thumbnails-slider' === $block_name || 'wp-carousel-pro/thumbnails-slider' === $block_name;
	}

	/**
	 * Base CSS for the thumbnails-slider block (mirrors
	 * `generateThumbnailsSliderBaseStyles` in carouselDynamicCss.js).
	 *
	 * @return array CSS rules.
	 */
	private function thumbnails_slider_base_styles() {
		$rules       = array();
		$thumbs_area = $this->attributes['thumbsArea'] ?? array();
		$thumbnail   = $this->attributes['thumbnail'] ?? array();

		// Style-tab background / padding / margin target `.wpcp-swiper-thumb-wrapper` — the
		// div that wraps the thumb-strip Swiper (the visible framed box), separate from the
		// outer `.wpcp-thumbs-area` wrapper (which carries structural position/layout longhands
		// like `padding-top/bottom`, `margin-left/right`), so there's no specificity battle.
		// Border / radius / box-shadow are tokenized (style-config.js `thumbs-area-*` rows →
		// static SCSS consumers, also on the wrapper). Background stays a Layer-5 paired
		// builder for the polymorphic get_bg_value fan-out.
		if ( ! empty( $thumbs_area['background'] ) ) {
			$bg = $this->get_bg_value( $thumbs_area['background'] );
			if ( '' !== $bg ) {
				$rules[] = array(
					'selector' => $this->thumbs_area_strip_selector,
					'styles'   => array( 'background' => $bg ),
				);
			}
		}
		if ( ! empty( $thumbs_area['padding'] ) ) {
			$padding_css = $this->spacing_generate( $thumbs_area['padding'], 'Desktop' );
			if ( '' !== $padding_css ) {
				$rules[] = array(
					'selector' => $this->thumbs_area_strip_selector,
					'styles'   => array( 'padding' => $padding_css ),
				);
			}
		}

		if ( ! empty( $thumbs_area['margin'] ) ) {
			$margin_css = $this->spacing_generate( $thumbs_area['margin'], 'Desktop' );
			if ( '' !== $margin_css ) {
				$rules[] = array(
					'selector' => $this->thumbs_area_strip_selector,
					'styles'   => array( 'margin' => $margin_css ),
				);
			}
		}
		// Per-thumb opacity (non-active dimming) + per-thumb border (style/width/color +
		// hover/active color) are tokenized (style-config.js `thumb-opacity` /
		// `thumb-border-*` rows → static SCSS consumers; the active thumb stays at 1 via
		// a static rule). The `spacingBox` token also reconciles a legacy JS↔PHP
		// divergence: PHP cast the four-side `borderWidth` array to int, JS used the
		// four-value spacingGenerate. The thumb borderRadius stays a paired Layer-5
		// builder (load-bearing `#uid` over the static `inherit` / `4px` rules).
		if ( ! empty( $thumbnail['borderRadius'] ) ) {
			$radius_css = $this->spacing_generate( $thumbnail['borderRadius'], 'Desktop' );
			if ( '' !== $radius_css ) {
				$rules[] = array(
					'selector' => $this->thumb_img_selector,
					'styles'   => array( 'border-radius' => $radius_css ),
				);
			}
		}

		// Image filter — the Style tab's control writes `imageFilter.normal`,
		// which dims every inactive thumb.
		$image_filter  = isset( $thumbnail['imageFilter'] ) && is_array( $thumbnail['imageFilter'] ) ? $thumbnail['imageFilter'] : array();
		$normal_filter = $this->compose_image_filter( $image_filter['normal'] ?? array() );
		if ( '' !== $normal_filter ) {
			$rules[] = array(
				'selector' => $this->thumb_inactive_img_selector,
				'styles'   => array( 'filter' => $normal_filter ),
			);
		}
		// Active thumb border — the Free `none` style draws it on the image itself.
		$active_thumb_border = $thumbnail['activeThumbBorder'] ?? array();
		if ( ! empty( $active_thumb_border['style'] ) && 'none' !== $active_thumb_border['style'] ) {
			$border_styles = $this->border_css( $active_thumb_border, $thumbnail['activeThumbBorderWidth'] ?? array() );
			if ( ! empty( $border_styles ) ) {
				$rules[] = array(
					'selector' => $this->thumb_active_img_selector,
					'styles'   => $border_styles,
				);
			}
		}

		return $rules;
	}

	/**
	 * Compose a CSS `filter:` value from a 5-key image-filter options array.
	 *
	 * Mirrors `composeImageFilter()` in carouselDynamicCss.js — both copies
	 * must emit byte-identical strings so render-parity tests pass.
	 * Skip-emission rules: `!enable` returns ''; default-value parts
	 * (brightness 1, contrast 1, blur 0, saturation 0,
	 * hue 1) are omitted.
	 *
	 * @param array<string, mixed> $filter_opts Filter options.
	 * @return string CSS filter value or empty string.
	 */
	private function compose_image_filter( array $filter_opts ): string {
		$parts      = array();
		$brightness = isset( $filter_opts['brightness'] ) ? (float) $filter_opts['brightness'] : 1.0;
		$contrast   = isset( $filter_opts['contrast'] ) ? (float) $filter_opts['contrast'] : 1.0;
		$blur       = isset( $filter_opts['blur'] ) ? (float) $filter_opts['blur'] : 0.0;
		$saturation = isset( $filter_opts['saturation'] ) ? (float) $filter_opts['saturation'] : 0.0;
		$hue        = isset( $filter_opts['hue'] ) ? (float) $filter_opts['hue'] : 1.0;

		if ( 1.0 !== $brightness ) {
			$parts[] = 'brightness(' . $this->format_filter_number( $brightness ) . ')';
		}
		if ( 1.0 !== $contrast ) {
			$parts[] = 'contrast(' . $this->format_filter_number( $contrast ) . ')';
		}
		if ( $blur > 0 ) {
			$parts[] = 'blur(' . $this->format_filter_number( $blur ) . 'px)';
		}
		if ( $saturation > 0 ) {
			$parts[] = 'saturate(' . $this->format_filter_number( $saturation ) . ')';
		}
		if ( 1.0 !== $hue ) {
			$parts[] = 'hue-rotate(' . $this->format_filter_number( $hue ) . 'deg)';
		}
		return implode( ' ', $parts );
	}

	/**
	 * Format a numeric filter value to match JS `Number(x).toString()` output.
	 * Trims trailing zeros so `0.5` stays `0.5`, `1` stays `1`, etc. — keeps
	 * the JS/PHP byte-identical contract for `composeImageFilter` output.
	 *
	 * @param float $value Numeric value.
	 * @return string Formatted string without trailing zeros.
	 */
	private function format_filter_number( float $value ): string {
		// Match JS `Number().toString()` — integer values render without decimal.
		if ( (float) (int) $value === $value ) {
			return (string) (int) $value;
		}
		// rtrim removes trailing 0s plus any orphan decimal point.
		return rtrim( rtrim( sprintf( '%.10F', $value ), '0' ), '.' );
	}

	/**
	 * Append a unit to a bare numeric value. Returns '' for empty/auto.
	 *
	 * @param mixed  $value Raw value from attributes (may be number or string).
	 * @param string $unit  Unit to apply when the value is a bare number.
	 * @return string
	 */
	private function unitize_dimension( $value, string $unit = 'px' ): string {
		$str = trim( (string) ( $value ?? '' ) );
		if ( '' === $str || 'auto' === $str ) {
			return '';
		}
		return preg_match( '/^-?\d+(\.\d+)?$/', $str ) ? $str . $unit : $str;
	}

	/**
	 * Responsive CSS for thumbnails-slider (mirrors
	 * `generateThumbnailsSliderResponsiveStyles` in carouselDynamicCss.js).
	 *
	 * @param string $device_type Device.
	 * @return array CSS rules.
	 */
	private function thumbnails_slider_responsive_rules( $device_type ) {
		$rules          = array();
		$thumbs_area    = $this->attributes['thumbsArea'] ?? array();
		$thumbnail      = $this->attributes['thumbnail'] ?? array();
		$layout_options = $this->attributes['layoutOptions'] ?? array();

		// Gap between thumbs — moved to `thumbsArea` in the redesign. The
		// migrator copies legacy `thumbnail.gap*` into `thumbsArea.gap*`.
		$gap_map   = array(
			'Desktop' => $thumbs_area['gap'] ?? null,
			'Tablet'  => $thumbs_area['gapTablet'] ?? null,
			'Mobile'  => $thumbs_area['gapMobile'] ?? null,
		);
		$gap_value = $gap_map[ $device_type ] ?? null;
		if ( null !== $gap_value && '' !== $gap_value ) {
			$rules[] = array(
				'selector' => $this->thumbs_area_selector,
				'styles'   => array( 'gap' => ( (int) $gap_value ) . 'px' ),
			);
		}

		// Thumbnail dimensions — responsive { width, height } object. Bare
		// numbers get the configured unit. Targets `.wpcp-thumb` (Swiper sizes
		// the slide; img inside is 100% of slide).
		$dimensions = $thumbnail['dimensions'] ?? array();
		$slot       = $dimensions['device'][ $device_type ] ?? array();
		$unit       = $dimensions['unit'][ $device_type ] ?? array(
			'width'  => 'px',
			'height' => 'px',
		);
		$dim_width  = $this->unitize_dimension( $slot['width'] ?? '', $unit['width'] ?? 'px' );
		$dim_height = $this->unitize_dimension( $slot['height'] ?? '', $unit['height'] ?? 'px' );
		if ( '' !== $dim_width ) {
			$rules[] = array(
				'selector' => $this->thumb_img_selector,
				'styles'   => array( 'width' => $dim_width ),
			);
		}
		if ( '' !== $dim_height ) {
			$rules[] = array(
				'selector' => $this->thumb_img_selector,
				'styles'   => array( 'height' => $dim_height ),
			);
		}
		$thumbs_per_view_map   = array(
			'Desktop' => $layout_options['thumbsPerView'] ?? null,
			'Tablet'  => $layout_options['thumbsPerViewTablet'] ?? null,
			'Mobile'  => $layout_options['thumbsPerViewMobile'] ?? null,
		);
		$thumbs_per_view_value = $thumbs_per_view_map[ $device_type ] ?? null;
		if ( null !== $thumbs_per_view_value && '' !== $thumbs_per_view_value ) {
			$rules[] = array(
				'selector' => $this->thumbs_area_selector,
				'styles'   => array( '--wpcp-thumbs-per-view' => (string) (int) $thumbs_per_view_value ),
			);
		}

		return $rules;
	}
}
