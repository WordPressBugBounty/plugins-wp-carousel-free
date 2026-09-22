/**
 * Image-source bento tiles rendered via the bin-pack engine.
 *
 * Spans come from the preset table on every render — there is no saved
 * `tileSpans` attribute and no drag-resize authoring here, so this is a pure
 * render surface. Query-driven sources keep the CSS-Grid bento path
 * (`PresetTilesGrid`). Parity side B is `TilesRenderer::render_tiles_binpack`.
 */

import { useRef, useState, useLayoutEffect, useMemo } from '@wordpress/element';
import classNames from 'classnames';
import CarouselItem from '../../CarouselItem';
import { gapToPx } from '../../gapImageUtils';
import {
	binPackTiles,
	rescaleSpansForBreakpoint,
	TILE_BINPACK_FALLBACK_WIDTH_PX,
} from '../../../utils/tileSpans';

/** Both the presets and the packer are defined against a fixed 12-track grid. */
const TILE_GRID_COLUMNS = 12;

/**
 * @param {Object}   props
 * @param {object[]} props.items
 * @param {Object}   props.attributes
 * @param {Object[]} props.tileSpans        Preset-stamped spans, one per item.
 * @param {string}   props.tileLayout       Active layout-style key.
 * @param {boolean}  props.isEditor
 * @param {Function} [props.onItemEdit]
 * @param {string}   props.activeDevice
 * @param {string}   props.orientationClass
 * @param {Object}   props.containerRef     Grid root ref (owned by CarouselRender for lightbox roots).
 * @param {Object}   [props.socialIcons]
 * @return {JSX.Element} Absolutely-positioned bin-packed tiles.
 */
export default function BinpackTilesGrid({
	items,
	attributes,
	tileSpans,
	tileLayout,
	isEditor,
	onItemEdit,
	activeDevice,
	orientationClass,
	containerRef,
	socialIcons,
}) {
	const { layoutOptions = {}, sourceType = 'image' } = attributes;
	const localRef = useRef(null);
	const rootRef = containerRef || localRef;
	const [containerWidth, setContainerWidth] = useState(0);

	// The pack derives unit_px from the container width, so it needs a fresh
	// value on every size change (sidebar collapse, device preview toggle).
	useLayoutEffect(() => {
		const el = rootRef.current;
		if (!el) {
			return undefined;
		}
		const measure = () => {
			const rect = el.getBoundingClientRect();
			if (Number.isFinite(rect.width) && rect.width > 0) {
				setContainerWidth((prev) => (prev === rect.width ? prev : rect.width));
			}
		};
		measure();
		const resizeObserver = new ResizeObserver(measure);
		resizeObserver.observe(el);
		return () => resizeObserver.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items.length]);

	// Tablet / mobile collapse through the same proportional rescale the
	// frontend bootstrap runs, which also drops pins so the narrower devices
	// auto-flow instead of holding 12-track preset positions.
	const columnsTablet = Math.max(1, Math.min(12, Number(layoutOptions.columnsTablet) || 2));
	const columnsMobile = Math.max(1, Math.min(12, Number(layoutOptions.columnsMobile) || 1));
	let columnsForActiveDevice = TILE_GRID_COLUMNS;
	if (activeDevice === 'Mobile') {
		columnsForActiveDevice = columnsMobile;
	} else if (activeDevice === 'Tablet') {
		columnsForActiveDevice = columnsTablet;
	}

	const gapH =
		Number(
			gapToPx(layoutOptions.gapHorizontal ?? 20, layoutOptions.gapHorizontalUnit, rootRef.current)
		) || 0;
	const gapV =
		Number(
			gapToPx(layoutOptions.gapVertical ?? 20, layoutOptions.gapVerticalUnit, rootRef.current)
		) || 0;
	const rowHeightPx = gapToPx(
		layoutOptions.tileRowHeight ?? 220,
		layoutOptions.tileRowHeightUnit,
		rootRef.current
	);

	const effectiveSpans =
		activeDevice !== 'Desktop'
			? rescaleSpansForBreakpoint(tileSpans, TILE_GRID_COLUMNS, columnsForActiveDevice)
			: tileSpans;

	// Before the first measurement lands, pack against the assumed desktop
	// width so the layout is usable; the mount-time ResizeObserver callback
	// corrects it immediately.
	const containerWidthForPack = containerWidth > 0 ? containerWidth : TILE_BINPACK_FALLBACK_WIDTH_PX;

	// Packing is O(n·grid) plus a per-entry sweep — without the memo it re-runs
	// on every keystroke or selection change that re-renders this subtree.
	const { positions, containerHeight, unitPx } = useMemo(
		() =>
			binPackTiles({
				items,
				tileSpans: effectiveSpans,
				columns: columnsForActiveDevice,
				gapHorizontal: gapH,
				gapVertical: gapV,
				containerWidth: containerWidthForPack,
				rowHeight: rowHeightPx,
			}),
		[items, effectiveSpans, columnsForActiveDevice, gapH, gapV, containerWidthForPack, rowHeightPx]
	);

	return (
		<div
			ref={rootRef}
			className={classNames('wpcp-tiles-grid', 'wpcp-tiles-grid--binpack', orientationClass)}
			data-tile-layout={tileLayout}
			data-source-type={sourceType}
			style={{
				position: 'relative',
				height: containerHeight > 0 ? `${Math.ceil(containerHeight)}px` : 'auto',
				'--wpcp-tile-grid-columns': TILE_GRID_COLUMNS,
				'--wpcp-tile-col-gap': `${gapH}px`,
				'--wpcp-tile-row-gap': `${gapV}px`,
			}}
		>
			{items.map((item, i) => {
				const pos = positions[i] || {
					leftPx: 0,
					topPx: 0,
					widthPx: unitPx,
					heightPx: unitPx,
				};
				const span = effectiveSpans[i] || { colSpan: 1, rowSpan: 1 };
				return (
					<div
						key={item.id || i}
						className="wpcp-item wpcp-tiles-tile"
						style={{
							position: 'absolute',
							left: `${Math.round(pos.leftPx)}px`,
							top: `${Math.round(pos.topPx)}px`,
							width: `${Math.round(pos.widthPx)}px`,
							height: `${Math.round(pos.heightPx)}px`,
						}}
						data-tile-index={i}
						data-col-span={span.colSpan}
						data-row-span={span.rowSpan}
						data-pin-col={typeof span.gridColumn === 'string' ? span.gridColumn : undefined}
						data-pin-row={typeof span.gridRow === 'string' ? span.gridRow : undefined}
						data-filter={
							Array.isArray(item?.filterIds) && item.filterIds.length
								? item.filterIds.join(' ')
								: undefined
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
				);
			})}
		</div>
	);
}
