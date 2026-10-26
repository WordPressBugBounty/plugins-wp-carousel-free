<?php
/**
 * Base class for a Pro block's Free teaser.
 *
 * A teaser exists so the block appears in the inserter and can explain itself.
 * It registers the editor bundle and nothing else: no render callback, no view
 * script and no stylesheet. Its JS `save` returns null, so a post holding only
 * a teaser serialises to nothing and enqueues no block CSS or JS on the front end.
 *
 * A layout teaser also declares the top-level attribute names Pro saves, as
 * bare types with no defaults, so a block saved in Pro keeps its settings when
 * the post is re-saved in Free. Nothing reads them.
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
	 * Whether to preserve the attributes a Pro layout block saves.
	 *
	 * @var bool
	 */
	protected $preserve_layout_attributes = false;

	/**
	 * Top-level attributes a Pro layout block saves, as name => type.
	 */
	private const LAYOUT_ATTRIBUTE_TYPES = array(
		'uniqueId'              => 'string',
		'blockName'             => 'string',
		'align'                 => 'string',
		'sourceType'            => 'string',
		'patternDemo'           => 'boolean',
		'items'                 => 'array',
		'externalFeed'          => 'object',
		'layoutOptions'         => 'object',
		'sliderOptions'         => 'object',
		'queryOptions'          => 'object',
		'imageOptions'          => 'object',
		'clickActionOptions'    => 'object',
		'lightboxOptions'       => 'object',
		'contentOptions'        => 'object',
		'contentAreaOptions'    => 'object',
		'ratingOptions'         => 'object',
		'taxonomyOptions'       => 'object',
		'postContentOptions'    => 'object',
		'productContentOptions' => 'object',
		'metaOptions'           => 'object',
		'socialShareOptions'    => 'object',
		'effectsOptions'        => 'object',
		'entranceAnimation'     => 'object',
		'motionDevices'         => 'array',
		'advancedOptions'       => 'object',
		'scheduling'            => 'object', // isolation-ignore — preserved, never read.
		'filterItems'           => 'array',
		'videoOptions'          => 'object',
		'audioOptions'          => 'object',
		'paginationOptions'     => 'object',
	);

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

		$args = array(
			'editor_script' => 'wpcpf-blocks-editor',
			'editor_style'  => 'wpcpf-blocks-editor',
		);

		if ( $this->preserve_layout_attributes ) {
			$args['attributes'] = array_map(
				static function ( $type ) {
					return array( 'type' => $type );
				},
				self::LAYOUT_ATTRIBUTE_TYPES
			);
		}

		register_block_type_from_metadata( $metadata_path, $args );
	}
}
