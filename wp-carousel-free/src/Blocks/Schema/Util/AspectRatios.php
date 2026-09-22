<?php
/**
 * Canonical aspect-ratio option values shared by Image and Video panels.
 *
 * Mirrors `blocks/blocks/shared/constants/aspectRatios.js`. Panels MAY filter
 * which members appear but MUST NOT fork a separate value list.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema\Util;

defined( 'ABSPATH' ) || exit;

/**
 * AspectRatios — value constants only (labels live in the JS inspector).
 */
final class AspectRatios {

	/**
	 * Full canonical list (Image panel default).
	 *
	 * @var string[]
	 */
	public const ALL = array(
		'original',
		'1:1',
		'4:3',
		'3:4',
		'16:9',
		'9:16',
		'3:2',
		'2:3',
		'21:9',
		'custom',
	);

	/**
	 * Video panel subset (same source values as ALL, filtered).
	 *
	 * @var string[]
	 */
	public const VIDEO = array(
		'original',
		'16:9',
		'4:3',
		'1:1',
		'9:16',
		'custom',
	);
}
