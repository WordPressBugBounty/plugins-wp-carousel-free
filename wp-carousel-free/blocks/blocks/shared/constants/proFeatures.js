/**
 * Copy for every Pro teaser surface, in one place.
 *
 * PRO_BLOCKS keys the teaser placeholder by full block name; PRO_PANELS keys a
 * locked inspector panel by its panel id; PRO_CLICK_ACTIONS and PRO_SOCIAL_SHARE
 * are notices shown inside a panel whose Free controls stay usable. Demo links
 * come from `blockPreviewPanelLink` so a teaser and a live block never disagree.
 */

import { __, sprintf } from '@wordpress/i18n';
import { blockPreviewPanelLink } from '../../../controls/constants';

export const PRO_BLOCKS = {
	'wp-carousel-pro/marquee': {
		slug: 'marquee',
		title: __('Marquee', 'wp-carousel-free'),
		previewImage: 'marquee.png',
	},
	'wp-carousel-pro/carousel-panorama': {
		slug: 'carousel-panorama',
		title: __('Panorama Carousel', 'wp-carousel-free'),
		previewImage: 'panorama-carousel-preview.png',
	},
	'wp-carousel-pro/masonry': {
		slug: 'masonry',
		title: __('Masonry', 'wp-carousel-free'),
		previewImage: 'masonry.png',
	},
	'wp-carousel-pro/justified': {
		slug: 'justified',
		title: __('Justified', 'wp-carousel-free'),
		previewImage: 'justified.png',
	},
};

/** Layouts upsell — Carousel block, and the fallback for any other layout block. */
export const PRO_CAROUSEL_LAYOUT = {
	title: __('Design Without Limits', 'wp-carousel-free'),
	subtitle: __('More ways to shape and present every slide.', 'wp-carousel-free'),
	features: [
		__('4 more carousel styles', 'wp-carousel-free'),
		__('Vertical direction', 'wp-carousel-free'),
		__('2 extra content styles', 'wp-carousel-free'),
		__('Variable width items', 'wp-carousel-free'),
		__('Adaptive height', 'wp-carousel-free'),
	],
};

/** Layouts upsell — Slider block. */
export const PRO_SLIDER_LAYOUT = {
	title: __('Make Every Slide Cinematic', 'wp-carousel-free'),
	subtitle: __('Striking transitions and animated content for every slide.', 'wp-carousel-free'),
	features: [
		__('7 more slider styles', 'wp-carousel-free'),
		__('Ken Burns, Shaders & Slicer effects', 'wp-carousel-free'),
		__('Overlay Box content style', 'wp-carousel-free'),
		__('30+ content animations', 'wp-carousel-free'),
	],
};

/** Layouts upsell — Thumbnails Slider block. */
export const PRO_THUMBNAILS_SLIDER_LAYOUT = {
	title: __('Frame Every Slide in Style', 'wp-carousel-free'),
	subtitle: __('More ways to pair the main stage with its thumbnails.', 'wp-carousel-free'),
	features: [
		__('3 more thumbnail layouts', 'wp-carousel-free'),
		__('Overlay, list & centered thumbnails', 'wp-carousel-free'),
		__('30+ content animations', 'wp-carousel-free'),
	],
};

/** Layouts upsell — 3D Carousel block. */
export const PRO_CAROUSEL_3D_LAYOUT = {
	title: __('Bring Depth to Your Design', 'wp-carousel-free'),
	subtitle: __('More 3D styles with full control over depth and perspective.', 'wp-carousel-free'),
	features: [
		__('3 more 3D carousel styles', 'wp-carousel-free'),
		__('Depth & perspective control', 'wp-carousel-free'),
		__('Side item rotation & spacing', 'wp-carousel-free'),
		__('Mirror-like reflection', 'wp-carousel-free'),
	],
};

/** Layouts upsell — Grid block. */
export const PRO_GRID_LAYOUT = {
	title: __('Help Visitors Find It Faster', 'wp-carousel-free'),
	subtitle: __('Let visitors filter and search every grid.', 'wp-carousel-free'),
	features: [
		__('Gallery & category filters', 'wp-carousel-free'),
		__('Instant Ajax search', 'wp-carousel-free'),
	],
};

/** Layouts upsell — Tiles block, Image source. */
export const PRO_TILES_LAYOUT = {
	title: __('Build Standout Tile Mosaics', 'wp-carousel-free'),
	subtitle: __('More mosaic layouts with full control over every tile.', 'wp-carousel-free'),
	features: [
		__('6 more tile layouts', 'wp-carousel-free'),
		__('Custom tile size per item', 'wp-carousel-free'),
		__('2 extra content styles', 'wp-carousel-free'),
		__('Gallery filters', 'wp-carousel-free'),
		__('Instant Ajax search', 'wp-carousel-free'),
	],
};

/** Layouts upsell — Tiles block, Post/Product source: no Custom Layout or search there. */
export const PRO_TILES_LAYOUT_POST_PRODUCT = {
	title: __('Build Standout Tile Mosaics', 'wp-carousel-free'),
	subtitle: __('More mosaic layouts for every post and product.', 'wp-carousel-free'),
	features: [
		__('6 more tile layouts', 'wp-carousel-free'),
		__('2 extra content styles', 'wp-carousel-free'),
		__('Category filters', 'wp-carousel-free'),
	],
};

/** Layouts upsell — Tiles block, Video source: only the layout presets are Pro. */
export const PRO_TILES_LAYOUT_VIDEO = {
	title: __('Build Standout Tile Mosaics', 'wp-carousel-free'),
	subtitle: __('More mosaic layouts for every video.', 'wp-carousel-free'),
	features: [
		__('6 more tile layouts', 'wp-carousel-free'),
		__('2 extra content styles', 'wp-carousel-free'),
	],
};

/** Navigation Arrow upsell — locked arrow styles, Show on Hover and the extra positions. */
export const PRO_NAVIGATION = {
	title: __('Guide Every Slide in Style', 'wp-carousel-free'),
	subtitle: __('Navigation that matches your design.', 'wp-carousel-free'),
	features: [
		__('All arrow styles', 'wp-carousel-free'),
		__('Show arrows on hover', 'wp-carousel-free'),
		__('6 more arrow positions', 'wp-carousel-free'),
	],
};

/** Ajax Pagination upsell — Load More, Infinite Scroll and the Number + Next/Previous style. */
export const PRO_AJAX_PAGINATION = {
	title: __('Load Content Your Way', 'wp-carousel-free'),
	subtitle: __('Let visitors see more without leaving the page.', 'wp-carousel-free'),
	features: [
		__('Load More button', 'wp-carousel-free'),
		__('Infinite scroll', 'wp-carousel-free'),
		__('Number + Next/Previous style', 'wp-carousel-free'),
	],
};

/** Thumbnails Area upsell — thumbnail position and width. */
export const PRO_THUMBNAILS_AREA = {
	title: __('Place Thumbnails Anywhere', 'wp-carousel-free'),
	subtitle: __('Fit the thumbnail strip to your layout.', 'wp-carousel-free'),
	features: [
		__('Thumbnail position control', 'wp-carousel-free'),
		__('Custom thumbnail width', 'wp-carousel-free'),
	],
};

/** Thumbnail upsell — thumb title, description and the active styles. */
export const PRO_THUMBNAIL = {
	title: __('Make Thumbnails Stand Out', 'wp-carousel-free'),
	subtitle: __('Richer thumbnails for clearer navigation.', 'wp-carousel-free'),
	features: [
		__('Thumbnail title & description', 'wp-carousel-free'),
		__('5 more active styles', 'wp-carousel-free'),
	],
};

/** Query Builder upsell — Post source. */
export const PRO_QUERY_BUILDER_POST = {
	title: __('Show Exactly the Right Posts', 'wp-carousel-free'),
	subtitle: __('Advanced filters and exclusions for every query.', 'wp-carousel-free'),
	features: [
		__('Filter by taxonomy, date & author', 'wp-carousel-free'),
		__('Exclude specific posts', 'wp-carousel-free'),
		__('Exclude the current post', 'wp-carousel-free'),
		__('Skip posts without a thumbnail', 'wp-carousel-free'),
	],
};

/** Query Builder upsell — Product source. */
export const PRO_QUERY_BUILDER_PRODUCT = {
	title: __('Show Exactly the Right Products', 'wp-carousel-free'),
	subtitle: __('Advanced filters and exclusions for every query.', 'wp-carousel-free'),
	features: [
		__('Filter by taxonomy & date', 'wp-carousel-free'),
		__('Best selling, top rated & on sale', 'wp-carousel-free'),
		__('Exclude specific products', 'wp-carousel-free'),
		__('Skip products without a thumbnail', 'wp-carousel-free'),
	],
};

/** Card Content upsell — arrangement and content-area controls. */
export const PRO_CARD_CONTENT_SETTINGS = {
	title: __('Arrange Content Your Way', 'wp-carousel-free'),
	subtitle: __('Full control over what shows and where.', 'wp-carousel-free'),
	features: [
		__('Drag-and-drop ordering', 'wp-carousel-free'),
		__('Description length control', 'wp-carousel-free'),
		__('Content area size & position', 'wp-carousel-free'),
	],
};

/** Click Actions upsell — Link, Both and the per-block lightbox and icon overrides. */
export const PRO_CLICK_ACTIONS = {
	title: __('Make Every Click Count', 'wp-carousel-free'),
	subtitle: __('Send visitors exactly where you want them.', 'wp-carousel-free'),
	features: [
		__('Link items to custom URLs', 'wp-carousel-free'),
		__('Lightbox + link together', 'wp-carousel-free'),
		__('Custom lightbox per carousel', 'wp-carousel-free'),
		__('Icon size, position & style', 'wp-carousel-free'),
	],
};

/** Image panel upsell — Image source. */
export const PRO_IMAGE_SIZE_PROTECTION = {
	title: __('Keep Your Images Safe & Sharp', 'wp-carousel-free'),
	subtitle: __('Protect your work and control how images load.', 'wp-carousel-free'),
	features: [
		__('Image preloader', 'wp-carousel-free'),
		__('Image & text watermark', 'wp-carousel-free'),
		__('Right-click protection', 'wp-carousel-free'),
		__('Custom aspect ratio', 'wp-carousel-free'),
	],
};

/** Image panel upsell — Post/Product sources: only sizing and filter effects are Pro there. */
export const PRO_IMAGE_POST_PRODUCT = {
	title: __('Make Every Image Look Its Best', 'wp-carousel-free'),
	subtitle: __('Fine-tune how featured images look.', 'wp-carousel-free'),
	features: [
		__('Custom aspect ratio', 'wp-carousel-free'),
		__('Blur & brightness filters', 'wp-carousel-free'),
		__('Contrast & saturation control', 'wp-carousel-free'),
		__('Hue rotation', 'wp-carousel-free'),
	],
};

/** Social Share upsell — Image source: per-image sharing overrides. */
export const PRO_SOCIAL_SHARE = {
	title: __('Let Visitors Share Your Work', 'wp-carousel-free'),
	subtitle: __('Turn every image into a chance to be shared.', 'wp-carousel-free'),
	features: [__('Choose share networks per image', 'wp-carousel-free')],
};

/** Social Share upsell — Video source: per-video sharing overrides. */
export const PRO_SOCIAL_SHARE_VIDEO = {
	title: __('Let Visitors Share Your Work', 'wp-carousel-free'),
	subtitle: __('Turn every video into a chance to be shared.', 'wp-carousel-free'),
	features: [__('Choose share networks per video', 'wp-carousel-free')],
};

/** Hover Animations upsell — the full premade effect list, Scale and Duration. */
export const PRO_HOVER_ANIMATION = {
	title: __('Hover Effects That Stand Out', 'wp-carousel-free'),
	subtitle: __('Turn every hover into a moment worth noticing.', 'wp-carousel-free'),
	features: [
		__('11 more premade effects', 'wp-carousel-free'),
		__('Image, overlay & content effects', 'wp-carousel-free'),
		__('Custom scale control', 'wp-carousel-free'),
		__('Adjustable animation duration', 'wp-carousel-free'),
	],
};

/** Item popup upsell — per-item sharing override. */
export const PRO_ITEM_SOCIAL_SHARE = {
	title: __('Personalize Every Item', 'wp-carousel-free'),
	subtitle: __('Fine-tune each item on its own.', 'wp-carousel-free'),
	features: [__('Choose share networks per item', 'wp-carousel-free')],
};

/** Plural block names for the locked panels' titles, by block type. */
const PRO_PANEL_BLOCK_NAMES = {
	'wp-carousel-pro/slider': __('Sliders', 'wp-carousel-free'),
	'wp-carousel-pro/thumbnails-slider': __('Sliders', 'wp-carousel-free'),
	'wp-carousel-pro/tiles': __('Tiles', 'wp-carousel-free'),
};

export const PRO_PANELS = {
	scheduling: {
		title: __('Visibility & Scheduling', 'wp-carousel-free'),
		noticeTitle: (blocks) =>
			/* translators: %s: plural block name, e.g. "Carousels". */
			sprintf(__('Show %s at the Right Time', 'wp-carousel-free'), blocks),
		subtitle: __('Control who sees your carousel and when.', 'wp-carousel-free'),
		features: [
			__('Public, private & password access', 'wp-carousel-free'),
			__('Schedule a start date & time', 'wp-carousel-free'),
			__('Auto-expire on an end date', 'wp-carousel-free'),
		],
	},
	motion: {
		title: __('Motion Effects', 'wp-carousel-free'),
		noticeTitle: (blocks) =>
			/* translators: %s: plural block name, e.g. "Carousels". */
			sprintf(__('Bring %s to Life', 'wp-carousel-free'), blocks),
		subtitle: __('Grab attention the moment visitors arrive.', 'wp-carousel-free'),
		features: [
			__('25+ entrance animations', 'wp-carousel-free'),
			__('Animate on entrance or scroll', 'wp-carousel-free'),
			__('Custom speed & delay', 'wp-carousel-free'),
			__('Per-device control', 'wp-carousel-free'),
		],
	},
};

/**
 * Plural block name for a locked panel's title.
 *
 * @param {string} blockName Full block type name.
 * @return {string} Translated plural name.
 */
export function getProPanelBlockName(blockName) {
	return PRO_PANEL_BLOCK_NAMES[blockName] || __('Carousels', 'wp-carousel-free');
}

/**
 * Teaser copy for a Pro block.
 *
 * @param {string} blockName Full block type name.
 * @return {Object|undefined} Teaser copy, or undefined when the block is Free.
 */
export function getProBlockInfo(blockName) {
	return PRO_BLOCKS[blockName];
}

/**
 * Demo page URL for a Pro block.
 *
 * @param {string} blockName Full block type name.
 * @return {string} Demo URL, or an empty string when there is none.
 */
export function getProBlockDemoLink(blockName) {
	const slug = PRO_BLOCKS[blockName]?.slug;
	return (slug && blockPreviewPanelLink[slug]) || '';
}
