/**
 * Tiles CSS-Grid layout — the uniform grid and query-driven bento sources.
 *
 * Columns, gaps and row height come from `layoutOptions`; a bento preset pins
 * its tiles onto a fixed 12-column grid instead. Image-source bento goes
 * through `BinpackTilesGrid`. The frontend mirror is
 * `TilesRenderer::render_tiles_main()` plus the `Styles/Concerns/TilesCss` grid
 * rules, so keep the three in step.
 */

import classNames from 'classnames';
import CarouselItem from '../../CarouselItem';
import { gapCssValue } from '../../gapImageUtils';
import { TILE_BENTO_COLUMNS, usesAutoRowHeight } from '../../../utils/tilePresets';

/**
 * @param {Object}   props
 * @param {object[]} props.items
 * @param {Object}   props.attributes
 * @param {Object[]} props.tileSpans        Preset-stamped spans, one per item.
 * @param {string}   props.tileLayout       Active layout-style key.
 * @param {boolean}  props.isBento          Whether the layout pins onto the 12-track grid.
 * @param {boolean}  props.isEditor
 * @param {Function} [props.onItemEdit]
 * @param {string}   props.activeDevice
 * @param {string}   props.orientationClass
 * @param {number}   props.activeColumns    Columns for the active device.
 * @param {Object}   props.containerRef     Grid root ref (owned by CarouselRender for lightbox roots).
 * @param {Object}   [props.socialIcons]    Parent-owned social icon lookup.
 */
export default function PresetTilesGrid({
	items,
	attributes,
	tileSpans,
	tileLayout,
	isBento,
	isEditor,
	onItemEdit,
	activeDevice,
	orientationClass,
	activeColumns,
	containerRef,
	socialIcons,
}) {
	const { layoutOptions = {} } = attributes;

	const perDevice = (desktop, tablet, mobile, fallback) =>
		({
			Desktop: layoutOptions[desktop] ?? fallback,
			Tablet: layoutOptions[tablet] ?? fallback,
			Mobile: layoutOptions[mobile] ?? fallback,
		})[activeDevice] ?? fallback;

	const perDeviceUnit = (desktop, tablet, mobile) =>
		String(
			{
				Desktop: layoutOptions[desktop],
				Tablet: layoutOptions[tablet],
				Mobile: layoutOptions[mobile],
			}[activeDevice] || 'px'
		).toLowerCase();

	const colGapCss = gapCssValue(
		perDevice('gapHorizontal', 'gapHorizontalTablet', 'gapHorizontalMobile', 20),
		perDeviceUnit('gapHorizontalUnit', 'gapHorizontalTabletUnit', 'gapHorizontalMobileUnit')
	);
	const rowGapCss = gapCssValue(
		perDevice('gapVertical', 'gapVerticalTablet', 'gapVerticalMobile', 20),
		perDeviceUnit('gapVerticalUnit', 'gapVerticalTabletUnit', 'gapVerticalMobileUnit')
	);
	const rowHeightCss = gapCssValue(
		perDevice('tileRowHeight', 'tileRowHeightTablet', 'tileRowHeightMobile', 220),
		perDeviceUnit('tileRowHeightUnit', 'tileRowHeightTabletUnit', 'tileRowHeightMobileUnit')
	);

	const containerStyle = {
		display: 'grid',
		gridAutoFlow: 'dense',
		// Auto-row presets emit no row-height token, matching the `tile-row-height`
		// gate in style-config; a fixed-row preset must not be overridden to `auto`
		// here or the canvas stops matching the frontend.
		gridAutoRows: usesAutoRowHeight(tileLayout) ? 'auto' : rowHeightCss,
		gridTemplateColumns: isBento
			? `repeat(${TILE_BENTO_COLUMNS}, 1fr)`
			: `repeat(${activeColumns}, 1fr)`,
		columnGap: colGapCss,
		rowGap: rowGapCss,
		'--wpcp-tile-col-gap': colGapCss,
		'--wpcp-tile-row-gap': rowGapCss,
		'--wpcp-tile-row-height': rowHeightCss,
	};

	// Only a bento preset pins its tiles. The uniform layout flows on
	// `repeat(columns, 1fr)`, so stamping its 12-track spans here would make
	// every tile span more tracks than the grid has.
	const tileStyle = (index) => {
		const span = isBento ? tileSpans[index] : null;
		if (!span) {
			return undefined;
		}
		return {
			'--tile-col-span': span.colSpan,
			'--tile-row-span': span.rowSpan,
			gridColumn: span.gridColumn || `span ${span.colSpan}`,
			gridRow: span.gridRow || `span ${span.rowSpan}`,
		};
	};

	return (
		<div
			ref={containerRef}
			className={classNames('wpcp-tiles-grid', isBento && 'wpcp-tiles-grid--bento', orientationClass)}
			style={containerStyle}
			data-tile-layout={tileLayout}
		>
			{items.map((item, i) => (
				<div
					key={item.id || i}
					className={classNames('wpcp-item', 'swiper-slide', isBento && 'wpcp-tiles-tile')}
					style={tileStyle(i)}
					data-tile-index={i}
					data-filter={
						Array.isArray(item?.filterIds) && item.filterIds.length ? item.filterIds.join(' ') : undefined
					}
				>
					<CarouselItem
						item={item}
						attributes={attributes}
						itemIndex={i}
						isEditor={isEditor}
						onItemEdit={onItemEdit}
						socialIcons={socialIcons}
					/>
				</div>
			))}
		</div>
	);
}
