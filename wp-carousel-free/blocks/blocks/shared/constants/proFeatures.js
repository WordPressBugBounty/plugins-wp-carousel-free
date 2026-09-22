/**
 * Copy for every Pro teaser surface, in one place.
 *
 * PRO_BLOCKS keys the teaser placeholder by full block name; PRO_PANELS keys a
 * locked inspector panel by its panel id; PRO_CLICK_ACTIONS and PRO_SOCIAL_SHARE
 * are notices shown inside a panel whose Free controls stay usable. Demo links
 * come from `blockPreviewPanelLink` so a teaser and a live block never disagree.
 */

import { __ } from '@wordpress/i18n';
import { blockPreviewPanelLink } from '../../../controls/constants';

export const PRO_BLOCKS = {
	'wp-carousel-pro/marquee': {
		slug: 'marquee',
		title: __('Marquee', 'wp-carousel-free'),
		description: __(
			'Scroll images, posts and products in a continuous ticker. Available in WP Carousel Pro.',
			'wp-carousel-free'
		),
		previewNotice: __('Upgrade to scroll your content in a continuous marquee.', 'wp-carousel-free'),
		features: [
			__('Continuous horizontal and vertical scroll', 'wp-carousel-free'),
			__('Pause on hover and direction control', 'wp-carousel-free'),
			__('Variable-width items', 'wp-carousel-free'),
		],
	},
	'wp-carousel-pro/carousel-panorama': {
		slug: 'carousel-panorama',
		title: __('Panorama Carousel', 'wp-carousel-free'),
		description: __(
			'Show wide, cover-flow style slides with a mirrored reflection. Available in WP Carousel Pro.',
			'wp-carousel-free'
		),
		previewNotice: __('Upgrade to create immersive panoramic showcases.', 'wp-carousel-free'),
		features: [
			__('Panorama and cover-flow layouts', 'wp-carousel-free'),
			__('Adjustable reflection height and distance', 'wp-carousel-free'),
			__('Overlay, diagonal and content-box orientations', 'wp-carousel-free'),
		],
	},
};

/** Click Actions upsell — Link, Both and the per-block icon override. */
export const PRO_CLICK_ACTIONS = {
	message: __(
		'Enhance user interaction with advanced click actions and override global settings.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Social Share upsell — per-image sharing overrides are Pro-only. */
export const PRO_SOCIAL_SHARE = {
	message: __('Unlock individual image sharing options with WP Carousel Pro.', 'wp-carousel-free'),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Social Share panel upsell for the Video source — per-item sharing overrides are Pro-only there too. */
export const PRO_SOCIAL_SHARE_VIDEO = {
	message: __('Unlock individual video sharing options with WP Carousel Pro.', 'wp-carousel-free'),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Layouts panel upsell for the Slider block — premium sliding effects and content animations. */
export const PRO_SLIDER_LAYOUT = {
	message: __(
		'Unlock premium sliding effects and content animations to create more engaging sliders.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Layouts panel upsell for the Thumbnails Slider block — exclusive layouts and content animations. */
export const PRO_THUMBNAILS_SLIDER_LAYOUT = {
	message: __(
		'Unlock exclusive layouts and content animations to create more engaging sliders.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Layouts panel upsell for the Tiles block — Image source: exclusive layouts, custom layout controls, gallery filters and search. */
export const PRO_TILES_LAYOUT = {
	message: __(
		'Unlock exclusive layouts, custom layout controls, gallery filters and search to create more dynamic, engaging tiles.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Layouts panel upsell for the Tiles block — Post/Product source: Custom Layout and search are image-only, Category filtering instead. */
export const PRO_TILES_LAYOUT_POST_PRODUCT = {
	message: __(
		'Unlock exclusive layouts and category filters to create more dynamic, engaging tiles.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Layouts panel upsell for the Tiles block — Video source: no Custom Layout, filter or search there, only the layout presets are Pro. */
export const PRO_TILES_LAYOUT_VIDEO = {
	message: __(
		'Unlock exclusive layouts to create more dynamic, engaging tiles.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Per-item Social Share upsell — the video item popup's sharing override. */
export const PRO_ITEM_SOCIAL_SHARE = {
	message: __('Customize each video individually with sharing options.', 'wp-carousel-free'),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Thumbnails Slider upsell — thumb title, description and the 5 active styles. */
export const PRO_THUMBNAIL = {
	message: __(
		'Enhance thumbnails with titles, descriptions, and 6+ active styling for clearer navigation.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Ajax Pagination upsell — Load More and the Number + Next/Previous style. */
export const PRO_AJAX_PAGINATION = {
	message: __(
		'Unlock Load More, Infinite Scroll and the Number + Next/Previous display style.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Hover Animations upsell — Custom animation type and the full premade effect list. */
export const PRO_HOVER_ANIMATION = {
	message: __(
		'Unlock the full image, overlay and content effect libraries, plus Scale and Animation Duration on every axis.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Navigation Arrow upsell — locked arrow styles, Show on Hover and the Offset controls. */
export const PRO_NAVIGATION = {
	message: __(
		'Unlock all arrow styles, Show on Hover, and More Navigation Position Options for more flexible carousel navigation.',
		'wp-carousel-free'
	),
	linkText: __('Upgrade to Pro!', 'wp-carousel-free'),
};

/** Card Content Settings upsell — arrangement and content-area controls are Pro. */
export const PRO_CARD_CONTENT_SETTINGS = {
	title: __('Unlock Pro Features!', 'wp-carousel-free'),
	subtitle: __('Take total control of your content styling and arrangement:', 'wp-carousel-free'),
	features: [
		__('Drag-and-Drop Ordering', 'wp-carousel-free'),
		__('Description Length Control', 'wp-carousel-free'),
		__('Content Area Size & Position', 'wp-carousel-free'),
	],
};

/** Image Panel upsell for the Image source — Preloader, Watermark, Right Click Protection and Custom Aspect Ratio. */
export const PRO_IMAGE_SIZE_PROTECTION = {
	title: __('Unlock Pro Features!', 'wp-carousel-free'),
	subtitle: __('Unlock advanced image styling & protection:', 'wp-carousel-free'),
	features: [
		__('Image Preloader', 'wp-carousel-free'),
		__('Image & Text Watermark', 'wp-carousel-free'),
		__('Right Click Protection', 'wp-carousel-free'),
		__('Custom Aspect Ratio', 'wp-carousel-free'),
	],
	linkText: __('Upgrade to Pro', 'wp-carousel-free'),
};

/** Image Panel upsell for Post/Product sources — no Preloader/Watermark/Protection there, only sizing and filter effects are Pro. */
export const PRO_IMAGE_POST_PRODUCT = {
	title: __('Unlock Pro Features!', 'wp-carousel-free'),
	subtitle: __('Unlock advanced image styling for your posts & products:', 'wp-carousel-free'),
	features: [
		__('Custom Aspect Ratio', 'wp-carousel-free'),
		__('Blur & Brightness Filters', 'wp-carousel-free'),
		__('Contrast & Saturation Control', 'wp-carousel-free'),
		__('Hue Rotation Effect', 'wp-carousel-free'),
	],
	linkText: __('Upgrade to Pro', 'wp-carousel-free'),
};

/** Query Builder upsell — advanced filters and exclusion controls are Pro. */
export const PRO_QUERY_BUILDER_POST = {
	title: __('Unlock Pro Features!', 'wp-carousel-free'),
	subtitle: __('Narrow down your query with advanced filters and exclusions:', 'wp-carousel-free'),
	features: [
		__('Filter by Taxonomy', 'wp-carousel-free'),
		__('Filter by Date Range', 'wp-carousel-free'),
		__('Filter by Author', 'wp-carousel-free'),
		__('Exclude Post', 'wp-carousel-free'),
		__('Exclude Current Posts', 'wp-carousel-free'),
		__('Exclude Post without Thumb', 'wp-carousel-free'),
	],
	linkText: __('Upgrade to Pro', 'wp-carousel-free'),
};

/** Query Builder upsell for the Product source — same card, product-specific filters. */
export const PRO_QUERY_BUILDER_PRODUCT = {
	title: __('Unlock Pro Features!', 'wp-carousel-free'),
	subtitle: __('Narrow down your query with advanced filters and exclusions:', 'wp-carousel-free'),
	features: [
		__('Filter by Taxonomy', 'wp-carousel-free'),
		__('Filter by Date Range', 'wp-carousel-free'),
		__('Best Selling', 'wp-carousel-free'),
		__('Top Rated', 'wp-carousel-free'),
		__('On Sale', 'wp-carousel-free'),
		__('Exclude Products', 'wp-carousel-free'),
		__('Exclude Product without Thumb', 'wp-carousel-free'),
	],
	linkText: __('Upgrade to Pro', 'wp-carousel-free'),
};

export const PRO_PANELS = {
	scheduling: {
		title: __('Visibility & Scheduling', 'wp-carousel-free'),
		subtitle: __(
			'Control access and scheduling with advanced customization options.',
			'wp-carousel-free'
		),
		features: [
			__('Public Visibility Control', 'wp-carousel-free'),
			__('Password Protected Access', 'wp-carousel-free'),
			__('Private Visibility Control', 'wp-carousel-free'),
			__('Scheduling with Start Date and Time', 'wp-carousel-free'),
			__('End Date with Automatic Expiration', 'wp-carousel-free'),
		],
	},
	motion: {
		title: __('Motion Effects', 'wp-carousel-free'),
		subtitle: __('Make your content stand out with smooth entrance animations.', 'wp-carousel-free'),
		features: [
			__('60+ Entrance Animation Effects', 'wp-carousel-free'),
			__('Adjustable Animation Speed', 'wp-carousel-free'),
			__('Custom Animation Delay Control', 'wp-carousel-free'),
			__('Fine-tuned Timing Settings', 'wp-carousel-free'),
		],
	},
};

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
