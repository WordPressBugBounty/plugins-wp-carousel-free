import { __ } from '@wordpress/i18n';
import {
	CarouselIcon,
	SliderIcon,
	ThumbnailIcon,
	TilesIcon,
	PanoramaIcon,
	MarqueeIcon,
	Carousel3DIcon,
	GridIcon,
} from './icons';

// Announced but unreleased on both Free and Pro. Listed so the page can show
// what is coming; they are client-side only — the server never sends them and
// its slug allow-list would reject them, so a card here can never be toggled
// or persisted.
export const upcomingBlocks = ['carousel-3d', 'grid'];

// Blocks whose Demo link opens the Ready Patterns Library filtered to that block.
// Mirrors BLOCK_NAME_TO_CATEGORY — a slug with no library category has nothing to
// filter by, so its card shows no Demo link at all.
export const showcaseBlocks = [
	'carousel',
	'slider',
	'thumbnails-slider',
	'tiles',
	'marquee',
	'carousel-panorama',
];

// Presentation metadata only. Which blocks exist, and whether each is Free or a
// Pro teaser, is decided by the PHP registry (Dashboard::get_block_visibility_list)
// and arrives with the dashboard options.
export const carouselBlocksInfo = {
	carousel: {
		icon: <CarouselIcon />,
		title: __('Carousel', 'wp-carousel-free'),
		description: __(
			'Create beautiful image carousels with customizable navigation and pagination.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/carousel',
	},
	slider: {
		icon: <SliderIcon />,
		title: __('Slider', 'wp-carousel-free'),
		description: __(
			'Build responsive content sliders with smooth transitions and touch support.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/slider',
	},
	'thumbnails-slider': {
		icon: <ThumbnailIcon />,
		title: __('Thumbnails Slider', 'wp-carousel-free'),
		description: __('Display image galleries with thumbnail navigation.', 'wp-carousel-free'),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/thumbnails-slider',
	},
	tiles: {
		icon: <TilesIcon />,
		title: __('Tiles', 'wp-carousel-free'),
		description: __(
			'Show content in a grid layout with hover effects and animations.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/tiles',
	},
	marquee: {
		icon: <MarqueeIcon />,
		title: __('Marquee', 'wp-carousel-free'),
		description: __(
			'Display continuously scrolling content in a ticker-style marquee.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/marquee',
	},
	'carousel-panorama': {
		icon: <PanoramaIcon />,
		title: __('Panorama Carousel', 'wp-carousel-free'),
		description: __('Display panoramic images with smooth 360-degree rotation.', 'wp-carousel-free'),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/carousel-panorama',
	},

	'carousel-3d': {
		icon: <Carousel3DIcon />,
		title: __('3D Carousel', 'wp-carousel-free'),
		description: __(
			'Create stunning 3D carousel effects with perspective and depth.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/carousel-3d',
	},
	grid: {
		icon: <GridIcon />,
		title: __('Grid', 'wp-carousel-free'),
		description: __('Display content in a responsive grid layout.', 'wp-carousel-free'),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/tiles',
	},
};
