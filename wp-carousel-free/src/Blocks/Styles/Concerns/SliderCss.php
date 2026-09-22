<?php
/**
 * Slider block dynamic-CSS generators (PHP side).
 *
 * Mirrors the slider branch of the JS editor module
 * `blocks/blocks/shared/styles/sliderDynamicCss.js`. Any change here MUST land on
 * the JS side in the same commit — the JS↔PHP parity harness in
 * `tests/css-parity/` will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Slider stage/media fill + responsive height rules.
 */
trait SliderCss {

	/**
	 * Whether the block is the slider (gates the slider height + media-fill rules).
	 *
	 * @return bool True when blockName matches.
	 */
	private function is_slider_block() {
		$block_name = isset( $this->attributes['blockName'] ) ? strtolower( (string) $this->attributes['blockName'] ) : '';
		return 'slider' === $block_name || 'wp-carousel-pro/slider' === $block_name;
	}

	/**
	 * Whether the aspect mode lets the fixed sliderHeight drive the stage.
	 *
	 * Original keeps each slide's intrinsic height; Custom keeps Height too
	 * (the custom W/H box is hidden for the slider, so a Custom stage would
	 * otherwise fall back to a 4:3 box with no Height). A preset ratio
	 * (16:9, …) sizes the stage via aspect-ratio and wins over Height.
	 * Mirrors: carouselDynamicCss.js aspectDrivesStageHeight().
	 *
	 * @param string $aspect Aspect ratio mode.
	 * @return bool True when Height drives the stage for this aspect mode.
	 */
	private function slider_aspect_drives_stage_height( string $aspect ): bool {
		return in_array( $aspect, array( 'original', 'custom' ), true );
	}

	/**
	 * Static slider rules: make each slide's media + image fill the slide and
	 * crop to it, so the stage size (fixed Height for Original/Custom,
	 * aspect-ratio for a preset) crops the image rather than letting its natural
	 * height set the size.
	 *
	 * Mirrors: carouselDynamicCss.js generateSliderBaseStyles().
	 *
	 * @return array Base CSS rules.
	 */
	private function slider_base_styles() {
		if ( ! $this->is_slider_block() ) {
			return array();
		}
		$inner = $this->unique_id . ' .wpcp-swiper .wpcp-item-inner';
		$media = $this->unique_id . ' .wpcp-swiper .wpcp-item-media';
		$img   = $this->unique_id . ' .wpcp-swiper .wpcp-item-img';
		return array(
			array(
				'selector' => $inner,
				'styles'   => array( 'height' => '100%' ),
			),
			array(
				'selector' => $media,
				'styles'   => array( 'height' => '100%' ),
			),
			array(
				'selector' => $img,
				'styles'   => array(
					'height'     => '100%',
					'width'      => '100%',
					'object-fit' => 'cover',
				),
			),
		);
	}

	/**
	 * Stage aspect ratio from Image panel (Stage Aspect Ratio).
	 * A preset ratio (16:9, …) sizes `.wpcp-swiper` and wins over the fixed
	 * `sliderHeight`; Original and Custom keep the fixed Height.
	 * Mirrors generateSliderAspectRatioStyles().
	 *
	 * @return array CSS rules.
	 */
	private function slider_aspect_ratio_styles() {
		if ( ! $this->is_slider_block() ) {
			return array();
		}
		$image_options = $this->attributes['imageOptions'] ?? array();
		$aspect        = $image_options['aspectRatio'] ?? 'original';
		// Height-driven modes (Original / Custom) skip the aspect box; only preset
		// ratios (16:9, …) size `.wpcp-swiper` and win over fixed sliderHeight.
		if ( $this->slider_aspect_drives_stage_height( $aspect ) ) {
			return array();
		}
		$css_aspect = $this->aspect_ratio_to_css_value( $aspect, $image_options );
		if ( '' === $css_aspect ) {
			return array();
		}
		$selector = $this->unique_id . ' .wpcp-swiper';
		$wrapper  = $this->unique_id . ' .wpcp-swiper .swiper-wrapper';
		$slide    = $this->unique_id . ' .wpcp-swiper .swiper-slide';
		// The aspect-sized stage has a definite height (ratio × width). Thread it
		// down through the flex wrapper + slide so the media/img fill emitted by
		// slider_base_styles() resolves — otherwise the image's natural height
		// flows back up the flex chain and the preset never crops.
		return array(
			array(
				'selector' => $selector,
				'styles'   => array(
					'aspect-ratio' => $css_aspect,
					'height'       => 'auto',
				),
			),
			array(
				'selector' => $wrapper,
				'styles'   => array( 'height' => '100%' ),
			),
			array(
				'selector' => $slide,
				'styles'   => array( 'height' => '100%' ),
			),
		);
	}

	/**
	 * CSS aspect-ratio value for Image panel preset/custom modes.
	 *
	 * @param string $aspect        Aspect ratio mode.
	 * @param array  $image_options Image options attribute group.
	 * @return string CSS value or empty string.
	 */
	private function aspect_ratio_to_css_value( string $aspect, array $image_options ): string {
		if ( 'original' === $aspect || '' === $aspect ) {
			return '';
		}
		if ( 'custom' === $aspect ) {
			$custom_width_options  = isset( $image_options['customImageWidth'] ) && is_array( $image_options['customImageWidth'] ) ? $image_options['customImageWidth'] : array();
			$custom_height_options = isset( $image_options['customImageHeight'] ) && is_array( $image_options['customImageHeight'] ) ? $image_options['customImageHeight'] : array();
			$width_device_map      = isset( $custom_width_options['device'] ) && is_array( $custom_width_options['device'] ) ? $custom_width_options['device'] : array();
			$height_device_map     = isset( $custom_height_options['device'] ) && is_array( $custom_height_options['device'] ) ? $custom_height_options['device'] : array();
			$width_unit_map        = isset( $custom_width_options['unit'] ) && is_array( $custom_width_options['unit'] ) ? $custom_width_options['unit'] : array();
			$height_unit_map       = isset( $custom_height_options['unit'] ) && is_array( $custom_height_options['unit'] ) ? $custom_height_options['unit'] : array();
			$width_value           = (float) ( $width_device_map['Desktop'] ?? 400 );
			$height_value          = (float) ( $height_device_map['Desktop'] ?? 300 );
			$width_unit            = (string) ( $width_unit_map['Desktop'] ?? 'px' );
			$height_unit           = (string) ( $height_unit_map['Desktop'] ?? 'px' );
			if (
				in_array( $width_unit, array( 'px', 'em' ), true )
				&& in_array( $height_unit, array( 'px', 'em' ), true )
				&& $width_value > 0
				&& $height_value > 0
			) {
				return $width_value . ' / ' . $height_value;
			}
			return '';
		}
		$parts = explode( ':', $aspect );
		if ( 2 !== count( $parts ) || ! (float) $parts[0] || ! (float) $parts[1] ) {
			return '';
		}
		return (float) $parts[0] . ' / ' . (float) $parts[1];
	}

	/**
	 * Responsive slider height: pins the stage and each slide to
	 * `layoutOptions.sliderHeight` for the active breakpoint.
	 *
	 * A `%` unit cannot resolve as a plain CSS height — the stage's ancestors
	 * (`.wpcp-block-inner`, `.wpcp-carousel-stage`) carry no explicit height, and
	 * per spec a percentage height against an indefinite containing block
	 * computes to `auto` and is silently dropped. `%` is instead read as a
	 * fraction of the stage's own width (the classic slider convention, and the
	 * one dimension that's always definite here) and applied via `aspect-ratio`,
	 * the same mechanism `slider_aspect_ratio_styles()` uses for a preset ratio.
	 *
	 * Mirrors: carouselDynamicCss.js generateSliderResponsiveStyles().
	 *
	 * @param string $device_type Desktop|Tablet|Mobile.
	 * @return array CSS rules for the device.
	 */
	private function slider_responsive_rules( $device_type ) {
		if ( ! $this->is_slider_block() ) {
			return array();
		}
		$image_options = $this->attributes['imageOptions'] ?? array();
		$aspect        = $image_options['aspectRatio'] ?? 'original';
		// Preset stage aspect wins over fixed sliderHeight (all layouts); Original
		// and Custom keep the fixed Height.
		if ( ! $this->slider_aspect_drives_stage_height( $aspect ) ) {
			return array();
		}
		$layout_options = $this->attributes['layoutOptions'] ?? array();
		// Saved layoutOptions shallow-overrides the schema default, so sliderHeight
		// can be absent — fall back to the SliderSchema default (600/450/300 px).
		$height_default = array(
			'device' => array(
				'Desktop' => 600,
				'Tablet'  => 450,
				'Mobile'  => 300,
			),
			'unit'   => array(
				'Desktop' => 'px',
				'Tablet'  => 'px',
				'Mobile'  => 'px',
			),
		);
		$height_dim     = $this->social_ranger_dimension( $layout_options['sliderHeight'] ?? null, $device_type );
		if ( ! $height_dim ) {
			$height_dim = $this->social_ranger_dimension( $height_default, $device_type );
		}
		if ( ! $height_dim ) {
			return array();
		}
		$stage = $this->unique_id . ' .wpcp-swiper';
		$slide = $this->unique_id . ' .wpcp-swiper .swiper-slide';
		if ( '%' === $height_dim[1] ) {
			if ( $height_dim[0] <= 0 ) {
				return array();
			}
			$wrapper = $this->unique_id . ' .wpcp-swiper .swiper-wrapper';
			return array(
				array(
					'selector' => $stage,
					'styles'   => array(
						'aspect-ratio' => '100 / ' . $height_dim[0],
						'height'       => 'auto',
					),
				),
				array(
					'selector' => $wrapper,
					'styles'   => array( 'height' => '100%' ),
				),
				array(
					'selector' => $slide,
					'styles'   => array( 'height' => '100%' ),
				),
			);
		}
		$css_height = $height_dim[0] . $height_dim[1];
		return array(
			array(
				'selector' => $stage,
				'styles'   => array( 'height' => $css_height ),
			),
			array(
				'selector' => $slide,
				'styles'   => array( 'height' => $css_height ),
			),
		);
	}
}
