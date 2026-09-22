/**
 * Panel visibility rules.
 *
 * Maps panel names to the source types they are shown for.
 * true = shown for all source types.
 */
const RULES = {
	layouts: true,
	queryBuilder: ['post', 'product'],
	cardContent: true,
	clickAction: ['image'],
	image: ['image', 'post', 'product'],
	rating: ['product'],
	taxonomy: ['post', 'product'],
	postMeta: ['post'],
	socialShare: true,
	video: ['video'],
	effects: ['image', 'post', 'product'],
	scheduling: true,
	advanced: true,
};

/**
 * Returns true when a panel should be rendered for the given sourceType.
 *
 * @param {string} panelName  - Panel identifier
 * @param {string} sourceType - Content source type
 * @return {boolean} True if panel should be shown
 */
export function shouldShowPanel(panelName, sourceType) {
	const rule = RULES[panelName];
	if (rule === true) {
		return true;
	}
	if (!Array.isArray(rule)) {
		return false;
	}
	return rule.includes(sourceType);
}

/**
 * Slot visibility from Content Area → `contentAreaOptions.elementVisibility`.
 * Omitted keys are treated as on for backward compatibility.
 *
 * @param {Object} attributes - Block attributes
 * @return {Object<string, boolean|undefined>} Element visibility map
 */
export function getElementVisibility(attributes) {
	const raw = attributes.contentAreaOptions?.elementVisibility;
	return raw && typeof raw === 'object' ? raw : {};
}

function getSourceDefaultVisibility(sourceType, slotId) {
	if (sourceType === 'product' && ['taxonomy', 'excerpt', 'social'].includes(slotId)) {
		return false;
	}
	if (sourceType === 'product' && slotId === 'readmore') {
		return true;
	}
	if (slotId === 'excerpt' || slotId === 'readmore') {
		return false;
	}
	return true;
}

/**
 * @param {Object} attributes - Block attributes
 * @param {string} slotId     - Slot identifier
 * @return {boolean} True if slot is visible
 */
export function isSlotVisible(attributes, slotId) {
	const sourceType = attributes?.sourceType || 'image';
	const visibility = getElementVisibility(attributes);
	// Social uses `socialShareOptions.enabled` as the source of truth; its default
	// varies per block schema (false for carousel, true for slider/tiles/
	// thumbnails-slider). `elementVisibility.social` is only a UI-toggle mirror,
	// except the product source starts with the row hidden by default.
	if (slotId === 'social') {
		if (Object.prototype.hasOwnProperty.call(visibility, 'social')) {
			return visibility.social !== false;
		}
		if (sourceType === 'product') {
			return false;
		}
		return attributes?.socialShareOptions?.enabled !== false;
	}
	// Product Add to Cart uses `productContentOptions.showAddToCart` as the source
	// of truth; `elementVisibility.readmore` is only the Content Area toggle mirror.
	if (slotId === 'readmore' && sourceType === 'product') {
		return attributes?.productContentOptions?.showAddToCart !== false;
	}
	if (Object.prototype.hasOwnProperty.call(visibility, slotId)) {
		return visibility[slotId] !== false;
	}
	return getSourceDefaultVisibility(sourceType, slotId);
}

/**
 * Lightbox-only and disabled click actions do not provide a separate URL action,
 * so they hide Read More for the sources governed by the Click Actions panel
 * (image). Mirrors SlotRenderer::render_slot_readmore.
 *
 * @param {Object} attributes - Block attributes
 * @return {boolean} True when Read More is forcibly hidden by the click action
 */
export function isReadMoreSuppressedByClickAction(attributes) {
	const sourceType = attributes?.sourceType || 'image';
	const actionType = attributes?.clickActionOptions?.type || 'lightbox';
	return ['lightbox', 'disable'].includes(actionType) && ['image'].includes(sourceType);
}

/**
 * Fly-content slot visibility — a render-time "title only" default. The fly
 * bubble shows the title unless it is explicitly hidden, and every other slot
 * is hidden until the user explicitly enables it in the Content Area panel
 * (opt-in, the inverse of the normal "omitted ⇒ on" rule). The bubble carries
 * no image slot. Used ONLY for the fly-content orientation, which only the two
 * Pro editor previews can select; other orientations keep `isSlotVisible`.
 *
 * @param {Object} attributes - Block attributes
 * @param {string} slotId     - Slot identifier
 * @return {boolean} True if the slot shows in the fly bubble
 */
export function isFlySlotVisible(attributes, slotId) {
	// The fly bubble never carries the image, Read More / Add to Cart, or Social
	// Share slots — always hidden in this orientation regardless of saved
	// visibility.
	if (slotId === 'image' || slotId === 'readmore' || slotId === 'social') {
		return false;
	}
	if (slotId === 'title') {
		return isSlotVisible(attributes, 'title');
	}
	return getElementVisibility(attributes)[slotId] === true;
}

/**
 * Merge patch for toggling a slot in Content Area (updates elementVisibility + legacy flags).
 *
 * @param {Object}  attributes - Block attributes
 * @param {string}  slotId     - Slot identifier to toggle
 * @param {boolean} next       - New visibility state
 * @return {Object} Partial attributes for setAttributes
 */
export function buildSlotToggleUpdates(attributes, slotId, next) {
	const contentArea = attributes.contentAreaOptions || {};
	const prevElementVisibility =
		contentArea.elementVisibility && typeof contentArea.elementVisibility === 'object'
			? contentArea.elementVisibility
			: {};
	const elementVisibility = { ...prevElementVisibility, [slotId]: next };

	const contentOptions = attributes.contentOptions || {};
	const postContentOptions = attributes.postContentOptions || {};
	const productContentOptions = attributes.productContentOptions || {};
	const socialShareOptions = attributes.socialShareOptions || {};
	const metaOptions = attributes.metaOptions || {};
	const taxonomyOptions = attributes.taxonomyOptions || {};
	const ratingOptions = attributes.ratingOptions || {};

	const patch = {
		contentAreaOptions: { ...contentArea, elementVisibility },
	};

	switch (slotId) {
		case 'social':
			patch.socialShareOptions = { ...socialShareOptions, enabled: next };
			break;
		case 'meta':
			patch.metaOptions = { ...metaOptions, enabled: next };
			break;
		case 'taxonomy':
			patch.taxonomyOptions = { ...taxonomyOptions, enabled: next };
			break;
		case 'rating':
			patch.ratingOptions = { ...ratingOptions, enabled: next };
			break;
		case 'title':
			patch.contentOptions = { ...contentOptions, showTitle: next };
			patch.postContentOptions = { ...postContentOptions, showTitle: next };
			patch.productContentOptions = { ...productContentOptions, showTitle: next };
			break;
		case 'description':
			patch.contentOptions = { ...contentOptions, showDescription: next };
			patch.postContentOptions = { ...postContentOptions, showExcerpt: next };
			patch.productContentOptions = { ...productContentOptions, showDescription: next };
			break;
		case 'excerpt':
			patch.postContentOptions = { ...postContentOptions, showExcerpt: next };
			patch.contentOptions = { ...contentOptions, showDescription: next };
			patch.productContentOptions = { ...productContentOptions, showDescription: next };
			break;
		case 'readmore':
			patch.contentOptions = { ...contentOptions, showReadMore: next };
			patch.postContentOptions = { ...postContentOptions, showReadMore: next };
			patch.productContentOptions = { ...productContentOptions, showAddToCart: next };
			break;
		case 'price':
			patch.productContentOptions = { ...productContentOptions, showPrice: next };
			break;
		default:
			break;
	}

	return patch;
}

/**
 * Inspector panels: hide when the matching Content Area slot is off.
 *
 * @param {string} panelName  - Panel identifier
 * @param {string} sourceType - Content source type
 * @param {Object} attributes - Block attributes
 * @return {boolean} True if panel should be shown
 */
export function shouldShowInspectorPanel(panelName, sourceType, attributes) {
	const isTilesBlock = attributes?.blockName === 'tiles';
	const isThumbnailsSliderBlock = attributes?.blockName === 'thumbnails-slider';
	const isSliderBlock = attributes?.blockName === 'slider';
	const isMarqueeBlock = attributes?.blockName === 'marquee';
	// Match preview + frontend: omitted keys inherit schema defaults (navigation/pagination on).
	const paginationEnabled = attributes?.layoutOptions?.pagination !== false;
	const navigationEnabled = attributes?.layoutOptions?.navigation !== false;

	// The slider and thumbnails-slider show one slide at a time, so per-item
	// hover/overlay animations don't apply (they use the Layout panel's Content
	// Animation instead). Hide the RULES-routed `effects` panel for these blocks
	// (additive, keyed strictly on blockName); all source-gated panels stay.
	// Parity-safe because `effectsOptions` defaults to `none`.
	// The marquee scrolls continuously, so there is no hover state to animate
	// into either.
	if ((isThumbnailsSliderBlock || isSliderBlock || isMarqueeBlock) && panelName === 'effects') {
		return false;
	}

	switch (panelName) {
		case 'paginationDots':
			return !isTilesBlock && paginationEnabled;
		case 'navigation':
			return !isTilesBlock && navigationEnabled;
		case 'ajaxPagination':
			return (
				isTilesBlock &&
				paginationEnabled &&
				(sourceType === 'post' ||
					sourceType === 'product' ||
					sourceType === 'image' ||
					sourceType === 'video')
			);
		default:
			break;
	}

	if (!shouldShowPanel(panelName, sourceType)) {
		return false;
	}

	const vis = (id) => isSlotVisible(attributes, id);

	switch (panelName) {
		case 'socialShare':
			return vis('social');
		case 'postMeta':
			return vis('meta');
		case 'taxonomy':
			return vis('taxonomy');
		case 'rating':
			return vis('rating');
		case 'image':
			return vis('image');
		default:
			return true;
	}
}

/**
 * Hook version for convenience.
 *
 * @param {string} sourceType - Content source type
 * @param {Object} attributes - Block attributes (for feature on/off → panel visibility)
 * @return {{ shouldShow: (panelName: string) => boolean }} Panel visibility checker
 */
export function usePanelVisibility(sourceType, attributes) {
	return {
		shouldShow: (panelName) => shouldShowInspectorPanel(panelName, sourceType, attributes),
	};
}
