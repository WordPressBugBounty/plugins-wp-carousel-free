<?php
/**
 * Shared saved-template behaviour for the page builder integrations.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base;

defined( 'ABSPATH' ) || exit;

/**
 * Every builder element does the same job: offer a saved-template dropdown and
 * replay the chosen template through its shortcode. This trait is that job.
 */
trait Base_Page_Builder {

	/**
	 * Published saved templates, newest first, keyed by ID.
	 *
	 * @param string $placeholder_key Key for the "select" row.
	 * @return array Template ID => title.
	 */
	public function get_saved_templates_list( $placeholder_key = '0' ) {
		return Builder_Templates::get_list( $placeholder_key );
	}

	/**
	 * Render a saved template, or the placeholder explaining why it cannot be.
	 *
	 * @param int  $template_id Template post ID.
	 * @param bool $is_editor   Whether the builder's editor is rendering.
	 * @return string
	 */
	public function render_template( $template_id, $is_editor = false ) {
		return Builder_Templates::render( $template_id, $is_editor );
	}
}
