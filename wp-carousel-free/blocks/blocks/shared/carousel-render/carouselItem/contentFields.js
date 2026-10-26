/**
 * Map Content panel “title/description source” dropdowns to normalized item keys.
 * Keep in sync with `BlockRenderer.php` item field mapping.
 */

const TITLE_DESC_FIELD_MAP = {
	image_title: 'title',
	image_description: 'description',
	image_caption: 'caption',
	image_alt: 'image_alt',
	post_title: 'title',
	post_excerpt: 'description',
	post_content: 'description',
};

/**
 * @param {Object} item       Normalized carousel item.
 * @param {string} source     Selected source key from content options.
 * @param {string} defaultKey Fallback item key.
 * @return {string} Resolved text (HTML allowed upstream).
 */
export function getContentField(item, source, defaultKey) {
	const key = TITLE_DESC_FIELD_MAP[source] ?? defaultKey;

	if (key === 'image_alt') {
		return item?.image_alt ?? item?.alt ?? item?.[defaultKey] ?? '';
	}

	return item?.[key] ?? item?.[defaultKey] ?? '';
}

/** Default title source for the image source — the attachment caption. */
export const DEFAULT_IMAGE_TITLE_SOURCE = 'image_caption';

/**
 * Only the image source chooses a title source; every other source titles from the item.
 * Mirrors `SlotRenderer::resolve_title_source()`.
 *
 * @param {string} sourceType  Block sourceType attribute.
 * @param {string} titleSource Stored contentOptions.titleSource.
 * @return {string} Source key to feed `getContentField`.
 */
export function resolveTitleSource(sourceType, titleSource) {
	if ('image' !== sourceType) {
		return 'image_title';
	}

	return titleSource || DEFAULT_IMAGE_TITLE_SOURCE;
}
