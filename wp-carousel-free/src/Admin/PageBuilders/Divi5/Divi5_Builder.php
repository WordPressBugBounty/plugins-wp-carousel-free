<?php
/**
 * Divi 5 integration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Divi5;

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Assets;

defined( 'ABSPATH' ) || exit;

/**
 * Divi 5 renders its modules from a React package registered with the visual
 * builder, so this class only has to supply that package and the block runtime
 * the rendered template needs. The module itself lives in `server/index.php`.
 */
class Divi5_Builder {

	/**
	 * Wrapper class the editor re-init observer watches for.
	 */
	const WRAPPER_CLASS = 'wpcp-divi5-carousel-wrapper';

	/**
	 * Registered visual builder package name.
	 */
	const PACKAGE = 'wpcp-divi5-carousel-visual-builder';

	/**
	 * Hook the integration.
	 */
	public static function init() {
		add_action( 'divi_visual_builder_assets_before_enqueue_scripts', array( __CLASS__, 'enqueue_visual_builder_assets' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_frontend_assets' ) );
	}

	/**
	 * Register the React module and load the block runtime in the builder.
	 */
	public static function enqueue_visual_builder_assets() {
		if ( ! function_exists( 'et_core_is_fb_enabled' ) || ! et_core_is_fb_enabled() ) {
			return;
		}

		$module_url = WPCAROUSELF_URL . 'assets/wpcp-divi5-carousel/';

		if ( class_exists( '\ET\Builder\VisualBuilder\Assets\PackageBuildManager' ) ) {
			\ET\Builder\VisualBuilder\Assets\PackageBuildManager::register_package_build(
				array(
					'name'    => self::PACKAGE,
					'version' => WPCAROUSELF_VERSION,
					'script'  => array(
						'src'                => $module_url . 'wpcp-divi5-carousel.js',
						'deps'               => array( 'react', 'jquery', 'divi-module-library', 'wp-hooks', 'divi-rest' ),
						'enqueue_app_window' => true,
					),
				)
			);
		}

		Builder_Assets::enqueue_block_runtime( true );
		Builder_Assets::add_reinit_script( self::WRAPPER_CLASS, array(), 300 );
	}

	/**
	 * Load the block runtime on published Divi 5 pages.
	 */
	public static function enqueue_frontend_assets() {
		// The builder path above already covers the editor.
		if ( function_exists( 'et_core_is_fb_enabled' ) && et_core_is_fb_enabled() ) {
			return;
		}

		Builder_Assets::enqueue_block_runtime();
	}
}
