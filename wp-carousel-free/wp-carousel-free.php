<?php
/**
 * A carousel plugin for WordPress.
 *
 * @link    https://shapedplugin.com/
 * @since   2.0.0
 * @package WP_Carousel_Free
 *
 * Plugin Name:       WP Carousel
 * Plugin URI:        https://wpcarousel.io/
 * Description:       Create beautiful image carousels, sliders, video sliders, video galleries, and photo galleries with built-in Lightbox. Easily showcase images, videos, posts, and WooCommerce products with responsive layouts, grids, and fast performance—no code required.
 * Version:           3.0.0
 * Author:            ShapedPlugin LLC
 * Author URI:        https://shapedplugin.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       wp-carousel-free
 * Domain Path:       /languages
 * Requires PHP: 7.4
 * WC requires at least: 6.4
 * WC tested up to:   11.1.1
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/*
 * Free/Pro coexistence: WP Carousel Pro carries the whole engine and runs it
 * against the same `sp_wp_carousel` post type, the same `sp_wpcp_settings` option
 * and the same block names, so exactly one of the two may boot. This file decides
 * that here, at file scope, before anything is hooked.
 *
 * Two things a future edit must not break.
 *
 * No unconditional top-level `function` or `class` in this file may share a name
 * with one in `wp-carousel-pro.php`. PHP binds those when the file is COMPILED,
 * before a single statement in it runs, so a shared name is a fatal and not a
 * notice the moment WordPress compiles this file in a request that already loaded
 * Pro — `plugin_sandbox_scrape()` on activation does exactly that, and no `return`
 * below could prevent it. Today nothing is shared: Pro's bootstrap declares no
 * class, and its `sp_wpcp()` and `sp_wpcp_dependency_config()` are `function_exists()`
 * wrapped. The margin is one character, `sp_wpcf` against `sp_wpcp`.
 *
 * Standing down does not undeclare `SP_WP_Carousel_Free` or `sp_wpcf()` — they are
 * compiled either way — so neither is a usable "this build booted" probe.
 * `WPCAROUSELF_VERSION` is: it is defined from `define_constants()`, which runs only
 * once this plugin has committed to booting. Pro reads it to detect the one request
 * in which both engines would otherwise load.
 */
if ( ! function_exists( 'sp_wpcf_pro_is_active' ) ) {
	/**
	 * Whether WP Carousel Pro is installed and active.
	 *
	 * Independent of Pro's folder name. A hardcoded
	 * `wp-carousel-pro/wp-carousel-pro.php` misses every install that unpacked under
	 * a different directory — a branch ZIP extracts as `wp-carousel-pro-<branch>/` —
	 * so the active-plugin lists are matched on Pro's main-file basename instead.
	 * Both lists are read, because a multisite can have Pro switched on per site or
	 * across the network.
	 *
	 * The options are read directly rather than through `is_plugin_active()`. That
	 * function lives in `wp-admin/includes/plugin.php`, which this plugin has been
	 * parsing on every front-end request to answer one boolean. `active_plugins` is
	 * already in the object cache by this point, so the scan below costs nothing.
	 *
	 * @since 2.8.0
	 *
	 * @return bool
	 */
	function sp_wpcf_pro_is_active() {
		/*
		 * Fast path for a request in which Pro happened to load first. It cannot be
		 * the only test: `active_plugins` is sorted, and `wp-carousel-free/` precedes
		 * `wp-carousel-pro/` ( `f` is 0x66, `p` is 0x70 ), so in the ordinary request
		 * this file runs BEFORE Pro has defined anything at all. The scan below is
		 * what actually decides; do not simplify it away.
		 */
		if ( defined( 'WPCAROUSEL_VERSION' ) || function_exists( 'sp_wpcp' ) ) {
			return true;
		}

		$active_plugins = (array) get_option( 'active_plugins', array() );

		if ( is_multisite() ) {
			$active_plugins = array_merge( $active_plugins, array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) ) );
		}

		foreach ( $active_plugins as $active_plugin ) {
			if ( 'wp-carousel-pro.php' === basename( (string) $active_plugin ) ) {
				return true;
			}
		}

		return false;
	}
}

/*
 * Declared before the stand-down below, and deliberately so: WooCommerce reads
 * these declarations during its own boot, and a plugin that declares nothing is
 * listed as incompatible on the HPOS screen even though it is installed and
 * active. Pro used to declare this on our behalf; it no longer does, because that
 * broke whenever this plugin's folder was renamed.
 */
add_action(
	'before_woocommerce_init',
	function () {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);

/*
 * Pro active: stand down, SILENTLY.
 *
 * Pro is not a replacement for this plugin. It runs the shared engine against the
 * same data, so there is nothing to migrate and nothing here for a user to act on
 * — which is why this is a bare `return` and not a notice. Anything worth saying
 * about the pairing is said on Pro's side, where the user can act on it.
 *
 * This plugin stays INSTALLED AND ACTIVE. WordPress.org counts an active install
 * out of `active_plugins`, and Pro treats this plugin as a hard dependency, so
 * switching it off erases the listing's metrics and stops Pro at the same time.
 *
 * Standing down means no hooks at all. That includes the `activated_plugin`
 * redirect at the bottom of this file: it targets
 * `edit.php?post_type=sp_wp_carousel&page=wpcpf_dashboard`, a submenu this plugin
 * never registers while Pro is running, and core answers an unregistered `page`
 * with a permissions error.
 */
if ( sp_wpcf_pro_is_active() ) {
	return;
}

/**
 * Main class of the plugin
 *
 * @package WP_Carousel_Free
 * @author  Shamim Mia <shamhagh@gmail.com>
 */
class SP_WP_Carousel_Free {
	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since  2.0.0
	 * @access protected
	 * @var    WP_Carousel_Free_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	public $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since  2.0.0
	 * @access protected
	 * @var    string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since  2.0.0
	 * @access protected
	 * @var    string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Plugin textdomain.
	 *
	 * @since 2.0.0
	 *
	 * @var string
	 */
	public $domain = 'wp-carousel-free';

	/**
	 * Minimum PHP version required
	 *
	 * @since 2.0.0
	 * @var   string
	 */
	private $min_php = '7.4';

	/**
	 * Plugin file.
	 *
	 * @var string
	 */
	private $file = __FILE__;

	/**
	 * Holds class object
	 *
	 * @var   object
	 * @since 2.0.0
	 */
	private static $instance;

	/**
	 * Initialize the SP_WP_Carousel_Free() class
	 *
	 * @since  2.0.0
	 * @return object
	 */
	public static function init() {
		if ( ! isset( self::$instance ) && ! ( self::$instance instanceof SP_WP_Carousel_Free ) ) {
			self::$instance = new SP_WP_Carousel_Free();
			self::$instance->setup();
		}
		return self::$instance;
	}

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since 2.0.0
	 */
	public function setup() {
		$this->plugin_name = 'wp-carousel-free';
		$this->version     = '3.0.0';
		$this->define_constants();
		$this->includes();
		$this->load_dependencies();
		$this->define_common_hooks();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	/**
	 * Define plugin constants.
	 *
	 * @since  2.0.0
	 * @return void
	 */
	private function define_constants() {
		define( 'WPCAROUSELF_BASENAME', plugin_basename( __FILE__ ) );
		define( 'WPCAROUSELF_VERSION', $this->version );
		define( 'WPCAROUSELF_PATH', plugin_dir_path( __FILE__ ) );
		define( 'WPCAROUSELF_INCLUDES', WPCAROUSELF_PATH . '/includes' );
		define( 'WPCAROUSELF_URL', plugin_dir_url( __FILE__ ) );
	}

	/**
	 * Define constant if not already set.
	 *
	 * @param string      $name  Constant name.
	 * @param string|bool $value Constant Value.
	 */
	private function define( $name, $value ) {
		if ( ! defined( $name ) ) {
			define( $name, $value );
		}
	}

	/**
	 * Included required files.
	 *
	 * @since  2.0.0
	 * @return void
	 */
	public function includes() {
		include_once WPCAROUSELF_INCLUDES . '/class-wp-carousel-free-updates.php';
		include_once WPCAROUSELF_INCLUDES . '/class-wp-carousel-free-loader.php';
		include_once WPCAROUSELF_INCLUDES . '/class-wp-carousel-free-post-types.php';
		include_once WPCAROUSELF_PATH . '/admin/views/sp-framework/classes/setup.class.php';
		include_once WPCAROUSELF_PATH . '/admin/views/notices/admin-notices.php';

		add_action(
			'after_setup_theme',
			function () {
				include_once WPCAROUSELF_PATH . '/admin/views/metabox-config.php';
				include_once WPCAROUSELF_PATH . '/admin/views/option-config.php';
				include_once WPCAROUSELF_PATH . '/admin/views/tools-config.php';
			}
		);

		include_once WPCAROUSELF_INCLUDES . '/class-wp-carousel-free-shortcode.php';
		include_once WPCAROUSELF_INCLUDES . '/class-wp-carousel-free-import-export.php';
		include_once WPCAROUSELF_PATH . '/public/shortcode-deprecated.php';
		include_once WPCAROUSELF_PATH . '/public/WPCF_Helper.php';
		include_once WPCAROUSELF_PATH . '/public/class-wp-carousel-free-public.php';
		include_once WPCAROUSELF_PATH . '/admin/class-wp-carousel-free-admin.php';
		include_once WPCAROUSELF_PATH . '/admin/preview/class-wp-carousel-free-preview.php';
		include_once WPCAROUSELF_PATH . '/admin/class-wp-carousel-free-gutenberg-block.php';
		include_once WPCAROUSELF_PATH . '/admin/Media_View/class-wp-carousel-free-media-view.php';
		require_once WPCAROUSELF_PATH . '/admin/class-wp-carousel-free-elementor-block.php';

		/*
		 * Gutenberg block module. An isolated subsystem that self-registers on
		 * `init` and shares nothing with the Classic code above. Guarded on PHP
		 * 7.4 because WP 5.0 ignores the Requires PHP header, and on file
		 * presence so a partial deploy degrades to "no blocks" instead of a fatal.
		 */
		if ( PHP_VERSION_ID >= 70400 && file_exists( WPCAROUSELF_PATH . 'src/Blocks/bootstrap.php' ) ) {
			require_once WPCAROUSELF_PATH . 'src/Blocks/bootstrap.php';
		}

		/*
		 * Admin dashboard (Getting Started, Lite vs Pro, Settings). Same
		 * isolated-subsystem treatment as the block module above — see
		 * src/Admin/Dashboard/CLAUDE.md.
		 */
		if ( PHP_VERSION_ID >= 70400 && file_exists( WPCAROUSELF_PATH . 'src/Admin/Dashboard/bootstrap.php' ) ) {
			require_once WPCAROUSELF_PATH . 'src/Admin/Dashboard/bootstrap.php';
		}
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - WP_Carousel_Free_Loader. Orchestrates the hooks of the plugin.
	 * - WP_Carousel_Free_Admin. Defines all hooks for the admin area.
	 * - WP_Carousel_Free_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since  2.0.0
	 * @access private
	 */
	private function load_dependencies() {
		$this->loader = new WP_Carousel_Free_Loader();
	}


	/**
	 * Register common hooks.
	 *
	 * @since  2.0.0
	 * @access private
	 */
	private function define_common_hooks() {
		$plugin_cpt           = new WP_Carousel_Free_Post_Type( $this->get_plugin_name(), $this->get_version() );
		$plugin_admin_notices = new WP_Carousel_Admin_Notices( $this->get_plugin_name(), $this->get_version() );

		$this->loader->add_action( 'init', $plugin_cpt, 'wp_carousel_post_type', 11 );
		$this->loader->add_action( 'admin_notices', $plugin_admin_notices, 'display_admin_notice' );
		$this->loader->add_action( 'wp_ajax_sp-wpcfree-never-show-review-notice', $plugin_admin_notices, 'dismiss_review_notice' );
		add_action( 'wp_ajax_wp_ajax_install_plugin', 'wp_ajax_install_plugin' );
	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since  2.0.0
	 * @access private
	 */
	private function define_admin_hooks() {
		$plugin_admin = new WP_Carousel_Free_Admin( $this->get_plugin_name(), $this->get_version() );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_admin_styles' );
		$this->loader->add_filter( 'post_updated_messages', $plugin_admin, 'wpcp_carousel_updated_messages', 10, 2 );
		$this->loader->add_filter( 'manage_sp_wp_carousel_posts_columns', $plugin_admin, 'filter_carousel_admin_column' );
		$this->loader->add_action( 'manage_sp_wp_carousel_posts_custom_column', $plugin_admin, 'display_carousel_admin_fields', 10, 2 );
		$this->loader->add_filter( 'plugin_action_links', $plugin_admin, 'add_plugin_action_links', 10, 2 );
		$this->loader->add_filter( 'plugin_row_meta', $plugin_admin, 'plugin_row_meta', 10, 2 );
		$this->loader->add_filter( 'admin_footer_text', $plugin_admin, 'sp_wpcp_review_text', 10, 2 );
		$this->loader->add_filter( 'update_footer', $plugin_admin, 'sp_wpcp_version_text', 11 );

		// Export and Import ajax call.
		$import_export = new Wp_Carousel_Free_Import_Export( $this->get_plugin_name(), $this->get_version() );

		$this->loader->add_action( 'wp_ajax_wpcp_export_shortcodes', $import_export, 'export_shortcodes' );
		$this->loader->add_action( 'wp_ajax_wpcp_import_shortcodes', $import_export, 'import_shortcodes' );

		// Gutenberg block.
		if ( version_compare( $GLOBALS['wp_version'], '5.3', '>=' ) ) {
			new WP_Carousel_Free_Gutenberg_Block();
		}

		// Elementor shortcode block.
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		if ( ( is_plugin_active( 'elementor/elementor.php' ) || is_plugin_active_for_network( 'elementor/elementor.php' ) ) ) {
			new Wp_Carousel_Free_Element_Shortcode_Block();
		}

		/**
		 * Polylang plugin support for multi language support.
		 */
		if ( class_exists( 'Polylang' ) ) {
			/**
			 *
			 * Multi Language Support
			 *
			 * @since 2.0
			 */
			add_filter( 'pll_get_post_types', array( $this, 'wpcp_polylang_cpt_to_pll' ), 10, 2 );
		}
	}

	/**
	 * Polylang_cpt_to_pll
	 *
	 * @param  mixed $post_types post types.
	 * @param  mixed $is_settings hide.
	 * @return array
	 */
	public function wpcp_polylang_cpt_to_pll( $post_types, $is_settings ) {
		// enables language and translation management.
		$post_types['sp_wp_carousel'] = 'sp_wp_carousel';
		return $post_types;
	}


	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since  2.0.0
	 * @access private
	 */
	private function define_public_hooks() {
		$plugin_public = new WP_Carousel_Free_Public( $this->get_plugin_name(), $this->get_version() );
		$this->loader->add_action( 'wp_loaded', $plugin_public, 'register_all_scripts' );
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_styles' );
		$this->loader->add_action( 'save_post', $plugin_public, 'update_page_wp_carousel_option_on_save' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_public, 'admin_enqueue_scripts' );

		$plugin_shortcode = new WP_Carousel_Free_Shortcode( $this->get_plugin_name(), $this->get_version() );
		$this->loader->add_shortcode( 'sp_wpcarousel', $plugin_shortcode, 'sp_wp_carousel_shortcode' );
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since  2.0.0
	 * @return string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since  2.0.0
	 * @return string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since  2.0.0
	 * @return WP_Carousel_Free_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since 2.0.0
	 */
	public function run() {
		$this->loader->run();
	}
} // SP_WP_Carousel_Free

/**
 * Main instance of WP Carousel Free
 *
 * Returns the main instance of the WP Carousel Free.
 *
 * @since  2.0.0
 * @return void
 */
function sp_wpcf() {
	$plugin = SP_WP_Carousel_Free::init();
	$plugin->loader->run();

	if ( ! defined( 'SHAPEDPLIUGIN_OFFER_BANNER_LOADED' ) ) {
		define( 'SHAPEDPLIUGIN_OFFER_BANNER_LOADED', true );

		/**
		 * The file is responsible for generating admin offer banner.
		 */
		include_once plugin_dir_path( __FILE__ ) . '/admin/views/notices/offer-banner.php';
	}
}

/**
 * Load the main functionalities of the plugin.
 *
 * The Pro check that used to live here now runs at file scope, above, so this
 * function is only ever reached when this plugin is the one that boots. It is kept
 * as the `plugins_loaded` callback rather than hooking `sp_wpcf()` directly: the
 * classic subsystem has registered its hooks from this exact callback at this exact
 * priority since 2.0, and a third-party `remove_action()` written against the name
 * should keep working.
 *
 * @return void
 */
function load_sp_wordpress_carousel_plugin() {
	sp_wpcf();
}

/**
 * Redirect after activation.
 *
 * @param string $plugin_file Path to the plugin file, relative to the plugin.
 * @return void
 */
function sp_wpcf_redirect_after_activation( $plugin_file ) {
	if ( plugin_basename( __FILE__ ) === $plugin_file && ! ( defined( 'DOING_AJAX' ) && DOING_AJAX ) && ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
		exit( esc_url( wp_safe_redirect( admin_url( 'edit.php?post_type=sp_wp_carousel&page=wpcpf_dashboard' ) ) ) );
	}
}

add_action( 'plugins_loaded', 'load_sp_wordpress_carousel_plugin' );
add_action( 'activated_plugin', 'sp_wpcf_redirect_after_activation' );
