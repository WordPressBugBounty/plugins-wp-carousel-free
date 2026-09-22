/**
 * Per-block content source allow-list (single source of truth).
 *
 * Keep this module free of @wordpress/* imports — Node CI scripts load it
 * via `await import(...)` without a WordPress runtime.
 */

export const TOP_LEVEL_SOURCES = ['image', 'video', 'post', 'product'];

/**
 * Pro-only sources each block advertises, mirroring Pro's own per-block support.
 *
 * Free ships the picker card and its Pro badge, never a provider — no entry
 * here appears in BLOCK_ALLOWED_SOURCES, and `sourceType` enums against
 * AllowedValues::SOURCES on the PHP side, so a hand-authored value cannot
 * reach a render path.
 */
export const BLOCK_PRO_TOP_LEVEL_SOURCES = {
	carousel: ['audio', 'external'],
	slider: [],
	'thumbnails-slider': [],
	tiles: ['audio', 'external'],
};

export const VIDEO_SUB_SOURCES = ['youtube', 'vimeo'];

/**
 * Pro-only video providers, in the order the picker draws them (after the Free ones).
 *
 * Free ships the picker card and its Pro badge, never a provider — no entry
 * here appears in VIDEO_SUB_SOURCES, and `VideoSource` snaps a saved value back
 * through AllowedValues::video_source(), so a hand-authored value cannot reach
 * a render path.
 */
export const PRO_VIDEO_SUB_SOURCES = [
	'tiktok',
	'twitch',
	'ted',
	'dailymotion',
	'rumble',
	'wistia',
	'sproutvideo',
	'embed',
	'self_hosted',
	'mp4_url',
];

export const BLOCK_ALLOWED_SOURCES = {
	carousel: {
		image: true,
		video: true,
		post: true,
		product: true,
	},
	slider: {
		image: true,
		video: true,
		post: true,
		product: true,
	},
	'thumbnails-slider': {
		image: true,
		video: true,
		post: true,
		product: true,
	},
	tiles: {
		image: true,
		video: true,
		post: true,
		product: true,
	},
	// The two Pro editor previews take images only. `useProgrammaticSourceGuard`
	// snaps anything else back to the single allowed value on mount, so a block
	// saved in Pro against another source still lands on a working canvas.
	'carousel-panorama': {
		image: true,
	},
	marquee: {
		image: true,
	},
};

const SUB_SOURCE_CATALOGUES = {
	video: VIDEO_SUB_SOURCES,
};

/**
 * Returns the ordered list of allowed top-level source identifiers for a block.
 *
 * Order matches `TOP_LEVEL_SOURCES`. Returns `[]` for unknown blockName.
 *
 * @param {string} blockName Block identifier (without the `wp-carousel-pro/` prefix).
 * @return {string[]} Allowed top-level source identifiers.
 */
export function getAllowedTopLevelSources(blockName) {
	const map = BLOCK_ALLOWED_SOURCES[blockName];
	if (!map) {
		return [];
	}
	return TOP_LEVEL_SOURCES.filter((src) => map[src] !== undefined);
}

/**
 * Returns the Pro-only source identifiers a block advertises as teaser cards.
 *
 * @param {string} blockName Block identifier (without the `wp-carousel-pro/` prefix).
 * @return {string[]} Pro-only top-level source identifiers.
 */
export function getProTopLevelSources(blockName) {
	return BLOCK_PRO_TOP_LEVEL_SOURCES[blockName] || [];
}

/**
 * Tells whether a top-level source is allowed for a block.
 *
 * @param {string} blockName  Block identifier.
 * @param {string} sourceType Top-level source (`image`, `video`, ...).
 * @return {boolean} True if allowed.
 */
export function isTopLevelSourceAllowed(blockName, sourceType) {
	return BLOCK_ALLOWED_SOURCES[blockName]?.[sourceType] !== undefined;
}

/**
 * Returns the allowed sub-source identifiers for a (block, top-level source).
 *
 * Returns `null` when the parent source has no sub-source layer (image, post,
 * product). Returns `[]` when the parent source is disallowed.
 *
 * @param {string} blockName  Block identifier.
 * @param {string} sourceType Top-level source.
 * @return {string[]|null} Sub-source identifiers, or null if N/A.
 */
export function getAllowedSubSources(blockName, sourceType) {
	const catalogue = SUB_SOURCE_CATALOGUES[sourceType];
	if (!catalogue) {
		return null;
	}
	const value = BLOCK_ALLOWED_SOURCES[blockName]?.[sourceType];
	if (value === true) {
		return catalogue;
	}
	if (Array.isArray(value)) {
		return value;
	}
	return [];
}

/**
 * Tells whether a sub-source is allowed for a (block, top-level source).
 *
 * Returns `true` for parent sources without sub-sources, so the helper is safe
 * to call generically (the sub-source picker is then skipped by the caller).
 *
 * @param {string} blockName  Block identifier.
 * @param {string} sourceType Top-level source.
 * @param {string} subSource  Sub-source identifier.
 * @return {boolean} True if allowed.
 */
export function isSubSourceAllowed(blockName, sourceType, subSource) {
	const allowed = getAllowedSubSources(blockName, sourceType);
	return allowed === null || allowed.includes(subSource);
}
