/**
 * Ready Patterns — shared constants.
 */

import { __ } from '@wordpress/i18n';

export const READY_PATTERNS_PREFIX = 'wpcp-ready-patterns';

/**
 * Sidebar block-axis slugs in display order (excludes "all").
 *
 * Pro block types are pinned here on purpose: their patterns are a showcase, so
 * the row stays visible at a count of zero. A category the manifest carries but
 * this list omits still gets a row — see `collectCategoryTerms()`.
 */
export const CATEGORY_SLUGS = [
	'carousel',
	'carousel-panorama',
	'marquee',
	'slider',
	'thumbnails-slider',
	'tiles',
];

export const CATEGORY_LABELS = {
	all: 'All Patterns',
	carousel: 'Carousel',
	'carousel-panorama': 'Panorama Carousel',
	marquee: 'Marquee',
	slider: 'Slider',
	'thumbnails-slider': 'Thumbnails Slider',
	tiles: 'Tiles',
};

/**
 * Source category slugs that are an alias of another row.
 *
 * `grid` is the demo server's name for what this plugin renders with the Tiles
 * block, so its patterns count toward Tiles rather than opening a row of their own.
 */
export const CATEGORY_ALIASES = {
	grid: 'tiles',
};

/** Map block name → default sidebar category slug. */
export const BLOCK_NAME_TO_CATEGORY = {
	'wp-carousel-pro/carousel': 'carousel',
	'wp-carousel-pro/carousel-panorama': 'carousel-panorama',
	'wp-carousel-pro/marquee': 'marquee',
	'wp-carousel-pro/slider': 'slider',
	'wp-carousel-pro/thumbnails-slider': 'thumbnails-slider',
	'wp-carousel-pro/tiles': 'tiles',
};

/**
 * Canonical use-case slugs in display order — mirrors
 * `PatternVocabulary::USE_CASES`. Terms outside this list are still listed and
 * filterable; the order is a display aid, never a gate.
 */
export const USE_CASE_SLUGS = [
	'hero',
	'features',
	'portfolio',
	'gallery',
	'testimonials',
	'team',
	'logos',
	'pricing',
	'cta',
	'faq',
	'blog',
	'shop',
	'video',
	'events',
	'listings',
	'education',
	'hospitality',
	'downloads',
	'social-feed',
	'page',
];

/** Source-type facet values in display order. */
export const SOURCE_TYPE_SLUGS = ['image', 'post', 'product', 'video', 'mixed'];

export const FILTER_ALL = 'all';

export const TIER_ALL = 'all';
export const TIER_FREE = 'free';
export const TIER_PREMIUM = 'premium';

export const SORT_DEFAULT = 'default';
export const SORT_POPULAR = 'popular';
export const SORT_LATEST = 'latest';

export const GRID_DENSITY_TWO = 2;
export const GRID_DENSITY_THREE = 3;

/** Preview drawer device widths in logical pixels. */
export const PREVIEW_DEVICES = [
	{ key: 'desktop', width: 1440 },
	{ key: 'tablet', width: 834 },
	{ key: 'mobile', width: 390 },
];

/**
 * Use-case slug → translated label (mirrors `PatternVocabulary::use_case_labels`).
 *
 * @return {Record<string, string>} Label map.
 */
export function useCaseLabels() {
	return {
		hero: __('Hero', 'wp-carousel-free'),
		features: __('Features', 'wp-carousel-free'),
		portfolio: __('Portfolio', 'wp-carousel-free'),
		gallery: __('Gallery', 'wp-carousel-free'),
		testimonials: __('Testimonials', 'wp-carousel-free'),
		team: __('Team', 'wp-carousel-free'),
		logos: __('Logos', 'wp-carousel-free'),
		pricing: __('Pricing', 'wp-carousel-free'),
		cta: __('Call to Action', 'wp-carousel-free'),
		faq: __('FAQ', 'wp-carousel-free'),
		blog: __('Blog', 'wp-carousel-free'),
		shop: __('Shop', 'wp-carousel-free'),
		video: __('Video', 'wp-carousel-free'),
		events: __('Events', 'wp-carousel-free'),
		listings: __('Listings', 'wp-carousel-free'),
		education: __('Education', 'wp-carousel-free'),
		hospitality: __('Hospitality', 'wp-carousel-free'),
		downloads: __('Downloads', 'wp-carousel-free'),
		'social-feed': __('Social Feed', 'wp-carousel-free'),
		page: __('Full Page', 'wp-carousel-free'),
	};
}

/**
 * Source-type slug → translated label.
 *
 * @return {Record<string, string>} Label map.
 */
export function sourceTypeLabels() {
	return {
		image: __('Images', 'wp-carousel-free'),
		post: __('Posts', 'wp-carousel-free'),
		product: __('Products', 'wp-carousel-free'),
		video: __('Videos', 'wp-carousel-free'),
		audio: __('Audio', 'wp-carousel-free'),
		external: __('External Feed', 'wp-carousel-free'),
		mixed: __('Mixed', 'wp-carousel-free'),
	};
}

/**
 * Turn a slug into a readable label ("real-estate" → "Real Estate").
 *
 * @param {string} term Term slug.
 * @return {string} Readable label.
 */
export function humanizeTerm(term) {
	return String(term || '')
		.split(/[-_]/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Label for a use-case term, humanizing terms the plugin has no label for.
 *
 * @param {string} term Use-case slug.
 * @return {string} Display label.
 */
export function useCaseLabel(term) {
	return useCaseLabels()[term] || humanizeTerm(term);
}

/**
 * Look a key up on a plain map without inheriting from Object.prototype.
 *
 * Category slugs arrive from the pattern server, and `sanitize_key()` happily
 * passes `constructor` or `toString` — a bare bracket lookup would then return a
 * function and hand React a label it cannot render.
 *
 * @param {Object} map Lookup map.
 * @param {string} key Candidate key.
 * @return {string} Mapped value, or an empty string.
 */
function ownLookup(map, key) {
	return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : '';
}

/**
 * Resolve a source category to the block-axis row it belongs on.
 *
 * @param {string} term Source category slug.
 * @return {string} Canonical category slug.
 */
export function canonicalizeCategory(term) {
	const slug = String(term || '');
	return ownLookup(CATEGORY_ALIASES, slug) || slug;
}

/**
 * Label for a block-axis term, humanizing terms the plugin has no label for.
 *
 * @param {string} term Category slug.
 * @return {string} Display label.
 */
export function categoryLabel(term) {
	return ownLookup(CATEGORY_LABELS, term) || humanizeTerm(term);
}

/**
 * Label for a source-type term, humanizing unknown terms.
 *
 * @param {string} term Source-type slug.
 * @return {string} Display label.
 */
export function sourceTypeLabel(term) {
	return sourceTypeLabels()[term] || humanizeTerm(term);
}

/**
 * Whether Ready Patterns is enabled via editor localization.
 *
 * @return {boolean} True when the feature flag is on.
 */
export function isReadyPatternsEnabled() {
	if (typeof window === 'undefined') {
		return false;
	}
	return Boolean(window.wpcpBlockLocalize?.readyPatterns?.enabled);
}

/**
 * REST base URL for patterns endpoints.
 *
 * @return {string} REST path for apiFetch.
 */
export function getReadyPatternsRestBase() {
	return window.wpcpBlockLocalize?.readyPatterns?.restBase || '/wpcp/v2/patterns';
}

/**
 * REST path for the favorites endpoint.
 *
 * @return {string} REST path for apiFetch.
 */
export function getReadyPatternsFavoritesPath() {
	return '/wpcp/v2/pattern-favorites';
}

/**
 * Admin URL of the dashboard modules screen.
 *
 * @return {string} Admin URL.
 */
export function getReadyPatternsModulesUrl() {
	return (
		window.wpcpBlockLocalize?.readyPatterns?.modulesUrl ||
		'edit.php?post_type=sp_wp_carousel&page=wpcp_dashboard#modules'
	);
}

/**
 * Resolve initial category from a block name (tiles → tiles, not grid).
 *
 * @param {string} blockName Registered block name.
 * @return {string} Category slug or "all".
 */
export function categoryFromBlockName(blockName) {
	return BLOCK_NAME_TO_CATEGORY[blockName] || 'all';
}
