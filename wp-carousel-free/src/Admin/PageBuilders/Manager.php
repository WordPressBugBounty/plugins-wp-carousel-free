<?php
/**
 * Page builder integrations manager.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders;

use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Dashboard;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Divi\Divi_Builder;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Divi5\Divi5_Builder;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Elementor\Elementor_Builder;

defined( 'ABSPATH' ) || exit;

/**
 * Loads a builder integration only when that builder is installed and the
 * Integrations tab has not switched it off. An integration with no stored value
 * is on, matching how the dashboard renders it.
 */
class Manager {

	/**
	 * Builder keys the Integrations tab offers, in card order.
	 */
	const BUILDERS = array( 'elementor', 'divi', 'wpbakery', 'oxygen', 'beaver', 'bricks' );

	/**
	 * Whether a builder is installed.
	 *
	 * @param string $builder Builder key.
	 * @return bool
	 */
	public static function is_builder_active( $builder ) {
		switch ( $builder ) {
			case 'elementor':
				return defined( 'ELEMENTOR_VERSION' );
			case 'divi':
				return defined( 'ET_BUILDER_VERSION' ) || class_exists( 'ET_Builder_Module' );
			case 'wpbakery':
				return defined( 'WPB_VC_VERSION' );
			case 'oxygen':
				return defined( 'CT_VERSION' ) || class_exists( 'OxyEl' );
			case 'beaver':
				return class_exists( 'FLBuilder' );
			case 'bricks':
				return defined( 'BRICKS_VERSION' );
			default:
				return false;
		}
	}

	/**
	 * Whether the site owner has left this integration switched on.
	 *
	 * @param string $builder Builder key.
	 * @return bool
	 */
	public static function is_integration_enabled( $builder ) {
		$options = get_option( Dashboard::OPTION_INTEGRATIONS, array() );

		if ( ! is_array( $options ) || ! isset( $options[ $builder ]['is_active'] ) ) {
			return true;
		}

		return (bool) $options[ $builder ]['is_active'];
	}

	/**
	 * Whether a builder should load: installed, and switched on.
	 *
	 * @param string $builder Builder key.
	 * @return bool
	 */
	private static function should_load( $builder ) {
		return self::is_builder_active( $builder ) && self::is_integration_enabled( $builder );
	}

	/**
	 * Hook every integration whose builder is present.
	 */
	public static function init() {
		if ( self::should_load( 'elementor' ) ) {
			Elementor_Builder::init();
		}

		if ( self::should_load( 'wpbakery' ) ) {
			require_once __DIR__ . '/WPBakery/WPBakery_Builder.php';
		}

		if ( self::should_load( 'oxygen' ) ) {
			// Oxygen registers elements on its own `init` hook.
			add_action( 'init', array( __CLASS__, 'load_oxygen' ), 11 );
		}

		if ( self::should_load( 'beaver' ) ) {
			require_once __DIR__ . '/Beaver/wp-carousel-beaver-module.php';
		}

		// Bricks ships as a theme, so BRICKS_VERSION is not defined yet on
		// `plugins_loaded`; the check moves into the callback.
		add_action( 'init', array( __CLASS__, 'load_bricks' ), 11 );

		// Divi loads late, so its own version cannot be read before `init`.
		add_action( 'init', array( __CLASS__, 'load_divi' ), 20 );

		// Divi 5 registers into a dependency tree built on `init`, and its REST
		// routes must exist even when that registration fails.
		add_action( 'init', array( __CLASS__, 'load_divi5_server_module' ), 10 );
		add_action( 'rest_api_init', array( __CLASS__, 'load_divi5_rest_api' ) );
	}

	/**
	 * Load the Oxygen element.
	 */
	public static function load_oxygen() {
		if ( class_exists( 'OxyEl' ) ) {
			require_once __DIR__ . '/Oxygen/oxygen.php';
		}
	}

	/**
	 * Load the Bricks element.
	 */
	public static function load_bricks() {
		if ( ! self::should_load( 'bricks' ) ) {
			return;
		}

		// Priority 11: Bricks requires the `\Bricks\Element` base class our
		// element extends from its own `init` callback at priority 10.
		if ( class_exists( '\Bricks\Elements' ) && class_exists( '\Bricks\Element' ) ) {
			\Bricks\Elements::register_element( __DIR__ . '/Bricks/bricksbuilder.php' );
		}
	}

	/**
	 * Load whichever Divi generation is running.
	 */
	public static function load_divi() {
		if ( ! self::should_load( 'divi' ) ) {
			return;
		}

		if ( self::is_divi_5_active() ) {
			Divi5_Builder::init();
			return;
		}

		if ( class_exists( 'ET_Builder_Module' ) || defined( 'ET_BUILDER_VERSION' ) ) {
			Divi_Builder::init();
		}
	}

	/**
	 * Whether Divi 5.x is the active generation.
	 *
	 * @return bool
	 */
	public static function is_divi_5_active() {
		if ( function_exists( 'et_builder_d5_enabled' ) && et_builder_d5_enabled() ) {
			return true;
		}

		if ( defined( 'ET_BUILDER_VERSION' ) ) {
			return version_compare( ET_BUILDER_VERSION, '5.0', '>=' );
		}

		return false;
	}

	/**
	 * Register the Divi 5 module before Divi builds its dependency tree.
	 */
	public static function load_divi5_server_module() {
		if ( ! self::is_divi_theme_or_builder_active() || ! self::is_divi_5_active() ) {
			return;
		}

		if ( ! self::is_integration_enabled( 'divi' ) ) {
			return;
		}

		require_once __DIR__ . '/Divi5/server/index.php';
	}

	/**
	 * Register the Divi 5 REST routes.
	 */
	public static function load_divi5_rest_api() {
		if ( ! self::is_divi_theme_or_builder_active() || ! self::is_integration_enabled( 'divi' ) ) {
			return;
		}

		require_once __DIR__ . '/Divi5/server/rest-api.php';

		// `rest_api_init` has already fired, so the hook inside the file is too
		// late — call the registration directly.
		Divi5\register_rest_routes();
	}

	/**
	 * Whether the Divi theme or the Divi Builder plugin is active.
	 *
	 * The theme check matters because ET_BUILDER_VERSION is not defined yet at
	 * the point the dependency tree is assembled.
	 *
	 * @return bool
	 */
	private static function is_divi_theme_or_builder_active() {
		if ( defined( 'ET_BUILDER_VERSION' ) ) {
			return true;
		}

		$theme = wp_get_theme();

		return 'Divi' === $theme->get( 'Name' ) || 'divi' === $theme->get( 'Template' );
	}
}
