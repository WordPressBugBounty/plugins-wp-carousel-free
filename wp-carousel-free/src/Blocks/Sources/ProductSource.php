<?php
/**
 * Product Source – queries WooCommerce products and builds carousel items.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Sources;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Query_Options_Helper;
use ShapedPlugin\WPCarouselFree\Blocks\Cache;

defined( 'ABSPATH' ) || exit;

/**
 * ProductSource class for querying products and building carousel items.
 */
class ProductSource implements SourceInterface {

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
		if ( 'product_cat' === $taxonomy_slug ) {
			return 'pcat-' . $term_id;
		}

		if ( 'product_tag' === $taxonomy_slug ) {
			return 'ptag-' . $term_id;
		}

		return 'tax-' . sanitize_key( $taxonomy_slug ) . '-' . $term_id;
	}

	/**
	 * Parse a Gallery Filter id back to its taxonomy + term id (inverse of
	 * `build_filter_id()`). Non-public taxonomies are rejected so a hostile
	 * `filter_id` cannot coerce a query against a private taxonomy.
	 *
	 * @param string $filter_id Gallery filter id (`pcat-<id>`, `ptag-<id>`, or
	 *                          `tax-<slug>-<id>`).
	 * @return array{taxonomy:string,term_id:int}|null Parsed pair, or null when
	 *                                                  malformed / non-public.
	 */
	public static function parse_filter_id( string $filter_id ) {
		$taxonomy = '';
		$term_id  = 0;

		if ( 1 === preg_match( '/^pcat-(\d+)$/', $filter_id, $matches ) ) {
			$taxonomy = 'product_cat';
			$term_id  = (int) $matches[1];
		} elseif ( 1 === preg_match( '/^ptag-(\d+)$/', $filter_id, $matches ) ) {
			$taxonomy = 'product_tag';
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
	 * Build the slide items from a WooCommerce product query.
	 *
	 * @param array  $attributes Projected block attributes.
	 * @param string $is_editor  Non-empty when rendering for the editor preview.
	 * @return array
	 */
	public function get_items( array $attributes, string $is_editor = '' ): array {
		// Editor and preview requests bypass this entirely (see Cache).
		$cache_key    = Cache::make_key( 'product', array( $attributes, $is_editor ) );
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

		// Tiles AJAX two-step fetch: candidate query returns IDs only; full
		// product objects are hydrated for the requested page alone via
		// `hydrate_ids()`. Items here are lightweight ID stubs for the pipeline.
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
	 * Hydrate a list of product IDs into full carousel items (page-slice step of
	 * the Tiles AJAX two-step fetch). Runs a single `post__in` query with
	 * `orderby => 'post__in'` so items preserve the given order, and builds each
	 * via {@see build_item_from_post()} so the shape matches the normal path.
	 *
	 * @param int[] $ids        Product IDs for the page, in display order.
	 * @param array $attributes Block attributes (for resolution).
	 * @return array Built items in `$ids` order.
	 */
	public function hydrate_ids( array $ids, array $attributes ): array {
		$ids = array_values( array_filter( array_map( 'intval', $ids ) ) );
		if ( empty( $ids ) ) {
			return array();
		}

		$image_options = isset( $attributes['imageOptions'] ) && is_array( $attributes['imageOptions'] ) ? $attributes['imageOptions'] : array();
		$resolution    = $image_options['resolution'] ?? 'large';

		$args = array(
			'post_type'           => array( 'product' ),
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
	 * Assemble the base WP_Query args plus every queryOptions/catalog/layout/
	 * tiles-AJAX transform. Shared by the item and IDs-only fetch so both see
	 * the same candidate set.
	 *
	 * @param array $attributes    Block attributes.
	 * @param array $query_options Block queryOptions.
	 * @param bool  $is_tiles_ajax Whether this is a paginated Tiles fetch.
	 * @return array WP_Query args.
	 */
	private function build_query_args( array $attributes, array $query_options, bool $is_tiles_ajax ): array {
		$post_types = $query_options['postTypes'] ?? array( 'product' );
		// Ensure we're querying products if product source type is used.
		if ( empty( $post_types ) || ! in_array( 'product', $post_types, true ) ) {
			$post_types = array( 'product' );
		}

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

		$args = Query_Options_Helper::apply_wc_catalog_tax_query( $args );
		$args = Query_Options_Helper::apply_layout_random( $args, $layout_options );
		$args = Query_Options_Helper::apply_tiles_ajax_query_tweaks( $args, $is_tiles_ajax );

		return $args;
	}

	/**
	 * Build one carousel item from a product post object.
	 *
	 * @param \WP_Post $post       Full product post object.
	 * @param string   $resolution Image size key for the featured thumbnail.
	 * @return array Normalised item.
	 */
	public static function build_item_from_post( \WP_Post $post, string $resolution ): array {
		$image_url       = '';
		$image_alt       = '';
		$thumb_intrinsic = array();

		if ( has_post_thumbnail( $post->ID ) ) {
			$thumb_id  = get_post_thumbnail_id( $post->ID );
			$src       = wp_get_attachment_image_src( $thumb_id, $resolution );
			$image_url = $src ? $src[0] : '';
			$image_alt = get_post_meta( $thumb_id, '_wp_attachment_image_alt', true );
			$image_alt = $image_alt ? $image_alt : get_the_title( $post->ID );
			if ( $src && isset( $src[1], $src[2] ) ) {
				$thumb_intrinsic['intrinsicWidth']  = (int) $src[1];
				$thumb_intrinsic['intrinsicHeight'] = (int) $src[2];
			}
		}

		// Get WooCommerce product object.
		$product = wc_get_product( $post->ID );

		// Get product price.
		$price = '';
		if ( $product ) {
			$price_html = $product->get_price_html();
			if ( ! empty( $price_html ) ) {
				// Decode HTML entities but keep the HTML structure for price formatting.
				$price = html_entity_decode( $price_html, ENT_QUOTES, 'UTF-8' );
			}
		}

		// Get product rating.
		$rating = '';
		if ( $product ) {
			$average_rating = $product->get_average_rating();
			if ( 0 < $average_rating ) {
				$rating = (string) $average_rating;
			}
		}

		// Get product stock status.
		$stock_status = '';
		$is_in_stock  = '';
		if ( $product ) {
			$stock_status = $product->get_stock_status(); // phpcs:ignore Squiz.PHP.CommentedOutCode.Found -- Value list, not code.
			$is_in_stock  = $product->is_in_stock() ? '1' : '0';
		}

		// Purchase affordance: variable, grouped and external products are not
		// ajax-addable, so the button must link to the product instead.
		$product_type     = '';
		$is_purchasable   = '';
		$supports_ajax    = '';
		$add_to_cart_text = '';
		$add_to_cart_url  = '';
		if ( $product ) {
			$product_type     = $product->get_type();
			$is_purchasable   = $product->is_purchasable() ? '1' : '0';
			$supports_ajax    = $product->supports( 'ajax_add_to_cart' ) ? '1' : '0';
			$add_to_cart_text = wp_strip_all_tags( $product->add_to_cart_text() );
			$add_to_cart_url  = $product->add_to_cart_url();
		}

		// Get product terms for filtering and display from one allow-listed
		// sweep. Third-party product taxonomies used to be walked one
		// get_the_terms() call each on every product (an N-taxonomies query
		// per item); this allow-list bounds that cost. Sites whose filter bar
		// relied on an extra taxonomy opt back in explicitly via the filter —
		// deliberate: silent sweeps of every public taxonomy are how the
		// N-query cost appeared in the first place.
		$category       = '';
		$category_slugs = '';
		$filter_ids     = array();
		$filter_terms   = array();
		$tag            = '';
		$tag_slugs      = '';
		$brand          = '';
		$brand_slugs    = '';

		$filter_taxonomies = apply_filters(
			'wpcp_product_filter_taxonomies',
			array( 'product_cat', 'product_tag', 'product_brand' )
		);

		foreach ( $filter_taxonomies as $taxonomy_slug ) {
			if ( ! taxonomy_exists( $taxonomy_slug ) ) {
				continue;
			}

			$terms = get_the_terms( $post->ID, $taxonomy_slug );
			if ( empty( $terms ) || is_wp_error( $terms ) ) {
				continue;
			}

			$term_names = array();
			$term_slugs = array();
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
				$term_names[]   = (string) $term->name;
				$term_slugs[]   = (string) $term->slug;
			}

			// Display strings for the known taxonomies; extras still feed the filter.
			if ( ! empty( $term_names ) ) {
				$names = implode( ', ', $term_names );
				$slugs = implode( ', ', $term_slugs );
				if ( 'product_cat' === $taxonomy_slug ) {
					$category       = $names;
					$category_slugs = $slugs;
				} elseif ( 'product_tag' === $taxonomy_slug ) {
					$tag       = $names;
					$tag_slugs = $slugs;
				} elseif ( 'product_brand' === $taxonomy_slug ) {
					$brand       = $names;
					$brand_slugs = $slugs;
				}
			}
		}

		// Get product author (product creator).
		$author    = '';
		$author_id = $post->post_author;
		if ( $author_id ) {
			$author = get_the_author_meta( 'display_name', $author_id );
		}

		// Get product short description.
		$description = '';
		$short_desc  = $product ? $product->get_short_description() : '';
		if ( empty( $short_desc ) ) {
			$short_desc = $product ? $product->get_description() : '';
		}
		if ( ! empty( $short_desc ) ) {
			$description = wp_strip_all_tags( $short_desc );
		}

		// Get product SKU.
		$product_sku = '';
		if ( $product ) {
			$sku = $product->get_sku();
			if ( ! empty( $sku ) ) {
				$product_sku = $sku;
			}
		}

		return array(
			'id'          => $post->ID,
			'image_url'   => $image_url,
			'image_alt'   => $image_alt,
			'title'       => get_the_title( $post->ID ),
			'description' => $description,
			'url'         => get_permalink( $post->ID ),
			'extra'       => array_merge(
				array(
					'date'                => get_the_date( 'F j, Y', $post->ID ),
					'author'              => $author,
					'category'            => $category,
					'category_slugs'      => $category_slugs,
					'tag'                 => $tag,
					'tag_slugs'           => $tag_slugs,
					'product_brand'       => $brand,
					'product_brand_slugs' => $brand_slugs,
					'product_sku'         => $product_sku,
					'rating'              => $rating,
					'price'               => $price,
					'comment_count'       => (int) $post->comment_count,
					'stock_status'        => $stock_status,
					'is_in_stock'         => $is_in_stock,
					'product_type'        => $product_type,
					'is_purchasable'      => $is_purchasable,
					'supports_ajax_cart'  => $supports_ajax,
					'add_to_cart_text'    => $add_to_cart_text,
					'add_to_cart_url'     => $add_to_cart_url,
				),
				$thumb_intrinsic
			),
			'filterIds'   => $filter_ids,
			'filterTerms' => $filter_terms,
		);
	}
}
