/**
 * Canonical aspect-ratio option list shared by the Image and Video panels.
 *
 * One source keeps the two panels' labels, values, and ordering in lockstep —
 * they previously diverged (different members and order) and the Video list was
 * not translatable. Video exposes a subset via VIDEO_ASPECT_RATIO_VALUES.
 */

import { __ } from '@wordpress/i18n';

export const ASPECT_RATIOS = [
	{ label: __('Original', 'wp-carousel-free'), value: 'original' },
	{ label: __('1:1 (Square)', 'wp-carousel-free'), value: '1:1' },
	{ label: __('4:3', 'wp-carousel-free'), value: '4:3' },
	{ label: __('3:4 (Portrait)', 'wp-carousel-free'), value: '3:4' },
	{ label: __('16:9', 'wp-carousel-free'), value: '16:9' },
	{ label: __('9:16 (Portrait)', 'wp-carousel-free'), value: '9:16' },
	{ label: __('3:2', 'wp-carousel-free'), value: '3:2' },
	{ label: __('2:3 (Portrait)', 'wp-carousel-free'), value: '2:3' },
	{ label: __('21:9', 'wp-carousel-free'), value: '21:9' },
	{ label: __('Custom', 'wp-carousel-free'), value: 'custom' },
];

/** Values the Video panel exposes (subset of the canonical list). */
export const VIDEO_ASPECT_RATIO_VALUES = ['original', '16:9', '4:3', '1:1', '9:16', 'custom'];

/** Video panel option list, derived from the canonical list to stay in lockstep. */
export const VIDEO_ASPECT_RATIOS = ASPECT_RATIOS.filter((item) =>
	VIDEO_ASPECT_RATIO_VALUES.includes(item.value)
);
