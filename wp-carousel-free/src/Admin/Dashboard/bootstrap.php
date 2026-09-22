<?php
/**
 * Free admin dashboard module entry point.
 *
 * @package WP_Carousel_Free
 */

defined( 'ABSPATH' ) || exit;

/*
 * Runs immediately: this file is required from `includes()`, which is itself a
 * `plugins_loaded` callback. Re-hooking `plugins_loaded` here would never fire —
 * a callback added to the priority currently being iterated is not picked up.
 * Every hook Dashboard::init() registers (admin_menu, wp_footer, wp_ajax_*, …)
 * fires later, so calling it directly is both correct and simpler.
 */
$wpcpf_dashboard_autoloader = WPCAROUSELF_PATH . 'vendor/autoload.php';

if ( file_exists( $wpcpf_dashboard_autoloader ) ) {
	require_once $wpcpf_dashboard_autoloader;

	\ShapedPlugin\WPCarouselFree\Admin\Dashboard\Dashboard::init();

	// Opt-in diagnostics. Not admin-guarded internally: its cron hook has to be
	// registered on front-end requests too, since WP-Cron is not an admin request.
	\ShapedPlugin\WPCarouselFree\Admin\Dashboard\Diagnostics::init();

	// Relocates the classic Tools page into the classic settings page.
	\ShapedPlugin\WPCarouselFree\Admin\Dashboard\Classic_Tools::init();

	// Registers a CPT and a shortcode, so it runs on the frontend too.
	\ShapedPlugin\WPCarouselFree\Admin\Dashboard\Saved_Templates::init();

	// Page builder integrations render saved templates on the frontend as well
	// as in each builder's editor, so this is not admin-only either.
	\ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Manager::init();
}
