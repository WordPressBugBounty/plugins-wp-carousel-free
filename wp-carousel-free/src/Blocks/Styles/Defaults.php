<?php
/**
 * Shared default colors for block dynamic CSS (PHP side).
 *
 * GENERATED FILE — do not edit. Regenerate with `npm run sync:style-config`
 * (source: blocks/blocks/shared/styles/constants.js). CI fails on a stale copy.
 *
 * These are the colors the static stylesheet already applies, so the dynamic CSS
 * uses them as override sentinels (emit a rule only when the attribute differs)
 * and as fallbacks.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles;

defined( 'ABSPATH' ) || exit;

/**
 * Single source of truth (mirrored from constants.js) for the static-CSS default
 * colors referenced by the PHP dynamic-CSS generators.
 */
final class Defaults {

	/** Default item title color (static-CSS default). */
	public const TITLE_COLOR = '#2f2f2f';

	/** Default item description color (static-CSS default). */
	public const DESC_COLOR = '#757575';

	/** Default star-rating fill color (static-CSS default). */
	public const RATING_FILL_COLOR = '#FFD700';

	/** Default star-rating empty color (static-CSS default). */
	public const RATING_EMPTY_COLOR = '#E0E0E0';

	/** Default image-overlay color. */
	public const OVERLAY_COLOR = 'rgba(0,0,0,0.3)';
}
