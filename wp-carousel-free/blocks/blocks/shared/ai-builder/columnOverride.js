/**
 * Explicit-column-count enforcement for the AI Carousel Builder.
 *
 * A matched Ready Pattern's baked-in layout, or a generation that drifted off
 * the number the user actually typed, must not silently win over a count the
 * prompt itself states — these pure helpers re-derive and patch that count
 * onto whatever attributes the AI (or a pattern) produced. Extracted from
 * AIBuilderModal.jsx so they can be unit tested without pulling in the whole
 * modal's component tree.
 */

/**
 * Read an explicit column count out of the user's own prompt ("5-column",
 * "5 columns").
 *
 * @param {string} promptText User prompt.
 * @return {number|null} Column count clamped to the real 1-12 control range
 *                        (LAYOUT_RANGES.columns in inspector/constants.js — the
 *                        same range applies to desktop/tablet/mobile), or null
 *                        when the prompt names none.
 */
export function extractColumnCount(promptText) {
	const match = /(\d+)\s*[- ]?\s*columns?\b/i.exec(promptText || '');
	if (!match) {
		return null;
	}
	const columns = parseInt(match[1], 10);
	return Number.isFinite(columns) && columns > 0 ? Math.min(columns, 12) : null;
}

/**
 * Patch `layoutOptions.columns` (desktop) onto a set of attributes from an
 * explicit column count in the prompt. Tablet/Mobile are left as whatever the
 * AI or existing attributes already had — there's no product-enforced
 * responsive relationship between the three (each has the same independent
 * 1-12 range), so guessing a scaled-down value here would just be another
 * fabricated number. No-ops when the prompt names no count, or the block has
 * no columns option (slider) — returns the same reference in either case.
 *
 * @param {Object} attributes Attributes to check/patch.
 * @param {string} promptText User prompt.
 * @return {Object} Patched attributes, or `attributes` unchanged.
 */
export function applyColumnOverride(attributes, promptText) {
	const columns = extractColumnCount(promptText);
	const layoutOptions = attributes?.layoutOptions;
	if (!columns || !layoutOptions || !('columns' in layoutOptions)) {
		return attributes;
	}

	return {
		...attributes,
		layoutOptions: {
			...layoutOptions,
			columns,
		},
	};
}

/**
 * Find the block actually holding `layoutOptions.columns` inside a full block
 * object (as returned by `getBlock()`, innerBlocks included).
 *
 * A pattern's Ready Pattern root is often a wrapper (`core/group`, a section) with
 * the carousel nested inside — `insertPattern()`'s `focusClientId` points at that
 * wrapper (it only needs to be "close enough" to select for focus), so patching
 * `focusClientId`'s own attributes silently no-ops when it isn't the carousel
 * itself. Depth-first, first match wins.
 *
 * @param {Object|null} block Full block object.
 * @return {Object|null} The carousel-style block, or null when none is found.
 */
export function findColumnsTargetBlock(block) {
	if (!block) {
		return null;
	}
	if (block.attributes?.layoutOptions && 'columns' in block.attributes.layoutOptions) {
		return block;
	}
	for (const inner of block.innerBlocks || []) {
		const found = findColumnsTargetBlock(inner);
		if (found) {
			return found;
		}
	}
	return null;
}
