<?php
/**
 * Normalizes pattern-server manifests to the internal flat item shape.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns;

defined( 'ABSPATH' ) || exit;

/**
 * Converts v1 grouped and v2 flat source JSON into the internal manifest shape.
 */
class Normalizer {

	/**
	 * List caps — a buggy or compromised source cannot push unbounded taxonomy.
	 */
	private const MAX_USE_CASES = 6;
	private const MAX_TAGS      = 12;
	private const MAX_KEYWORDS  = 20;
	private const MAX_BLOCKS    = 10;

	/**
	 * Normalize any accepted source shape.
	 *
	 * @param mixed $source Decoded source payload.
	 * @return array<int, array<string, mixed>>
	 */
	public static function normalize( $source ): array {
		if ( ! is_array( $source ) ) {
			return array();
		}

		if ( self::is_flat_payload( $source ) ) {
			return self::normalize_flat( $source['items'] );
		}

		return self::normalize_grouped( $source );
	}

	/**
	 * Flatten a v2 payload's item list.
	 *
	 * @param mixed $raw_items Source items.
	 * @return array<int, array<string, mixed>>
	 */
	public static function normalize_flat( $raw_items ): array {
		if ( ! is_array( $raw_items ) ) {
			return array();
		}

		$items = array();
		foreach ( $raw_items as $raw_item ) {
			$category   = is_array( $raw_item ) && isset( $raw_item['category'] ) ? (string) $raw_item['category'] : '';
			$normalized = self::normalize_item( $raw_item, $category );
			if ( null !== $normalized ) {
				$items[] = $normalized;
			}
		}

		return $items;
	}

	/**
	 * Flatten a v1 grouped manifest object.
	 *
	 * A category the plugin has no block mapping for is a label, not a gate —
	 * its items pass through with the category preserved.
	 *
	 * @param mixed $grouped Grouped source data (category slug => item arrays).
	 * @return array<int, array<string, mixed>>
	 */
	public static function normalize_grouped( $grouped ): array {
		if ( ! is_array( $grouped ) ) {
			return array();
		}

		$items = array();

		foreach ( $grouped as $category_slug => $group_items ) {
			if ( ! is_string( $category_slug ) || ! is_array( $group_items ) ) {
				continue;
			}

			foreach ( $group_items as $raw_item ) {
				$normalized = self::normalize_item( $raw_item, $category_slug );
				if ( null !== $normalized ) {
					$items[] = $normalized;
				}
			}
		}

		return $items;
	}

	/**
	 * Normalize a single source item from either shape.
	 *
	 * @param mixed  $raw_item      Raw source item.
	 * @param string $category_slug Source category slug (grouping key on v1).
	 * @return array<string, mixed>|null
	 */
	public static function normalize_item( $raw_item, string $category_slug = '' ): ?array {
		if ( ! is_array( $raw_item ) ) {
			return null;
		}

		$pattern_id  = $raw_item['ID'] ?? $raw_item['id'] ?? null;
		$name        = isset( $raw_item['name'] ) ? sanitize_text_field( (string) $raw_item['name'] ) : '';
		$category    = sanitize_key( isset( $raw_item['category'] ) ? (string) $raw_item['category'] : $category_slug );
		$blocks      = self::normalize_block_names( $raw_item['blocks'] ?? array() );
		$use_cases   = self::normalize_term_list( $raw_item['useCases'] ?? array(), self::MAX_USE_CASES );
		$tags        = self::normalize_term_list( $raw_item['tags'] ?? array(), self::MAX_TAGS );
		$keywords    = self::normalize_text_list( $raw_item['keywords'] ?? array(), self::MAX_KEYWORDS );
		$description = isset( $raw_item['description'] ) ? sanitize_text_field( (string) $raw_item['description'] ) : '';

		if ( null === $pattern_id || '' === $name ) {
			return null;
		}

		$id   = is_numeric( $pattern_id ) ? (int) $pattern_id : sanitize_text_field( (string) $pattern_id );
		$slug = self::resolve_slug( $raw_item, $name );

		// Identity is not optional: an item with no resolvable slug cannot be merged,
		// favorited, or superseded, so it is dropped rather than shipped half-usable.
		if ( '' === $slug ) {
			return null;
		}

		$block_name = self::resolve_block_name( $blocks, $category );
		if ( '' === $category && '' !== $block_name ) {
			$category = CategoryMap::category_for_block_name( $block_name );
		}

		$thumb = self::normalize_thumb( $raw_item['thumb'] ?? array() );
		$image = self::normalize_url( $raw_item['image'] ?? '' );
		if ( '' === $image && '' !== $thumb['1x'] ) {
			$image = $thumb['1x'];
		}

		$item = array(
			'id'          => $id,
			'slug'        => $slug,
			'name'        => $name,
			'description' => $description,
			'image'       => $image,
			'thumb'       => $thumb,
			'category'    => $category,
			'blockName'   => $block_name,
			'blocks'      => $blocks,
			'useCases'    => $use_cases,
			'sourceType'  => isset( $raw_item['sourceType'] ) ? sanitize_key( (string) $raw_item['sourceType'] ) : '',
			'tags'        => $tags,
			'keywords'    => $keywords,
			'requires'    => Requirements::normalize( $raw_item['requires'] ?? array() ),
		);

		$item = array_merge( $item, self::resolve_tier( $raw_item ) );

		if ( ! empty( $raw_item['hit'] ) && is_numeric( $raw_item['hit'] ) ) {
			$item['hit'] = (int) $raw_item['hit'];
		}

		$preview_url = self::normalize_url( $raw_item['previewUrl'] ?? ( $raw_item['url'] ?? '' ) );
		if ( '' !== $preview_url ) {
			$item['previewUrl'] = $preview_url;
		}

		if ( ! empty( $raw_item['type'] ) ) {
			$item['type'] = sanitize_key( (string) $raw_item['type'] );
		}

		$created = self::normalize_date( $raw_item['created'] ?? '' );
		if ( '' !== $created ) {
			$item['created'] = $created;
		}

		$modified = self::normalize_date( $raw_item['modified'] ?? '' );
		if ( '' !== $modified ) {
			$item['modified'] = $modified;
		}

		if ( ! empty( $raw_item['complexity'] ) ) {
			$item['complexity'] = sanitize_key( (string) $raw_item['complexity'] );
		}

		// Metadata only — nothing filters, counts, or sorts on family.
		if ( ! empty( $raw_item['family'] ) ) {
			$item['family'] = sanitize_key( (string) $raw_item['family'] );
		}

		if ( self::resolve_dark( $raw_item, $tags ) ) {
			$item['dark'] = true;
		}

		if ( ! empty( $raw_item['patternDemo'] ) ) {
			$item['patternDemo'] = true;
		}

		return $item;
	}

	/**
	 * Whether the source is a v2 flat payload.
	 *
	 * @param array<string, mixed> $source Decoded source payload.
	 * @return bool
	 */
	private static function is_flat_payload( array $source ): bool {
		$version = $source['schemaVersion'] ?? 0;

		return is_numeric( $version ) && 2 <= (int) $version && isset( $source['items'] ) && is_array( $source['items'] );
	}

	/**
	 * Resolve the durable slug for an item.
	 *
	 * @param array<string, mixed> $raw_item Raw source item.
	 * @param string               $name     Sanitized display name.
	 * @return string
	 */
	private static function resolve_slug( array $raw_item, string $name ): string {
		if ( ! empty( $raw_item['slug'] ) && is_scalar( $raw_item['slug'] ) ) {
			$explicit = sanitize_title( (string) $raw_item['slug'] );
			if ( '' !== $explicit ) {
				return $explicit;
			}
		}

		return sanitize_title( $name );
	}

	/**
	 * Resolve the target block name: explicit blocks first, category map as fallback.
	 *
	 * @param string[] $blocks   Declared block names.
	 * @param string   $category Category slug.
	 * @return string
	 */
	private static function resolve_block_name( array $blocks, string $category ): string {
		if ( ! empty( $blocks[0] ) ) {
			return $blocks[0];
		}

		return CategoryMap::block_name_for_category( $category ) ?? '';
	}

	/**
	 * Resolve `tier` and the legacy `pro` boolean, keeping both consistent.
	 *
	 * @param array<string, mixed> $raw_item Raw source item.
	 * @return array{tier: string, pro: bool}
	 */
	private static function resolve_tier( array $raw_item ): array {
		if ( ! empty( $raw_item['tier'] ) && is_scalar( $raw_item['tier'] ) ) {
			$tier = sanitize_key( (string) $raw_item['tier'] );
			if ( 'free' === $tier ) {
				return array(
					'tier' => 'free',
					'pro'  => false,
				);
			}
			if ( 'pro' === $tier || 'premium' === $tier ) {
				return array(
					'tier' => 'pro',
					'pro'  => true,
				);
			}
		}

		// A Pro pattern labelled "Free" is a refund conversation; the reverse is a
		// missed impression, so an undeclared tier stays premium.
		$pro = array_key_exists( 'pro', $raw_item ) ? (bool) $raw_item['pro'] : true;

		return array(
			'tier' => $pro ? 'pro' : 'free',
			'pro'  => $pro,
		);
	}

	/**
	 * Whether the pattern declares a dark design surface.
	 *
	 * @param array<string, mixed> $raw_item Raw source item.
	 * @param string[]             $tags     Normalized tags.
	 * @return bool
	 */
	private static function resolve_dark( array $raw_item, array $tags ): bool {
		if ( ! empty( $raw_item['dark'] ) ) {
			return true;
		}

		return in_array( PatternVocabulary::DARK_TRAIT, $tags, true );
	}

	/**
	 * Normalize the two-density thumbnail descriptor.
	 *
	 * @param mixed $raw Raw thumb data.
	 * @return array{1x: string, 2x: string, w: int, h: int}
	 */
	private static function normalize_thumb( $raw ): array {
		$thumb = array(
			'1x' => '',
			'2x' => '',
			'w'  => 0,
			'h'  => 0,
		);

		if ( ! is_array( $raw ) ) {
			return $thumb;
		}

		$thumb['1x'] = self::normalize_url( $raw['1x'] ?? '' );
		$thumb['2x'] = self::normalize_url( $raw['2x'] ?? '' );

		if ( isset( $raw['w'] ) && is_numeric( $raw['w'] ) ) {
			$thumb['w'] = max( 0, (int) $raw['w'] );
		}
		if ( isset( $raw['h'] ) && is_numeric( $raw['h'] ) ) {
			$thumb['h'] = max( 0, (int) $raw['h'] );
		}

		return $thumb;
	}

	/**
	 * Sanitize a list of taxonomy slugs with a cap.
	 *
	 * @param mixed $values Raw list.
	 * @param int   $max  Maximum entries kept.
	 * @return string[]
	 */
	private static function normalize_term_list( $values, int $max ): array {
		if ( ! is_array( $values ) ) {
			return array();
		}

		$terms = array();
		foreach ( $values as $entry ) {
			if ( ! is_scalar( $entry ) ) {
				continue;
			}
			$term = sanitize_key( (string) $entry );
			if ( '' !== $term && ! in_array( $term, $terms, true ) ) {
				$terms[] = $term;
			}
		}

		return array_slice( $terms, 0, $max );
	}

	/**
	 * Sanitize a list of free-text entries with a cap.
	 *
	 * @param mixed $values Raw list.
	 * @param int   $max  Maximum entries kept.
	 * @return string[]
	 */
	private static function normalize_text_list( $values, int $max ): array {
		if ( ! is_array( $values ) ) {
			return array();
		}

		$entries = array();
		foreach ( $values as $entry ) {
			if ( ! is_scalar( $entry ) ) {
				continue;
			}
			$text = sanitize_text_field( (string) $entry );
			if ( '' !== $text && ! in_array( $text, $entries, true ) ) {
				$entries[] = $text;
			}
		}

		return array_slice( $entries, 0, $max );
	}

	/**
	 * Sanitize declared block names (slashes are meaningful, so sanitize_key is too strict).
	 *
	 * @param mixed $values Raw list.
	 * @return string[]
	 */
	private static function normalize_block_names( $values ): array {
		if ( ! is_array( $values ) ) {
			return array();
		}

		$names = array();
		foreach ( $values as $entry ) {
			if ( ! is_scalar( $entry ) ) {
				continue;
			}
			$name = preg_replace( '/[^a-z0-9\/_-]/', '', strtolower( (string) $entry ) );
			if ( is_string( $name ) && '' !== $name && ! in_array( $name, $names, true ) ) {
				$names[] = $name;
			}
		}

		return array_slice( $names, 0, self::MAX_BLOCKS );
	}

	/**
	 * Sanitize an ISO-ish date string.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function normalize_date( $value ): string {
		if ( ! is_scalar( $value ) ) {
			return '';
		}

		$date = sanitize_text_field( (string) $value );

		return 1 === preg_match( '/^\d{4}-\d{2}-\d{2}([ T][\d:.+Z-]{1,20})?$/', $date ) ? $date : '';
	}

	/**
	 * Sanitize a URL, returning an empty string unless it is http(s).
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function normalize_url( $value ): string {
		if ( ! is_scalar( $value ) ) {
			return '';
		}

		$url = esc_url_raw( (string) $value );

		return is_string( $url ) && self::is_valid_http_url( $url ) ? $url : '';
	}

	/**
	 * Whether a URL uses http or https.
	 *
	 * @param string $url URL candidate.
	 * @return bool
	 */
	private static function is_valid_http_url( string $url ): bool {
		if ( '' === $url ) {
			return false;
		}

		$validated = filter_var( $url, FILTER_VALIDATE_URL );
		if ( false === $validated ) {
			return false;
		}

		$scheme = wp_parse_url( $url, PHP_URL_SCHEME );

		return 'http' === $scheme || 'https' === $scheme;
	}
}
