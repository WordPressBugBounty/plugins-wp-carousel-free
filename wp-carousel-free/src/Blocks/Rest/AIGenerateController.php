<?php
/**
 * REST route behind the AI Carousel Builder.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rest;

use ShapedPlugin\WPCarouselFree\Blocks\AI\AIBlockRouter;
use ShapedPlugin\WPCarouselFree\Blocks\AI\AICatalogBuilder;
use ShapedPlugin\WPCarouselFree\Blocks\AI\AIController;
use ShapedPlugin\WPCarouselFree\Blocks\AI\AIFeature;
use ShapedPlugin\WPCarouselFree\Blocks\AI\AIKeyManager;
use ShapedPlugin\WPCarouselFree\Blocks\BlockTypesController;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeProjector;

defined( 'ABSPATH' ) || exit;

/**
 * Answers a prompt with a Ready Pattern or a generated block configuration.
 *
 * Route name matches Pro so a Free → Pro upgrade needs no editor change.
 */
class AIGenerateController {

	const NAMESPACE_ROUTE = 'wpcp/v2';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the generation route.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			self::NAMESPACE_ROUTE,
			'/ai-generate',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'generate' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'prompt'             => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'blockName'          => array(
						'default'           => BlockTypesController::NAMESPACE_PREFIX . '/carousel',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'existingAttributes' => array(
						'default'           => array(),
						'validate_callback' => static function ( $value ) {
							return is_array( $value );
						},
					),
					// Off when the builder retries after a matched pattern proved unusable.
					'allowPatterns'      => array(
						'default'           => true,
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
					// Empty runs on the Primary; anything else is checked in generate().
					'provider'           => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_key',
					),
					'model'              => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * The module or site switch wins over capabilities, so a stale editor is told why.
	 *
	 * @return bool|\WP_Error
	 */
	public function check_permission() {
		if ( ! AIFeature::is_available() ) {
			return AIFeature::unavailable_error();
		}

		return current_user_can( 'edit_posts' );
	}

	/**
	 * Answer a natural language prompt.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function generate( \WP_REST_Request $request ) {
		$prompt = (string) $request->get_param( 'prompt' );

		if ( '' === trim( $prompt ) ) {
			return new \WP_Error(
				'wpcp_ai_empty_prompt',
				__( 'Prompt text is required.', 'wp-carousel-free' ),
				array( 'status' => 400 )
			);
		}

		$block_name = $this->resolve_block_name( (string) $request->get_param( 'blockName' ) );
		if ( '' === $block_name ) {
			return new \WP_Error(
				'wpcp_ai_no_block',
				__( 'Every WP Carousel block is switched off on the dashboard Blocks page.', 'wp-carousel-free' ),
				array( 'status' => 400 )
			);
		}

		$existing = $request->get_param( 'existingAttributes' );
		$existing = is_array( $existing ) ? $existing : array();

		// Untrusted attributes, projected like every other route that accepts them.
		if ( ! empty( $existing ) ) {
			$schema_class = AICatalogBuilder::schema_class_for_block( $block_name );
			$existing     = AttributeProjector::apply( $existing, new $schema_class() );
		}

		// The model reaches a provider URL, so only ids that provider offers get through.
		$provider = (string) $request->get_param( 'provider' );
		$provider = in_array( $provider, AIKeyManager::PROVIDERS, true ) ? $provider : '';
		$model    = '' !== $provider ? AIKeyManager::sanitize_request_model( $provider, (string) $request->get_param( 'model' ) ) : '';

		$result = AIController::generate_block_config(
			$prompt,
			$block_name,
			$existing,
			(bool) $request->get_param( 'allowPatterns' ),
			$provider,
			$model
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( 'pattern' === $result['mode'] ) {
			return rest_ensure_response(
				array(
					'success'    => true,
					'mode'       => 'pattern',
					'blockName'  => $result['pattern']['blockName'],
					'pattern'    => $result['pattern'],
					'confidence' => $result['confidence'],
					'reason'     => $result['reason'],
				)
			);
		}

		return rest_ensure_response(
			array(
				'success'              => true,
				'mode'                 => 'attributes',
				'blockName'            => $result['blockName'],
				'attributes'           => $result['attributes'],
				'patternDeclineReason' => $result['patternDeclineReason'] ?? '',
			)
		);
	}

	/**
	 * Snap the requested block to one Free renders and this site has switched on.
	 *
	 * @param string $block_name Requested block name.
	 * @return string Fully-qualified block name, or "" when every block is off.
	 */
	private function resolve_block_name( string $block_name ): string {
		$slug       = AICatalogBuilder::slug( $block_name );
		$candidates = AIBlockRouter::candidates();

		if ( ! in_array( $slug, $candidates, true ) ) {
			$slug = (string) reset( $candidates );
		}

		return '' === $slug ? '' : BlockTypesController::NAMESPACE_PREFIX . '/' . $slug;
	}
}
