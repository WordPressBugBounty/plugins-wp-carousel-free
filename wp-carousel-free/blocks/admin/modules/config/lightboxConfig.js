import { __ } from '@wordpress/i18n';

// LIGHTBOX_ICON_PRESETS / URL_ICON_PRESETS now live in
// blocks/components/lightboxIconGrid/presets.js (shared by admin + block grids).

export const LIGHTBOX_ICON_VISIBILITY_OPTIONS = [
	{ label: __('Always', 'wp-carousel-free'), value: 'always' },
	{ label: __('On Hover', 'wp-carousel-free'), value: 'hover' },
];

export const LIGHTBOX_ICON_POSITION_OPTIONS = [
	{ label: __('Top Left', 'wp-carousel-free'), value: 'top-left' },
	{ label: __('Top Right', 'wp-carousel-free'), value: 'top-right' },
	{ label: __('Center', 'wp-carousel-free'), value: 'center' },
	{ label: __('Bottom Left', 'wp-carousel-free'), value: 'bottom-left' },
	{ label: __('Bottom Right', 'wp-carousel-free'), value: 'bottom-right' },
];

export const LIGHTBOX_THEME_OPTIONS = [
	{ label: __('Light Theme', 'wp-carousel-free'), value: 'light' },
	{ label: __('Dark Theme', 'wp-carousel-free'), value: 'dark' },
	{ label: __('Auto', 'wp-carousel-free'), value: 'auto' },
	// { label: __( 'Custom', 'wp-carousel-free' ), value: 'custom' },
];

export const LIGHTBOX_TRANSITION_OPTIONS = [
	{ label: __('Zoom', 'wp-carousel-free'), value: 'zoom' },
	{ label: __('Fade', 'wp-carousel-free'), value: 'fade' },
	{ label: __('Slide', 'wp-carousel-free'), value: 'slide' },
	{ label: __('Circular', 'wp-carousel-free'), value: 'circular' },
	{ label: __('Tube', 'wp-carousel-free'), value: 'tube' },
	{ label: __('Zoom-In-Out', 'wp-carousel-free'), value: 'zoom-in-out' },
	{ label: __('Rotate', 'wp-carousel-free'), value: 'rotate' },
	{ label: __('None', 'wp-carousel-free'), value: 'none' },
];

export const LIGHTBOX_THUMBNAIL_OPTIONS = [
	{ label: __('Modern Thumbnails', 'wp-carousel-free'), value: 'modern' },
	{ label: __('Classic Thumbnails', 'wp-carousel-free'), value: 'classic' },
	{ label: __('Scrollable Thumbnails', 'wp-carousel-free'), value: 'scrollable' },
	{ label: __('No Thumbnails', 'wp-carousel-free'), value: 'none' },
];
