<?php
/**
 * Video source dynamic-CSS generators (PHP side).
 *
 * Mirrors the video branch of the JS editor module
 * `blocks/blocks/shared/styles/videoDynamicCss.js`. Any change here MUST land
 * on the JS side in the same commit — the JS↔PHP parity harness in
 * `tests/css-parity/` will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Video play icon, thumbnail wrapper, and overlay base/responsive rules.
 */
trait VideoCss {

	/**
	 * Build base CSS rules for the video overlay.
	 * Mirrors: videoDynamicCss.js generateVideoBaseStyles()
	 *
	 * Layer-5 (algorithmic) remainder, kept as a paired rule-string builder rather
	 * than a token: get_bg_value chooses *which* property exists from the value
	 * shape — `background` for a gradient/image array, `background-color` for a
	 * solid string — so it changes the rule itself, not just a value, which a
	 * config row cannot express. The play icon (fill/color/bg, hover) and
	 * thumbnail border are token-driven from static SCSS; only this overlay
	 * fan-out stays here. Gated by CSS-string css-parity against its JS twin, not
	 * the value-map — it emits no --wpcp-* token.
	 *
	 * @param array $opts videoOptions slice.
	 * @return array CSS rules in {selector, styles} shape.
	 */
	private function video_base_styles( $opts ) {
		$rules = array();

		if ( ! empty( $opts['overlayEnable'] ) && ! empty( $opts['overlayColor'] ) ) {
			$overlay_color = $opts['overlayColor'];
			if ( is_array( $overlay_color ) ) {
				$bg_value = $this->get_bg_value( $overlay_color );
				$rules[]  = array(
					'selector' => $this->video_thumbnail_wrapper_overlay,
					'styles'   => array( 'background' => $bg_value ),
				);
			} else {
				$rules[] = array(
					'selector' => $this->video_thumbnail_wrapper_overlay,
					'styles'   => array( 'background-color' => $overlay_color ),
				);
			}
		}

		return $rules;
	}

	/**
	 * Build per-device CSS rules for the custom video media dimensions.
	 * Mirrors: videoDynamicCss.js generateVideoResponsiveRules()
	 *
	 * Icon size/area and the border radius/width are token-driven from static SCSS
	 * now; the custom media width/height stay a Layer-5 paired rule-string builder
	 * (NOT tokenized, gated by CSS-string css-parity). The legacy
	 * `#uid .wpcp-item-media { width/height }` (1,1,0) is load-bearing specificity
	 * over the shared image-aspect system (`.wpcp-item-media.wpcp-item-media--custom-rsp`
	 * at 0,2,0, applied whenever aspect is 'custom' regardless of source) and the
	 * content-box `width:100%` override; a static token consumer (0,1,0)
	 * would be un-masked by them. See Styles/README.md (Layer-5 catalogue).
	 *
	 * @param array  $opts        videoOptions slice.
	 * @param string $device_type 'Desktop'|'Tablet'|'Mobile'.
	 * @return array CSS rules.
	 */
	private function video_responsive_rules( $opts, $device_type ) {
		$rules = array();

		// Width/height are only meaningful for a custom aspect ratio — the panel hides
		// these controls for every preset ratio, so a value left from a prior 'custom'
		// choice must not leak out when the user switches back to a preset.
		if ( 'custom' !== ( $opts['aspectRatio'] ?? '' ) ) {
			return $rules;
		}

		$media_image = $this->image_media_selector . ' img';

		$width_dim = $this->social_ranger_dimension( $opts['customVideoWidth'] ?? null, $device_type );
		if ( $width_dim ) {
			$css_width = $width_dim[0] . $width_dim[1];
			$rules[]   = array(
				'selector' => $this->image_media_selector,
				'styles'   => array( 'width' => $css_width ),
			);
			$rules[]   = array(
				'selector' => $media_image,
				'styles'   => array( 'width' => $css_width ),
			);
		}

		$height_dim = $this->social_ranger_dimension( $opts['customVideoHeight'] ?? null, $device_type );
		if ( $height_dim ) {
			$css_height = $height_dim[0] . $height_dim[1];
			$rules[]    = array(
				'selector' => $this->image_media_selector,
				'styles'   => array( 'height' => $css_height ),
			);
			$rules[]    = array(
				'selector' => $media_image,
				'styles'   => array( 'height' => $css_height ),
			);
		}

		return $rules;
	}
}
