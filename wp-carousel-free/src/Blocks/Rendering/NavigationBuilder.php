<?php
/**
 * Navigation arrows and pagination markup + scoped dynamic CSS for block render.
 *
 * Fills the same role as the editor’s navigation/pagination panels: outputs
 * HTML and `<style>` blocks keyed by the block’s root `id`, and exposes
 * sanitised options for `data-wpcp` via {@see get_pagination_options_for_config()}.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Breakpoints;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\StyleConfig;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Tokens\EmitTokens;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\CssUtils;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\ShadowCss;
use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Builds navigation/pagination HTML and `data-wpcp` pagination options from attributes.
 */
class NavigationBuilder {

	use CssUtils;
	use ShadowCss;

	/**
	 * Normalised block attributes.
	 *
	 * @var array
	 */
	private array $attrs;

	/**
	 * Constructor.
	 *
	 * @param array $attrs Same shape as {@see BlockRenderer} constructor.
	 */
	public function __construct( array $attrs ) {
		$this->attrs = $attrs;
	}

	/**
	 * Sanitised pagination options for `data-wpcp` configuration.
	 *
	 * Reads directly from the carousel-style block's top-level
	 * `paginationDotsOptions` attribute (no inner-block fallback).
	 *
	 * @return array
	 */
	public function get_pagination_options_for_config(): array {
		$pbo = $this->attrs['paginationDotsOptions'] ?? array();
		if ( ! is_array( $pbo ) ) {
			return array();
		}
		$style     = AllowedValues::pagination_style( $pbo['paginationStyle'] ?? '' );
		$align_raw = isset( $pbo['alignment'] ) ? (string) $pbo['alignment'] : 'center';
		$align     = in_array( $align_raw, array( 'left', 'center', 'right' ), true ) ? $align_raw : 'center';

		return array(
			'paginationStyle' => $style,
			'alignment'       => $align,
		);
	}

	/**
	 * Navigation position class for wrapper, matching the editor mapping.
	 *
	 * @return string
	 */
	public function get_navigation_position_class(): string {
		$nbo = $this->get_navigation_options();

		return AllowedValues::nav_position( $nbo['position'] ?? '', $this->default_nav_position() );
	}

	/**
	 * Prev/next arrows markup.
	 *
	 * @return string
	 */
	public function navigation_markup(): string {
		return $this->render_navigation_markup();
	}

	/**
	 * Pagination container markup.
	 *
	 * @return string
	 */
	public function pagination_markup(): string {
		return $this->render_pagination_markup();
	}

	/**
	 * Bare navigation CSS for the shared frontend dynamic-CSS pipeline.
	 *
	 * Self-gated to mirror the render: emits only when navigation is enabled.
	 * Returns a bare CSS string (no `<style>` wrapper)
	 * so {@see \ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Block_Dynamic_Style}
	 * can fold it into the per-post cache file / inline style alongside the main
	 * block CSS.
	 *
	 * @param string $dom_id Block root element id.
	 * @return string
	 */
	public function navigation_css( string $dom_id ): string {
		if ( ! $this->chrome_css_enabled( 'navigation' ) ) {
			return '';
		}
		return $this->render_navigation_dynamic_css( $dom_id );
	}

	/**
	 * Bare pagination CSS for the shared frontend dynamic-CSS pipeline.
	 *
	 * @param string $dom_id Block root element id.
	 * @return string
	 */
	public function pagination_css( string $dom_id ): string {
		if ( ! $this->chrome_css_enabled( 'pagination' ) ) {
			return '';
		}
		return $this->render_pagination_dynamic_css( $dom_id );
	}

	/**
	 * Whether a navigation/pagination CSS block should be emitted, matching the
	 * enable gate in {@see BlockRenderer::render()} (the `layoutOptions` flag).
	 *
	 * @param string $flag Layout flag key: 'navigation' or 'pagination'.
	 * @return bool
	 */
	private function chrome_css_enabled( string $flag ): bool {
		$layout = $this->attrs['layoutOptions'] ?? array();
		if ( ! is_array( $layout ) || empty( $layout[ $flag ] ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Sanitized navigation options read directly from the block's top-level
	 * `navigationOptions` attribute (no inner-block fallback).
	 *
	 * @return array
	 */
	private function get_navigation_options(): array {
		$nbo = $this->attrs['navigationOptions'] ?? array();
		return is_array( $nbo ) ? $nbo : array();
	}

	/**
	 * The block's schema default arrow position.
	 *
	 * @return string
	 */
	private function default_nav_position(): string {
		$block_name = isset( $this->attrs['blockName'] ) ? (string) $this->attrs['blockName'] : '';

		return 'thumbnails-slider' === $block_name ? 'nav-vertical-center-inner' : 'nav-vertical-center';
	}

	/**
	 * Render navigation arrows markup.
	 *
	 * @return string
	 */
	private function render_navigation_markup(): string {
		$nbo        = $this->get_navigation_options();
		$classes    = array( 'wpcp-nav-arrows', 'wpcp-navigation' );
		$arrow_icon = $this->render_navigation_arrow_icon_svg();

		return sprintf(
			'<div class="%1$s"><button type="button" class="wpcp-nav wpcp-nav-prev" aria-label="%2$s">%4$s</button><button type="button" class="wpcp-nav wpcp-nav-next" aria-label="%3$s">%5$s</button></div>',
			esc_attr( implode( ' ', array_filter( $classes ) ) ),
			esc_attr__( 'Previous', 'wp-carousel-free' ),
			esc_attr__( 'Next', 'wp-carousel-free' ),
			$arrow_icon,
			$arrow_icon
		);
	}

	/**
	 * The Free arrow glyph.
	 *
	 * Free ships one arrow style, so the value is snapped by
	 * `Schema\AllowedValues::arrow_style()` before it ever reaches here and this
	 * returns the same markup for any input.
	 *
	 * @return string
	 */
	private function render_navigation_arrow_icon_svg(): string {
		return '<svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.49995 6.40003L1.89995 0.700024C1.49995 0.300024 0.899951 0.300024 0.499951 0.700024C0.0999514 1.10002 0.0999514 1.70002 0.499951 2.10002L5.39995 7.00003L0.499951 11.9C0.299951 12.1 0.199951 12.3 0.199951 12.6C0.199951 13.2 0.599951 13.6 1.19995 13.6C1.49995 13.6 1.69995 13.5 1.89995 13.3L7.59995 7.60003C7.89995 7.40003 7.89995 6.80002 7.49995 6.40003Z"/></svg>';
	}

	/**
	 * Markup for `.wpcp-pagination` (must stay inside `.wpcp-carousel-container` for `blocks/blocks/frontend.js`).
	 *
	 * @return string
	 */
	private function render_pagination_markup(): string {
		$pbo = $this->attrs['paginationDotsOptions'] ?? array();
		if ( ! is_array( $pbo ) ) {
			$pbo = array();
		}
		$style     = AllowedValues::pagination_style( $pbo['paginationStyle'] ?? '' );
		$align_raw = isset( $pbo['alignment'] ) ? (string) $pbo['alignment'] : 'center';
		$align     = in_array( $align_raw, array( 'left', 'center', 'right' ), true ) ? sanitize_html_class( $align_raw ) : 'center';
		$vpos_raw  = isset( $pbo['verticalPos'] ) ? (string) $pbo['verticalPos'] : 'bottom';
		$vpos      = in_array( $vpos_raw, array( 'top', 'bottom' ), true ) ? sanitize_html_class( $vpos_raw ) : 'bottom';

		$classes = array(
			'wpcp-pagination',
			'swiper-pagination',
			'wpcp-pagination--' . $style,
			'wpcp-pagination--align-' . $align,
			'wpcp-pagination--vpos-' . $vpos,
		);

		return sprintf(
			'<div class="%1$s"></div>',
			esc_attr( implode( ' ', array_filter( $classes ) ) )
		);
	}

	/**
	 * Dynamic pagination CSS for frontend render (scoped to block root id).
	 *
	 * Do not inject a `flex-direction` here — ID-scoped rules would override the stylesheet in `blocks/blocks/style.scss`.
	 *
	 * @param string $dom_id Block wrapper id.
	 * @return string
	 */
	private function render_pagination_dynamic_css( string $dom_id ): string {
		$pbo = $this->attrs['paginationDotsOptions'] ?? array();
		if ( ! is_array( $pbo ) || empty( $dom_id ) ) {
			return '';
		}

		$get_device_value = static function ( $arr, string $device, $fallback ) {
			if ( ! is_array( $arr ) ) {
				return $fallback;
			}
			if ( array_key_exists( $device, $arr ) ) {
				return $arr[ $device ];
			}
			if ( array_key_exists( 'Desktop', $arr ) ) {
				return $arr['Desktop'];
			}
			return $fallback;
		};

		$root_selector = '#' . $dom_id;
		$selector      = $root_selector . ' .wpcp-pagination.swiper-pagination';
		$config        = array_values(
			array_filter(
				StyleConfig::all(),
				static function ( $row ) {
					return is_array( $row ) && isset( $row['id'] ) && 0 === strpos( (string) $row['id'], 'pag-' );
				}
			)
		);
		$token_bags    = ( new EmitTokens() )->emit(
			$config,
			array( 'paginationDotsOptions' => $pbo )
		);

		// Layer-5 direct property (not tokenized): the top-position offset.
		$build_layout_props = static function ( string $device ) use ( $pbo, $get_device_value ) {
			$props = array();
			$style = AllowedValues::pagination_style( $pbo['paginationStyle'] ?? '' );
			if ( 'scrollbar' !== $style && isset( $pbo['verticalPos'] ) && 'top' === $pbo['verticalPos'] ) {
				$voff_raw = isset( $pbo['verticalPosition']['device'] ) ? $get_device_value( $pbo['verticalPosition']['device'], $device, 30 ) : 30;
				// Each device holds a four-sided spacing value; the offset is its top side.
				if ( is_array( $voff_raw ) ) {
					$voff_raw = $voff_raw['top'] ?? 30;
				}
				$voff         = is_numeric( $voff_raw ) ? max( -200, min( 400, (float) $voff_raw ) ) : 30;
				$voff_unit    = isset( $pbo['verticalPosition']['unit'] ) ? (string) $get_device_value( $pbo['verticalPosition']['unit'], $device, 'px' ) : 'px';
				$props['top'] = $voff . $voff_unit;
			}
			return $props;
		};

		// Margin sides as custom properties on the block root, where the stage can read them too.
		$build_margin_vars = static function ( string $device ) use ( $pbo, $get_device_value ) {
			if ( ! isset( $pbo['margin']['device'][ $device ] ) || ! is_array( $pbo['margin']['device'][ $device ] ) ) {
				return array();
			}
			$margin_device = $pbo['margin']['device'][ $device ];
			$unit_raw      = $pbo['margin']['unit'] ?? 'px';
			$margin_unit   = strtolower( is_array( $unit_raw ) ? (string) $get_device_value( $unit_raw, $device, 'px' ) : (string) $unit_raw );
			if ( ! in_array( $margin_unit, array( 'px', 'em', '%' ), true ) ) {
				$margin_unit = 'px';
			}
			$margin_top    = (float) ( $margin_device['top'] ?? 0 );
			$margin_right  = (float) ( $margin_device['right'] ?? 0 );
			$margin_bottom = (float) ( $margin_device['bottom'] ?? 0 );
			$margin_left   = (float) ( $margin_device['left'] ?? 0 );
			if ( ! $margin_top && ! $margin_right && ! $margin_bottom && ! $margin_left ) {
				return array();
			}
			return array(
				'--wpcp-pag-margin-top'    => $margin_top . $margin_unit,
				'--wpcp-pag-margin-right'  => $margin_right . $margin_unit,
				'--wpcp-pag-margin-bottom' => $margin_bottom . $margin_unit,
				'--wpcp-pag-margin-left'   => $margin_left . $margin_unit,
			);
		};

		$build_styles = static function ( string $device ) use ( $token_bags, $build_layout_props ) {
			$tokens = isset( $token_bags[ $device ] ) && is_array( $token_bags[ $device ] ) ? $token_bags[ $device ] : array();
			return array_merge( $tokens, $build_layout_props( $device ) );
		};

		$device_rules = static function ( string $device ) use ( $selector, $root_selector, $build_styles, $build_margin_vars ) {
			return array(
				array(
					'selector' => $selector,
					'styles'   => $build_styles( $device ),
				),
				array(
					'selector' => $root_selector,
					'styles'   => $build_margin_vars( $device ),
				),
			);
		};

		// Declare each var once: a Tablet/Mobile value equal to the wider-breakpoint
		// cascade is a no-op, so only emit the device-specific deltas.
		$desktop_merged = $this->merge_css_rules_by_selector( $device_rules( 'Desktop' ) );
		$tablet_merged  = $this->merge_css_rules_by_selector( $device_rules( 'Tablet' ) );
		$mobile_merged  = $this->merge_css_rules_by_selector( $device_rules( 'Mobile' ) );

		$tablet_deduped = $this->drop_rules_matching_baseline( $tablet_merged, array( $desktop_merged ) );
		$mobile_deduped = $this->drop_rules_matching_baseline( $mobile_merged, array( $desktop_merged, $tablet_merged ) );

		$css  = $this->object_to_css_string( $desktop_merged );
		$css .= $this->wrap_in_media_query( $this->object_to_css_string( $tablet_deduped ), Breakpoints::TABLET );
		$css .= $this->wrap_in_media_query( $this->object_to_css_string( $mobile_deduped ), Breakpoints::MOBILE );

		return $css;
	}

	/**
	 * Dynamic navigation CSS for frontend render (scoped to block root id).
	 *
	 * @param string $dom_id Block wrapper id.
	 * @return string
	 */
	private function render_navigation_dynamic_css( string $dom_id ): string {
		$nbo = $this->get_navigation_options();
		if ( empty( $dom_id ) ) {
			return '';
		}

		$get_device_value = static function ( $arr, string $device, $fallback ) {
			if ( ! is_array( $arr ) ) {
				return $fallback;
			}
			if ( array_key_exists( $device, $arr ) ) {
				return $arr[ $device ];
			}
			if ( array_key_exists( 'Desktop', $arr ) ) {
				return $arr['Desktop'];
			}
			return $fallback;
		};

		// Vars on the block root so stage padding / arrow offsets inherit size.
		$selector = '#' . $dom_id;

		$build_spacing_value = static function ( $spacing, string $device ) use ( $get_device_value ) {
			if ( ! is_array( $spacing ) || empty( $spacing['device'][ $device ] ) || ! is_array( $spacing['device'][ $device ] ) ) {
				return '';
			}
			$unit_raw = $spacing['unit'] ?? 'px';
			$unit     = is_array( $unit_raw ) ? (string) $get_device_value( $unit_raw, $device, 'px' ) : (string) $unit_raw;
			$unit     = in_array( strtolower( $unit ), array( 'px', 'em', '%' ), true ) ? strtolower( $unit ) : 'px';
			$vals     = $spacing['device'][ $device ];
			$top      = (float) ( $vals['top'] ?? 0 );
			$right    = (float) ( $vals['right'] ?? 0 );
			$bottom   = (float) ( $vals['bottom'] ?? 0 );
			$left     = (float) ( $vals['left'] ?? 0 );
			return $top . $unit . ' ' . $right . $unit . ' ' . $bottom . $unit . ' ' . $left . $unit;
		};

		$sanitize_length_unit = static function ( $unit ): string {
			$unit = strtolower( (string) $unit );
			return in_array( $unit, array( 'px', 'em', '%' ), true ) ? $unit : 'px';
		};

		$get_offset_value = static function ( $value ) use ( $sanitize_length_unit ): array {
			if ( is_array( $value ) ) {
				$offset = max( -200, min( 200, (float) ( $value['value'] ?? 0 ) ) );
				$unit   = $sanitize_length_unit( $value['unit'] ?? 'px' );
				return array(
					'value' => $offset,
					'unit'  => $unit,
				);
			}

			return array(
				'value' => max( -200, min( 200, (float) $value ) ),
				'unit'  => 'px',
			);
		};

		$format_offset = static function ( array $offset ): string {
			return (float) ( $offset['value'] ?? 0 ) . (string) ( $offset['unit'] ?? 'px' );
		};

		// How far each side arrow is shifted off the stage edge, as a share of its
		// own button box. A percentage in `translate` resolves against the element
		// it sits on, so the browser measures the button and the arrow size never
		// enters the geometry. "Sides Center" straddles the edge; "Sides Outer"
		// clears the stage on desktop and falls back to straddling at tablet/mobile.
		// Must match navigationDynamicCss.js byte-for-byte (css-parity).
		$get_nav_straddle = static function ( string $position, string $device ): ?string {
			if ( 'nav-vertical-center' === $position ) {
				return '50%';
			}
			if ( 'nav-vertically-inner-and-outer' === $position ) {
				return 'Desktop' === $device ? '100%' : '50%';
			}
			return null;
		};

		$pos_raw                = AllowedValues::nav_position( $nbo['position'] ?? '', $this->default_nav_position() );
		$vertical_nav_positions = array(
			'nav-vertical-center-inner',
			'nav-vertically-inner-and-outer',
			'nav-vertical-center',
		);
		$is_vertical_nav        = in_array( $pos_raw, $vertical_nav_positions, true );
		$offset_x               = $get_offset_value( $nbo['offsetX'] ?? 0 );
		$offset_y               = $get_offset_value( $nbo['offsetY'] ?? 0 );
		$gap_px                 = isset( $nbo['gapBetweenArrows'] ) ? (float) $nbo['gapBetweenArrows'] : 10.0;
		$gap_px                 = max( 0, min( 200, $gap_px ) );

		// Mirror the editor: Offset X has no direction on the centered preset and
		// is single-direction on the two straddling presets, so neutralize/clamp it
		// here so the frontend var matches the editor preview rule-for-rule.
		$offset_x_hidden_positions        = array( 'nav-vertical-center' );
		$offset_x_positive_only_positions = array( 'nav-vertical-center-inner', 'nav-vertically-inner-and-outer' );
		if ( in_array( $pos_raw, $offset_x_hidden_positions, true ) ) {
			$offset_x['value'] = 0.0;
		} elseif ( in_array( $pos_raw, $offset_x_positive_only_positions, true ) ) {
			$offset_x['value'] = max( 0.0, (float) $offset_x['value'] );
		}

		// Box-shadow is device-agnostic, so resolve it once here in instance scope
		// (the per-device $build_vars closure below is static and can't reach
		// $this). Emit only when the state's toggle is on; hover falls back to the
		// normal shadow via the static CSS fallback in style.scss.
		$box_shadow_normal = ! empty( $nbo['boxShadowNormal']['isActive'] )
			? $this->get_box_shadow_value( $nbo['boxShadowNormal'] ?? array() )
			: '';
		$box_shadow_hover  = ! empty( $nbo['boxShadowHover']['isActive'] )
			? $this->get_box_shadow_value( $nbo['boxShadowHover'] ?? array() )
			: '';

		$build_vars = static function ( string $device ) use ( $nbo, $get_device_value, $build_spacing_value, $is_vertical_nav, $gap_px, $offset_x, $offset_y, $format_offset, $box_shadow_normal, $box_shadow_hover, $pos_raw, $get_nav_straddle ) {
			$vars                = array();
			$arrow_size_fallback = 'Mobile' === $device ? 14 : 16;
			$size                = isset( $nbo['arrowSize']['device'] ) ? (float) $get_device_value( $nbo['arrowSize']['device'], $device, $arrow_size_fallback ) : (float) $arrow_size_fallback;
			$unit                = isset( $nbo['arrowSize']['unit'] ) ? strtolower( (string) $get_device_value( $nbo['arrowSize']['unit'], $device, 'px' ) ) : 'px';
			if ( ! in_array( $unit, array( 'px', 'em', '%' ), true ) ) {
				$unit = 'px';
			}
			// Bounded identically in navigationDynamicCss.js. Clamping on one side
			// only is what made an em value render at two different sizes.
			$size = max( 0.0, min( 200.0, $size ) );

			// A px resolution of the arrow size, for the vertical-nav rules that
			// reserve room beside the stage — a margin or an offset in em/% would
			// resolve against the wrong box there. 1em is taken as 16px; a
			// percentage is read as a share of the device fallback.
			if ( 'em' === $unit ) {
				$size_px = $size * 16;
			} elseif ( '%' === $unit ) {
				$size_px = ( $size / 100 ) * $arrow_size_fallback;
			} else {
				$size_px = $size;
			}

			$vars['--wpcp-nav-arrow-size']  = $size . $unit;
			$vars['--wpcp-nav-arrow-space'] = $size_px . 'px';
			if ( ! $is_vertical_nav && $gap_px > 0 ) {
				$vars['--wpcp-nav-gap'] = $gap_px . 'px';
			}
			if ( 0.0 !== (float) $offset_x['value'] ) {
				$vars['--wpcp-nav-offset-x'] = $format_offset( $offset_x );
			}
			if ( 0.0 !== (float) $offset_y['value'] ) {
				$vars['--wpcp-nav-offset-y'] = $format_offset( $offset_y );
			}

			$straddle = $get_nav_straddle( $pos_raw, $device );
			if ( null !== $straddle ) {
				$vars['--wpcp-nav-straddle'] = $straddle;
			}

			$color_normal = Css_Helpers::sanitize_color( $nbo['colorNormal'] ?? '' );
			$color_hover  = Css_Helpers::sanitize_color( $nbo['colorHover'] ?? '' );
			$bg_normal    = Css_Helpers::sanitize_color( $nbo['bgNormal'] ?? '' );
			$bg_hover     = Css_Helpers::sanitize_color( $nbo['bgHover'] ?? '' );
			if ( '' !== $color_normal ) {
				$vars['--wpcp-nav-color'] = $color_normal;
			}
			if ( '' !== $color_hover ) {
				$vars['--wpcp-nav-hover-color'] = $color_hover;
			}
			if ( '' !== $bg_normal && 'transparent' !== strtolower( $bg_normal ) ) {
				$vars['--wpcp-nav-bg'] = $bg_normal;
			}
			if ( '' !== $bg_hover && 'transparent' !== strtolower( $bg_hover ) ) {
				$vars['--wpcp-nav-hover-bg'] = $bg_hover;
			}

			// Border style + width are shared across normal/hover; only the color differs per state.
			// Allow-list the style keyword — sanitize_text_field keeps `;`/`{`/`}`, so a
			// raw value could inject extra declarations into the inline nav CSS.
			$border_style_raw                = strtolower( trim( (string) ( $nbo['borderNormal']['style'] ?? 'solid' ) ) );
			$border_style_n                  = in_array(
				$border_style_raw,
				array( 'none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset' ),
				true
			) ? $border_style_raw : 'solid';
			$border_color_n                  = Css_Helpers::sanitize_color( $nbo['borderNormal']['color'] ?? '' );
			$border_color_h                  = Css_Helpers::sanitize_color( $nbo['borderHover']['color'] ?? '' );
			$vars['--wpcp-nav-border-style'] = '' !== $border_style_n ? $border_style_n : 'solid';
			if ( '' !== $border_color_n ) {
				$vars['--wpcp-nav-border-color'] = $border_color_n;
			}
			if ( '' !== $border_color_h ) {
				$vars['--wpcp-nav-hover-border-color'] = $border_color_h;
			}

			$border_width_normal             = (float) ( $nbo['borderWidthNormal']['value']['top'] ?? 1 );
			$border_width_normal_unit        = strtolower( (string) ( $nbo['borderWidthNormal']['unit'] ?? 'px' ) );
			$border_width_normal_unit        = in_array( $border_width_normal_unit, array( 'px', 'em', '%' ), true ) ? $border_width_normal_unit : 'px';
			$vars['--wpcp-nav-border-width'] = $border_width_normal . $border_width_normal_unit;

			if ( '' !== $box_shadow_normal ) {
				$vars['--wpcp-nav-box-shadow'] = $box_shadow_normal;
			}
			if ( '' !== $box_shadow_hover ) {
				$vars['--wpcp-nav-hover-box-shadow'] = $box_shadow_hover;
			}

			$radius = $build_spacing_value( $nbo['borderRadius'] ?? array(), $device );
			if ( '' !== $radius ) {
				$vars['--wpcp-nav-border-radius'] = $radius;
			}
			$padding = $build_spacing_value( $nbo['padding'] ?? array(), $device );
			if ( '' !== $padding ) {
				$vars['--wpcp-nav-padding'] = $padding;
			}

			return $vars;
		};

		$device_rules = static function ( string $device ) use ( $selector, $build_vars ) {
			return array(
				array(
					'selector' => $selector,
					'styles'   => $build_vars( $device ),
				),
			);
		};

		// Declare each var once: a Tablet/Mobile value equal to the wider-breakpoint
		// cascade is a no-op, so only emit the device-specific deltas.
		$desktop_merged = $this->merge_css_rules_by_selector( $device_rules( 'Desktop' ) );
		$tablet_merged  = $this->merge_css_rules_by_selector( $device_rules( 'Tablet' ) );
		$mobile_merged  = $this->merge_css_rules_by_selector( $device_rules( 'Mobile' ) );

		$tablet_deduped = $this->drop_rules_matching_baseline( $tablet_merged, array( $desktop_merged ) );
		$mobile_deduped = $this->drop_rules_matching_baseline( $mobile_merged, array( $desktop_merged, $tablet_merged ) );

		$css  = $this->object_to_css_string( $desktop_merged );
		$css .= $this->wrap_in_media_query( $this->object_to_css_string( $tablet_deduped ), Breakpoints::TABLET );
		$css .= $this->wrap_in_media_query( $this->object_to_css_string( $mobile_deduped ), Breakpoints::MOBILE );

		return $css;
	}
}
