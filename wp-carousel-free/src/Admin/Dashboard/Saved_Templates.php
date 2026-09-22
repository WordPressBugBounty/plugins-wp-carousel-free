<?php
/**
 * Saved carousel templates: the CPT and its shortcode.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\Dashboard;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Block_Dynamic_Style;

defined( 'ABSPATH' ) || exit;

/**
 * A saved template is a block-editor post whose content is replayed anywhere by
 * the [sp_wpcp_template id="…"] shortcode. Post type and shortcode names match
 * Pro's so a template authored in Free keeps working after an upgrade.
 */
class Saved_Templates {

	const POST_TYPE = 'sp_wpcp_template';
	const MODULE    = 'saved-templates';

	/**
	 * Hook the CPT and shortcode.
	 */
	public static function init() {
		$instance = new self();

		// Early enough for REST: the block editor saves through it.
		add_action( 'init', array( $instance, 'register_post_type' ) );
		add_filter( 'use_block_editor_for_post_type', array( $instance, 'force_block_editor' ), 100, 2 );
		add_shortcode( self::POST_TYPE, array( $instance, 'render_shortcode' ) );

		if ( is_admin() ) {
			add_action( 'admin_init', array( $instance, 'redirect_list_table' ) );
		}
	}

	/**
	 * Register the saved template post type.
	 */
	public function register_post_type() {
		if ( post_type_exists( self::POST_TYPE ) ) {
			return;
		}

		$labels = array(
			'name'               => __( 'Saved Templates', 'wp-carousel-free' ),
			'singular_name'      => __( 'Saved Template', 'wp-carousel-free' ),
			'menu_name'          => __( 'Saved Templates', 'wp-carousel-free' ),
			'all_items'          => __( 'Saved Templates', 'wp-carousel-free' ),
			'add_new'            => __( 'Add New Template', 'wp-carousel-free' ),
			'add_new_item'       => __( 'Add New Template', 'wp-carousel-free' ),
			'edit_item'          => __( 'Edit Template', 'wp-carousel-free' ),
			'view_item'          => __( 'View Template', 'wp-carousel-free' ),
			'new_item'           => __( 'New Template', 'wp-carousel-free' ),
			'search_items'       => __( 'Search Template', 'wp-carousel-free' ),
			'not_found'          => __( 'No template found', 'wp-carousel-free' ),
			'not_found_in_trash' => __( 'No template found in Trash', 'wp-carousel-free' ),
			'item_updated'       => __( 'Template updated.', 'wp-carousel-free' ),
		);

		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => $labels,
				'public'              => false,
				'supports'            => array( 'title', 'editor', 'revisions' ),
				'show_in_rest'        => true,
				'hierarchical'        => false,
				'rewrite'             => false,
				'show_ui'             => current_user_can( 'manage_options' ),
				'show_in_menu'        => false,
				'show_in_nav_menu'    => true,
				'exclude_from_search' => true,
				'capability_type'     => 'page',
			)
		);
	}

	/**
	 * Templates are block content, so never hand them the classic editor.
	 *
	 * @param bool   $use_block_editor Whether to use the block editor.
	 * @param string $post_type        Post type being edited.
	 * @return bool
	 */
	public function force_block_editor( $use_block_editor, $post_type ) {
		if ( self::POST_TYPE === $post_type ) {
			return true;
		}
		return $use_block_editor;
	}

	/**
	 * Send the native list table to the dashboard's Saved Templates tab, which
	 * is the real management screen. With the module off the tab is gone, so
	 * the native list renders instead rather than stranding the user.
	 */
	public function redirect_list_table() {
		global $pagenow;

		if ( ! Dashboard::is_module_active( self::MODULE ) ) {
			return;
		}

		// Editing or creating a template: leave the editor alone.
		if ( 'post-new.php' === $pagenow ) {
			return;
		}

		if ( isset( $_GET['post'], $_GET['action'] ) && 'edit' === sanitize_text_field( wp_unslash( $_GET['action'] ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the current screen, not acting on it.
			if ( self::POST_TYPE === get_post_type( absint( $_GET['post'] ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the current screen, not acting on it.
				return;
			}
		}

		if ( ! isset( $_GET['post_type'] ) || self::POST_TYPE !== sanitize_text_field( wp_unslash( $_GET['post_type'] ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the current screen, not acting on it.
			return;
		}

		wp_safe_redirect(
			admin_url( 'edit.php?post_type=sp_wp_carousel&page=' . Dashboard::PAGE_SLUG_GETTING_STARTED . '#saved_templates' )
		);
		exit;
	}

	/**
	 * Replay a saved template's block content.
	 *
	 * @param array $attributes Shortcode attributes.
	 * @return string
	 */
	public function render_shortcode( $attributes ) {
		if ( ! Dashboard::is_module_active( self::MODULE ) ) {
			return '';
		}

		$attributes = shortcode_atts( array( 'id' => '' ), $attributes );
		$id         = is_numeric( $attributes['id'] ) ? absint( $attributes['id'] ) : 0;

		if ( ! $id ) {
			return '';
		}

		$post = get_post( $id );
		if ( ! $post || 'publish' !== $post->post_status || self::POST_TYPE !== $post->post_type ) {
			return '';
		}

		$content = $post->post_content;
		if ( empty( $content ) ) {
			return '';
		}

		$this->enqueue_template_css( $id, $content );

		return trim( do_shortcode( do_blocks( $content ) ) );
	}

	/**
	 * Emit the template's dynamic CSS. A template rendered through a shortcode
	 * never goes through the normal post-content path, so nothing else would
	 * generate or enqueue it.
	 *
	 * @param int    $template_id Template post ID.
	 * @param string $content     Template block content.
	 */
	private function enqueue_template_css( $template_id, $content ) {
		// One template can be embedded several times on a page.
		static $done = array();
		if ( isset( $done[ $template_id ] ) || ! has_blocks( $content ) ) {
			return;
		}

		$blocks = parse_blocks( $content );
		if ( empty( $blocks ) ) {
			return;
		}

		$block_style = Block_Dynamic_Style::instance();
		if ( ! $this->has_our_blocks( $blocks, $block_style ) ) {
			return;
		}

		$done[ $template_id ] = true;
		$font_lists           = array();

		if ( $block_style->css_file_exists( $template_id ) ) {
			$version = get_post_meta( $template_id, '_sp_wpcp_unique_version', true );
			wp_enqueue_style(
				'wpcpf-template-' . $template_id,
				$block_style->css_url . 'sp-wpcp-style-' . $template_id . '.css',
				array(),
				! empty( $version ) ? $version : WPCAROUSELF_VERSION
			);
			$font_lists = get_post_meta( $template_id, 'sp_wpcp_dynamic_fonts', true );
		} else {
			$dynamic_assets = $block_style->generate_post_css_file( $template_id, get_post( $template_id ) );

			if ( is_array( $dynamic_assets ) ) {
				$font_lists   = $dynamic_assets[1] ?? array();
				$inline_style = $dynamic_assets[0] ?? '';

				if ( ! empty( $inline_style ) ) {
					$handle = 'wpcpf-template-' . $template_id;
					wp_register_style( $handle, false, array(), WPCAROUSELF_VERSION );
					wp_add_inline_style( $handle, $inline_style );
					wp_enqueue_style( $handle );
				}

				update_post_meta( $template_id, '_sp_wpcp_unique_version', wp_rand( 1000, 9999 ) );
			}
		}

		if ( ! empty( $font_lists ) && is_array( $font_lists ) ) {
			wp_enqueue_style(
				'wpcpf-template-fonts-' . $template_id,
				'https://fonts.googleapis.com/css?family=' . implode( '|', array_unique( $font_lists ) ),
				array(),
				WPCAROUSELF_VERSION
			);
		}
	}

	/**
	 * Whether a parsed block tree contains any of this plugin's blocks.
	 *
	 * @param array  $blocks      Parsed blocks.
	 * @param object $block_style Block_Dynamic_Style instance.
	 * @return bool
	 */
	private function has_our_blocks( $blocks, $block_style ) {
		foreach ( $blocks as $block ) {
			if ( ! empty( $block['blockName'] ) && in_array( $block['blockName'], $block_style->our_blocks, true ) ) {
				return true;
			}

			if ( ! empty( $block['innerBlocks'] ) && $this->has_our_blocks( $block['innerBlocks'], $block_style ) ) {
				return true;
			}
		}

		return false;
	}
}
