<?php
/**
 * Shared responsive breakpoints for block dynamic CSS (PHP side).
 *
 * GENERATED FILE — do not edit. Regenerate with `npm run sync:style-config`
 * (source: blocks/blocks/shared/styles/constants.js). CI fails on a stale copy.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles;

defined( 'ABSPATH' ) || exit;

/**
 * Single source of truth (mirrored from constants.js) for the tablet/mobile
 * media-query breakpoints used by every PHP dynamic-CSS generator in this package.
 */
final class Breakpoints {

	/**
	 * Maximum viewport width (px, inclusive) treated as tablet.
	 * Used as `@media only screen and (max-width: 1023px)`.
	 */
	public const TABLET = 1023;

	/**
	 * Maximum viewport width (px, inclusive) treated as mobile.
	 * Used as `@media only screen and (max-width: 599px)`.
	 */
	public const MOBILE = 599;

	/**
	 * Maximum viewport width (px) at which a Tiles grid drops its per-tile
	 * column/row spans. Used as `@media only screen and (max-width: 768px)`.
	 */
	public const TILES_COLLAPSE_TABLET = 768;

	/**
	 * Maximum viewport width (px) at which a Tiles grid collapses to a single
	 * column. Used as `@media only screen and (max-width: 480px)`.
	 */
	public const TILES_COLLAPSE_MOBILE = 480;
}
