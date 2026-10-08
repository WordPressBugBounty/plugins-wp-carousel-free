<?php
/**
 * AI Block Router
 *
 * Picks the block an attribute-generation request should be built on when the
 * caller only supplied a default.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

use ShapedPlugin\WPCarouselFree\Blocks\BlockTypesController;
use ShapedPlugin\WPCarouselFree\Blocks\BlockVisibility;

defined( 'ABSPATH' ) || exit;

/**
 * AIBlockRouter class.
 *
 * Attribute generation is per-block — catalog, enums and schema — so a prompt
 * that names a block of its own ("thumbnails", "tiles grid") is built on that
 * block rather than on whichever one the editor opened with. Only decisive
 * words count: "carousel" and "slider" describe the container, and a prompt
 * naming two blocks equally names neither.
 */
class AIBlockRouter {

	/**
	 * Resolve the block a prompt is asking for.
	 *
	 * @param string $prompt          Natural language prompt.
	 * @param string $requested_block Block the request arrived with, prefixed or bare.
	 * @return string Fully-qualified block name — the requested one unless the
	 *                prompt decisively names another.
	 */
	public static function resolve( string $prompt, string $requested_block ): string {
		$candidates = self::candidates();
		$terms      = AIPatternMatcher::prompt_terms( $prompt );
		$floor      = AIPatternMatcher::generic_term_weight();

		$best       = '';
		$best_score = 0.0;
		$tied       = false;

		foreach ( $candidates as $slug ) {
			// A block scores only through its own slug: the alias rows in
			// `AIPatternMatcher::TERM_ALIASES` are keyed by it, so "panoramic",
			// "ticker" or "film strip" already resolve to one without a second
			// keyword table to keep in step with them.
			$score = isset( $terms[ $slug ] ) ? (float) $terms[ $slug ] : 0.0;
			if ( $score <= $floor ) {
				continue;
			}

			if ( $score > $best_score ) {
				$best       = $slug;
				$best_score = $score;
				$tied       = false;
				continue;
			}

			if ( $score === $best_score ) {
				$tied = true;
			}
		}

		if ( '' === $best || $tied ) {
			return $requested_block;
		}

		return BlockTypesController::NAMESPACE_PREFIX . '/' . $best;
	}

	/**
	 * Blocks attribute generation may be routed to: a block with a front-end
	 * renderer (`AICatalogBuilder::SCHEMA_MAP`) that this site has switched on.
	 *
	 * @return string[] Block slugs, without the namespace prefix.
	 */
	public static function candidates(): array {
		$slugs = array();

		foreach ( array_keys( AICatalogBuilder::SCHEMA_MAP ) as $slug ) {
			if ( BlockVisibility::is_enabled( $slug ) ) {
				$slugs[] = $slug;
			}
		}

		return $slugs;
	}
}
