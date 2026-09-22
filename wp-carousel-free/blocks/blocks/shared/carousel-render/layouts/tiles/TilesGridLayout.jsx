/**
 * Tiles / Grid layout for the editor preview — no Swiper. Picks the render
 * engine and stamps the spans both engines share.
 *
 *   • `BinpackTilesGrid` — image-source bento (absolute-positioned bin-pack).
 *   • `PresetTilesGrid`  — CSS Grid for the uniform layout and query-driven
 *     bento sources.
 *
 * Spans are stamped from the preset table on every render; nothing persists
 * them. Frontend mirror: `TilesRenderer::render_tiles_main()`.
 */

import { stampPreset, TILE_LAYOUT_PRESETS } from '../../../utils/tileSpans';
import { isBentoTileLayout } from '../../../utils/tilePresets';
import { resolveTileLayout } from '../../../constants/freeValues';
import BinpackTilesGrid from './BinpackTilesGrid';
import PresetTilesGrid from './PresetTilesGrid';

/**
 * @param {Object}   props
 * @param {object[]} props.items
 * @param {Object}   props.attributes
 * @param {boolean}  props.isEditor
 * @param {Function} [props.onItemEdit]
 * @param {string}   props.activeDevice
 * @param {string}   props.orientationClass
 * @param {number}   props.activeColumns    Columns for the active device.
 * @param {Object}   props.containerRef     Grid root ref (owned by CarouselRender for lightbox roots).
 * @param {Object}   [props.socialIcons]    Parent-owned social icon lookup.
 * @return {JSX.Element} The tiles grid for the active engine.
 */
export default function TilesGridLayout(props) {
	const { items, attributes } = props;
	const { layoutOptions = {}, sourceType = 'image' } = attributes;

	const tileLayout = resolveTileLayout(layoutOptions.tileLayout);
	const isBento = isBentoTileLayout(tileLayout);
	const tileSpans = stampPreset(
		items.length,
		tileLayout,
		TILE_LAYOUT_PRESETS,
		layoutOptions.columns ?? 3
	);

	// Image-source bento packs to pixels; query-driven sources keep CSS Grid,
	// where the item count isn't known until the server runs the query.
	if (isBento && 'image' === sourceType) {
		return <BinpackTilesGrid {...props} tileSpans={tileSpans} tileLayout={tileLayout} />;
	}

	return (
		<PresetTilesGrid {...props} tileSpans={tileSpans} tileLayout={tileLayout} isBento={isBento} />
	);
}
