<?php
/**
 * Elementor integration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Elementor;

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Assets;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the saved-template widget and keeps the editor preview styled and
 * initialised across Elementor's AJAX re-renders.
 */
class Elementor_Builder {

	/**
	 * Registered widget name.
	 *
	 * Shared with the editor re-init hook so the two can never drift. Kept
	 * identical to Pro's so a layout built in Free survives the upgrade.
	 */
	const WIDGET_NAME = 'wp_carousel_pro_saved_template';

	/**
	 * Wrapper class the editor re-init observer watches for.
	 */
	const WRAPPER_CLASS = 'wpcp-elementor-carousel-wrapper';

	/**
	 * Class Elementor renders for the widget icon.
	 */
	const ICON_CLASS = 'wpcpf-elementor-widget-icon';

	/**
	 * Hook the integration.
	 */
	public static function init() {
		add_action( 'elementor/widgets/register', array( __CLASS__, 'register_widget' ) );
		add_action( 'elementor/editor/before_enqueue_scripts', array( __CLASS__, 'enqueue_editor_icon' ) );
		add_action( 'elementor/preview/enqueue_styles', array( __CLASS__, 'enqueue_preview_assets' ) );
		add_action( 'elementor/preview/enqueue_scripts', array( __CLASS__, 'enqueue_preview_scripts' ) );

		// Well before Lightbox_Frontend localizes the Fancybox config at 100.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_frontend_assets' ), 20 );
	}

	/**
	 * Whether a saved Elementor document holds our widget.
	 *
	 * Matches on the widget name in the raw document JSON rather than decoding
	 * it, so a long page costs a string scan instead of a full parse. A stray
	 * match only costs an extra enqueue, never a wrong render.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	public static function page_contains_widget( $post_id ) {
		$post_id = absint( $post_id );

		if ( ! $post_id ) {
			return false;
		}

		$document_data = get_post_meta( $post_id, '_elementor_data', true );

		if ( ! is_string( $document_data ) || '' === $document_data ) {
			return false;
		}

		return false !== strpos( $document_data, self::WIDGET_NAME );
	}

	/**
	 * Load the block runtime on published Elementor pages.
	 *
	 * The widget renders through `the_content`, so its own enqueue lands after
	 * `wp_enqueue_scripts` has finished and the lightbox config localised at
	 * priority 100 never attaches.
	 */
	public static function enqueue_frontend_assets() {
		// The preview frame is already covered by the two hooks above.
		if ( class_exists( '\Elementor\Plugin' ) && ! empty( \Elementor\Plugin::$instance->preview ) && \Elementor\Plugin::$instance->preview->is_preview_mode() ) {
			return;
		}

		if ( ! is_singular() || ! self::page_contains_widget( get_queried_object_id() ) ) {
			return;
		}

		Builder_Assets::enqueue_block_runtime();
	}

	/**
	 * Register the widget.
	 *
	 * @param \Elementor\Widgets_Manager $widgets_manager Elementor widgets manager.
	 */
	public static function register_widget( $widgets_manager ) {
		require_once __DIR__ . '/Elementor_Widget.php';
		$widgets_manager->register( new Elementor_Widget() );
	}

	/**
	 * Widget icon for the editor panel.
	 *
	 * The same glyph the shortcode widget uses, carried as an inline mask so the
	 * panel entry matches without the block layer depending on another
	 * stylesheet being present.
	 */
	public static function enqueue_editor_icon() {
		$glyph = 'data:image/svg+xml,%3Csvg%20xmlns="http://www.w3.org/2000/svg"%20viewBox="0%200%201285%201000"%3E%3Cpath%20transform="translate%280%2C850%29%20scale%281%2C-1%29"%20d="M1285-150h-1285v1000h1285v-1000z%20m-1140%20145h995v710h-995v-710z%20m872%20336l-149-149c-11-11-28-11-38%200l-25%2025c-10%2010-10%2027%200%2037l106%20106-106%20106c-10%2010-10%2027%200%2037l25%2025c10%2011%2027%2011%2037%200l150-149c11-11%2011-27%200-38z%20m-749%2038l150%20149c10%2011%2027%2011%2037%200l25-24c10-11%2010-27%200-38l-106-106%20106-106c10-10%2010-27%200-37l-25-25c-10-11-27-11-37%200l-150%20149c-10%2011-10%2027%200%2038z"/%3E%3C/svg%3E';

		$css = sprintf(
			'.%1$s{display:inline-block;width:1em;height:1em;vertical-align:middle;background-color:currentColor;-webkit-mask:url(\'%2$s\') no-repeat center;mask:url(\'%2$s\') no-repeat center;-webkit-mask-size:contain;mask-size:contain;}',
			self::ICON_CLASS,
			$glyph
		);

		wp_register_style( self::ICON_CLASS, false, array(), WPCAROUSELF_VERSION );
		wp_enqueue_style( self::ICON_CLASS );
		wp_add_inline_style( self::ICON_CLASS, $css );
	}

	/**
	 * Styles for the Elementor preview frame.
	 */
	public static function enqueue_preview_assets() {
		Builder_Assets::enqueue_block_runtime( true );
	}

	/**
	 * Scripts for the Elementor preview frame.
	 */
	public static function enqueue_preview_scripts() {
		Builder_Assets::enqueue_block_runtime();

		// Deferred so Elementor has finished attaching and laying out the replaced
		// widget markup before Swiper measures it; initialising against a detached
		// or zero-width node yields a broken carousel.
		Builder_Assets::add_reinit_script( self::WRAPPER_CLASS, array(), 300 );

		// Elementor's own per-widget render hook, which fires on the initial
		// preview render and after each AJAX re-render. The observer above covers
		// editor builds that swap the markup without firing it; whichever lands
		// first wins, since the initialiser is idempotent.
		wp_add_inline_script(
			\ShapedPlugin\WPCarouselFree\Blocks\AssetManager::FRONTEND,
			'jQuery(window).on("elementor/frontend/init", function() {
				if (typeof elementorFrontend === "undefined" || ! elementorFrontend.hooks) {
					return;
				}
				elementorFrontend.hooks.addAction(
					"frontend/element_ready/' . self::WIDGET_NAME . '.default",
					function() {
						setTimeout(function() {
							if (window.WPCarouselFree && typeof window.WPCarouselFree.initialize === "function") {
								window.WPCarouselFree.initialize();
							}
						}, 300);
					}
				);
			});'
		);
	}
}
