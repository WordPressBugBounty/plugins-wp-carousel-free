<?php
/**
 * Ready Patterns favorites ("My Patterns" hearts) storage.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns;

defined( 'ABSPATH' ) || exit;

/**
 * Per-user favorited patterns, keyed by the pattern's durable slug.
 *
 * Slugs rather than IDs: an ID changes when a pattern is edited, re-imported, or
 * republished on the server, which would silently empty the heart. Entries stored
 * as IDs before this change are kept as-is until the next toggle rewrites them,
 * and the editor matches them against the manifest.
 */
class PatternFavorites {

	/**
	 * User meta key holding this user's favorites.
	 */
	private const META_KEY = 'wpcp_ready_patterns_favorites';

	/**
	 * Legacy site-wide option, kept as a read-through starting set.
	 */
	private const LEGACY_OPTION_KEY = 'wpcp_ready_patterns_favorites';

	/**
	 * Return the current user's favorited pattern keys.
	 *
	 * @return array<int, int|string>
	 */
	public static function get_all(): array {
		$user_id = get_current_user_id();
		if ( 0 === $user_id ) {
			return array();
		}

		if ( metadata_exists( 'user', $user_id, self::META_KEY ) ) {
			$favorites = get_user_meta( $user_id, self::META_KEY, true );

			return is_array( $favorites ) ? self::normalize_list( $favorites ) : array();
		}

		// No meta yet: start this user from the legacy shared list. The option is left
		// untouched, so every existing site keeps its starting set with no migration.
		return self::normalize_list( self::read_legacy_option() );
	}

	/**
	 * Add a pattern to the current user's favorites.
	 *
	 * @param string|int      $pattern_key Pattern slug (preferred) or ID.
	 * @param string|int|null $legacy_id   Pattern ID, when a slug was supplied.
	 * @return array<int, int|string> Updated favorites list.
	 */
	public static function add( $pattern_key, $legacy_id = null ): array {
		$key       = self::normalize_key( $pattern_key );
		$favorites = self::get_all();

		if ( '' === $key || 0 === $key ) {
			return $favorites;
		}

		// A pre-slug entry for the same pattern is rewritten rather than duplicated.
		$favorites = self::without( $favorites, $legacy_id );

		if ( ! in_array( $key, $favorites, true ) ) {
			$favorites[] = $key;
		}

		return self::persist( $favorites );
	}

	/**
	 * Remove a pattern from the current user's favorites.
	 *
	 * @param string|int      $pattern_key Pattern slug (preferred) or ID.
	 * @param string|int|null $legacy_id   Pattern ID, when a slug was supplied.
	 * @return array<int, int|string> Updated favorites list.
	 */
	public static function remove( $pattern_key, $legacy_id = null ): array {
		$favorites = self::without( self::get_all(), $pattern_key );
		$favorites = self::without( $favorites, $legacy_id );

		return self::persist( $favorites );
	}

	/**
	 * Persist the list to the current user's meta.
	 *
	 * @param array<int, int|string> $favorites Favorites list.
	 * @return array<int, int|string>
	 */
	private static function persist( array $favorites ): array {
		$favorites = array_values( $favorites );
		$user_id   = get_current_user_id();

		if ( 0 !== $user_id ) {
			update_user_meta( $user_id, self::META_KEY, $favorites );
		}

		return $favorites;
	}

	/**
	 * Return the list without a given key (matching across id/slug types).
	 *
	 * @param array<int, int|string> $favorites Favorites list.
	 * @param string|int|null        $candidate Key to drop.
	 * @return array<int, int|string>
	 */
	private static function without( array $favorites, $candidate ): array {
		if ( null === $candidate ) {
			return $favorites;
		}

		$candidate = (string) self::normalize_key( $candidate );
		if ( '' === $candidate ) {
			return $favorites;
		}

		return array_values(
			array_filter(
				$favorites,
				static function ( $entry ) use ( $candidate ) {
					return (string) $entry !== $candidate;
				}
			)
		);
	}

	/**
	 * Read the legacy site-wide option.
	 *
	 * @return array<int, mixed>
	 */
	private static function read_legacy_option(): array {
		$favorites = get_option( self::LEGACY_OPTION_KEY, array() );

		return is_array( $favorites ) ? $favorites : array();
	}

	/**
	 * Normalize a stored list.
	 *
	 * @param array<int, mixed> $favorites Raw list.
	 * @return array<int, int|string>
	 */
	private static function normalize_list( array $favorites ): array {
		$normalized = array();
		foreach ( $favorites as $entry ) {
			if ( ! is_scalar( $entry ) ) {
				continue;
			}
			$key = self::normalize_key( $entry );
			if ( '' !== $key && 0 !== $key && ! in_array( $key, $normalized, true ) ) {
				$normalized[] = $key;
			}
		}

		return $normalized;
	}

	/**
	 * Normalize a key (numeric → int, else sanitized slug-safe string).
	 *
	 * @param mixed $pattern_key Raw key.
	 * @return int|string
	 */
	private static function normalize_key( $pattern_key ) {
		if ( is_numeric( $pattern_key ) ) {
			return (int) $pattern_key;
		}

		return sanitize_text_field( (string) $pattern_key );
	}
}
