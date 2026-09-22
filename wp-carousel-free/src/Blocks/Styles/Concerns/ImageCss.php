<?php
/**
 * Image source dynamic-CSS generators (PHP side).
 *
 * Mirrors the image branch of the JS editor module
 * `blocks/blocks/shared/styles/imageDynamicCss.js`. Border/radius/inner-padding
 * values are token-driven from static SCSS; the rule-string builders here are
 * the Layer-5 remainder — the algorithmic overlay (opacity normalize/clamp +
 * 3-selector fan-out), the filter presets, and
 * the responsive radius/padding/margin spacing. Any change here MUST land on the
 * JS side in the same commit — the css-parity harness catches a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

use ShapedPlugin\WPCarouselFree\Blocks\Rendering\DimensionHelper;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Defaults;

defined( 'ABSPATH' ) || exit;

/**
 * Image overlay/filter base rules + responsive radius/padding/margin.
 */
trait ImageCss {

	/**
	 * Whether the current block is the slider block.
	 *
	 * @return bool True when blockName matches.
	 */
	private function is_slider_block_for_image_css() {
		$block_name = isset( $this->attributes['blockName'] ) ? strtolower( (string) $this->attributes['blockName'] ) : '';
		return 'slider' === $block_name || 'wp-carousel-pro/slider' === $block_name;
	}

	/**
	 * Build base CSS rules for the image overlay + filters.
	 *
	 * Mirrors: imageDynamicCss.js generateImageBaseStyles().
	 *
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function image_base_styles() {
		$base_styles   = array();
		$image_options = $this->attributes['imageOptions'] ?? array();

		// Image overlay — Layer-5 (algorithmic) remainder, kept as a rule-string
		// builder, NOT tokenized: the opacity is resolved algorithmically
		// (resolve_image_overlay_opacity: %-or-fraction normalize + clamp + 0.5
		// fallback) and the color fans out to three selectors, one of which
		// overlayColor is set. Gated by CSS-string css-parity against its JS twin
		// (imageDynamicCss.js generateImageBaseStyles), not the value-map.
		if ( ! empty( $image_options['overlay'] ) ) {
			// Overlay tint is a Background picker: solid color or gradient. Legacy
			// posts store a bare solid string; resolve_overlay_bg maps both forms to
			// the CSS property + value to emit (background-color for solid — identical
			// to the legacy path — or `background` for a gradient). Mirrors
			// imageDynamicCss.js generateImageBaseStyles overlay branch.
			$norm                  = $this->resolve_overlay_bg( $image_options['overlayColor'] ?? null );
			$hov                   = $this->resolve_overlay_bg( $image_options['overlayColorHover'] ?? null );
			$image_overlay_opacity = (string) $this->resolve_image_overlay_opacity( $image_options['opacity'] ?? null );
			$overlay_opacity_hover = (string) $this->resolve_image_overlay_opacity( $image_options['opacityHover'] ?? null );

			if ( '' !== $norm['css'] ) {
				$base_styles[] = array(
					'selector' => $this->image_overlay_selector,
					'styles'   => array( $norm['prop'] => $norm['css'] ),
				);
			}

			$base_styles[] = array(
				'selector' => $this->image_overlay_selector,
				'styles'   => array( 'opacity' => $image_overlay_opacity ),
			);

			// Feed the overlay tint to the animated overlay-effect layer. An Overlay
			// Effect (Hover Animations panel) is a hover reveal: the static `::before`
			// tint is suppressed (see _hover-anim-library.scss) and `.wpcp-overlay-anim-layer`
			// owns the tint via this var. Source it from the HOVER overlay state (the
			// reveal destination) — sourcing Normal would leave the layer transparent
			// whenever the overlay is a hover-only darken (Normal opacity 0). The layer's
			// own `opacity` drives the effect reveal, so the tint strength can't live
			// there; the layer's `::before` carries the background and reads
			// `--wpcp-overlay-anim-tint-opacity` for its strength. A solid tint bakes the
			// opacity into the rgba alpha (and leaves the var at its 1 default); a
			// gradient can't be alpha-baked, so it ships the raw gradient and drives
			// strength via the tint-opacity var instead. The var is formatted to 3
			// decimals — mirroring the solid alpha-bake's number_format(,3) — so a
			// fractional opacity (33.3%) stringifies identically JS↔PHP (a raw (string)
			// cast would diverge from JS's shortest-round-trip String()). Mirrors
			// imageDynamicCss.js.
			$anim_source_color = 'solid' === $hov['style'] ? $hov['css'] : '';
			$overlay_anim_tint = '' !== $anim_source_color ? $this->compose_overlay_anim_tint( $anim_source_color, $image_options['opacityHover'] ?? null ) : null;
			$base_styles[]     = array(
				'selector' => $this->unique_id,
				'styles'   => array( '--wpcp-overlay-anim-color' => null !== $overlay_anim_tint ? $overlay_anim_tint : $hov['css'] ),
			);
			if ( 'gradient' === $hov['style'] && '' !== $hov['css'] ) {
				$base_styles[] = array(
					'selector' => $this->unique_id,
					'styles'   => array( '--wpcp-overlay-anim-tint-opacity' => number_format( (float) $overlay_opacity_hover, 3, '.', '' ) ),
				);
			}

			// Hover state: overlay color/opacity switch with the Image > Style
			// Normal/Hover tab. Emit a `.wpcp-item:hover`-scoped override only for
			// the value(s) that differ from the normal state. Mirrors
			// imageDynamicCss.js generateImageBaseStyles overlay hover.
			$overlay_color_changed   = $hov['css'] !== $norm['css'] || $hov['prop'] !== $norm['prop'];
			$overlay_opacity_changed = $overlay_opacity_hover !== $image_overlay_opacity;
			if ( ( $overlay_color_changed || $overlay_opacity_changed ) && ! $this->is_slider_block_for_image_css() ) {
				$hover_styles = array();
				if ( $overlay_color_changed && '' !== $hov['css'] ) {
					$hover_styles[ $hov['prop'] ] = $hov['css'];
				}
				if ( $overlay_opacity_changed ) {
					$hover_styles['opacity'] = $overlay_opacity_hover;
				}
				if ( ! empty( $hover_styles ) ) {
					$base_styles[] = array(
						'selector' => $this->image_overlay_hover_selector,
						'styles'   => $hover_styles,
					);
				}

				// Social-share items restore the NORMAL tint while their parent hovers.
				$social_hover_styles = array();
				if ( $overlay_color_changed && '' !== $norm['css'] ) {
					$social_hover_styles[ $norm['prop'] ] = $norm['css'];
				}
				if ( $overlay_opacity_changed ) {
					$social_hover_styles['opacity'] = $image_overlay_opacity;
				}
				if ( ! empty( $social_hover_styles ) ) {
					$base_styles[] = array(
						'selector' => $this->image_overlay_share_selector,
						'styles'   => $social_hover_styles,
					);
				}
			}
		}

		// Image - CSS filters (normal / hover on `.wpcp-item`) + transition. Mirrors imageDynamicCss.js.
		$filter_normal = $image_options['filterNormal'] ?? 'none';
		$filter_hover  = $image_options['filterHover'] ?? 'none';
		$normal_css    = $this->image_filter_css_value( $filter_normal );
		$hover_css     = $this->image_filter_css_value( $filter_hover );
		if ( 'none' !== $normal_css || 'none' !== $hover_css ) {
			$same_preset = $hover_css === $normal_css;

			$base_filter_styles = array(
				'filter'         => $normal_css,
				'-webkit-filter' => $normal_css,
			);

			$base_styles[] = array(
				'selector' => $this->image_filter_scope_selector,
				'styles'   => $base_filter_styles,
			);

			if ( ! $same_preset ) {
				$base_styles[] = array(
					'selector' => $this->image_filter_hover_scope_selector,
					'styles'   => array(
						'filter'         => $hover_css,
						'-webkit-filter' => $hover_css,
					),
				);
			}
		}

		return $base_styles;
	}

	/**
	 * Build responsive CSS rules for image radius/inner-padding/padding/margin.
	 *
	 * Mirrors: imageDynamicCss.js generateImageResponsiveRules().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function image_responsive_rules( $device_type ) {
		$rules         = array();
		$image_options = $this->attributes['imageOptions'] ?? array();

		// Image - Border radius on media wrapper (matches border + avoids padding fighting radius on <img>).
		if ( ! empty( $image_options['borderRadius'] ) && $this->has_spacing_changed( $image_options['borderRadius'] ) ) {
			// Border-radius takes four distinct corners — emit all sides (true drops three).
			$border_radius = $this->spacing_generate( $image_options['borderRadius'], $device_type, false );
			if ( $border_radius && ! $this->is_zero_spacing_value( $border_radius ) ) {
				$rules[] = array(
					'selector' => $this->image_media_selector,
					'styles'   => array(
						'border-radius' => $border_radius,
						'overflow'      => 'hidden',
					),
				);
			}
		}

		// Image - Padding on <img> only when innerPadding is set; outer `padding` uses media wrapper only.
		if ( ! empty( $image_options['innerPadding'] ) && $this->has_spacing_changed( $image_options['innerPadding'] ) ) {
			$padding = $this->spacing_generate( $image_options['innerPadding'], $device_type );
			if ( $padding && ! $this->is_zero_spacing_value( $padding ) ) {
				$rules[] = array(
					'selector' => $this->image_selector,
					'styles'   => array( 'padding' => $padding ),
				);
			}
		}

		// phpcs:disable Squiz.PHP.CommentedOutCode.Found, Squiz.Commenting.InlineComment.InvalidEndChar -- Parity marker for the matching disabled branch in imageDynamicCss.js.
		// Image - Padding on media wrapper (DISABLED — mirrors the commented-out
		// `imageOptions.padding` block in imageDynamicCss.js generateImageResponsiveRules).
		// if ( ! empty( $image_options['padding'] ) && $this->has_spacing_changed( $image_options['padding'] ) ) {
		// $sides = $this->get_device_spacing_sides( $image_options['padding'], $device_type );
		// if ( $sides ) {
		// $content_orientation = $this->get_resolved_content_orientation();
		// if ( in_array( $content_orientation, array( 'overlay', 'diagonal' ), true ) ) {
		// Overlay/Diagonal: the Image panel padding insets the content box
		// from the image/item edge. Emit it as per-side MARGIN, not padding,
		// so it stays orthogonal to the content-area padding — that inner
		// padding is emitted separately onto the same element (ContentAreaCss);
		// padding here would clobber it, margin offsets the whole box instead.
		// $unit   = $sides['unit'];
		// $top    = $sides['top'];
		// $right  = $sides['right'];
		// $bottom = $sides['bottom'];
		// $left   = $sides['left'];
		//
		// $rules[] = array(
		// 'selector' => $this->get_content_area_padding_selector(),
		// 'styles'   => array(
		// 'margin-top'    => $top . $unit,
		// 'margin-right'  => $right . $unit,
		// 'margin-bottom' => $bottom . $unit,
		// 'margin-left'   => $left . $unit,
		// ),
		// );
		// } else {
		// $unit        = $sides['unit'];
		// $top         = $sides['top'];
		// $right       = $sides['right'];
		// $bottom      = $sides['bottom'];
		// $left        = $sides['left'];
		// $source_type = $this->attributes['sourceType'] ?? 'image';
		// $aspect      = DimensionHelper::resolve_outer_media_aspect( $source_type, $image_options );
		// $partial     = 'original' !== $aspect;
		//
		// $styles = $partial
		// ? array(
		// 'padding-right'  => $right . $unit,
		// 'padding-bottom' => $bottom . $unit,
		// 'padding-left'   => $left . $unit,
		// )
		// : array( 'padding' => $top . $unit . ' ' . $right . $unit . ' ' . $bottom . $unit . ' ' . $left . $unit );
		//
		// $rules[] = array(
		// 'selector' => $this->image_media_selector,
		// 'styles'   => $styles,
		// );
		// }
		// }
		// }
		// phpcs:enable Squiz.PHP.CommentedOutCode.Found, Squiz.Commenting.InlineComment.InvalidEndChar

		// Image - Margin (responsive).
		if ( ! empty( $image_options['margin'] ) && $this->has_spacing_changed( $image_options['margin'] ) ) {
			$margin = $this->spacing_generate( $image_options['margin'], $device_type );
			if ( $margin && ! $this->is_zero_spacing_value( $margin ) ) {
				$rules[] = array(
					'selector' => $this->image_media_selector,
					'styles'   => array( 'margin' => $margin ),
				);
			}
		}

		return $rules;
	}

	/**
	 * Map an Image panel filter value to a CSS `filter` string.
	 *
	 * Accepts both legacy preset strings and the newer object-based slider values.
	 * Mirrors imageDynamicCss.js `IMAGE_FILTER_PRESETS` / `composeImageFilter()`.
	 *
	 * @param mixed $filter_value Filter preset key or object payload.
	 * @return string
	 */
	private function image_filter_css_value( $filter_value ) {
		$filter_opts = $this->normalize_image_filter_value( $filter_value );
		$filter_css  = $this->compose_image_panel_filter( $filter_opts );

		return '' !== $filter_css ? $filter_css : 'none';
	}

	/**
	 * Normalize an Image panel filter setting to the shared object shape.
	 *
	 * @param mixed $filter_value Filter preset key or object payload.
	 * @return array<string, float|int>
	 */
	private function normalize_image_filter_value( $filter_value ) {
		$defaults = array(
			'blur'       => 0,
			'brightness' => 1,
			'contrast'   => 1,
			'saturation' => 0,
			'hue'        => 1,
		);

		$presets = array(
			'none'       => $defaults,
			'blur'       => array_merge( $defaults, array( 'blur' => 4 ) ),
			'brightness' => array_merge( $defaults, array( 'brightness' => 1.25 ) ),
			'contrast'   => array_merge( $defaults, array( 'contrast' => 1.25 ) ),
			'saturate'   => array_merge( $defaults, array( 'saturation' => 1.6 ) ),
		);

		if ( is_array( $filter_value ) ) {
			return array_merge( $defaults, $filter_value );
		}

		if ( is_string( $filter_value ) && isset( $presets[ $filter_value ] ) ) {
			return $presets[ $filter_value ];
		}

		return $defaults;
	}

	/**
	 * Compose a CSS `filter:` value from the Image panel's object filter shape.
	 *
	 * Mirrors imageDynamicCss.js `composeImageFilter()` so JS/PHP parity stays
	 * byte-identical for the Image panel filter output.
	 *
	 * @param array<string, mixed> $filter_opts Filter options.
	 * @return string CSS filter value or empty string.
	 */
	private function compose_image_panel_filter( array $filter_opts ) {
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
	 * Resolve Image panel overlay opacity to a CSS opacity value.
	 *
	 * Algorithmic transform behind the Layer-5 image-overlay builder (see
	 * image_base_styles): normalizes %-or-fraction input, clamps to 0..1, and falls
	 * back to 0.5 for unparseable values. Twin of imageDynamicCss.js
	 * resolveImageOverlayOpacity.
	 *
	 * @param mixed $opacity Overlay opacity control value.
	 * @return float Opacity between 0 and 1.
	 */
	private function resolve_image_overlay_opacity( $opacity ) {
		if ( is_numeric( $opacity ) ) {
			$numeric_opacity = (float) $opacity;
			return $this->clamp_unit_opacity( 1 < $numeric_opacity ? $numeric_opacity / 100 : $numeric_opacity );
		}

		if ( is_array( $opacity ) ) {
			$raw_value = null;
			$raw_unit  = '%';

			if ( isset( $opacity['value'] ) ) {
				$raw_value = $opacity['value'];
			} elseif ( isset( $opacity['device']['Desktop'] ) ) {
				$raw_value = $opacity['device']['Desktop'];
			} elseif ( isset( $opacity['Desktop'] ) ) {
				$raw_value = $opacity['Desktop'];
			}

			if ( isset( $opacity['unit'] ) ) {
				$raw_unit = is_array( $opacity['unit'] ) ? ( $opacity['unit']['Desktop'] ?? '%' ) : $opacity['unit'];
			}

			if ( is_numeric( $raw_value ) ) {
				$numeric_opacity = (float) $raw_value;
				return $this->clamp_unit_opacity( '%' === $raw_unit || 1 < $numeric_opacity ? $numeric_opacity / 100 : $numeric_opacity );
			}
		}

		return 0.5;
	}

	/**
	 * Resolve an overlay color attribute into the CSS property + value to emit on
	 * the overlay tint layer.
	 *
	 * The Overlay control is a Background picker, so the saved value is a
	 * `{ style, solid, gradient }` array; older posts store a bare solid-color
	 * string. For a solid overlay this resolves to `background-color` + the solid
	 * color (identical to the legacy string path); for a gradient it resolves to
	 * `background` + the gradient. The resolved `solid` also feeds the
	 * alpha-baked anim tint (solid-only).
	 * Twin of imageDynamicCss.js resolveOverlayBg.
	 *
	 * @param mixed $raw Saved `overlayColor` / `overlayColorHover` — array, legacy string, or null.
	 * @return array{ style: string, solid: string, gradient: string, css: string, prop: string }
	 */
	private function resolve_overlay_bg( $raw ) {
		if ( is_array( $raw ) ) {
			$style    = isset( $raw['style'] ) && '' !== $raw['style'] ? $raw['style'] : 'solid';
			$solid    = isset( $raw['solid'] ) && '' !== $raw['solid'] ? $raw['solid'] : Defaults::OVERLAY_COLOR;
			$gradient = isset( $raw['gradient'] ) ? $raw['gradient'] : '';
		} else {
			$style    = 'solid';
			$solid    = is_string( $raw ) && '' !== $raw ? $raw : Defaults::OVERLAY_COLOR;
			$gradient = '';
		}

		if ( 'gradient' === $style ) {
			return array(
				'style'    => 'gradient',
				'solid'    => $solid,
				'gradient' => $gradient,
				'css'      => $gradient,
				'prop'     => 'background',
			);
		}

		return array(
			'style'    => 'solid',
			'solid'    => $solid,
			'gradient' => $gradient,
			'css'      => $solid,
			'prop'     => 'background-color',
		);
	}

	/**
	 * Clamp CSS opacity to the valid unit interval.
	 *
	 * @param float $opacity Opacity value.
	 * @return float Clamped opacity value.
	 */
	private function clamp_unit_opacity( $opacity ) {
		return max( 0, min( 1, $opacity ) );
	}

	/**
	 * Parse a hex / rgb() / rgba() color string to its { r, g, b, a } channels.
	 *
	 * Twin of imageDynamicCss.js parseColorToRgba — keep the accepted formats in
	 * sync. Returns null when the format is unrecognized (e.g. a named color).
	 *
	 * @param mixed $color Color string.
	 * @return array|null { r, g, b, a } channels, or null when unparseable.
	 */
	private function parse_color_to_rgba( $color ) {
		if ( ! is_string( $color ) ) {
			return null;
		}
		$trimmed = trim( $color );

		if ( preg_match( '/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i', $trimmed, $matches ) ) {
			return array(
				'r' => (int) $matches[1],
				'g' => (int) $matches[2],
				'b' => (int) $matches[3],
				'a' => isset( $matches[4] ) && '' !== $matches[4] ? (float) $matches[4] : 1.0,
			);
		}

		if ( preg_match( '/^#([0-9a-f]{3,8})$/i', $trimmed, $matches ) ) {
			$hex    = $matches[1];
			$length = strlen( $hex );
			if ( 3 === $length || 4 === $length ) {
				$expanded = '';
				for ( $index = 0; $index < $length; $index++ ) {
					$expanded .= $hex[ $index ] . $hex[ $index ];
				}
				$hex    = $expanded;
				$length = strlen( $hex );
			}
			if ( 6 === $length || 8 === $length ) {
				return array(
					'r' => hexdec( substr( $hex, 0, 2 ) ),
					'g' => hexdec( substr( $hex, 2, 2 ) ),
					'b' => hexdec( substr( $hex, 4, 2 ) ),
					'a' => 8 === $length ? hexdec( substr( $hex, 6, 2 ) ) / 255 : 1.0,
				);
			}
		}

		return null;
	}

	/**
	 * Compose the animated overlay-layer tint: the Overlay Color with the Overlay
	 * Opacity baked into its alpha.
	 *
	 * The layer's own `opacity` property drives the effect reveal (fade/slide/
	 * wipe), so the tint strength must live in the color itself. Twin of
	 * imageDynamicCss.js composeOverlayAnimTint.
	 *
	 * @param string $color   Overlay color (hex / rgb() / rgba()).
	 * @param mixed  $opacity Overlay opacity control value.
	 * @return string|null Composed `rgba()` string, or null when the color is unparseable.
	 */
	private function compose_overlay_anim_tint( $color, $opacity ) {
		$parsed = $this->parse_color_to_rgba( $color );
		if ( null === $parsed ) {
			return null;
		}
		$final_alpha = $this->clamp_unit_opacity( $parsed['a'] * (float) $this->resolve_image_overlay_opacity( $opacity ) );
		return 'rgba(' . $parsed['r'] . ', ' . $parsed['g'] . ', ' . $parsed['b'] . ', ' . number_format( $final_alpha, 3, '.', '' ) . ')';
	}
}
