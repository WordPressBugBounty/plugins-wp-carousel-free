<?php
/**
 * Post Source – runs WP_Query based on the block's queryOptions.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Sources;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Query_Options_Helper;
use ShapedPlugin\WPCarouselFree\Blocks\Cache;

defined( 'ABSPATH' ) || exit;

/**
 * PostSource class for querying posts and building carousel items.
 */
class PostSource implements SourceInterface {

	/**
	 * Build a stable Gallery Filter id for a taxonomy term.
	 *
	 * `parse_filter_id()` is the inverse — the two live side by side so the
	 * `filter_id` wire format has a single authority. Keep them in sync.
	 *
	 * @param string $taxonomy_slug Taxonomy slug.
	 * @param int    $term_id       Term ID.
	 * @return string
	 */
	public static function build_filter_id( string $taxonomy_slug, int $term_id ): string {
		if ( 'category' === $taxonomy_slug ) {
			return 'cat-' . $term_id;
		}

		if ( 'post_tag' === $taxonomy_slug ) {
			return 'tag-' . $term_id;
		}

		return 'tax-' . sanitize_key( $taxonomy_slug ) . '-' . $term_id;
	}

	/**
	 * Parse a Gallery Filter id back to its taxonomy + term id (inverse of
	 * `build_filter_id()`). Non-public taxonomies are rejected so a hostile
	 * `filter_id` cannot coerce a query against a private taxonomy.
	 *
	 * @param string $filter_id Gallery filter id (`cat-<id>`, `tag-<id>`, or
	 *                          `tax-<slug>-<id>`).
	 * @return array{taxonomy:string,term_id:int}|null Parsed pair, or null when
	 *                                                  malformed / non-public.
	 */
	public static function parse_filter_id( string $filter_id ) {
		$taxonomy = '';
		$term_id  = 0;

		if ( 1 === preg_match( '/^cat-(\d+)$/', $filter_id, $matches ) ) {
			$taxonomy = 'category';
			$term_id  = (int) $matches[1];
		} elseif ( 1 === preg_match( '/^tag-(\d+)$/', $filter_id, $matches ) ) {
			$taxonomy = 'post_tag';
			$term_id  = (int) $matches[1];
		} elseif ( 1 === preg_match( '/^tax-([a-z0-9_]+)-(\d+)$/', $filter_id, $matches ) ) {
			$taxonomy = sanitize_key( $matches[1] );
			$term_id  = (int) $matches[2];
		}

		if ( '' === $taxonomy || $term_id <= 0 ) {
			return null;
		}

		$taxonomy_object = get_taxonomy( $taxonomy );
		if ( false === $taxonomy_object || empty( $taxonomy_object->public ) ) {
			return null;
		}

		return array(
			'taxonomy' => $taxonomy,
			'term_id'  => $term_id,
		);
	}

	/**
	 * Build the slide items from a post query.
	 *
	 * @param array  $attributes Projected block attributes.
	 * @param string $is_editor  Non-empty when rendering for the editor preview.
	 * @return array
	 */
	public function get_items( array $attributes, string $is_editor = '' ): array {
		// Editor and preview requests bypass this entirely (see Cache).
		$cache_key    = Cache::make_key( 'post', array( $attributes, $is_editor ) );
		$cached_items = Cache::get( $cache_key );
		if ( null !== $cached_items ) {
			return $cached_items;
		}

		$query_options = isset( $attributes['queryOptions'] ) && is_array( $attributes['queryOptions'] ) ? $attributes['queryOptions'] : array();
		if ( is_object( $query_options ) ) {
			$query_options = (array) $query_options;
		}
		$image_options = isset( $attributes['imageOptions'] ) && is_array( $attributes['imageOptions'] ) ? $attributes['imageOptions'] : array();
		if ( is_object( $image_options ) ) {
			$image_options = (array) $image_options;
		}

		$offset     = (int) ( $query_options['offset'] ?? 0 );
		$resolution = $image_options['resolution'] ?? 'large';

		$is_tiles_ajax = Query_Options_Helper::is_tiles_ajax_request( $attributes );
		$args          = $this->build_query_args( $attributes, $query_options, $is_tiles_ajax );

		$query = new \WP_Query( $args );

		// Tiles AJAX two-step fetch: the candidate query returns IDs only
		// (`fields => 'ids'`); full post objects are hydrated for the requested
		// page alone via `hydrate_ids()`. Items here are lightweight ID stubs
		// the partition pipeline (offset → shuffle → filter → slice) operates on.
		if ( $is_tiles_ajax ) {
			$ids = array_values( array_map( 'intval', (array) $query->posts ) );
			wp_reset_postdata();
			$ids = Query_Options_Helper::apply_tiles_ajax_offset( $ids, true, $offset );

			$stubs = array();
			foreach ( $ids as $id ) {
				$stubs[] = array( 'id' => $id );
			}
			Cache::set( $cache_key, $stubs );
			return $stubs;
		}

		$items = array();
		if ( $query->have_posts() ) {
			foreach ( $query->posts as $post ) {
				$items[] = self::build_item_from_post( $post, $resolution );
			}
		}

		wp_reset_postdata();

		Cache::set( $cache_key, $items );

		return $items;
	}

	/**
	 * Hydrate a list of post IDs into full carousel items (page-slice step of
	 * the Tiles AJAX two-step fetch). Runs a single `post__in` query with
	 * `orderby => 'post__in'` so the returned items preserve the given order,
	 * and builds each via {@see build_item_from_post()} so the item shape is
	 * identical to the non-paginated path.
	 *
	 * @param int[] $ids        Post IDs for the page, in display order.
	 * @param array $attributes Block attributes (for post type + resolution).
	 * @return array Built items in `$ids` order.
	 */
	public function hydrate_ids( array $ids, array $attributes ): array {
		$ids = array_values( array_filter( array_map( 'intval', $ids ) ) );
		if ( empty( $ids ) ) {
			return array();
		}

		$query_options = isset( $attributes['queryOptions'] ) && is_array( $attributes['queryOptions'] ) ? $attributes['queryOptions'] : array();
		$image_options = isset( $attributes['imageOptions'] ) && is_array( $attributes['imageOptions'] ) ? $attributes['imageOptions'] : array();
		$post_types    = $query_options['postTypes'] ?? array( 'post' );
		$resolution    = $image_options['resolution'] ?? 'large';

		$args = array(
			'post_type'           => $post_types,
			'post__in'            => $ids,
			'orderby'             => 'post__in',
			'posts_per_page'      => count( $ids ),
			'post_status'         => 'publish',
			'ignore_sticky_posts' => 1,
			'no_found_rows'       => true,
		);

		$query = new \WP_Query( $args );
		$items = array();
		if ( $query->have_posts() ) {
			foreach ( $query->posts as $post ) {
				$items[] = self::build_item_from_post( $post, $resolution );
			}
		}
		wp_reset_postdata();

		return $items;
	}

	/**
	 * Assemble the base WP_Query args plus every queryOptions/layout/tiles-AJAX
	 * transform. Shared by the item and IDs-only fetch so both see the same
	 * candidate set.
	 *
	 * @param array $attributes    Block attributes.
	 * @param array $query_options Block queryOptions.
	 * @param bool  $is_tiles_ajax Whether this is a paginated Tiles fetch.
	 * @return array WP_Query args.
	 */
	private function build_query_args( array $attributes, array $query_options, bool $is_tiles_ajax ): array {
		$post_types     = $query_options['postTypes'] ?? array( 'post' );
		$limit          = (int) ( $query_options['limit'] ?? 10 );
		$offset         = (int) ( $query_options['offset'] ?? 0 );
		$order_by       = Query_Options_Helper::sanitize_orderby( (string) ( $query_options['orderBy'] ?? 'date' ) );
		$order          = strtoupper( $query_options['order'] ?? 'DESC' ) === 'ASC' ? 'ASC' : 'DESC';
		$layout_options = ( isset( $attributes['layoutOptions'] ) && is_array( $attributes['layoutOptions'] ) ) ? $attributes['layoutOptions'] : array();

		$args = array(
			'post_type'      => $post_types,
			'posts_per_page' => $limit,
			'offset'         => $offset,
			'orderby'        => $order_by,
			'order'          => $order,
			'post_status'    => 'publish',
			// Pagination is never driven by this query's found-rows total on
			// the non-Tiles-AJAX path, so skip the SQL_CALC_FOUND_ROWS work.
			'no_found_rows'  => ! $is_tiles_ajax,
		);

		$args = Query_Options_Helper::apply_layout_random( $args, $layout_options );
		$args = Query_Options_Helper::apply_tiles_ajax_query_tweaks( $args, $is_tiles_ajax );

		return $args;
	}

	/**
	 * Build one carousel item from a post object.
	 *
	 * @param \WP_Post $post       Full post object.
	 * @param string   $resolution Image size key for the featured thumbnail.
	 * @return array Normalised item.
	 */
	public static function build_item_from_post( \WP_Post $post, string $resolution ): array {
		$image_url = '';
		$image_alt = '';

		// Get term objects for names and slugs.
		$post_type_taxonomies = get_object_taxonomies( get_post_type( $post->ID ), 'objects' );
		$cats                 = get_the_category( $post->ID );
		$tags                 = get_the_tags( $post->ID );

		$cat_names = $cats ? wp_list_pluck( $cats, 'name' ) : array();
		$cat_slugs = $cats ? wp_list_pluck( $cats, 'slug' ) : array();
		$tag_names = $tags ? wp_list_pluck( $tags, 'name' ) : array();
		$tag_slugs = $tags ? wp_list_pluck( $tags, 'slug' ) : array();

		$filter_ids   = array();
		$filter_terms = array();

		if ( ! empty( $post_type_taxonomies ) && is_array( $post_type_taxonomies ) ) {
			foreach ( $post_type_taxonomies as $taxonomy_slug => $taxonomy_object ) {
				if ( ! is_object( $taxonomy_object ) || empty( $taxonomy_object->public ) ) {
					continue;
				}

				$terms = get_the_terms( $post->ID, $taxonomy_slug );
				if ( empty( $terms ) || is_wp_error( $terms ) ) {
					continue;
				}

				foreach ( $terms as $term ) {
					if ( ! is_object( $term ) || empty( $term->term_id ) ) {
						continue;
					}

					$filter_id      = self::build_filter_id( (string) $taxonomy_slug, (int) $term->term_id );
					$filter_ids[]   = $filter_id;
					$filter_terms[] = array(
						'id'       => $filter_id,
						'label'    => (string) $term->name,
						'taxonomy' => (string) $taxonomy_slug,
					);
				}
			}
		}

		$cat_urls = array();
		if ( $cats ) {
			foreach ( $cats as $cat ) {
				$term_link  = get_term_link( $cat );
				$cat_urls[] = is_wp_error( $term_link ) ? '' : $term_link;
			}
		}

		$tag_urls = array();
		if ( $tags ) {
			foreach ( $tags as $tag ) {
				$term_link  = get_term_link( $tag );
				$tag_urls[] = is_wp_error( $term_link ) ? '' : $term_link;
			}
		}

		$date_year  = get_the_date( 'Y', $post->ID );
		$date_month = get_the_date( 'm', $post->ID );
		$date_day   = get_the_date( 'd', $post->ID );
		$date_link  = get_day_link( $date_year, $date_month, $date_day );
		if ( is_wp_error( $date_link ) ) {
			$date_link = '';
		}

		$author_id  = (int) $post->post_author;
		$author_url = $author_id ? get_author_posts_url( $author_id ) : '';

		$extra = array(
			'date'           => get_the_date( 'F j, Y', $post->ID ),
			'date_link'      => $date_link,
			'author'         => get_the_author_meta( 'display_name', $post->post_author ),
			'author_url'     => $author_url,
			'category'       => implode( ', ', $cat_names ),
			'category_slugs' => implode( ', ', $cat_slugs ),
			'category_links' => $cat_urls,
			'comment_count'  => (int) $post->comment_count,
			'comments_link'  => comments_open( $post->ID ) ? get_comments_link( $post->ID ) : '',
			'tag'            => implode( ', ', $tag_names ),
			'tag_slugs'      => implode( ', ', $tag_slugs ),
			'tag_links'      => $tag_urls,
		);

		if ( has_post_thumbnail( $post->ID ) ) {
			$thumb_id  = get_post_thumbnail_id( $post->ID );
			$src       = wp_get_attachment_image_src( $thumb_id, $resolution );
			$image_url = $src ? $src[0] : '';
			$image_alt = get_post_meta( $thumb_id, '_wp_attachment_image_alt', true );
			$image_alt = $image_alt ? $image_alt : get_the_title( $post->ID );
			if ( $src && isset( $src[1], $src[2] ) ) {
				$extra['intrinsicWidth']  = (int) $src[1];
				$extra['intrinsicHeight'] = (int) $src[2];
			}
		}

		return array(
			'id'          => $post->ID,
			'image_url'   => $image_url,
			'image_alt'   => $image_alt,
			'title'       => get_the_title( $post->ID ),
			'description' => has_excerpt( $post->ID )
				? get_the_excerpt( $post->ID )
				: wp_strip_all_tags( $post->post_content ),
			'url'         => get_permalink( $post->ID ),
			'extra'       => $extra,
			'filterIds'   => $filter_ids,
			'filterTerms' => $filter_terms,
		);
	}
}
