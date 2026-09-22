import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useBlockEditContext, store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Collect clientIds of blocks that carry `uniqueId`, in document order.
 *
 * @param {Array}  blocks   Block list from the block editor store.
 * @param {string} targetId uniqueId value to match.
 * @param {Array}  results  Accumulator (document-order clientIds).
 * @return {Array<string>} Matching block clientIds in document order.
 */
const collectClientIdsWithUniqueId = (blocks, targetId, results = []) => {
	for (const block of blocks) {
		if (block?.attributes?.uniqueId === targetId) {
			results.push(block.clientId);
		}
		if (block?.innerBlocks?.length) {
			collectClientIdsWithUniqueId(block.innerBlocks, targetId, results);
		}
	}
	return results;
};

const generateUniqueId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Custom Hook to generate and save a unique ID for a block.
 *
 * Also regenerates when a duplicated/copied block reuses another block's
 * `uniqueId` so per-block dynamic CSS stays scoped.
 *
 * @param {string}   uniqueId      - The unique ID of the block.
 * @param {Function} setAttributes - The function to update the attributes of the block.
 * @param {string}   prefix        - The prefix to use for the unique ID. Default is 'wpcp-carousel'.
 */
const useUniqueId = (uniqueId, setAttributes, prefix = 'wpcp-carousel') => {
	const { clientId } = useBlockEditContext();

	const shouldRegenerate = useSelect(
		(select) => {
			if (!clientId) {
				return !uniqueId;
			}
			if (!uniqueId) {
				return true;
			}
			const blocks = select(blockEditorStore).getBlocks();
			const owners = collectClientIdsWithUniqueId(blocks, uniqueId);
			if (owners.length <= 1) {
				return false;
			}
			// Keep the first block in document order; duplicates get a fresh id.
			return owners[0] !== clientId;
		},
		[uniqueId, clientId]
	);

	useEffect(() => {
		if (shouldRegenerate) {
			setAttributes({ uniqueId: generateUniqueId(prefix) });
		}
	}, [shouldRegenerate, setAttributes, prefix]);
};

export default useUniqueId;
