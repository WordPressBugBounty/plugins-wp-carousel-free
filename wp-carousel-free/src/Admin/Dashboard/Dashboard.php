<?php
/**
 * Free admin dashboard: module state, Getting Started, Lite vs Pro, Settings.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\Dashboard;

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Manager;
use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules\Module_Settings_Helper;
use ShapedPlugin\WPCarouselFree\Blocks\Cache;
use ShapedPlugin\WPCarouselFree\Blocks\Lightbox\Lightbox_Icon_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Free's own trimmed dashboard. Unlike Pro's 1200+ line class this owns only
 * what Free actually ships: module-state reads (unchanged from the original
 * shim), the Getting Started and Lite vs Pro pages, and a Settings page with
 * Advanced Controls, Custom CSS & JS and Integrations only — no License.
 */
class Dashboard {

	const OPTION_MODULES            = 'wpcp_modules_options';
	const OPTION_EXTENSION_SETTINGS = 'wpcp_extension_settings';
	const OPTION_BLOCK_VISIBILITY   = 'wpcp_block_visibility';
	const OPTION_INTEGRATIONS       = 'wpcp_integrations_options';

	/**
	 * Classic's own settings option. The new Settings tab intentionally writes
	 * into this same option (not a Free-only one) so Classic's uninstall
	 * behaviour and its live frontend Custom CSS output both keep working
	 * without any Classic code being touched.
	 */
	const OPTION_PLUGIN_SETTINGS = 'sp_wpcp_settings';

	const STATUS_UPCOMING = 'upcoming';

	const PAGE_SLUG_GETTING_STARTED = 'wpcpf_dashboard';
	const PAGE_SLUG_LITE_VS_PRO     = 'wpcpf_lite_vs_pro';
	const UPGRADE_URL               = 'https://wpcarousel.io/pricing/?ref=1';
	const NONCE_KEY                 = 'wpcpf_dashboard_nonce';

	/**
	 * Cache key for the WordPress.org changelog feed.
	 */
	const CHANGELOG_TRANSIENT = 'wpcpf_changelogs';

	/**
	 * Request-scoped copy of the modules option.
	 *
	 * @var array<string, bool>|null
	 */
	private static $modules_cache = null;

	/**
	 * Whether a module is enabled.
	 *
	 * @param string $module_name Module slug.
	 * @return bool
	 */
	public static function is_module_active( $module_name ) {
		$module_name = sanitize_key( $module_name );

		if ( null === self::$modules_cache ) {
			$saved               = get_option( self::OPTION_MODULES, array() );
			self::$modules_cache = is_array( $saved ) ? $saved : array();
		}

		if ( ! array_key_exists( $module_name, self::$modules_cache ) ) {
			return true;
		}

		return (bool) self::$modules_cache[ $module_name ];
	}

	/**
	 * Whether a block should be registered. Read by BlockTypesController, so a
	 * block switched off on the Blocks page is genuinely never registered
	 * rather than merely hidden in the inserter.
	 *
	 * @param string $block_slug Block slug, e.g. "carousel".
	 * @return bool
	 */
	public static function is_block_visible( $block_slug ) {
		$saved = get_option( self::OPTION_BLOCK_VISIBILITY, array() );

		if ( ! is_array( $saved ) || ! array_key_exists( $block_slug, $saved ) ) {
			return true;
		}

		return (bool) $saved[ $block_slug ];
	}

	/**
	 * Blocks Free ships, with their saved on/off state. Titles live here rather
	 * than in the React app so the server stays the single source of truth for
	 * which blocks exist.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function get_block_visibility_list() {
		$titles = array(
			'carousel'          => __( 'Carousel', 'wp-carousel-free' ),
			'slider'            => __( 'Slider', 'wp-carousel-free' ),
			'thumbnails-slider' => __( 'Thumbnails Slider', 'wp-carousel-free' ),
			'tiles'             => __( 'Tiles', 'wp-carousel-free' ),
		);

		// Registered as teasers: listed so the page can advertise them, but they
		// carry no toggle because there is nothing to switch off.
		$pro_teasers = array(
			'marquee'           => __( 'Marquee', 'wp-carousel-free' ),
			'carousel-panorama' => __( 'Panorama Carousel', 'wp-carousel-free' ),
		);

		$list = array();
		foreach ( $titles as $slug => $title ) {
			$list[] = array(
				'name'  => $slug,
				'title' => $title,
				'show'  => self::is_block_visible( $slug ),
				'isPro' => false,
			);
		}
		foreach ( $pro_teasers as $slug => $title ) {
			$list[] = array(
				'name'  => $slug,
				'title' => $title,
				'show'  => false,
				'isPro' => true,
			);
		}

		return $list;
	}

	/**
	 * Modules Free ships. Only Lightbox is real here — the rest are Pro and are
	 * listed as locked cards so the page advertises them without implementing
	 * them.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function get_modules_list() {
		$free_modules = array(
			'lightbox'        => __( 'Lightbox', 'wp-carousel-free' ),
			'ready-patterns'  => __( 'Ready Patterns Library', 'wp-carousel-free' ),
			'saved-templates' => __( 'Saved Templates', 'wp-carousel-free' ),
		);

		$pro_modules = array(
			'watermark'  => __( 'Watermark', 'wp-carousel-free' ),
			'visibility' => __( 'Visibility & Scheduling', 'wp-carousel-free' ), // isolation-ignore -- upsell label, not an implementation.
			'hover'      => __( 'Hover Animations', 'wp-carousel-free' ),
			'motion'     => __( 'Motion Effects', 'wp-carousel-free' ),
		);

		// Unreleased on both sides. Listed so the page can advertise them, with an
		// off switch that cannot be turned on — the save allow-list rejects these
		// slugs, so no crafted request can store a value for them either.
		$upcoming_modules = array(
			'video-player'        => __( 'Custom Video Player', 'wp-carousel-free' ),
			'audio-player'        => __( 'Custom Audio Player', 'wp-carousel-free' ),
			'build-custom-layout' => __( 'Build Custom Layout', 'wp-carousel-free' ),
			'white-labeling'      => __( 'White Labeling', 'wp-carousel-free' ),
			'role-management'     => __( 'Role Management', 'wp-carousel-free' ),
		);

		$list = array();
		foreach ( $free_modules as $slug => $title ) {
			$list[] = array(
				'module_name' => $slug,
				'title'       => $title,
				'show'        => self::is_module_active( $slug ),
				'isPro'       => false,
			);
		}
		foreach ( $pro_modules as $slug => $title ) {
			$list[] = array(
				'module_name' => $slug,
				'title'       => $title,
				'show'        => false,
				'isPro'       => true,
			);
		}
		foreach ( $upcoming_modules as $slug => $title ) {
			$list[] = array(
				'module_name' => $slug,
				'title'       => $title,
				'show'        => false,
				'isPro'       => false,
				'status'      => self::STATUS_UPCOMING,
			);
		}

		return $list;
	}

	/**
	 * Wire up the dashboard. Called once from src/Admin/Dashboard/bootstrap.php.
	 * Kept as an explicit init rather than constructor side effects, so that
	 * reading module state elsewhere never has menu/enqueue side effects.
	 */
	public static function init() {
		$instance = new self();

		// Frontend: the site owner's Custom JS, saved from the Settings tab.
		add_action( 'wp_footer', array( $instance, 'print_custom_js' ) );

		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_menu', array( $instance, 'register_menu' ), 9 );
		add_action( 'admin_menu', array( $instance, 'reorder_menu' ), 999 );
		add_action( 'admin_head', array( $instance, 'print_menu_styles' ) );
		add_action( 'admin_footer', array( $instance, 'print_menu_script' ) );
		add_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_assets' ) );
		add_action( 'wp_ajax_wpcp_dashboard_save_options', array( $instance, 'ajax_save_options' ) );
		add_action( 'wp_ajax_wpcp_dashboard_get_options', array( $instance, 'ajax_get_options' ) );
		add_action( 'wp_ajax_wpcpf_flush_cache', array( $instance, 'ajax_flush_cache' ) );
		add_action( 'wp_ajax_wpcpf_changelog_data', array( $instance, 'ajax_changelog_data' ) );
		add_action( 'wpcf_options_before', array( $instance, 'render_back_to_settings_link' ) );
		// Late enough to win over Classic's own callbacks on the same two filters.
		add_filter( 'admin_footer_text', array( $instance, 'remove_classic_footer_text' ), 99 );
		add_filter( 'update_footer', array( $instance, 'remove_classic_footer_text' ), 99 );
		add_action( 'admin_head', array( $instance, 'hide_wp_admin_footer' ), 999 );
	}

	/**
	 * Register the Getting Started, Settings (link-only) and Lite vs Pro
	 * submenus under the carousel post type's own top-level menu.
	 */
	public function register_menu() {
		$cap  = apply_filters( 'wpcpf_ui_permission', 'manage_options' );
		$base = 'edit.php?post_type=sp_wp_carousel';

		add_submenu_page(
			$base,
			__( 'WP Carousel — Getting Started', 'wp-carousel-free' ),
			__( 'Getting Started', 'wp-carousel-free' ),
			$cap,
			self::PAGE_SLUG_GETTING_STARTED,
			array( $this, 'render_getting_started_page' )
		);

		// Link-only: hash route into the Getting Started SPA's Settings tab.
		add_submenu_page(
			$base,
			__( 'Settings', 'wp-carousel-free' ),
			__( 'Settings', 'wp-carousel-free' ),
			$cap,
			$base . '&page=' . self::PAGE_SLUG_GETTING_STARTED . '#settings'
		);

		// Link-only, like Settings: Lite vs Pro is a tab inside the dashboard SPA.
		add_submenu_page(
			$base,
			__( 'Lite vs Pro', 'wp-carousel-free' ),
			'<span class="wpcpf-menu-lite-vs-pro">' . esc_html__( 'Lite vs Pro', 'wp-carousel-free' ) . '</span>',
			$cap,
			$base . '&page=' . self::PAGE_SLUG_GETTING_STARTED . '#lite-vs-pro'
		);

		// A URL as the slug with no callback: WordPress prints the href verbatim,
		// so the status bar shows the pricing page on hover.
		add_submenu_page(
			$base,
			__( 'Upgrade to Pro', 'wp-carousel-free' ),
			'<span class="wpcpf-menu-upgrade"><span class="wpcpf-menu-upgrade-icon" aria-hidden="true"></span>' . esc_html__( 'Upgrade to Pro', 'wp-carousel-free' ) . '</span>',
			$cap,
			self::upgrade_url()
		);
	}

	/**
	 * Reorder the submenu into Getting Started, All Carousels, Add New
	 * Carousel, Settings, Lite vs Pro, Upgrade to Pro — and keep only one
	 * "Settings" row visible: the classic page while it is open (needed for
	 * the WordPress admin title), the dashboard hash link otherwise.
	 */
	public function reorder_menu() {
		global $submenu;

		$menu_key            = 'edit.php?post_type=sp_wp_carousel';
		$page                = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the current screen, not acting on it.
		$on_classic_settings = ( 'wpcp_settings' === $page );
		$settings_slug       = $menu_key . '&page=' . self::PAGE_SLUG_GETTING_STARTED . '#settings';

		if ( empty( $submenu[ $menu_key ] ) ) {
			return;
		}

		if ( ! $on_classic_settings ) {
			remove_submenu_page( $menu_key, 'wpcp_settings' );
		}

		$indexed = array();
		foreach ( $submenu[ $menu_key ] as $item ) {
			$indexed[ $item[2] ] = $item;
		}

		$leading_items = array(
			self::PAGE_SLUG_GETTING_STARTED,
			'edit.php?post_type=sp_wp_carousel',
			'post-new.php?post_type=sp_wp_carousel',
		);

		$new_menu = array();
		foreach ( $leading_items as $slug ) {
			if ( isset( $indexed[ $slug ] ) ) {
				$new_menu[] = $indexed[ $slug ];
				unset( $indexed[ $slug ] );
			}
		}

		if ( $on_classic_settings ) {
			$settings_item = isset( $indexed['wpcp_settings'] ) ? $indexed['wpcp_settings'] : null;
			unset( $indexed['wpcp_settings'], $indexed[ $settings_slug ] );
		} else {
			$settings_item = isset( $indexed[ $settings_slug ] ) ? $indexed[ $settings_slug ] : null;
			unset( $indexed[ $settings_slug ] );
		}

		$trailing_items = array(
			$menu_key . '&page=' . self::PAGE_SLUG_GETTING_STARTED . '#lite-vs-pro',
			self::upgrade_url(),
		);
		$trailing       = array();
		foreach ( $trailing_items as $slug ) {
			if ( isset( $indexed[ $slug ] ) ) {
				$trailing[] = $indexed[ $slug ];
				unset( $indexed[ $slug ] );
			}
		}

		if ( $settings_item ) {
			$new_menu[] = $settings_item;
		}

		foreach ( $indexed as $item ) {
			$new_menu[] = $item;
		}

		foreach ( $trailing as $item ) {
			$new_menu[] = $item;
		}

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Intentional reorder, same pattern as Pro/Easy Accordion Pro.
		$submenu[ $menu_key ] = $new_menu;
	}

	/**
	 * Pricing page URL, filtered with the same hook the block upsell reads.
	 *
	 * @return string Upgrade URL.
	 */
	public static function upgrade_url() {
		return (string) apply_filters( 'wpcpf_blocks_upgrade_url', self::UPGRADE_URL );
	}

	/**
	 * Inline styles for the two custom-styled menu rows. Every selector is
	 * either one of this plugin's own classes or its own upgrade href, so
	 * nothing else in wp-admin is touched. The menu renders on every admin
	 * screen, so these are printed everywhere, not only on the plugin's pages.
	 */
	public function print_menu_styles() {
		// The browser decodes the rendered href, so the selector matches the raw URL.
		$upgrade_href = str_replace( array( '"', '\\' ), '', esc_url_raw( self::upgrade_url() ) );

		printf(
			'<style>
			#adminmenu .wpcpf-menu-lite-vs-pro {
				color: #f0b849;
				font-weight: 600;
			}
			#adminmenu .wp-submenu li > a[href="%2$s"] {
				display: block;
				box-sizing: border-box;
				margin: 6px;
				padding: 8px 20px;
				background: #4ab866;
				border-radius: 4px;
			}
			#adminmenu .wp-submenu li > a[href="%2$s"]:hover,
			#adminmenu .wp-submenu li > a[href="%2$s"]:focus {
				background: #429e58;
				border-radius: 4px;
				box-shadow: none;
				color: #fff;
			}
			#adminmenu .wp-submenu li > a[href="%2$s"]:focus-visible {
				outline: 2px solid #fff;
				outline-offset: -2px;
			}
			#adminmenu .wpcpf-menu-upgrade {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 6px;
				color: #fff;
				font-size: 13px;
				font-weight: 600;
				line-height: 20px;
				white-space: nowrap;
			}
			#adminmenu .wpcpf-menu-upgrade-icon {
				flex: 0 0 auto;
				width: 14px;
				height: 17px;
				background: url(%1$s) no-repeat center / contain;
			}
			</style>',
			esc_url( WPCAROUSELF_URL . 'src/Admin/img/icon-crown.svg' ),
			$upgrade_href // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized above with esc_url_raw(); esc_url() would entity-encode the URL and break the CSS attribute selector.
		);
	}

	/**
	 * Open the upgrade menu link in a new tab. WordPress has no way to set an
	 * attribute on a submenu anchor, and the menu markup is already parsed by
	 * the time the footer prints.
	 */
	public function print_menu_script() {
		printf(
			'<script>(function(){var u=%s,l=document.querySelectorAll(\'#adminmenu .wp-submenu a\');for(var i=0;i<l.length;i++){if(l[i].getAttribute(\'href\')===u){l[i].target=\'_blank\';l[i].rel=\'noopener noreferrer\';}}})();</script>',
			wp_json_encode( esc_url_raw( self::upgrade_url() ) ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON-encoded URL, safe as a JS string literal.
		);
	}

	/**
	 * Print a link from the classic settings page back to the new dashboard's
	 * Settings tab. The options framework fires this hook on every page it
	 * builds, so only the classic settings page prints the link.
	 */
	public function render_back_to_settings_link() {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the current screen, not acting on it.

		if ( 'wpcp_settings' !== $page ) {
			return;
		}

		$icon = '<span class="wpcpf-back-to-settings-icon"><svg width="13.4" height="11.4" viewBox="0 0 13.4 11.4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M0.7 3.7H10.7C11.8046 3.7 12.7 4.59543 12.7 5.7V10.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.7 6.7L0.7 3.7L3.7 0.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

		echo '<style>
			.wpcpf-back-to-settings {
				display: inline-flex;
				align-items: center;
				gap: 5px;
				margin: 20px 0 16px;
				color: #2f2f2f;
				font-size: 14px;
				font-weight: 500;
				line-height: 20px;
				text-decoration: none;
			}
			.wpcpf-back-to-settings:hover,
			.wpcpf-back-to-settings:focus {
				color: #19949e;
				box-shadow: none;
			}
			.wpcpf-back-to-settings-icon {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 14px;
				height: 14px;
				flex-shrink: 0;
			}
			.wpcpf-back-to-settings-icon svg {
				display: block;
				flex-shrink: 0;
			}
		</style>';

		printf(
			'<a class="wpcpf-back-to-settings" href="%1$s">%2$s%3$s</a>',
			esc_url( admin_url( 'edit.php?post_type=sp_wp_carousel&page=' . self::PAGE_SLUG_GETTING_STARTED . '#settings' ) ),
			$icon, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static inline SVG.
			esc_html__( 'Back to Settings', 'wp-carousel-free' )
		);
	}

	/**
	 * Getting Started page callback: wrapper only, React mounts into it.
	 */
	public function render_getting_started_page() {
		echo '<div id="wpcpf-admin-dashboard-wrapper" class="wpcpf-admin-dashboard-wrapper"></div>';
	}

	/**
	 * Enqueue the dashboard bundle, screen-gated to the dashboard page and only
	 * if a build actually exists — register nothing rather than a broken page,
	 * same rule the block module's own bootstrap follows.
	 */
	public function enqueue_assets() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || 'sp_wp_carousel_page_' . self::PAGE_SLUG_GETTING_STARTED !== $screen->id ) {
			return;
		}

		$script_path           = WPCAROUSELF_PATH . 'assets/dashboard/index.js';
		$style_path            = WPCAROUSELF_PATH . 'assets/dashboard/style-index.css';
		$components_style_path = WPCAROUSELF_PATH . 'assets/dashboard/index.css';
		if ( ! file_exists( $script_path ) ) {
			return;
		}

		$dependencies = array( 'wp-element', 'wp-i18n', 'wp-components' );
		$asset_file   = WPCAROUSELF_PATH . 'assets/dashboard/index.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset = require $asset_file;
			if ( ! empty( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ) {
				$dependencies = $asset['dependencies'];
			}
		}

		$css_editor_settings = wp_enqueue_code_editor(
			array(
				'type'       => 'text/css',
				'codemirror' => array(
					'mode' => 'css',
					'lint' => true,
				),
			)
		);
		$js_editor_settings  = wp_enqueue_code_editor( array( 'type' => 'text/javascript' ) );
		if ( false !== $css_editor_settings || false !== $js_editor_settings ) {
			$dependencies = array_merge( $dependencies, array( 'wp-codemirror', 'code-editor' ) );
		}

		wp_enqueue_script(
			'wpcpf-admin-dashboard',
			WPCAROUSELF_URL . 'assets/dashboard/index.js',
			$dependencies,
			WPCAROUSELF_VERSION,
			true
		);
		wp_set_script_translations( 'wpcpf-admin-dashboard', 'wp-carousel-free', WPCAROUSELF_PATH . 'languages' );

		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				'wpcpf-admin-dashboard',
				WPCAROUSELF_URL . 'assets/dashboard/style-index.css',
				array(),
				WPCAROUSELF_VERSION
			);
		}

		// Styles the shared inspector controls import for themselves; the module
		// settings drawer reuses those controls, so the dashboard needs them too.
		if ( file_exists( $components_style_path ) ) {
			wp_enqueue_style(
				'wpcpf-admin-dashboard-components',
				WPCAROUSELF_URL . 'assets/dashboard/index.css',
				array( 'wpcpf-admin-dashboard' ),
				WPCAROUSELF_VERSION
			);
		}

		$current_user         = wp_get_current_user();
		$classic_settings_url = admin_url( 'edit.php?post_type=sp_wp_carousel&page=wpcp_settings' );
		wp_localize_script(
			'wpcpf-admin-dashboard',
			'wpcpfDashboard',
			array(
				'pluginUrl'          => WPCAROUSELF_URL,
				'pluginVersion'      => WPCAROUSELF_VERSION,
				'homeUrl'            => home_url( '/' ),
				'adminUrl'           => admin_url( '/' ),
				'ajaxUrl'            => admin_url( 'admin-ajax.php' ),
				'nonce'              => wp_create_nonce( self::NONCE_KEY ),
				'getOptions'         => $this->get_options_for_js(),
				'postType'           => 'sp_wp_carousel',
				'blockEditorReady'   => $this->block_editor_is_available(),
				'current_user'       => $current_user->display_name ?? '',
				'recommendedPlugins' => $this->get_recommended_plugins(),
				'canEditCustomJs'    => current_user_can( 'unfiltered_html' ),
				'classicSettingsUrl' => $classic_settings_url,
				// The options framework names each tab after its translated title, so the
				// hash is built the same way to keep the link working in any locale.
				'classicToolsUrl'    => $classic_settings_url . '#tab=' . sanitize_title( __( 'Tools', 'wp-carousel-free' ) ),
				'codeEditor'         => array(
					'css' => false !== $css_editor_settings ? $css_editor_settings : null,
					'js'  => false !== $js_editor_settings ? $js_editor_settings : null,
				),
			)
		);

		// The Lightbox module drawer's icon grid reads the same icon library the
		// block inspector does, so it needs the same REST handle here.
		wp_localize_script(
			'wpcpf-admin-dashboard',
			'wpcpIconLibraryConfig',
			array(
				'nonce'        => wp_create_nonce( 'wp_rest' ),
				'iconListPath' => '/wpcp/v2/icon-list',
			)
		);
	}

	/**
	 * Whether a new page would open in the block editor with our blocks registered.
	 * Mirrors the guards in src/Blocks/bootstrap.php.
	 *
	 * @return bool
	 */
	private function block_editor_is_available() {

		if ( version_compare( $GLOBALS['wp_version'], '5.8', '<' ) ) {
			return false;
		}

		if ( ! file_exists( WPCAROUSELF_PATH . 'assets/editor/index.asset.php' ) ) {
			return false;
		}

		if ( ! function_exists( 'use_block_editor_for_post_type' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}

		return use_block_editor_for_post_type( 'page' );
	}

	/**
	 * Other ShapedPlugin free plugins, for the Getting Started page's
	 * "Recommended" grid. Read-only (name, description, icon, WordPress.org
	 * link) — no install/activate actions, so no plugin-management capability
	 * surface is needed beyond `manage_options`, already required to see this
	 * page at all. Cached for a day to avoid a wp.org API round trip on every
	 * page load.
	 *
	 * @return array<int, array<string, string>>
	 */
	private function get_recommended_plugins() {
		$cached = get_transient( 'wpcpf_recommended_plugins' );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		if ( ! function_exists( 'plugins_api' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		}

		$response = plugins_api(
			'query_plugins',
			array(
				'author'   => 'shapedplugin',
				'per_page' => 20,
				'fields'   => array(
					'icons'             => true,
					'short_description' => true,
				),
			)
		);

		$plugins = array();
		if ( ! is_wp_error( $response ) && ! empty( $response->plugins ) ) {
			foreach ( $response->plugins as $plugin ) {
				if ( 'wp-carousel-free' === $plugin['slug'] ) {
					continue;
				}
				$plugins[] = array(
					'name'        => wp_strip_all_tags( $plugin['name'] ),
					'description' => wp_strip_all_tags( $plugin['short_description'] ),
					'icon'        => $plugin['icons']['1x'] ?? $plugin['icons']['default'] ?? '',
					'link'        => 'https://wordpress.org/plugins/' . $plugin['slug'] . '/',
				);
			}
		}

		set_transient( 'wpcpf_recommended_plugins', $plugins, DAY_IN_SECONDS );

		return $plugins;
	}

	/**
	 * Options handed to React. Deliberately smaller than Pro's: no license,
	 * saved-template or carousel lists.
	 *
	 * @return array
	 */
	private function get_options_for_js() {
		return array(
			'pluginSettings'    => get_option( self::OPTION_PLUGIN_SETTINGS, array() ),
			'blockVisibility'   => $this->get_block_visibility_list(),
			'modulesOptions'    => $this->get_modules_list(),
			'extensionSettings' => Module_Settings_Helper::get_all_for_js(),
			'integrations'      => $this->get_integrations_list(),
			'diagnosticConsent' => Diagnostics::has_consent(),
		);
	}

	/**
	 * Page builder integrations, in card order. An integration with no stored
	 * value is on, matching Manager. Whether the builder is actually installed is
	 * Manager's business, not the card's — every card is switchable either way,
	 * so the preference is already stored when a builder is installed later.
	 *
	 * @return array
	 */
	private function get_integrations_list() {
		$stored = get_option( self::OPTION_INTEGRATIONS, array() );
		$stored = is_array( $stored ) ? $stored : array();
		$list   = array();

		foreach ( Manager::BUILDERS as $slug ) {
			$list[] = array(
				'key'       => $slug,
				'is_active' => ! isset( $stored[ $slug ]['is_active'] ) || (bool) $stored[ $slug ]['is_active'],
			);
		}

		return $list;
	}

	/**
	 * AJAX: save Settings-page options into Classic's own settings option.
	 */
	public function ajax_save_options() {
		if ( ! current_user_can( apply_filters( 'wpcpf_ui_permission', 'manage_options' ) ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'wp-carousel-free' ) ), 403 );
		}
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), self::NONCE_KEY ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid nonce.', 'wp-carousel-free' ) ) );
		}

		$raw  = isset( $_POST['data'] ) ? wp_unslash( $_POST['data'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- decoded and sanitized field-by-field below.
		$data = is_string( $raw ) ? json_decode( $raw, true ) : $raw;
		if ( ! is_array( $data ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid data.', 'wp-carousel-free' ) ) );
		}

		if ( isset( $data['sp_wpcp_settings'] ) && is_array( $data['sp_wpcp_settings'] ) ) {
			$incoming  = $data['sp_wpcp_settings'];
			$sanitized = array();
			if ( isset( $incoming['wpcf_delete_all_data'] ) ) {
				$sanitized['wpcf_delete_all_data'] = ! empty( $incoming['wpcf_delete_all_data'] ) ? '1' : '0';
			}
			if ( isset( $incoming['wpcp_use_cache'] ) ) {
				$sanitized['wpcp_use_cache'] = ! empty( $incoming['wpcp_use_cache'] ) ? '1' : '0';
				// Switching caching off must drop whatever is already stored,
				// otherwise stale entries keep serving until they expire.
				if ( '0' === $sanitized['wpcp_use_cache'] ) {
					Cache::flush();
				}
			}
			if ( isset( $incoming['wpcp_custom_css'] ) ) {
				// Classic echoes this option raw inside a <style> element, so strip only
				// the sequences that can break out of one. Not wp_strip_all_tags, which
				// would mangle legitimate CSS containing a bare "<".
				$sanitized['wpcp_custom_css'] = Lightbox_Icon_Helper::sanitize_dynamic_css( (string) $incoming['wpcp_custom_css'] );
			}
			// Printed verbatim inside a <script> by print_custom_js(), so it needs the
			// same capability core requires for raw markup. `manage_options` alone would
			// hand a multisite site admin the script access unfiltered_html denies them.
			// The key is skipped rather than blanked, so a value an authorized user saved
			// survives a save by someone without the capability.
			if ( isset( $incoming['wpcp_custom_js'] ) && current_user_can( 'unfiltered_html' ) ) {
				$sanitized['wpcp_custom_js'] = (string) $incoming['wpcp_custom_js'];
			}

			$current = get_option( self::OPTION_PLUGIN_SETTINGS, array() );
			if ( ! is_array( $current ) ) {
				$current = array();
			}
			update_option( self::OPTION_PLUGIN_SETTINGS, array_merge( $current, $sanitized ) );
		}

		// Only Free's own block slugs are storable — merging is additive, so
		// accepting arbitrary keys would let a caller grow this option without
		// bound. Pro teasers carry no toggle and are rejected here too.
		if ( isset( $data['blockVisibility'] ) && is_array( $data['blockVisibility'] ) ) {
			$known   = array( 'carousel', 'slider', 'thumbnails-slider', 'tiles' );
			$by_name = array();
			foreach ( $data['blockVisibility'] as $item ) {
				if ( empty( $item['name'] ) ) {
					continue;
				}
				$slug = sanitize_key( $item['name'] );
				if ( in_array( $slug, $known, true ) ) {
					$by_name[ $slug ] = ! empty( $item['show'] );
				}
			}
			if ( ! empty( $by_name ) ) {
				$stored = get_option( self::OPTION_BLOCK_VISIBILITY, array() );
				update_option( self::OPTION_BLOCK_VISIBILITY, array_merge( is_array( $stored ) ? $stored : array(), $by_name ) );
			}
		}

		if ( isset( $data['modulesOptions'] ) && is_array( $data['modulesOptions'] ) ) {
			$known   = array( 'lightbox', 'ready-patterns', 'saved-templates' );
			$by_name = array();
			foreach ( $data['modulesOptions'] as $item ) {
				if ( empty( $item['module_name'] ) ) {
					continue;
				}
				$slug = sanitize_key( $item['module_name'] );
				if ( in_array( $slug, $known, true ) ) {
					$by_name[ $slug ] = ! empty( $item['show'] );
				}
			}
			if ( ! empty( $by_name ) ) {
				$stored = get_option( self::OPTION_MODULES, array() );
				update_option( self::OPTION_MODULES, array_merge( is_array( $stored ) ? $stored : array(), $by_name ) );
				self::$modules_cache = null;
			}
		}

		// Only the builders the Integrations tab offers are storable — merging is
		// additive, so accepting arbitrary keys would let a caller grow this
		// option without bound.
		if ( isset( $data['integrations'] ) && is_array( $data['integrations'] ) ) {
			$by_key = array();
			foreach ( $data['integrations'] as $item ) {
				if ( empty( $item['key'] ) ) {
					continue;
				}
				$slug = sanitize_key( $item['key'] );
				if ( in_array( $slug, Manager::BUILDERS, true ) ) {
					$by_key[ $slug ] = array( 'is_active' => ! empty( $item['is_active'] ) );
				}
			}
			if ( ! empty( $by_key ) ) {
				$stored = get_option( self::OPTION_INTEGRATIONS, array() );
				update_option( self::OPTION_INTEGRATIONS, array_merge( is_array( $stored ) ? $stored : array(), $by_key ) );
			}
		}

		// Diagnostics consent lives in its own option, not in sp_wpcp_settings,
		// so it is handled outside the block above.
		if ( isset( $data['diagnosticConsent'] ) ) {
			Diagnostics::set_consent( ! empty( $data['diagnosticConsent'] ) );
		}

		// Per-module drawer settings. The helper's own slug allow-list and
		// per-module sanitizer are the boundary — anything else is discarded.
		if ( isset( $data['extensionSettings'] ) && is_array( $data['extensionSettings'] ) ) {
			Module_Settings_Helper::sanitize_and_save( $data['extensionSettings'] );
		}

		wp_send_json_success( array( 'getOptions' => $this->get_options_for_js() ) );
	}

	/**
	 * AJAX: drop every cached carousel item list.
	 */
	public function ajax_flush_cache() {
		if ( ! current_user_can( apply_filters( 'wpcpf_ui_permission', 'manage_options' ) ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'wp-carousel-free' ) ), 403 );
		}
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), self::NONCE_KEY ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid nonce.', 'wp-carousel-free' ) ) );
		}

		Cache::flush();

		wp_send_json_success();
	}

	/**
	 * AJAX: the plugin's changelog, for the dashboard header drawer.
	 */
	public function ajax_changelog_data() {
		if ( ! current_user_can( apply_filters( 'wpcpf_ui_permission', 'manage_options' ) ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'wp-carousel-free' ) ), 403 );
		}
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), self::NONCE_KEY ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid nonce.', 'wp-carousel-free' ) ) );
		}

		wp_send_json_success( array( 'changelog' => $this->get_changelog() ) );
	}

	/**
	 * The changelog section of this plugin's WordPress.org listing, cached for a
	 * day. Free reads wp.org rather than a store API because that listing is the
	 * canonical record of what shipped here.
	 *
	 * @return string Changelog HTML, or an empty string when wp.org is unreachable.
	 */
	private function get_changelog() {
		$cached = get_transient( self::CHANGELOG_TRANSIENT );
		if ( is_string( $cached ) && '' !== $cached ) {
			return $cached;
		}

		if ( ! function_exists( 'plugins_api' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		}

		$response = plugins_api(
			'plugin_information',
			array(
				'slug'   => 'wp-carousel-free',
				'fields' => array( 'sections' => true ),
			)
		);

		if ( is_wp_error( $response ) || empty( $response->sections['changelog'] ) ) {
			return '';
		}

		$changelog = wp_kses_post( $response->sections['changelog'] );
		set_transient( self::CHANGELOG_TRANSIENT, $changelog, DAY_IN_SECONDS );

		return $changelog;
	}

	/**
	 * AJAX: re-read options (for refresh after save).
	 */
	public function ajax_get_options() {
		if ( ! current_user_can( apply_filters( 'wpcpf_ui_permission', 'manage_options' ) ) ) {
			wp_send_json_error( array(), 403 );
		}
		if ( ! isset( $_REQUEST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_REQUEST['nonce'] ) ), self::NONCE_KEY ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- verified on the line above.
			wp_send_json_error( array() );
		}
		wp_send_json_success( array( 'getOptions' => $this->get_options_for_js() ) );
	}

	/**
	 * Whether the current screen belongs to this plugin.
	 *
	 * @return bool
	 */
	private function is_plugin_screen() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( $screen && 'sp_wp_carousel' === $screen->post_type ) {
			return true;
		}

		// Fallback for any request that reaches a dashboard page without
		// post_type in the query, where the screen carries no post type.
		return $this->is_dashboard_page();
	}

	/**
	 * Whether the current request is one of the dashboard SPA pages, read from
	 * the query rather than the screen.
	 *
	 * @return bool
	 */
	private function is_dashboard_page() {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the current screen, not acting on it.
		return in_array( $page, array( self::PAGE_SLUG_GETTING_STARTED, self::PAGE_SLUG_LITE_VS_PRO ), true );
	}

	/**
	 * Drop Classic's admin-footer review notice and version string on this
	 * plugin's screens, which the dashboard's own footer now carries.
	 *
	 * Classic registers both filters from admin/class-wp-carousel-free-admin.php
	 * and that file is frozen, so this runs later and blanks the result rather
	 * than unhooking a callback whose object handle we do not have.
	 *
	 * @param string $text Incoming footer text.
	 * @return string
	 */
	public function remove_classic_footer_text( $text ) {
		return $this->is_plugin_screen() ? '' : $text;
	}

	/**
	 * Hide core's now-empty #wpfooter on this plugin's screens, so blanking the
	 * text above does not leave a bare strip below the dashboard footer.
	 *
	 * On the dashboard screen the wrapper's own footer sits at the bottom of a
	 * full-height flex column, so #wpbody-content's padding-bottom is zeroed too
	 * — otherwise 65px of empty space would keep the footer off the bottom edge.
	 * Classic's screens keep that padding: they have no footer of their own to
	 * close the gap.
	 */
	public function hide_wp_admin_footer() {
		if ( ! $this->is_plugin_screen() ) {
			return;
		}

		// !important, because the style tag prints before the admin stylesheets
		// enqueued on the same hook.
		$css    = '#wpfooter{display:none !important}';
		$screen = get_current_screen();
		if ( $this->is_dashboard_page() || ( $screen && 'sp_wp_carousel_page_' . self::PAGE_SLUG_GETTING_STARTED === $screen->id ) ) {
			$css .= '#wpbody-content{padding-bottom:0}';
		}

		printf( '<style id="wpcpf-hide-wp-footer">%s</style>', $css ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static CSS literal.
	}

	/**
	 * Echo the site owner's Custom JS. This is new, independent of Classic's
	 * existing Custom CSS output in public/class-wp-carousel-free-public.php —
	 * that file is frozen and untouched by this feature.
	 */
	public function print_custom_js() {
		$settings = get_option( self::OPTION_PLUGIN_SETTINGS, array() );
		if ( empty( $settings['wpcp_custom_js'] ) ) {
			return;
		}

		printf(
			'<script id="wpcpf-custom-js">%s</script>',
			$settings['wpcp_custom_js'] // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted admin-authored JS, same trust level as Classic's own Custom CSS field; capability + nonce gated on save.
		);
	}
}
