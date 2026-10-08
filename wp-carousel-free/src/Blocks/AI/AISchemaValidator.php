<?php
/**
 * AI Schema Validator
 *
 * Sanitizes and merges AI-generated block attributes against PHP attribute schemas.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\DeepMerge;

defined( 'ABSPATH' ) || exit;

/**
 * AISchemaValidator class.
 */
class AISchemaValidator {

	/**
	 * Sanitize and merge raw AI generated attributes.
	 *
	 * Layered defaults -> existing attributes -> AI's output, in that order, so a
	 * refinement request only overwrites what the AI actually decided to change.
	 * The AI's catalog never mentions `align`, colors, typography, or items — a
	 * merge onto bare schema defaults would silently reset every one of those
	 * back to default on every refine, not just the setting the prompt asked for.
	 *
	 * @param array  $ai_attributes Raw parsed JSON attributes from AI.
	 * @param string $block_name Target block type slug.
	 * @param string $prompt Original user prompt, used to pick a topic-matched demo image set.
	 * @param array  $existing_attributes Block's current attributes when refining an existing block.
	 * @return array Sanitized attributes object ready for setAttributes().
	 */
	public static function sanitize_and_merge( array $ai_attributes, string $block_name = 'wp-carousel-pro/carousel', string $prompt = '', array $existing_attributes = array() ): array {
		$schema_class = AICatalogBuilder::schema_class_for_block( $block_name );
		$schema       = new $schema_class();
		$raw_defaults = $schema->get_attributes();

		// Convert attribute definitions format (type, default) to raw default value map.
		$defaults = array();
		foreach ( $raw_defaults as $key => $def ) {
			if ( is_array( $def ) && array_key_exists( 'default', $def ) ) {
				$defaults[ $key ] = $def['default'];
			}
		}

		$valid_keys = array_keys( $defaults );

		// Layer the block's current attributes over the schema defaults first, so
		// anything the AI doesn't mention keeps what the block already had.
		$existing = array_intersect_key( $existing_attributes, array_flip( $valid_keys ) );
		$base     = DeepMerge::recursive( $defaults, $existing );

		// Filter AI keys to only valid schema keys, drop or clamp every leaf the
		// block cannot actually use, then merge what survives on top of that base.
		// A rejected leaf leaves the merge alone, so the block keeps its schema
		// default (or, on a refine, the value it already had).
		// Only the groups the catalog offers: a model-emitted `items` or `queryOptions`
		// would otherwise replace the author's own content on a refine.
		$catalog_keys = array_intersect( $valid_keys, AICatalogBuilder::catalog_relevant_keys_for_block( $block_name ) );
		$filtered     = array_intersect_key( $ai_attributes, array_flip( $catalog_keys ) );
		$filtered     = AIValueValidator::validate( $filtered, $block_name );
		$merged       = DeepMerge::recursive( $base, $filtered );

		// If sourceType is image/media and items is empty, populate demo items for instant live preview.
		$source_type = isset( $merged['sourceType'] ) ? (string) $merged['sourceType'] : 'image';
		if ( array_key_exists( 'items', $defaults ) && ( 'image' === $source_type || empty( $source_type ) ) && empty( $merged['items'] ) ) {
			$merged['sourceType']  = 'image';
			$merged['patternDemo'] = true;
			$merged['items']       = AIDemoImageLibrary::get_items( $prompt );
		}

		$merged['blockName'] = AICatalogBuilder::slug( $block_name );

		// Same projection the renderer runs, so the editor never holds a Pro value.
		return AllowedValues::project( $merged );
	}
}
