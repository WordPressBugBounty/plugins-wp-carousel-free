<?php
/**
 * The plugin gutenberg block Initializer.
 *
 * @link       https://shapedplugin.com/
 * @since      2.4.1
 *
 * @package    WP_Carousel_Free
 * @subpackage WP_Carousel_Free/Admin
 * @author     ShapedPlugin <support@shapedplugin.com>
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'WP_Carousel_Free_Gutenberg_Block_Init' ) ) {
	/**
	 * WP_Carousel_Free_Gutenberg_Block_Init class.
	 */
	class WP_Carousel_Free_Gutenberg_Block_Init {
		/**
		 * Custom Gutenberg Block Initializer.
		 */
		public function __construct() {
			add_action( 'init', array( $this, 'sp_wp_carousel_free_gutenberg_shortcode_block' ) );
			add_action( 'enqueue_block_editor_assets', array( $this, 'sp_wp_carousel_free_block_editor_assets' ) );
			add_action( 'enqueue_block_assets', array( $this, 'sp_wp_carousel_free_block_canvas_assets' ) );
		}

		/**
		 * Register block editor script for backend.
		 *
		 * This only runs for the outer editor document. Since WordPress 6.3 the block
		 * canvas is an iframe and WordPress 7.1 iframes it unconditionally, so anything
		 * the rendered carousel needs is enqueued in
		 * `sp_wp_carousel_free_block_canvas_assets()` instead.
		 */
		public function sp_wp_carousel_free_block_editor_assets() {
			$asset_file = WPCAROUSELF_PATH . '/admin/GutenbergBlock/build/index.asset.php';
			$asset      = file_exists( $asset_file ) ? require $asset_file : array();

			$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array(
				'wp-block-editor',
				'wp-blocks',
				'wp-components',
				'wp-element',
				'wp-escape-html',
				'wp-i18n',
				'wp-server-side-render',
			);
			$version      = isset( $asset['version'] ) ? $asset['version'] : WPCAROUSELF_VERSION;

			wp_enqueue_script(
				'sp-wp-carousel-free-shortcode-block',
				plugins_url( '/GutenbergBlock/build/index.js', __DIR__ ),
				array_merge( $dependencies, array( 'jquery' ) ),
				$version,
				true
			);

			wp_localize_script(
				'sp-wp-carousel-free-shortcode-block',
				'sp_wp_carousel_free',
				array(
					'url'                => WPCAROUSELF_URL,
					'loadScript'         => WPCAROUSELF_URL . 'public/js/wp-carousel-free-public.min.js',
					'loadFancyBoxScript' => WPCAROUSELF_URL . 'public/js/fancybox-config.min.js',
					'link'               => admin_url( 'post-new.php?post_type=sp_wp_carousel' ),
					'shortCodeList'      => $this->sp_wp_carousel_free_post_list(),
				)
			);

			/**
			 * Register block editor css file enqueue for backend.
			 *
			 * Kept for WordPress versions that still render the canvas in the same
			 * document as the editor chrome.
			 */
			wp_enqueue_style( 'wpcf-swiper' );
			wp_enqueue_style( 'wp-carousel-free-fontawesome' );
			wp_enqueue_style( 'wp-carousel-free' );
			wp_enqueue_style( 'wpcf-fancybox-popup' );
		}

		/**
		 * Enqueue the carousel front-end assets for the block editor canvas.
		 *
		 * `enqueue_block_editor_assets` only reaches the outer editor document, while
		 * WordPress collects `enqueue_block_assets` output for the iframed canvas in
		 * `_wp_get_iframed_editor_assets()`. Registering them here is what puts the
		 * carousel CSS, Swiper and the lightbox in the same document as the markup
		 * `ServerSideRender` renders.
		 *
		 * The front end is untouched: there the shortcode keeps enqueueing assets on
		 * demand.
		 *
		 * @since 2.7.13
		 */
		public function sp_wp_carousel_free_block_canvas_assets() {
			if ( ! is_admin() ) {
				return;
			}

			wp_enqueue_style( 'wpcf-swiper' );
			wp_enqueue_style( 'wp-carousel-free-fontawesome' );
			wp_enqueue_style( 'wp-carousel-free' );
			wp_enqueue_style( 'wpcf-fancybox-popup' );

			wp_enqueue_script( 'wpcf-swiper-js' );
			wp_enqueue_script( 'wpcf-swiper-config' );
			wp_enqueue_script( 'wpcf-fancybox-popup' );
			wp_enqueue_script( 'wpcf-fancybox-config' );
			wp_enqueue_script( 'wpcp-preloader' );

			// The admin stylesheet is not loaded inside the canvas, so the block
			// placeholder select needs its own rules there.
			wp_add_inline_style(
				'wp-carousel-free',
				'.spwpcf-gutenberg-shortcode{padding:0;line-height:24px}.spwpcf-gutenberg-shortcode select.spwpcf-shortcode-selector{width:250px;padding:5px 24px 5px 5px;border:1px solid #ccc;font-size:13px}'
			);
		}

		/**
		 * Shortcode list.
		 *
		 * @return array
		 */
		public function sp_wp_carousel_free_post_list() {
			$shortcodes = get_posts(
				array(
					'post_type'      => 'sp_wp_carousel',
					'post_status'    => 'publish',
					'posts_per_page' => 9999,
				)
			);

			if ( count( $shortcodes ) < 1 ) {
				return array();
			}

			return array_map(
				function ( $shortcode ) {
						return (object) array(
							'id'    => absint( $shortcode->ID ),
							'title' => esc_html( $shortcode->post_title ),
						);
				},
				$shortcodes
			);
		}

		/**
		 * Register Gutenberg shortcode block.
		 */
		public function sp_wp_carousel_free_gutenberg_shortcode_block() {
			/**
			 * Register Gutenberg block on server-side.
			 */
			register_block_type(
				'sp-wp-carousel-pro/shortcode',
				array(
					// Block API v3 tells WordPress the block is safe to render inside the
					// iframed editor canvas. See the Block API versions handbook page.
					'api_version'     => 3,
					'attributes'      => array(
						'shortcodelist'      => array(
							'type'    => 'object',
							'default' => '',
						),
						'shortcode'          => array(
							'type'    => 'string',
							'default' => '',
						),
						'showInputShortcode' => array(
							'type'    => 'boolean',
							'default' => true,
						),
						'preview'            => array(
							'type'    => 'boolean',
							'default' => false,
						),
						'is_admin'           => array(
							'type'    => 'boolean',
							'default' => is_admin(),
						),
					),
					'example'         => array(
						'attributes' => array(
							'preview' => true,
						),
					),
					// Enqueue blocks.editor.build.css in the editor only.
					'editor_style'    => array(),
					'render_callback' => array( $this, 'sp_wp_carousel_free_render_shortcode' ),
				)
			);
		}

		/**
		 * Render the carousel block output.
		 *
		 * @param array $attributes Block attributes.
		 * @return string Rendered HTML.
		 */
		public function sp_wp_carousel_free_render_shortcode( $attributes ) {
			$class_name = ! empty( $attributes['className'] )
				? sprintf( ' class="%s"', esc_attr( $attributes['className'] ) )
				: '';

			$shortcode_id = isset( $attributes['shortcode'] ) ? sanitize_text_field( $attributes['shortcode'] ) : '';
			$is_admin     = ! empty( $attributes['is_admin'] );

			if ( ! $is_admin ) {
				// Frontend render.
				return sprintf(
					'<div%s>%s</div>',
					$class_name,
					do_shortcode( '[sp_wpcarousel id="' . esc_attr( $shortcode_id ) . '"]' )
				);
			}

			// Editor render with admin flag.
			$edit_link = get_edit_post_link( $shortcode_id );
			$unique_id = 'sp-wpcf-' . uniqid();

			return sprintf(
				'<div id="%s"%s><a href="%s" target="_blank" class="sp_wp_carousel_block_edit_button">Edit View</a>%s</div>',
				esc_attr( $unique_id ),
				$class_name,
				esc_url( $edit_link ),
				do_shortcode( '[sp_wpcarousel id="' . esc_attr( $shortcode_id ) . '" is_admin="true"]' )
			);
		}
	}
}
