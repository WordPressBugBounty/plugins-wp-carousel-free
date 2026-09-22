<?php
/**
 * Block module assets.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Dashboard;
use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Saved_Templates;
use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules\Lightbox_Settings;
use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules\Module_Settings_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Registers and enqueues the block module's scripts and styles.
 *
 * Handles are `wpcpf-` prefixed; Classic owns `wpcf-*` and never overlaps.
 */
final class AssetManager {

	/**
	 * Editor script and style handle.
	 */
	const EDITOR = 'wpcpf-blocks-editor';

	/**
	 * Shared editor and frontend stylesheet handle.
	 */
	const BASE_STYLE = 'wpcpf-blocks-base-style';

	/**
	 * Frontend runtime handle.
	 */
	const FRONTEND = 'wpcpf-blocks-frontend';

	/**
	 * Vendored Swiper script handle.
	 */
	const SWIPER = 'wpcpf-blocks-swiper';

	/**
	 * Vendored Swiper style handle.
	 */
	const SWIPER_STYLE = 'wpcpf-blocks-swiper-style';

	/**
	 * Block lightbox handles — Fancybox 5, separate from Classic's Fancybox v3.
	 *
	 * @var string
	 */
	const FANCYBOX           = 'wpcpf-blocks-fancybox';
	const FANCYBOX_STYLE     = 'wpcpf-blocks-fancybox-style';
	const LIGHTBOX_GLOBAL    = 'wpcpf-blocks-lightbox-global';
	const LIGHTBOX_EXTENSION = 'wpcpf-blocks-lightbox-extension';

	/**
	 * Singleton instance.
	 *
	 * @var AssetManager|null
	 */
	private static $instance = null;

	/**
	 * Whether the frontend bundle is already enqueued this request.
	 *
	 * @var bool
	 */
	private $frontend_enqueued = false;

	/**
	 * Whether the frontend handles are already registered this request.
	 *
	 * @var bool
	 */
	private $frontend_registered = false;

	/**
	 * Conditionally-built stylesheets, as chunk key to built file name.
	 *
	 * The wp-scripts build prefixes the extracted CSS of an entry that imports
	 * a file literally named style.scss — hence `style-thumbnails-slider`.
	 *
	 * @var array<string,string>
	 */
	const STYLE_CHUNKS = array(
		'thumbs'     => 'style-thumbnails-slider',
		'hover-anim' => 'hover-anim',
	);

	/**
	 * Memoized asset versions, keyed by relative path.
	 *
	 * @var array<string,string>
	 */
	private $asset_versions = array();

	/**
	 * Retrieve the singleton.
	 *
	 * @return AssetManager
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Read a generated wp-scripts asset manifest.
	 *
	 * @param string   $relative_path Path relative to the plugin root.
	 * @param string[] $fallback_deps Dependencies to use when the file is absent.
	 * @return array{dependencies:string[],version:string}
	 */
	private function asset_manifest( $relative_path, array $fallback_deps = array() ) {
		$path = WPCAROUSELF_PATH . $relative_path;

		if ( file_exists( $path ) ) {
			$manifest = include $path;

			if ( is_array( $manifest ) ) {
				return array(
					'dependencies' => isset( $manifest['dependencies'] ) ? (array) $manifest['dependencies'] : $fallback_deps,
					'version'      => isset( $manifest['version'] ) ? (string) $manifest['version'] : WPCAROUSELF_VERSION,
				);
			}
		}

		return array(
			'dependencies' => $fallback_deps,
			'version'      => WPCAROUSELF_VERSION,
		);
	}

	/**
	 * Register the editor bundle.
	 *
	 * @return void
	 */
	public function register_editor_assets() {
		$asset = $this->asset_manifest(
			'assets/editor/index.asset.php',
			array( 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n' )
		);

		wp_register_script(
			self::EDITOR,
			WPCAROUSELF_URL . 'assets/editor/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		// Required for the JS __() calls to resolve.
		wp_set_script_translations( self::EDITOR, 'wp-carousel-free', WPCAROUSELF_PATH . 'languages' );

		wp_localize_script(
			self::EDITOR,
			'wpcpfBlocks',
			array(
				'pluginUrl'  => WPCAROUSELF_URL,
				'upgradeUrl' => apply_filters( 'wpcpf_blocks_upgrade_url', 'https://wpcarousel.io/pricing/?ref=1' ),
			)
		);

		// Every inspector icon picker reads this; without it the library never
		// loads and the share-row preview renders no icons.
		wp_localize_script(
			self::EDITOR,
			'wpcpIconLibraryConfig',
			array(
				'nonce'        => wp_create_nonce( 'wp_rest' ),
				'iconListPath' => '/wpcp/v2/icon-list',
				// Small social subset so the share row renders synchronously
				// instead of waiting on the full library fetch.
				'socialIcons'  => Rendering\SocialShareRenderer::get_social_icons(),
			)
		);

		// The lightbox inspector reads module state and the global lightbox
		// settings from here; without it every lightbox control reads as off.
		wp_localize_script(
			self::EDITOR,
			'wpcpBlockLocalize',
			array(
				'extensionModules'  => array(
					Lightbox_Settings::MODULE        => Dashboard::is_module_active( Lightbox_Settings::MODULE ),
					Saved_Templates::MODULE          => Dashboard::is_module_active( Saved_Templates::MODULE ),
					ReadyPatterns\Controller::MODULE => Dashboard::is_module_active( ReadyPatterns\Controller::MODULE ),
				),
				'extensionSettings' => $this->get_block_editor_extension_settings(),
				// Where the saved-template editor sidebar points for management.
				'savedTemplatesUrl' => admin_url(
					'edit.php?post_type=sp_wp_carousel&page=' . Dashboard::PAGE_SLUG_GETTING_STARTED . '#saved_templates'
				),
				// Where an inspector notice sends the author to switch a module on.
				'modulesUrl'        => admin_url(
					'edit.php?post_type=sp_wp_carousel&page=' . Dashboard::PAGE_SLUG_GETTING_STARTED . '#modules'
				),
				// Blocks switched off on the dashboard; the editor unregisters these.
				'disabledBlocks'    => BlockVisibility::get_disabled_block_names(),
				// Ready Patterns hides every entry point when `enabled` is false.
				'readyPatterns'     => array(
					'enabled'       => ReadyPatterns\PatternRepository::is_enabled(),
					'restBase'      => ReadyPatterns\PatternRepository::rest_base(),
					'pluginVersion' => WPCAROUSELF_VERSION,
					'modulesUrl'    => admin_url(
						'edit.php?post_type=sp_wp_carousel&page=' . Dashboard::PAGE_SLUG_GETTING_STARTED . '#modules'
					),
					'activePlugins' => array(
						'woocommerce' => class_exists( 'WooCommerce' ),
					),
				),
			)
		);

		if ( Dashboard::is_module_active( Lightbox_Settings::MODULE ) ) {
			wp_localize_script( self::EDITOR, 'wpcp_lightbox', Lightbox\Lightbox_Config::get_public_config() );
		}

		$this->register_style( self::EDITOR, 'assets/editor/index.css' );
		$this->register_style( self::BASE_STYLE, 'assets/editor/style-index.css' );
		$this->register_style( self::SWIPER_STYLE, 'assets/swiper/swiper-bundle.min.css' );
	}

	/**
	 * Register the frontend runtime and its vendored Swiper dependency.
	 *
	 * @return void
	 */
	public function register_frontend_assets() {
		// Called from every conditional-dependency path, so re-registering would
		// otherwise append the localized data object again.
		if ( $this->frontend_registered ) {
			return;
		}

		$this->frontend_registered = true;

		wp_register_script(
			self::SWIPER,
			WPCAROUSELF_URL . 'assets/swiper/swiper-bundle.min.js',
			array(),
			WPCAROUSELF_VERSION,
			true
		);

		$asset = $this->asset_manifest( 'assets/js/frontend.asset.php' );

		wp_register_script(
			self::FRONTEND,
			WPCAROUSELF_URL . 'assets/js/frontend.js',
			array_merge( array( self::SWIPER ), $asset['dependencies'] ),
			$asset['version'],
			true
		);

		// Route name matches Pro so a Free → Pro upgrade needs no editor change.
		wp_localize_script(
			self::FRONTEND,
			'wpcpBlocksAjax',
			array(
				'restUrl' => esc_url_raw( rest_url( 'wp-carousel-pro/v1/ajax-pagination' ) ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
			)
		);

		wp_set_script_translations( self::FRONTEND, 'wp-carousel-free', WPCAROUSELF_PATH . 'languages' );
	}

	/**
	 * Enqueue the editor bundle.
	 *
	 * @return void
	 */
	public function enqueue_editor_assets() {
		// enqueue_block_assets also fires on the front end.
		if ( ! is_admin() && ! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return;
		}

		wp_enqueue_script( self::EDITOR );
		wp_enqueue_style( self::EDITOR );
		wp_enqueue_style( self::SWIPER_STYLE );
		wp_enqueue_style( self::BASE_STYLE );

		// The editor cannot know which blocks an author will insert, so every
		// conditionally-built chunk is preloaded for the session.
		$this->enqueue_all_block_style_chunks();

		$this->maybe_enqueue_block_lightbox_assets();
	}

	/**
	 * Enqueue the frontend bundle, once per request.
	 *
	 * @return void
	 */
	public function enqueue_block_frontend_assets() {
		if ( $this->frontend_enqueued ) {
			return;
		}

		$this->frontend_enqueued = true;

		wp_enqueue_style( self::SWIPER_STYLE );
		wp_enqueue_style( self::BASE_STYLE );
		wp_enqueue_script( self::SWIPER );
		wp_enqueue_script( self::FRONTEND );
		$this->maybe_enqueue_block_lightbox_assets();
	}

	/**
	 * Extension settings for the block editor, with inactive modules omitted.
	 *
	 * @return array<string, mixed>
	 */
	private function get_block_editor_extension_settings() {
		$settings = Module_Settings_Helper::get_all_for_js();

		if ( ! Dashboard::is_module_active( Lightbox_Settings::MODULE ) ) {
			unset( $settings[ Lightbox_Settings::MODULE ] );
		}

		return $settings;
	}

	/**
	 * Register the block lightbox assets.
	 *
	 * Fancybox 5 under its own handles so Classic's Fancybox v3 is untouched.
	 *
	 * @return void
	 */
	public function register_block_lightbox_assets() {
		if ( wp_script_is( self::FANCYBOX, 'registered' ) ) {
			return;
		}

		if ( file_exists( WPCAROUSELF_PATH . 'assets/fancybox/fancybox.css' ) ) {
			wp_register_style(
				self::FANCYBOX_STYLE,
				WPCAROUSELF_URL . 'assets/fancybox/fancybox.css',
				array(),
				$this->asset_version( 'assets/fancybox/fancybox.css' ),
				'all'
			);
		}

		if ( file_exists( WPCAROUSELF_PATH . 'assets/fancybox/lightbox-extension.css' ) ) {
			wp_register_style(
				self::LIGHTBOX_EXTENSION,
				WPCAROUSELF_URL . 'assets/fancybox/lightbox-extension.css',
				array( self::FANCYBOX_STYLE ),
				$this->asset_version( 'assets/fancybox/lightbox-extension.css' ),
				'all'
			);
		}

		if ( file_exists( WPCAROUSELF_PATH . 'assets/fancybox/fancybox.js' ) ) {
			wp_register_script(
				self::FANCYBOX,
				WPCAROUSELF_URL . 'assets/fancybox/fancybox.js',
				array(),
				$this->asset_version( 'assets/fancybox/fancybox.js' ),
				true
			);
		}

		if ( file_exists( WPCAROUSELF_PATH . 'assets/fancybox/lightbox-global.js' ) ) {
			wp_register_script(
				self::LIGHTBOX_GLOBAL,
				WPCAROUSELF_URL . 'assets/fancybox/lightbox-global.js',
				array( self::FANCYBOX ),
				$this->asset_version( 'assets/fancybox/lightbox-global.js' ),
				true
			);
		}
	}

	/**
	 * Enqueue the block lightbox assets when the module is on.
	 *
	 * @return void
	 */
	public function maybe_enqueue_block_lightbox_assets() {
		if ( ! Dashboard::is_module_active( Lightbox_Settings::MODULE ) ) {
			return;
		}

		$this->register_block_lightbox_assets();

		if ( wp_style_is( self::FANCYBOX_STYLE, 'registered' ) ) {
			wp_enqueue_style( self::FANCYBOX_STYLE );
		}

		if ( wp_style_is( self::LIGHTBOX_EXTENSION, 'registered' ) ) {
			wp_enqueue_style( self::LIGHTBOX_EXTENSION );
		}

		if ( wp_script_is( self::FANCYBOX, 'registered' ) ) {
			wp_enqueue_script( self::FANCYBOX );
		}

		if ( wp_script_is( self::LIGHTBOX_GLOBAL, 'registered' ) ) {
			wp_enqueue_script( self::LIGHTBOX_GLOBAL );
		}
	}

	/**
	 * Cache-busting version for a built asset.
	 *
	 * @param string $relative_path Path relative to the plugin root.
	 * @return string
	 */
	public function asset_version( string $relative_path ): string {
		if ( isset( $this->asset_versions[ $relative_path ] ) ) {
			return $this->asset_versions[ $relative_path ];
		}

		$version = WPCAROUSELF_VERSION;

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$absolute_path = WPCAROUSELF_PATH . ltrim( $relative_path, '/' );

			if ( file_exists( $absolute_path ) ) {
				$version = (string) filemtime( $absolute_path );
			}
		}

		$this->asset_versions[ $relative_path ] = $version;

		return $version;
	}

	/**
	 * Register every style-chunk handle, skipping chunks that were not built.
	 *
	 * @return void
	 */
	public function register_block_style_chunks() {
		foreach ( self::STYLE_CHUNKS as $chunk_key => $file_name ) {
			$handle = 'wpcpf-blocks-chunk-' . $chunk_key;

			if ( wp_style_is( $handle, 'registered' ) ) {
				continue;
			}

			$relative_path = 'assets/style-chunks/' . $file_name . '.css';

			if ( ! file_exists( WPCAROUSELF_PATH . $relative_path ) ) {
				continue;
			}

			wp_register_style(
				$handle,
				WPCAROUSELF_URL . $relative_path,
				array(),
				$this->asset_version( $relative_path )
			);
		}
	}

	/**
	 * Enqueue the given style chunks.
	 *
	 * @param array<int,string> $chunk_keys Keys of self::STYLE_CHUNKS.
	 * @return void
	 */
	public function enqueue_block_style_chunks( array $chunk_keys ) {
		if ( empty( $chunk_keys ) ) {
			return;
		}

		$this->register_block_style_chunks();

		foreach ( array_unique( $chunk_keys ) as $chunk_key ) {
			$handle = 'wpcpf-blocks-chunk-' . $chunk_key;

			if ( wp_style_is( $handle, 'registered' ) ) {
				wp_enqueue_style( $handle );
			}
		}
	}

	/**
	 * Enqueue every style chunk an editor preview can still need.
	 *
	 * The editor cannot know which blocks an author will insert, so it loads the
	 * full set rather than a per-block signal.
	 *
	 * @return void
	 */
	public function enqueue_all_block_style_chunks() {
		$this->enqueue_block_style_chunks( array_keys( self::STYLE_CHUNKS ) );
	}

	/**
	 * Which style chunks a single block instance needs.
	 *
	 * Single source of the chunk signals, shared by the wp_enqueue_scripts block
	 * scan and the render-time backstop so the two can never disagree.
	 *
	 * @param string $block_name Full block name, e.g. `wp-carousel-pro/tiles`.
	 * @param array  $attributes Attributes merged over the schema defaults.
	 * @return array<int,string> Keys of self::STYLE_CHUNKS.
	 */
	public static function style_chunks_for_block( string $block_name, array $attributes ): array {
		// Re-applied here because the render-time backstops hand over raw
		// WP-merged attributes that never passed through BlockRenderer.
		$chunks = array();

		$carousel_style = isset( $attributes['layoutOptions']['carouselStyle'] )
			? (string) $attributes['layoutOptions']['carouselStyle']
			: '';

		if ( 'wp-carousel-pro/thumbnails-slider' === $block_name || 'thumbnails' === $carousel_style ) {
			$chunks[] = 'thumbs';
		}

		// Conservative union: a false positive costs one small stylesheet, a
		// false negative breaks an effect.
		$effects_options = isset( $attributes['effectsOptions'] ) && is_array( $attributes['effectsOptions'] )
			? $attributes['effectsOptions']
			: array();
		$effect_type     = isset( $effects_options['effectType'] ) ? (string) $effects_options['effectType'] : 'custom';
		$premade_active  = 'custom' !== $effect_type
			&& self::is_active_effect_value( $effects_options['animationEffect'] ?? '' );
		$overlay_active  = self::is_active_effect_value( $effects_options['overlayEffect'] ?? '' );

		$content_orientation = isset( $attributes['layoutOptions']['contentOrientation'] )
			? (string) $attributes['layoutOptions']['contentOrientation']
			: '';
		$hover_orientation   = in_array( $content_orientation, array( 'overlay', 'diagonal' ), true );
		$content_axis_active = $hover_orientation
			&& 'custom' === $effect_type
			&& self::is_active_effect_value( $effects_options['contentAnimation'] ?? '' );

		if ( $premade_active || $overlay_active || $content_axis_active ) {
			$chunks[] = 'hover-anim';
		}

		return $chunks;
	}

	/**
	 * Whether an effect attribute value is a real selection.
	 *
	 * @param mixed $value Attribute value.
	 * @return bool
	 */
	private static function is_active_effect_value( $value ): bool {
		return is_string( $value ) && '' !== $value && 'none' !== $value;
	}

	/**
	 * Re-assert the base stylesheet enqueue at the correct hook.
	 *
	 * Safe to call repeatedly; no-ops once the handles are enqueued.
	 *
	 * @return void
	 */
	public function ensure_block_base_styles_enqueued() {
		$this->register_frontend_assets();

		foreach ( array( self::SWIPER_STYLE, self::BASE_STYLE ) as $handle ) {
			if ( wp_style_is( $handle, 'registered' ) && ! wp_style_is( $handle, 'enqueued' ) ) {
				wp_enqueue_style( $handle );
			}
		}
	}

	/**
	 * Make the frontend bundle load after a conditional dependency.
	 *
	 * Only effective before enqueue_block_frontend_assets(); afterwards the
	 * registry mutation is a no-op and script order may break.
	 *
	 * @param string $handle Registered script handle to append.
	 * @return void
	 */
	public function ensure_frontend_script_depends_on( string $handle ) {
		$this->register_frontend_assets();

		global $wp_scripts;

		if ( ! isset( $wp_scripts->registered[ self::FRONTEND ] ) ) {
			return;
		}

		$deps = &$wp_scripts->registered[ self::FRONTEND ]->deps;

		if ( ! in_array( $handle, $deps, true ) ) {
			$deps[] = $handle;
		}
	}

	/**
	 * Register a stylesheet when the built file exists.
	 *
	 * @param string $handle        Style handle.
	 * @param string $relative_path Path relative to the plugin root.
	 * @return void
	 */
	private function register_style( $handle, $relative_path ) {
		if ( ! file_exists( WPCAROUSELF_PATH . $relative_path ) ) {
			return;
		}

		wp_register_style(
			$handle,
			WPCAROUSELF_URL . $relative_path,
			array(),
			WPCAROUSELF_VERSION
		);
	}
}
