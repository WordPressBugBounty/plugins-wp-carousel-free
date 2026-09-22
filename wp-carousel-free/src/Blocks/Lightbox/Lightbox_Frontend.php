<?php
/**
 * Frontend integration for global Lightbox extension settings.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Lightbox;

use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Dashboard;
use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules\Lightbox_Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Lightbox_Frontend class.
 */
class Lightbox_Frontend {

	/**
	 * Cached "is the lightbox active" answer for this request.
	 *
	 * @var bool|null
	 */
	private static $active_cache = null;

	/**
	 * Whether the config has already been attached this request.
	 *
	 * @var bool
	 */
	private $localized = false;

	/**
	 * Boot hooks.
	 *
	 * @return void
	 */
	public static function init() {
		if ( is_admin() ) {
			return;
		}

		$instance = new self();
		$instance->register_hooks();
	}

	/**
	 * Attach the frontend render and enqueue hooks.
	 *
	 * @return void
	 */
	private function register_hooks() {
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue_assets' ), 25 );
		add_action( 'wp_enqueue_scripts', array( $this, 'localize_fancybox_config' ), 100 );

		// Second pass for anything enqueued after `wp_enqueue_scripts` was done:
		// a page builder element or a shortcode rendering inside `the_content`.
		// Footer scripts have not printed yet at this point, so the config still
		// attaches. Runs before core's `_wp_footer_scripts` at 10.
		add_action( 'wp_print_footer_scripts', array( $this, 'localize_fancybox_config' ), 5 );
		add_filter( 'wpcp_should_enqueue_lightbox_assets', array( $this, 'filter_should_enqueue' ), 10, 1 );

		$wp_images = new Lightbox_Wp_Images();
		$wp_images->register();

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_extension_style_with_fancybox' ), 50 );
	}

	/**
	 * Load extension CSS whenever Fancybox is enqueued (blocks or WP images).
	 *
	 * @return void
	 */
	public function enqueue_extension_style_with_fancybox() {
		if ( ! self::is_lightbox_active() ) {
			return;
		}

		if ( wp_style_is( 'wpcpf-blocks-fancybox-style', 'enqueued' ) || wp_style_is( 'wpcpf-blocks-fancybox-style', 'done' ) ) {
			wp_enqueue_style( 'wpcpf-blocks-lightbox-extension' );
			if ( ! Lightbox_Icon_Helper::was_global_icon_css_emitted() ) {
				$css = Lightbox_Icon_Helper::build_global_icon_css();
				if ( '' !== $css ) {
					Lightbox_Icon_Helper::queue_icon_dynamic_css( $css );
					Lightbox_Icon_Helper::mark_global_icon_css_emitted();
				}
			}
		}
	}

	/**
	 * Whether lightbox extension is active and available on the frontend.
	 *
	 * @return bool
	 */
	public static function is_lightbox_active() {
		if ( null !== self::$active_cache ) {
			return self::$active_cache;
		}

		self::$active_cache = Dashboard::is_module_active( Lightbox_Settings::MODULE );
		return self::$active_cache;
	}

	/**
	 * Allow other code to request lightbox assets when extension is active.
	 *
	 * @param bool $enqueue Current decision.
	 * @return bool
	 */
	public function filter_should_enqueue( $enqueue ) {
		if ( $enqueue ) {
			return true;
		}
		return self::is_lightbox_active();
	}

	/**
	 * Enqueue Fancybox + scripts for WP core images when needed.
	 *
	 * @return void
	 */
	public function maybe_enqueue_assets() {
		if ( ! self::is_lightbox_active() ) {
			return;
		}

		$settings = Lightbox_Settings::get_settings();
		if ( empty( $settings['wpImagesEnable'] ) ) {
			return;
		}

		if ( ! $this->content_has_wp_image_blocks() ) {
			return;
		}

		$this->enqueue_lightbox_stack();
	}

	/**
	 * Attach config whenever fancybox scripts are enqueued.
	 *
	 * @return void
	 */
	public function localize_fancybox_config() {
		if ( $this->localized ) {
			return;
		}

		$handle = '';
		if ( wp_script_is( 'wpcpf-blocks-lightbox-global', 'enqueued' ) || wp_script_is( 'wpcpf-blocks-lightbox-global', 'done' ) ) {
			$handle = 'wpcpf-blocks-lightbox-global';
		} elseif ( wp_script_is( 'wpcpf-blocks-frontend', 'enqueued' ) || wp_script_is( 'wpcpf-blocks-frontend', 'done' ) ) {
			$handle = 'wpcpf-blocks-frontend';
		}

		if ( '' === $handle ) {
			return;
		}

		if ( ! self::is_lightbox_active() ) {
			return;
		}

		wp_localize_script(
			$handle,
			'wpcp_lightbox',
			Lightbox_Config::get_public_config()
		);

		$this->localized = true;
	}

	/**
	 * Register and enqueue shared lightbox assets.
	 *
	 * @return void
	 */
	public static function enqueue_lightbox_stack() {
		wp_enqueue_style( 'wpcpf-blocks-fancybox-style' );
		wp_enqueue_style( 'wpcpf-blocks-lightbox-extension' );
		wp_enqueue_script( 'wpcpf-blocks-fancybox' );
		wp_enqueue_script( 'wpcpf-blocks-lightbox-global' );
		wp_enqueue_script( 'wpcpf-blocks-frontend' );
	}

	/**
	 * Whether the queried content holds a core Image or Gallery block.
	 *
	 * @return bool
	 */
	private function content_has_wp_image_blocks() {
		if ( ! is_singular() ) {
			return true;
		}

		$post = get_post();
		if ( ! $post instanceof \WP_Post ) {
			return false;
		}

		return has_block( 'core/image', $post ) || has_block( 'core/gallery', $post );
	}
}
