<?php
/**
 * WPBakery integration.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\WPBakery;

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Assets;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Templates;

defined( 'ABSPATH' ) || exit;

/**
 * Wrapper class the editor re-init observer watches for.
 */
const WRAPPER_CLASS = 'wpcp-wpbakery-carousel-wrapper';

/**
 * Element base kept identical to Pro's so a page built in Free keeps rendering
 * after the upgrade.
 */
const ELEMENT_BASE = 'vc_wp_carousel_pro';

/**
 * Register the element with WPBakery.
 */
function register_element() {
	if ( ! function_exists( 'vc_map' ) ) {
		return;
	}

	// WPBakery's dropdown is label => value, the inverse of every other builder.
	$options = array();
	foreach ( Builder_Templates::get_list( 'none' ) as $id => $title ) {
		$options[ $title ] = $id;
	}

	vc_map(
		array(
			'name'        => esc_html__( 'WP Carousel', 'wp-carousel-free' ),
			'base'        => ELEMENT_BASE,
			'description' => esc_html__( 'Display a WP Carousel saved template.', 'wp-carousel-free' ),
			'category'    => esc_html__( 'WP Carousel', 'wp-carousel-free' ),
			'params'      => array(
				array(
					'type'        => 'dropdown',
					'heading'     => esc_html__( 'Saved Template', 'wp-carousel-free' ),
					'param_name'  => 'template_id',
					'value'       => $options,
					'std'         => 'none',
					'description' => esc_html__( 'Select a saved template to display.', 'wp-carousel-free' ),
					'save_always' => true,
				),
			),
		)
	);
}

/**
 * Whether WPBakery's frontend editor is running.
 *
 * @return bool
 */
function is_builder_editor() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Reading the request context, not acting on it.
	if ( isset( $_GET['vc_editable'] ) || isset( $_GET['vc_preview'] ) ) {
		return true;
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	return function_exists( 'vc_is_inline' ) && vc_is_inline();
}

/**
 * Whether a saved page holds our element.
 *
 * The element is a shortcode, so the post content is an exact record of it —
 * no document JSON to scan the way Elementor needs.
 *
 * @param int $post_id Post ID.
 * @return bool
 */
function page_contains_element( $post_id ) {
	$post_id = absint( $post_id );

	if ( ! $post_id ) {
		return false;
	}

	$post = get_post( $post_id );

	if ( ! $post || ! is_string( $post->post_content ) || '' === $post->post_content ) {
		return false;
	}

	return has_shortcode( $post->post_content, ELEMENT_BASE );
}

/**
 * Load the block runtime on published WPBakery pages.
 *
 * The element renders as a shortcode inside `the_content`, so the enqueue in
 * `render_element()` lands after `wp_enqueue_scripts` has finished and the
 * lightbox config localized at priority 100 never attaches.
 */
function enqueue_frontend_assets() {
	// The editor and admin paths are covered by the two functions below.
	if ( is_admin() || is_builder_editor() ) {
		return;
	}

	if ( ! is_singular() || ! page_contains_element( get_queried_object_id() ) ) {
		return;
	}

	Builder_Assets::enqueue_block_runtime();
}

/**
 * Enqueue the block runtime and re-init observer inside the WPBakery editor.
 */
function enqueue_editor_assets() {
	if ( is_admin() || ! is_builder_editor() ) {
		return;
	}

	Builder_Assets::enqueue_block_runtime( true );
	Builder_Assets::add_reinit_script(
		WRAPPER_CLASS,
		array( 'vc_js_reload', 'vc_frontend_default_editor_loaded', 'vc_frontend_render' )
	);
}

/**
 * Styles for the WPBakery backend editor, which renders element previews in
 * the post edit screen rather than the frontend.
 */
function enqueue_admin_assets() {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

	if ( ! $screen || 'post' !== $screen->base ) {
		return;
	}

	Builder_Assets::enqueue_block_runtime( true );
}

/**
 * Render the element.
 *
 * @param array $atts Shortcode attributes.
 * @return string
 */
function render_element( $atts ) {
	$atts = shortcode_atts( array( 'template_id' => '' ), $atts, ELEMENT_BASE );

	$template_id = 'none' === $atts['template_id'] ? 0 : absint( $atts['template_id'] );

	// Safety net for the places `has_shortcode()` cannot see — a widget, a
	// nested template, a shortcode built at runtime. Too late for the lightbox
	// config on its own, which is why `enqueue_frontend_assets()` exists.
	Builder_Assets::enqueue_block_runtime();

	return sprintf(
		'<div class="%1$s" data-builder-template-id="%2$s">%3$s</div>',
		esc_attr( WRAPPER_CLASS ),
		esc_attr( $template_id ),
		Builder_Templates::render( $template_id, is_builder_editor() )
	);
}

add_action( 'vc_before_init', __NAMESPACE__ . '\\register_element' );
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_editor_assets' );
// Well before Lightbox_Frontend localizes the Fancybox config at 100.
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_frontend_assets', 20 );
add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\\enqueue_admin_assets' );
add_shortcode( ELEMENT_BASE, __NAMESPACE__ . '\\render_element' );
