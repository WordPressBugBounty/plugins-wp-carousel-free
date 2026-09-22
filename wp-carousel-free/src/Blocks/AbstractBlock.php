<?php
/**
 * Base PHP block registration class.
 *
 * Each concrete block class extends this and sets $block_name. The class:
 * - Locates the block metadata folder (block.json).
 * - Registers the block via register_block_type_from_metadata().
 * - Renders via BlockRenderer only; all data comes from block attributes (no shortcode).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeProjector;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Sources\SourceRegistry;
use ShapedPlugin\WPCarouselFree\Blocks\AssetManager;

defined( 'ABSPATH' ) || exit;

/**
 * AbstractBlock class.
 *
 * @since 4.2.4
 */
abstract class AbstractBlock {

	/**
	 * Block namespace (for block.json "name").
	 *
	 * @var string
	 */
	protected $namespace = 'wp-carousel-pro';

	/**
	 * Block name (slug) without namespace, e.g. "carousel".
	 *
	 * @var string
	 */
	protected $block_name = '';

	/**
	 * Render callback callable.
	 *
	 * @var callable|null
	 */
	protected $render_callback;

	/**
	 * Constructor.
	 *
	 * @param callable|null $render_callback Optional shared render callback.
	 */
	public function __construct( $render_callback = null ) {
		$this->render_callback = $render_callback;
		$this->initialize();
	}

	/**
	 * Initialize and register the block.
	 */
	protected function initialize() {
		if ( empty( $this->block_name ) ) {
			return;
		}

		if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
			return;
		}

		$this->register_block_type();
	}

	/**
	 * Register the block with WordPress using metadata.
	 */
	protected function register_block_type() {
		$metadata_path = $this->get_block_metadata_path();

		if ( ! $metadata_path || ! file_exists( $metadata_path . '/block.json' ) ) {
			return;
		}

		$args = array(
			'editor_script'   => $this->get_editor_script_handle(),
			'editor_style'    => $this->get_editor_style_handle(),
			'view_script'     => $this->get_view_script_handle(),
			'render_callback' => $this->render_callback ? $this->render_callback : array( $this, 'render' ),
		);

		$schema = $this->get_schema();
		if ( $schema instanceof AttributeSchema ) {
			$args['attributes'] = $schema->get_attributes();
		}

		register_block_type_from_metadata( $metadata_path, $args );
	}

	/**
	 * Per-block attribute schema. Subclasses override to supply their schema;
	 * default returns null to fall back to block.json's attributes.
	 *
	 * @return AttributeSchema|null
	 */
	protected function get_schema(): ?AttributeSchema {
		return null;
	}

	/**
	 * Path to folder that contains block.json for this block.
	 * Uses the directory of the extending class so block.json lives next to the PHP file.
	 *
	 * @return string
	 */
	protected function get_block_metadata_path() {
		$class_file = ( new \ReflectionClass( $this ) )->getFileName();
		return $class_file ? dirname( $class_file ) : '';
	}

	/**
	 * Shared editor script handle.
	 *
	 * @return string
	 */
	protected function get_editor_script_handle() {
		return 'wpcpf-blocks-editor';
	}

	/**
	 * Shared editor style handle.
	 *
	 * @return string
	 */
	protected function get_editor_style_handle() {
		return 'wpcpf-blocks-editor';
	}
	/**
	 * Shared frontend script handle.
	 *
	 * @return string
	 */
	protected function get_view_script_handle() {
		return 'wpcpf-blocks-frontend';
	}

	/**
	 * Block render callback – generates the frontend HTML for this block.
	 *
	 * All output is attribute-driven via BlockRenderer; no shortcode is used.
	 *
	 * @param array     $attributes Block attributes from block.json.
	 * @param string    $content    Inner block content (unused).
	 * @param \WP_Block $block      WP_Block instance.
	 * @return string HTML output.
	 */
	public function render( $attributes, $content, $block ) {
		$attributes = (array) $attributes;

		// `blockName` is what selects the block-aware fallback in every
		// AllowedValues branch, so seed it from the class before projecting —
		// projecting first would resolve them against the schema default.
		$attributes['blockName'] = $this->block_name ? $this->block_name : 'carousel';

		$attributes = $this->project_attributes( $attributes );

		/*
		 * Capture any stray PHP output (notices, warnings) so it never
		 * leaks into the frontend HTML. Always safe to discard.
		 */
		ob_start();

		try {
			$output = $this->do_render( $attributes, $block );
		} catch ( \Throwable $e ) {
			$output = '';
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Debug-only render diagnostics.
				error_log(
					sprintf(
						'WP Carousel render error in block "%1$s": [%2$s] %3$s',
						$this->block_name,
						get_class( $e ),
						$e->getMessage()
					)
				);
			}
		}

		ob_end_clean();

		return $output;
	}

	/**
	 * Drop every attribute this block's schema does not declare.
	 *
	 * Core's `prepare_attributes_for_render()` validates the keys a block type
	 * declares and fills in missing defaults, but it leaves an undeclared key
	 * untouched — so an omitted Pro attribute reaches the render callback
	 * verbatim from the block comment. This is the projection that makes
	 * omission enforcement, and it mirrors what every custom REST route already
	 * does with the same projector.
	 *
	 * @param array $attributes Attributes as core handed them over.
	 * @return array Only the keys the schema declares.
	 */
	protected function project_attributes( array $attributes ): array {
		$schema = $this->get_schema();

		if ( ! $schema instanceof AttributeSchema ) {
			return $attributes;
		}

		return AttributeProjector::apply( $attributes, $schema );
	}

	/**
	 * Frontend-only setup shared by every block, including subclasses that
	 * override do_render. Returns a string to short-circuit render, or null to
	 * continue.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $slug       Block slug without namespace.
	 * @return string|null
	 */
	protected function frontend_render_gate( array $attributes, string $slug ) {
		if ( is_admin() ) {
			return null;
		}

		// Switched off on the dashboard's Blocks page — no markup and no assets.
		// The inserter is gated separately, client-side (blocks/blocks/index.js).
		if ( ! BlockVisibility::is_enabled( $slug ) ) {
			return '';
		}

		$this->enqueue_frontend_assets( $slug, $attributes );

		return null;
	}

	/**
	 * Internal render – called inside a clean output buffer.
	 *
	 * @param array     $attributes block attributes.
	 * @param \WP_Block $block block.
	 * @return string
	 */
	protected function do_render( $attributes, $block ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Overridable signature; subclasses use $block.
		$slug = $this->block_name ? $this->block_name : 'carousel';

		$gated = $this->frontend_render_gate( is_array( $attributes ) ? $attributes : array(), $slug );
		if ( null !== $gated ) {
			return $gated;
		}

		$source_type = isset( $attributes['sourceType'] ) ? (string) $attributes['sourceType'] : '';
		if ( '' === $source_type ) {
			$source_type = 'image';
		}
		$attributes['sourceType'] = $source_type;

		// Expose the block slug so source classes can branch on it (e.g. Tiles
		// AJAX pagination treats `limit` as posts-per-page).
		$attributes['blockName'] = $slug;

		$items = $this->get_source_items( $source_type, $attributes );

		$renderer = new BlockRenderer( $attributes, $slug );
		return $renderer->render( $items );
	}

	/**
	 * Enqueue the frontend assets for this block.
	 *
	 * Enqueues the Swiper-backed shared bundle.
	 *
	 * Overridable so a block can load a different bundle.
	 *
	 * @param string $slug       Block slug.
	 * @param array  $attributes Block attributes.
	 */
	protected function enqueue_frontend_assets( string $slug, array $attributes ) {
		$assets = AssetManager::instance();

		$assets->enqueue_block_frontend_assets();

		// Render-time backstop for the conditionally-built style chunks: the
		// wp_enqueue_scripts scan cannot see widgets or late the_content renders,
		// which get the chunk <link> printed in the footer instead.
		$assets->enqueue_block_style_chunks(
			AssetManager::style_chunks_for_block( BlockTypesController::NAMESPACE_PREFIX . '/' . $slug, $attributes )
		);
	}

	/**
	 * Resolve items from the appropriate source class.
	 *
	 * @param string $source_type  'image' | 'post' | 'product' | … .
	 * @param array  $attributes   Full block attributes.
	 * @return array Normalised item list.
	 */
	protected function get_source_items( string $source_type, array $attributes ): array {
		return SourceRegistry::for( $source_type )->get_items( $attributes );
	}
}
