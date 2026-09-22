<?php
/**
 * Tiles block dynamic-CSS generators (PHP side).
 *
 * Mirrors the tiles branch of the JS editor module
 * `blocks/blocks/shared/styles/tilesDynamicCss.js`. Any change here MUST land on
 * the JS side in the same commit — the JS↔PHP parity harness in
 * `tests/css-parity/` will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * Tiles grid base/responsive rules + collapse media queries.
 */
trait TilesCss {

	/**
	 * Whether the block is the tiles layout (gates tiles_* generators).
	 *
	 * @return bool True when blockName matches.
	 */
	private function is_tiles_block() {
		$block_name = isset( $this->attributes['blockName'] ) ? strtolower( (string) $this->attributes['blockName'] ) : '';
		return 'tiles' === $block_name || 'wp-carousel-pro/tiles' === $block_name;
	}

	/**
	 * Resolve per-device tiles grid settings from layoutOptions.
	 *
	 * Mirrors: carouselDynamicCss.js getTilesModeSettings().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS property map for the tiles grid.
	 */
	private function tiles_mode_settings( $device_type ) {
		$layout_options   = $this->attributes['layoutOptions'] ?? array();
		$tile_layout      = AllowedValues::tile_layout( $layout_options['tileLayout'] ?? 'one' );
		$is_bento_mode    = ( 'one' !== $tile_layout );
		$source_type      = isset( $this->attributes['sourceType'] ) ? (string) $this->attributes['sourceType'] : 'image';
		$is_image_binpack = 'image' === $source_type && $is_bento_mode;

		$columns = (int) ( $layout_options['columns'] ?? 3 );
		if ( 'Tablet' === $device_type ) {
			$columns = (int) ( $layout_options['columnsTablet'] ?? $layout_options['columns'] ?? 3 );
		} elseif ( 'Mobile' === $device_type ) {
			$columns = (int) ( $layout_options['columnsMobile'] ?? $layout_options['columnsTablet'] ?? $layout_options['columns'] ?? 1 );
		}
		$columns = max( 1, $columns );

		// Image-source bento uses the bin-pack engine: the container is
		// position:relative with a JS-computed height, so CSS Grid props MUST
		// NOT be emitted there.
		if ( $is_image_binpack ) {
			return array(
				'is-image-binpack'      => true,
				'responsive-rescale'    => true,
				'grid-template-columns' => $is_bento_mode ? 'repeat(12, 1fr)' : 'repeat(' . $columns . ', 1fr)',
			);
		}

		// Gaps + row-height are tokenized (--wpcp-tile-* via tileGridDim; consumed by
		// the static `.wpcp-tiles-grid` rule). This builder keeps only the Layer-5 grid
		// math: the grid-template-columns choice (bento 12-col vs N columns).
		return array(
			'is-image-binpack'      => false,
			'responsive-rescale'    => true,
			'grid-template-columns' => $is_bento_mode ? 'repeat(12, 1fr)' : 'repeat(' . $columns . ', 1fr)',
		);
	}

	/**
	 * Base (desktop) tiles grid rules.
	 *
	 * Mirrors: carouselDynamicCss.js generateTilesBaseStyles().
	 *
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function tiles_base_styles() {
		$settings = $this->tiles_mode_settings( 'Desktop' );
		if ( ! empty( $settings['is-image-binpack'] ) ) {
			return array(
				array(
					'selector' => $this->tiles_grid_selector,
					'styles'   => array(
						'position' => 'relative',
					),
				),
			);
		}

		unset( $settings['is-image-binpack'], $settings['responsive-rescale'] );
		$tile_styles = $settings;
		$tile_styles = array_merge(
			array(
				'display'        => 'grid',
				'grid-auto-flow' => 'dense',
			),
			$tile_styles
		);

		return array(
			array(
				'selector' => $this->tiles_grid_selector,
				'styles'   => $tile_styles,
			),
			array(
				'selector' => $this->tiles_tile_selector,
				'styles'   => array(
					'grid-column' => 'span var(--tile-col-span, 1)',
					'grid-row'    => 'span var(--tile-row-span, 1)',
				),
			),
		);
	}

	/**
	 * Per-device tiles grid responsive rules.
	 *
	 * Mirrors: carouselDynamicCss.js generateTilesResponsiveStyles().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function tiles_responsive_rules( $device_type ) {
		$settings = $this->tiles_mode_settings( $device_type );
		if ( ! empty( $settings['is-image-binpack'] ) ) {
			$styles = ! empty( $settings['responsive-rescale'] ) ? array() : array( 'overflow-x' => 'auto' );

			return array(
				array(
					'selector' => $this->tiles_grid_selector,
					'styles'   => $styles,
				),
			);
		}

		unset( $settings['is-image-binpack'], $settings['responsive-rescale'] );

		return array(
			array(
				'selector' => $this->tiles_grid_selector,
				'styles'   => $settings,
			),
		);
	}

	/**
	 * Tiles collapse media queries appended after tablet/mobile responsive CSS.
	 *
	 * Mirrors: carouselDynamicCss.js generateTilesCollapseCss().
	 *
	 * @return string Raw CSS string (empty when not a tiles block).
	 */
	private function tiles_collapse_css() {
		if ( ! $this->is_tiles_block() ) {
			return '';
		}

		return '@media only screen and (max-width:' . self::TILES_COLLAPSE_TABLET_BREAKPOINT . 'px){' . $this->tiles_tile_selector . '{grid-column:auto !important;grid-row:auto !important;}}'
			. '@media only screen and (max-width:' . self::TILES_COLLAPSE_MOBILE_BREAKPOINT . 'px){' . $this->tiles_grid_selector . '{grid-template-columns:1fr !important;}' . $this->tiles_tile_selector . '{grid-column:auto !important;grid-row:auto !important;}}';
	}
}
