/**
 * Shared responsive breakpoints for block dynamic CSS (JS / editor side).
 *
 * Single source of truth. The PHP frontend mirror
 * (`src/Blocks/Styles/Breakpoints.php`) is GENERATED from this file — run
 * `npm run sync:style-config` after changing a value (CI `--check` catches drift).
 */

/** Maximum viewport width (px, inclusive) treated as tablet. */
export const TABLET_BREAKPOINT = 1023;

/** Maximum viewport width (px, inclusive) treated as mobile. */
export const MOBILE_BREAKPOINT = 599;

/** Pre-built media-query strings used by inline-CSS generators. */
export const TABLET_MEDIA_QUERY = `only screen and (max-width: ${TABLET_BREAKPOINT}px)`;
export const MOBILE_MEDIA_QUERY = `only screen and (max-width: ${MOBILE_BREAKPOINT}px)`;

/**
 * Tiles-grid collapse breakpoints (px). A Tiles grid drops its per-tile
 * column/row spans below the first, then collapses to a single column below the
 * second. Generated into the PHP side at `src/Blocks/Styles/Breakpoints.php`.
 */

/** Max viewport width at which a Tiles grid drops its per-tile column/row spans. */
export const TILES_COLLAPSE_TABLET_BREAKPOINT = 768;

/** Max viewport width at which a Tiles grid collapses to a single column. */
export const TILES_COLLAPSE_MOBILE_BREAKPOINT = 480;

/**
 * Default colors and sizes shared by the dynamic-CSS generators. The colors are
 * the values the static stylesheet already applies, so PHP uses them as
 * override sentinels and JS as fallbacks. The PHP mirror
 * (`src/Blocks/Styles/Defaults.php`) is GENERATED from `DEFAULTS.colors` — run
 * `npm run sync:style-config` after a change.
 */
export const DEFAULTS = {
	colors: {
		title: '#2f2f2f',
		desc: '#757575',
		ratingFill: '#FFD700',
		ratingEmpty: '#E0E0E0',
		overlay: 'rgba(0,0,0,0.3)',
	},
	sizes: {
		taxonomyBorderRadius: 4,
		taxonomyGap: 8,
		metaGap: 10,
		socialIconSize: 20,
		socialIconAreaSize: 40,
		socialGap: 10,
	},
	breakpoints: { tablet: TABLET_BREAKPOINT, mobile: MOBILE_BREAKPOINT },
};

/** Responsive device keys used throughout the attribute trees. */
export const DEVICES = {
	DESKTOP: 'Desktop',
	TABLET: 'Tablet',
	MOBILE: 'Mobile',
};

/** Content-source identifiers referenced by the CSS source-branching. */
export const SOURCE_TYPES = {
	IMAGE: 'image',
	POST: 'post',
	PRODUCT: 'product',
	VIDEO: 'video',
};
