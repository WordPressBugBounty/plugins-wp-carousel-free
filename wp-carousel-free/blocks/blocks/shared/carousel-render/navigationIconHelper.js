/**
 * Arrow icon lookup helper for navigation blocks.
 * Maps arrowStyle option values to SVG icon components.
 */

import {
	ChevronSolid,
	ChevronOutline,
	ChevronBold,
	DoubleChevron,
	ArrowSolid,
	ArrowOutline,
	ArrowMinimal,
	ChevronBorderLine,
	DoubleChevronOutline,
	TriangleOutline,
	ArrowLine,
	ArrowSend,
} from '@wp-carousel-pro/icons/arrowIcons';

/**
 * Map arrowStyle option values to icon components.
 */
const ARROW_ICON_MAP = {
	'chevron-solid': ChevronSolid,
	'chevron-outline': ChevronOutline,
	'chevron-bold': ChevronBold,
	'double-chevron': DoubleChevron,
	'arrow-solid': ArrowSolid,
	'arrow-outline': ArrowOutline,
	'arrow-minimal': ArrowMinimal,
	'chevron-border-line': ChevronBorderLine,
	'double-chevron-outline': DoubleChevronOutline,
	'triangle-outline': TriangleOutline,
	'arrow-line': ArrowLine,
	'arrow-send': ArrowSend,
};

/**
 * Get the arrow icon component for a given arrow style.
 *
 * @param {string} arrowStyle - The arrow style option value.
 * @return {React.Component|null} The arrow icon component or null if not found.
 */
export function getArrowIcon(arrowStyle) {
	return ARROW_ICON_MAP[arrowStyle] || ARROW_ICON_MAP['chevron-solid'];
}

/**
 * Get all available arrow icon options for UI controls.
 * Re-exported from @wp-carousel-pro/icons/arrowIcons for convenience.
 */
export { ARROW_ICON_OPTIONS } from '@wp-carousel-pro/icons/arrowIcons';
