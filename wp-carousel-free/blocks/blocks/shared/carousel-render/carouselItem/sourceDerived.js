/**
 * Small derivations from `sourceType` + options — keeps `CarouselItem` JSX easier to scan.
 */

import { DEFAULT_SOCIAL_NETWORKS, SOCIAL_ALIASES } from '../constants';

/**
 * @param {string}   sourceType
 * @param {Function} slotOn                From `isSlotVisible(attributes, slotId)`.
 * @param {Object}   ratingOptions
 * @param {Object}   productContentOptions
 * @return {{ showRating: boolean, showPrice: boolean, isPostOrProduct: boolean }} Derived flags for product/post slots.
 */
export function getSourceSlotFlags(sourceType, slotOn, ratingOptions, productContentOptions) {
	const isPostOrProduct = sourceType === 'post' || sourceType === 'product';
	return {
		showRating: sourceType === 'product' && slotOn('rating') && ratingOptions.enabled !== false,
		showPrice:
			sourceType === 'product' && slotOn('price') && productContentOptions.showPrice !== false,
		isPostOrProduct,
	};
}

/**
 * Resolve the network list shown for an item.
 *
 * Every item shares the block-level list — the per-item override is Pro
 * (mirrors `SocialShareRenderer::render()` in PHP).
 *
 * @param {Object} socialShareOptions `socialShareOptions` from attributes.
 * @return {string[]} Network keys after alias normalization for icon lookup.
 */
export function getSocialNetworks(socialShareOptions) {
	const raw = socialShareOptions?.networks;
	const list = Array.isArray(raw) ? raw : DEFAULT_SOCIAL_NETWORKS;
	if (!list.length) {
		return [];
	}
	return list.map((k) => SOCIAL_ALIASES[k] || k);
}
