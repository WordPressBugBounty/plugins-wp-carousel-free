<?php
/**
 * Contract that every content-source class must fulfil.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Sources;

defined( 'ABSPATH' ) || exit;

interface SourceInterface {

	/**
	 * Return an array of normalised item objects ready for rendering.
	 *
	 * Each item must contain at minimum:
	 *   id          (int|string)
	 *   image_url   (string)
	 *   image_alt   (string)
	 *   title       (string)
	 *   description (string)
	 *   url         (string)   – the click-through link
	 *   extra       (array)    – source-specific additional data
	 *
	 * @param array  $attributes Full block attributes.
	 * @param string $is_editor Determine where the call request come form.
	 * @return array
	 */
	public function get_items( array $attributes, string $is_editor = '' ): array;
}
