<?php
/**
 * Maps global Lightbox extension settings to Fancybox runtime options.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Lightbox;

use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules\Lightbox_Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Lightbox_Config class.
 */
class Lightbox_Config {

	/**
	 * Public config for wp_localize_script (no inline JS callbacks).
	 *
	 * @return array<string, mixed>
	 */
	public static function get_public_config() {
		$settings = Lightbox_Settings::get_settings();

		return array(
			'wpImages' => ! empty( $settings['wpImagesEnable'] ),
			'fancybox' => self::build_fancybox_options( $settings ),
		);
	}

	/**
	 * Build Fancybox 5 option array (JSON-safe).
	 *
	 * @param array<string, mixed> $settings Sanitized lightbox settings.
	 * @return array<string, mixed>
	 */
	public static function build_fancybox_options( array $settings ) {
		$theme = isset( $settings['lightboxTheme'] ) ? (string) $settings['lightboxTheme'] : 'dark';
		if ( 'custom' === $theme ) {
			$theme = 'auto';
		}

		$open_transition = self::map_open_transition( $settings['transitionEffect'] ?? 'zoom' );

		$carousel = array(
			'infinite'   => true,
			'transition' => 'fade',
			'Arrows'     => ! empty( $settings['navigationArrow'] ),
			'Toolbar'    => self::build_carousel_toolbar( $settings ),
			'Autoplay'   => false,
			'Thumbs'     => self::build_thumbs_options( $settings ),
		);

		$options = array(
			'mainClass'     => 'wpcp-lightbox',
			'autoFocus'     => false,
			'dragToClose'   => false,
			'hideScrollbar' => true,
			'idle'          => false,
			'closeButton'   => false,
			'caption'       => false,
			'theme'         => $theme,
			'backdropClick' => ! empty( $settings['closeOnClickOutside'] ) ? 'close' : false,
			'Carousel'      => $carousel,
			'Zoomable'      => self::build_zoomable_options(),
			'keyboard'      => array(
				'Escape'     => 'close',
				'Delete'     => 'close',
				'Backspace'  => 'close',
				'ArrowLeft'  => 'prev',
				'ArrowRight' => 'next',
				'ArrowUp'    => 'prev',
				'ArrowDown'  => 'next',
			),
			'showClass'     => $open_transition['show'],
			'hideClass'     => $open_transition['hide'],
			'zoomEffect'    => $open_transition['zoomEffect'],
		);

		/**
		 * Filter Fancybox options built from global Lightbox extension settings.
		 *
		 * @param array<string, mixed> $options  Fancybox options.
		 * @param array<string, mixed> $settings Sanitized lightbox settings.
		 */
		return apply_filters( 'wpcp_lightbox_fancybox_options', $options, $settings );
	}

	/**
	 * Fancybox Carousel.Toolbar — the close button, plus the item counter.
	 *
	 * Item ids match Fancybox 5 Toolbar plugin (see fancybox.js eV / eH).
	 *
	 * @param array<string, mixed> $settings Sanitized lightbox settings.
	 * @return array<string, mixed>
	 */
	private static function build_carousel_toolbar( array $settings ) {
		return array(
			'absolute' => true,
			'enabled'  => true,
			'display'  => array(
				'left'   => ! empty( $settings['itemCounter'] ) ? array( 'counter' ) : array(),
				'middle' => array(),
				'right'  => array( 'close' ),
			),
		);
	}

	/**
	 * Zoomable / Panzoom options (keeps the image centered at base scale).
	 *
	 * Panzoom is shared infrastructure, not a Pro feature: the Free "Lightbox
	 * Transition Effect" zoom animation reads `slide.panzoomRef`, which only the
	 * Zoomable plugin creates. Pro's transform buttons are a separate concern and
	 * stay out of the toolbar.
	 *
	 * @return array<string, mixed>
	 */
	private static function build_zoomable_options() {
		return array(
			'Panzoom' => array(
				'bounds'   => true,
				'startPos' => array(
					'x'     => 0,
					'y'     => 0,
					'scale' => 'base',
				),
			),
		);
	}

	/**
	 * Build Thumbs plugin options.
	 *
	 * @param array<string, mixed> $settings Settings.
	 * @return array<string, mixed>|false
	 */
	private static function build_thumbs_options( array $settings ) {
		$style = isset( $settings['thumbnailsDisplayStyle'] ) ? sanitize_key( (string) $settings['thumbnailsDisplayStyle'] ) : 'none';
		if ( 'none' === $style ) {
			return false;
		}

		$allowed = array( 'modern', 'classic', 'scrollable' );
		$type    = in_array( $style, $allowed, true ) ? $style : 'modern';

		return array(
			'type'        => $type,
			'minCount'    => 2,
			'showOnStart' => true,
			'Carousel'    => array(
				'classes' => array(
					'container' => 'fancybox__thumbs',
					'viewport'  => 'f-thumbs__viewport',
					'slide'     => 'f-thumbs__slide',
				),
			),
		);
	}

	/**
	 * Map "Lightbox Transition Effect" (open/close animation).
	 *
	 * @param string $effect Effect slug.
	 * @return array{show: string, hide: string, zoomEffect: bool}
	 */
	private static function map_open_transition( $effect ) {
		$key = sanitize_key( (string) $effect );

		$map = array(
			'zoom'        => array(
				'show'       => 'f-zoomInUp',
				'hide'       => 'f-zoomOutDown',
				'zoomEffect' => true,
			),
			'fade'        => array(
				'show'       => 'f-fadeIn',
				'hide'       => 'f-fadeOut',
				'zoomEffect' => false,
			),
			'slide'       => array(
				'show'       => 'f-crossfadeIn',
				'hide'       => 'f-crossfadeOut',
				'zoomEffect' => false,
			),
			'circular'    => array(
				'show'       => 'f-circularIn',
				'hide'       => 'f-circularOut',
				'zoomEffect' => false,
			),
			'tube'        => array(
				'show'       => 'f-tubeIn',
				'hide'       => 'f-tubeOut',
				'zoomEffect' => false,
			),
			'zoom-in-out' => array(
				'show'       => 'f-zoomInOutIn',
				'hide'       => 'f-zoomInOutOut',
				'zoomEffect' => false,
			),
			'rotate'      => array(
				'show'       => 'f-rotateIn',
				'hide'       => 'f-rotateOut',
				'zoomEffect' => false,
			),
			'none'        => array(
				'show'       => 'f-wpcpInstantIn',
				'hide'       => 'f-wpcpInstantOut',
				'zoomEffect' => false,
			),
		);

		return $map[ $key ] ?? $map['zoom'];
	}
}
