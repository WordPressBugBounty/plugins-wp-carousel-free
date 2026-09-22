<?php
/**
 * Saved-template lookup and rendering for the page builder integrations.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base;

use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Saved_Templates;

defined( 'ABSPATH' ) || exit;

/**
 * The dropdown every builder element shows, and the render behind it.
 */
class Builder_Templates {

	/**
	 * Published saved templates, newest first.
	 *
	 * @param string $placeholder_key Key for the "select" row.
	 * @return array Template ID => title.
	 */
	public static function get_list( $placeholder_key = '0' ) {
		static $posts = null;

		if ( null === $posts ) {
			$posts = get_posts(
				array(
					'post_type'              => Saved_Templates::POST_TYPE,
					'post_status'            => 'publish',
					'posts_per_page'         => 200, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- Bounded on purpose: this fills a builder dropdown.
					'orderby'                => 'ID',
					'order'                  => 'DESC',
					'no_found_rows'          => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				)
			);
		}

		$list = array( $placeholder_key => esc_html__( '- Select Template -', 'wp-carousel-free' ) );

		foreach ( $posts as $post ) {
			$list[ $post->ID ] = ! empty( $post->post_title ) ? $post->post_title : '#' . $post->ID;
		}

		return $list;
	}

	/**
	 * Render a saved template, or the placeholder explaining why it cannot be.
	 *
	 * @param int  $template_id Template post ID.
	 * @param bool $is_editor   Whether the builder's editor is rendering.
	 * @return string
	 */
	public static function render( $template_id, $is_editor = false ) {
		$template_id = absint( $template_id );

		if ( ! $template_id ) {
			return Builder_Assets::notice( __( 'Please select a saved template.', 'wp-carousel-free' ) );
		}

		$template = get_post( $template_id );

		if ( ! $template || Saved_Templates::POST_TYPE !== $template->post_type || 'publish' !== $template->post_status ) {
			return Builder_Assets::notice( __( 'Template not found or not published.', 'wp-carousel-free' ) );
		}

		if ( empty( $template->post_content ) ) {
			return Builder_Assets::notice( __( 'Template content is empty.', 'wp-carousel-free' ) );
		}

		// Render first: the shortcode writes the template's dynamic CSS file as a
		// side effect, so on a template whose file does not exist yet this is what
		// makes the stylesheet link below resolve instead of 404.
		$markup = do_shortcode( '[' . Saved_Templates::POST_TYPE . ' id="' . $template_id . '"]' );

		if ( '' === $markup ) {
			return Builder_Assets::notice( __( 'The Saved Templates module is turned off.', 'wp-carousel-free' ) );
		}

		if ( $is_editor ) {
			$markup = Builder_Assets::template_css_links( $template_id ) . $markup;
		}

		return $markup;
	}
}
