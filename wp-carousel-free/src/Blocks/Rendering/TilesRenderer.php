<?php
/**
 * Tiles layout renderer.
 *
 * Builds the Tiles bento CSS-grid layout (for query-driven post / product
 * sources) and the image-source bin-pack layout, plus the per-tile
 * `data-filter` attribute fragment. Parity-locked to the editor
 * `TilesGridLayout.jsx` dispatch.
 *
 * Per-item inner HTML is produced by BlockRenderer (`render_item`) and injected
 * as a callable, so this collaborator stays free of the full item-rendering
 * surface.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * TilesRenderer class.
 */
class TilesRenderer {

	/**
	 * Tile layouts whose multi-row tiles never share row tracks with single-row
	 * ones — `grid-auto-rows: auto` keeps proportions stable, so the Row Height
	 * control is hidden in the inspector. Mirror of `autoRowHeight: true` flags
	 * on TILE_LAYOUT_PRESETS in `tileSpans.js`.
	 */
	private const TILE_AUTO_ROW_HEIGHT_PRESETS = array( 'one', 'three' );

	/**
	 * Block attributes (the Tiles block's attributes).
	 *
	 * @var array
	 */
	private $attrs;

	/**
	 * Constructor.
	 *
	 * @param array $attrs Block attributes.
	 */
	public function __construct( array $attrs ) {
		$this->attrs = $attrs;
	}

	/**
	 * Tiles bento-grid layout HTML — parity with the editor `CarouselRender.jsx`
	 * tiles branch. Emits the grid container; layout, gaps, row-height, and
	 * collapse breakpoints are delivered via the cached dynamic-CSS file
	 * ({@see \ShapedPlugin\WPCarouselFree\Blocks\Styles\CarouselDynamicCss}).
	 * Per-tile inline styles are emitted only in bento mode (`tileLayout !== "one"`
	 * OR `customLayout === true`) for span pins.
	 *
	 * @param array    $items          Normalised items.
	 * @param array    $layout_options Block layoutOptions.
	 * @param callable $render_item Renders one tile's inner HTML (BlockRenderer::render_item).
	 * @return string
	 */
	public function render_tiles_main( array $items, array $layout_options, callable $render_item ): string {
		$tile_layout = AllowedValues::tile_layout( $layout_options['tileLayout'] ?? 'one' );
		$source_type = isset( $this->attrs['sourceType'] ) ? (string) $this->attrs['sourceType'] : 'image';

		// Image-source bento packs to pixels so the preset's grid pins are
		// honoured against the real container width. Query-driven sources
		// (post / product) keep the CSS-Grid path — their item count isn't
		// known until the query runs.
		$is_bento_mode = ( 'one' !== $tile_layout );
		if ( $is_bento_mode && 'image' === $source_type ) {
			return $this->render_tiles_binpack( $items, $layout_options, $tile_layout, $render_item );
		}

		$columns    = max( 1, (int) ( $layout_options['columns'] ?? 3 ) );
		$tile_spans = TilesBinPack::stamp_preset( count( $items ), $tile_layout, $columns );

		$container_classes = array( 'wpcp-tiles-grid' );
		if ( $is_bento_mode ) {
			$container_classes[] = 'wpcp-tiles-grid--bento';
		}

		$html = '<div class="' . esc_attr( implode( ' ', $container_classes ) ) . '" data-tile-layout="' . esc_attr( $tile_layout ) . '">';

		foreach ( $items as $i => $item ) {
			$tile_classes = array( 'wpcp-item' );
			$tile_style   = '';
			$pin_attrs    = '';

			if ( $is_bento_mode ) {
				$tile_classes[] = 'wpcp-tiles-tile';
				$entry          = isset( $tile_spans[ $i ] ) && is_array( $tile_spans[ $i ] ) ? $tile_spans[ $i ] : array();
				$col_span       = (int) ( $entry['colSpan'] ?? 1 );
				$row_span       = (int) ( $entry['rowSpan'] ?? 1 );
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

				$grid_column = self::sanitize_grid_line( $entry['gridColumn'] ?? '', 'span ' . $col_span );
				$grid_row    = self::sanitize_grid_line( $entry['gridRow'] ?? '', 'span ' . $row_span );

				$tile_style = sprintf(
					'--tile-col-span:%d;--tile-row-span:%d;grid-column:%s;grid-row:%s;',
					$col_span,
					$row_span,
					esc_attr( $grid_column ),
					esc_attr( $grid_row )
				);

				if ( ! empty( $entry['gridColumn'] ) ) {
					$pin_attrs .= ' data-grid-column="' . esc_attr( $entry['gridColumn'] ) . '"';
				}
				if ( ! empty( $entry['gridRow'] ) ) {
					$pin_attrs .= ' data-grid-row="' . esc_attr( $entry['gridRow'] ) . '"';
				}
			}

			$style_attr  = '' !== $tile_style ? ' style="' . esc_attr( $tile_style ) . '"' : '';
			$filter_attr = self::build_tile_data_filter_attr( $item );
			$html       .= '<div class="' . esc_attr( implode( ' ', $tile_classes ) ) . '" data-tile-index="' . (int) $i . '"' . $style_attr . $pin_attrs . $filter_attr . '>';
			$html       .= $render_item( $item );
			$html       .= '</div>';
		}

		$html .= '</div>';
		return $html;
	}

	/**
	 * Validate a saved tile grid-line pin (`gridColumn` / `gridRow`) before it is
	 * written into the inline `style` attribute.
	 *
	 * The pin is a free-form string from the saved `tileSpans` attribute, so a
	 * contributor-level author could store `1; background:url(//evil)` and break
	 * out of the `grid-column:` declaration (esc_attr does not stop CSS injection).
	 * Only the real grid-line grammar — line numbers, `span N`, `auto`, and `/`
	 * ranges — is allowed through; anything else falls back to the computed span.
	 *
	 * @param mixed  $value    Saved pin value.
	 * @param string $fallback Computed `span N` fallback.
	 * @return string A safe grid-line value.
	 */
	public static function sanitize_grid_line( $value, string $fallback ): string {
		$value = is_string( $value ) ? trim( $value ) : '';
		if ( '' === $value ) {
			return $fallback;
		}
		if ( preg_match( '#^(?:auto|span\s+\d+|-?\d+|-?\d+\s*/\s*(?:span\s+)?-?\d+|span\s+\d+\s*/\s*-?\d+)$#i', $value ) ) {
			return $value;
		}
		return $fallback;
	}

	/**
	 * Build the `data-filter="filter-1 filter-2"` attribute fragment for a
	 * tile wrapper. Empty `filterIds` yields no attribute, which the frontend
	 * script reads as "untagged" — visible only under All.
	 *
	 * @param array $item Normalised item from a SourceInterface.
	 * @return string Either ' data-filter="…"' or ''.
	 */
	public static function build_tile_data_filter_attr( array $item ): string {
		if ( empty( $item['filterIds'] ) || ! is_array( $item['filterIds'] ) ) {
			return '';
		}
		$ids = array();
		foreach ( $item['filterIds'] as $id ) {
			if ( is_string( $id ) && '' !== $id ) {
				$ids[] = $id;
			}
		}
		if ( empty( $ids ) ) {
			return '';
		}
		return ' data-filter="' . esc_attr( implode( ' ', $ids ) ) . '"';
	}

	/**
	 * Tiles image-source bin-pack render.
	 *
	 * Packs on a fixed 12-track grid and honours the `gridColumn` / `gridRow`
	 * pins from the preset table so the result matches the layout-style SVG.
	 * Rows are sized from `tileRowHeight`.
	 *
	 * Emits absolute-positioned tiles with pixel coordinates derived from a
	 * row-major bin-pack against an assumed desktop container (see
	 * {@see TilesBinPack::FALLBACK_WIDTH_PX}). The frontend bootstrap
	 * (`assets/js/frontend.js`) re-measures the real container width on load
	 * and re-runs the pack — this output is a best-effort first paint that
	 * mitigates FOUC. The `data-*` attrs carry everything the bootstrap needs:
	 * columns, gaps, responsive breakpoints, row height.
	 *
	 * DOM contract:
	 *   <div class="wpcp-tiles-grid wpcp-tiles-grid--binpack"
	 *        style="position: relative; height: Hpx; visibility: hidden;"
	 *        data-source-type="image"
	 *        data-tile-grid-columns="..." data-tile-col-gap="..." data-tile-row-gap="..."
	 *        data-tile-responsive-rescale="1" data-tile-cols-tablet="..." data-tile-cols-mobile="..."
	 *        data-tile-row-height="...">
	 *     <div class="wpcp-tiles-tile" data-tile-index="0" data-col-span="6" data-row-span="2"
	 *          data-pin-col="1 / span 6" data-pin-row="1 / span 2"
	 *          style="position: absolute; left: 0px; top: 0px; width: 590px; height: 460px;">
	 *       ...
	 *     </div>
	 *     ...
	 *   </div>
	 *
	 * @param array    $items          Normalised items.
	 * @param array    $layout_options Block layoutOptions.
	 * @param string   $tile_layout    Active layout-style key (never `one` here).
	 * @param callable $render_item    Renders one tile's inner HTML (BlockRenderer::render_item).
	 * @return string
	 */
	private function render_tiles_binpack( array $items, array $layout_options, string $tile_layout, callable $render_item ): string {
		// Presets are defined on a 12-track grid.
		$tile_grid_columns = 12;

		$gap_h = max( 0, isset( $layout_options['gapHorizontal'] ) ? (int) $layout_options['gapHorizontal'] : 20 );
		$gap_v = max( 0, isset( $layout_options['gapVertical'] ) ? (int) $layout_options['gapVertical'] : 20 );

		$columns_tablet = isset( $layout_options['columnsTablet'] ) ? (int) $layout_options['columnsTablet'] : 2;
		$columns_mobile = isset( $layout_options['columnsMobile'] ) ? (int) $layout_options['columnsMobile'] : 1;

		$columns_for_stamp = max( 1, (int) ( $layout_options['columns'] ?? 3 ) );
		$tile_spans        = TilesBinPack::stamp_preset( count( $items ), $tile_layout, $columns_for_stamp );

		$raw_row_height = isset( $layout_options['tileRowHeight'] ) ? (int) $layout_options['tileRowHeight'] : 220;
		$raw_unit       = isset( $layout_options['tileRowHeightUnit'] ) ? strtolower( (string) $layout_options['tileRowHeightUnit'] ) : 'px';
		$row_height_px  = 'em' === $raw_unit
			? max( 1, (int) round( $raw_row_height * 16 ) )
			: max( 1, $raw_row_height );

		// Run the bin-pack server-side to compute each tile's grid (x, y, w, h)
		// against the assumed desktop width. The bootstrap JS re-measures the
		// actual container on load and applies correct pixel positions — the
		// initial `visibility: hidden` on the container hides the calibration gap.
		//
		// Why not pure CSS calc() and skip JS entirely: for `height` and `top`,
		// a `%` value references the parent's HEIGHT (which is `auto` in most
		// page layouts), so `calc((100% + 10px) * y / cols)` collapses to 0 and
		// the container shows nothing. Width/left percentages work (they ref
		// parent width), but height/top don't — so we fall back to pixel
		// positions + JS recompute on the frontend.
		$pack = TilesBinPack::binpack(
			$items,
			$tile_spans,
			$tile_grid_columns,
			$gap_h,
			$gap_v,
			TilesBinPack::FALLBACK_WIDTH_PX,
			$row_height_px
		);

		$container_classes = array(
			'wpcp-tiles-grid',
			'wpcp-tiles-grid--binpack',
		);

		$max_row_end      = isset( $pack['maxRowEnd'] ) ? (int) $pack['maxRowEnd'] : 0;
		$container_height = isset( $pack['containerHeight'] ) ? (int) ceil( $pack['containerHeight'] ) : 0;

		// Initial container: visibility:hidden until JS measures and lays out.
		// Avoids the FOUC of tiles overflowing when the actual parent width is
		// narrower than the desktop-width assumption used by the server-side
		// bin-pack. The bootstrap script removes visibility:hidden after first
		// layout (see `wpcpLayoutContainer` in `blocks/blocks/frontend.js`).
		$container_style = sprintf(
			'position:relative;width:100%%;height:%dpx;visibility:hidden;',
			$container_height
		);

		$row_height_attr = sprintf( ' data-tile-row-height="%d"', (int) $row_height_px );
		// Mirror the editor preview, which emits `data-tile-layout` on every
		// bin-pack container so themes and external scripts can read the active
		// preset without touching block attributes.
		$html = sprintf(
			'<div class="%s" data-tile-layout="%s" data-source-type="image" data-tile-grid-columns="%d" data-tile-col-gap="%d" data-tile-row-gap="%d" data-tile-responsive-rescale="%d" data-tile-cols-tablet="%d" data-tile-cols-mobile="%d" data-max-row-end="%d"%s style="%s">',
			esc_attr( implode( ' ', $container_classes ) ),
			esc_attr( $tile_layout ),
			$tile_grid_columns,
			$gap_h,
			$gap_v,
			1,
			$columns_tablet,
			$columns_mobile,
			$max_row_end,
			$row_height_attr,
			esc_attr( $container_style )
		);

		foreach ( $items as $i => $item ) {
			$entry    = isset( $tile_spans[ $i ] ) && is_array( $tile_spans[ $i ] ) ? $tile_spans[ $i ] : array();
			$col_span = (int) ( $entry['colSpan'] ?? 2 );
			$row_span = (int) ( $entry['rowSpan'] ?? 2 );
			$col_span = max( 1, min( $tile_grid_columns, $col_span ) );
			$row_span = max( 1, $row_span );

			$pos = $pack['positions'][ $i ] ?? array(
				'x'        => 0,
				'y'        => 0,
				'leftPx'   => 0,
				'topPx'    => 0,
				'widthPx'  => 0,
				'heightPx' => 0,
			);
			$x   = (int) ( $pos['x'] ?? 0 );
			$y   = (int) ( $pos['y'] ?? 0 );

			$tile_style = sprintf(
				'position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;',
				(int) round( $pos['leftPx'] ),
				(int) round( $pos['topPx'] ),
				(int) round( $pos['widthPx'] ),
				(int) round( $pos['heightPx'] )
			);

			// Emit preset pins so the frontend bootstrap can honor them when
			// re-running the bin-pack at the real container width.
			$pin_attrs = '';
			if ( ! empty( $entry['gridColumn'] ) && is_string( $entry['gridColumn'] ) ) {
				$pin_attrs .= ' data-pin-col="' . esc_attr( $entry['gridColumn'] ) . '"';
			}
			if ( ! empty( $entry['gridRow'] ) && is_string( $entry['gridRow'] ) ) {
				$pin_attrs .= ' data-pin-row="' . esc_attr( $entry['gridRow'] ) . '"';
			}

			$filter_attr = self::build_tile_data_filter_attr( $item );
			$html       .= sprintf(
				'<div class="wpcp-item wpcp-tiles-tile" data-tile-index="%d" data-col-span="%d" data-row-span="%d" data-grid-x="%d" data-grid-y="%d" style="%s"%s%s>',
				(int) $i,
				$col_span,
				$row_span,
				$x,
				$y,
				esc_attr( $tile_style ),
				$pin_attrs,
				$filter_attr
			);
			$html       .= $render_item( $item );
			$html       .= '</div>';
		}

		$html .= '</div>';

		// Bootstrap is bundled in `blocks/blocks/frontend.js` (built to
		// `assets/js/frontend.js`) and enqueued for every frontend page that
		// renders a WP Carousel Pro block. It finds every `.wpcp-tiles-grid--binpack`
		// container on DOMContentLoaded, measures the actual width, re-runs the
		// bin-pack, and applies correct pixel positions — also on window resize
		// and `ResizeObserver` callbacks.
		//
		// Inlining the script in PHP was unreliable: WordPress's content
		// pipeline HTML-encoded `&&` / `||` operators inside the inline <script>,
		// breaking the JS parser. The bundled frontend.js bypasses that filter.

		return $html;
	}
}
