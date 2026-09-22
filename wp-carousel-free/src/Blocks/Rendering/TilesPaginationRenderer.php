<?php
/**
 * Tiles AJAX pagination renderer.
 *
 * Owns the Tiles pagination cluster — per-page slice computation, the seeded
 * random-order shuffle, the pagination wrapper markup, and the inner control
 * list (numbered pages with ellipsis shortening).
 * Drives both the initial server render (BlockRenderer's Tiles branch) and the
 * AJAX page-change REST endpoint, emitting markup that matches the editor
 * preview (`PaginationPreview.jsx`) class-for-class.
 *
 * Per-tile inner HTML is produced by BlockRenderer (`render_item`) and injected
 * as a callable, so this collaborator stays free of the full item-rendering
 * surface.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * TilesPaginationRenderer class.
 */
class TilesPaginationRenderer {

	/**
	 * Block attributes (the Tiles block's attributes).
	 *
	 * @var array
	 */
	private $attrs;

	/**
	 * Parent Tiles `uniqueId` (resolved root element / block id, no scope
	 * prefix). Drives the `parentUniqueId` payload field.
	 *
	 * @var string
	 */
	private $parent_unique_id;

	/**
	 * Constructor.
	 *
	 * @param array  $attrs            Block attributes.
	 * @param string $parent_unique_id Parent Tiles `uniqueId`.
	 */
	public function __construct( array $attrs, string $parent_unique_id ) {
		$this->attrs            = $attrs;
		$this->parent_unique_id = $parent_unique_id;
	}

	/**
	 * Public entry point for the AJAX pagination REST endpoint.
	 *
	 * Given the full item list and a 1-indexed page, returns the per-tile HTML
	 * for that page (matching the inner loop of `render_tiles_main`) plus
	 * pagination metadata. Out-of-range pages return an empty html string with
	 * `has_more = false` so callers don't need to special-case them.
	 *
	 * When `$shuffle_seed` is non-null and the block is in random order, the
	 * items are re-shuffled with a seeded Fisher-Yates before the pagination
	 * math runs, reproducing the permutation the first PHP render emitted. The
	 * seed is the controller's responsibility to sanitize (positive int or
	 * null); `null` short-circuits the shuffle.
	 *
	 * @param array         $items        Normalised items from a SourceInterface.
	 * @param int           $page         1-indexed page number.
	 * @param int|null      $shuffle_seed Optional positive integer; reproduces the
	 *                                    permutation of the initial render.
	 * @param callable      $render_item  Renders one tile's inner HTML (BlockRenderer::render_item).
	 * @param callable|null $hydrate      Optional page-slice hydrator. For the
	 *                                    post/product two-step fetch, receives the
	 *                                    page's ID stubs and returns full items (in
	 *                                    order); null leaves already-full items untouched.
	 * @return array{html:string,page:int,total_pages:int,has_more:bool,controlsHtml:string}
	 */
	public function render_tiles_ajax_page( array $items, int $page, ?int $shuffle_seed, callable $render_item, ?callable $hydrate = null ): array {
		$source_type    = isset( $this->attrs['sourceType'] ) ? (string) $this->attrs['sourceType'] : 'image';
		$layout_options = isset( $this->attrs['layoutOptions'] ) && is_array( $this->attrs['layoutOptions'] )
			? $this->attrs['layoutOptions']
			: array();
		$query_options  = isset( $this->attrs['queryOptions'] ) && is_array( $this->attrs['queryOptions'] )
			? $this->attrs['queryOptions']
			: array();

		if ( null !== $shuffle_seed && self::is_seeded_random_order( $source_type, $layout_options, $query_options ) ) {
			$items = self::seeded_shuffle( $items, $shuffle_seed );
		}

		$state          = $this->compute_tiles_pagination_state( $items );
		$total_pages    = max( 1, $state['total_pages'] );
		$items_per_page = max( 1, $state['items_per_page'] );
		$page           = max( 1, $page );

		if ( $page > $total_pages ) {
			return array(
				'html'         => '',
				'page'         => $page,
				'total_pages'  => $total_pages,
				'has_more'     => false,
				'controlsHtml' => $this->render_tiles_pagination_controls_html( $total_pages, $page ),
			);
		}

		$start = ( $page - 1 ) * $items_per_page;
		$slice = array_slice( $items, $start, $items_per_page );

		// Two-step fetch: hydrate only this page's ID stubs into full items.
		// Image/video sources pass no hydrator — their items are already full.
		if ( null !== $hydrate ) {
			$slice = $hydrate( $slice );
		}

		$tile_layout      = AllowedValues::tile_layout( $layout_options['tileLayout'] ?? 'one' );
		$is_bento_mode    = ( 'one' !== $tile_layout );
		$is_image_binpack = 'image' === $source_type && $is_bento_mode;
		$columns          = max( 1, (int) ( $layout_options['columns'] ?? 3 ) );
		// Stamp against the FULL item list so an absolute index on page 2+ lands
		// on the right preset position and the mosaic continues across pages
		// instead of restarting.
		$tile_spans = TilesBinPack::stamp_preset( count( $items ), $tile_layout, $columns );

		$html = '';
		foreach ( $slice as $i => $item ) {
			$absolute_index = $start + (int) $i;
			$tile_classes   = array( 'wpcp-item' );
			$tile_style     = '';
			$pin_attrs      = '';

			if ( $is_bento_mode ) {
				$tile_classes[] = 'wpcp-tiles-tile';
				$entry          = isset( $tile_spans[ $absolute_index ] ) && is_array( $tile_spans[ $absolute_index ] ) ? $tile_spans[ $absolute_index ] : array();
				$tile_attrs     = $is_image_binpack
					? self::build_binpack_tile_attrs( $entry )
					: self::build_bento_tile_attrs( $entry );
				$tile_style     = $tile_attrs['style'];
				$pin_attrs      = $tile_attrs['pin_attrs'];
			}

			$style_attr = '' !== $tile_style ? ' style="' . esc_attr( $tile_style ) . '"' : '';
			$html      .= '<div class="' . esc_attr( implode( ' ', $tile_classes ) ) . '" data-tile-index="' . (int) $absolute_index . '"' . $style_attr . $pin_attrs . '>';
			$html      .= $render_item( $item );
			$html      .= '</div>';
		}

		return array(
			'html'         => $html,
			'page'         => $page,
			'total_pages'  => $total_pages,
			'has_more'     => $page < $total_pages,
			'controlsHtml' => $this->render_tiles_pagination_controls_html( $total_pages, $page ),
		);
	}

	/**
	 * Whether paginated tiles should apply the seeded random-order shuffle.
	 *
	 * Image tiles randomize via `layoutOptions.randomOrder`; post/product
	 * tiles also randomize when `queryOptions.orderBy` is `rand` (their
	 * sources fetch a stable order for the paginated path, so the seeded
	 * shuffle is the sole randomizer — see Post/ProductSource). Shared by
	 * the initial server render (BlockRenderer's Tiles branch) and the AJAX
	 * page path so the two detections can't drift apart.
	 *
	 * @param string $source_type    Block sourceType attribute.
	 * @param array  $layout_options layoutOptions attribute slice.
	 * @param array  $query_options  queryOptions attribute slice.
	 * @return bool
	 */
	public static function is_seeded_random_order( string $source_type, array $layout_options, array $query_options ): bool {
		return ! empty( $layout_options['randomOrder'] )
			|| ( in_array( $source_type, array( 'post', 'product' ), true ) && 'rand' === ( $query_options['orderBy'] ?? '' ) );
	}

	/**
	 * Inline style + data attributes for one bin-pack (image-source) tile.
	 *
	 * Bin-pack markup: absolute-positioned tiles with `data-col-span` /
	 * `data-row-span` and optional pin data attrs. The frontend relayout
	 * (`wpcp:tiles:relayout` dispatched after AJAX) re-runs the bin-pack
	 * across all tiles and writes final pixel positions, so the inline
	 * placeholder `left:0;top:0` is overridden before paint.
	 * `visibility:hidden` masks the single-frame 0x0 flash before the next
	 * animation frame runs `wpcpLayoutContainer`; the layout loop clears
	 * `style.visibility` once it has written real positions.
	 *
	 * @param array $entry tileSpans entry for this tile.
	 * @return array{style:string, pin_attrs:string}
	 */
	private static function build_binpack_tile_attrs( array $entry ): array {
		$col_span = (int) ( $entry['colSpan'] ?? 1 );
		$row_span = (int) ( $entry['rowSpan'] ?? 1 );
		$col_span = max( 1, min( 12, $col_span ) );
		$row_span = max( 1, $row_span );

		$pin_attrs = ' data-col-span="' . (int) $col_span . '" data-row-span="' . (int) $row_span . '"';
		if ( ! empty( $entry['gridColumn'] ) && is_string( $entry['gridColumn'] ) ) {
			$pin_attrs .= ' data-pin-col="' . esc_attr( $entry['gridColumn'] ) . '"';
		}
		if ( ! empty( $entry['gridRow'] ) && is_string( $entry['gridRow'] ) ) {
			$pin_attrs .= ' data-pin-row="' . esc_attr( $entry['gridRow'] ) . '"';
		}

		return array(
			'style'     => 'position:absolute;left:0;top:0;width:0;height:0;visibility:hidden;',
			'pin_attrs' => $pin_attrs,
		);
	}

	/**
	 * Inline style + data attributes for one CSS-grid (bento) tile.
	 *
	 * @param array $entry tileSpans entry for this tile.
	 * @return array{style:string, pin_attrs:string}
	 */
	private static function build_bento_tile_attrs( array $entry ): array {
		$col_span = (int) ( $entry['colSpan'] ?? 1 );
		$row_span = (int) ( $entry['rowSpan'] ?? 1 );
		if ( $col_span < 1 ) {
			$col_span = 1;
		}
		if ( $col_span > 12 ) {
			$col_span = 12;
		}
		if ( $row_span < 1 ) {
			$row_span = 1;
		}
		if ( $row_span > 6 ) {
			$row_span = 6;
		}

		$grid_column = TilesRenderer::sanitize_grid_line( $entry['gridColumn'] ?? '', 'span ' . $col_span );
		$grid_row    = TilesRenderer::sanitize_grid_line( $entry['gridRow'] ?? '', 'span ' . $row_span );

		$tile_style = sprintf(
			'--tile-col-span:%d;--tile-row-span:%d;grid-column:%s;grid-row:%s;',
			$col_span,
			$row_span,
			esc_attr( $grid_column ),
			esc_attr( $grid_row )
		);

		$pin_attrs = '';
		if ( ! empty( $entry['gridColumn'] ) ) {
			$pin_attrs .= ' data-grid-column="' . esc_attr( $entry['gridColumn'] ) . '"';
		}
		if ( ! empty( $entry['gridRow'] ) ) {
			$pin_attrs .= ' data-grid-row="' . esc_attr( $entry['gridRow'] ) . '"';
		}

		return array(
			'style'     => $tile_style,
			'pin_attrs' => $pin_attrs,
		);
	}

	/**
	 * Compute the per-page slice + total page count for Tiles AJAX pagination.
	 *
	 * Page-size resolution branches on `sourceType`:
	 *   - `image`/`video`: reads `paginationOptions.imageItemsPerPage`. These
	 *                      sources hold a finite, already-fetched item set, so
	 *                      their page size lives with the rest of
	 *                      `paginationOptions` rather than under the
	 *                      (post/product-only) `queryOptions` tree.
	 *   - `post`/`product`: reads `queryOptions.limit` (matches `WP_Query`
	 *                       `posts_per_page` semantics; control is the Query
	 *                       Builder "Limit" field).
	 *   - any other       : falls back to `queryOptions.limit` for backward
	 *                       compat (matches prior behavior for legacy paths).
	 *
	 * Both keys default to `10` via `CarouselBaseSchema` / `TilesSchema`. When
	 * `items_per_page` is non-positive or exceeds the item count, the renderer
	 * emits every item as a single page.
	 *
	 * @param array $items Normalised items array.
	 * @return array{items: array, total_pages: int, items_per_page: int}
	 */
	public function compute_tiles_pagination_state( array $items ): array {
		$total       = count( $items );
		$source_type = isset( $this->attrs['sourceType'] ) ? (string) $this->attrs['sourceType'] : 'image';

		if ( in_array( $source_type, array( 'image', 'video' ), true ) ) {
			$pagination_options = isset( $this->attrs['paginationOptions'] ) && is_array( $this->attrs['paginationOptions'] )
				? $this->attrs['paginationOptions']
				: array();
			$items_per_page     = (int) ( $pagination_options['imageItemsPerPage'] ?? 10 );
		} else {
			$query_options  = isset( $this->attrs['queryOptions'] ) && is_array( $this->attrs['queryOptions'] )
				? $this->attrs['queryOptions']
				: array();
			$items_per_page = (int) ( $query_options['limit'] ?? 10 );
		}

		if ( $items_per_page <= 0 || $items_per_page >= $total ) {
			return array(
				'items'          => $items,
				'total_pages'    => max( 1, (int) ceil( $total / max( 1, $items_per_page ) ) ),
				'items_per_page' => max( 1, $items_per_page ),
			);
		}

		return array(
			'items'          => array_slice( $items, 0, $items_per_page ),
			'total_pages'    => (int) ceil( $total / $items_per_page ),
			'items_per_page' => $items_per_page,
		);
	}

	/**
	 * Deterministic Fisher-Yates shuffle driven by an explicit seed.
	 *
	 * Used by the Tiles image-source AJAX pagination path so that a visitor
	 * paging through a randomized gallery sees a consistent partition across
	 * page changes (no duplicates, no gaps). The seed is generated once per
	 * first PHP render (`random_int( 1, PHP_INT_MAX )`), persisted into the
	 * `data-wpcp-pagination` payload as `_shuffleSeed`, and round-tripped back
	 * by the frontend in every AJAX page-change request — `render_tiles_ajax_page`
	 * reads it back here to reproduce the same permutation.
	 *
	 * PRNG: a Linear Congruential Generator (Numerical Recipes constants),
	 * `state = (1664525 * state + 1013904223) mod 2^32`. The modulus is applied
	 * via `& 0xFFFFFFFF` to keep the running state in 32-bit unsigned range —
	 * PHP's 64-bit integer width comfortably contains the intermediate
	 * `1664525 * state` product, so no overflow. The LCG quality is more than
	 * sufficient for visual ordering (we're not generating crypto material).
	 *
	 * Crucially, this helper does **NOT** call `mt_srand()` (or any other API
	 * that mutates global PHP randomness state). The PRNG state is entirely
	 * local — same seed, same input, same output, with no side effects on
	 * other randomness consumers on the request.
	 *
	 * @param array $items Items to shuffle (any shape; preserves values, re-indexes 0..n-1).
	 * @param int   $seed  Positive integer; seed = 0 is treated as 1 (LCG with state 0
	 *                     produces only `c`, then a constant orbit).
	 * @return array Shuffled items in a 0-indexed array.
	 */
	public static function seeded_shuffle( array $items, int $seed ): array {
		$count = count( $items );
		if ( $count < 2 ) {
			return array_values( $items );
		}

		// Clamp seed to a positive 32-bit unsigned. Seed 0 maps to 1 to avoid
		// the LCG's trivial fixed-orbit-from-zero behavior.
		$state = $seed & 0xFFFFFFFF;
		if ( 0 === $state ) {
			$state = 1;
		}

		$result = array_values( $items );
		for ( $i = $count - 1; $i > 0; $i-- ) {
			$state = ( 1664525 * $state + 1013904223 ) & 0xFFFFFFFF;
			$j     = $state % ( $i + 1 );
			if ( $j !== $i ) {
				$tmp          = $result[ $i ];
				$result[ $i ] = $result[ $j ];
				$result[ $j ] = $tmp;
			}
		}
		return $result;
	}

	/**
	 * Build the Tiles AJAX pagination wrapper markup. Matches the editor
	 * preview (`PaginationPreview.jsx`) class-for-class.
	 *
	 * @param int $total_pages  Total pages (>= 1).
	 * @param int $current_page Current 1-indexed page.
	 * @return string HTML wrapper.
	 */
	public function render_tiles_pagination_markup( int $total_pages, int $current_page = 1 ): string {
		$pagination_options = isset( $this->attrs['paginationOptions'] ) && is_array( $this->attrs['paginationOptions'] )
			? $this->attrs['paginationOptions']
			: array();

		$wrapper_classes = array( 'wpcp-ajax-pagination', 'wpcp-ajax-pagination--number' );
		$is_empty        = $total_pages <= 1;
		if ( $is_empty ) {
			$wrapper_classes[] = 'is-empty';
		}

		// Pass the full attribute set so AJAX-rendered items match the initial
		// server render byte-for-byte (imageOptions, contentAreaOptions,
		// titleOptions, etc. all participate in `render_item`).
		// For the image source the items live on the block — they're already
		// inside `$this->attrs['items']` and flow through with the rest.
		$payload                   = is_array( $this->attrs ) ? $this->attrs : array();
		$payload['parentUniqueId'] = $this->parent_unique_id;

		// `wp_json_encode` returns false on non-UTF-8 values — fall back to an empty object so
		// the frontend parser short-circuits cleanly instead of trying to JSON.parse("false").
		$payload_json = wp_json_encode( $payload );
		if ( false === $payload_json ) {
			$payload_json = '{}';
		}

		$html  = '<div class="' . esc_attr( implode( ' ', $wrapper_classes ) ) . '"';
		$html .= ' data-wpcp-pages-total="' . esc_attr( (string) $total_pages ) . '"';
		$html .= ' data-wpcp-pagination-current="' . esc_attr( (string) $current_page ) . '"';
		$html .= " data-wpcp-pagination='" . esc_attr( $payload_json ) . "'";
		$html .= '>';

		$html .= $this->render_tiles_pagination_controls_html( $total_pages, $current_page );

		$html .= '</div>';
		return $html;
	}

	/**
	 * Render just the inner control list of the pagination wrapper. Returned
	 * alone by the AJAX endpoint so the frontend can swap in the new control
	 * set when filter/page changes alter the page count.
	 *
	 * @param int $total_pages  Total pages after filtering/sliceing.
	 * @param int $current_page 1-indexed current page.
	 * @return string HTML — empty string when there's only one page (the
	 *                wrapper's `is-empty` class handles visual collapse).
	 */
	public function render_tiles_pagination_controls_html( int $total_pages, int $current_page = 1 ): string {
		if ( $total_pages <= 1 ) {
			return '';
		}
		$pagination_options = isset( $this->attrs['paginationOptions'] ) && is_array( $this->attrs['paginationOptions'] )
			? $this->attrs['paginationOptions']
			: array();
		return $this->render_tiles_pagination_number_controls( $pagination_options, $total_pages, $current_page );
	}

	/**
	 * Render the Number-mode controls — applies the ellipsis-shortening rule
	 * (`> 7` total pages) so PHP and editor preview emit the same tokens.
	 *
	 * @param array $pagination_options Pagination options.
	 * @param int   $total_pages        Total pages.
	 * @param int   $current_page       Current page.
	 */
	private function render_tiles_pagination_number_controls( array $pagination_options, int $total_pages, int $current_page ): string {
		$show_ellipsis = ! isset( $pagination_options['showEllipsis'] ) || false !== $pagination_options['showEllipsis'];
		$tokens        = $this->build_pagination_tokens( $total_pages, $current_page, $show_ellipsis );

		$html = '';
		foreach ( $tokens as $token ) {
			if ( 'ellipsis' === $token['type'] ) {
				$html .= '<span class="wpcp-ajax-pagination__btn is-ellipsis" aria-hidden="true">&hellip;</span>';
				continue;
			}
			$page         = (int) $token['page'];
			$button_class = 'wpcp-ajax-pagination__btn';
			if ( $page === $current_page ) {
				$button_class .= ' is-active';
			}
			$html .= '<button type="button" class="' . esc_attr( $button_class ) . '" data-wpcp-page="' . esc_attr( (string) $page ) . '">' . esc_html( (string) $page ) . '</button>';
		}

		return $html;
	}

	/**
	 * Mirror of `blocks/blocks/shared/utils/paginationShorten.js`.
	 *
	 * @param int  $total_pages   Total pages.
	 * @param int  $current_page  Current 1-indexed page.
	 * @param bool $show_ellipsis Whether long lists should be shortened with ellipses.
	 * @return array<int,array{type:string,page?:int}>
	 */
	private function build_pagination_tokens( int $total_pages, int $current_page, bool $show_ellipsis = true ): array {
		$total   = max( 1, $total_pages );
		$current = max( 1, min( $total, $current_page ) );

		if ( ! $show_ellipsis || 7 >= $total ) {
			$out = array();
			for ( $page = 1; $page <= $total; $page++ ) {
				$out[] = array(
					'type' => 'page',
					'page' => $page,
				);
			}
			return $out;
		}

		$tokens     = array();
		$tokens[]   = array(
			'type' => 'page',
			'page' => 1,
		);
		$left_page  = max( 2, $current - 1 );
		$right_page = min( $total - 1, $current + 1 );

		if ( $left_page > 2 ) {
			$tokens[] = array( 'type' => 'ellipsis' );
		}
		for ( $page = $left_page; $page <= $right_page; $page++ ) {
			$tokens[] = array(
				'type' => 'page',
				'page' => $page,
			);
		}
		if ( $right_page < $total - 1 ) {
			$tokens[] = array( 'type' => 'ellipsis' );
		}
		$tokens[] = array(
			'type' => 'page',
			'page' => $total,
		);
		return $tokens;
	}
}
