const WPCP_BLOCK_PREFIX = 'wp-carousel-pro/';

/**
 * Resolve the Ready Patterns insert target at insert time.
 *
 * Order: requested clientId (if the block still exists) → selected block when it
 * is a WPCP type → none (insert at the editor insertion point). A stale
 * requested id degrades to none.
 *
 * @param {string|null|undefined} requestedClientId                  Client id from the open request.
 * @param {Object}                selectors                          Block-editor selectors.
 * @param {Function}              selectors.getBlock
 * @param {Function}              selectors.getSelectedBlockClientId
 * @return {string|null} Resolved target client id, or null.
 */
export function resolveTargetClientId(requestedClientId, { getBlock, getSelectedBlockClientId }) {
	if (requestedClientId) {
		const requested = getBlock(requestedClientId);
		return requested ? requestedClientId : null;
	}

	const selectedClientId = getSelectedBlockClientId?.() || null;
	if (!selectedClientId) {
		return null;
	}

	const selected = getBlock(selectedClientId);
	if (selected?.name && selected.name.startsWith(WPCP_BLOCK_PREFIX)) {
		return selectedClientId;
	}

	return null;
}
