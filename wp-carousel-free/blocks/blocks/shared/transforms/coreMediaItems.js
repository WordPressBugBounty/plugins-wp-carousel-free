/**
 * Item builders for the core Image / Gallery → WP Carousel transforms.
 */

import {
	sanitizeItemCaption,
	sanitizeItemPlainText,
	sanitizeItemUrl,
} from '../utils/sanitizeItemText';

const EXTERNAL_ITEM_ID_PREFIX = 'wpcp-core-image';

/**
 * Core declares `caption` as `rich-text`, so the editor hands over a
 * `RichTextData` instance rather than a string — sanitizers that type-check for
 * a string would silently drop it.
 *
 * @param {*} value Attribute value from a core block.
 * @return {string} HTML string.
 */
function asHtmlString(value) {
	if ('string' === typeof value) {
		return value;
	}
	if (value && 'function' === typeof value.toHTMLString) {
		return value.toHTMLString();
	}
	return '';
}

/**
 * Build one carousel item from a core Image block's attributes.
 *
 * @param {Object} imageAttributes Core image attributes.
 * @param {number} index           Position in the donor selection.
 * @return {Object|null} Carousel item, or null when there is no usable URL.
 */
function buildImageItem(imageAttributes, index) {
	if (!imageAttributes || 'object' !== typeof imageAttributes) {
		return null;
	}

	const url =
		sanitizeItemUrl(asHtmlString(imageAttributes.url)) ||
		sanitizeItemUrl(asHtmlString(imageAttributes.fullUrl));
	if (!url) {
		return null;
	}

	const attachmentId = Number(imageAttributes.id);
	const item = {
		id:
			Number.isFinite(attachmentId) && attachmentId > 0
				? attachmentId
				: `${EXTERNAL_ITEM_ID_PREFIX}-${index}`,
		url,
	};

	// The editor preview reads `image_alt` while PHP falls back through both, so
	// the pair has to be written together or the alt text renders in only one.
	const alt = sanitizeItemPlainText(asHtmlString(imageAttributes.alt));
	if (alt) {
		item.image_alt = alt;
		item.alt = alt;
	}

	// Core captions are RichText and can carry inline markup.
	const caption = sanitizeItemCaption(asHtmlString(imageAttributes.caption));
	if (caption) {
		item.caption = caption;
	}

	// Only a deliberate custom link is carried — core's "media file" and
	// "attachment page" destinations are defaults our Click Action already owns.
	if ('custom' === imageAttributes.linkDestination) {
		const link =
			sanitizeItemUrl(asHtmlString(imageAttributes.href)) ||
			sanitizeItemUrl(asHtmlString(imageAttributes.link));
		if (link) {
			item.customUrl = link;
		}
	}

	return item;
}

/**
 * @param {Object[]} imageAttributeList Core image attribute objects.
 * @return {Object[]} Carousel items, skipping the ones with no usable URL.
 */
function buildImageItems(imageAttributeList) {
	return imageAttributeList
		.map((imageAttributes, index) => buildImageItem(imageAttributes, index))
		.filter(Boolean);
}

/**
 * Galleries since WordPress 5.9 hold their images as inner `core/image` blocks;
 * older ones keep them in the `images` attribute. Both shapes are read so a
 * gallery that has never been re-saved still transforms with its images.
 *
 * @param {Object}          attributes  Core gallery attributes.
 * @param {Object[]|Object} innerSource Inner blocks, or the block holding them.
 * @return {Object[]} Carousel items.
 */
export function itemsFromCoreGallery(attributes, innerSource) {
	const innerBlocks = Array.isArray(innerSource) ? innerSource : innerSource?.innerBlocks || [];
	const innerImages = innerBlocks
		.filter((block) => 'core/image' === block?.name)
		.map((block) => block.attributes);

	if (innerImages.length > 0) {
		return buildImageItems(innerImages);
	}

	return buildImageItems(Array.isArray(attributes?.images) ? attributes.images : []);
}

/**
 * @param {Object[]|Object} imageAttributes One or more core image attribute objects.
 * @return {Object[]} Carousel items.
 */
export function itemsFromCoreImages(imageAttributes) {
	return buildImageItems(Array.isArray(imageAttributes) ? imageAttributes : [imageAttributes]);
}

/**
 * @param {*} value Value or array of values.
 * @return {Object} The first entry, or an empty object.
 */
export function firstOf(value) {
	return (Array.isArray(value) ? value[0] : value) || {};
}

/**
 * Whether a core image carries a URL the transform could use.
 *
 * The block switcher calls `isMatch` on every candidate, and again on switch,
 * so answering it by building every item would sanitize a large gallery several
 * times over for a yes/no. This stops at the first usable URL.
 *
 * @param {Object} imageAttributes Core image attributes.
 * @return {boolean} True when the image has a usable URL.
 */
function hasUsableUrl(imageAttributes) {
	return !!buildImageItem(imageAttributes, 0);
}

/**
 * @param {Object}          attributes  Core gallery attributes.
 * @param {Object[]|Object} innerSource Inner blocks, or the block holding them.
 * @return {boolean} True when the gallery holds at least one usable image.
 */
export function coreGalleryHasImage(attributes, innerSource) {
	const innerBlocks = Array.isArray(innerSource) ? innerSource : innerSource?.innerBlocks || [];
	const innerImages = innerBlocks
		.filter((block) => 'core/image' === block?.name)
		.map((block) => block.attributes);
	const candidates = innerImages.length > 0 ? innerImages : attributes?.images;

	return Array.isArray(candidates) && candidates.some(hasUsableUrl);
}

/**
 * @param {Object[]|Object} imageAttributes One or more core image attribute objects.
 * @return {boolean} True when at least one image has a usable URL.
 */
export function coreImagesHaveImage(imageAttributes) {
	const candidates = Array.isArray(imageAttributes) ? imageAttributes : [imageAttributes];

	return candidates.some(hasUsableUrl);
}
