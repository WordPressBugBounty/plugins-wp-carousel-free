/**
 * Resolve the aspect ratio applied to the outer `.wpcp-item-media` wrapper.
 *
 * Video source sizing is owned by `videoOptions.aspectRatio` on the inner
 * thumbnail; image aspect must not box the outer media for video items.
 * Fallback matches `CarouselBaseSchema` (`4:3`); Slider overrides the schema
 * default to `original` and callers also force outer `original` for stage
 * sizing so the Image panel Aspect Ratio drives the stage, not per-item boxes.
 *
 * @param {string} sourceType   Block sourceType attribute.
 * @param {Object} imageOptions Image panel options slice.
 * @return {string} Aspect mode: 'original', 'custom', or 'W:H'.
 */
export function resolveOuterMediaAspect(sourceType, imageOptions = {}) {
	if ('video' === sourceType) {
		return 'original';
	}
	return imageOptions.aspectRatio || '4:3';
}
