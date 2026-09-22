/**
 * The Pro blocks Free previews in the editor and never renders on the front end.
 *
 * These blocks mount the full shared editor — real preview, whole inspector —
 * but `Blocks\EditorPreviewBlock::render()` returns an empty string, so nothing
 * they can be configured to do reaches a visitor.
 *
 * Keep this module free of @wordpress/* imports — Node CI scripts load it
 * without a WordPress runtime, the same constraint as `allowedSources.js`.
 */

export const EDITOR_PREVIEW_BLOCKS = ['marquee', 'carousel-panorama'];

/**
 * @param {string} blockName Block slug or full block name.
 * @return {boolean} True for a Pro editor-preview block.
 */
export function isEditorPreviewBlock(blockName) {
	return EDITOR_PREVIEW_BLOCKS.includes(String(blockName || '').replace('wp-carousel-pro/', ''));
}
