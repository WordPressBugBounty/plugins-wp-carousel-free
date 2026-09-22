/**
 * Shared constants for the editor carousel preview (`CarouselRender`).
 * Changing class names or maps here may require `BlockRenderer.php` parity — prefer additive changes.
 */

/** Map content orientation value to CSS classes on the carousel root. */
export const ORIENTATION_CLASSES = {
	'image-top': '',
	overlay: 'detail-with-overlay',
	diagonal: 'detail-with-overlay overlay-curved',
};

/** Carousel styles that do not use variable-width slide sizing. */
export const VARIABLE_WIDTH_EXCLUDED_STYLES = new Set(['grid', 'panorama']);

/**
 * Swiper overlay/stack transitions that only work with one visible slide per transition.
 * With more than one slide visible at once, fade stacks slides and text overlaps during crossfade.
 */
export const SWIPER_SINGLE_SLIDE_EFFECTS = new Set(['flip', 'cube']);

/** Network keys saved in attributes → keys used in markup / icon map. */
export const SOCIAL_ALIASES = {
	twitter: 'x',
	email: 'mail',
	copy: 'clone',
	facebook: 'facebook-f',
	linkedin: 'linkedin-in',
};

/** Matches `block.json` defaults when `socialShareOptions.networks` is unset. */
export const DEFAULT_SOCIAL_NETWORKS = ['facebook-f', 'x', 'linkedin-in'];

/** Social network id → icon library slug (see `useIconList`). */
export const SOCIAL_ICON_KEYS = {
	'facebook-f': 'facebook-f',
	x: 'x-twitter',
	'linkedin-in': 'linkedin-in',
	pinterest: 'pinterest',
	mail: 'e-mail',
	instagram: 'instagram',
	vkontakte: 'vk',
	digg: 'digg',
	tumblr: 'tumblr',
	reddit: 'reddit',
	whatsapp: 'whatsapp',
	pocket: 'get-pocket',
	xing: 'xing',
	clone: 'clone',
};
