/**
 * Opener registry for the AI Carousel Builder modal.
 */

import { isAIBuilderEnabled } from './constants';

let listener = null;

export function setAIBuilderOpener(fn) {
	listener = fn;
	return () => {
		listener = null;
	};
}

/**
 * @param {Object}  [options]
 * @param {?string} [options.clientId]   Block to target, or null for a fresh insert.
 * @param {string}  [options.blockName]  Block type to build/refine.
 * @param {boolean} [options.isRefining] True when this reopens the builder on a block
 *                                       that is already configured (the "Refine with AI"
 *                                       toolbar entry point) rather than a first-run
 *                                       wizard build. Determines whether a Ready Pattern
 *                                       may replace the block's current content — see
 *                                       AIBuilderModal's `isRefining` prop for why.
 * @return {boolean} True when the modal host took the request.
 */
export function openAIBuilder({
	clientId = null,
	blockName = 'wp-carousel-pro/carousel',
	isRefining = false,
} = {}) {
	// Callers gate their own buttons, but the modal must not be reachable from a
	// caller that forgot to — the module state decides, not the call site.
	if (!isAIBuilderEnabled() || typeof listener !== 'function') {
		return false;
	}
	listener({ clientId, blockName, isRefining });
	return true;
}
