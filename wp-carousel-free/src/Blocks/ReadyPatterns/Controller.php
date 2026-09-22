<?php
/**
 * Ready Patterns REST controller.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns;

defined( 'ABSPATH' ) || exit;

/**
 * Registers /wpcp/v2/patterns REST routes.
 */
class Controller {

	/**
	 * Dashboard module slug that gates the library.
	 */
	const MODULE = 'ready-patterns';

	/**
	 * Pattern repository.
	 *
	 * @var PatternRepository
	 */
	private $repository;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->repository = new PatternRepository();
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			'wpcp/v2',
			'/patterns',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_patterns' ),
				'permission_callback' => array( $this, 'can_edit_posts' ),
				'args'                => array(
					'force' => array(
						'default'           => false,
						'sanitize_callback' => static function ( $value ) {
							return rest_sanitize_boolean( $value );
						},
					),
				),
			)
		);

		register_rest_route(
			'wpcp/v2',
			'/patterns/(?P<id>[\\w-]+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_pattern' ),
				'permission_callback' => array( $this, 'can_edit_posts' ),
				'args'                => array(
					'id' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Own path — "/patterns/(?P<id>)" above would swallow "/patterns/favorites".
		register_rest_route(
			'wpcp/v2',
			'/pattern-favorites',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_favorites' ),
					'permission_callback' => array( $this, 'can_edit_posts' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'update_favorites' ),
					'permission_callback' => array( $this, 'can_edit_posts' ),
					'args'                => array(
						'id'     => array(
							'required'          => true,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'slug'   => array(
							'default'           => '',
							'sanitize_callback' => 'sanitize_title',
						),
						'action' => array(
							'default'           => 'add',
							'validate_callback' => static function ( $value ) {
								return in_array( $value, array( 'add', 'remove' ), true );
							},
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check for editor users.
	 *
	 * The module toggle hides the library's editor entry points; it does not
	 * take the library away. A deep link that asks for it explicitly — the
	 * dashboard's per-block Demo link — still has to be served.
	 *
	 * @return bool True when allowed.
	 */
	public function can_edit_posts() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Return the normalized pattern manifest.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function get_patterns( \WP_REST_Request $request ): \WP_REST_Response {
		$force = (bool) $request->get_param( 'force' );
		$items = $this->repository->get_manifest( $force );

		return rest_ensure_response( $items );
	}

	/**
	 * Return a single pattern payload.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_pattern( \WP_REST_Request $request ) {
		$pattern_id = $request->get_param( 'id' );
		$item       = $this->repository->get_item( $pattern_id );

		// Free previews every pattern but inserts only the free ones. The card's
		// upgrade button is presentation; this is the enforcement.
		if ( ! PatternRepository::is_free_item( $item ) ) {
			return new \WP_Error(
				'wpcpf_pattern_requires_pro',
				__( 'This pattern is available in WP Carousel Pro.', 'wp-carousel-free' ),
				array( 'status' => 403 )
			);
		}

		$content = $this->repository->get_pattern_content( $pattern_id );

		if ( null === $content || '' === $content || ! self::is_valid_pattern_markup( $content ) ) {
			return new \WP_Error(
				'wpcp_pattern_not_found',
				__( 'Pattern not found.', 'wp-carousel-free' ),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response(
			array(
				'content' => $content,
			)
		);
	}

	/**
	 * Return the favorited pattern IDs.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_favorites(): \WP_REST_Response {
		return rest_ensure_response(
			array(
				'favorites' => PatternFavorites::get_all(),
			)
		);
	}

	/**
	 * Add or remove a pattern from the current user's favorites.
	 *
	 * The durable slug is the stored key; the ID is passed so a pre-slug entry for
	 * the same pattern is rewritten instead of lingering as a duplicate.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function update_favorites( \WP_REST_Request $request ): \WP_REST_Response {
		$pattern_id = $request->get_param( 'id' );
		$slug       = (string) $request->get_param( 'slug' );
		$action     = $request->get_param( 'action' );
		$key        = '' !== $slug ? $slug : $pattern_id;
		$legacy_id  = '' !== $slug ? $pattern_id : null;

		$favorites = 'remove' === $action
			? PatternFavorites::remove( $key, $legacy_id )
			: PatternFavorites::add( $key, $legacy_id );

		return rest_ensure_response(
			array(
				'favorites' => $favorites,
			)
		);
	}

	/**
	 * Whether serialized markup is safe to hand to the editor.
	 *
	 * The whole parsed tree is inspected, not just the presence of a WPCP block:
	 * remote markup that pairs a carousel with `core/html` is a payload the client
	 * would refuse, and it must never leave this route. `PatternValidator` is the
	 * server-side copy of the editor's allow-list and fails closed.
	 *
	 * @param string $content Serialized block markup.
	 * @return bool
	 */
	private static function is_valid_pattern_markup( string $content ): bool {
		return PatternValidator::is_valid( $content );
	}
}
