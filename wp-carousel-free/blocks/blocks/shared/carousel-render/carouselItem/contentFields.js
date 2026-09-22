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
