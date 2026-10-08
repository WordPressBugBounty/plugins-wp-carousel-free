/**
 * AI Carousel Builder availability in the block editor.
 *
 * PHP localizes one flag (`AssetManager::enqueue_block_assets`) that already
 * folds together the "Create Carousel with AI" module toggle and the site's
 * own AI support, so every entry point here reads the same answer the server
 * enforces on `/wpcp/v2/ai-generate`.
 */

/**
 * Whether the AI Carousel Builder may be offered.
 *
 * Absent localize data means off, not on: the flag always ships when the
 * feature is live, so a missing one is a bundle that predates the module or a
 * context the editor never localized — neither is reason to show an entry
 * point the server would refuse.
 *
 * @return {boolean} True when the module is on and the site allows AI.
 */
export function isAIBuilderEnabled() {
	if (typeof window === 'undefined') {
		return false;
	}

	return Boolean(window.wpcpBlockLocalize?.aiBuilder?.enabled);
}

// The dashboard "Build with AI" button opens a new page with this arg set to
// "true"; the editor opens the modal once and strips it.
export const AI_BUILDER_QUERY_ARG = 'wpcp_ai_builder';
