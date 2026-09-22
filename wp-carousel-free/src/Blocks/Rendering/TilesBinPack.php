<?php
/**
 * Tile-layout preset table + pure-PHP bin-pack algorithm for the Tiles block.
 *
 * Server-side mirror of `blocks/blocks/shared/utils/tileSpans.js` — every
 * function here is byte-equivalent to its JS counterpart and emits the same
 * `(x, y, leftPx, topPx, widthPx, heightPx)` tuples for the same input.
 *
 * The HTML-rendering wrapper around this algorithm lives in
 * {@see \ShapedPlugin\WPCarouselFree\Blocks\BlockRenderer::render_tiles_custom_binpack()}
 * because it needs per-tile access to `render_item` and the data-filter helper.
 * This class is the pure-function half: presets, span resolution, pin parsing,
 * and the bin-pack scan itself.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

defined( 'ABSPATH' ) || exit;

/**
 * Stateless tile-layout algorithm: presets, span resolution, and bin-pack.
 */
final class TilesBinPack {

	/**
	 * Fallback container width (in px) used by the server-side tiles bin-pack.
	 *
	 * The bin-pack pixel formula needs a real width to compute unit_px / left /
	 * top. On the server we have no DOM, so we render against this assumed
	 * desktop width — the frontend bootstrap (`assets/js/frontend.js`) then
	 * re-measures the actual container on load and recomputes positions.
	 *
	 * Keep this in sync with `TILE_BINPACK_FALLBACK_WIDTH_PX` in
	 * `blocks/blocks/shared/utils/tileSpans.js`.
	 */
	public const FALLBACK_WIDTH_PX = 1200;

	/**
	 * Safety cap on the row-scan inside the server-side tiles bin-pack.
	 *
	 * A 12-column board with ~10k rows is ~120k cells — well above any sane
	 * gallery size. The cap exists purely as a safety net against
	 * pathologically large `rowSpan` values causing an unbounded loop;
	 * it never fires under normal input. Mirrors `TILE_BINPACK_MAX_ROWS`
	 * in `blocks/blocks/shared/utils/tileSpans.js`.
	 */
	public const MAX_ROWS = 10000;

	/**
	 * Tile-layout preset table. Mirror of `TILE_LAYOUT_PRESETS` in
	 * `blocks/blocks/shared/utils/tileSpans.js` — kept verbatim so the
	 * preset shape, pinned grid positions, and overflow defaults stay
	 * parity-locked between editor preview and frontend render.
	 *
	 * Shape: `[ tile_layout => [ 'spans' => array<span>, 'overflow' => span ] ]`
	 * where `span` is `{ colSpan, rowSpan, gridColumn?, gridRow? }`. Items past
	 * the preset's `spans` length use `overflow` so a 9-item gallery on preset
	 * `'two'` (6-span) gets sensible fallbacks instead of 1/12-wide slivers.
	 * Free ships the three presets `AllowedValues::TILE_LAYOUTS` permits.
	 */
	public const PRESETS = array(
		'one'   => array(
			'spans'    => array(
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
				array(
					'colSpan' => 4,
					'rowSpan' => 1,
				),
			),
			'overflow' => array(
				'colSpan' => 4,
				'rowSpan' => 1,
			),
		),
		'two'   => array(
			'spans'    => array(
				array(
					'colSpan'    => 6,
					'rowSpan'    => 2,
					'gridColumn' => '1 / span 6',
					'gridRow'    => '1 / span 2',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 1,
					'gridColumn' => '7 / span 6',
					'gridRow'    => '1',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 1,
					'gridColumn' => '7 / span 6',
					'gridRow'    => '2',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 1,
					'gridColumn' => '1 / span 6',
					'gridRow'    => '3',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 1,
					'gridColumn' => '1 / span 6',
					'gridRow'    => '4',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 2,
					'gridColumn' => '7 / span 6',
					'gridRow'    => '3 / span 2',
				),
			),
			'overflow' => array(
				'colSpan' => 6,
				'rowSpan' => 1,
			),
		),
		'three' => array(
			'spans'    => array(
				array(
					'colSpan'    => 12,
					'rowSpan'    => 2,
					'gridColumn' => '1 / span 12',
					'gridRow'    => '1 / span 2',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 1,
					'gridColumn' => '1 / span 6',
					'gridRow'    => '3',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 1,
					'gridColumn' => '7 / span 6',
					'gridRow'    => '3',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 1,
					'gridColumn' => '1 / span 6',
					'gridRow'    => '4',
				),
				array(
					'colSpan'    => 6,
					'rowSpan'    => 1,
					'gridColumn' => '7 / span 6',
					'gridRow'    => '4',
				),
			),
			'overflow' => array(
				'colSpan' => 6,
				'rowSpan' => 1,
			),
		),
	);

	/**
	 * Resolve the default span for a given tile index under the active preset.
	 * Mirror of `presetDefaultAt()` in `blocks/blocks/shared/utils/tileSpans.js`.
	 *
	 * - `tile_layout = 'one'` is a uniform grid driven by `columns`: every entry
	 *   resolves to `{ colSpan: floor(12 / columns), rowSpan: 1 }`.
	 * - Other presets use `spans[index]` for in-preset indices and the preset's
	 *   `overflow` (or a columns-derived span) for overflow indices.
	 *
	 * @param string $tile_layout Active layout-style key.
	 * @param int    $index       Zero-based tile index.
	 * @param int    $columns     Active Columns slider value.
	 * @return array Span: { colSpan, rowSpan, gridColumn?, gridRow? }.
	 */
	public static function preset_default_at( string $tile_layout, int $index, int $columns ): array {
		$safe_cols = max( 1, min( 12, $columns ) );
		if ( 'one' === $tile_layout ) {
			$col = max( 1, min( 12, intdiv( 12, $safe_cols ) ) );
			return array(
				'colSpan' => $col,
				'rowSpan' => 1,
			);
		}
		$preset = self::PRESETS[ $tile_layout ] ?? null;
		if ( null === $preset ) {
			return array(
				'colSpan' => 1,
				'rowSpan' => 1,
			);
		}
		$spans = isset( $preset['spans'] ) && is_array( $preset['spans'] ) ? $preset['spans'] : array();
		if ( isset( $spans[ $index ] ) && is_array( $spans[ $index ] ) ) {
			return $spans[ $index ];
		}
		// Overflow: derive from columns when meaningful, else preset overflow.
		if ( $safe_cols > 0 ) {
			$col = max( 1, min( 12, intdiv( 12, $safe_cols ) ) );
			return array(
				'colSpan' => $col,
				'rowSpan' => 1,
			);
		}
		return $preset['overflow'] ?? array(
			'colSpan' => 1,
			'rowSpan' => 1,
		);
	}

	/**
	 * Stamp a fresh `tileSpans` array of the requested length from a preset.
	 * Used at render time when the saved `tileSpans` doesn't match the runtime
	 * item count — typical for query-driven sources (post / product / etc.)
	 * where the editor saves `items = []` and the actual item list is built
	 * server-side on each request. Mirror of `stampPreset()` in tileSpans.js.
	 *
	 * @param int    $item_count  Number of tiles to stamp for.
	 * @param string $tile_layout Active layout-style key.
	 * @param int    $columns     Active Columns slider value.
	 * @return array Index-aligned spans of length `$item_count`.
	 */
	public static function stamp_preset( int $item_count, string $tile_layout, int $columns ): array {
		$out = array();
		for ( $i = 0; $i < $item_count; $i++ ) {
			$out[] = self::preset_default_at( $tile_layout, $i, $columns );
		}
		return $out;
	}

	/**
	 * Column unit width for bin-pack math at a given container width.
	 *
	 * @param int $container_width Container width in px.
	 * @param int $columns         Grid track count.
	 * @param int $gap_h           Horizontal gap in px.
	 * @return float
	 */
	public static function derive_unit_px( int $container_width, int $columns, int $gap_h ): float {
		$safe_columns = max( 1, min( 12, $columns > 0 ? $columns : 12 ) );
		$gap_h        = max( 0, $gap_h );
		if ( $container_width <= 0 ) {
			return 0.0;
		}
		return ( $container_width - ( $safe_columns - 1 ) * $gap_h ) / $safe_columns;
	}

	/**
	 * Parse a CSS Grid `gridColumn` / `gridRow` value of the form
	 * `"<start> / span <n>"` or a bare `"<start>"` into a zero-indexed
	 * `{x, y}` cell. Returns `null` when either string is missing/malformed.
	 *
	 * Mirror of `parsePinPosition()` in `blocks/blocks/shared/utils/tileSpans.js`.
	 *
	 * @param array $entry tileSpans entry.
	 * @return array{x:int,y:int}|null
	 */
	public static function parse_pin_position( array $entry ): ?array {
		$col = $entry['gridColumn'] ?? null;
		$row = $entry['gridRow'] ?? null;
		if ( ! is_string( $col ) || ! is_string( $row ) ) {
			return null;
		}
		$col_start = (int) trim( explode( '/', $col, 2 )[0] );
		$row_start = (int) trim( explode( '/', $row, 2 )[0] );
		if ( $col_start < 1 || $row_start < 1 ) {
			return null;
		}
		return array(
			'x' => $col_start - 1,
			'y' => $row_start - 1,
		);
	}

	/**
	 * Pure-PHP bin-pack mirror of `packTiles()` in
	 * `blocks/blocks/shared/utils/tileBinPack.js` (the shared core behind both
	 * the editor's `binPackTiles()` and the frontend's `wpcpTilesBinPack()`).
	 * Geometry parity is locked by `npm run test:tiles-binpack` against
	 * `tests/css-parity/fixtures/tiles-binpack.json`.
	 *
	 * Honors explicit `gridColumn` / `gridRow` pins on a tile entry (preset mode)
	 * and falls back to row-major scan for unpinned tiles (Custom Layout +
	 * overflow). When `$row_height_px` is provided, uses non-square cells
	 * (rowSpan * row_height_px); otherwise falls back to Modula-style square
	 * units (rowSpan * unit_px). Identical algorithm + pixel formula to the JS
	 * version — required for JS/PHP render parity.
	 *
	 * @param array    $items           Items (only count is used).
	 * @param array    $tile_spans      Index-aligned tileSpans.
	 * @param int      $columns         Grid track count.
	 * @param int      $gap_h           Horizontal gap in px.
	 * @param int      $gap_v           Vertical gap in px.
	 * @param int      $container_width Container width in px (server-side assumption).
	 * @param int|null $row_height_px   Optional non-square row height in px (preset mode).
	 * @return array{positions: array<int, array{x:int, y:int, leftPx:float, topPx:float, widthPx:float, heightPx:float}>, containerHeight: float, unitPx: float}
	 */
	public static function binpack( array $items, array $tile_spans, int $columns, int $gap_h, int $gap_v, int $container_width, ?int $row_height_px = null ): array {
		// Mirror the JS `Number(columns) || 12` fallback: zero means "default 12-track grid".
		$safe_columns = max( 1, min( 12, 0 === $columns ? 12 : $columns ) );
		$gap_h        = max( 0, $gap_h );
		$gap_v        = max( 0, $gap_v );
		$item_count   = count( $items );
		$default_col  = 2;
		$default_row  = 2;

		if ( 0 === $item_count || $container_width <= 0 ) {
			return array(
				'positions'       => array(),
				'containerHeight' => 0,
				'unitPx'          => 0,
			);
		}

		$unit_px = ( $container_width - ( $safe_columns - 1 ) * $gap_h ) / $safe_columns;
		$row_px  = ( null !== $row_height_px && $row_height_px > 0 ) ? (float) $row_height_px : $unit_px;
		$step_x  = $unit_px + $gap_h;
		$step_y  = $row_px + $gap_v;

		$occupied    = array(); // Sparse: keys "x,y".
		$positions   = array();
		$max_row_end = 0;

		$is_free = static function ( int $start_x, int $start_y, int $w, int $h ) use ( &$occupied ): bool {
			for ( $dy = 0; $dy < $h; $dy++ ) {
				for ( $dx = 0; $dx < $w; $dx++ ) {
					if ( isset( $occupied[ ( $start_x + $dx ) . ',' . ( $start_y + $dy ) ] ) ) {
						return false;
					}
				}
			}
			return true;
		};

		$mark_occupied = static function ( int $start_x, int $start_y, int $w, int $h ) use ( &$occupied ): void {
			for ( $dy = 0; $dy < $h; $dy++ ) {
				for ( $dx = 0; $dx < $w; $dx++ ) {
					$occupied[ ( $start_x + $dx ) . ',' . ( $start_y + $dy ) ] = true;
				}
			}
		};

		$place = static function ( int $i, int $x, int $y, int $w, int $h ) use ( &$positions, &$max_row_end, $step_x, $step_y, $unit_px, $row_px, $gap_h, $gap_v, $mark_occupied ): void {
			$mark_occupied( $x, $y, $w, $h );
			$positions[ $i ] = array(
				'x'        => $x,
				'y'        => $y,
				'leftPx'   => $x * $step_x,
				'topPx'    => $y * $step_y,
				'widthPx'  => $w * $unit_px + ( $w - 1 ) * $gap_h,
				'heightPx' => $h * $row_px + ( $h - 1 ) * $gap_v,
			);
			$max_row_end     = max( $max_row_end, $y + $h );
		};

		for ( $i = 0; $i < $item_count; $i++ ) {
			$entry   = isset( $tile_spans[ $i ] ) && is_array( $tile_spans[ $i ] ) ? $tile_spans[ $i ] : array();
			$raw_col = $entry['colSpan'] ?? $default_col;
			$raw_row = $entry['rowSpan'] ?? $default_row;
			// Mirror the JS normalization exactly: Number(raw) || 1, then round.
			$col_num = is_numeric( $raw_col ) ? (float) $raw_col : 0.0;
			$row_num = is_numeric( $raw_row ) ? (float) $raw_row : 0.0;
			$col_num = 0.0 === $col_num ? 1.0 : $col_num;
			$row_num = 0.0 === $row_num ? 1.0 : $row_num;
			$w       = max( 1, min( $safe_columns, (int) round( $col_num ) ) );
			$h       = max( 1, (int) round( $row_num ) );

			// Honor an explicit pin when present and it still fits the current
			// grid. Falls back to row-major scan if the pin overflows the column
			// count (e.g. responsive rescale shrunk `$safe_columns` below the pin).
			$pin = self::parse_pin_position( $entry );
			if ( null !== $pin && $pin['x'] + $w <= $safe_columns && $is_free( $pin['x'], $pin['y'], $w, $h ) ) {
				$place( $i, $pin['x'], $pin['y'], $w, $h );
				continue;
			}

			// Row-major scan: walk each row (y = 0, 1, 2, …) for the first
			// (x, y) where the rectangle (x..x+w-1, y..y+h-1) is entirely free.
			// `self::MAX_ROWS` is a safety net against pathological
			// rowSpans turning this into an unbounded loop; it never fires under
			// normal input.
			$placed = false;
			for ( $y = 0; ! $placed && $y < self::MAX_ROWS; $y++ ) {
				for ( $x = 0; $x <= $safe_columns - $w; $x++ ) {
					if ( $is_free( $x, $y, $w, $h ) ) {
						$place( $i, $x, $y, $w, $h );
						$placed = true;
						break;
					}
				}
			}
		}

		$container_height = $max_row_end > 0 ? ( $max_row_end * $step_y - $gap_v ) : 0;
		return array(
			'positions'       => $positions,
			'containerHeight' => $container_height,
			'unitPx'          => $unit_px,
			'maxRowEnd'       => $max_row_end,
		);
	}
}
