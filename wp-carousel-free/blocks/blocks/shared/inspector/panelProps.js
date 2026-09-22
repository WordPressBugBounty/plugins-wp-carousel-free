/**
 * Per-panel attribute key map + sliced-props hook.
 *
 * Each inspector panel reads only a small slice of `attributes`. This file
 * centralizes which keys each panel actually depends on, and exposes a hook
 * that returns a *stable-reference* sliced object so panels wrapped in
 * React.memo can skip re-render when unrelated attributes change.
 *
 * Adding a panel: add an entry to PANEL_ATTRIBUTE_KEYS. Adding a new attribute
 * to an existing panel: extend its array.
 */

import { useMemo } from '@wordpress/element';

/**
 * Static map of panel name → attribute keys the panel reads.
 * Source: derived from `attributes.<key>` and `const { ... } = attributes`
 * patterns inside each panel file. Conservative — include any key the panel
 * touches, even in callbacks.
 */
export const PANEL_ATTRIBUTE_KEYS = {
	advanced: ['advancedOptions'],
	clickAction: ['clickActionOptions', 'sourceType', 'layoutOptions', 'blockName'],
	// The unified Card Content panel reads the full superset the four former
	// panels read. The entire `contentArea` set is mandatory: Card Elements slot
	// toggles fan out into per-source option containers (see buildSlotToggleUpdates
	// in visibility.js), and the panel must read those containers from the live
	// attributes or the spread will clobber them. `clickActionOptions` is
	// required so lightbox/disable click actions can hide the Read More row and
	// its settings/style controls for the image source.
	cardContent: [
		'contentAreaOptions',
		'contentOptions',
		'postContentOptions',
		'productContentOptions',
		'socialShareOptions',
		'metaOptions',
		'taxonomyOptions',
		'ratingOptions',
		'layoutOptions',
		'clickActionOptions',
		'sourceType',
		'blockName',
	],
	effects: ['effectsOptions', 'sourceType', 'layoutOptions', 'blockName', 'contentOptions'],
	// layoutOptions: Aspect Ratio visibility (tiles bento / Variable Width) and
	// Image Height swap read layout gates — must reach ImagePanel.
	image: ['imageOptions', 'items', 'sourceType', 'blockName', 'layoutOptions'],
	// imageOptions: the slider Height notice reads the Stage Aspect Ratio
	// (a preset ratio overrides Height).
	layouts: [
		'layoutOptions',
		'sliderOptions',
		'sourceType',
		'thumbnail',
		'items',
		'thumbsArea',
		'imageOptions',
	],
	ajaxPagination: ['paginationOptions', 'layoutOptions', 'blockName', 'sourceType', 'items'],
	paginationDots: ['paginationDotsOptions', 'layoutOptions', 'blockName'],
	navigation: ['navigationOptions', 'layoutOptions', 'blockName'],
	// The Meta "Apply to All" (font family) fans the selected family into the
	// per-source content typography: `contentOptions` for every source, plus
	// `postContentOptions`/`productContentOptions` for post/product. The handler
	// rebuilds those containers with a `...co`-style spread, so the panel must
	// read them from the live attributes — otherwise the spread lands on an empty
	// object and wipes every sibling key (contentPosition/contentWidth/
	// contentHeight, etc.) back to defaults.
	postMeta: [
		'metaOptions',
		'taxonomyOptions',
		'contentOptions',
		'postContentOptions',
		'productContentOptions',
		'sourceType',
	],
	queryBuilder: ['queryOptions', 'sourceType', 'blockName', 'layoutOptions'],
	rating: ['ratingOptions'],
	scheduling: ['scheduling'],
	// sourceType: the per-item sharing upsell only applies to the image source.
	socialShare: ['socialShareOptions', 'sourceType'],
	// The Taxonomy "Apply to All" (font family) fans the selected family into the
	// per-source content + meta typography: `contentOptions` and `metaOptions` for
	// post/product, plus `postContentOptions`/`productContentOptions`. The handler
	// rebuilds those containers with a `...co`-style spread, so the panel must
	// read them from the live attributes — otherwise the spread lands on an empty
	// object and wipes every sibling key (contentPosition/contentWidth/
	// contentHeight, etc.) back to defaults. See postMeta/cardContent for the same.
	taxonomy: [
		'taxonomyOptions',
		'metaOptions',
		'contentOptions',
		'postContentOptions',
		'productContentOptions',
		'sourceType',
		'layoutOptions',
		'blockName',
	],
	thumbnail: ['thumbnail', 'contentAreaOptions', 'layoutOptions'],
	thumbnailsArea: ['thumbsArea', 'layoutOptions'],
	video: ['videoOptions'],
};

/**
 * Returns a sliced `{ attributes, setAttributes }` for a specific panel.
 * The sliced `attributes` object is memoized on the listed keys, so its
 * reference is stable across renders that touched unrelated attributes.
 *
 * @param {string}   panelName     Key from PANEL_ATTRIBUTE_KEYS.
 * @param {Object}   attributes    Full block attributes.
 * @param {Function} setAttributes Gutenberg setter (already stable).
 * @return {{attributes: Object, setAttributes: Function}} Sliced props that pair an attributes
 *   subset with the setter; identity-stable across unrelated attribute changes.
 */
export function usePanelProps(panelName, attributes, setAttributes) {
	const keys = PANEL_ATTRIBUTE_KEYS[panelName];

	// Hook must run unconditionally — handle the unknown-panel case via the
	// memoized result, not an early return.
	const sliced = useMemo(
		() => {
			if (!keys) {
				return attributes;
			}
			const out = {};
			for (const key of keys) {
				out[key] = attributes[key];
			}
			return out;
			// Dependency: the values at each listed key. When `keys` is undefined we
			// intentionally re-run on any attributes change (matches the fallback above).
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		keys ? keys.map((k) => attributes[k]) : [attributes]
	);

	return { attributes: sliced, setAttributes };
}
