<?php
/**
 * Global lightbox icon markup, CSS, and block override detection.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Lightbox;

use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules\Lightbox_Settings;
use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;
use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Item_Text;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Breakpoints;

defined( 'ABSPATH' ) || exit;

/**
 * Lightbox_Icon_Helper class.
 */
class Lightbox_Icon_Helper {


	/**
	 * Tracks block icon style CSS already printed per scope id.
	 *
	 * @var array<string, bool>
	 */
	private static $block_icon_css_scopes = array();

	/**
	 * Whether global icon dynamic CSS was emitted for this request.
	 *
	 * @var bool
	 */
	private static $global_icon_css_printed = false;

	/**
	 * Tracks block scopes that already queued overlay global-icon CSS.
	 *
	 * @var array<string, bool>
	 */
	private static $overlay_global_css_scopes = array();

	/**
	 * Fallback CSS when the target stylesheet was already printed.
	 *
	 * @var string
	 */
	private static $footer_css_queue = '';

	/**
	 * Whether the wp_footer fallback hook is registered.
	 *
	 * @var bool
	 */
	private static $footer_css_hook_registered = false;

	/**
	 * Whether icon CSS is being captured for inline output instead of enqueued.
	 *
	 * @var bool
	 */
	private static $capturing_icon_css = false;

	/**
	 * Stylesheet handle for block-scoped icon CSS when the extension stylesheet is unavailable.
	 */
	const ICON_CSS_FALLBACK_HANDLE = 'wpcpf-blocks-base-style';

	/**
	 * Block default icon name.
	 */
	const BLOCK_DEFAULT_ICON = 'search';

	/**
	 * Block default icon position.
	 */
	const BLOCK_DEFAULT_POSITION = 'top-right';

	/**
	 * Block default icon visibility.
	 */
	const BLOCK_DEFAULT_VISIBLE = 'hover';

	/**
	 * Normalize a block wrapper id for HTML id attributes and scoped CSS selectors.
	 *
	 * @param mixed $raw Raw uniqueId attribute.
	 * @return string
	 */
	public static function normalize_scope_id( $raw ) {
		return sanitize_html_class( (string) $raw );
	}

	/**
	 * Read clickActionOptions from block attributes.
	 *
	 * @param array<string, mixed> $attrs Block attributes.
	 * @return array<string, mixed>
	 */
	private static function get_click_options( array $attrs ) {
		if ( isset( $attrs['clickActionOptions'] ) && is_array( $attrs['clickActionOptions'] ) ) {
			return $attrs['clickActionOptions'];
		}
		return array();
	}

	/**
	 * Map WPCP clickActionOptions to the legacy icon attribute shape used internally.
	 *
	 * @param array<string, mixed> $attrs Block attributes.
	 * @return array<string, mixed>
	 */
	private static function extract_icon_context( array $attrs ) {
		if ( ! isset( $attrs['clickActionOptions'] ) || ! is_array( $attrs['clickActionOptions'] ) ) {
			return $attrs;
		}

		$click     = $attrs['clickActionOptions'];
		$icon_type = isset( $click['lightboxIconType'] ) ? sanitize_key( (string) $click['lightboxIconType'] ) : 'library';
		$custom    = isset( $click['lightboxCustomIcon'] ) && is_array( $click['lightboxCustomIcon'] )
			? $click['lightboxCustomIcon']
			: array();
		$type      = isset( $click['type'] ) ? sanitize_key( (string) $click['type'] ) : 'lightbox';

		return array_merge(
			$attrs,
			array(
				'lightBoxClickAction'  => 'lightbox' === $type ? 'icon' : 'full-image',
				'lightBoxIcon'         => array(
					'source'   => 'custom' === $icon_type ? 'custom' : 'icon',
					'iconName' => ! empty( $click['lightboxIcon'] ) ? sanitize_key( (string) $click['lightboxIcon'] ) : self::BLOCK_DEFAULT_ICON,
					'image'    => array(
						'id'  => isset( $custom['id'] ) ? absint( $custom['id'] ) : 0,
						'url' => isset( $custom['url'] ) ? esc_url_raw( (string) $custom['url'] ) : '',
						'alt' => isset( $custom['alt'] ) ? sanitize_text_field( (string) $custom['alt'] ) : '',
					),
				),
				'lightBoxIconPosition' => self::normalize_overlay_position( $click['lightboxIconPosition'] ?? self::BLOCK_DEFAULT_POSITION ),
				'lightBoxIconVisible'  => 'hover',
				'lightBoxIconSize'     => isset( $click['lightboxIconSize'] ) && is_array( $click['lightboxIconSize'] ) ? $click['lightboxIconSize'] : array(),
				'lightBoxIconOffset'   => isset( $click['lightboxIconOffset'] ) && is_array( $click['lightboxIconOffset'] ) ? $click['lightboxIconOffset'] : array(),
			)
		);
	}

	/**
	 * Normalize overlay matrix position to a single slug.
	 *
	 * @param mixed $raw Raw position value.
	 * @return string
	 */
	private static function normalize_overlay_position( $raw ) {
		$position = sanitize_key( (string) $raw );
		if ( 'center' === $position || 'center-center' === $position || '' === $position ) {
			return 'center';
		}
		return self::sanitize_block_position( $position );
	}

	/**
	 * Map a dashboard global icon position to an overlay CSS anchor slug.
	 *
	 * Mirrors `mapGlobalPositionToOverlaySlug()` in `lightboxIconResolve.js`.
	 *
	 * @param mixed $global_position Global iconDisplayPosition value.
	 * @return string Slug for `.wpcp-overlay-pos-*`.
	 */
	public static function map_global_position_to_overlay_slug( $global_position ) {
		$map = array(
			'top-left'     => 'top-left',
			'top-right'    => 'top-right',
			'center'       => 'center-center',
			'bottom-left'  => 'bottom-left',
			'bottom-right' => 'bottom-right',
		);

		return $map[ sanitize_key( (string) $global_position ) ] ?? 'top-right';
	}

	/**
	 * Overlay wrapper class mirroring the global `iconVisible` setting.
	 *
	 * Mirrors `overlayIconsVisibilityClass()` in `lightboxIconResolve.js`.
	 *
	 * @param string $visibility `always` or `hover`.
	 * @return string Modifier class, or '' when unknown.
	 */
	public static function overlay_icons_visibility_class( $visibility ) {
		$visibility = sanitize_key( (string) $visibility );
		if ( 'always' === $visibility || 'hover' === $visibility ) {
			return 'wpcp-overlay-icons-visible-' . $visibility;
		}
		return '';
	}

	/**
	 * Resolve overlay lightbox icon presentation: the global module wins when active.
	 *
	 * Frontend counterpart to `resolveOverlayLightboxIcon()` in `lightboxIconResolve.js`.
	 *
	 * @param array<string, mixed> $click_options Block clickActionOptions.
	 * @return array<string, mixed> Icon type, name, custom image, position slug, visibility.
	 */
	public static function resolve_overlay_lightbox_icon( array $click_options ) {
		if ( Lightbox_Frontend::is_lightbox_active() ) {
			$settings = Lightbox_Settings::get_settings();
			$icon     = isset( $settings['lightboxIcon'] ) && is_array( $settings['lightboxIcon'] )
				? $settings['lightboxIcon']
				: Lightbox_Settings::get_defaults()['lightboxIcon'];

			return array(
				'source'      => 'global',
				'icon_type'   => 'custom' === ( $icon['source'] ?? 'icon' ) ? 'custom' : 'library',
				'icon_name'   => ! empty( $icon['iconName'] ) ? sanitize_key( (string) $icon['iconName'] ) : self::BLOCK_DEFAULT_ICON,
				'custom_icon' => isset( $icon['image'] ) && is_array( $icon['image'] ) ? $icon['image'] : array(),
				'position'    => self::map_global_position_to_overlay_slug( $settings['iconDisplayPosition'] ?? 'top-right' ),
				'visibility'  => self::sanitize_visibility( $settings['iconVisible'] ?? 'hover' ),
			);
		}

		$custom_icon = isset( $click_options['lightboxCustomIcon'] ) && is_array( $click_options['lightboxCustomIcon'] )
			? $click_options['lightboxCustomIcon']
			: array();

		return array(
			'source'      => 'block',
			'icon_type'   => 'custom' === ( $click_options['lightboxIconType'] ?? 'library' ) ? 'custom' : 'library',
			'icon_name'   => ! empty( $click_options['lightboxIcon'] ) ? (string) $click_options['lightboxIcon'] : self::BLOCK_DEFAULT_ICON,
			'custom_icon' => $custom_icon,
			'position'    => $click_options['lightboxIconPosition'] ?? '',
			'visibility'  => '',
		);
	}

	/**
	 * Render inner icon markup from a lightbox icon attribute bag.
	 *
	 * @param array<string, mixed> $icon Icon settings.
	 * @return string
	 */
	public static function render_icon_markup( $icon ) {
		if ( ! is_array( $icon ) ) {
			return '';
		}

		$source = isset( $icon['source'] ) && 'custom' === $icon['source'] ? 'custom' : 'icon';

		static $icon_list = null;

		if ( 'icon' === $source && ! empty( $icon['iconName'] ) ) {
			if ( null === $icon_list ) {
				$icon_file = defined( 'WPCAROUSELF_PATH' )
					? WPCAROUSELF_PATH . 'src/Blocks/icons/icon-list.php'
					: '';
				$icon_list = ( '' !== $icon_file && file_exists( $icon_file ) ) ? require $icon_file : array();
				if ( ! is_array( $icon_list ) ) {
					$icon_list = array();
				}
			}

			$icon_name = sanitize_key( (string) $icon['iconName'] );
			$icon_data = $icon_list[ $icon_name ] ?? null;

			if ( is_array( $icon_data ) && ( ! empty( $icon_data['path'] ) || ! empty( $icon_data['paths'] ) ) ) {
				if ( isset( $icon_data['render'] ) && 'stroke' === $icon_data['render'] ) {
					$stroke_width = isset( $icon_data['stroke_width'] ) ? (float) $icon_data['stroke_width'] : 1.75;
					return sprintf(
						'<span class="wpcp-icon-container"><svg viewBox="%1$s" fill="none" stroke="currentColor" stroke-width="%2$s" stroke-linecap="round" stroke-linejoin="round"><path d="%3$s" /></svg></span>',
						esc_attr( $icon_data['viewBox'] ?? '0 0 24 24' ),
						esc_attr( (string) $stroke_width ),
						esc_attr( (string) $icon_data['path'] )
					);
				}

				return sprintf(
					'<span class="wpcp-icon-container"><svg viewBox="%1$s">%2$s</svg></span>',
					esc_attr( $icon_data['viewBox'] ?? '0 0 24 24' ),
					self::build_icon_paths_html( $icon_data )
				);
			}
		}

		if ( 'custom' === $source && ! empty( $icon['image']['url'] ) ) {
			return sprintf(
				'<span class="wpcp-icon-container"><img src="%1$s" alt="%2$s" /></span>',
				esc_url( (string) $icon['image']['url'] ),
				esc_attr( isset( $icon['image']['alt'] ) ? (string) $icon['image']['alt'] : '' )
			);
		}

		return '';
	}

	/**
	 * Build the inner `<path>` markup for an icon-list entry.
	 *
	 * Supports single `path` strings and multi-path `paths` arrays
	 * ( each `{ d, fill_rule }` ), plus an icon-level `fill_rule`. Curated grid
	 * icons (lightbox / link) need this for multi-path glyphs and evenodd holes.
	 *
	 * @param array<string, mixed> $icon_data Icon-list entry.
	 * @return string Concatenated `<path>` elements (escaped).
	 */
	public static function build_icon_paths_html( array $icon_data ) {
		$icon_fill_rule = isset( $icon_data['fill_rule'] ) ? (string) $icon_data['fill_rule'] : '';

		$paths = array();
		if ( ! empty( $icon_data['paths'] ) && is_array( $icon_data['paths'] ) ) {
			$paths = $icon_data['paths'];
		} elseif ( ! empty( $icon_data['path'] ) ) {
			$paths = array(
				array(
					'd'         => (string) $icon_data['path'],
					'fill_rule' => $icon_fill_rule,
				),
			);
		}

		$html = '';
		foreach ( $paths as $part ) {
			if ( ! is_array( $part ) || empty( $part['d'] ) ) {
				continue;
			}
			$path_fill_rule = isset( $part['fill_rule'] ) && '' !== $part['fill_rule']
				? (string) $part['fill_rule']
				: $icon_fill_rule;
			$fill_rule_attr = '' !== $path_fill_rule
				? sprintf( ' fill-rule="%s"', esc_attr( $path_fill_rule ) )
				: '';
			$html          .= sprintf( '<path d="%1$s"%2$s />', esc_attr( (string) $part['d'] ), $fill_rule_attr );
		}

		return $html;
	}

	/**
	 * Sanitize one or more space-separated extra class names for icon markup.
	 *
	 * @param string $extra_raw Extra classes from resolved icon settings.
	 * @return string
	 */
	private static function sanitize_icon_extra_classes( $extra_raw ) {
		$parts = preg_split( '/\s+/', trim( (string) $extra_raw ) );
		if ( ! is_array( $parts ) ) {
			return '';
		}

		$classes = array();
		foreach ( $parts as $part ) {
			if ( '' === $part ) {
				continue;
			}
			$class = sanitize_html_class( $part );
			if ( '' !== $class ) {
				$classes[] = $class;
			}
		}

		return implode( ' ', array_unique( $classes ) );
	}

	/**
	 * Whether block-level icon settings should override global extension settings.
	 *
	 * @param array<string, mixed> $attrs Block attributes (or gallery context subset).
	 * @return bool
	 */
	public static function block_icon_is_customized( array $attrs ) {
		$attrs  = self::extract_icon_context( $attrs );
		$action = isset( $attrs['lightBoxClickAction'] ) ? sanitize_key( (string) $attrs['lightBoxClickAction'] ) : 'full-image';
		if ( 'icon' !== $action ) {
			return false;
		}

		$icon = isset( $attrs['lightBoxIcon'] ) && is_array( $attrs['lightBoxIcon'] )
			? $attrs['lightBoxIcon']
			: array();

		if ( ( $icon['source'] ?? 'icon' ) === 'custom' && ! empty( $icon['image']['url'] ) ) {
			return true;
		}

		$icon_name = ! empty( $icon['iconName'] ) ? sanitize_key( (string) $icon['iconName'] ) : self::BLOCK_DEFAULT_ICON;
		if ( self::BLOCK_DEFAULT_ICON !== $icon_name ) {
			return true;
		}

		$position = isset( $attrs['lightBoxIconPosition'] ) ? sanitize_key( (string) $attrs['lightBoxIconPosition'] ) : self::BLOCK_DEFAULT_POSITION;
		if ( self::BLOCK_DEFAULT_POSITION !== $position ) {
			return true;
		}

		$visible = isset( $attrs['lightBoxIconVisible'] ) ? sanitize_key( (string) $attrs['lightBoxIconVisible'] ) : self::BLOCK_DEFAULT_VISIBLE;
		if ( self::BLOCK_DEFAULT_VISIBLE !== $visible ) {
			return true;
		}

		return false;
	}

	/**
	 * Whether block-level icon position differs from the block default (center).
	 *
	 * @param array<string, mixed> $attrs Block attributes (or gallery context subset).
	 * @return bool
	 */
	public static function block_icon_position_is_customized( array $attrs ) {
		$attrs = self::extract_icon_context( $attrs );
		if ( 'icon' !== ( $attrs['lightBoxClickAction'] ?? 'full-image' ) ) {
			return false;
		}

		$position = isset( $attrs['lightBoxIconPosition'] ) ? sanitize_key( (string) $attrs['lightBoxIconPosition'] ) : self::BLOCK_DEFAULT_POSITION;

		return self::BLOCK_DEFAULT_POSITION !== $position;
	}

	/**
	 * Resolve icon settings for a block trigger (block wins when customized).
	 *
	 * @param array<string, mixed> $block_attrs Block attributes.
	 * @param array<string, mixed> $settings    Global lightbox settings.
	 * @return array<string, mixed>
	 */
	public static function resolve_block_icon( array $block_attrs, array $settings ) {
		$block_attrs      = self::extract_icon_context( $block_attrs );
		$extension_active = Lightbox_Frontend::is_lightbox_active();

		if ( $extension_active && ( ! is_array( $settings ) || empty( $settings ) ) ) {
			$settings = Lightbox_Settings::get_settings();
		}

		$use_global = $extension_active
			&& 'icon' === ( $block_attrs['lightBoxClickAction'] ?? 'full-image' );

		if ( $use_global ) {
			return self::resolve_global_icon( $settings );
		}

		$icon = isset( $block_attrs['lightBoxIcon'] ) && is_array( $block_attrs['lightBoxIcon'] )
			? $block_attrs['lightBoxIcon']
			: array();

		$style_customized = self::block_icon_style_is_customized( $block_attrs );
		$inline_parts     = array();

		if ( $style_customized ) {
			$size_css = self::resolve_block_icon_size_css( $block_attrs, $settings, true, $extension_active );
			if ( '' !== $size_css ) {
				$inline_parts['--icon-size'] = $size_css;
			}
		} elseif ( $extension_active ) {
			$global       = self::resolve_global_icon( $settings );
			$inline_parts = self::parse_inline_style_parts( $global['inline_style'] ?? '' );
			$legacy_size  = self::resolve_block_icon_size_css( $block_attrs, $settings, false, $extension_active );
			if ( '' !== $legacy_size && self::icon_size_differs_from_default( $block_attrs['lightBoxIconSize'] ?? null ) ) {
				$inline_parts['--icon-size'] = $legacy_size;
			}
		} else {
			$size_css = self::resolve_block_icon_size_css( $block_attrs, $settings, false, false );
			if ( '' !== $size_css ) {
				$inline_parts['--icon-size'] = $size_css;
			}
		}

		$resolved = array(
			'source'       => 'block',
			'icon'         => $icon,
			'position'     => self::sanitize_block_position( $block_attrs['lightBoxIconPosition'] ?? 'center' ),
			'visibility'   => self::sanitize_visibility( $block_attrs['lightBoxIconVisible'] ?? 'hover' ),
			'inline_style' => self::inline_style_from_parts( $inline_parts ),
			'extra_class'  => 'wpcp-lightbox-icon--block',
		);

		if ( $style_customized ) {
			$resolved['icon_preset'] = self::get_block_icon_style_preset( $block_attrs );
			$fallback_style          = $extension_active
				? ( self::resolve_global_icon( $settings )['icon_style'] ?? array() )
				: self::get_block_default_icon_style();
			$resolved['icon_style']  = self::get_effective_block_icon_style_config( $block_attrs, $fallback_style, true );
			if ( empty( $resolved['icon_style'] ) && self::icon_size_differs_from_default( $block_attrs['lightBoxIconSize'] ?? null ) ) {
				$resolved['icon_style'] = array(
					'size' => is_array( $block_attrs['lightBoxIconSize'] ) ? $block_attrs['lightBoxIconSize'] : array(),
				);
			}
		} elseif ( $extension_active ) {
			$global                  = self::resolve_global_icon( $settings );
			$resolved['icon_preset'] = $global['icon_preset'] ?? 'default';
			$resolved['icon_style']  = $global['icon_style'] ?? array();
			$resolved['extra_class'] = 'wpcp-lightbox-icon--block wpcp-lightbox-icon--uses-global-style';
		} else {
			$resolved['icon_preset'] = 'default';
			$resolved['icon_style']  = self::get_block_default_icon_style();
		}

		if ( $extension_active && ! self::block_icon_position_is_customized( $block_attrs ) ) {
			$resolved['position'] = self::resolve_global_icon( $settings )['position'];
		}

		return $resolved;
	}

	/**
	 * Whether block-level icon style (preset or style panel) overrides the extension.
	 *
	 * @param array<string, mixed> $attrs Block attributes.
	 * @return bool
	 */
	public static function block_icon_style_is_customized( array $attrs ) {
		$attrs  = self::extract_icon_context( $attrs );
		$config = isset( $attrs['lightBoxIconStyleConfig'] ) && is_array( $attrs['lightBoxIconStyleConfig'] )
			? $attrs['lightBoxIconStyleConfig']
			: array();

		if ( self::icon_style_config_has_values( $config ) ) {
			return true;
		}

		// Legacy blocks that only set the removed lightBoxIconSize control.
		return self::icon_size_differs_from_default( $attrs['lightBoxIconSize'] ?? null );
	}

	/**
	 * Queue dynamic lightbox icon CSS on a registered stylesheet (no inline HTML or element styles).
	 *
	 * @param string               $scope_id    Unique block wrapper id (without #).
	 * @param array<string, mixed> $resolved    Resolved icon from resolve_block_icon().
	 * @param array<string, mixed> $block_attrs Optional block attributes for override detection.
	 * @return string Always empty (CSS is enqueued, not printed in block markup).
	 */
	public static function render_block_icon_style_markup( $scope_id, array $resolved, array $block_attrs = array() ) {
		$scope_id = self::normalize_scope_id( $scope_id );
		if ( '' === $scope_id ) {
			return '';
		}

		$chunks             = array();
		$extension_active   = Lightbox_Frontend::is_lightbox_active();
		$needs_scoped_css   = self::resolved_needs_scoped_icon_css( $resolved, $block_attrs );
		$scope_already_done = isset( self::$block_icon_css_scopes[ $scope_id ] );

		if ( $extension_active && ! self::$global_icon_css_printed ) {
			$global_css = self::build_global_icon_css();
			if ( '' !== $global_css ) {
				$chunks[]                      = $global_css;
				self::$global_icon_css_printed = true;
			}
		}

		if ( ! $scope_already_done && $needs_scoped_css ) {
			$scoped = self::build_block_icon_css( $scope_id, $resolved );
			if ( '' !== $scoped ) {
				self::$block_icon_css_scopes[ $scope_id ] = true;
				$chunks[]                                 = $scoped;
			}
		}

		if ( ! empty( $chunks ) ) {
			self::queue_icon_dynamic_css( implode( "\n", $chunks ) );
		}

		return '';
	}

	/**
	 * Enqueue the per-block icon style CSS.
	 *
	 * @deprecated Use render_block_icon_style_markup() — wp_enqueue during render is too late for wp_head.
	 *
	 * @param string               $scope_id Unique block wrapper id (without #).
	 * @param array<string, mixed> $resolved Resolved icon from resolve_block_icon().
	 * @return void
	 */
	public static function maybe_enqueue_block_icon_style_css( $scope_id, array $resolved ) {
		// Kept for backward compatibility; frontend output uses inline markup instead.
		self::render_block_icon_style_markup( $scope_id, $resolved );
	}

	/**
	 * Whether resolved icon settings need block-scoped CSS (not covered by global rules).
	 *
	 * @param array<string, mixed> $resolved    Resolved icon.
	 * @param array<string, mixed> $block_attrs Block attributes.
	 * @return bool
	 */
	private static function resolved_needs_scoped_icon_css( array $resolved, array $block_attrs = array() ) {
		if ( empty( $resolved['icon_style'] ) || ! is_array( $resolved['icon_style'] ) ) {
			return false;
		}

		// Global extension off: block lightbox must ship scoped CSS (no shared global stylesheet rules).
		if ( ! Lightbox_Frontend::is_lightbox_active() ) {
			return true;
		}

		if ( ! empty( $block_attrs ) && self::block_icon_style_is_customized( $block_attrs ) ) {
			return true;
		}

		$extra = (string) ( $resolved['extra_class'] ?? '' );
		if ( false !== strpos( $extra, 'uses-global-style' ) ) {
			return false;
		}

		if ( 'global' === ( $resolved['source'] ?? '' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Attach global icon CSS to the extension stylesheet when enqueue still runs in time.
	 *
	 * @return void
	 */
	private static function try_attach_global_icon_css_to_extension_style() {
		// Global rules are queued via render_block_icon_style_markup() / queue_icon_dynamic_css().
	}

	/**
	 * Resolve stylesheet handle for queued icon CSS.
	 *
	 * @return string
	 */
	private static function get_icon_css_style_handle() {
		if ( Lightbox_Frontend::is_lightbox_active() && wp_style_is( 'wpcpf-blocks-lightbox-extension', 'registered' ) ) {
			return 'wpcpf-blocks-lightbox-extension';
		}

		return self::ICON_CSS_FALLBACK_HANDLE;
	}

	/**
	 * Enqueue the target stylesheet once per request.
	 *
	 * @param string $handle Style handle.
	 * @return void
	 */
	private static function ensure_icon_css_style_enqueued( $handle ) {
		if ( ! function_exists( 'wp_enqueue_style' ) ) {
			return;
		}

		if ( wp_style_is( $handle, 'registered' ) ) {
			wp_enqueue_style( $handle );
		}
	}

	/**
	 * Append sanitized icon CSS to the stylesheet queue (footer fallback if already printed).
	 *
	 * @param string $css Raw CSS rules.
	 * @return void
	 */
	public static function queue_icon_dynamic_css( $css ) {
		$css = self::sanitize_dynamic_css( $css );
		if ( '' === $css || ! function_exists( 'wp_add_inline_style' ) ) {
			return;
		}

		// A capturing renderer has no style pipeline to attach to — buffer for it
		// to print inline. See capture_icon_css() / flush_captured_icon_css().
		if ( self::$capturing_icon_css ) {
			self::$footer_css_queue .= $css;
			return;
		}

		$handle = self::get_icon_css_style_handle();
		self::ensure_icon_css_style_enqueued( $handle );

		if ( wp_style_is( $handle, 'done' ) ) {
			self::$footer_css_queue .= $css;
			self::register_footer_css_hook();
			return;
		}

		wp_add_inline_style( $handle, $css );
	}

	/**
	 * Strip unsafe tokens from dynamic CSS before output.
	 *
	 * Repeats until the string stops changing. A single pass is not enough:
	 * removing one token splices its neighbours together, so `</st<!--yle>`
	 * would *become* `</style>` and break out of the element this is protecting.
	 * Every pass strictly shortens the string, so the loop always terminates.
	 *
	 * @param string $css Raw CSS.
	 * @return string
	 */
	public static function sanitize_dynamic_css( $css ) {
		$css = (string) $css;
		if ( '' === $css ) {
			return '';
		}

		do {
			$css = str_ireplace( array( '</style', '<script', '<!--' ), '', $css, $removed );
		} while ( $removed > 0 );

		return $css;
	}

	/**
	 * Register a single wp_footer hook for late icon CSS.
	 *
	 * @return void
	 */
	private static function register_footer_css_hook() {
		if ( self::$footer_css_hook_registered || ! function_exists( 'add_action' ) ) {
			return;
		}

		self::$footer_css_hook_registered = true;
		add_action( 'wp_footer', array( __CLASS__, 'print_footer_icon_css' ), 99 );
	}

	/**
	 * Print queued icon CSS when inline enqueue ran too late.
	 *
	 * @return void
	 */
	public static function print_footer_icon_css() {
		$css                    = self::sanitize_dynamic_css( self::$footer_css_queue );
		self::$footer_css_queue = '';

		if ( '' === $css ) {
			return;
		}

		printf(
			'<style id="wpcp-lb-icon-dynamic-css" type="text/css">%s</style>',
			$css // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- sanitized via sanitize_dynamic_css().
		);
	}

	/**
	 * Start capturing icon CSS for inline output instead of enqueueing it.
	 *
	 * For renderers whose output is not a WordPress page: a page-builder editor
	 * that re-renders one widget over AJAX receives HTML only, so neither
	 * `wp_add_inline_style()` nor the `wp_footer` fallback can deliver this CSS.
	 * Such a caller wraps its render in capture/flush and prints the result itself.
	 *
	 * @return void
	 */
	public static function capture_icon_css() {
		self::$capturing_icon_css = true;
	}

	/**
	 * Stop capturing and return the buffered icon CSS as a style element.
	 *
	 * @return string Style markup, or an empty string when nothing was captured.
	 */
	public static function flush_captured_icon_css() {
		self::$capturing_icon_css = false;

		$css                    = self::sanitize_dynamic_css( self::$footer_css_queue );
		self::$footer_css_queue = '';

		if ( '' === $css ) {
			return '';
		}

		return sprintf( '<style id="wpcp-lb-icon-dynamic-css" type="text/css">%s</style>', $css );
	}

	/**
	 * Whether global icon dynamic CSS was already output or queued for this request.
	 *
	 * @return bool
	 */
	public static function was_global_icon_css_emitted() {
		return self::$global_icon_css_printed;
	}

	/**
	 * Mark global icon CSS as handled (head enqueue or inline block output).
	 *
	 * @return void
	 */
	public static function mark_global_icon_css_emitted() {
		self::$global_icon_css_printed = true;
	}

	/**
	 * Queue global lightbox icon CSS once (WP core images / early render paths).
	 *
	 * @param array<string, mixed>|null $settings Optional settings.
	 * @return void
	 */
	public static function ensure_global_icon_css_queued( $settings = null ) {
		if ( self::$global_icon_css_printed || ! Lightbox_Frontend::is_lightbox_active() ) {
			return;
		}

		$css = self::build_global_icon_css( $settings );
		if ( '' === $css ) {
			return;
		}

		self::queue_icon_dynamic_css( $css );
		self::$global_icon_css_printed = true;
	}

	/**
	 * Build scoped CSS for block icon style overrides.
	 *
	 * @param string               $scope_id Block wrapper id.
	 * @param array<string, mixed> $resolved Resolved icon settings.
	 * @return string
	 */
	public static function build_block_icon_css( $scope_id, array $resolved ) {
		$scope_id = self::normalize_scope_id( $scope_id );
		if ( '' === $scope_id ) {
			return '';
		}

		$icon_style = isset( $resolved['icon_style'] ) && is_array( $resolved['icon_style'] )
			? $resolved['icon_style']
			: array();

		$padding_css = self::spacing_to_css( $icon_style['padding'] ?? null );
		$radius_css  = self::spacing_to_css( $icon_style['borderRadius'] ?? null );
		$selector    = self::build_icon_style_selector( $scope_id, $resolved );
		$size_box    = 'width:var(--icon-size,48px)!important;height:var(--icon-size,48px)!important;min-width:var(--icon-size,48px);min-height:var(--icon-size,48px);flex:none!important;box-sizing:border-box!important;';
		$vars_css    = self::build_icon_css_variables_declaration( $resolved );

		$rules   = array();
		$rules[] = $selector . '{pointer-events:auto;' . $vars_css . $size_box . 'border-radius:' . $radius_css . ';padding:' . $padding_css . ';transition:opacity .35s ease,color .35s ease,background-color .35s ease,border-color .35s ease,fill .35s ease;}';
		$rules[] = $selector . ' .wpcp-icon-container{display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-width:0;min-height:0;}';
		$rules[] = $selector . ' .wpcp-icon-container svg,' . $selector . ' .wpcp-icon-container img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;flex-shrink:0;}';

		$normal = isset( $icon_style['normal'] ) && is_array( $icon_style['normal'] ) ? $icon_style['normal'] : array();
		$hover  = isset( $icon_style['hover'] ) && is_array( $icon_style['hover'] ) ? $icon_style['hover'] : array();

		$rules[] = self::state_css( $selector, $normal, array(), true );
		$rules[] = self::state_css( $selector . ':hover', $hover, $normal, true );
		$rules   = array_merge( $rules, self::icon_svg_color_rules( $selector, $icon_style, true ) );

		$position = isset( $resolved['position'] ) ? sanitize_key( (string) $resolved['position'] ) : self::BLOCK_DEFAULT_POSITION;
		$offset   = self::resolve_icon_position_offset_css( $resolved );
		$pos_css  = self::icon_position_declarations( $position, $offset );
		if ( '' !== $pos_css ) {
			$rules[] = $selector . '{' . $pos_css . '}';
		}

		$icon_preset = isset( $resolved['icon_preset'] ) ? sanitize_key( (string) $resolved['icon_preset'] ) : 'default';
		if ( ! self::icon_style_has_surface_styles( $icon_style ) ) {
			if ( 'filled' === $icon_preset ) {
				$rules[] = $selector . '.wpcp-lb-icon-style-filled:not([style*="background"]){background-color:rgba(0,0,0,0.45);}';
			} elseif ( 'outlined' === $icon_preset ) {
				$rules[] = $selector . '.wpcp-lb-icon-style-outlined{border-width:2px;border-style:solid;border-color:currentColor;background-color:transparent;}';
			} elseif ( 'minimal' === $icon_preset ) {
				$rules[] = $selector . '.wpcp-lb-icon-style-minimal{background-color:transparent;border:none;}';
			}
		}

		return implode( "\n", array_filter( $rules ) );
	}

	/**
	 * Queue overlay-icon CSS that mirrors the global Lightbox Settings.
	 *
	 * Frontend counterpart to `overlayGlobalIconCss.js`. When the Click Action
	 * "Override Global Settings" toggle is OFF and the module is active, the
	 * block's overlay lightbox icon must look like the global icon. The static
	 * SCSS already reads the `--wpcp-*` variables below on `.wpcp-overlay-icons`
	 * and `.wpcp-overlay-icon.wpcp-lightbox-icon`; here we feed the global values
	 * into those variables, scoped one selector level deeper than the per-block
	 * token bag so they win by selector closeness. Queued once per block scope.
	 *
	 * @param string                    $scope_id Block wrapper id (without #).
	 * @param array<string, mixed>|null $settings Optional global settings.
	 * @return string Always empty (CSS is queued, not printed in markup).
	 */
	public static function render_overlay_global_icon_style_markup( $scope_id, $settings = null ) {
		$scope_id = self::normalize_scope_id( $scope_id );
		if ( '' === $scope_id || isset( self::$overlay_global_css_scopes[ $scope_id ] ) ) {
			return '';
		}
		if ( ! Lightbox_Frontend::is_lightbox_active() ) {
			return '';
		}
		if ( ! is_array( $settings ) ) {
			$settings = Lightbox_Settings::get_settings();
		}

		$css = self::build_overlay_global_icon_css( $scope_id, $settings );
		if ( '' === $css ) {
			return '';
		}

		self::$overlay_global_css_scopes[ $scope_id ] = true;
		self::queue_icon_dynamic_css( $css );
		return '';
	}

	/**
	 * Build scoped CSS mapping global lightbox settings to the overlay icon vars.
	 *
	 * @param string               $scope_id Block wrapper id (without #).
	 * @param array<string, mixed> $settings Global lightbox settings.
	 * @return string
	 */
	public static function build_overlay_global_icon_css( $scope_id, array $settings ) {
		$scope_id = self::normalize_scope_id( $scope_id );
		if ( '' === $scope_id ) {
			return '';
		}

		$icon_style  = isset( $settings['iconStyle'] ) && is_array( $settings['iconStyle'] ) ? $settings['iconStyle'] : array();
		$wrapper_sel = '#' . $scope_id . ' .wpcp-overlay-icons';
		$icon_sel    = '#' . $scope_id . ' .wpcp-overlay-icon.wpcp-lightbox-icon, #' . $scope_id . ' .wpcp-overlay-icon.wpcp-link-icon';

		$devices = array(
			'Desktop' => null,
			'Tablet'  => Breakpoints::TABLET,
			'Mobile'  => Breakpoints::MOBILE,
		);

		$rules            = array();
		$desktop_geometry = '';

		foreach ( $devices as $device => $max_width ) {
			$icon_decls = self::overlay_icon_var_decls( $settings, $icon_style, $device );

			if ( null === $max_width ) {
				$offset     = isset( $settings['iconOffset'] ) && is_array( $settings['iconOffset'] )
					? $settings['iconOffset']
					: array(
						'value' => 12,
						'unit'  => 'px',
					);
				$offset_css = Css_Helpers::ranger_css( $offset, 'Desktop' );
				if ( '' !== $offset_css ) {
					$rules[] = $wrapper_sel . '{--wpcp-overlay-offset:' . $offset_css . ';}';
				}
				if ( '' !== $icon_decls ) {
					$rules[] = $icon_sel . '{' . $icon_decls . '}';
				}
				$desktop_geometry = self::overlay_icon_geometry_decls( $icon_style, 'Desktop' );
				continue;
			}

			// Tablet / Mobile carry only responsive geometry that differs from Desktop.
			$device_geometry = self::overlay_icon_geometry_decls( $icon_style, $device );
			if ( '' !== $device_geometry && $device_geometry !== $desktop_geometry ) {
				$rules[] = '@media only screen and (max-width: ' . (int) $max_width . 'px){' . $icon_sel . '{' . $device_geometry . '}}';
			}
		}

		return implode( "\n", array_filter( $rules ) );
	}

	/**
	 * Responsive geometry (size + padding) declarations for one device.
	 *
	 * @param array<string, mixed> $icon_style Global iconStyle config.
	 * @param string               $device     Device key.
	 * @return string Declaration fragment (no braces).
	 */
	private static function overlay_icon_geometry_decls( array $icon_style, $device ) {
		$decls = array();

		$size = isset( $icon_style['size'] ) ? Css_Helpers::ranger_css( $icon_style['size'], $device ) : '';
		if ( '' !== $size ) {
			$decls[] = '--wpcp-icon-size:' . $size;
		}

		$padding = self::spacing_to_css( $icon_style['padding'] ?? null, $device, false );
		if ( '' !== $padding && ! self::is_zero_spacing_css( $padding ) ) {
			$decls[] = '--wpcp-click-icon-padding:' . $padding;
		}

		return empty( $decls ) ? '' : implode( ';', $decls ) . ';';
	}

	/**
	 * Full icon-selector variable declarations for one device (geometry on every
	 * device; radius, colors, border, and preset surface on Desktop only).
	 *
	 * @param array<string, mixed> $settings   Global lightbox settings.
	 * @param array<string, mixed> $icon_style Global iconStyle config.
	 * @param string               $device     Device key.
	 * @return string Declaration fragment (no braces).
	 */
	private static function overlay_icon_var_decls( array $settings, array $icon_style, $device ) {
		$geometry = self::overlay_icon_geometry_decls( $icon_style, $device );
		$decls    = '' !== $geometry ? array( rtrim( $geometry, ';' ) ) : array();

		if ( 'Desktop' === $device ) {
			$radius = self::spacing_to_css( $icon_style['borderRadius'] ?? null, $device, true );
			if ( '' !== $radius && ! self::is_zero_spacing_css( $radius ) ) {
				$decls[] = '--wpcp-click-icon-radius:' . $radius;
			}
			$decls = array_merge( $decls, self::overlay_icon_surface_decls( $settings, $icon_style ) );
		}

		return empty( $decls ) ? '' : implode( ';', $decls ) . ';';
	}

	/**
	 * Color / border / preset surface declarations (Desktop, non-responsive).
	 *
	 * Mirrors `buildSurfaceVars()` in `overlayGlobalIconCss.js`.
	 *
	 * @param array<string, mixed> $settings   Global lightbox settings.
	 * @param array<string, mixed> $icon_style Global iconStyle config.
	 * @return string[]
	 */
	private static function overlay_icon_surface_decls( array $settings, array $icon_style ) {
		$decls  = array();
		$normal = isset( $icon_style['normal'] ) && is_array( $icon_style['normal'] ) ? $icon_style['normal'] : array();
		$hover  = isset( $icon_style['hover'] ) && is_array( $icon_style['hover'] ) ? $icon_style['hover'] : array();

		$normal_color = self::sanitize_css_color( $normal['iconColor'] ?? '' );
		if ( '' !== $normal_color ) {
			$decls[] = '--wpcp-click-lightbox-color:' . $normal_color;
		}
		$normal_bg = self::sanitize_css_color( $normal['backgroundColor'] ?? '' );
		if ( '' !== $normal_bg ) {
			$decls[] = '--wpcp-click-lightbox-bg:' . $normal_bg;
		}
		$hover_color = self::sanitize_css_color( $hover['iconColor'] ?? '' );
		if ( '' !== $hover_color ) {
			$decls[] = '--wpcp-click-lightbox-color-hover:' . $hover_color;
		}
		$hover_bg = self::sanitize_css_color( $hover['backgroundColor'] ?? '' );
		if ( '' !== $hover_bg ) {
			$decls[] = '--wpcp-click-lightbox-bg-hover:' . $hover_bg;
		}

		$normal_border_state = self::resolve_icon_border_state( $normal );
		$normal_border_style = $normal_border_state['style'];
		if ( 'none' !== $normal_border_style ) {
			$decls[] = '--wpcp-click-icon-border-style:' . $normal_border_style;
			$decls[] = '--wpcp-click-icon-border-color:' . self::resolve_border_color( $normal_border_state['border'] );
			$width   = self::spacing_to_css( $normal_border_state['border_width'] ?? null );
			if ( '' !== $width && '0' !== $width ) {
				$decls[] = '--wpcp-click-icon-border-width:' . $width;
			}
		}

		$hover_border_state = self::resolve_icon_border_state( $hover, $normal );
		$hover_style        = $hover_border_state['style'];
		if ( 'none' !== $hover_style ) {
			$decls[]     = '--wpcp-click-icon-hover-border-style:' . $hover_style;
			$decls[]     = '--wpcp-click-icon-hover-border-color:' . self::resolve_border_color( $hover_border_state['border'] );
			$hover_width = self::spacing_to_css( $hover_border_state['border_width'] ?? null );
			if ( '' !== $hover_width && '0' !== $hover_width ) {
				$decls[] = '--wpcp-click-icon-hover-border-width:' . $hover_width;
			}
		}

		if ( ! self::icon_style_has_surface_styles( $icon_style ) ) {
			$preset = isset( $settings['lightboxIconStyle'] ) ? sanitize_key( (string) $settings['lightboxIconStyle'] ) : 'default';
			if ( 'filled' === $preset && '' === $normal_bg ) {
				$decls[] = '--wpcp-click-lightbox-bg:rgba(0,0,0,0.45)';
			} elseif ( 'outlined' === $preset ) {
				$decls[] = '--wpcp-click-icon-border-style:solid';
				$decls[] = '--wpcp-click-icon-border-color:currentColor';
				$decls[] = '--wpcp-click-icon-border-width:2px';
				$decls[] = '--wpcp-click-lightbox-bg:transparent';
			} elseif ( 'minimal' === $preset ) {
				$decls[] = '--wpcp-click-lightbox-bg:transparent';
			}
		}

		return $decls;
	}

	/**
	 * Resolve global extension icon for WP core images or non-customized blocks.
	 *
	 * @param array<string, mixed>|null $settings Optional settings; loads defaults when null.
	 * @return array<string, mixed>
	 */
	public static function resolve_global_icon( $settings = null ) {
		if ( ! is_array( $settings ) ) {
			$settings = Lightbox_Settings::get_settings();
		}

		$icon_style = isset( $settings['iconStyle'] ) && is_array( $settings['iconStyle'] )
			? $settings['iconStyle']
			: array();

		$size_attr = isset( $icon_style['size'] ) ? $icon_style['size'] : array(
			'value' => 20,
			'unit'  => 'px',
		);
		$size_css  = Css_Helpers::ranger_css( is_array( $size_attr ) ? $size_attr : array(), 'Desktop' );
		if ( '' === $size_css ) {
			$size_css = '20px';
		}

		$offset = isset( $settings['iconOffset'] ) && is_array( $settings['iconOffset'] )
			? $settings['iconOffset']
			: array(
				'value' => 12,
				'unit'  => 'px',
			);

		$offset_css = Css_Helpers::ranger_css( $offset, 'Desktop' );
		if ( '' === $offset_css ) {
			$offset_css = '12px';
		}

		$icon_preset = isset( $settings['lightboxIconStyle'] ) ? sanitize_key( (string) $settings['lightboxIconStyle'] ) : 'default';
		if ( ! in_array( $icon_preset, Lightbox_Settings::ICON_STYLES, true ) ) {
			$icon_preset = 'default';
		}

		return array(
			'source'       => 'global',
			'icon'         => isset( $settings['lightboxIcon'] ) && is_array( $settings['lightboxIcon'] )
				? $settings['lightboxIcon']
				: Lightbox_Settings::get_defaults()['lightboxIcon'],
			'position'     => self::sanitize_global_position( $settings['iconDisplayPosition'] ?? 'top-right' ),
			'visibility'   => self::sanitize_visibility( $settings['iconVisible'] ?? 'hover' ),
			'icon_preset'  => $icon_preset,
			'inline_style' => sprintf(
				'--icon-size:%1$s;--wpcp-lb-offset:%2$s;',
				$size_css,
				$offset_css
			),
			'extra_class'  => 'wpcp-lightbox-icon--global',
			'icon_style'   => $icon_style,
		);
	}

	/**
	 * CSS classes for WP core image/gallery lightbox host wrapper.
	 *
	 * @param array<string, mixed>|null $settings Settings.
	 * @return string[]
	 */
	public static function get_wp_host_classes( $settings = null ) {
		if ( ! is_array( $settings ) ) {
			$settings = Lightbox_Settings::get_settings();
		}

		$visibility = self::sanitize_visibility( $settings['iconVisible'] ?? 'hover' );

		return array(
			'wpcp-wp-lightbox-host',
			'wpcp-advanced-image-lightbox-icon-' . $visibility,
		);
	}

	/**
	 * Space-separated host class string.
	 *
	 * @param array<string, mixed>|null $settings Settings.
	 * @param string                    $suffix   Optional extra class.
	 * @return string
	 */
	public static function get_wp_host_class_attr( $settings = null, $suffix = '' ) {
		$classes = self::get_wp_host_classes( $settings );
		if ( '' !== $suffix ) {
			$classes[] = sanitize_html_class( $suffix );
		}
		return implode( ' ', array_filter( $classes ) );
	}

	/**
	 * Render lightbox icon anchor HTML.
	 *
	 * @param string               $href     Full image URL.
	 * @param string               $group    Fancybox group id.
	 * @param array<string, mixed> $resolved Resolved icon from resolve_* methods.
	 * @param string               $caption     Optional caption for Fancybox.
	 * @param array<string, mixed> $extra_attrs Optional data-* (thumbSrc, wpcpLbSingle).
	 * @return string
	 */
	public static function render_icon_trigger( $href, $group, array $resolved, $caption = '', array $extra_attrs = array() ) {
		$href = esc_url( $href );
		if ( '' === $href ) {
			return '';
		}

		$position    = esc_attr( $resolved['position'] ?? 'center' );
		$visibility  = esc_attr( $resolved['visibility'] ?? 'hover' );
		$extra       = self::sanitize_icon_extra_classes( $resolved['extra_class'] ?? '' );
		$source      = isset( $resolved['source'] ) ? sanitize_html_class( (string) $resolved['source'] ) : 'global';
		$icon_preset = isset( $resolved['icon_preset'] ) ? sanitize_key( (string) $resolved['icon_preset'] ) : '';
		$preset_cls  = '';
		if ( '' !== $icon_preset && in_array( $icon_preset, Lightbox_Settings::ICON_STYLES, true ) ) {
			$preset_cls = ' wpcp-lb-icon-style-' . $icon_preset;
		}

		// Fancybox renders the caption with innerHTML, so filter the markup here
		// as well as escaping it for the attribute.
		$safe_caption = Item_Text::caption( $caption );
		$data_caption = '';
		if ( '' !== $safe_caption ) {
			$data_caption = sprintf( ' data-caption="%s"', esc_attr( $safe_caption ) );
		}

		$data_extra = '';
		if ( ! empty( $extra_attrs['thumbSrc'] ) ) {
			$data_extra .= sprintf( ' data-thumb-src="%s"', esc_attr( (string) $extra_attrs['thumbSrc'] ) );
		}
		if ( ! empty( $extra_attrs['wpcpLbSingle'] ) ) {
			$data_extra .= ' data-wpcp-lb-single="1"';
		}

		$icon_html = self::render_icon_markup( $resolved['icon'] ?? array() );

		return sprintf(
			'<a href="%1$s" data-fancybox="%2$s" class="wpcp-lightbox-trigger wpcp-advanced-image-lightbox-icon wpcp-position-%3$s wpcp-advanced-image-lightbox-icon-%4$s %5$s" data-wpcp-lb-icon-source="%6$s" aria-label="%7$s"%8$s%9$s>%10$s</a>',
			$href,
			esc_attr( $group ),
			$position,
			$visibility,
			esc_attr( trim( 'wpcp-global-lightbox-icon ' . $extra . $preset_cls ) ),
			$source,
			esc_attr__( 'Open image in lightbox', 'wp-carousel-free' ),
			$data_caption,
			$data_extra,
			$icon_html
		);
	}

	/**
	 * Build inline CSS for global icon style states (no external inline attributes on elements).
	 *
	 * @param array<string, mixed>|null $settings Settings.
	 * @return string
	 */
	public static function build_global_icon_css( $settings = null ) {
		if ( ! is_array( $settings ) ) {
			$settings = Lightbox_Settings::get_settings();
		}

		$icon_style = isset( $settings['iconStyle'] ) && is_array( $settings['iconStyle'] )
			? $settings['iconStyle']
			: array();

		$size_attr = isset( $icon_style['size'] ) ? $icon_style['size'] : array(
			'device' => array(
				'Desktop' => 20,
				'Tablet'  => 20,
				'Mobile'  => 20,
			),
			'unit'   => array(
				'Desktop' => 'px',
				'Tablet'  => 'px',
				'Mobile'  => 'px',
			),
		);
		$offset    = isset( $settings['iconOffset'] ) && is_array( $settings['iconOffset'] )
			? $settings['iconOffset']
			: array(
				'device' => array(
					'Desktop' => 12,
					'Tablet'  => 12,
					'Mobile'  => 12,
				),
				'unit'   => array(
					'Desktop' => 'px',
					'Tablet'  => 'px',
					'Mobile'  => 'px',
				),
			);

		$global_icon = '.wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--global,.wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--uses-global-style';
		$size_box    = 'width:var(--icon-size,48px)!important;height:var(--icon-size,48px)!important;min-width:var(--icon-size,48px);min-height:var(--icon-size,48px);flex:none!important;box-sizing:border-box!important;';
		$host_vars   = '.wpcp-wp-lightbox-host,.wpcp-wp-lightbox-host--gallery,.wpcp-image-gallery-item,.wpcp-image-gallery-wrapper,.wpcp-image-wrapper';

		$rules   = array();
		$devices = array(
			'Desktop' => null,
			'Tablet'  => Breakpoints::TABLET,
			'Mobile'  => Breakpoints::MOBILE,
		);

		foreach ( $devices as $device => $max_width ) {
			$size_css    = Css_Helpers::ranger_css( is_array( $size_attr ) ? $size_attr : array(), $device );
			$offset_css  = Css_Helpers::ranger_css( $offset, $device );
			$padding_css = self::spacing_to_css( $icon_style['padding'] ?? null, $device );
			$radius_css  = self::spacing_to_css( $icon_style['borderRadius'] ?? null, $device, true );

			if ( '' === $size_css ) {
				$size_css = '20px';
			}
			if ( '' === $offset_css ) {
				$offset_css = '12px';
			}

			$size_safe    = self::sanitize_css_length( $size_css, '48px' );
			$offset_safe  = self::sanitize_css_length( $offset_css, '12px' );
			$vars_css     = '--icon-size:' . $size_safe . ';--wpcp-lb-offset:' . $offset_safe . ';';
			$layout_css   = $global_icon . '{pointer-events:auto;' . $vars_css . $size_box . 'border-radius:' . $radius_css . ';padding:' . $padding_css . ';transition:opacity .35s ease,color .35s ease,background-color .35s ease,border-color .35s ease,fill .35s ease;}';
			$host_css     = $host_vars . '{' . $vars_css . '}';
			$offset_rules = self::global_position_offset_rules( $offset_safe );

			if ( null === $max_width ) {
				$rules[] = $host_css;
				$rules[] = $layout_css;
				foreach ( $offset_rules as $rule ) {
					$rules[] = $rule;
				}
				continue;
			}

			$media_rules = array( $host_css, $layout_css );
			foreach ( $offset_rules as $rule ) {
				$media_rules[] = $rule;
			}
			$rules[] = '@media only screen and (max-width: ' . (int) $max_width . 'px){' . implode( '', $media_rules ) . '}';
		}

		$rules[] = '.wp-block-gallery.is-cropped .wpcp-wp-lightbox-host ' . $global_icon . ',.wp-block-gallery.is-cropped .blocks-gallery-item .wpcp-wp-lightbox-host ' . $global_icon . '{' . $size_box . '}';
		$rules[] = $global_icon . ' .wpcp-icon-container{display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-width:0;min-height:0;}';
		$rules[] = $global_icon . ' .wpcp-icon-container svg,' . $global_icon . ' .wpcp-icon-container img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;flex-shrink:0;}';

		$normal = isset( $icon_style['normal'] ) && is_array( $icon_style['normal'] ) ? $icon_style['normal'] : array();
		$hover  = isset( $icon_style['hover'] ) && is_array( $icon_style['hover'] ) ? $icon_style['hover'] : array();

		$rules[] = self::state_css( $global_icon, $normal, array(), true );
		$rules[] = self::state_css(
			'.wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--global:hover,.wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--uses-global-style:hover',
			$hover,
			$normal,
			true
		);
		$rules   = array_merge( $rules, self::icon_svg_color_rules( $global_icon, $icon_style, true ) );

		$icon_preset = isset( $settings['lightboxIconStyle'] ) ? sanitize_key( (string) $settings['lightboxIconStyle'] ) : 'default';
		if ( ! self::icon_style_has_surface_styles( $icon_style ) ) {
			if ( 'filled' === $icon_preset ) {
				$rules[] = '.wpcp-lb-icon-style-filled.wpcp-lightbox-icon--global:not([style*="background"]),.wpcp-lb-icon-style-filled.wpcp-lightbox-icon--uses-global-style:not([style*="background"]){background-color:rgba(0,0,0,0.45);}';
			} elseif ( 'outlined' === $icon_preset ) {
				$rules[] = '.wpcp-lb-icon-style-outlined.wpcp-lightbox-icon--global,.wpcp-lb-icon-style-outlined.wpcp-lightbox-icon--uses-global-style{border-width:2px;border-style:solid;border-color:currentColor;background-color:transparent;}';
			} elseif ( 'minimal' === $icon_preset ) {
				$rules[] = '.wpcp-lb-icon-style-minimal.wpcp-lightbox-icon--global,.wpcp-lb-icon-style-minimal.wpcp-lightbox-icon--uses-global-style{background-color:transparent;border:none;}';
			}
		}

		// Visibility "hover": reveal icon when the image/host is hovered (style colors still use icon:hover above).
		$hover_reveal = '.wpcp-wp-lightbox-host.wpcp-advanced-image-lightbox-icon-hover:hover .wpcp-advanced-image-lightbox-icon,.wpcp-wp-lightbox-host:hover .wpcp-advanced-image-lightbox-icon.wpcp-advanced-image-lightbox-icon-hover,.wpcp-image-wrapper.wpcp-advanced-image-lightbox-icon-hover:hover .wpcp-advanced-image-lightbox-icon,.wpcp-gallery-item__inner.wpcp-advanced-image-lightbox-icon-hover:hover .wpcp-advanced-image-lightbox-icon';

		$rules[] = '.wpcp-wp-lightbox-host .wpcp-advanced-image-lightbox-icon.wpcp-advanced-image-lightbox-icon-always,.wpcp-advanced-image-lightbox-icon-always .wpcp-lightbox-icon--global,.wpcp-advanced-image-lightbox-icon-always .wpcp-advanced-image-lightbox-icon{opacity:1;pointer-events:auto;}';
		$rules[] = '.wpcp-advanced-image-lightbox-icon.wpcp-advanced-image-lightbox-icon-hover{opacity:0;pointer-events:none;transition:opacity .35s ease,color .35s ease,background-color .35s ease,border-color .35s ease,fill .35s ease;}';
		$rules[] = $hover_reveal . '{opacity:1;pointer-events:auto;}';

		return implode( "\n", array_filter( $rules ) );
	}

	/**
	 * CSS offset rules per global position.
	 *
	 * @param string $offset_css Sanitized offset length (e.g. 12px).
	 * @return string[]
	 */
	private static function global_position_offset_rules( $offset_css ) {
		$off  = self::sanitize_css_length( $offset_css, '12px' );
		$host = '.wpcp-wp-lightbox-host .wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--global,.wpcp-image-wrapper .wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--uses-global-style,.wpcp-image-gallery-item .wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--global,.wpcp-image-gallery-item .wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--uses-global-style';
		$base = '.wpcp-lightbox-icon--global,.wpcp-advanced-image-lightbox-icon.wpcp-lightbox-icon--uses-global-style';

		$positions = array(
			'top-left',
			'top-right',
			'top-center',
			'center',
			'bottom-left',
			'bottom-right',
			'bottom-center',
			'center-left',
			'center-right',
		);

		$rules = array();
		foreach ( $positions as $position ) {
			$decl = self::icon_position_declarations( $position, $off );
			if ( '' === $decl ) {
				continue;
			}
			$rules[] = $host . '.wpcp-position-' . $position . ',' . $base . '.wpcp-position-' . $position . '{' . $decl . '}';
		}

		return $rules;
	}

	/**
	 * Offset for block/gallery icon positioning (global extension offset or block default inset).
	 *
	 * @param array<string, mixed> $resolved Resolved icon settings.
	 * @return string CSS length.
	 */
	private static function resolve_icon_position_offset_css( array $resolved ) {
		$extra             = (string) ( $resolved['extra_class'] ?? '' );
		$source            = (string) ( $resolved['source'] ?? '' );
		$uses_global_style = 'global' === $source || false !== strpos( $extra, 'uses-global-style' );

		if ( $uses_global_style && Lightbox_Frontend::is_lightbox_active() ) {
			$settings = Lightbox_Settings::get_settings();
			$offset   = isset( $settings['iconOffset'] ) && is_array( $settings['iconOffset'] )
				? $settings['iconOffset']
				: array(
					'value' => 12,
					'unit'  => 'px',
				);
			$css      = Css_Helpers::ranger_css( $offset, 'Desktop' );

			return '' !== $css ? $css : '12px';
		}

		return '10px';
	}

	/**
	 * Position declarations for a lightbox icon anchor.
	 *
	 * @param string $position Position slug.
	 * @param string $offset   CSS length inset from edges.
	 * @return string Declaration block (no braces).
	 */
	private static function icon_position_declarations( $position, $offset ) {
		$pos = sanitize_key( (string) $position );
		$off = self::sanitize_css_length( $offset, '10px' );

		switch ( $pos ) {
			case 'top-left':
				return 'top:' . $off . '!important;left:' . $off . '!important;right:auto!important;bottom:auto!important;transform:none!important;';
			case 'top-right':
				return 'top:' . $off . '!important;right:' . $off . '!important;left:auto!important;bottom:auto!important;transform:none!important;';
			case 'top-center':
				return 'top:' . $off . '!important;left:50%!important;right:auto!important;bottom:auto!important;transform:translateX(-50%)!important;';
			case 'bottom-left':
				return 'bottom:' . $off . '!important;left:' . $off . '!important;top:auto!important;right:auto!important;transform:none!important;';
			case 'bottom-right':
				return 'bottom:' . $off . '!important;right:' . $off . '!important;top:auto!important;left:auto!important;transform:none!important;';
			case 'bottom-center':
				return 'bottom:' . $off . '!important;left:50%!important;top:auto!important;right:auto!important;transform:translateX(-50%)!important;';
			case 'center-left':
				return 'top:50%!important;left:' . $off . '!important;right:auto!important;bottom:auto!important;transform:translateY(-50%)!important;';
			case 'center-right':
				return 'top:50%!important;right:' . $off . '!important;left:auto!important;bottom:auto!important;transform:translateY(-50%)!important;';
			case 'center':
				return 'top:50%!important;left:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;';
		}

		return '';
	}

	/**
	 * Validate a CSS length, falling back when it is not one.
	 *
	 * @param string $value    Raw CSS length.
	 * @param string $fallback Fallback when invalid.
	 * @return string
	 */
	private static function sanitize_css_length( $value, $fallback = '10px' ) {
		$value = trim( (string) $value );
		if ( preg_match( '/^\d+(?:\.\d+)?(px|%|em|rem)$/', $value ) ) {
			return $value;
		}

		return $fallback;
	}

	/**
	 * CSS custom properties for icon anchors (replaces inline style attributes).
	 *
	 * @param array<string, mixed> $resolved Resolved icon settings.
	 * @return string Declaration fragment (may be empty).
	 */
	private static function build_icon_css_variables_declaration( array $resolved ) {
		$parts = self::parse_inline_style_parts( $resolved['inline_style'] ?? '' );
		if ( empty( $parts ) ) {
			return '';
		}

		$allowed = array(
			'--icon-size'      => '48px',
			'--wpcp-lb-offset' => '12px',
		);
		$decls   = array();

		foreach ( $allowed as $prop => $fallback ) {
			if ( empty( $parts[ $prop ] ) ) {
				continue;
			}
			$decls[] = $prop . ':' . self::sanitize_css_length( $parts[ $prop ], $fallback );
		}

		if ( empty( $decls ) ) {
			return '';
		}

		return implode( ';', $decls ) . ';';
	}

	/**
	 * State colors/border for icon anchor.
	 *
	 * @param string               $selector       Selector.
	 * @param array<string, mixed> $state          State settings.
	 * @param array<string, mixed> $inherit_state  Normal state for hover inheritance.
	 * @param bool                 $important      Whether to append !important to declarations.
	 * @return string
	 */
	private static function state_css( $selector, array $state, array $inherit_state = array(), $important = false ) {
		$imp   = $important ? '!important' : '';
		$parts = array();
		if ( ! empty( $state['iconColor'] ) ) {
			$color = self::sanitize_css_color( $state['iconColor'] );
			if ( '' !== $color ) {
				$parts[] = 'color:' . $color . $imp;
				$parts[] = 'fill:' . $color . $imp;
			}
		}
		if ( ! empty( $state['backgroundColor'] ) ) {
			$bg = self::sanitize_css_color( $state['backgroundColor'] );
			if ( '' !== $bg ) {
				$parts[] = 'background-color:' . $bg . $imp;
			}
		}

		$border_state = self::resolve_icon_border_state( $state, $inherit_state );
		$style        = $border_state['style'];
		if ( 'none' !== $style ) {
			$width = self::spacing_to_css( $border_state['border_width'] ?? null );
			if ( '' === $width || '0' === $width ) {
				$width = '1px';
			}
			$color   = self::resolve_border_color( $border_state['border'] );
			$parts[] = 'border-width:' . $width . $imp;
			$parts[] = 'border-style:' . $style . $imp;
			$parts[] = 'border-color:' . $color . $imp;
		}

		if ( empty( $parts ) ) {
			return '';
		}

		return $selector . '{' . implode( ';', $parts ) . ';}';
	}

	/**
	 * SVG/path fill rules so icon color beats theme defaults on gallery items.
	 *
	 * @param string               $selector   Icon anchor selector.
	 * @param array<string, mixed> $icon_style Icon style config.
	 * @param bool                 $important  Whether to append !important.
	 * @return string[]
	 */
	private static function icon_svg_color_rules( $selector, array $icon_style, $important = false ) {
		$imp   = $important ? '!important' : '';
		$rules = array();
		$pairs = array(
			array( '', 'normal' ),
			array( ':hover', 'hover' ),
		);

		foreach ( $pairs as $pair ) {
			list($suffix, $key) = $pair;
			$state              = isset( $icon_style[ $key ] ) && is_array( $icon_style[ $key ] ) ? $icon_style[ $key ] : array();
			if ( empty( $state['iconColor'] ) ) {
				continue;
			}
			$color = self::sanitize_css_color( $state['iconColor'] );
			if ( '' === $color ) {
				continue;
			}
			$sel     = $selector . $suffix;
			$rules[] = $sel . ' .wpcp-icon-container svg,' . $sel . ' .wpcp-icon-container svg path{fill:' . $color . $imp . ';color:' . $color . ';}';
		}

		return $rules;
	}

	/**
	 * Effective border style/width for normal or hover icon state.
	 *
	 * @param array<string, mixed> $state         State settings.
	 * @param array<string, mixed> $inherit_state Normal state for hover inheritance.
	 * @return array{border: array<string, mixed>, border_width: mixed, style: string}
	 */
	private static function resolve_icon_border_state( array $state, array $inherit_state = array() ) {
		$border       = isset( $state['border'] ) && is_array( $state['border'] ) ? $state['border'] : array();
		$border_width = $state['borderWidth'] ?? null;

		if ( ! empty( $inherit_state ) ) {
			$inherit_border = isset( $inherit_state['border'] ) && is_array( $inherit_state['border'] )
				? $inherit_state['border']
				: array();
			$inherit_style  = isset( $inherit_border['style'] ) ? sanitize_key( (string) $inherit_border['style'] ) : 'none';

			$current_style = isset( $border['style'] ) ? sanitize_key( (string) $border['style'] ) : 'none';
			if ( 'none' === $current_style && 'none' !== $inherit_style ) {
				$border['style'] = $inherit_style;
				if ( '' === self::spacing_to_css( $border_width ) ) {
					$border_width = $inherit_state['borderWidth'] ?? null;
				}
			}
		}

		$has_explicit_style = array_key_exists( 'style', $border );
		$style              = $has_explicit_style ? sanitize_key( (string) $border['style'] ) : '';
		if ( ! $has_explicit_style && ! empty( $border['color'] ) ) {
			$style = 'solid';
		}
		if ( '' === $style ) {
			$style = 'none';
		}

		return array(
			'border'       => $border,
			'border_width' => $border_width,
			'style'        => $style,
		);
	}

	/**
	 * Build scoped icon selector from resolved extra classes.
	 *
	 * @param string               $scope_id Block wrapper id.
	 * @param array<string, mixed> $resolved Resolved icon settings.
	 * @return string
	 */
	private static function build_icon_style_selector( $scope_id, array $resolved = array() ) {
		unset( $resolved );

		$scope_id = self::normalize_scope_id( $scope_id );
		if ( '' === $scope_id ) {
			return '';
		}

		// Scope id already limits to one block/gallery wrapper; avoid extra-class mismatch on gallery items.
		return '#' . $scope_id . ' .wpcp-advanced-image-lightbox-icon';
	}

	/**
	 * Whether icon style config defines custom background/border (skip preset overrides).
	 *
	 * @param array<string, mixed> $icon_style Icon style config.
	 * @return bool
	 */
	private static function icon_style_has_surface_styles( array $icon_style ) {
		foreach ( array( 'normal', 'hover' ) as $state_key ) {
			if ( ! isset( $icon_style[ $state_key ] ) || ! is_array( $icon_style[ $state_key ] ) ) {
				continue;
			}

			$state = $icon_style[ $state_key ];
			if ( ! empty( $state['backgroundColor'] ) ) {
				return true;
			}

			$border = isset( $state['border'] ) && is_array( $state['border'] ) ? $state['border'] : array();
			if ( ! empty( $border['color'] ) ) {
				return true;
			}
			if ( 'none' !== ( $border['style'] ?? 'none' ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Border color for icon CSS (never transparent fallback when a color was set).
	 *
	 * @param array<string, mixed> $border Border attr.
	 * @return string
	 */
	private static function resolve_border_color( array $border ) {
		if ( empty( $border['color'] ) ) {
			return 'currentColor';
		}

		$sanitized = self::sanitize_css_color( $border['color'] );
		if ( '' !== $sanitized ) {
			return $sanitized;
		}

		$raw = trim( (string) $border['color'] );
		if ( '' !== $raw ) {
			return $raw;
		}

		return 'currentColor';
	}

	/**
	 * Whether a spacing CSS string is all zeros (omit the var so static SCSS defaults apply).
	 *
	 * @param string $css Spacing value e.g. `0px` or `0px 0px 0px 0px`.
	 * @return bool
	 */
	private static function is_zero_spacing_css( $css ) {
		if ( ! is_string( $css ) || '' === trim( $css ) ) {
			return true;
		}

		$parts = preg_split( '/\s+/', trim( $css ) );
		if ( ! is_array( $parts ) ) {
			return true;
		}

		foreach ( $parts as $part ) {
			if ( 1 !== preg_match( '/^0(\.0+)?(px|em|rem|%)?$/', $part ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Convert spacing attribute to CSS shorthand.
	 *
	 * @param mixed  $spacing   Spacing attr.
	 * @param string $device    Responsive device suffix.
	 * @param bool   $is_single Whether to emit a single value rather than a shorthand.
	 * @return string
	 */
	private static function spacing_to_css( $spacing, $device = 'Desktop', $is_single = false ) {
		if ( ! is_array( $spacing ) ) {
			return '0';
		}

		if ( isset( $spacing['device'] ) && is_array( $spacing['device'] ) ) {
			$generated = self::spacing_css_for_device( $spacing, $device, $is_single );
			return '' !== $generated ? $generated : '0';
		}

		$css = Css_Helpers::get_spacing_css( $spacing );
		return '' !== $css ? $css : '0';
	}

	/**
	 * Generate spacing CSS for a responsive spacing attribute at one breakpoint.
	 *
	 * @param array<string, mixed> $attr       Spacing attribute.
	 * @param string               $device     Device key.
	 * @param bool                 $is_single  Emit single linked value only.
	 * @return string
	 */
	private static function spacing_css_for_device( array $attr, $device = 'Desktop', $is_single = false ) {
		$unit = 'px';
		if ( isset( $attr['unit'] ) && is_string( $attr['unit'] ) ) {
			$unit = $attr['unit'];
		} elseif ( isset( $attr['unit'][ $device ] ) && is_string( $attr['unit'][ $device ] ) ) {
			$unit = $attr['unit'][ $device ];
		}

		$device_data = isset( $attr['device'][ $device ] ) && is_array( $attr['device'][ $device ] )
			? $attr['device'][ $device ]
			: array();

		$top    = $device_data['top'] ?? 0;
		$right  = $device_data['right'] ?? 0;
		$bottom = $device_data['bottom'] ?? 0;
		$left   = $device_data['left'] ?? 0;

		if ( $is_single || ! empty( $attr['allChange'] ) ) {
			return $top . $unit;
		}

		return $top . $unit . ' ' . $right . $unit . ' ' . $bottom . $unit . ' ' . $left . $unit;
	}

	/**
	 * Sanitize color for CSS output.
	 *
	 * @param string $color Raw color.
	 * @return string
	 */
	private static function sanitize_css_color( $color ) {
		$color = sanitize_text_field( (string) $color );
		if ( '' === $color ) {
			return '';
		}

		if ( preg_match( '/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/', $color ) ) {
			return strtolower( $color );
		}

		if ( preg_match( '/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^var\(--[a-zA-Z0-9-_]+\)$/', $color ) ) {
			return $color;
		}

		return '';
	}

	/**
	 * Icon size CSS for block triggers (iconStyle.size, global default, or legacy lightBoxIconSize).
	 *
	 * @param array<string, mixed> $block_attrs       Block attributes.
	 * @param array<string, mixed> $settings          Global lightbox settings.
	 * @param bool                 $style_customized  Whether block icon style panel overrides global.
	 * @param bool|null            $extension_active  Resolved lightbox-active state, or null to look it up.
	 * @return string
	 */
	private static function resolve_block_icon_size_css( array $block_attrs, array $settings, $style_customized, $extension_active = null ) {
		if ( null === $extension_active ) {
			$extension_active = Lightbox_Frontend::is_lightbox_active();
		}

		if ( $style_customized ) {
			$config   = self::get_block_icon_style_config( $block_attrs );
			$size_css = Css_Helpers::ranger_css( isset( $config['size'] ) && is_array( $config['size'] ) ? $config['size'] : array(), 'Desktop' );
			if ( '' !== $size_css ) {
				return $size_css;
			}

			if ( self::icon_size_differs_from_default( $block_attrs['lightBoxIconSize'] ?? null ) ) {
				return Css_Helpers::ranger_css( $block_attrs['lightBoxIconSize'], 'Desktop' );
			}

			return '';
		}

		if ( ! $extension_active ) {
			$size_css = Css_Helpers::ranger_css(
				is_array( $block_attrs['lightBoxIconSize'] ?? null ) ? $block_attrs['lightBoxIconSize'] : array(
					'value' => 24,
					'unit'  => 'px',
				),
				'Desktop'
			);

			return '' !== $size_css ? $size_css : '24px';
		}

		$global = self::resolve_global_icon( $settings );
		$parts  = self::parse_inline_style_parts( $global['inline_style'] ?? '' );

		return $parts['--icon-size'] ?? '';
	}

	/**
	 * Block-only default icon style when the global extension is disabled.
	 *
	 * @return array<string, mixed>
	 */
	private static function get_block_default_icon_style() {
		return array(
			'size' => array(
				'value' => 24,
				'unit'  => 'px',
			),
		);
	}

	/**
	 * Resolve the icon style preset a block asks for.
	 *
	 * @param array<string, mixed> $attrs Block attributes.
	 * @return string
	 */
	private static function get_block_icon_style_preset( array $attrs ) {
		$preset = isset( $attrs['lightBoxIconStyle'] ) ? sanitize_key( (string) $attrs['lightBoxIconStyle'] ) : '';
		if ( '' === $preset || ! in_array( $preset, Lightbox_Settings::ICON_STYLES, true ) ) {
			return 'default';
		}

		return $preset;
	}

	/**
	 * Build the icon style config for a block.
	 *
	 * @param array<string, mixed> $attrs Block attributes.
	 * @return array<string, mixed>
	 */
	private static function get_block_icon_style_config( array $attrs ) {
		$config = isset( $attrs['lightBoxIconStyleConfig'] ) && is_array( $attrs['lightBoxIconStyleConfig'] )
			? $attrs['lightBoxIconStyleConfig']
			: array();

		return $config;
	}

	/**
	 * Saved block icon style merged with inherited defaults (mirrors editor getEffectiveBlockIconStyleConfig).
	 *
	 * @param array<string, mixed> $attrs             Block or gallery-parent attributes subset.
	 * @param array<string, mixed> $fallback_icon_style Global or block-only defaults.
	 * @param bool                 $sanitize          Whether to run through Lightbox_Settings sanitizer.
	 * @return array<string, mixed>
	 */
	public static function get_effective_block_icon_style_config( array $attrs, array $fallback_icon_style = array(), $sanitize = true ) {
		$saved = self::get_block_icon_style_config( $attrs );
		$raw   = ! empty( $saved ) ? $saved : $fallback_icon_style;

		if ( ! is_array( $raw ) || empty( $raw ) ) {
			$raw = self::get_block_default_icon_style();
		}

		$merged = self::merge_icon_style_config( $raw, $fallback_icon_style );

		if ( ! $sanitize ) {
			return $merged;
		}

		return Lightbox_Settings::sanitize_block_icon_style_config( $merged );
	}

	/**
	 * Deep-merge saved icon style over fallback (normal/hover states, spacing, size).
	 *
	 * @param array<string, mixed> $saved    Saved or primary config.
	 * @param array<string, mixed> $fallback Fallback config.
	 * @return array<string, mixed>
	 */
	private static function merge_icon_style_config( array $saved, array $fallback = array() ) {
		if ( empty( $fallback ) ) {
			return $saved;
		}

		if ( empty( $saved ) ) {
			return $fallback;
		}

		$merged = $fallback;

		foreach ( array( 'size', 'padding', 'borderRadius' ) as $root_key ) {
			if ( isset( $saved[ $root_key ] ) && ! empty( $saved[ $root_key ] ) ) {
				$merged[ $root_key ] = $saved[ $root_key ];
			}
		}

		foreach ( array( 'normal', 'hover' ) as $state_key ) {
			$saved_state    = isset( $saved[ $state_key ] ) && is_array( $saved[ $state_key ] ) ? $saved[ $state_key ] : array();
			$fallback_state = isset( $fallback[ $state_key ] ) && is_array( $fallback[ $state_key ] ) ? $fallback[ $state_key ] : array();

			if ( empty( $saved_state ) ) {
				continue;
			}

			$merged[ $state_key ] = self::merge_icon_style_state( $fallback_state, $saved_state );
		}

		return $merged;
	}

	/**
	 * Merge one icon style state (saved wins when set).
	 *
	 * @param array<string, mixed> $fallback Fallback state.
	 * @param array<string, mixed> $saved    Saved state.
	 * @return array<string, mixed>
	 */
	private static function merge_icon_style_state( array $fallback, array $saved ) {
		$state = $fallback;

		foreach ( array( 'iconColor', 'backgroundColor' ) as $color_key ) {
			if ( ! empty( $saved[ $color_key ] ) ) {
				$state[ $color_key ] = $saved[ $color_key ];
			}
		}

		$saved_border = isset( $saved['border'] ) && is_array( $saved['border'] ) ? $saved['border'] : array();
		if ( ! empty( $saved['borderType'] ) && empty( $saved_border ) ) {
			$saved_border = array( 'style' => $saved['borderType'] );
		}

		if ( ! empty( $saved_border ) ) {
			$fallback_border = isset( $state['border'] ) && is_array( $state['border'] ) ? $state['border'] : array();
			$state['border'] = array_merge( $fallback_border, $saved_border );
		}

		if ( isset( $saved['borderWidth'] ) && ! empty( $saved['borderWidth'] ) ) {
			$state['borderWidth'] = $saved['borderWidth'];
		}

		return $state;
	}

	/**
	 * Build gallery-parent lightbox icon attribute bag for resolve_block_icon().
	 *
	 * @param array<string, mixed> $parent_attrs Gallery block attributes.
	 * @return array<string, mixed>
	 */
	public static function build_gallery_parent_icon_attrs( array $parent_attrs ) {
		return array(
			'lightBoxClickAction'     => 'icon',
			'lightBoxIcon'            => isset( $parent_attrs['lightBoxIcon'] ) && is_array( $parent_attrs['lightBoxIcon'] )
				? $parent_attrs['lightBoxIcon']
				: array(),
			'lightBoxIconSize'        => isset( $parent_attrs['lightBoxIconSize'] ) && is_array( $parent_attrs['lightBoxIconSize'] )
				? $parent_attrs['lightBoxIconSize']
				: array(),
			'lightBoxIconPosition'    => $parent_attrs['lightBoxIconPosition'] ?? 'center',
			'lightBoxIconVisible'     => $parent_attrs['lightBoxIconVisible'] ?? 'hover',
			'lightBoxIconStyle'       => $parent_attrs['lightBoxIconStyle'] ?? '',
			'lightBoxIconStyleConfig' => isset( $parent_attrs['lightBoxIconStyleConfig'] ) && is_array( $parent_attrs['lightBoxIconStyleConfig'] )
				? $parent_attrs['lightBoxIconStyleConfig']
				: array(),
		);
	}

	/**
	 * Whether an icon style config carries anything worth emitting.
	 *
	 * @param array<string, mixed> $config Icon style config.
	 * @return bool
	 */
	private static function icon_style_config_has_values( array $config ) {
		if ( empty( $config ) ) {
			return false;
		}

		if ( isset( $config['size'] ) && is_array( $config['size'] ) ) {
			$css = Css_Helpers::ranger_css( $config['size'], 'Desktop' );
			if ( '' !== $css ) {
				return true;
			}
		}

		foreach ( array( 'normal', 'hover' ) as $state_key ) {
			if ( ! isset( $config[ $state_key ] ) || ! is_array( $config[ $state_key ] ) ) {
				continue;
			}
			$state = $config[ $state_key ];
			if ( ! empty( $state['iconColor'] ) || ! empty( $state['backgroundColor'] ) ) {
				return true;
			}
			$border = isset( $state['border'] ) && is_array( $state['border'] ) ? $state['border'] : array();
			if ( ! empty( $border['color'] ) ) {
				return true;
			}
			if ( 'none' !== ( $border['style'] ?? 'none' ) ) {
				return true;
			}
		}

		foreach ( array( 'padding', 'borderRadius' ) as $spacing_key ) {
			if ( ! isset( $config[ $spacing_key ] ) ) {
				continue;
			}
			$css = self::spacing_to_css( $config[ $spacing_key ] );
			if ( '' !== $css && '0' !== $css ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Split an inline style string into its custom properties.
	 *
	 * @param string $inline_style Inline style string.
	 * @return array<string, string>
	 */
	private static function parse_inline_style_parts( $inline_style ) {
		$parts = array();
		$raw   = trim( (string) $inline_style, " \t\n\r\0\x0B;" );
		if ( '' === $raw ) {
			return $parts;
		}

		foreach ( explode( ';', $raw ) as $chunk ) {
			$chunk = trim( $chunk );
			if ( '' === $chunk || false === strpos( $chunk, ':' ) ) {
				continue;
			}
			list($key, $value) = array_map( 'trim', explode( ':', $chunk, 2 ) );
			if ( '' !== $key && '' !== $value ) {
				$parts[ $key ] = $value;
			}
		}

		return $parts;
	}

	/**
	 * Join custom properties back into an inline style string.
	 *
	 * @param array<string, string> $parts CSS custom properties.
	 * @return string
	 */
	private static function inline_style_from_parts( array $parts ) {
		if ( empty( $parts ) ) {
			return '';
		}

		$chunks = array();
		foreach ( $parts as $key => $value ) {
			$chunks[] = $key . ':' . $value;
		}

		return implode( ';', $chunks ) . ';';
	}

	/**
	 * Whether an icon size attribute differs from the default.
	 *
	 * @param mixed $size_attr Icon size attribute.
	 * @return bool
	 */
	private static function icon_size_differs_from_default( $size_attr ) {
		if ( ! is_array( $size_attr ) ) {
			return false;
		}
		$css = Css_Helpers::ranger_css( $size_attr, 'Desktop' );
		return '' !== $css && '24px' !== $css && '24' !== $css;
	}

	/**
	 * Restrict a block icon position to the supported set.
	 *
	 * @param string $raw Position.
	 * @return string
	 */
	private static function sanitize_block_position( $raw ) {
		$allowed = array(
			'top-left',
			'top-right',
			'top-center',
			'center',
			'bottom-left',
			'bottom-right',
			'bottom-center',
			'center-left',
			'center-right',
		);
		$pos     = sanitize_key( (string) $raw );
		return in_array( $pos, $allowed, true ) ? $pos : self::BLOCK_DEFAULT_POSITION;
	}

	/**
	 * Restrict a global icon position to the supported set.
	 *
	 * @param string $raw Position.
	 * @return string
	 */
	private static function sanitize_global_position( $raw ) {
		$allowed = Lightbox_Settings::ICON_POSITIONS;
		$pos     = sanitize_key( (string) $raw );
		return in_array( $pos, $allowed, true ) ? $pos : 'top-right';
	}

	/**
	 * Restrict an icon visibility value to the supported set.
	 *
	 * @param string $raw Visibility.
	 * @return string
	 */
	private static function sanitize_visibility( $raw ) {
		$allowed = array( 'always', 'hover' );
		$vis     = sanitize_key( (string) $raw );
		return in_array( $vis, $allowed, true ) ? $vis : self::BLOCK_DEFAULT_VISIBLE;
	}
}
