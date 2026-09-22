<?php
/**
 * Gutenberg block module entry point.
 *
 * @package WP_Carousel_Free
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'init',
	function () {
		if ( version_compare( $GLOBALS['wp_version'], '5.8', '<' ) ) {
			return;
		}

		if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
			return;
		}

		// No built bundle: register nothing rather than a broken editor.
		if ( ! file_exists( WPCAROUSELF_PATH . 'assets/editor/index.asset.php' ) ) {
			return;
		}

		$autoloader = WPCAROUSELF_PATH . 'vendor/autoload.php';

		if ( ! file_exists( $autoloader ) ) {
			return;
		}

		require_once $autoloader;

		\ShapedPlugin\WPCarouselFree\Blocks\BlocksInit::instance();
	},
	9
);
