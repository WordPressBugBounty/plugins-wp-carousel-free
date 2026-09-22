<?php
/**
 * Content runs for the Classic (image-top) orientation.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

defined( 'ABSPATH' ) || exit;

/**
 * Splits a resolved Card Content slot order into media/content runs so the
 * Classic orientation can honor the position of the `image` slot: each stretch
 * of consecutive non-image slots becomes its own `.wpcp-item-content` wrapper,
 * with the `.wpcp-item-media` box a direct sibling between them.
 *
 * Mirrors blocks/blocks/shared/carousel-render/carouselItem/contentRuns.js —
 * keep both in sync (pinned by tests/php/content-runs.php and
 * tests/__tests__/card-content/contentRuns.spec.js).
 */
final class ContentRuns {

	/**
	 * Split a resolved slot order into media/content runs.
	 *
	 * Orders that do not contain `image` (legacy saves, sources whose sorter
	 * has no Image row) render the media first — the pre-runs layout.
	 *
	 * @param array $resolved_order   Resolved slot ids (may lack 'image').
	 * @param bool  $is_image_visible Whether the media/image slot renders at all.
	 * @return array[] Run entries: array( 'type' => 'media' ) or array( 'type' => 'content', 'slots' => array ).
	 */
	public static function split( array $resolved_order, bool $is_image_visible ): array {
		$content_slots = array_values(
			array_filter(
				$resolved_order,
				static function ( $slot_id ) {
					return 'image' !== $slot_id;
				}
			)
		);

		if ( ! $is_image_visible ) {
			return empty( $content_slots ) ? array() : array(
				array(
					'type'  => 'content',
					'slots' => $content_slots,
				),
			);
		}

		if ( ! in_array( 'image', $resolved_order, true ) ) {
			$runs = array( array( 'type' => 'media' ) );
			if ( ! empty( $content_slots ) ) {
				$runs[] = array(
					'type'  => 'content',
					'slots' => $content_slots,
				);
			}
			return $runs;
		}

		$runs              = array();
		$current_run_slots = array();
		$has_emitted_media = false;

		foreach ( $resolved_order as $slot_id ) {
			if ( 'image' === $slot_id ) {
				if ( ! $has_emitted_media ) {
					if ( ! empty( $current_run_slots ) ) {
						$runs              = self::push_content_run( $runs, $current_run_slots );
						$current_run_slots = array();
					}
					$runs[]            = array( 'type' => 'media' );
					$has_emitted_media = true;
				}
				continue;
			}
			$current_run_slots[] = $slot_id;
		}

		if ( ! empty( $current_run_slots ) ) {
			$runs = self::push_content_run( $runs, $current_run_slots );
		}

		return $runs;
	}

	/**
	 * Whether the run sequence needs DOM-order rendering (the
	 * `wpcp-content-runs` class that neutralizes the legacy flex `order`
	 * rules). Legacy shapes — media-first or a single run — keep the class
	 * off so default saves render byte-identical markup.
	 *
	 * @param array $content_runs split() output.
	 * @return bool True when the DOM sequence must win over flex order.
	 */
	public static function runs_require_dom_order( array $content_runs ): bool {
		return count( $content_runs ) >= 2 && 'media' !== $content_runs[0]['type'];
	}

	/**
	 * Append a content run entry.
	 *
	 * @param array $runs      Accumulated run entries.
	 * @param array $run_slots Slot ids for the run.
	 * @return array Updated run entries.
	 */
	private static function push_content_run( array $runs, array $run_slots ): array {
		$runs[] = array(
			'type'  => 'content',
			'slots' => $run_slots,
		);
		return $runs;
	}
}
