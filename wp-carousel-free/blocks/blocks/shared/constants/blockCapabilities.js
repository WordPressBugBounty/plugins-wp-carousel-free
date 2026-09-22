/**
 * Per-block feature capability allow-lists (single source of truth).
 *
 * Separate from `allowedSources.js` (which gates content sources). Keep this
 * module free of @wordpress/* imports so Node CI scripts can load it directly.
 */

/**
 * Blocks where the per-image "Flip Image" hover/focus cross-fade applies.
 *
 * Limited to the "hover-a-card" idioms. Slider (full-bleed/autoplay) and
 * thumbnails-slider (one large navigation-driven stage) are excluded — a hover
 * flip there is noise, so the popup hides the Flipping Image tab for them.
 */
export const FLIP_IMAGE_BLOCKS = ['carousel', 'tiles'];

/**
 * Tells whether a block supports the per-image Flip Image feature.
 *
 * @param {string} blockName Block identifier (without the `wp-carousel-pro/` prefix).
 * @return {boolean} True if the block supports Flip Image.
 */
export function flipImageSupported(blockName) {
	return FLIP_IMAGE_BLOCKS.includes(blockName);
}
