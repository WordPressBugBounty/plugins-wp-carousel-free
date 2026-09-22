<?php
/**
 * REST route for Tiles AJAX pagination.
 *
 * `POST /wp-json/wp-carousel-pro/v1/ajax-pagination` accepts the parent Tiles
 * block's attribute payload plus a 1-indexed page number and returns the
 * rendered item HTML for that page. Reuses `BlockRenderer::render_tiles_ajax_page`
 * so the server-rendered first page and every AJAX page share one code path.
 *
 * Route name matches Pro so a Free → Pro upgrade needs no editor change.
 *
 * Nonce-protected (`X-WP-Nonce`) — no capability check, since the underlying
 * content is already public. Because the caller is anonymous, the payload is
 * bounded here too: the item array is capped and the item cache is read-only.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rest;

use ShapedPlugin\WPCarouselFree\Blocks\BlockRenderer;
use ShapedPlugin\WPCarouselFree\Blocks\Cache;
use ShapedPlugin\WPCarouselFree\Blocks\Includes\Query_Options_Helper;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeProjector;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\TilesSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Sources\SourceRegistry;

defined( 'ABSPATH' ) || exit;

/**
 * Serves one page of Tiles items to the frontend pagination runtime.
 */
class AjaxPaginationController {

	const NAMESPACE_ROUTE = 'wp-carousel-pro/v1';
	const ROUTE_PATH      = '/ajax-pagination';

	/**
	 * Inclusive upper bound for client-controlled per-page sizes. Aliases the
	 * shared constant so this endpoint and the editor preview clamp alike.
	 *
	 * @var int
	 */
	const LIMIT_MAX = Query_Options_Helper::LIMIT_MAX;

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the AJAX-pagination route.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			self::NAMESPACE_ROUTE,
			self::ROUTE_PATH,
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);
	}

	/**
	 * Permission callback — requires a valid REST nonce (`X-WP-Nonce`).
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function check_permission( $request ) {
		$nonce = $request->get_header( 'x_wp_nonce' );
		if ( empty( $nonce ) ) {
			$nonce = $request->get_header( 'X-WP-Nonce' );
		}
		if ( empty( $nonce ) ) {
			return new \WP_Error(
				'wpcp_missing_nonce',
				__( 'Missing nonce.', 'wp-carousel-free' ),
				array( 'status' => 403 )
			);
		}
		if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new \WP_Error(
				'wpcp_invalid_nonce',
				__( 'Invalid nonce.', 'wp-carousel-free' ),
				array( 'status' => 403 )
			);
		}
		return true;
	}

	/**
	 * Handle the request — projects the payload, loads items, renders the page.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function handle_request( $request ) {
		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = array();
		}

		$page = isset( $params['page'] ) ? (int) $params['page'] : 1;
		if ( $page < 1 ) {
			return new \WP_Error(
				'wpcp_invalid_page',
				__( 'Page must be a positive integer.', 'wp-carousel-free' ),
				array( 'status' => 400 )
			);
		}

		// The payload is an untrusted copy of the block's own attributes.
		// `prepare_attributes_for_render()` never runs for a custom route, so
		// project it onto the Tiles schema first — that projection is what stops
		// a crafted request from injecting the Pro keys the schema omits.
		$attributes = AttributeProjector::apply( $params, new TilesSchema() );

		$source_type = isset( $attributes['sourceType'] ) ? sanitize_key( (string) $attributes['sourceType'] ) : '';
		if ( ! in_array( $source_type, SourceRegistry::ids(), true ) ) {
			return new \WP_Error(
				'wpcp_invalid_source',
				__( 'Unsupported source type.', 'wp-carousel-free' ),
				array( 'status' => 400 )
			);
		}
		$attributes['sourceType'] = $source_type;

		$query_options              = isset( $attributes['queryOptions'] ) && is_array( $attributes['queryOptions'] )
			? $attributes['queryOptions']
			: array();
		$attributes['queryOptions'] = Query_Options_Helper::sanitize_untrusted_query_options( $query_options );

		// `parentUniqueId` is not a schema key, so it survives only by being read
		// off the raw payload here.
		$parent_unique_id       = isset( $params['parentUniqueId'] ) ? sanitize_text_field( (string) $params['parentUniqueId'] ) : '';
		$attributes['uniqueId'] = preg_replace( '/[^a-zA-Z0-9_-]/', '', $parent_unique_id );

		$layout_options = isset( $attributes['layoutOptions'] ) && is_array( $attributes['layoutOptions'] )
			? $attributes['layoutOptions']
			: array();
		// Force pagination on for the slicing math — the endpoint is only
		// reachable when pagination is active.
		$layout_options['pagination'] = true;
		$attributes['layoutOptions']  = $layout_options;

		// The endpoint is Tiles-only.
		$attributes['blockName'] = 'tiles';

		// Clamp the image-source page size the same way the Query Builder's
		// Limit field is clamped.
		$pagination_options = isset( $attributes['paginationOptions'] ) && is_array( $attributes['paginationOptions'] )
			? $attributes['paginationOptions']
			: array();
		if ( isset( $pagination_options['imageItemsPerPage'] ) ) {
			$pagination_options['imageItemsPerPage'] = min( self::LIMIT_MAX, max( 1, (int) $pagination_options['imageItemsPerPage'] ) );
		}
		$attributes['paginationOptions'] = $pagination_options;

		// Image and video sources carry their whole item list in the payload,
		// and every entry costs attachment lookups before the page slice runs.
		// Cap it at the same candidate ceiling the post/product query uses, so
		// one anonymous request cannot ask for an unbounded amount of work.
		if ( isset( $attributes['items'] ) && is_array( $attributes['items'] ) ) {
			$max_items = Query_Options_Helper::tiles_ajax_max_items();
			if ( count( $attributes['items'] ) > $max_items ) {
				$attributes['items'] = array_slice( $attributes['items'], 0, $max_items );
			}
		}

		// Round-trip the per-page-load shuffle seed so the deterministic
		// Fisher-Yates reproduces the first render's permutation. A missing or
		// non-positive seed means "no shuffle" — items are read in loaded order.
		$shuffle_seed = null;
		if ( isset( $params['_shuffleSeed'] ) ) {
			$candidate = (int) $params['_shuffleSeed'];
			if ( $candidate > 0 ) {
				$shuffle_seed = $candidate;
			}
		}

		// The caller controls every value the cache key is built from, so this
		// route reads the item cache but never writes it — otherwise each
		// varied payload would mint its own day-long transient. The source runs
		// third-party query hooks, so restore the flag from `finally` rather
		// than leaving a throw to strand the whole request in read-only mode.
		$was_read_only = Cache::is_read_only();
		Cache::set_read_only( true );
		try {
			$items = SourceRegistry::for( $source_type )->get_items( $attributes );
		} finally {
			Cache::set_read_only( $was_read_only );
		}

		$renderer = new BlockRenderer( $attributes, 'tiles' );

		return rest_ensure_response( $renderer->render_tiles_ajax_page( $items, $page, $shuffle_seed ) );
	}
}
