<?php
/**
 * Schema for the wp-carousel-pro/grid block.
 *
 * A uniform-column grid on the Tiles grid engine: Tiles' configuration without
 * the tile layout presets and row height, with cards in a row stretched to a
 * shared height.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

defined( 'ABSPATH' ) || exit;

/**
 * GridSchema class.
 */
class GridSchema extends TilesSchema {

	/**
	 * Grid attribute schema.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		$attributes = parent::get_attributes();

		$attributes['blockName']['default']                   = 'grid';
		$attributes['layoutOptions']['default']['alignItems'] = 'stretch';

		unset(
			$attributes['layoutOptions']['default']['tileLayout'],
			$attributes['layoutOptions']['default']['tileRowHeight'],
			$attributes['layoutOptions']['default']['tileRowHeightTablet'],
			$attributes['layoutOptions']['default']['tileRowHeightMobile'],
			$attributes['layoutOptions']['default']['tileRowHeightUnit'],
			$attributes['layoutOptions']['default']['tileRowHeightTabletUnit'],
			$attributes['layoutOptions']['default']['tileRowHeightMobileUnit']
		);

		return $attributes;
	}
}
