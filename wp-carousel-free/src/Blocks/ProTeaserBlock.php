<?php
/**
 * Base class for a Pro block's Free teaser.
 *
 * A teaser exists so the block appears in the inserter and can explain itself.
 * It registers the editor bundle and nothing else: no attribute schema beyond
 * the identity keys in its own block.json, no render callback, no view script
 * and no stylesheet. Its JS `save` returns null, so a post holding only a
 * teaser serialises to nothing and enqueues no block CSS or JS on the front end.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

defined( 'ABSPATH' ) || exit;

/**
 * ProTeaserBlock class.
 */
abstract class ProTeaserBlock {

	/**
	 * Block name (slug) without namespace, e.g. "marquee".
	 *
	 * @var string
	 */
	protected $block_name = '';

	/**
	 * Register the teaser.
	 */
	public function __construct() {
		if ( empty( $this->block_name ) || ! function_exists( 'register_block_type_from_metadata' ) ) {
			return;
		}

		$metadata_path = dirname( ( new \ReflectionClass( $this ) )->getFileName() );

		if ( ! file_exists( $metadata_path . '/block.json' ) ) {
			return;
		}

		register_block_type_from_metadata(
			$metadata_path,
			array(
				'editor_script' => 'wpcpf-blocks-editor',
				'editor_style'  => 'wpcpf-blocks-editor',
			)
		);
	}
}
