/**
 * Apply Layouts → Random Order for editor preview. Mirrors PHP `shuffle()` in ImageSource
 * and random ordering for dynamic post/product sources on the server.
 *
 * @param {Array}   items       Normalised carousel items.
 * @param {boolean} randomOrder When true, shuffle a copy of `items`.
 * @return {Array} The shuffled copy when `randomOrder` is true and length ≥ 2; otherwise `items`.
 */
export default function applyLayoutRandomOrder(items, randomOrder) {
	if (!randomOrder || !Array.isArray(items) || items.length < 2) {
		return items;
	}
	const out = items.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const t = out[i];
		out[i] = out[j];
		out[j] = t;
	}
	return out;
}
