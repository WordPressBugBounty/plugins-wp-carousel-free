/**
 * Tiles block dynamic-CSS generators.
 *
 * Mirrors the tiles branch of CarouselDynamicCss.php (the TilesCss trait). Split
 * out of the carouselDynamicCss monolith; the editor composes these through the
 * default `dynamicCss` export exactly as before. Keep rule-for-rule parity with the
 * PHP side — the tests/css-parity harness gates it.
 */

import {
	TILES_COLLAPSE_TABLET_BREAKPOINT,
	TILES_COLLAPSE_MOBILE_BREAKPOINT,
	DEVICES,
} from './constants';
import { isBentoTileLayout, TILE_BENTO_COLUMNS } from '../utils/tilePresets';
import { resolveTileLayout } from '../constants/freeValues';

/** @typedef {'Desktop'|'Tablet'|'Mobile'} DeviceType */

/**
 * Whether the block is the tiles layout (gates generateTiles*).
 *
 * @param {Object} attributes - Block attributes.
 * @return {boolean} True when blockName matches.
 */
const isTilesBlockAttributes = (attributes = {}) => {
	const name = String(attributes?.blockName || '').toLowerCase();
	return name === 'tiles' || name === 'wp-carousel-pro/tiles';
};

/**
 * Resolve per-device tiles grid settings from layoutOptions.
 *
 * @param {Object}     layoutOptions - Block layoutOptions.
 * @param {DeviceType} device        - Target device.
 * @return {Object} Resolved grid settings for the device.
 */
const getTilesModeSettings = (layoutOptions = {}, device = DEVICES.DESKTOP) => {
	// A bento preset pins its tiles against a fixed 12-column grid, so the
	// Columns control drives the uniform layout only.
	const isBentoMode = isBentoTileLayout(resolveTileLayout(layoutOptions.tileLayout));
	const pick = (desktopValue, tabletValue, mobileValue, fallback) => {
		if (device === DEVICES.MOBILE) {
			return mobileValue ?? tabletValue ?? desktopValue ?? fallback;
		}
		if (device === DEVICES.TABLET) {
			return tabletValue ?? desktopValue ?? fallback;
		}
		return desktopValue ?? fallback;
	};
	const columns = Number(
		pick(layoutOptions.columns, layoutOptions.columnsTablet, layoutOptions.columnsMobile, 3)
	);
	const safeColumns = Number.isFinite(columns) && columns > 0 ? columns : 3;

	// Gaps + row-height are tokenized (--wpcp-tile-* via tileGridDim; consumed by the
	// static `.wpcp-tiles-grid` rule). This builder keeps only the Layer-5 grid math:
	// the grid-template-columns choice (bento 12-col vs N columns) and the
	// structural display/auto-flow.
	return {
		isBentoMode,
		gridTemplateColumns: isBentoMode
			? `repeat(${TILE_BENTO_COLUMNS}, 1fr)`
			: `repeat(${safeColumns}, 1fr)`,
	};
};

/**
 * Base (desktop) tiles grid rules.
 *
 * @param {Record<string, string>} selectors  - Scoped selector map.
 * @param {Object}                 attributes - Block attributes.
 * @return {Array} CSS rule objects.
 */
export const generateTilesBaseStyles = (selectors, attributes = {}) => {
	if (!isTilesBlockAttributes(attributes)) {
		return [];
	}
	const s = getTilesModeSettings(attributes.layoutOptions || {}, DEVICES.DESKTOP);

	return [
		{
			class: selectors.tilesGrid,
			styles: {
				display: 'grid',
				gridAutoFlow: 'dense',
				gridTemplateColumns: s.gridTemplateColumns,
			},
		},
		{
			class: selectors.tilesTile,
			styles: {
				gridColumn: 'span var(--tile-col-span, 1)',
				gridRow: 'span var(--tile-row-span, 1)',
			},
		},
	];
};

/**
 * Per-device tiles grid responsive rules.
 *
 * @param {Record<string, string>} selectors  - Scoped selector map.
 * @param {Object}                 attributes - Block attributes.
 * @param {DeviceType}             device     - Target device.
 * @return {Array} CSS rule objects.
 */
export const generateTilesResponsiveStyles = (selectors, attributes = {}, device) => {
	if (!isTilesBlockAttributes(attributes)) {
		return [];
	}
	const s = getTilesModeSettings(attributes.layoutOptions || {}, device);

	return [
		{
			class: selectors.tilesGrid,
			styles: {
				gridTemplateColumns: s.gridTemplateColumns,
			},
		},
	];
};

/**
 * Tiles collapse media queries appended after tablet/mobile responsive CSS.
 *
 * @param {Object} attributes - Block attributes.
 * @return {string} Raw CSS string (empty when not a tiles block).
 */
export const generateTilesCollapseCss = (attributes = {}) => {
	if (!isTilesBlockAttributes(attributes)) {
		return '';
	}
	const uniqueId = attributes.uniqueId || '';
	const wrapper = `#${uniqueId}`;
	const tilesGrid = `${wrapper} .wpcp-tiles-grid`;
	const tilesTile = `${wrapper} .wpcp-tiles-tile`;

	return `@media only screen and (max-width: ${TILES_COLLAPSE_TABLET_BREAKPOINT}px){${tilesTile}{grid-column:auto !important;grid-row:auto !important;}}
@media only screen and (max-width: ${TILES_COLLAPSE_MOBILE_BREAKPOINT}px){${tilesGrid}{grid-template-columns:1fr !important;}${tilesTile}{grid-column:auto !important;grid-row:auto !important;}}`;
};
