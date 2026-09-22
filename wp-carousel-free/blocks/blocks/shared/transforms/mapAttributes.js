/**
 * Projects a donor block's attributes onto the target block's schema.
 */

import { getBlockType } from '@wordpress/blocks';
import { carouselStyleFallback } from '../constants/freeValues';
import { isSelectableCarouselStyle } from '../constants/carouselStyles';

const BLOCK_NAMESPACE = 'wp-carousel-pro/';

/** Responsive trios are spelled `X` / `XTablet` / `XMobile`. */
const RESPONSIVE_SUFFIXES = ['', 'Tablet', 'Mobile'];

function isPlainObject(value) {
	return !!value && 'object' === typeof value && !Array.isArray(value);
}

/**
 * Overlay a donor branch on the target's default branch.
 *
 * Only the default's own keys are walked — one level, not the whole tree.
 * `customImageWidth.device` declares Desktop alone and `elementVisibility`
 * declares two of its slots. Walking deeper would delete the Tablet and Mobile
 * values, and the slot toggles, that an author actually set.
 *
 * @param {*} defaultBranch Target schema default for the key.
 * @param {*} donorBranch   Donor value for the key.
 * @return {*} Value to write on the target.
 */
function overlayDeclaredKeys(defaultBranch, donorBranch) {
	if (!isPlainObject(defaultBranch) || 0 === Object.keys(defaultBranch).length) {
		return undefined === donorBranch ? defaultBranch : donorBranch;
	}

	if (!isPlainObject(donorBranch)) {
		return defaultBranch;
	}

	const merged = { ...defaultBranch };
	Object.keys(defaultBranch).forEach((key) => {
		if (undefined !== donorBranch[key]) {
			merged[key] = donorBranch[key];
		}
	});

	return merged;
}

function copyWhenMissing(options, fromKey, toKey) {
	if (undefined !== options[fromKey] && undefined === options[toKey]) {
		options[toKey] = options[fromKey];
	}
}

/**
 * Tiles splits the gap per axis (`gapHorizontal` / `gapVertical`); every other
 * block stores a single `gap`. Collapsing two axes into one keeps the
 * horizontal value, since that is the gap between slides.
 *
 * @param {Object} layoutOptions Donor layout options.
 * @return {Object} Layout options carrying both gap shapes.
 */
function bridgeGapShapes(layoutOptions) {
	const bridged = { ...layoutOptions };

	RESPONSIVE_SUFFIXES.forEach((suffix) => {
		const single = `gap${suffix}`;
		const horizontal = `gapHorizontal${suffix}`;
		const vertical = `gapVertical${suffix}`;

		if (undefined !== bridged[single]) {
			copyWhenMissing(bridged, single, horizontal);
			copyWhenMissing(bridged, single, vertical);
			copyWhenMissing(bridged, `${single}Unit`, `${horizontal}Unit`);
			copyWhenMissing(bridged, `${single}Unit`, `${vertical}Unit`);
			return;
		}

		copyWhenMissing(bridged, horizontal, single);
		copyWhenMissing(bridged, `${horizontal}Unit`, `${single}Unit`);
	});

	return bridged;
}

/**
 * The carousel style the target lands on.
 *
 * A style the target's picker does not offer would still reach the root class
 * and the conditional CSS chunks, so anything unselectable resets to the
 * target's own style — Tiles to `grid` and the Thumbnails Slider to
 * `thumbnails`, never to the carousel's `standard`.
 *
 * @param {*}      style      Donor `layoutOptions.carouselStyle`.
 * @param {string} targetSlug Target block slug.
 * @return {string} A style the target renders.
 */
function mapCarouselStyle(style, targetSlug) {
	return isSelectableCarouselStyle(targetSlug, style) ? style : carouselStyleFallback(targetSlug);
}

/**
 * `carouselStyle` is the only per-block value this has to resolve. Every other
 * one — `contentOrientation`, `sliderLayout`, the nav position — is resolved
 * per block by `useFreeLayoutGuard` when the target mounts. `carouselStyle` is
 * not: `resolveCarouselStyle('grid', 'carousel')` returns `grid`, because the
 * value is one Free renders, just not on that block. The guard structurally
 * cannot catch a cross-block style, so the transform has to.
 *
 * @param {Object} layoutOptions Donor layout options.
 * @param {string} targetSlug    Target block slug.
 * @return {Object} Layout options for the target.
 */
function mapLayoutOptions(layoutOptions, targetSlug) {
	const mapped = bridgeGapShapes(layoutOptions);

	mapped.carouselStyle = mapCarouselStyle(layoutOptions.carouselStyle, targetSlug);

	return mapped;
}

/**
 * `uniqueId` rides along on purpose: the donor is replaced in the same
 * operation, so the id keeps exactly one owner, and reusing it preserves the
 * per-instance CSS scope and the lightbox group.
 *
 * @param {Object} attributes      Donor block attributes.
 * @param {string} targetBlockName Target block name.
 * @return {Object} Attributes for the target block.
 */
export default function mapAttributesToBlock(attributes, targetBlockName) {
	const registered = getBlockType(targetBlockName)?.attributes;

	// An unregistered target has no shape to map onto — hand the attributes back
	// rather than silently returning an empty bag that drops all the content.
	if (!registered) {
		return { ...attributes };
	}

	const targetSlug = targetBlockName.replace(BLOCK_NAMESPACE, '');
	const donor = { ...attributes };

	if (isPlainObject(donor.layoutOptions)) {
		donor.layoutOptions = mapLayoutOptions(donor.layoutOptions, targetSlug);
	}

	const mapped = {};
	Object.keys(registered).forEach((key) => {
		if (undefined === donor[key]) {
			return;
		}

		mapped[key] = overlayDeclaredKeys(registered[key].default, donor[key]);
	});

	// The editor branches on the blockName attribute (PHP re-stamps it at render
	// time, the editor does not), and its value is not always the block slug.
	if (registered.blockName) {
		mapped.blockName = registered.blockName.default;
	}

	return mapped;
}
