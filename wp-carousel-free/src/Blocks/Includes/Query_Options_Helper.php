<?php
/**
 * Maps block queryOptions to WP_Query arguments (post and product sources).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Includes;

defined( 'ABSPATH' ) || exit;

/**
 * Query_Options_Helper class.
 */
class Query_Options_Helper {

	/**
	 * Inclusive upper bound for client-controlled per-page sizes on the
	 * anonymous AJAX-pagination and editor-preview REST surfaces. Shared so the
	 * server clamp and the inspector control's `max` stay in lockstep.
	 *
	 * @var int
	 */
	const LIMIT_MAX = 100;

	/**
	 * Top-level keys allowed inside an untrusted `queryOptions` payload.
	 *
	 * @var string[]
	 */
	const ALLOWED_QUERY_KEYS = array(
		'postTypes',
		'filter',
		'offset',
		'limit',
		'orderBy',
		'order',
	);

	/**
	 * Whitelist + strictly sanitize an untrusted `queryOptions` payload so a
	 * malformed or hostile call cannot poison the WP_Query downstream.
	 *
	 * Shared by the anonymous AJAX-pagination controller and the editor
	 * preview endpoint so both surfaces sanitize identically. Unknown keys are
	 * dropped; post types / taxonomies are intersected with the public sets;
	 * ids are `absint`ed; order enums are fixed; `limit` is clamped to
	 * `1..LIMIT_MAX`.
	 *
	 * @param array $raw Raw query options.
	 * @return array
	 */
	public static function sanitize_untrusted_query_options( array $raw ): array {
		$clean = array();
		foreach ( $raw as $key => $value ) {
			if ( ! in_array( $key, self::ALLOWED_QUERY_KEYS, true ) ) {
				continue;
			}
			$clean[ $key ] = $value;
		}

		$public_post_types = get_post_types( array( 'public' => true ), 'names' );

		if ( isset( $clean['postTypes'] ) ) {
			$post_types         = is_array( $clean['postTypes'] ) ? $clean['postTypes'] : array( $clean['postTypes'] );
			$post_types         = array_map( 'sanitize_key', array_map( 'strval', $post_types ) );
			$clean['postTypes'] = array_values( array_intersect( $post_types, $public_post_types ) );
		}

		if ( isset( $clean['filter'] ) && is_string( $clean['filter'] ) ) {
			$clean['filter'] = sanitize_key( $clean['filter'] );
		}

		if ( isset( $clean['orderBy'] ) && is_string( $clean['orderBy'] ) ) {
			$clean['orderBy'] = self::sanitize_orderby( $clean['orderBy'] );
		}

		if ( isset( $clean['limit'] ) ) {
			$clean['limit'] = min( self::LIMIT_MAX, max( 1, (int) $clean['limit'] ) );
		}
		if ( isset( $clean['offset'] ) ) {
			$clean['offset'] = max( 0, (int) $clean['offset'] );
		}
		if ( isset( $clean['order'] ) && is_string( $clean['order'] ) ) {
			$clean['order'] = strtoupper( $clean['order'] ) === 'ASC' ? 'ASC' : 'DESC';
		}

		return $clean;
	}

	/**
	 * Whitelist a WP_Query `orderby` value.
	 *
	 * Do not run `sanitize_key()` on orderby — it lowercases, and WP_Query treats
	 * `id` as an unknown key (falls through to `post_date`) while `ID` sorts by
	 * primary key. Match case-insensitively, return the canonical form.
	 *
	 * @param string $order_by Raw orderby from attributes or an untrusted payload.
	 * @return string
	 */
	public static function sanitize_orderby( string $order_by ): string {
		$order_by = substr( trim( $order_by ), 0, 32 );
		$allowed  = array(
			'date',
			'ID',
			'title',
			'name',
			'modified',
			'rand',
			'menu_order',
			'comment_count',
			'meta_value',
			'meta_value_num',
			'post__in',
			'none',
			'relevance',
			'author',
			'type',
			'parent',
		);

		foreach ( $allowed as $canonical ) {
			if ( strtolower( $canonical ) === strtolower( $order_by ) ) {
				return $canonical;
			}
		}

		return 'date';
	}

	/**
	 * Merge WooCommerce catalog visibility tax_query into WP_Query args.
	 *
	 * Mirrors the shortcode product carousel so hidden/out-of-catalog products
	 * stay excluded unless a store filter overrides WC defaults.
	 *
	 * @param array $args WP_Query arguments.
	 * @return array
	 */
	public static function apply_wc_catalog_tax_query( array $args ): array {
		if ( ! function_exists( 'WC' ) || ! WC()->query ) {
			return $args;
		}

		$wc_tax_query = WC()->query->get_tax_query();
		if ( empty( $wc_tax_query ) || ! is_array( $wc_tax_query ) ) {
			return $args;
		}

		$existing = isset( $args['tax_query'] ) && is_array( $args['tax_query'] ) ? $args['tax_query'] : array();
		if ( empty( $existing ) ) {
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- Taxonomy filtering is the feature.
			$args['tax_query'] = $wc_tax_query;
			return $args;
		}

		$merged = array( 'relation' => 'AND' );
		foreach ( $wc_tax_query as $clause ) {
			$merged[] = $clause;
		}
		if ( isset( $existing['relation'] ) ) {
			foreach ( $existing as $key => $clause ) {
				if ( 'relation' === $key ) {
					continue;
				}
				$merged[] = $clause;
			}
		} else {
			$merged[] = $existing;
		}

		// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- Taxonomy filtering is the feature.
		$args['tax_query'] = $merged;
		return $args;
	}

	/**
	 * Append random order from layout options (overrides orderby).
	 *
	 * @param array $args           WP_Query args.
	 * @param array $layout_options Block layoutOptions.
	 * @return array
	 */
	public static function apply_layout_random( array $args, array $layout_options ): array {
		if ( ! empty( $layout_options['randomOrder'] ) ) {
			$args['orderby'] = 'rand';
		}
		return $args;
	}

	/**
	 * Whether this fetch serves the Tiles block with AJAX pagination enabled.
	 *
	 * Paginated tiles change the post/product query contract:
	 * `queryOptions.limit` becomes the per-page size and the renderer slices
	 * the full result set into pages, so the sources must fetch every
	 * matching post in a stable order (see `apply_tiles_ajax_query_tweaks`).
	 *
	 * @param array $attributes Block attributes.
	 * @return bool
	 */
	public static function is_tiles_ajax_request( array $attributes ): bool {
		$layout_options = isset( $attributes['layoutOptions'] ) && is_array( $attributes['layoutOptions'] ) ? $attributes['layoutOptions'] : array();
		return 'tiles' === ( $attributes['blockName'] ?? '' ) && ! empty( $layout_options['pagination'] );
	}

	/**
	 * Adjust WP_Query args for the Tiles AJAX pagination candidate fetch.
	 *
	 * Must run after `apply_layout_random()` so the
	 * random-order override sees the final `orderby`. Paginated tiles resolve
	 * the candidate set as post IDs only, then hydrate full post objects for
	 * the requested page alone (two-step fetch), so this bounds and slims the
	 * candidate query. Tweaks:
	 *
	 * - `fields => 'ids'`: fetch IDs only; the partition pipeline (offset →
	 *   seeded shuffle → gallery filter → page slice) runs over the ID list and
	 *   the page slice is hydrated separately (`Source::hydrate_ids()`).
	 * - `no_found_rows => true` + `update_post_meta_cache`/`update_post_term_cache
	 *   => false`: the candidate query never needs `SQL_CALC_FOUND_ROWS` or the
	 *   meta/term caches — those are primed by the page-hydration query.
	 * - `posts_per_page => apply_filters( 'wpcp_tiles_ajax_max_items', 2000 )`:
	 *   a hard cap replaces the former unbounded `-1`. Past the cap, categories
	 *   and posts appearing only beyond it drop out — the candidate set (and the
	 *   filter strip derived from it) truncates and pagination reflects the
	 *   truncated total; the request never errors. Sites needing more can raise
	 *   the cap via the filter.
	 * - `offset => 0`: the Query Builder offset is applied as an ID-array slice
	 *   downstream (`apply_tiles_ajax_offset()`), keeping the candidate universe
	 *   identical to the previous full-hydration pipeline.
	 * - `rand` orderby becomes stable `ID ASC`: randomization happens via a
	 *   deterministic, seeded shuffle downstream so every
	 *   AJAX page request reproduces the same permutation. SQL `RAND()`
	 *   would re-order the set per request and break the page partition
	 *   (visitors would see duplicates/gaps as they page) — mirrors
	 *   ImageSource, which skips its own shuffle for paginated tiles.
	 * - `ignore_sticky_posts`: sticky posts are prepended even when
	 *   `post__in` / tax queries are set; ignoring them keeps the candidate
	 *   set identical across AJAX requests before the seeded shuffle
	 *   partitions it.
	 *
	 * @param array $args          WP_Query args (after the other helpers ran).
	 * @param bool  $is_tiles_ajax Whether this is a paginated Tiles fetch.
	 * @return array
	 */
	public static function apply_tiles_ajax_query_tweaks( array $args, bool $is_tiles_ajax ): array {
		if ( ! $is_tiles_ajax ) {
			return $args;
		}

		$args['fields']                 = 'ids';
		$args['no_found_rows']          = true;
		$args['update_post_meta_cache'] = false;
		$args['update_post_term_cache'] = false;
		$args['posts_per_page']         = self::tiles_ajax_max_items();
		$args['offset']                 = 0;

		if ( 'rand' === ( $args['orderby'] ?? '' ) ) {
			$args['orderby'] = 'ID';
			$args['order']   = 'ASC';
		}

		$args['ignore_sticky_posts'] = 1;

		return $args;
	}

	/**
	 * The hard cap on the Tiles AJAX candidate set (post/product sources).
	 *
	 * Filterable via `wpcp_tiles_ajax_max_items`. Clamped to a positive integer
	 * so a filter returning `0` / `-1` can never reinstate an unbounded query.
	 *
	 * @return int
	 */
	public static function tiles_ajax_max_items(): int {
		$max = (int) apply_filters( 'wpcp_tiles_ajax_max_items', 2000 );
		return max( 1, $max );
	}

	/**
	 * Re-apply the Query Builder offset for the Tiles AJAX pagination fetch.
	 *
	 * The paginated fetch uses `posts_per_page => -1`, which makes WP_Query
	 * ignore the SQL offset — skip the first N built items here instead so
	 * the renderer slices the remainder into pages. Runs identically for the
	 * initial server render, every AJAX page request, and the editor preview.
	 *
	 * @param array $items         Built source items.
	 * @param bool  $is_tiles_ajax Whether this is a paginated Tiles fetch.
	 * @param int   $offset        Query Builder offset.
	 * @return array
	 */
	public static function apply_tiles_ajax_offset( array $items, bool $is_tiles_ajax, int $offset ): array {
		if ( $is_tiles_ajax && 0 < $offset ) {
			return array_slice( $items, $offset );
		}
		return $items;
	}
}
