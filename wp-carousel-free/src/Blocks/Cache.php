<?php
/**
 * Transient cache for resolved source items.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

defined( 'ABSPATH' ) || exit;

/**
 * Mirrors Pro's caching semantics (same on/off option, same admin bypass, same
 * expiry, same multisite handling, same LIKE-sweep flush) over Free's own
 * transient namespace. Applied to the sources Free actually has — post and
 * product queries; Pro caches remote lookups instead, which Free does not make.
 *
 * Only the query step is cached, never rendered markup: markup carries the
 * block's uniqueId and per-request state, so replaying it would leak one
 * block's identity into another.
 */
class Cache {

	/**
	 * Free's own transient namespace, deliberately not Pro's `sp_wpcp_` — the
	 * two plugins never run together, and keeping them separate means Free's
	 * flush can never reach into a Pro install's data.
	 */
	const PREFIX = 'wpcpf_items_';

	/**
	 * Where the on/off switch lives — the same option and key Pro uses, so the
	 * preference survives an upgrade.
	 */
	const OPTION = 'sp_wpcp_settings';
	const KEY    = 'wpcp_use_cache';

	/**
	 * Request-scoped copy of the switch.
	 *
	 * @var bool|null
	 */
	private static $enabled = null;

	/**
	 * Request-scoped write lock. Reads stay on; `set()` becomes a no-op.
	 *
	 * @var bool
	 */
	private static $read_only = false;

	/**
	 * Put the cache into read-only mode, or take it back out.
	 *
	 * For surfaces where an anonymous caller controls the values the key is
	 * built from — today the AJAX-pagination route. Such a caller can vary the
	 * payload endlessly, and every variation would otherwise mint a day-long
	 * transient. Reading is still safe and still free, so only writes stop.
	 *
	 * @param bool $read_only Whether writes are suppressed.
	 * @return void
	 */
	public static function set_read_only( $read_only ) {
		self::$read_only = (bool) $read_only;
	}

	/**
	 * Whether writes are currently suppressed.
	 *
	 * @return bool
	 */
	public static function is_read_only() {
		return self::$read_only;
	}

	/**
	 * Whether caching is on.
	 *
	 * Off until switched on, unlike Pro — Free ships caching as opt-in so an
	 * existing site's output cannot change on update.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		if ( null !== self::$enabled ) {
			return self::$enabled;
		}

		$settings = get_option( self::OPTION, array() );
		$value    = is_array( $settings ) && array_key_exists( self::KEY, $settings ) ? $settings[ self::KEY ] : false;

		// A stored '' means "never set", which is also off.
		self::$enabled = ( '' === $value ) ? false : (bool) $value;

		return self::$enabled;
	}

	/**
	 * How long an entry lives. Pro's rule: a day on the frontend, filterable.
	 *
	 * @return int
	 */
	private static function expiration() {
		return (int) apply_filters( 'wpcpf_transient_expiration', DAY_IN_SECONDS );
	}

	/**
	 * Whether this request may read or write the cache.
	 *
	 * Pro's rule: anyone who can manage the plugin bypasses it, so an editor
	 * always sees current content while visitors are served from cache. The
	 * queries behind this cache are hardcoded to `post_status => publish`, so
	 * no draft or private content can enter it.
	 *
	 * @return bool
	 */
	private static function is_cacheable_request() {
		if ( ! self::is_enabled() ) {
			return false;
		}

		if ( is_admin() ) {
			return false;
		}

		return ! current_user_can( apply_filters( 'wpcpf_ui_permission', 'manage_options' ) );
	}

	/**
	 * Build a cache key from whatever uniquely identifies the query.
	 *
	 * @param string $source Source slug, e.g. "post".
	 * @param array  $parts  Values the resolved list depends on.
	 * @return string
	 */
	public static function make_key( $source, array $parts ) {
		return self::PREFIX . sanitize_key( $source ) . '_' . md5( (string) wp_json_encode( $parts ) );
	}

	/**
	 * Read a cached item list.
	 *
	 * @param string $key Cache key from make_key().
	 * @return array|null Cached items, or null on a miss.
	 */
	public static function get( $key ) {
		if ( ! self::is_cacheable_request() ) {
			return null;
		}

		$cached = is_multisite() ? get_site_transient( $key ) : get_transient( $key );

		return is_array( $cached ) ? $cached : null;
	}

	/**
	 * Store an item list.
	 *
	 * @param string $key   Cache key from make_key().
	 * @param array  $items Resolved items.
	 */
	public static function set( $key, array $items ) {
		if ( self::$read_only || ! self::is_cacheable_request() ) {
			return;
		}

		if ( is_multisite() ) {
			set_site_transient( $key, $items, self::expiration() );
		} else {
			set_transient( $key, $items, self::expiration() );
		}
	}

	/**
	 * Drop every cached list.
	 *
	 * Transients have no index, so this is a LIKE sweep of the options table —
	 * the same approach Pro's flush takes. Only ever runs on an explicit flush
	 * or a content change, never per request.
	 *
	 * @return void
	 */
	public static function flush() {
		global $wpdb;

		self::$enabled = null;

		if ( is_multisite() ) {
			$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- transients have no index to query by; cleared on demand only.
				$wpdb->prepare(
					"DELETE FROM {$wpdb->sitemeta} WHERE meta_key LIKE %s OR meta_key LIKE %s",
					$wpdb->esc_like( '_site_transient_' . self::PREFIX ) . '%',
					$wpdb->esc_like( '_site_transient_timeout_' . self::PREFIX ) . '%'
				)
			);
			return;
		}

		$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- transients have no index to query by; cleared on demand only.
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( '_transient_' . self::PREFIX ) . '%',
				$wpdb->esc_like( '_transient_timeout_' . self::PREFIX ) . '%'
			)
		);
	}

	/**
	 * Invalidate on content changes.
	 *
	 * Pro has no equivalent because it caches remote embed URLs, which no local
	 * edit can invalidate. Free caches query results, so without this an edited
	 * post would keep serving its old title or thumbnail for a full day.
	 */
	public static function init() {
		add_action( 'save_post', array( __CLASS__, 'flush' ) );
		add_action( 'deleted_post', array( __CLASS__, 'flush' ) );
		add_action( 'edited_term', array( __CLASS__, 'flush' ) );
	}
}
