<?php
/**
 * Block attribute schema contract.
 *
 * Implementations return a WordPress-compatible attribute map keyed by attribute
 * name. Each value is an associative array with at minimum a `type` and (when
 * applicable) `default`, plus any other valid block.json attribute keys
 * (`source`, `selector`, `attribute`, `query`, `enum`, `items`).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

defined( 'ABSPATH' ) || exit;

/**
 * AttributeSchema interface.
 */
interface AttributeSchema {

	/**
	 * Return the attribute map for a block.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array;
}
