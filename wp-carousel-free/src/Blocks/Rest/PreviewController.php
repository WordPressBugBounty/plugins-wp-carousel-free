<?php
/**
 * REST routes backing the block editor preview.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rest;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Query_Options_Helper;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\TilesHydration;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\TilesPaginationRenderer;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeProjector;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\CarouselSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Sources\PostSource;
use ShapedPlugin\WPCarouselFree\Blocks\Sources\ProductSource;

defined( 'ABSPATH' ) || exit;

/**
 * Serves the post/product item list and the Query panel's post-type list.
 *
 * Route names match Pro so a Free → Pro upgrade needs no editor change.
 */
class PreviewController {

	const NAMESPACE_ROUTE = 'wpcp/v2';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the preview routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			self::NAMESPACE_ROUTE,
			'/icon-list',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_icon_list' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			self::NAMESPACE_ROUTE,
			'/post-types',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_post_types_list' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			self::NAMESPACE_ROUTE,
			'/preview-source-items',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'preview_source_items' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);
	}

	/**
	 * Both routes read editor-only data on behalf of the post being edited.
	 *
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * The icon library backing every icon picker in the inspector.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_icon_list() {
		$icon_file = WPCAROUSELF_PATH . 'src/Blocks/icons/icon-list.php';
		if ( ! file_exists( $icon_file ) ) {
			return new \WP_Error(
				'wpcpf_icon_file_missing',
				__( 'Icon list file not found.', 'wp-carousel-free' ),
				array( 'status' => 500 )
			);
		}

		$icon_list = require $icon_file;
		if ( ! is_array( $icon_list ) ) {
			return new \WP_Error(
				'wpcpf_invalid_icon_data',
				__( 'Icon list data is invalid.', 'wp-carousel-free' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( $icon_list );
	}

	/**
	 * Selectable post types for the block Query panel.
	 *
	 * Gated on `show_in_nav_menus` like Classic's shortcode, so both builders
	 * offer an identical set — including post types registered without REST
	 * support, which core's /wp/v2/types would omit.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_post_types_list() {
		$post_types = get_post_types( array( 'show_in_nav_menus' => true ), 'objects' );

		$labels = array();
		foreach ( $post_types as $post_type ) {
			if ( 'attachment' === $post_type->name ) {
				continue;
			}
			$labels[ $post_type->name ] = $post_type->labels->name;
		}

		/**
		 * Filters the post types offered in the carousel query builders.
		 *
		 * @param array $labels Map of post type slug => label.
		 */
		$labels = apply_filters( 'wpcp_post_types_options', $labels );

		$options = array();
		foreach ( $labels as $slug => $label ) {
			$options[] = array(
				'label' => $label,
				'value' => $slug,
			);
		}

		return rest_ensure_response( $options );
	}

	/**
	 * Resolve post/product items from block attributes for editor parity.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function preview_source_items( $request ) {
		$params  = $request->get_json_params();
		$payload = isset( $params['attributes'] ) && is_array( $params['attributes'] ) ? $params['attributes'] : array();

		// Core's render-time projection does not run on custom routes, so
		// project first: undeclared keys are dropped and out-of-enum values
		// snap back to their default. Without this the payload could carry Pro
		// attributes the schema deliberately omits.
		// `blockName` selects the block-aware fallback in every AllowedValues
		// branch, so it has to be right going *into* the projection — a slider
		// payload projected as a carousel would snap its nested values to
		// carousel defaults.
		$payload['blockName'] = isset( $payload['blockName'] ) ? sanitize_key( (string) $payload['blockName'] ) : '';

		$attributes = AttributeProjector::apply( $payload, new CarouselSchema() );

		$source = isset( $attributes['sourceType'] ) ? sanitize_key( (string) $attributes['sourceType'] ) : '';

		if ( 'post' !== $source && 'product' !== $source ) {
			return new \WP_Error(
				'wpcpf_invalid_preview_source',
				__( 'Only post and product preview sources are supported.', 'wp-carousel-free' ),
				array( 'status' => 400 )
			);
		}

		// This route runs an unbounded-by-default query for any `edit_posts`
		// user, so harden `queryOptions` the same way the frontend does:
		// public post-type/taxonomy intersection, absint'd ids, order enums,
		// and a `limit` clamp.
		if ( isset( $attributes['queryOptions'] ) && is_array( $attributes['queryOptions'] ) ) {
			$attributes['queryOptions'] = Query_Options_Helper::sanitize_untrusted_query_options( $attributes['queryOptions'] );
		}

		$source_object = 'product' === $source ? new ProductSource() : new PostSource();
		$items         = $source_object->get_items( $attributes );

		// Tiles AJAX two-step fetch: get_items() returned lightweight ID stubs
		// (see PostSource::get_items()/ProductSource::get_items()). Hydrate the
		// first page's slice into full items so the editor canvas shows real
		// content instead of empty placeholders, through the same helper the
		// frontend's BlockRenderer::build_tiles_hydrator() uses.
		if ( Query_Options_Helper::is_tiles_ajax_request( $attributes ) ) {
			$pagination_state = ( new TilesPaginationRenderer( $attributes, '' ) )->compute_tiles_pagination_state( $items );
			$items            = TilesHydration::hydrate_page( $source_object, $pagination_state['items'], $attributes );
		}

		return rest_ensure_response( $items );
	}
}
