<?php
/**
 * Ready Patterns source resolution, caching, and payload lookup.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns;

defined( 'ABSPATH' ) || exit;

/**
 * Loads manifests and single-pattern payloads from the pattern server, cached in
 * uploads. Nothing ships inside the plugin: an unreachable server means an empty
 * library, not a stale one.
 */
class PatternRepository {

	/**
	 * Default remote manifest URL (WP Carousel pattern server).
	 *
	 * Pre-release placeholder host: swap it for the approved production endpoint
	 * before shipping, and update readme.txt's "External services" section in the
	 * same edit — WordPress.org requires the disclosed host to be the one called.
	 */

	private const REMOTE_MANIFEST_URL = 'https://demo.wpcarousel.io/wp-json/wp-carousel/v1/pattern-list/';

	/**
	 * Manifest cache TTL in seconds (24 hours).
	 */
	private const CACHE_TTL = DAY_IN_SECONDS;

	/**
	 * Single-payload cache TTL in seconds. Short on purpose: patterns are edited
	 * server-side and a stale payload is worse than a slow insert.
	 */
	private const PAYLOAD_TTL = 6 * HOUR_IN_SECONDS;

	/**
	 * Transient cache key.
	 */
	private const TRANSIENT_KEY = 'wpcp_ready_patterns_manifest';

	/**
	 * Per-payload transient key prefix.
	 */
	private const PAYLOAD_TRANSIENT_PREFIX = 'wpcp_rp_payload_';

	/**
	 * Option holding the payload cache generation. Payload keys are salted with it,
	 * so bumping the number retires every cached payload at once — transient names
	 * are hashed per pattern ID and cannot be enumerated for deletion.
	 */
	private const PAYLOAD_GENERATION_OPTION = 'wpcp_rp_payload_generation';

	/**
	 * Uploads sub-directory for cache files.
	 *
	 * Shared with WP Carousel Pro, which writes the same filename here. That is
	 * deliberate: both editions resolve the same manifest from the same server
	 * through the same `wpcp_patterns_remote_url` filter, so caching it twice is
	 * two fetches and two copies of one answer. The `source` stamp written by
	 * `write_cache()` is what keeps that safe — see `is_current_source()`.
	 */
	private const UPLOADS_SUBDIR = 'wp-carousel';

	/**
	 * Cache filename inside the uploads sub-directory.
	 *
	 * Identical in Pro on purpose; the two editions share this one file.
	 */
	private const CACHE_FILENAME = 'ready-patterns.json';

	/**
	 * Hard ceiling on a single pattern payload. Bounds what a buggy or compromised
	 * server can hand to `parse()` in an editor session.
	 */
	public const MAX_PAYLOAD_BYTES = 262144;

	/**
	 * Return the normalized flat manifest.
	 *
	 * @param bool $force When true, bypass cache and revalidate.
	 * @return array<int, array<string, mixed>>
	 */
	public function get_manifest( bool $force = false ): array {
		// Remote fetching switched off: there is no local catalog to fall back to, and a
		// cache written before the filter was added must not resurrect remote items.
		if ( '' === $this->get_remote_manifest_url() ) {
			return array();
		}

		$cached = $this->read_cache();

		if ( ! $force && null !== $cached && isset( $cached['normalized'] ) && is_array( $cached['normalized'] ) ) {
			return $cached['normalized'];
		}

		if ( $force ) {
			// Refresh has to reach the payloads too: a pattern edited server-side keeps
			// inserting its old markup for the rest of the payload TTL otherwise.
			$this->bump_payload_generation();
		}

		$fetched = $this->fetch_source( $cached );

		if ( 'not_modified' === $fetched['status'] && null !== $cached && isset( $cached['normalized'] ) && is_array( $cached['normalized'] ) ) {
			// Nothing changed upstream: extend the expiry and reuse the stored items.
			$cached['expires'] = time() + self::CACHE_TTL;
			$this->write_cache( $cached );

			return $cached['normalized'];
		}

		$source     = $fetched['data'];
		$normalized = Normalizer::normalize( $source );

		// An unreadable/failed source must not poison the cache for a full TTL.
		if ( is_array( $source ) ) {
			$this->write_cache(
				array(
					'grouped'       => $source,
					'normalized'    => $normalized,
					'etag'          => $fetched['etag'],
					'last_modified' => $fetched['last_modified'],
					'expires'       => time() + self::CACHE_TTL,
				)
			);
		} elseif ( null !== $cached && isset( $cached['normalized'] ) && is_array( $cached['normalized'] ) ) {
			// Failed refresh with a readable cache: keep serving what we have.
			$normalized = $cached['normalized'];
		}

		return $normalized;
	}

	/**
	 * Look up a single manifest item by ID.
	 *
	 * @param string|int $pattern_id Pattern identifier.
	 * @return array<string, mixed>|null Manifest item, or null when unknown.
	 */
	public function get_item( $pattern_id ): ?array {
		$pattern_id = (string) $pattern_id;

		foreach ( $this->get_manifest() as $item ) {
			if ( isset( $item['id'] ) && (string) $item['id'] === $pattern_id ) {
				return $item;
			}
		}

		return null;
	}

	/**
	 * Whether a manifest item is available in Free. Pro-tier patterns are
	 * previewable but never insertable, and an unknown tier resolves to Pro.
	 *
	 * @param array<string, mixed>|null $item Manifest item.
	 * @return bool
	 */
	public static function is_free_item( ?array $item ): bool {
		return is_array( $item ) && isset( $item['tier'] ) && 'free' === $item['tier'];
	}

	/**
	 * Return serialized block markup for a pattern ID.
	 *
	 * @param string|int $pattern_id Pattern identifier.
	 * @return string|null Content string or null when unknown.
	 */
	public function get_pattern_content( $pattern_id ): ?string {
		$pattern_id = is_numeric( $pattern_id ) ? (string) (int) $pattern_id : sanitize_text_field( (string) $pattern_id );
		if ( '' === $pattern_id ) {
			return null;
		}

		$cache_key = $this->payload_cache_key( $pattern_id );
		$cached    = get_transient( $cache_key );
		if ( is_string( $cached ) && '' !== $cached ) {
			return $this->within_size_limit( $cached ) ? $cached : null;
		}

		$remote_url = $this->get_remote_manifest_url();
		if ( '' === $remote_url ) {
			return null;
		}

		$content = $this->fetch_remote_pattern_content( $pattern_id, $remote_url );
		if ( ! is_string( $content ) || '' === $content ) {
			return null;
		}

		if ( ! $this->within_size_limit( $content ) ) {
			// Oversized payloads are rejected like any invalid payload — and not cached.
			return null;
		}

		set_transient( $cache_key, $content, self::PAYLOAD_TTL );

		return $content;
	}

	/**
	 * Transient key for a pattern payload in the current cache generation.
	 *
	 * @param string $pattern_id Sanitized pattern identifier.
	 * @return string
	 */
	private function payload_cache_key( string $pattern_id ): string {
		return self::PAYLOAD_TRANSIENT_PREFIX . $this->payload_generation() . '_' . $this->source_fingerprint() . '_' . md5( $pattern_id );
	}

	/**
	 * Short hash of the resolved source URL, for use inside a transient key.
	 *
	 * Pointing the plugin at a different pattern server retires the old per-payload
	 * transients instead of serving them until their TTL runs out. The *file* cache
	 * stamps the full URL rather than this hash, because that file is shared with
	 * Pro and the two editions have to agree on the stamp byte for byte or each
	 * would reject the other's entry and re-fetch on every request.
	 *
	 * @return string
	 */
	private function source_fingerprint(): string {
		return substr( md5( $this->get_remote_manifest_url() ), 0, 8 );
	}

	/**
	 * Current payload cache generation.
	 *
	 * @return int
	 */
	private function payload_generation(): int {
		return absint( get_option( self::PAYLOAD_GENERATION_OPTION, 0 ) );
	}

	/**
	 * Retire every cached payload by moving to the next generation. Superseded
	 * transients are left to expire on their own TTL.
	 *
	 * @return void
	 */
	private function bump_payload_generation(): void {
		update_option( self::PAYLOAD_GENERATION_OPTION, $this->payload_generation() + 1, false );
	}

	/**
	 * Whether the feature is enabled for the editor.
	 *
	 * @return bool
	 */
	public static function is_enabled(): bool {
		/**
		 * Filter whether the Ready Patterns library is enabled in the block editor.
		 *
		 * @param bool $enabled Default enabled state.
		 */
		$enabled = apply_filters( 'wpcp_ready_patterns_enabled', true );

		if ( ! $enabled ) {
			return false;
		}

		return \ShapedPlugin\WPCarouselFree\Admin\Dashboard\Dashboard::is_module_active( Controller::MODULE );
	}

	/**
	 * REST route path for apiFetch (no /wp-json prefix).
	 *
	 * @return string
	 */
	public static function rest_base(): string {
		return '/wpcp/v2/patterns';
	}

	/**
	 * Fetch the remote source, revalidating with stored ETag / Last-Modified.
	 *
	 * @param array<string, mixed>|null $cached Existing cache payload, when readable.
	 * @return array{status: string, data: array<string, mixed>|null, etag: string, last_modified: string}
	 */
	private function fetch_source( ?array $cached ): array {
		$result = array(
			'status'        => 'failed',
			'data'          => null,
			'etag'          => '',
			'last_modified' => '',
		);

		$remote_url = $this->get_remote_manifest_url();
		if ( '' === $remote_url ) {
			return $result;
		}

		$headers = array();
		if ( is_array( $cached ) ) {
			if ( ! empty( $cached['etag'] ) && is_string( $cached['etag'] ) ) {
				$headers['If-None-Match'] = $cached['etag'];
			}
			if ( ! empty( $cached['last_modified'] ) && is_string( $cached['last_modified'] ) ) {
				$headers['If-Modified-Since'] = $cached['last_modified'];
			}
		}

		$response = wp_safe_remote_get(
			$remote_url,
			array(
				'timeout' => 15,
				'headers' => $headers,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $result;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );

		if ( 304 === $code ) {
			$result['status'] = 'not_modified';

			return $result;
		}

		if ( 200 !== $code ) {
			return $result;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			return $result;
		}

		$result['status']        = 'ok';
		$result['data']          = $data;
		$result['etag']          = (string) wp_remote_retrieve_header( $response, 'etag' );
		$result['last_modified'] = (string) wp_remote_retrieve_header( $response, 'last-modified' );

		return $result;
	}

	/**
	 * Remote manifest URL after filter (empty string disables remote fetching).
	 *
	 * @return string
	 */
	private function get_remote_manifest_url(): string {
		/**
		 * Filter the remote Ready Patterns manifest URL.
		 *
		 * Return an empty string to disable remote fetching.
		 *
		 * @param string $url Default remote manifest URL.
		 */
		$url = apply_filters( 'wpcp_patterns_remote_url', self::REMOTE_MANIFEST_URL );

		if ( ! is_string( $url ) ) {
			return '';
		}

		$url = esc_url_raw( $url );

		return is_string( $url ) ? $url : '';
	}

	/**
	 * Whether a payload is within the ingest size limit.
	 *
	 * @param string|null $content Payload markup.
	 * @return bool
	 */
	private function within_size_limit( ?string $content ): bool {
		if ( null === $content ) {
			return false;
		}

		return strlen( $content ) <= self::MAX_PAYLOAD_BYTES;
	}

	/**
	 * Fetch a single pattern payload from the remote server.
	 *
	 * @param string $pattern_id      Pattern ID.
	 * @param string $remote_manifest Remote manifest URL.
	 * @return string|null
	 */
	private function fetch_remote_pattern_content( string $pattern_id, string $remote_manifest ): ?string {
		/**
		 * Filter the remote single-pattern URL.
		 *
		 * @param string $url             Default derived URL (may be empty).
		 * @param string $pattern_id      Requested pattern ID.
		 * @param string $remote_manifest Remote manifest URL.
		 */
		$url = apply_filters( 'wpcp_patterns_single_remote_url', '', $pattern_id, $remote_manifest );

		if ( '' === $url ) {
			$url = preg_replace( '#/pattern-list/?$#', '/single-pattern/' . rawurlencode( $pattern_id ), $remote_manifest );
			if ( ! is_string( $url ) || $url === $remote_manifest ) {
				return null;
			}
		}

		$url = esc_url_raw( $url );
		if ( ! is_string( $url ) || '' === $url ) {
			return null;
		}

		$response = wp_safe_remote_get(
			$url,
			array(
				'timeout' => 15,
			)
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			return null;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( is_array( $data ) && ! empty( $data['content'] ) && is_string( $data['content'] ) ) {
			return $data['content'];
		}

		if ( is_string( $body ) && false !== strpos( $body, '<!-- wp:' ) ) {
			return $body;
		}

		return null;
	}

	/**
	 * Read manifest cache from uploads file or transient.
	 *
	 * @return array<string, mixed>|null
	 */
	private function read_cache(): ?array {
		$file_cache = $this->read_file_cache();
		if ( null !== $file_cache ) {
			return $file_cache;
		}

		$transient = get_transient( self::TRANSIENT_KEY );
		if ( is_array( $transient ) && isset( $transient['expires'] ) && (int) $transient['expires'] > time()
			&& $this->is_current_source( $transient ) ) {
			return $transient;
		}

		return null;
	}

	/**
	 * Read cache JSON from uploads directory.
	 *
	 * @return array<string, mixed>|null
	 */
	private function read_file_cache(): ?array {
		$path = $this->get_cache_file_path();
		if ( ! is_readable( $path ) ) {
			return null;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$contents = file_get_contents( $path );
		if ( false === $contents ) {
			return null;
		}

		$data = json_decode( $contents, true );
		if ( ! is_array( $data ) || empty( $data['expires'] ) || (int) $data['expires'] <= time() ) {
			return null;
		}

		if ( ! $this->is_current_source( $data ) ) {
			return null;
		}

		return $data;
	}

	/**
	 * Whether a cache entry was written against the current source URL. Entries
	 * predating the stamp count as foreign, so an existing cache is refetched once.
	 *
	 * @param array<string, mixed> $payload Cache payload.
	 * @return bool
	 */
	private function is_current_source( array $payload ): bool {
		return isset( $payload['source'] ) && $payload['source'] === $this->get_remote_manifest_url();
	}

	/**
	 * Persist manifest cache to uploads file with transient fallback.
	 *
	 * @param array<string, mixed> $payload Cache payload.
	 */
	private function write_cache( array $payload ): void {
		$payload['source'] = $this->get_remote_manifest_url();

		$path = $this->get_cache_file_path();
		$dir  = dirname( $path );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable -- Guards the direct write below.
		if ( wp_mkdir_p( $dir ) && is_writable( $dir ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$written = file_put_contents( $path, wp_json_encode( $payload ) );
			if ( false !== $written ) {
				return;
			}
		}

		set_transient( self::TRANSIENT_KEY, $payload, self::CACHE_TTL );
	}

	/**
	 * Absolute path to the uploads cache file.
	 *
	 * @return string
	 */
	private function get_cache_file_path(): string {
		$upload_dir = wp_upload_dir();
		$base       = isset( $upload_dir['basedir'] ) ? $upload_dir['basedir'] : WP_CONTENT_DIR . '/uploads';

		return trailingslashit( $base ) . self::UPLOADS_SUBDIR . '/' . self::CACHE_FILENAME;
	}
}
