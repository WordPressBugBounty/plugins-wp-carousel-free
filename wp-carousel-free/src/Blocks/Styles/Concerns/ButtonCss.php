<?php
/**
 * Read-more / add-to-cart button dynamic-CSS generators (PHP side).
 *
 * Mirrors the button branch of the JS editor module
 * `blocks/blocks/shared/styles/buttonDynamicCss.js`. Source-gated
 * (post/video/product/image) color/background/hover + border
 * (view-gated) + padding/margin/radius + icon spacing/size and the static icon-wrap
 * flex. Any change here MUST land on the JS side in the same commit — the
 * css-parity harness catches a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Button base color/border rules + responsive spacing/icon rules.
 */
trait ButtonCss {

	/**
	 * Build base CSS rules for the read-more / cart button.
	 *
	 * Mirrors: buttonDynamicCss.js generateButtonBaseStyles().
	 *
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function button_base_styles() {
		$base_styles          = array();
		$attributes           = $this->attributes;
		$content_options      = $attributes['contentOptions'] ?? array();
		$post_content_options = $attributes['postContentOptions'] ?? array();
		$product_content_opts = $attributes['productContentOptions'] ?? array();
		$source_type          = $attributes['sourceType'] ?? 'image';

		// Read-more / cart button - Border (style/color/width shared; only color differs on hover).
		$button_border       = null;
		$button_border_width = null;
		$button_color        = null;
		$button_bg           = null;
		$button_hover_color  = null;
		$button_hover_bg     = null;
		$button_view         = null;
		$btn_box_shadow      = null;
		$btn_shadow_hover    = null;
		if ( in_array( $source_type, array( 'post', 'video' ), true ) ) {
			$button_border       = $post_content_options['buttonBorder'] ?? null;
			$button_border_width = $post_content_options['btnBorderWidth'] ?? null;
			$button_color        = $post_content_options['buttonColor'] ?? null;
			$button_bg           = $post_content_options['buttonBg'] ?? null;
			$button_hover_color  = $post_content_options['buttonHoverColor'] ?? null;
			$button_hover_bg     = $post_content_options['buttonHoverBg'] ?? null;
			$button_view         = $post_content_options['buttonType'] ?? null;
			$btn_box_shadow      = $post_content_options['btnBoxShadow'] ?? null;
			$btn_shadow_hover    = $post_content_options['btnShadowHover'] ?? null;
		} elseif ( 'product' === $source_type ) {
			$button_border       = $product_content_opts['cartBorder'] ?? null;
			$button_border_width = $product_content_opts['cartBorderWidth'] ?? null;
			$button_color        = $product_content_opts['buttonColor'] ?? null;
			$button_bg           = $product_content_opts['buttonBg'] ?? null;
			$button_hover_color  = $product_content_opts['buttonHoverColor'] ?? null;
			$button_hover_bg     = $product_content_opts['buttonHoverBg'] ?? null;
			$button_view         = 'button';
		} else {
			$button_border       = $content_options['cartBorder'] ?? null;
			$button_border_width = $content_options['cartBorderWidth'] ?? null;
			$button_color        = $content_options['buttonColor'] ?? null;
			$button_bg           = $content_options['buttonBg'] ?? null;
			$button_hover_color  = $content_options['buttonHoverColor'] ?? null;
			$button_hover_bg     = $content_options['buttonHoverBg'] ?? null;
			$button_view         = $content_options['buttonType'] ?? null;
		}

		$button_styles = array();
		if ( ! empty( $button_color ) ) {
			$button_styles['color'] = $button_color;
		}
		if ( ! empty( $button_styles ) ) {
			$base_styles[] = array(
				'selector' => $this->read_more_selector,
				'styles'   => $button_styles,
			);
		}

		$button_hover_styles = array();
		if ( ! empty( $button_hover_color ) ) {
			$button_hover_styles['color'] = $button_hover_color;
		}
		if ( ! empty( $button_hover_styles ) ) {
			$base_styles[] = array(
				'selector' => $this->read_more_selector . ':hover',
				'styles'   => $button_hover_styles,
			);
		}

		// Add border-style and border-color when buttonView === 'button' (matches JS logic).
		if ( 'button' === $button_view ) {
			$base_styles[] = array(
				'selector' => $this->read_more_selector,
				'styles'   => array(
					'border-style' => $button_border['style'] ?? '',
					'border-color' => $button_border['color'] ?? '',
				),
			);
		}

		// Skip border-width and hover border-color when border style is not set or is 'none'.
		if ( 'button' === $button_view && ! empty( $button_border['style'] ) && 'none' !== $button_border['style'] ) {
			$btn_width_css = $this->spacing_generate( $button_border_width ?? array(), 'Desktop' );
			if ( $btn_width_css ) {
				$base_styles[] = array(
					'selector' => $this->read_more_selector,
					'styles'   => array( 'border-width' => $btn_width_css ),
				);
			}
			if ( ! empty( $button_border['hoverColor'] ) && 'button' === $button_view ) {
				$base_styles[] = array(
					'selector' => $this->read_more_selector . ':hover',
					'styles'   => array( 'border-color' => $button_border['hoverColor'] ),
				);
			}
		}

		// Button style for readMoreBtn selector with comprehensive styling.
		$button_style_btn = array();
		if ( ! empty( $button_bg ) ) {
			$button_style_btn['background-color'] = $button_bg;
		}
		if ( 'button' === $button_view && ! empty( $button_border['style'] ) ) {
			$button_style_btn['border-style'] = $button_border['style'];
		}
		if ( 'button' === $button_view && ! empty( $button_border['color'] ) ) {
			$button_style_btn['border-color'] = $button_border['color'];
		}
		if ( 'button' === $button_view && ! empty( $button_border_width ) ) {
			$btn_width_css_btn = $this->spacing_generate( $button_border_width, 'Desktop' );
			if ( $btn_width_css_btn ) {
				$button_style_btn['border-width'] = $btn_width_css_btn;
			}
		}
		$btn_shadow_value = $this->get_box_shadow_value( $btn_box_shadow );
		if ( $btn_shadow_value ) {
			$button_style_btn['box-shadow'] = $btn_shadow_value;
		}
		if ( ! empty( $button_style_btn ) ) {
			$base_styles[] = array(
				'selector' => $this->read_more_btn_selector,
				'styles'   => $button_style_btn,
			);
		}

		// Button style hover state for readMoreBtn selector.
		$button_style_btn_hover = array();
		if ( ! empty( $button_hover_bg ) ) {
			$button_style_btn_hover['background-color'] = $button_hover_bg;
		}
		if ( 'button' === $button_view && ! empty( $button_border['hoverColor'] ) ) {
			$button_style_btn_hover['border-color'] = $button_border['hoverColor'];
		}
		$btn_shadow_hover_value = $this->get_box_shadow_value( $btn_shadow_hover );
		if ( $btn_shadow_hover_value ) {
			$button_style_btn_hover['box-shadow'] = $btn_shadow_hover_value;
		}
		if ( ! empty( $button_style_btn_hover ) ) {
			$base_styles[] = array(
				'selector' => $this->read_more_btn_selector . ':hover',
				'styles'   => $button_style_btn_hover,
			);
		}

		return $base_styles;
	}

	/**
	 * Build responsive CSS rules for button padding/margin/radius + icon.
	 *
	 * Mirrors: buttonDynamicCss.js generateButtonRules().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function button_responsive_rules( $device_type ) {
		$rules                = array();
		$attributes           = $this->attributes;
		$content_options      = $attributes['contentOptions'] ?? array();
		$post_content_options = $attributes['postContentOptions'] ?? array();
		$product_content_opts = $attributes['productContentOptions'] ?? array();
		$source_type          = $attributes['sourceType'] ?? 'image';

		$read_padding = null;
		$read_margin  = null;
		$read_radius  = null;
		if ( in_array( $source_type, array( 'post', 'video' ), true ) ) {
			$read_padding = $post_content_options['btnPadding'] ?? null;
			$read_margin  = $post_content_options['btnMargin'] ?? null;
			$read_radius  = $post_content_options['buttonBorderRadius'] ?? null;
		} elseif ( 'product' === $source_type ) {
			$read_padding = $product_content_opts['cartPadding'] ?? null;
			$read_radius  = $product_content_opts['cartBorderRadius'] ?? null;
		} else {
			$read_padding = $content_options['cartPadding'] ?? null;
			$read_radius  = $content_options['cartBorderRadius'] ?? null;
		}
		if ( ! empty( $read_padding ) && $this->has_spacing_changed( $read_padding ) ) {
			$read_pad_css = $this->spacing_generate( $read_padding, $device_type );
			if ( $read_pad_css ) {
				$rules[] = array(
					'selector' => $this->read_more_selector,
					'styles'   => array( 'padding' => $read_pad_css ),
				);
			}
		}
		if ( ! empty( $read_margin ) && $this->has_spacing_changed( $read_margin ) ) {
			$read_mar_css = $this->spacing_generate( $read_margin, $device_type );
			if ( $read_mar_css ) {
				$rules[] = array(
					'selector' => $this->read_more_selector,
					'styles'   => array( 'margin' => $read_mar_css ),
				);
			}
		}
		if ( ! empty( $read_radius ) && $this->has_spacing_changed( $read_radius ) ) {
			// Border-radius takes four distinct corners — emit all sides. The `true`
			// (single) collapse dropped three corners (8px 12px 16px 0px → 8px).
			$read_radius_css = $this->spacing_generate( $read_radius, $device_type, false );
			if ( $read_radius_css && ! $this->is_zero_spacing_value( $read_radius_css ) ) {
				$rules[] = array(
					'selector' => $this->read_more_selector,
					'styles'   => array( 'border-radius' => $read_radius_css ),
				);
			}
		}

		// Show Icon is Pro for the post/video family, so it never contributes
		// icon CSS — matches SlotRenderer::render_slot_readmore().
		$read_more_icon_options = in_array( $source_type, array( 'post', 'video' ), true )
			? array()
			: $content_options;

		if ( ! empty( $read_more_icon_options ) ) {
			$icon_gap_dimension = $this->social_ranger_dimension( $read_more_icon_options['iconGap'] ?? null, $device_type );
			$icon_position      = $read_more_icon_options['iconPosition'] ?? '';
			$margin_property    = array(
				'left'  => 'margin-right',
				'right' => 'margin-left',
			);
			$show_icon_on_hover = ! empty( $read_more_icon_options['showIconHover'] );

			if ( $icon_gap_dimension && isset( $margin_property[ $icon_position ] ) ) {
				$read_more_icon_selector = $show_icon_on_hover
					? $this->read_more_selector . ':hover.wpcp-icon-position-' . $icon_position . ' .wpcp-readmore-icon'
					: $this->read_more_selector . '.wpcp-icon-position-' . $icon_position . ' .wpcp-readmore-icon';

				$rules[] = array(
					'selector' => $read_more_icon_selector,
					'styles'   => array(
						$margin_property[ $icon_position ] => $icon_gap_dimension[0] . $icon_gap_dimension[1],
					),
				);
			}

			// Size both the wrapper and the inner asset so frontend PHP output
			// matches the editor's inline preview sizing for library and custom
			// icons.
			$icon_size_dimension = $this->social_ranger_dimension( $read_more_icon_options['iconSize'] ?? null, $device_type );
			if ( $icon_size_dimension ) {
				$icon_size_css = $icon_size_dimension[0] . $icon_size_dimension[1];
				if ( '16px' !== $icon_size_css ) {
					$rules[] = array(
						'selector' => $this->read_more_icon_wrap_selector,
						'styles'   => array(
							'font-size' => $icon_size_css,
							'width'     => $icon_size_css,
							'height'    => $icon_size_css,
						),
					);
					$rules[] = array(
						'selector' => $this->read_more_icon_selector,
						'styles'   => array(
							'width'  => $icon_size_css,
							'height' => $icon_size_css,
						),
					);
				}
			}
		}

		return $rules;
	}

	/**
	 * Convert hex color to rgba for box-shadow.
	 *
	 * @param string $hex Hex color string (e.g., "#ff0000" or "#f00").
	 * @param float  $alpha Alpha value (0-1).
	 * @return string|null RGBA color string or null on failure.
	 */
	private function hex_to_rgba( $hex, $alpha = 1.0 ) {
		// Remove # if present.
		$hex = ltrim( $hex, '#' );

		// Handle 3-character hex (e.g., #f00).
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		// Validate hex length.
		if ( 6 !== strlen( $hex ) ) {
			return null;
		}

		// Extract RGB components.
		$r = hexdec( substr( $hex, 0, 2 ) );
		$g = hexdec( substr( $hex, 2, 2 ) );
		$b = hexdec( substr( $hex, 4, 2 ) );

		// Ensure alpha is within valid range.
		$alpha = max( 0, min( 1, $alpha ) );

		return 'rgba(' . $r . ', ' . $g . ', ' . $b . ', ' . $alpha . ')';
	}
}
