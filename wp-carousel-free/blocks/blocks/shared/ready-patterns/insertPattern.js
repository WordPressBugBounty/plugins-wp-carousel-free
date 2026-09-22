import { parse, getBlockType } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { speak } from '@wordpress/a11y';
import { getReadyPatternsRestBase } from './constants';
import { resolveItemTier } from './filterHelpers';
import { sanitizePatternTree } from './sanitizePatternAttributes';
import { resolveTargetClientId } from './resolveTargetClientId';
import {
	collectBlockNames,
	exceedsPatternSizeLimit,
	isWpcpBlockName,
	REJECT_DISALLOWED_BLOCK,
	REJECT_NO_WPCP_BLOCK,
	REJECT_TOO_DEEP,
	REJECT_TOO_MANY_BLOCKS,
	REJECT_UNREGISTERED_BLOCK,
	validatePatternTree,
} from './patternBlockAllowList';

/**
 * Announce through WordPress's global live region (survives modal unmount).
 *
 * @param {string} message Message to speak.
 */
function announce(message) {
	try {
		speak(message);
	} catch (error) {
		window.wp?.a11y?.speak?.(message);
	}
}

/**
 * Whether the parsed root block is a registered WPCP block.
 *
 * @param {Object|null} block Parsed block.
 * @return {boolean} True when the parsed block is a registered WPCP type.
 */
export function isValidWpcpRootBlock(block) {
	return Boolean(block?.name && isWpcpBlockName(block.name) && getBlockType(block.name));
}

/**
 * Build the user-facing message for a validation failure.
 *
 * @param {string} patternName Pattern display name.
 * @param {Object} result      Validation result from validatePatternTree().
 * @return {string} Translated notice text.
 */
function rejectionMessage(patternName, result) {
	const blockName = result?.blockName || '';

	if (REJECT_DISALLOWED_BLOCK === result?.reason) {
		return sprintf(
			/* translators: 1: pattern name, 2: block name */
			__('Could not insert "%1$s" — the block "%2$s" is not allowed in patterns.', 'wp-carousel-free'),
			patternName,
			blockName
		);
	}

	if (REJECT_UNREGISTERED_BLOCK === result?.reason) {
		return sprintf(
			/* translators: 1: pattern name, 2: block name */
			__(
				'Could not insert "%1$s" — the block "%2$s" is not available on this site.',
				'wp-carousel-free'
			),
			patternName,
			blockName
		);
	}

	if (REJECT_NO_WPCP_BLOCK === result?.reason) {
		return sprintf(
			/* translators: %s: pattern name */
			__('Could not insert "%s" — the pattern contains no WP Carousel block.', 'wp-carousel-free'),
			patternName
		);
	}

	if (REJECT_TOO_MANY_BLOCKS === result?.reason) {
		return sprintf(
			/* translators: %s: pattern name */
			__('Could not insert "%s" — the pattern contains too many blocks.', 'wp-carousel-free'),
			patternName
		);
	}

	if (REJECT_TOO_DEEP === result?.reason) {
		return sprintf(
			/* translators: %s: pattern name */
			__('Could not insert "%s" — the pattern is nested too deeply.', 'wp-carousel-free'),
			patternName
		);
	}

	return sprintf(
		/* translators: %s: pattern name */
		__('Could not insert "%s" — invalid block pattern.', 'wp-carousel-free'),
		patternName
	);
}

/**
 * Report a rejection: notice, announcement, and a failed result.
 *
 * @param {string} message Notice text.
 * @return {{success: boolean}} Failed insertion result.
 */
function reject(message) {
	dispatch('core/notices').createErrorNotice(message);
	announce(message);

	return { success: false };
}

/**
 * Whether a block type may be inserted at the intended root on this site.
 *
 * Blocks that declare a `parent`/`ancestor` (core/column, core/button) can only
 * ever be inserted inside their own wrapper, so asking about the document root
 * would reject every valid composite. For those the site-level allow-list is
 * consulted directly instead.
 *
 * @param {string}      name         Block name.
 * @param {string|null} rootClientId Intended insertion root ('' for document root).
 * @param {Object}      editorSelect Block editor selectors.
 * @return {boolean} True when the block is insertable.
 */
function isBlockInsertable(name, rootClientId, editorSelect) {
	const blockType = getBlockType(name);
	if (!blockType) {
		return false;
	}

	if (blockType.parent || blockType.ancestor) {
		const allowed = editorSelect.getSettings?.()?.allowedBlockTypes;
		return !Array.isArray(allowed) || allowed.includes(name);
	}

	return editorSelect.canInsertBlockType(name, rootClientId || '');
}

/**
 * Fetch, validate, and apply a Ready Pattern to the editor.
 *
 * @param {Object}      options                     Insertion options.
 * @param {Object}      options.pattern             Manifest item being inserted.
 * @param {string|null} [options.requestedClientId] Client id from the open request.
 * @return {Promise<{ success: boolean, focusClientId?: string|null }>} Result.
 */
export async function insertPattern({ pattern, requestedClientId = null }) {
	const patternId = pattern?.id;
	const patternName = pattern?.name;

	// Free previews every pattern and inserts only the free ones. The REST route
	// refuses a Pro payload too; this keeps the request from being made at all.
	if ('free' !== resolveItemTier(pattern)) {
		return reject(
			sprintf(
				/* translators: %s: pattern name */
				__('"%s" is available in WP Carousel Pro.', 'wp-carousel-free'),
				patternName
			)
		);
	}

	const restBase = getReadyPatternsRestBase().replace(/\/$/, '');
	const data = await apiFetch({
		path: `${restBase}/${patternId}`,
	});

	const raw = data?.content;
	if ('string' !== typeof raw || '' === raw) {
		const message = __('Pattern payload is empty.', 'wp-carousel-free');
		announce(message);
		throw new Error(message);
	}

	// Size is checked before parse() so an oversized payload never becomes a tree.
	if (exceedsPatternSizeLimit(raw)) {
		return reject(
			sprintf(
				/* translators: %s: pattern name */
				__('Could not insert "%s" — the pattern payload is too large.', 'wp-carousel-free'),
				patternName
			)
		);
	}

	const parsedBlocks = parse(raw);
	const validation = validatePatternTree(parsedBlocks);
	if (!validation.valid) {
		return reject(rejectionMessage(patternName, validation));
	}

	const editorSelect = select(blockEditorStore);
	const targetClientId = resolveTargetClientId(requestedClientId, {
		getBlock: editorSelect.getBlock,
		getSelectedBlockClientId: editorSelect.getSelectedBlockClientId,
	});

	const insertionPoint = editorSelect.getBlockInsertionPoint();
	const insertionRootClientId = targetClientId
		? editorSelect.getBlockRootClientId(targetClientId) ?? ''
		: insertionPoint?.rootClientId ?? '';

	// Never insert part of a section: one blocked block refuses the whole payload.
	const blockedName = collectBlockNames(parsedBlocks).find(
		(name) => !isBlockInsertable(name, insertionRootClientId, editorSelect)
	);
	if (blockedName) {
		return reject(
			sprintf(
				/* translators: 1: pattern name, 2: block name */
				__(
					'Could not insert "%1$s" — the block "%2$s" cannot be inserted here on this site.',
					'wp-carousel-free'
				),
				patternName,
				blockedName
			)
		);
	}

	const roots = sanitizePatternTree(parsedBlocks);
	const isSingleWpcpRoot = 1 === roots.length && isWpcpBlockName(roots[0]?.name);
	const currentBlockName = targetClientId ? editorSelect.getBlockName(targetClientId) : null;

	let focusClientId = null;

	if (targetClientId && isSingleWpcpRoot && roots[0].name === currentBlockName) {
		// Same block: apply in place so the target keeps its clientId (and its
		// per-instance CSS), in one undo step.
		dispatch(blockEditorStore).updateBlockAttributes(targetClientId, roots[0].attributes);
		dispatch(blockEditorStore).selectBlock(targetClientId);
		focusClientId = targetClientId;
	} else if (targetClientId) {
		const newClientIds = dispatch(blockEditorStore).replaceBlocks(targetClientId, roots);
		if (Array.isArray(newClientIds) && newClientIds.length > 0) {
			dispatch(blockEditorStore).selectBlock(newClientIds[0]);
			focusClientId = newClientIds[0];
		} else {
			focusClientId = roots[0]?.clientId ?? null;
			if (focusClientId) {
				dispatch(blockEditorStore).selectBlock(focusClientId);
			}
		}
	} else {
		dispatch(blockEditorStore).insertBlocks(
			roots,
			insertionPoint?.index,
			insertionPoint?.rootClientId
		);
		focusClientId = roots[0]?.clientId ?? null;
		if (focusClientId) {
			dispatch(blockEditorStore).selectBlock(focusClientId);
		}
	}

	announce(
		sprintf(
			/* translators: %s: pattern name */
			__('Inserted pattern "%s".', 'wp-carousel-free'),
			patternName
		)
	);

	return { success: true, focusClientId };
}
