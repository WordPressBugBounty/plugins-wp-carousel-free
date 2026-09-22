/**
 * Panel Constants
 *
 * Centralized configuration for magic numbers, breakpoints, ranges,
 * and default values used across inspector panel controls.
 *
 * @module shared/config/panelConstants
 */

import { __ } from '@wordpress/i18n';

/**
 * Layout range controls for columns, gap, autoplay, etc.
 */
export const LAYOUT_RANGES = {
	/** Number of columns per row (responsive defaults) */
	columns: { min: 1, max: 12, default: { Desktop: 3, Tablet: 2, Mobile: 1 } },

	/** Gap between items in pixels (responsive defaults) */
	gap: { min: 0, max: 200, default: { Desktop: 20, Tablet: 20, Mobile: 10 } },

	/** Tiles-only horizontal gap (responsive defaults). Splits the legacy single-axis `gap`. */
	gapHorizontal: { min: 0, max: 200, default: { Desktop: 20, Tablet: 20, Mobile: 20 } },

	/** Tiles-only vertical gap (responsive defaults). Splits the legacy single-axis `gap`. */
	gapVertical: { min: 0, max: 200, default: { Desktop: 20, Tablet: 20, Mobile: 20 } },

	/** Tiles-only bento row height (`grid-auto-rows`). Fixed track height keeps multi-row spans proportional. */
	tileRowHeight: { min: 50, max: 1000, default: { Desktop: 220, Tablet: 220, Mobile: 220 } },

	/** Autoplay delay in milliseconds */
	autoplayDelay: { min: 500, max: 10000, step: 100, default: 3000 },

	/** Slide transition speed in milliseconds */
	transitionSpeed: { min: 100, max: 5000, step: 50, default: 500 },

	/** Number of slides to scroll per swipe (responsive defaults) */
	slidesToScroll: { min: 1, max: 10, default: { Desktop: 1, Tablet: 1, Mobile: 1 } },

	/** Ticker/marquee animation speed in milliseconds (higher = slower) */
	tickerSpeed: { min: 500, max: 30000, step: 100, default: 5000 },
};

/**
 * Legacy aliases for backward compatibility during migration.
 * These will be removed once all panels use the new structure.
 */
export const COLUMN_RANGE = LAYOUT_RANGES.columns;
export const GAP_RANGE = LAYOUT_RANGES.gap;
export const AUTOPLAY_DELAY_RANGE = LAYOUT_RANGES.autoplayDelay;
export const TRANSITION_SPEED_RANGE = LAYOUT_RANGES.transitionSpeed;
export const SLIDES_TO_SCROLL_RANGE = LAYOUT_RANGES.slidesToScroll;

/**
 * Responsive breakpoint values in pixels.
 * Matches the breakpoints used in dynamic CSS generation.
 */
export const BREAKPOINTS = {
	tablet: 1023,
	mobile: 599,
};

/**
 * Device type constants for responsive controls.
 */
export const DEVICE_TYPES = ['Desktop', 'Tablet', 'Mobile'];

/**
 * Content Animation options for the Slider / Thumbnails-Slider control. Free
 * renders None; every other entry is a locked `(Pro)` option SelectField draws
 * disabled and refuses to write.
 */
export const CONTENT_ANIMATIONS = [
	{ label: __('None', 'wp-carousel-free'), value: 'none' },
	{ label: __('Bounce', 'wp-carousel-free'), value: 'bounce', pro: true },
	{ label: __('Flash', 'wp-carousel-free'), value: 'flash', pro: true },
	{ label: __('Pulse', 'wp-carousel-free'), value: 'pulse', pro: true },
	{ label: __('Rubber Band', 'wp-carousel-free'), value: 'rubberBand', pro: true },
	{ label: __('Shake X', 'wp-carousel-free'), value: 'shakeX', pro: true },
	{ label: __('Shake Y', 'wp-carousel-free'), value: 'shakeY', pro: true },
	{ label: __('Head Shake', 'wp-carousel-free'), value: 'headShake', pro: true },
	{ label: __('Swing', 'wp-carousel-free'), value: 'swing', pro: true },
	{ label: __('Tada', 'wp-carousel-free'), value: 'tada', pro: true },
	{ label: __('Wobble', 'wp-carousel-free'), value: 'wobble', pro: true },
	{ label: __('Jello', 'wp-carousel-free'), value: 'jello', pro: true },
	{ label: __('Heart Beat', 'wp-carousel-free'), value: 'heartBeat', pro: true },
	{ label: __('Slide In Down', 'wp-carousel-free'), value: 'slideInDown', pro: true },
	{ label: __('Slide In Left', 'wp-carousel-free'), value: 'slideInLeft', pro: true },
	{ label: __('Slide In Right', 'wp-carousel-free'), value: 'slideInRight', pro: true },
	{ label: __('Slide In Up', 'wp-carousel-free'), value: 'slideInUp', pro: true },
	{ label: __('Back In Down', 'wp-carousel-free'), value: 'backInDown', pro: true },
	{ label: __('Back In Left', 'wp-carousel-free'), value: 'backInLeft', pro: true },
	{ label: __('Back In Right', 'wp-carousel-free'), value: 'backInRight', pro: true },
	{ label: __('Back In Up', 'wp-carousel-free'), value: 'backInUp', pro: true },
	{ label: __('Bounce In', 'wp-carousel-free'), value: 'bounceIn', pro: true },
	{ label: __('Bounce In Down', 'wp-carousel-free'), value: 'bounceInDown', pro: true },
	{ label: __('Bounce In Left', 'wp-carousel-free'), value: 'bounceInLeft', pro: true },
	{ label: __('Bounce In Right', 'wp-carousel-free'), value: 'bounceInRight', pro: true },
	{ label: __('Bounce In Up', 'wp-carousel-free'), value: 'bounceInUp', pro: true },
	{ label: __('Fade In', 'wp-carousel-free'), value: 'fadeIn', pro: true },
	{ label: __('Fade In Down', 'wp-carousel-free'), value: 'fadeInDown', pro: true },
	{ label: __('Fade In Left', 'wp-carousel-free'), value: 'fadeInLeft', pro: true },
	{ label: __('Fade In Right', 'wp-carousel-free'), value: 'fadeInRight', pro: true },
	{ label: __('Fade In Up', 'wp-carousel-free'), value: 'fadeInUp', pro: true },
	{ label: __('Flip In X', 'wp-carousel-free'), value: 'flipInX', pro: true },
	{ label: __('Light Speed In Right', 'wp-carousel-free'), value: 'lightSpeedInRight', pro: true },
	{ label: __('Light Speed In Left', 'wp-carousel-free'), value: 'lightSpeedInLeft', pro: true },
	{ label: __('Zoom In', 'wp-carousel-free'), value: 'zoomIn', pro: true },
	{ label: __('Zoom In Down', 'wp-carousel-free'), value: 'zoomInDown', pro: true },
	{ label: __('Zoom In Left', 'wp-carousel-free'), value: 'zoomInLeft', pro: true },
	{ label: __('Zoom In Right', 'wp-carousel-free'), value: 'zoomInRight', pro: true },
	{ label: __('Zoom In Up', 'wp-carousel-free'), value: 'zoomInUp', pro: true },
];
