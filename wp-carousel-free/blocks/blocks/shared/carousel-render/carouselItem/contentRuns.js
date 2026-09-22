/**
 * Content runs for the Classic (image-top) orientation.
 *
 * The Card Content element order may place the `image` slot between text
 * slots. Classic cards honor that by splitting the resolved order into
 * "runs": each stretch of consecutive non-image slots becomes its own
 * `.wpcp-item-content` wrapper, with the `.wpcp-item-media` box a direct
 * sibling between them inside `.wpcp-item-inner`.
 *
 * Mirrors src/Blocks/Rendering/ContentRuns.php — keep both in sync
 * (pinned by tests/__tests__/card-content/contentRuns.spec.js and
 * tests/php/content-runs.php).
 */

/**
 * Split a resolved slot order into media/content runs.
 *
 * Orders that do not contain `image` (legacy saves, sources whose sorter has
 * no Image row) render the media first — the pre-runs layout.
 *
 * @param {string[]} resolvedOrder  Resolved slot ids (may lack 'image').
 * @param {boolean}  isImageVisible Whether the media/image slot renders at all.
 * @return {Array<{type: 'media'}|{type: 'content', slots: string[]}>} Run sequence.
 */
export function splitContentRuns(resolvedOrder, isImageVisible) {
	const order = Array.isArray(resolvedOrder) ? resolvedOrder : [];
	const contentSlots = order.filter((slotId) => slotId !== 'image');

	if (!isImageVisible) {
		return contentSlots.length ? [{ type: 'content', slots: contentSlots }] : [];
	}

	if (!order.includes('image')) {
		return [
			{ type: 'media' },
			...(contentSlots.length ? [{ type: 'content', slots: contentSlots }] : []),
		];
	}

	const runs = [];
	let currentRunSlots = [];
	let hasEmittedMedia = false;

	order.forEach((slotId) => {
		if (slotId === 'image') {
			if (!hasEmittedMedia) {
				if (currentRunSlots.length) {
					runs.push({ type: 'content', slots: currentRunSlots });
					currentRunSlots = [];
				}
				runs.push({ type: 'media' });
				hasEmittedMedia = true;
			}
			return;
		}
		currentRunSlots.push(slotId);
	});

	if (currentRunSlots.length) {
		runs.push({ type: 'content', slots: currentRunSlots });
	}

	return runs;
}

/**
 * Whether the run sequence needs DOM-order rendering (the `wpcp-content-runs`
 * class that neutralizes the legacy flex `order` rules). Legacy shapes —
 * media-first or a single run — keep the class off so default saves render
 * byte-identical markup.
 *
 * @param {Array<{type: string}>} contentRuns splitContentRuns() output.
 * @return {boolean} True when the DOM sequence must win over flex order.
 */
export function runsRequireDomOrder(contentRuns) {
	return Array.isArray(contentRuns) && contentRuns.length >= 2 && contentRuns[0].type !== 'media';
}
