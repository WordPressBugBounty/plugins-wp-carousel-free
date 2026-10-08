<?php
/**
 * AI Controller
 *
 * Orchestrates carousel generation: Ready Pattern matching first, attribute
 * generation second. Transport lives behind a TextGateway, so this class never
 * knows whether the request goes out through WordPress Connectors or through
 * this plugin's own stored key.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

use ShapedPlugin\WPCarouselFree\Blocks\AI\Gateway\GatewayResolver;
use ShapedPlugin\WPCarouselFree\Blocks\AI\Gateway\RemoteHttpGateway;
use ShapedPlugin\WPCarouselFree\Blocks\AI\Gateway\TextGateway;

defined( 'ABSPATH' ) || exit;

/**
 * AIController class.
 */
class AIController {

	/**
	 * Longest prompt sent to a provider. Anything past this is layout prose, not intent.
	 */
	const MAX_PROMPT_LENGTH = 1000;

	/**
	 * Build a carousel from a natural language prompt.
	 *
	 * Ready Patterns come first: a prompt a published pattern already answers is
	 * served by inserting that pattern, so nothing has to be assembled attribute by
	 * attribute. Attribute generation runs only when no pattern fits the request,
	 * and then on the block the prompt itself names (`AIBlockRouter`) — the
	 * returned `blockName` is what the editor should build, not necessarily what
	 * it asked for.
	 *
	 * @param string $prompt User prompt string.
	 * @param string $block_name Target block slug, a default the prompt may override.
	 * @param array  $existing_attributes Existing attributes map if updating.
	 * @param bool   $allow_patterns Whether a Ready Pattern may answer this prompt.
	 * @param string $provider Provider slug, or empty for the Primary.
	 * @param string $model Model id already checked against the provider, or empty.
	 * @return array|\WP_Error Mode-tagged result array or WP_Error.
	 */
	public static function generate_block_config( string $prompt, string $block_name = 'wp-carousel-pro/carousel', array $existing_attributes = array(), bool $allow_patterns = true, string $provider = '', string $model = '' ) {
		$gateway = GatewayResolver::resolve( $provider, $model );
		if ( is_wp_error( $gateway ) ) {
			return $gateway;
		}

		$prompt = self::trim_prompt( $prompt );

		// Set only when a pattern was actually attempted and the model explicitly
		// declined every candidate (e.g. "no candidate includes X, Y, and Z
		// together") — not for allow_patterns=false, an empty shortlist, or an
		// upstream HTTP/parse failure, none of which are a real "no fit" verdict
		// worth telling the user about.
		$pattern_decline_reason = '';

		if ( $allow_patterns && AIPatternMatcher::allows_pattern_insert( $existing_attributes ) ) {
			$pattern_result = self::match_ready_pattern( $gateway, $prompt, $block_name );

			// A provider that just failed would fail the generation call the same way, only later.
			if ( is_wp_error( $pattern_result['error'] ) ) {
				self::note_rejected_key( $gateway, $pattern_result['error'] );
				return self::tag_provider_failure( $gateway, $pattern_result['error'] );
			}

			if ( is_array( $pattern_result['match'] ) ) {
				return array(
					'mode'       => 'pattern',
					'pattern'    => $pattern_result['match']['pattern'],
					'confidence' => $pattern_result['match']['confidence'],
					'reason'     => $pattern_result['match']['reason'],
				);
			}
			$pattern_decline_reason = $pattern_result['declineReason'];
		}

		// No pattern answered the prompt, so this block is built from its own
		// settings — and every layer below reads them per block. A request that
		// names a block of its own has to reach it here, or it is answered with
		// another block's catalog and its own settings are dropped as unknown.
		// Only a fresh build is routed: existing attributes mean an author is
		// configuring a block that already exists, and that block is the answer.
		if ( empty( $existing_attributes ) ) {
			$block_name = AIBlockRouter::resolve( $prompt, $block_name );
		}

		$raw_json = $gateway->generate_json(
			AIPromptBuilder::get_system_prompt( $block_name ),
			AIPromptBuilder::build_user_message( $prompt, $block_name, $existing_attributes )
		);

		if ( is_wp_error( $raw_json ) ) {
			self::note_rejected_key( $gateway, $raw_json );
			return self::tag_provider_failure( $gateway, $raw_json );
		}

		$parsed = self::decode_json_response( $raw_json );
		if ( ! is_array( $parsed ) ) {
			return self::tag_provider_failure(
				$gateway,
				new \WP_Error(
					'wpcp_ai_invalid_json',
					__( 'Failed to parse AI response into valid JSON.', 'wp-carousel-free' ),
					array( 'status' => 500 )
				)
			);
		}

		return array(
			'mode'                 => 'attributes',
			'blockName'            => $block_name,
			'attributes'           => AISchemaValidator::sanitize_and_merge( $parsed, $block_name, $prompt, $existing_attributes ),
			'patternDeclineReason' => $pattern_decline_reason,
		);
	}

	/**
	 * Ask the model to pick a Ready Pattern for the prompt.
	 *
	 * No candidates means no request: a prompt nothing in the catalog resembles is
	 * not worth a round-trip. A failed or unusable selection resolves to a null
	 * match so the caller falls through to attribute generation — but unlike a
	 * bare null, this always reports why, when the model itself said why.
	 *
	 * @param TextGateway $gateway    Resolved transport.
	 * @param string      $prompt     Sanitized user prompt.
	 * @param string      $block_name Target block slug.
	 * @return array{match: array{pattern: array, confidence: float, reason: string}|null, declineReason: string, error: \WP_Error|null}
	 */
	private static function match_ready_pattern( TextGateway $gateway, string $prompt, string $block_name ): array {
		$no_match = array(
			'match'         => null,
			'declineReason' => '',
			'error'         => null,
		);

		$candidates = AIPatternMatcher::shortlist( $prompt, $block_name );
		if ( empty( $candidates ) ) {
			return $no_match;
		}

		$raw_json = $gateway->generate_json(
			AIPromptBuilder::get_pattern_selection_prompt(),
			AIPromptBuilder::build_pattern_selection_message(
				$prompt,
				$block_name,
				AIPatternMatcher::to_prompt_payload( $candidates )
			)
		);

		if ( is_wp_error( $raw_json ) ) {
			return array_merge( $no_match, array( 'error' => $raw_json ) );
		}

		$selection = self::decode_json_response( $raw_json );
		if ( ! is_array( $selection ) ) {
			return $no_match;
		}

		$match = AIPatternMatcher::resolve_selection( $selection, $candidates );

		return array(
			'match'         => $match,
			'declineReason' => null === $match && isset( $selection['reason'] ) && is_scalar( $selection['reason'] )
				? sanitize_text_field( (string) $selection['reason'] )
				: '',
			'error'         => null,
		);
	}

	/**
	 * Record a provider refusing the key this plugin stores for it.
	 *
	 * Keys are revoked, rotated, and attached to accounts that stop paying long
	 * after they were verified. Without this, the settings screen keeps showing
	 * a key that worked once as current, and the only symptom is every
	 * generation failing.
	 *
	 * Only this plugin's own stored keys are marked: a credential held by
	 * WordPress Connectors is not ours to judge, and the key stored here as a
	 * fallback may be perfectly good.
	 *
	 * @param TextGateway $gateway Gateway that made the request.
	 * @param \WP_Error   $error   Error it returned.
	 * @return void
	 */
	private static function note_rejected_key( TextGateway $gateway, \WP_Error $error ): void {
		if ( ! $gateway instanceof RemoteHttpGateway ) {
			return;
		}

		$data    = $error->get_error_data();
		$status  = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 0;
		$message = $error->get_error_message();

		// Gemini answers a bad key with 400 and says so in the message, where
		// every other provider here uses 401. 403 is left out on purpose: it is
		// also how providers report an unsupported region, a project-scoped key
		// or a model the organization cannot call, and switching AI off over one
		// of those would disable the feature for a working credential.
		$is_gemini_key_error = 400 === $status
			&& 'gemini' === $gateway->get_provider()
			&& false !== stripos( $message, 'api key' );

		if ( 401 !== $status && ! $is_gemini_key_error ) {
			return;
		}

		AIKeyManager::mark_key_invalid( $gateway->get_provider(), $message );
	}

	/**
	 * Name the provider that failed and why, so the editor can offer another one.
	 *
	 * Answered as 502: the provider's own 401 or 403 must not read as the editor's session failing.
	 *
	 * @param TextGateway $gateway Gateway that made the request.
	 * @param \WP_Error   $error   Error it returned.
	 * @return \WP_Error The same error with `provider` and `reason` in its data.
	 */
	private static function tag_provider_failure( TextGateway $gateway, \WP_Error $error ): \WP_Error {
		$data   = $error->get_error_data();
		$data   = is_array( $data ) ? $data : array();
		$reason = self::failure_reason( $error );

		$error->add_data(
			array_merge(
				$data,
				array(
					'status'          => 502,
					'upstream_status' => isset( $data['status'] ) ? (int) $data['status'] : 0,
					'provider'        => $gateway->get_provider(),
					'reason'          => $reason,
				)
			)
		);

		return $error;
	}

	/**
	 * Classify a provider error as limit, incomplete, timeout, auth or error.
	 *
	 * @param \WP_Error $error Provider error.
	 * @return string Reason key.
	 */
	private static function failure_reason( \WP_Error $error ): string {
		$message = $error->get_error_message();
		$data    = $error->get_error_data();
		$status  = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 0;

		if ( 429 === $status || preg_match( '/quota|rate[ _-]?limit|exhausted|too many requests|overloaded|credit balance|exceeded|\b429\b/i', $message ) ) {
			return 'limit';
		}

		if ( 'wpcp_ai_invalid_json' === $error->get_error_code() ) {
			return 'incomplete';
		}

		if ( preg_match( '/timed? ?out|cURL error 28/i', $message ) ) {
			return 'timeout';
		}

		if ( 401 === $status || preg_match( '/api[ _-]?key|unauthori[sz]ed|authenticat|permission|\b40[13]\b/i', $message ) ) {
			return 'auth';
		}

		return 'error';
	}

	/**
	 * Decode a model response, tolerating markdown code fences.
	 *
	 * @param string $raw_json Raw response text.
	 * @return array|null Decoded array or null when unparseable.
	 */
	private static function decode_json_response( string $raw_json ): ?array {
		$clean_json = trim( $raw_json );
		$clean_json = preg_replace( '/^```(?:json)?\s*/i', '', $clean_json );
		$clean_json = preg_replace( '/\s*```$/', '', (string) $clean_json );

		$parsed = json_decode( (string) $clean_json, true );

		return is_array( $parsed ) ? $parsed : null;
	}

	/**
	 * Constrain a prompt to the length a provider is asked to read.
	 *
	 * @param string $prompt Raw prompt.
	 * @return string
	 */
	private static function trim_prompt( string $prompt ): string {
		$prompt = trim( $prompt );

		return mb_strlen( $prompt ) > self::MAX_PROMPT_LENGTH
			? mb_substr( $prompt, 0, self::MAX_PROMPT_LENGTH )
			: $prompt;
	}
}
