/**
 * Default Content Area slot order per content source.
 * When `contentAreaOptions.order` is empty, we fall back to these lists (mirrors PHP / Content panel).
 */

const DEFAULT_ORDER_BY_SOURCE = {
	post: ['image', 'meta', 'title', 'taxonomy', 'excerpt', 'readmore', 'social'],
	product: ['image', 'title', 'rating', 'taxonomy', 'price', 'excerpt', 'readmore', 'social'],
	image: ['image', 'title', 'description', 'readmore', 'social'],
	video: ['image', 'title', 'description', 'social', 'readmore'],
	audio: ['image', 'title', 'description', 'readmore', 'social'],
	document: ['title', 'description', 'social'],
	external: ['image', 'meta', 'title', 'taxonomy', 'excerpt', 'social', 'readmore'],
};

/**
 * @param {string} sourceType Block `sourceType` (image, post, product, …).
 * @return {string[]} Default ordered slot ids.
 */
export function getDefaultContentOrder(sourceType) {
	return DEFAULT_ORDER_BY_SOURCE[sourceType] || DEFAULT_ORDER_BY_SOURCE.image;
}

/**
 * Resolved slot order: saved `contentAreaOptions.order` or default for `sourceType`.
 *
 * @param {Object} contentAreaOptions `contentAreaOptions` from block attributes.
 * @param {string} sourceType         Block source type.
 * @return {string[]} Slot ids in render order.
 */
export function resolveContentOrder(contentAreaOptions, sourceType) {
	if (Array.isArray(contentAreaOptions?.order) && contentAreaOptions.order.length > 0) {
		const defaultOrder = getDefaultContentOrder(sourceType);
		const missingSlots = defaultOrder.filter((slotId) => !contentAreaOptions.order.includes(slotId));
		// A saved order that predates the sortable Image row lacks 'image';
		// those saves rendered the media first, so the image slot joins at the
		// front (Classic content runs read its position), not the tail.
		const missingImage = missingSlots.filter((slotId) => slotId === 'image');
		return [
			...missingImage,
			...contentAreaOptions.order,
			...missingSlots.filter((slotId) => slotId !== 'image'),
		];
	}
	return getDefaultContentOrder(sourceType);
}
