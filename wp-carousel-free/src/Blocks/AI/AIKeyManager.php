<?php
/**
 * AI Key Manager
 *
 * Handles secure encryption, decryption, and storage of AI provider settings and API keys.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

use ShapedPlugin\WPCarouselFree\Blocks\AI\Gateway\RemoteHttpGateway;

defined( 'ABSPATH' ) || exit;

/**
 * AIKeyManager class.
 *
 * Stores one encrypted API key per provider (`api_keys[provider]`), not one
 * shared key for whichever provider happens to be selected. Switching the
 * provider dropdown without re-entering a key used to silently pair the new
 * provider with the previous provider's key — a guaranteed auth failure with
 * no indication of the real cause. Per-provider storage also means switching
 * back to a provider configured earlier (e.g. a free-tier key for testing
 * alongside a paid production key) doesn't force re-entering it.
 */
class AIKeyManager {

	/**
	 * Option key for AI settings.
	 */
	const OPTION_KEY = 'wpcp_ai_settings';

	/**
	 * Recognized provider slugs, in the order the settings UI offers them.
	 *
	 * @var string[]
	 */
	const PROVIDERS = array( 'openai', 'anthropic', 'gemini', 'groq' );

	/**
	 * Recognized model ids per provider. The first id in each list is that
	 * provider's recommended model, which a new Primary starts on.
	 *
	 * @var array<string, string[]>
	 */
	const PROVIDER_MODELS = array(
		'openai'    => array( 'gpt-5.6-terra', 'gpt-5.6-sol', 'gpt-5.6-luna' ),
		'anthropic' => array( 'claude-haiku-4-5-20251001', 'claude-sonnet-5' ),
		'gemini'    => array( 'gemini-3.6-flash', 'gemini-pro-latest' ),
		'groq'      => array( 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b' ),
	);

	/**
	 * Display names for the catalog models; an id missing here is shown as is.
	 *
	 * @var array<string, string>
	 */
	const MODEL_LABELS = array(
		'gpt-5.6-terra'             => 'GPT-5.6 Terra',
		'gpt-5.6-sol'               => 'GPT-5.6 Sol',
		'gpt-5.6-luna'              => 'GPT-5.6 Luna',
		'claude-haiku-4-5-20251001' => 'Claude Haiku 4.5',
		'claude-sonnet-5'           => 'Claude Sonnet 5',
		'gemini-3.6-flash'          => 'Gemini 3.6 Flash',
		'gemini-pro-latest'         => 'Gemini Pro (latest)',
		'openai/gpt-oss-120b'       => 'GPT-OSS 120B',
		'openai/gpt-oss-20b'        => 'GPT-OSS 20B',
		'qwen/qwen3.8-27b'          => 'Qwen3.8 27B',
	);

	/**
	 * Default provider when none is stored.
	 */
	const DEFAULT_PROVIDER = 'gemini';

	/**
	 * Default model when none is stored.
	 */
	const DEFAULT_MODEL = 'gemini-3.6-flash';

	/**
	 * How long a verification verdict is trusted before the key is re-checked.
	 *
	 * Long enough that opening the settings screen is not a stream of provider
	 * requests, short enough that a key revoked upstream stops being advertised
	 * as working within the day. A verdict is also discarded the moment the key
	 * it described changes, regardless of age.
	 */
	const STATUS_TTL = 12 * HOUR_IN_SECONDS;

	/**
	 * Load the stored option, migrating the legacy single-key shape
	 * (`api_key`, one key for whichever provider was last selected) into the
	 * per-provider shape (`api_keys[provider]`) the first time it's read after
	 * upgrading. Runs once: after migration `api_key` no longer exists, so
	 * this is a no-op on every later call.
	 *
	 * @return array{provider: string, model: string, api_keys: array<string, string>, key_status: array<string, array>}
	 */
	private static function get_raw_settings(): array {
		$opts = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $opts ) ) {
			$opts = array();
		}

		if ( array_key_exists( 'api_key', $opts ) ) {
			$provider = isset( $opts['provider'] ) ? sanitize_key( $opts['provider'] ) : self::DEFAULT_PROVIDER;
			$api_keys = isset( $opts['api_keys'] ) && is_array( $opts['api_keys'] ) ? $opts['api_keys'] : array();

			if ( ! empty( $opts['api_key'] ) && empty( $api_keys[ $provider ] ) ) {
				$api_keys[ $provider ] = $opts['api_key'];
			}

			unset( $opts['api_key'] );
			$opts['api_keys'] = $api_keys;
			update_option( self::OPTION_KEY, $opts );
		}

		if ( ! isset( $opts['api_keys'] ) || ! is_array( $opts['api_keys'] ) ) {
			$opts['api_keys'] = array();
		}

		if ( ! isset( $opts['key_status'] ) || ! is_array( $opts['key_status'] ) ) {
			$opts['key_status'] = array();
		}

		return $opts;
	}

	/**
	 * Save AI settings: provider, model, and the API key for one provider.
	 *
	 * The other providers' stored keys are always left untouched.
	 *
	 * @param array $settings Input settings: provider, model, api_key, key_provider.
	 * @return bool True on success, false on failure.
	 */
	public static function save_settings( array $settings ): bool {
		return self::save( $settings )['saved'];
	}

	/**
	 * Save AI settings and report what happened to the submitted API key.
	 *
	 * A key is verified with its provider before it is stored, and a key the
	 * provider rejects is not stored at all: the previously saved key stays
	 * exactly as it was. Provider and model are saved either way.
	 *
	 * `provider` is the Primary — the one generation runs on. `key_provider` is
	 * the provider whose key `api_key` / `remove_key` apply to, defaulting to
	 * `provider`, so a backup key can be saved without changing the Primary. A
	 * Primary left with no usable credential hands over to one that has one.
	 *
	 * @param array $settings Input settings: provider, model, api_key, remove_key, key_provider.
	 * @return array{saved: bool, provider: string, active: string, key: array{state: string, message: string, stored: bool}} Outcome.
	 */
	public static function save( array $settings ): array {
		$requested    = self::sanitize_provider( $settings['provider'] ?? '' );
		$key_provider = isset( $settings['key_provider'] ) ? self::sanitize_provider( $settings['key_provider'] ) : $requested;

		$existing   = self::get_raw_settings();
		$api_keys   = $existing['api_keys'];
		$key_status = $existing['key_status'];

		$outcome = array(
			'state'   => 'unchanged',
			'message' => '',
			'stored'  => false,
		);

		// A masked placeholder ("••••••••<last 4>") means "leave the stored key
		// alone"; the bullet is multi-byte, hence `strpos` over a byte slice.
		$submitted = isset( $settings['api_key'] ) && is_string( $settings['api_key'] ) ? $settings['api_key'] : '';

		if ( ! empty( $settings['remove_key'] ) ) {
			unset( $api_keys[ $key_provider ], $key_status[ $key_provider ] );
			$outcome['state'] = 'removed';
		} elseif ( '' !== $submitted && 0 !== strpos( $submitted, '••••••••' ) ) {
			$outcome = self::store_submitted_key( $key_provider, $submitted, $api_keys, $key_status );
		}

		$provider = self::resolve_active_provider( $requested, $key_provider, $api_keys, $key_status );
		$model    = self::resolve_model( $provider, isset( $settings['model'] ) ? sanitize_text_field( $settings['model'] ) : '' );

		$saved = update_option(
			self::OPTION_KEY,
			array(
				'provider'   => $provider,
				'model'      => $model,
				'api_keys'   => $api_keys,
				'key_status' => $key_status,
			)
		);

		return array(
			'saved'    => $saved,
			'provider' => $key_provider,
			'active'   => $provider,
			'key'      => $outcome,
		);
	}

	/**
	 * Whitelist a provider slug.
	 *
	 * @param mixed $provider Raw provider slug.
	 * @return string Known slug, or the default provider.
	 */
	private static function sanitize_provider( $provider ): string {
		$provider = sanitize_key( (string) $provider );

		return in_array( $provider, self::PROVIDERS, true ) ? $provider : self::DEFAULT_PROVIDER;
	}

	/**
	 * The provider generation should run on once this save lands.
	 *
	 * The requested Primary while it can serve a request, else the provider
	 * just given a key, else the first usable one; with none usable, the
	 * request stands.
	 *
	 * @param string $requested    Requested Primary.
	 * @param string $key_provider Provider whose key was just saved or removed.
	 * @param array  $api_keys     Encrypted keys after this save.
	 * @param array  $key_status   Verdicts after this save.
	 * @return string Provider slug.
	 */
	private static function resolve_active_provider( string $requested, string $key_provider, array $api_keys, array $key_status ): string {
		$is_usable = static function ( string $slug ) use ( $api_keys, $key_status ): bool {
			$has_key = ! empty( $api_keys[ $slug ] ) && AIKeyValidator::STATE_INVALID !== ( $key_status[ $slug ]['state'] ?? '' );

			return $has_key || ConnectorBridge::is_connected( $slug, false );
		};

		foreach ( array_merge( array( $requested, $key_provider ), self::PROVIDERS ) as $slug ) {
			if ( $is_usable( $slug ) ) {
				return $slug;
			}
		}

		return $requested;
	}

	/**
	 * The model to store for a provider.
	 *
	 * A retired id is remapped, an unknown id falls back to the provider's
	 * recommended model, and the stored model survives a re-save even when a
	 * connector's model list is momentarily unavailable.
	 *
	 * @param string $provider Provider slug.
	 * @param string $model    Submitted model id.
	 * @return string Model id.
	 */
	private static function resolve_model( string $provider, string $model ): string {
		$allowed_models = self::allowed_models( $provider );

		if ( ! in_array( $model, $allowed_models, true ) ) {
			$remap = RemoteHttpGateway::DEPRECATED_MODEL_MAP[ $provider ] ?? array();
			$model = $remap[ $model ] ?? $model;
		}

		$stored = self::get_settings();
		if ( $provider === $stored['provider'] && '' !== $stored['model'] && $model === $stored['model'] ) {
			$allowed_models[] = $stored['model'];
		}

		return in_array( $model, $allowed_models, true ) ? $model : $allowed_models[0];
	}

	/**
	 * Verify a freshly typed key and, if the provider accepts it, store it.
	 *
	 * A provider that cannot be reached leaves the key stored but unverified
	 * rather than refused: a site behind an outage or a firewall must still be
	 * able to configure a credential, and "not verified" is an honest label for
	 * one nobody has confirmed yet.
	 *
	 * @param string $provider   Provider slug.
	 * @param string $submitted  Raw key exactly as submitted.
	 * @param array  $api_keys   Encrypted keys, modified in place.
	 * @param array  $key_status Verdicts, modified in place.
	 * @return array{state: string, message: string, stored: bool} Outcome for this key.
	 */
	private static function store_submitted_key( string $provider, string $submitted, array &$api_keys, array &$key_status ): array {
		$api_key = sanitize_text_field( $submitted );

		// sanitize_text_field() trims, so a field holding only spaces arrives
		// here empty. That is not "leave the key alone" — the user typed
		// something, and it cannot become a credential.
		if ( '' === $api_key ) {
			return array(
				'state'   => AIKeyValidator::STATE_EMPTY,
				'message' => __( 'Enter an API key — the field contains only spaces.', 'wp-carousel-free' ),
				'stored'  => false,
			);
		}

		$verdict = AIKeyValidator::validate( $provider, $api_key );

		if ( AIKeyValidator::STATE_INVALID === $verdict['state'] || AIKeyValidator::STATE_EMPTY === $verdict['state'] ) {
			return array(
				'state'   => $verdict['state'],
				'message' => $verdict['message'],
				'stored'  => false,
			);
		}

		$encrypted = self::encrypt( $api_key );
		if ( '' === $encrypted ) {
			return array(
				'state'   => 'failed',
				'message' => __( 'The API key could not be encrypted for storage. Please try saving again.', 'wp-carousel-free' ),
				'stored'  => false,
			);
		}

		$api_keys[ $provider ]   = $encrypted;
		$key_status[ $provider ] = self::status_record( $api_key, $verdict );

		return array(
			'state'   => $verdict['state'],
			'message' => $verdict['message'],
			'stored'  => true,
		);
	}

	/**
	 * Shape one stored verdict.
	 *
	 * The fingerprint ties a verdict to the exact key it describes, so a verdict
	 * can never outlive its key — a key replaced through any path (import, WP-CLI,
	 * a direct option write) leaves a fingerprint that no longer matches and the
	 * stale verdict is discarded instead of being reported for the new key.
	 *
	 * @param string $api_key Plaintext key the verdict is about.
	 * @param array  $verdict Verdict from AIKeyValidator.
	 * @return array{state: string, message: string, checked_at: int, fingerprint: string}
	 */
	private static function status_record( string $api_key, array $verdict ): array {
		return array(
			'state'       => $verdict['state'],
			'message'     => $verdict['message'],
			'checked_at'  => time(),
			'fingerprint' => self::fingerprint( $api_key ),
		);
	}

	/**
	 * Salted, non-reversible identifier for a key.
	 *
	 * @param string $api_key Plaintext key.
	 * @return string Fingerprint.
	 */
	private static function fingerprint( string $api_key ): string {
		return substr( wp_hash( $api_key ), 0, 16 );
	}

	/**
	 * Model ids a provider may be saved with.
	 *
	 * A provider reached through Connectors is not limited to this plugin's
	 * hardcoded catalog — the AI client registry reports what that provider
	 * actually serves, which is both wider and more current. The static catalog
	 * stays allowed alongside it, so disconnecting a connector never
	 * invalidates a model the user picked earlier.
	 *
	 * The connector half is read from cache only. Validating a submitted value
	 * against a live probe would mean a provider that fails to answer between
	 * rendering the form and submitting it silently rewrites the user's model.
	 *
	 * @param string $provider Provider slug.
	 * @return string[] Allowed model ids, this plugin's recommended one first.
	 */
	public static function allowed_models( string $provider ): array {
		$catalog = self::PROVIDER_MODELS[ $provider ] ?? array();

		return array_values( array_unique( array_merge( $catalog, ConnectorBridge::get_cached_model_ids( $provider ) ) ) );
	}

	/**
	 * Model ids a generate request may name for a provider; the Primary's stored model stays allowed.
	 *
	 * @param string $provider Provider slug.
	 * @return string[] Model ids.
	 */
	private static function requestable_models( string $provider ): array {
		$models   = self::allowed_models( $provider );
		$settings = self::get_settings();

		if ( $provider === $settings['provider'] && '' !== $settings['model'] && ! in_array( $settings['model'], $models, true ) ) {
			$models[] = $settings['model'];
		}

		return $models;
	}

	/**
	 * A requested model when the provider offers it, otherwise empty so the gateway picks.
	 *
	 * @param string $provider Provider slug.
	 * @param string $model    Requested model id.
	 * @return string Model id, or empty.
	 */
	public static function sanitize_request_model( string $provider, string $model ): string {
		return in_array( $model, self::requestable_models( $provider ), true ) ? $model : '';
	}

	/**
	 * Providers that can serve a request now, Primary first, with the model each starts on.
	 *
	 * Never probes a connector, so it is safe on an editor page load.
	 *
	 * @return array<int, array{slug: string, model: string, recommended: string, models: array<int, array{value: string, label: string}>}>
	 */
	public static function usable_providers(): array {
		$settings = self::get_settings();
		$opts     = self::get_raw_settings();
		$order    = array_unique( array_merge( array( $settings['provider'] ), self::PROVIDERS ) );
		$rows     = array();

		foreach ( $order as $slug ) {
			if ( ! in_array( $slug, self::PROVIDERS, true ) ) {
				continue;
			}

			$has_usable_key = '' !== self::get_decrypted_key( $slug )
				&& AIKeyValidator::STATE_INVALID !== self::read_status( $slug, $opts )['state'];

			if ( ! $has_usable_key && ! ConnectorBridge::is_connected( $slug, false ) ) {
				continue;
			}

			$models          = self::requestable_models( $slug );
			$connector_names = wp_list_pluck( ConnectorBridge::get_cached_models( $slug ), 'label', 'value' );
			$start_model     = $slug === $settings['provider'] && in_array( $settings['model'], $models, true ) ? $settings['model'] : (string) reset( $models );

			$rows[] = array(
				'slug'        => $slug,
				'model'       => $start_model,
				'recommended' => self::PROVIDER_MODELS[ $slug ][0] ?? '',
				'models'      => array_map(
					static function ( string $model ) use ( $connector_names ): array {
						return array(
							'value' => $model,
							'label' => self::MODEL_LABELS[ $model ] ?? ( $connector_names[ $model ] ?? $model ),
						);
					},
					$models
				),
			);
		}

		return $rows;
	}

	/**
	 * Get the decrypted API key for a provider.
	 *
	 * @param string $provider Provider slug, or empty for the currently configured provider.
	 * @return string Decrypted API key or empty string.
	 */
	public static function get_decrypted_key( string $provider = '' ): string {
		$opts     = self::get_raw_settings();
		$provider = '' !== $provider ? sanitize_key( $provider ) : (string) ( $opts['provider'] ?? self::DEFAULT_PROVIDER );

		if ( empty( $opts['api_keys'][ $provider ] ) ) {
			return '';
		}

		return self::decrypt( (string) $opts['api_keys'][ $provider ] );
	}

	/**
	 * Current verdict on a provider's stored key, without contacting anyone.
	 *
	 * @param string $provider Provider slug.
	 * @return array{state: string, message: string, checked_at: int} Verdict; `none` when no key is stored, `unknown` when it has never been checked or the check went stale.
	 */
	public static function get_key_status( string $provider ): array {
		$opts = self::get_raw_settings();

		return self::read_status( $provider, $opts );
	}

	/**
	 * Verify a provider's stored key and remember the answer.
	 *
	 * Re-uses a fresh verdict by default so opening the settings screen does not
	 * become a round of provider requests; `$force` is for the user explicitly
	 * asking for a re-check.
	 *
	 * @param string $provider Provider slug.
	 * @param bool   $force    Ignore a cached verdict and ask the provider again.
	 * @return array{state: string, message: string, checked_at: int} Verdict.
	 */
	public static function verify_stored_key( string $provider, bool $force = false ): array {
		$provider = sanitize_key( $provider );
		$opts     = self::get_raw_settings();
		$current  = self::read_status( $provider, $opts );

		if ( AIKeyValidator::STATE_NONE === $current['state'] ) {
			return $current;
		}

		if ( ! $force && AIKeyValidator::STATE_UNKNOWN !== $current['state'] ) {
			return $current;
		}

		$api_key = self::get_decrypted_key( $provider );

		// Something is stored but no longer decrypts: this site's salts changed
		// since it was saved (a moved database, rotated wp-config.php keys).
		// That key can never be read again, so it gets a verdict of its own
		// rather than staying "unknown" — an unknown that no re-check can
		// resolve is a screen that asks forever.
		$verdict = '' === $api_key
			? array(
				'state'   => AIKeyValidator::STATE_INVALID,
				'message' => __( 'The stored API key can no longer be read — this site\'s security keys changed since it was saved. Paste the key again.', 'wp-carousel-free' ),
			)
			: AIKeyValidator::validate( $provider, $api_key );
		$record  = self::status_record( $api_key, $verdict );

		// The check can take seconds; write only this verdict onto a fresh read, and
		// only while the key it describes is still the one stored.
		$stored_cipher = (string) ( $opts['api_keys'][ $provider ] ?? '' );
		wp_cache_delete( self::OPTION_KEY, 'options' );
		wp_cache_delete( 'alloptions', 'options' );
		$latest = self::get_raw_settings();
		if ( (string) ( $latest['api_keys'][ $provider ] ?? '' ) !== $stored_cipher ) {
			return self::read_status( $provider, $latest );
		}

		$latest['key_status'][ $provider ] = $record;
		update_option( self::OPTION_KEY, $latest );

		return self::public_status( $record );
	}

	/**
	 * Record that a provider refused the stored key during a real request.
	 *
	 * A key can be revoked, rotated or hit an expired billing account long after
	 * it was verified. The screen that reports it must not keep claiming the key
	 * works simply because it did when it was saved.
	 *
	 * @param string $provider Provider slug.
	 * @param string $message  Provider's own explanation.
	 * @return void
	 */
	public static function mark_key_invalid( string $provider, string $message ): void {
		$provider = sanitize_key( $provider );
		$api_key  = self::get_decrypted_key( $provider );

		if ( '' === $api_key ) {
			return;
		}

		$opts                            = self::get_raw_settings();
		$opts['key_status'][ $provider ] = self::status_record(
			$api_key,
			array(
				'state'   => AIKeyValidator::STATE_INVALID,
				'message' => AIKeyValidator::rejection_message( $provider, sanitize_text_field( $message ) ),
			)
		);

		update_option( self::OPTION_KEY, $opts );
	}

	/**
	 * Read a provider's stored verdict out of an already-loaded option.
	 *
	 * @param string $provider Provider slug.
	 * @param array  $opts     Raw settings.
	 * @return array{state: string, message: string, checked_at: int}
	 */
	private static function read_status( string $provider, array $opts ): array {
		$empty = array(
			'state'      => AIKeyValidator::STATE_NONE,
			'message'    => '',
			'checked_at' => 0,
		);

		if ( empty( $opts['api_keys'][ $provider ] ) ) {
			return $empty;
		}

		$unknown = array(
			'state'      => AIKeyValidator::STATE_UNKNOWN,
			'message'    => '',
			'checked_at' => 0,
		);

		$record = $opts['key_status'][ $provider ] ?? null;
		if ( ! is_array( $record ) || empty( $record['state'] ) ) {
			return $unknown;
		}

		// A verdict older than the TTL, or one describing a different key than
		// the one now stored, says nothing about what is stored today.
		$checked_at = isset( $record['checked_at'] ) ? (int) $record['checked_at'] : 0;
		if ( ( time() - self::STATUS_TTL ) > $checked_at ) {
			return $unknown;
		}

		$fingerprint = isset( $record['fingerprint'] ) ? (string) $record['fingerprint'] : '';
		if ( '' === $fingerprint || self::fingerprint( self::decrypt( (string) $opts['api_keys'][ $provider ] ) ) !== $fingerprint ) {
			return $unknown;
		}

		return self::public_status( $record );
	}

	/**
	 * Reduce a stored verdict to the fields other layers may see.
	 *
	 * @param array $record Stored verdict.
	 * @return array{state: string, message: string, checked_at: int}
	 */
	private static function public_status( array $record ): array {
		return array(
			'state'      => (string) $record['state'],
			'message'    => isset( $record['message'] ) ? (string) $record['message'] : '',
			'checked_at' => isset( $record['checked_at'] ) ? (int) $record['checked_at'] : 0,
		);
	}

	/**
	 * Get stored AI settings (provider + model only — keys never leave this class unmasked).
	 *
	 * @return array Saved settings.
	 */
	public static function get_settings(): array {
		$opts = self::get_raw_settings();

		return array(
			'provider' => isset( $opts['provider'] ) ? (string) $opts['provider'] : self::DEFAULT_PROVIDER,
			'model'    => isset( $opts['model'] ) ? (string) $opts['model'] : self::DEFAULT_MODEL,
		);
	}

	/**
	 * Get public-safe AI settings for JS localization.
	 *
	 * `has_key` answers the one question the block editor's AI builder asks: can
	 * a request be made right now. That is true for a provider configured in
	 * WordPress Connectors even though this plugin stores no key for it, so the
	 * builder does not demand a key the site already has — and false for a key
	 * the provider is known to reject, which is not a usable credential however
	 * much of it is stored.
	 *
	 * `keys` reports this plugin's own storage per provider, so the settings
	 * screen can show the right masked value the instant the provider dropdown
	 * changes, with no round trip. Each entry carries the verification verdict
	 * alongside it, so no screen has to infer validity from "a value exists".
	 * `connectors` reports the same providers' state in WordPress Connectors,
	 * which is what decides whether the key field is shown at all.
	 *
	 * Only the settings screen needs an authoritative connector answer, and
	 * only it needs the model list. The block editor's payload is built on
	 * requests that can be REST requests, so it settles for the free answer
	 * rather than letting a page load reach out to a provider.
	 *
	 * @param bool $probe_connectors Whether to verify connector state, at the cost of an HTTP request on a cold cache.
	 * @param bool $with_models      Whether a probe also reads each connected provider's model list.
	 * @return array Public settings.
	 */
	public static function get_public_settings( bool $probe_connectors = false, bool $with_models = true ): array {
		$provider = self::get_settings()['provider'];

		// No key is verified here. This runs while an admin page renders, and a
		// provider that hangs would hold the whole screen for the validator's
		// timeout. A key with no fresh verdict is reported as `unknown`, which
		// the settings screen resolves through wpcpf_ai_verify_key without
		// blocking anything — and which no screen renders as "Configured".
		$opts = self::get_raw_settings();
		$keys = array();
		foreach ( self::PROVIDERS as $slug ) {
			$decrypted     = self::get_decrypted_key( $slug );
			$status        = self::read_status( $slug, $opts );
			$keys[ $slug ] = array(
				'has_key'    => '' !== $decrypted,
				'masked_key' => self::mask( $decrypted ),
				'status'     => $status['state'],
				'message'    => $status['message'],
				'checked_at' => $status['checked_at'],
			);
		}

		$current = $keys[ $provider ] ?? array(
			'has_key'    => false,
			'masked_key' => '',
			'status'     => AIKeyValidator::STATE_NONE,
		);

		$connectors = ConnectorBridge::get_public_statuses( self::PROVIDERS, $probe_connectors );

		// Only connected providers report models: a disconnected one has nothing
		// to say, and the settings screen falls back to its static catalog.
		$connector_models = array();
		if ( $probe_connectors && $with_models ) {
			foreach ( self::PROVIDERS as $slug ) {
				$models = ConnectorBridge::get_models( $slug );
				if ( ! empty( $models ) ) {
					$connector_models[ $slug ] = $models;
				}
			}
		}

		$usable_key = $current['has_key'] && AIKeyValidator::STATE_INVALID !== $current['status'];

		return array(
			'provider'         => $provider,
			'model'            => isset( $opts['model'] ) ? (string) $opts['model'] : self::DEFAULT_MODEL,
			'has_key'          => $usable_key || ! empty( $connectors[ $provider ]['connected'] ),
			'key_status'       => $current['status'],
			'key_message'      => isset( $current['message'] ) ? $current['message'] : '',
			'masked_key'       => $current['masked_key'],
			'keys'             => $keys,
			'connectors'       => $connectors,
			'connector_models' => $connector_models,
			'connectors_url'   => ConnectorBridge::settings_url(),
			'ai_enabled'       => AIFeature::is_available(),
		);
	}

	/**
	 * Mask a decrypted key down to its last 4 characters.
	 *
	 * @param string $decrypted Decrypted API key, or empty.
	 * @return string Masked key, or empty string when there is nothing to mask.
	 */
	private static function mask( string $decrypted ): string {
		if ( '' === $decrypted ) {
			return '';
		}

		$length = strlen( $decrypted );
		$suffix = $length > 4 ? substr( $decrypted, -4 ) : $decrypted;

		return '••••••••' . $suffix;
	}

	/**
	 * Encrypt string using OpenSSL with auth salt.
	 *
	 * @param string $value Plaintext value.
	 * @return string Base64 encoded IV + encrypted data.
	 */
	private static function encrypt( string $value ): string {
		if ( empty( $value ) ) {
			return '';
		}

		$key = wp_salt( 'auth' );
		$iv  = openssl_random_pseudo_bytes( 16 );
		$enc = openssl_encrypt( $value, 'aes-256-cbc', $key, 0, $iv );

		if ( false === $enc ) {
			return '';
		}

		return base64_encode( $iv . $enc ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- binary IV + ciphertext stored as text.
	}

	/**
	 * Decrypt string using OpenSSL with auth salt.
	 *
	 * @param string $raw Base64 payload.
	 * @return string Decrypted plaintext value.
	 */
	private static function decrypt( string $raw ): string {
		if ( empty( $raw ) ) {
			return '';
		}

		$data = base64_decode( $raw, true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- reverses encrypt().
		if ( false === $data || strlen( $data ) < 17 ) {
			return '';
		}

		$iv  = substr( $data, 0, 16 );
		$enc = substr( $data, 16 );
		$key = wp_salt( 'auth' );
		$dec = openssl_decrypt( $enc, 'aes-256-cbc', $key, 0, $iv );

		return false !== $dec ? $dec : '';
	}
}
