/**
 * Editor mirror of `src/Blocks/Schema/AllowedValues.php`.
 *
 * The PHP side is the enforcement boundary — it snaps every constrained nested
 * key on read, so a Pro value can never reach a render branch. This module is
 * the editor half of the same contract: it keeps the inspector selection and
 * the preview showing the value the frontend will actually render, and feeds
 * `useFreeLayoutGuard` so a block saved in Pro rewrites its attribute instead
 * of sitting on a choice Free cannot draw.
 *
 * Keep this module free of @wordpress/* imports — Node CI scripts load it via
 * `await import(...)` without a WordPress runtime.
 */

/** Content orientations Free renders for the carousel family. */
export const CONTENT_ORIENTATIONS = ['image-top', 'overlay', 'diagonal'];

/** Content orientations Free renders for the one-slide blocks — Classic has no place here. */
export const SLIDER_CONTENT_ORIENTATIONS = ['overlay', 'diagonal'];

/** Slider block styles Free renders. */
export const SLIDER_LAYOUTS = ['slide', 'flip', 'coverflow', 'cube'];

/** Thumbnails Slider layouts Free renders. */
export const THUMBS_LAYOUTS = ['strip'];

/** Thumb-strip positions Free renders — Top, Left and Right are Pro. */
export const THUMBS_AREA_POSITIONS = ['bottom'];

/** Active thumbnail styles Free renders — Default only. */
export const THUMBNAIL_ACTIVE_STYLES = ['none'];

/** Tile layout presets Free renders. */
export const TILE_LAYOUTS = ['one', 'two', 'three'];

/** Navigation arrow styles Free renders — the first preset only. */
export const ARROW_STYLES = ['chevron-solid'];

/** Navigation arrow positions Free renders — the three side presets. */
export const NAV_POSITIONS = [
	'nav-vertical-center-inner',
	'nav-vertically-inner-and-outer',
	'nav-vertical-center',
];

/** Click action types Free renders — Link and Both are Pro. */
export const CLICK_ACTION_TYPES = ['lightbox', 'disable'];

/** Pagination styles Free renders — Scrollbar is Pro. */
export const PAGINATION_STYLES = ['dots', 'dynamic', 'stepper'];

/** Display orientations Free renders — Vertical is Pro. */
export const DISPLAY_STYLES = ['horizontal'];

/** Post/video family title and description length modes Free renders — Limited is Pro. */
export const TITLE_LENGTHS = ['full'];
export const EXCERPT_LENGTHS = ['full'];

/** Query filters Free applies — Latest only; every other filter is Pro. */
export const QUERY_FILTERS = ['latest'];

/** `queryOptions` keys only the Pro taxonomy filter writes. */
export const PRO_TAXONOMY_KEYS = ['taxonomySlug', 'taxonomyTermIds', 'taxonomyOperator'];

/** Hover-animation modes Free renders — both, each with a trimmed effect list. */
export const EFFECT_TYPES = ['premade', 'custom'];

/** Premade hover animations Free renders — the Move transforms. */
export const ANIMATION_EFFECTS = ['none', 'move-left', 'move-right', 'move-top', 'move-bottom'];

/** Custom-mode Image Hover effects Free renders — Zoom In and Zoom Out. */
export const IMAGE_HOVER_EFFECTS = ['none', 'zoom', 'zoom-out'];

/** Custom-mode Overlay effects Free renders — Zoom Out and Zoom In. */
export const OVERLAY_EFFECTS = ['none', 'zoomOut', 'zoomInCenter'];

/** Custom-mode Content effects Free renders — the four Zoom In reveals. */
export const CONTENT_EFFECTS = ['none', 'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight'];

/** Scale and Animation Duration are Pro on every axis, so Free stores neither. */
export const PRO_EFFECT_KEYS = [
	'animationDuration',
	'imageHoverScale',
	'hoverDuration',
	'overlayDuration',
	'contentDuration',
];

/** Carousel styles Free renders — `grid` and `thumbnails` are the Tiles and Thumbnails Slider defaults. */
export const CAROUSEL_STYLES = ['standard', 'center', 'grid', 'thumbnails'];

/** Slide transitions Free renders — Fade, Coverflow and Ken Burns are Pro. */
export const EFFECTS = ['slide', 'flip', 'cube'];

/** Image aspect ratios Free renders — Custom is Pro. */
export const IMAGE_ASPECT_RATIOS = [
	'original',
	'1:1',
	'4:3',
	'3:4',
	'16:9',
	'9:16',
	'3:2',
	'2:3',
	'21:9',
];

/** Taxonomy types Free renders — Both is Pro. */
export const TAXONOMY_TYPES = ['category', 'tag'];

/** Taxonomy display positions Free renders — Over The Thumb is Pro. */
export const TAXONOMY_POSITIONS = ['', 'beside-meta'];

/** Meta separators Free renders — Dash, Pipe, Slash and Back Slash are Pro. */
export const META_SEPARATORS = ['bullet', 'none'];

/** Ajax pagination types Free renders — Load More and Infinite Scroll are Pro. */
export const PAGINATION_TYPES = ['number'];

/** Ajax pagination number display styles Free renders — Number + Next/Previous is Pro. */
export const PAGINATION_NUMBER_STYLES = ['number'];

/** `paginationOptions` keys only Pro's Load More and Number + Next/Previous write. */
export const PRO_AJAX_PAGINATION_KEYS = [
	'infiniteScroll',
	'loadMoreAlignment',
	'loadMoreText',
	'endingMessage',
	'showPrevNext',
	'showPrevNextText',
	'prevNextIconEnabled',
	'prevNextIcon',
	'iconSize',
];

/** `videoOptions` keys only Pro's inline player and Play Icon Position write. */
export const PRO_VIDEO_KEYS = [
	'playMode',
	'iconPosition',
	'iconOffset',
	'videoAutoplay',
	'playOnHover',
	'videoLoop',
	'playbackControls',
];

/**
 * The content orientations a block offers.
 *
 * @param {string} blockName Block name attribute.
 * @return {string[]} Allowed orientation values, most-default first.
 */
export const contentOrientationsForBlock = (blockName) =>
	['slider', 'thumbnails-slider'].includes(String(blockName || '').toLowerCase())
		? SLIDER_CONTENT_ORIENTATIONS
		: CONTENT_ORIENTATIONS;

/**
 * The orientation a rejected value lands on.
 *
 * The Thumbnails Slider offers Overlay and Diagonal; Diagonal took Classic's
 * slot, so a block saved on Classic — or on a Pro orientation — resolves there.
 *
 * @param {string}   blockName Block name attribute.
 * @param {string[]} allowed   The block's allowed orientations.
 * @return {string} A Free content orientation.
 */
export const contentOrientationFallback = (blockName, allowed) =>
	'thumbnails-slider' === String(blockName || '').toLowerCase() ? 'diagonal' : allowed[0];

const pick = (value, allowed, fallback) =>
	allowed.includes(String(value || '').toLowerCase()) ? String(value).toLowerCase() : fallback;

// The effect enums are camelCase, so they need a case-sensitive match.
const pickExact = (value, allowed, fallback) =>
	allowed.includes(String(value || '').trim()) ? String(value).trim() : fallback;

/**
 * Resolve a Slider block style.
 *
 * @param {*} value Saved `layoutOptions.sliderLayout`.
 * @return {string} A Free slider style.
 */
export const resolveSliderLayout = (value) => pick(value, SLIDER_LAYOUTS, 'slide');

/**
 * Resolve a content orientation against the block that owns it.
 *
 * @param {*}      value     Saved `layoutOptions.contentOrientation`.
 * @param {string} blockName Block name attribute.
 * @return {string} A Free content orientation.
 */
export const resolveContentOrientationValue = (value, blockName) => {
	const allowed = contentOrientationsForBlock(blockName);
	return pick(value, allowed, contentOrientationFallback(blockName, allowed));
};

/**
 * Resolve a Thumbnails Slider layout.
 *
 * @param {*} value Saved `layoutOptions.thumbsLayout`.
 * @return {string} A Free thumbnails layout.
 */
export const resolveThumbsLayout = (value) => pick(value, THUMBS_LAYOUTS, 'strip');

/**
 * Resolve a thumb-strip position.
 *
 * @param {*} value Saved `thumbsArea.position`.
 * @return {string} A Free thumb-strip position.
 */
export const resolveThumbsAreaPosition = (value) => pick(value, THUMBS_AREA_POSITIONS, 'bottom');

/**
 * Resolve an active thumbnail style.
 *
 * @param {*} value Saved `thumbnail.activeStyle`.
 * @return {string} A Free active thumbnail style.
 */
export const resolveThumbnailActiveStyle = (value) => pick(value, THUMBNAIL_ACTIVE_STYLES, 'none');

/**
 * Resolve a Tiles preset.
 *
 * @param {*} value Saved `layoutOptions.tileLayout`.
 * @return {string} A Free tile layout.
 */
export const resolveTileLayout = (value) => pick(value, TILE_LAYOUTS, 'one');

/**
 * Resolve a navigation arrow style.
 *
 * @param {*} value Saved `navigationOptions.arrowStyle`.
 * @return {string} A Free arrow style.
 */
export const resolveArrowStyle = (value) => pick(value, ARROW_STYLES, 'chevron-solid');

/**
 * Resolve a navigation arrow position.
 *
 * @param {*}      value    Saved `navigationOptions.position`.
 * @param {string} fallback The block's schema default position.
 * @return {string} A Free arrow position.
 */
export const resolveNavPosition = (value, fallback = 'nav-vertical-center') =>
	pick(value, NAV_POSITIONS, fallback);

/**
 * Resolve a pagination style.
 *
 * @param {*} value Saved `paginationDotsOptions.paginationStyle`.
 * @return {string} A Free pagination style.
 */
export const resolvePaginationStyle = (value) => pick(value, PAGINATION_STYLES, 'dots');

/**
 * The block's schema default arrow position.
 *
 * @param {string} blockName Block name attribute.
 * @return {string} Navigation position preset key.
 */
export const defaultNavPosition = (blockName) =>
	'thumbnails-slider' === blockName ? 'nav-vertical-center-inner' : 'nav-vertical-center';

/**
 * Resolve a click action type.
 *
 * @param {*} value Saved `clickActionOptions.type`.
 * @return {string} A Free click action type.
 */
export const resolveClickActionType = (value) => pick(value, CLICK_ACTION_TYPES, 'lightbox');

/**
 * Resolve a display style.
 *
 * @param {*} value Saved `layoutOptions.displayStyle`.
 * @return {string} A Free display style.
 */
export const resolveDisplayStyle = (value) => pick(value, DISPLAY_STYLES, 'horizontal');

/**
 * Resolve a post/video family title length mode.
 *
 * @param {*} value Saved `postContentOptions.titleLength`.
 * @return {string} A Free title length mode.
 */
export const resolveTitleLength = (value) => pick(value, TITLE_LENGTHS, 'full');

/**
 * Resolve a post/video family description length mode.
 *
 * @param {*} value Saved `postContentOptions.excerptLength`.
 * @return {string} A Free description length mode.
 */
export const resolveExcerptLength = (value) => pick(value, EXCERPT_LENGTHS, 'full');

/**
 * The carousel style a rejected value lands on.
 *
 * Tiles and the Thumbnails Slider ship their own style, so a rejected Pro
 * style there must not land on the carousel's `standard` — that would drop a
 * Tiles block to a single-row carousel and strip the strip off the Thumbnails
 * Slider. Mirrors `AllowedValues::carousel_style_fallback()`.
 *
 * @param {string} blockName Block name attribute.
 * @return {string} A Free carousel style.
 */
export const carouselStyleFallback = (blockName) => {
	const name = String(blockName || '').toLowerCase();
	if ('tiles' === name) {
		return 'grid';
	}
	return 'thumbnails-slider' === name ? 'thumbnails' : 'standard';
};

/**
 * Resolve a carousel style against the block that owns it.
 *
 * @param {*}      value     Saved `layoutOptions.carouselStyle`.
 * @param {string} blockName Block name attribute.
 * @return {string} A Free carousel style.
 */
export const resolveCarouselStyle = (value, blockName) =>
	pick(value, CAROUSEL_STYLES, carouselStyleFallback(blockName));

/**
 * Resolve a slide transition.
 *
 * @param {*} value Saved `sliderOptions.effect`.
 * @return {string} A Free slide transition.
 */
export const resolveSliderEffect = (value) => pick(value, EFFECTS, 'slide');

/**
 * The block's schema default image aspect ratio.
 *
 * Slider's stage-level aspect box defaults to `original`; every other block's
 * per-item box defaults to `4:3`. Mirrors `AllowedValues`' private
 * `default_image_aspect_ratio()`.
 *
 * @param {string} blockName Block name attribute.
 * @return {string} An aspect ratio preset key.
 */
export const defaultImageAspectRatio = (blockName) =>
	'slider' === String(blockName || '') ? 'original' : '4:3';

/**
 * Resolve an image aspect ratio against the block that owns it.
 *
 * @param {*}      value     Saved `imageOptions.aspectRatio`.
 * @param {string} blockName Block name attribute.
 * @return {string} A Free aspect ratio.
 */
export const resolveImageAspectRatio = (value, blockName) =>
	pick(value, IMAGE_ASPECT_RATIOS, defaultImageAspectRatio(blockName));

/**
 * Resolve a taxonomy type.
 *
 * @param {*} value Saved `taxonomyOptions.type`.
 * @return {string} A Free taxonomy type.
 */
export const resolveTaxonomyType = (value) => pick(value, TAXONOMY_TYPES, 'category');

/**
 * Resolve a taxonomy display position.
 *
 * @param {*} value Saved `taxonomyOptions.position`.
 * @return {string} A Free taxonomy position.
 */
export const resolveTaxonomyPosition = (value) => pick(value, TAXONOMY_POSITIONS, '');

/**
 * Resolve a meta separator.
 *
 * @param {*} value Saved `metaOptions.separator`.
 * @return {string} A Free meta separator.
 */
export const resolveMetaSeparator = (value) => pick(value, META_SEPARATORS, 'bullet');

/**
 * Resolve an Ajax pagination type.
 *
 * @param {*} value Saved `paginationOptions.type`.
 * @return {string} A Free Ajax pagination type.
 */
export const resolvePaginationType = (value) => pick(value, PAGINATION_TYPES, 'number');

/**
 * Resolve an Ajax pagination number display style.
 *
 * @param {*} value Saved `paginationOptions.numberDisplayStyle`.
 * @return {string} A Free number display style.
 */
export const resolvePaginationNumberStyle = (value) =>
	pick(value, PAGINATION_NUMBER_STYLES, 'number');

const RESOLVERS = {
	sliderLayout: resolveSliderLayout,
	thumbsLayout: resolveThumbsLayout,
	tileLayout: resolveTileLayout,
	displayStyle: resolveDisplayStyle,
};

/**
 * The `layoutOptions` keys whose saved value is not a Free value.
 *
 * Absent keys stay absent — writing one would change a block that never set
 * it. Returns an empty object when nothing needs correcting, so the caller can
 * skip the `setAttributes` entirely.
 *
 * @param {Object} layoutOptions Saved `layoutOptions`.
 * @param {string} blockName     Block name attribute, for the orientation list.
 * @return {Object} Corrections to merge, keyed by attribute name.
 */
export function getFreeLayoutCorrections(layoutOptions = {}, blockName = '') {
	const corrections = Object.keys(RESOLVERS).reduce((acc, key) => {
		if (undefined === layoutOptions[key]) {
			return acc;
		}
		const resolved = RESOLVERS[key](layoutOptions[key]);
		if (resolved !== layoutOptions[key]) {
			acc[key] = resolved;
		}
		return acc;
	}, {});

	if (undefined !== layoutOptions.carouselStyle) {
		const resolved = resolveCarouselStyle(layoutOptions.carouselStyle, blockName);
		if (resolved !== layoutOptions.carouselStyle) {
			corrections.carouselStyle = resolved;
		}
	}

	if (undefined !== layoutOptions.contentOrientation) {
		const resolved = resolveContentOrientationValue(layoutOptions.contentOrientation, blockName);
		if (resolved !== layoutOptions.contentOrientation) {
			corrections.contentOrientation = resolved;
		}
	}

	return corrections;
}

/**
 * The `navigationOptions` keys whose saved value is not a Free value.
 *
 * @param {Object} navigationOptions Saved `navigationOptions`.
 * @param {string} blockName         Block name attribute, for the position default.
 * @return {Object} Corrections to merge, keyed by attribute name.
 */
export function getFreeNavigationCorrections(navigationOptions = {}, blockName = '') {
	const corrections = {};
	if (undefined !== navigationOptions.arrowStyle) {
		const resolved = resolveArrowStyle(navigationOptions.arrowStyle);
		if (resolved !== navigationOptions.arrowStyle) {
			corrections.arrowStyle = resolved;
		}
	}
	if (undefined !== navigationOptions.position) {
		const resolved = resolveNavPosition(navigationOptions.position, defaultNavPosition(blockName));
		if (resolved !== navigationOptions.position) {
			corrections.position = resolved;
		}
	}
	return corrections;
}

/**
 * The `paginationDotsOptions` keys whose saved value is not a Free value.
 *
 * @param {Object} paginationDotsOptions Saved `paginationDotsOptions`.
 * @return {Object} Corrections to merge, keyed by attribute name.
 */
export function getFreePaginationCorrections(paginationDotsOptions = {}) {
	if (undefined === paginationDotsOptions.paginationStyle) {
		return {};
	}
	const resolved = resolvePaginationStyle(paginationDotsOptions.paginationStyle);
	return resolved === paginationDotsOptions.paginationStyle ? {} : { paginationStyle: resolved };
}

/**
 * The `clickActionOptions` keys whose saved value is not a Free value.
 *
 * Override Global Settings is Pro, so the flag is dropped rather than
 * rewritten — Free has no reader for it and no control that can set it.
 *
 * @param {Object} clickActionOptions Saved `clickActionOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeClickActionCorrections(clickActionOptions = {}) {
	const corrections = {};
	if (undefined !== clickActionOptions.type) {
		const resolved = resolveClickActionType(clickActionOptions.type);
		if (resolved !== clickActionOptions.type) {
			corrections.type = resolved;
		}
	}
	if (undefined !== clickActionOptions.overrideGlobal) {
		corrections.overrideGlobal = undefined;
	}
	return corrections;
}

/**
 * The `sliderOptions` keys whose saved value is not a Free value.
 *
 * Adaptive Height and every Content Animation other than None are Pro —
 * mirrors `AllowedValues::project()`'s `sliderOptions` branch.
 *
 * @param {Object} sliderOptions Saved `sliderOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeSliderCorrections(sliderOptions = {}) {
	const corrections = {};
	if (undefined !== sliderOptions.effect) {
		const resolved = resolveSliderEffect(sliderOptions.effect);
		if (resolved !== sliderOptions.effect) {
			corrections.effect = resolved;
		}
	}
	if (sliderOptions.adaptiveHeight) {
		corrections.adaptiveHeight = false;
	}
	// PHP drops both keys rather than rewriting them, so drop them here too —
	// a stored `none` and an absent key must not read differently.
	if (undefined !== sliderOptions.contentAnimation) {
		corrections.contentAnimation = undefined;
	}
	if (undefined !== sliderOptions.contentAnimationDuration) {
		corrections.contentAnimationDuration = undefined;
	}
	return corrections;
}

/**
 * The `postContentOptions` keys whose saved value is not a Free value.
 *
 * Title Length Limit, Description Length Limit and the Read More button's
 * Show Icon are Pro for the post/video family — mirrors
 * `AllowedValues::project()`'s `postContentOptions` branch.
 *
 * @param {Object} postContentOptions Saved `postContentOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreePostContentCorrections(postContentOptions = {}) {
	const corrections = {};
	if (undefined !== postContentOptions.titleLength) {
		const resolved = resolveTitleLength(postContentOptions.titleLength);
		if (resolved !== postContentOptions.titleLength) {
			corrections.titleLength = resolved;
		}
	}
	if (undefined !== postContentOptions.excerptLength) {
		const resolved = resolveExcerptLength(postContentOptions.excerptLength);
		if (resolved !== postContentOptions.excerptLength) {
			corrections.excerptLength = resolved;
		}
	}
	if (postContentOptions.showIcon) {
		corrections.showIcon = false;
	}
	if (postContentOptions.showIconHover) {
		corrections.showIconHover = false;
	}
	return corrections;
}

/**
 * The `productContentOptions` keys whose saved value is not a Free value.
 *
 * Title Length Limit, Description Length Limit and Show Cart Icon are Pro
 * for the product source — mirrors `AllowedValues::project()`'s
 * `productContentOptions` branch.
 *
 * @param {Object} productContentOptions Saved `productContentOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeProductContentCorrections(productContentOptions = {}) {
	const corrections = {};
	if (undefined !== productContentOptions.titleLength) {
		const resolved = resolveTitleLength(productContentOptions.titleLength);
		if (resolved !== productContentOptions.titleLength) {
			corrections.titleLength = resolved;
		}
	}
	if (undefined !== productContentOptions.excerptLimit) {
		const resolved = resolveExcerptLength(productContentOptions.excerptLimit);
		if (resolved !== productContentOptions.excerptLimit) {
			corrections.excerptLimit = resolved;
		}
	}
	if (productContentOptions.showCartIcon) {
		corrections.showCartIcon = false;
	}
	return corrections;
}

/**
 * The `contentAreaOptions` keys whose saved value is not a Free value.
 *
 * Zigzag Orientation is Pro — mirrors `AllowedValues::project()`'s
 * `contentAreaOptions` branch.
 *
 * @param {Object} contentAreaOptions Saved `contentAreaOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeContentAreaCorrections(contentAreaOptions = {}) {
	return contentAreaOptions.zigZag ? { zigZag: false } : {};
}

/**
 * The `thumbsArea` keys whose saved value is not a Free value.
 *
 * Thumb Area Width is Pro, along with the side-strip width and vertical
 * alignment that only apply to a Top/Left/Right strip. Strip alignment goes
 * with them: at the fixed 100% width there is no slack to align into — mirrors
 * `AllowedValues::project()`'s `thumbsArea` branch.
 *
 * @param {Object} thumbsArea Saved `thumbsArea`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeThumbsAreaCorrections(thumbsArea = {}) {
	const corrections = {};
	if (undefined !== thumbsArea.position) {
		const resolved = resolveThumbsAreaPosition(thumbsArea.position);
		if (resolved !== thumbsArea.position) {
			corrections.position = resolved;
		}
	}
	const proKeys = [
		'width',
		'widthTablet',
		'widthMobile',
		'widthUnit',
		'sideThumbAreaWidth',
		'verticalAlign',
		'alignment',
	];
	for (const key of proKeys) {
		if (undefined !== thumbsArea[key]) {
			corrections[key] = undefined;
		}
	}
	return corrections;
}

/**
 * The `thumbnail` keys whose saved value is not a Free value.
 *
 * Thumb Title, Thumb Description and every active style but Default are Pro.
 * The text styling that hung off the title/description and the four Pro
 * active-style option bags go with them — mirrors `AllowedValues::project()`'s
 * `thumbnail` branch.
 *
 * @param {Object} thumbnail Saved `thumbnail`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeThumbnailCorrections(thumbnail = {}) {
	const corrections = {};
	if (undefined !== thumbnail.activeStyle) {
		const resolved = resolveThumbnailActiveStyle(thumbnail.activeStyle);
		if (resolved !== thumbnail.activeStyle) {
			corrections.activeStyle = resolved;
		}
	}
	const proKeys = [
		'thumbnailTitle',
		'thumbnailDescription',
		'descriptionWordLimit',
		'descriptionLengthUnit',
		'contentImageGap',
		'contentImageGapTablet',
		'contentImageGapMobile',
		'title',
		'description',
		'contentAreaOptions',
		'indicator',
		'halfOverlay',
		'countdown',
	];
	for (const key of proKeys) {
		if (undefined !== thumbnail[key]) {
			corrections[key] = undefined;
		}
	}
	return corrections;
}

/**
 * Resolve a hover-animation mode.
 *
 * @param {*} value Saved `effectsOptions.effectType`.
 * @return {string} A Free effect type.
 */
export const resolveEffectType = (value) => pick(value, EFFECT_TYPES, 'premade');

/**
 * Resolve a premade hover animation.
 *
 * @param {*} value Saved `effectsOptions.animationEffect`.
 * @return {string} A Free premade animation.
 */
export const resolveAnimationEffect = (value) => pick(value, ANIMATION_EFFECTS, 'none');

/**
 * Resolve a Custom-mode Image Hover effect.
 *
 * @param {*} value Saved `effectsOptions.imageHover`.
 * @return {string} A Free image hover effect.
 */
export const resolveImageHover = (value) => pick(value, IMAGE_HOVER_EFFECTS, 'zoom');

/**
 * Resolve a Custom-mode Overlay effect.
 *
 * @param {*} value Saved `effectsOptions.overlayEffect`.
 * @return {string} A Free overlay effect.
 */
export const resolveOverlayEffect = (value) => pickExact(value, OVERLAY_EFFECTS, 'none');

/**
 * Resolve a Custom-mode Content effect.
 *
 * @param {*} value Saved `effectsOptions.contentAnimation`.
 * @return {string} A Free content effect.
 */
export const resolveContentEffect = (value) => pickExact(value, CONTENT_EFFECTS, 'zoomIn');

const EFFECT_RESOLVERS = {
	effectType: resolveEffectType,
	animationEffect: resolveAnimationEffect,
	imageHover: resolveImageHover,
	overlayEffect: resolveOverlayEffect,
	contentAnimation: resolveContentEffect,
};

/**
 * The `effectsOptions` keys whose saved value is not a Free value.
 *
 * Scale and Animation Duration are Pro on every axis, so those keys are
 * dropped rather than rewritten — Free emits no custom property for either.
 * Mirrors `AllowedValues::project()`'s `effectsOptions` branch.
 *
 * @param {Object} effectsOptions Saved `effectsOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeEffectsCorrections(effectsOptions = {}) {
	const corrections = Object.keys(EFFECT_RESOLVERS).reduce((acc, key) => {
		if (undefined === effectsOptions[key]) {
			return acc;
		}
		const resolved = EFFECT_RESOLVERS[key](effectsOptions[key]);
		if (resolved !== effectsOptions[key]) {
			acc[key] = resolved;
		}
		return acc;
	}, {});

	for (const key of PRO_EFFECT_KEYS) {
		if (undefined !== effectsOptions[key]) {
			corrections[key] = undefined;
		}
	}

	return corrections;
}

/**
 * Resolve a query filter.
 *
 * @param {*} value Saved `queryOptions.filter`.
 * @return {string} A Free query filter.
 */
export const resolveQueryFilter = (value) => pick(value, QUERY_FILTERS, 'latest');

/**
 * The `queryOptions` keys whose saved value is not a Free value.
 *
 * Filter by Taxonomy is Pro, so its slug/terms/operator keys are dropped rather
 * than rewritten — Free has no reader and no control that can set them.
 * Mirrors `AllowedValues::project()`'s `queryOptions` branch.
 *
 * @param {Object} queryOptions Saved `queryOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeQueryCorrections(queryOptions = {}) {
	const corrections = {};
	if (undefined !== queryOptions.filter) {
		const resolved = resolveQueryFilter(queryOptions.filter);
		if (resolved !== queryOptions.filter) {
			corrections.filter = resolved;
		}
	}
	for (const key of PRO_TAXONOMY_KEYS) {
		if (undefined !== queryOptions[key]) {
			corrections[key] = undefined;
		}
	}
	return corrections;
}

/**
 * The `taxonomyOptions` keys whose saved value is not a Free value.
 *
 * Over The Thumb is Pro on every source. Taxonomy Type is only gated off the
 * product source: product taxonomies are dynamic (`product_cat`, `product_tag`,
 * custom), so only the fixed post/video "Both" value is Pro — mirrors
 * `AllowedValues::project()`'s `taxonomyOptions` branch.
 *
 * @param {Object} taxonomyOptions Saved `taxonomyOptions`.
 * @param {string} sourceType      Saved `sourceType`, for the product carve-out.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeTaxonomyCorrections(taxonomyOptions = {}, sourceType = 'post') {
	const corrections = {};
	if (undefined !== taxonomyOptions.position) {
		const resolved = resolveTaxonomyPosition(taxonomyOptions.position);
		if (resolved !== taxonomyOptions.position) {
			corrections.position = resolved;
		}
	}
	if (undefined !== taxonomyOptions.type && 'product' !== sourceType) {
		const resolved = resolveTaxonomyType(taxonomyOptions.type);
		if (resolved !== taxonomyOptions.type) {
			corrections.type = resolved;
		}
	}
	return corrections;
}

/**
 * The `metaOptions` keys whose saved value is not a Free value.
 *
 * Mirrors `AllowedValues::project()`'s `metaOptions` branch.
 *
 * @param {Object} metaOptions Saved `metaOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeMetaCorrections(metaOptions = {}) {
	if (undefined === metaOptions.separator) {
		return {};
	}
	const resolved = resolveMetaSeparator(metaOptions.separator);
	return resolved === metaOptions.separator ? {} : { separator: resolved };
}

/**
 * The `imageOptions` keys whose saved value is not a Free value.
 *
 * Custom is the one Pro aspect ratio; its width/height controls are absent, so
 * a saved value lands on the block's schema default — mirrors
 * `AllowedValues::project()`'s `imageOptions` branch.
 *
 * @param {Object} imageOptions Saved `imageOptions`.
 * @param {string} blockName    Block name attribute, for the ratio default.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeImageCorrections(imageOptions = {}, blockName = '') {
	if (undefined === imageOptions.aspectRatio) {
		return {};
	}
	const resolved = resolveImageAspectRatio(imageOptions.aspectRatio, blockName);
	return resolved === imageOptions.aspectRatio ? {} : { aspectRatio: resolved };
}

/**
 * The `paginationOptions` keys whose saved value is not a Free value.
 *
 * Load More brings Infinite Scroll, its button text, alignment and ending
 * message; Number + Next/Previous brings the prev/next buttons and their icon.
 * Free has no reader for any of them, so those keys are dropped rather than
 * rewritten — mirrors `AllowedValues::project()`'s `paginationOptions` branch.
 *
 * @param {Object} paginationOptions Saved `paginationOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeAjaxPaginationCorrections(paginationOptions = {}) {
	const corrections = {};
	if (undefined !== paginationOptions.type) {
		const resolved = resolvePaginationType(paginationOptions.type);
		if (resolved !== paginationOptions.type) {
			corrections.type = resolved;
		}
	}
	if (undefined !== paginationOptions.numberDisplayStyle) {
		const resolved = resolvePaginationNumberStyle(paginationOptions.numberDisplayStyle);
		if (resolved !== paginationOptions.numberDisplayStyle) {
			corrections.numberDisplayStyle = resolved;
		}
	}
	for (const key of PRO_AJAX_PAGINATION_KEYS) {
		if (undefined !== paginationOptions[key]) {
			corrections[key] = undefined;
		}
	}
	return corrections;
}

/**
 * The `videoOptions` keys Free has no reader for.
 *
 * Inline Play Mode and Play Icon Position are Pro. Free plays every video in
 * the lightbox popup and pins the icon at the centre, so the inline player
 * settings are dropped — mirrors `AllowedValues::project()`'s `videoOptions`
 * branch.
 *
 * @param {Object} videoOptions Saved `videoOptions`.
 * @return {Object} Corrections to merge, keyed by option name.
 */
export function getFreeVideoCorrections(videoOptions = {}) {
	const corrections = {};
	for (const key of PRO_VIDEO_KEYS) {
		if (undefined !== videoOptions[key]) {
			corrections[key] = undefined;
		}
	}
	return corrections;
}
