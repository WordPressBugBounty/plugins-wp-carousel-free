<?php
/**
 * Base class for a Pro block that is previewable in the editor only.
 *
 * The block registers its full attribute schema so the editor can bootstrap
 * defaults and drive a live preview, and nothing else: no view script, no
 * stylesheet, and `render()` returns an empty string before any collaborator
 * runs. Its JS `save` returns null, so the post body holds only the block
 * comment and a page containing one enqueues zero block CSS and zero block JS.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;

defined( 'ABSPATH' ) || exit;

/**
 * EditorPreviewBlock class.
 */
abstract class EditorPreviewBlock extends AbstractBlock {

	/**
	 * Register with attributes and an editor bundle only.
	 *
	 * The `view_script` key is omitted rather than emptied: WP_Block_Type
	 * normalises it into `view_script_handles`, where an empty string would land
	 * as array( '' ) and be enqueued.
	 */
	protected function register_block_type() {
		$metadata_path = $this->get_block_metadata_path();

		if ( ! $metadata_path || ! file_exists( $metadata_path . '/block.json' ) ) {
			return;
		}

		if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
			return;
		}

		$args = array(
			'editor_script'   => $this->get_editor_script_handle(),
			'editor_style'    => $this->get_editor_style_handle(),
			'render_callback' => array( $this, 'render' ),
		);

		$schema = $this->get_schema();
		if ( $schema instanceof AttributeSchema ) {
			$args['attributes'] = $schema->get_attributes();
		}

		register_block_type_from_metadata( $metadata_path, $args );
	}

	/**
	 * Never render on the front end.
	 *
	 * Overriding the entry point rather than do_render() keeps the source query,
	 * BlockRenderer and every asset enqueue unreachable.
	 *
	 * @param array     $attributes Block attributes. Unused.
	 * @param string    $content    Inner block content. Unused.
	 * @param \WP_Block $block      WP_Block instance. Unused.
	 * @return string Always empty.
	 */
	public function render( $attributes, $content, $block ) {
		return '';
	}

	/**
	 * Backstop for a subclass that reintroduces a render path.
	 *
	 * @param string $slug       Block slug. Unused.
	 * @param array  $attributes Block attributes. Unused.
	 */
	protected function enqueue_frontend_assets( string $slug, array $attributes ) {
	}
}
