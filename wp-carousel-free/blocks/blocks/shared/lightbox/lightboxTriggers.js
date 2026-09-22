/**
 * Lightbox trigger collection for the editor preview.
 *
 * `data-lightbox-ignore="true"` marks a decorative subtree — a marquee fill strip,
 * a panorama reflection — whose triggers never join the gallery. Layouts that
 * duplicate their items (marquee fill strips, Swiper loop clones) would otherwise
 * repeat every slide, so triggers are also deduplicated on `data-wpcp-item-index`:
 * the first node in DOM order wins and a click on any copy resolves back to it.
 */

export const LIGHTBOX_IGNORE_SELECTOR = '[data-lightbox-ignore="true"]';

/**
 * @param {Element} node
 * @return {boolean} True when the node sits inside a decorative subtree.
 */
export function isLightboxIgnored(node) {
	return !!node?.closest?.(LIGHTBOX_IGNORE_SELECTOR);
}

const itemIndexOf = (node) => node.getAttribute('data-wpcp-item-index');

/**
 * @param {Element[]} roots Preview roots to search.
 * @param {string}    group `data-fancybox` group value.
 * @return {Element[]} Gallery triggers, one per item, in DOM order.
 */
export function collectLightboxTriggers(roots, group) {
	const seenNodes = new Set();
	const seenItemIndexes = new Set();
	const triggers = [];

	roots.forEach((root) => {
		root.querySelectorAll('[data-fancybox="' + group + '"]').forEach((node) => {
			if (seenNodes.has(node) || isLightboxIgnored(node)) {
				return;
			}
			seenNodes.add(node);

			const itemIndex = itemIndexOf(node);
			if (null !== itemIndex) {
				if (seenItemIndexes.has(itemIndex)) {
					return;
				}
				seenItemIndexes.add(itemIndex);
			}

			triggers.push(node);
		});
	});

	return triggers;
}

/**
 * @param {Element[]} triggers Collected gallery triggers.
 * @param {Element}   trigger  The clicked trigger, possibly a deduplicated copy.
 * @return {number} Index to open the lightbox at.
 */
export function resolveTriggerStartIndex(triggers, trigger) {
	const direct = triggers.indexOf(trigger);
	if (direct >= 0) {
		return direct;
	}

	const itemIndex = itemIndexOf(trigger);
	if (null === itemIndex) {
		return 0;
	}

	return Math.max(
		0,
		triggers.findIndex((node) => itemIndexOf(node) === itemIndex)
	);
}
