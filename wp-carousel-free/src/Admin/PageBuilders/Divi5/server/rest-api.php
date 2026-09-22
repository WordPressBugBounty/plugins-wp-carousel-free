<?php
/**
 * REST routes backing the Divi 5 module's visual builder preview.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Divi5;

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Assets;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Templates;

defined( 'ABSPATH' ) || exit;

/**
 * Register the module's routes.
 */
function register_rest_routes() {
	register_rest_route(
		'wpcp/v1',
		'/carousel-html',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\get_carousel_html',
			'permission_callback' => __NAMESPACE__ . '\\can_edit_posts',
			'args'                => array(
				'template_id' => array(
					'required'          => true,
					'sanitize_callback' => 'absint',
				),
			),
		)
	);

	register_rest_route(
		'wpcp/v2',
		'/saved-templates',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\get_saved_templates',
			'permission_callback' => __NAMESPACE__ . '\\can_edit_posts',
		)
	);
}

/**
 * Both routes serve the builder, so editing rights are the bar.
 *
 * @return bool
 */
function can_edit_posts() {
	return current_user_can( 'edit_posts' );
}

/**
 * Render a saved template for the visual builder.
 *
 * @param \WP_REST_Request $request REST request.
 * @return \WP_REST_Response
 */
function get_carousel_html( $request ) {
	$template_id = absint( $request->get_param( 'template_id' ) );

	return new \WP_REST_Response(
		array(
			'success' => (bool) $template_id,
			'html'    => Builder_Templates::render( $template_id ),
			'css'     => Builder_Assets::template_css_links( $template_id ),
		),
		200
	);
}

/**
 * Saved templates for the module's dropdown.
 *
 * @return \WP_REST_Response
 */
function get_saved_templates() {
	return new \WP_REST_Response( Builder_Templates::get_list(), 200 );
}
