<?php
/**
 * Divi 4 integration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Divi;

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Assets;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Templates;

defined( 'ABSPATH' ) || exit;

// The hook callbacks below have to sit beside the entry-point class: Divi's own
// module base class does not exist until `et_builder_ready` fires.
// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed

/**
 * Wrapper class the editor re-init observer watches for.
 */
const WRAPPER_CLASS = 'wpcp-divi-carousel-wrapper';

/**
 * Register the saved-template module with Divi.
 *
 * Divi's module base class only exists once the builder has booted, so the
 * class is declared inside this function rather than at file level.
 */
function register_module() {
	static $registered = false;

	if ( $registered || ! class_exists( 'ET_Builder_Module' ) ) {
		return;
	}

	$registered = true;

	// Module slug kept identical to Pro's so a layout built in Free keeps
	// rendering after the upgrade.
	if ( ! class_exists( 'ET_Builder_Module_Wp_Carousel_Pro', false ) ) {
		require_once __DIR__ . '/Divi_Module.php';
	}

	new \ET_Builder_Module_Wp_Carousel_Pro();
}

/**
 * Whether Divi's builder — visual, backend or its AJAX renderer — is running.
 *
 * @return bool
 */
function is_builder_editor() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Reading the request context, not acting on it.
	if ( isset( $_GET['et_fb'] ) || isset( $_GET['et_pb_preview'] ) ) {
		return true;
	}

	if ( isset( $_GET['et_bfb'] ) && is_admin() ) {
		return true;
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	if ( ! empty( $GLOBALS['et_fb'] ) ) {
		return true;
	}

	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Reading the request context, not acting on it.
	if ( wp_doing_ajax() && isset( $_REQUEST['action'] ) && 0 === strpos( sanitize_key( wp_unslash( $_REQUEST['action'] ) ), 'et_' ) ) {
		return true;
	}

	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	if ( function_exists( 'et_core_is_fb_enabled' ) && et_core_is_fb_enabled() ) {
		return true;
	}

	return false;
}

/**
 * Enqueue the block runtime and the re-init observer inside the Divi builder.
 */
function enqueue_builder_assets() {
	if ( ! is_builder_editor() ) {
		return;
	}

	Builder_Assets::enqueue_block_runtime( true );
	Builder_Assets::add_reinit_script(
		WRAPPER_CLASS,
		array( 'divi:module:updated', 'divi:ajax:render:success', 'divi:builder:save' ),
		300
	);
}

/**
 * Load the block runtime on published Divi 4 pages.
 *
 * The module renders through a shortcode inside `the_content`, so its own
 * enqueue lands after `wp_enqueue_scripts` has finished and the lightbox config
 * localised at priority 100 never attaches.
 */
function enqueue_frontend_assets() {
	// The builder path above already covers the editor.
	if ( is_builder_editor() ) {
		return;
	}

	Builder_Assets::enqueue_block_runtime();
}

/**
 * Render the selected template inside a Divi-specific wrapper.
 *
 * @param int $template_id Template post ID.
 * @return string
 */
function render_module( $template_id ) {
	$template_id = absint( $template_id );
	$markup      = Builder_Templates::render( $template_id, is_builder_editor() );

	return sprintf(
		'<div class="%1$s" data-builder-template-id="%2$s">%3$s</div>',
		esc_attr( WRAPPER_CLASS ),
		esc_attr( $template_id ),
		$markup
	);
}

/**
 * Divi 4 integration entry point.
 */
class Divi_Builder {

	/**
	 * Hook the integration.
	 */
	public static function init() {
		add_action( 'et_builder_ready', __NAMESPACE__ . '\\register_module' );
		add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_builder_assets' );
		add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\\enqueue_builder_assets' );
		add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_frontend_assets' );
	}
}
