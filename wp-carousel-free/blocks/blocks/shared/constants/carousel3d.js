/**
 * 3D Carousel layout vocabulary: the styles its picker shows and the Side Items row.
 *
 * Coverflow (`style-one`) is the only Free style and the 3D Settings popup is
 * Pro, so the staging rows are fixed at Pro's defaults here and mirrored by
 * `ConfigBuilder::CAROUSEL_3D_STAGING`. `tests/__tests__/carousel3dScaffold.spec.js`
 * asserts the two stay equal.
 *
 * Deliberately free of `@wordpress/*` imports so plain Node can read it; labels
 * live with the controls.
 */

export const CAROUSEL_3D_BLOCK = 'wp-carousel-pro/carousel-3d';

/** The style Free renders. */
export const CAROUSEL_3D_FREE_STYLE = 'style-one';

/** `sideItems` value meaning "every item flanks the centered one". */
export const CAROUSEL_3D_SIDE_ITEMS_ALL = 'all';

/** Slides shown either side of the centered one. */
export const CAROUSEL_3D_SIDE_ITEM_COUNTS = [2, 3, 4];

/** Responsive defaults for `sideItems`, mirroring `Carousel3DSchema`. */
export const CAROUSEL_3D_SIDE_ITEMS = {
	default: { Desktop: 4, Tablet: 3, Mobile: 2 },
};

/** Coverflow's staging numbers, read against a 200px reference card. */
export const CAROUSEL_3D_STAGING = {
	centerItemDistance: 164,
	sideSlidesSpacing: 82,
	slidesDepth: 59,
	slidesDepthSpacing: 19,
	sidesPerspective: 80,
	sidesYRotation: 70,
};

/**
 * The `sideItems` choices, counts first and "all" last.
 *
 * @return {Array<number|string>} Offered values.
 */
export function carousel3dSideItemChoices() {
	return [...CAROUSEL_3D_SIDE_ITEM_COUNTS, CAROUSEL_3D_SIDE_ITEMS_ALL];
}

/**
 * A saved count the select cannot show falls back to the device default.
 *
 * @param {number|string} value    Saved `sideItems` value for one device.
 * @param {number|string} fallback That device's default.
 * @return {number|string} The value to show.
 */
export function resolveCarousel3dSideItems(value, fallback) {
	return carousel3dSideItemChoices().includes(value) ? value : fallback;
}

/**
 * Attribute key holding a responsive trio's value for one device.
 *
 * @param {string} key        Desktop attribute key, e.g. `sideItems`.
 * @param {string} deviceType `Desktop`, `Tablet` or `Mobile`.
 * @return {string} The attribute key for that device.
 */
export function carousel3dDeviceKey(key, deviceType) {
	return 'Desktop' === deviceType || !deviceType ? key : `${key}${deviceType}`;
}

/**
 * @param {string} blockName Block name or slug.
 * @return {boolean} True for the 3D Carousel block.
 */
export function isCarousel3dBlock(blockName) {
	return CAROUSEL_3D_BLOCK === blockName || 'carousel-3d' === blockName;
}
