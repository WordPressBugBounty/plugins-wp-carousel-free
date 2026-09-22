/**
 * One slide/card in editor carousel preview — markup and `wpcp-*` classes must stay aligned
 * with `src/Blocks/BlockRenderer.php` for same attributes.
 *
 * Leaf renderers live in `./carouselItem/` (OverlayIcons, SocialShareList, ReadMoreButton,
 * RatingStars, MetaRow, TaxonomyList, video cards); this file owns the slot
 * gating + ordering glue. Slot visibility is decided HERE (a slot renderer is only
 * mounted when it has something to show) so `wrapContentSlot` never emits an empty
 * `.wpcp-content-slot` wrapper.
 */

import { Fragment, useMemo, useRef, useContext, RawHTML } from '@wordpress/element';
import classNames from 'classnames';
import { isSlotVisible, isFlySlotVisible } from '../inspector/visibility';
import { getContentField } from './carouselItem/contentFields';
import { resolveContentOrder } from './carouselItem/defaultContentOrder';
import { splitContentRuns, runsRequireDomOrder } from './carouselItem/contentRuns';
import { getSourceSlotFlags, getSocialNetworks } from './carouselItem/sourceDerived';
import {
	buildItemMediaStyles,
	getContentDimensionStyle,
	getOverlayContentStyle,
	resolveContentFlowPositionClass,
	resolveContentPositionClass,
	resolveContentBoxPositionClass,
	getContentBoxWidthStyle,
} from './carouselItem/itemStyleHelpers';
import useContentBoxFlowShift from './carouselItem/useContentBoxFlowShift';
import FlyContentContext from './carouselItem/FlyContentContext';
import { resolveFlyWidthSpec, flyWidthFromItem } from '../utils/flyContentWidth';
import ItemEditButton from './carouselItem/ItemEditButton';
import OverlayIcons from './carouselItem/OverlayIcons';
import SocialShareList from './carouselItem/SocialShareList';
import ReadMoreButton, { getReadMoreUrl } from './carouselItem/ReadMoreButton';
import RatingStars from './carouselItem/RatingStars';
import MetaRow, { getVisibleMetaParts } from './carouselItem/MetaRow';
import TaxonomyList from './carouselItem/TaxonomyList';
import { getWordLimitText, truncateLimitedText } from '../utils/formatters';
import {
	sanitizeItemTitle,
	sanitizeItemDescription,
	sanitizeItemPrice,
	sanitizeItemUrl,
} from '../utils/sanitizeItemText';
import { getImageFocalPointStyle } from '../utils/imageFocalPointStyle';
import { resolveContentOrientation } from '../inspector/fragments/contentOrientations';
import { isLightboxModuleActive } from '../lightbox/useLightboxModuleSettings';
import { resolveOuterMediaAspect } from '../utils/resolveMediaAspect';
import {
	needsOriginalAspectForVariableWidth,
	shouldDeferVariableWidthSwiperImageSizing,
	shouldDeferVariableWidthTickerImageSizing,
} from '../utils/variableWidthImageSizing';
import { VideoItemContent } from './carouselItem/VideoCard';
import { effectInnerClasses, effectContentClass, isContentHoverOrientation } from '../utils';
import OverlayAnimLayer from './overlayAnimLayer';

/** sourceType → the attributes key holding title/excerpt length options. */
const CONTENT_OPTIONS_KEY_BY_SOURCE = {
	post: 'postContentOptions',
	product: 'productContentOptions',
	external: 'postContentOptions',
	video: 'postContentOptions',
};

const MEDIA_FAMILY_SOURCES = ['image'];

const isDescriptionLengthLimited = (options) =>
	!!options &&
	(options.excerptLength === 'limited' ||
		options.excerptLimit === 'limited' ||
		options.descriptionLength === 'limited');

const getDescriptionWordLimit = (options) =>
	options?.excerptWordLimit ?? options?.descriptionWordLimit;

const getDescriptionLengthUnit = (options) =>
	options?.excerptLengthUnit ?? options?.descriptionLengthUnit ?? 'word';

/**
 * @param {Object}   props
 * @param {Object}   props.item
 * @param {Object}   props.attributes
 * @param {number}   props.itemIndex
 * @param {boolean}  props.isEditor
 * @param {Function} [props.onItemEdit]
 * @param {boolean}  [props.isReflection]
 * @param {boolean}  [props.superFlow]                   Slider Super Flow style — adds `.super-flow-image`.
 * @param {boolean}  [props.hideImageSlot]               Omit the media/image slot (premium overlay slides).
 * @param {boolean}  [props.separateInteractionControls] Render overlay/edit controls in a slide-level host.
 * @param {Object}   [props.socialIcons]                 Parent-owned social icon lookup.
 */
export default function CarouselItem({
	item,
	attributes,
	itemIndex,
	isEditor,
	onItemEdit,
	isReflection = false,
	superFlow = false,
	hideImageSlot = false,
	separateInteractionControls = false,
	socialIcons,
}) {
	const {
		sourceType = 'image',
		contentOptions = {},
		contentAreaOptions = {},
		taxonomyOptions = {},
		ratingOptions = {},
		socialShareOptions = {},
		productContentOptions = {},
		metaOptions = {},
		effectsOptions = {},
		clickActionOptions = {},
		imageOptions = {},
		layoutOptions = {},
		videoOptions = {},
	} = attributes;

	const contentOrientation = resolveContentOrientation(
		sourceType,
		layoutOptions.contentOrientation,
		{ blockName: attributes?.blockName }
	);

	const showTitle = contentOptions.showTitle !== false;
	const showDesc = contentOptions.showDescription !== false;
	const showMore =
		sourceType === 'product'
			? productContentOptions.showAddToCart !== false
			: contentOptions.showReadMore === true;
	const contentFlowPositionClass = resolveContentFlowPositionClass(
		contentOrientation,
		contentOptions.position || 'bottom'
	);
	// Only true "Overlay" exposes the 9-point Content Position control; "Overlay
	// Box" is fixed vertical-centering and has no position control, so it must
	// ignore any contentPosition value left over from a prior Overlay selection.
	const contentPositionClass =
		contentOrientation === 'overlay'
			? resolveContentPositionClass(contentOptions.contentPosition)
			: '';
	const overlayContentStyle =
		contentOrientation === 'overlay'
			? getOverlayContentStyle(contentOptions, attributes?.blockName)
			: undefined;
	// Content Box is reachable only from a Pro editor preview — every Free block
	// resolves it away — so these two never affect a block with a PHP renderer.
	const contentBoxPositionClass =
		contentOrientation === 'content-box'
			? resolveContentBoxPositionClass(contentOptions.contentBoxPosition)
			: '';
	const contentBoxWidthStyle =
		contentOrientation === 'content-box'
			? getContentBoxWidthStyle(contentOptions.contentBoxWidth)
			: undefined;
	// The Diagonal orientation exposes only a Height control (see
	// ImageContentSettings), sizing the `.wpcp-diagonal-caption` box; width stays
	// 100% via static SCSS. Empty value resolves to `undefined` (no style attr).
	const diagonalCaptionStyle =
		contentOrientation === 'diagonal'
			? getContentDimensionStyle(contentOptions?.contentHeight, 'height')
			: undefined;
	const contentAlignment = ['left', 'center', 'right'].includes(String(contentOptions.alignment))
		? String(contentOptions.alignment)
		: 'left';
	const onHover =
		contentOptions.displayOnHover === true && isContentHoverOrientation(contentOrientation);
	// Hover Animation gate context — shared by the inner/content/overlay-layer
	// effect helpers so the editor preview matches the PHP renderer. The Content
	// axis reveals overlay text on hover, so it must honor the real toggle:
	// hardcoding it on hid always-visible content in the editor while the PHP
	// frontend showed it (ItemContentRenderer reads the real value).
	const effectGate = {
		contentOrientation,
		displayOnHover: contentOptions.displayOnHover === true,
	};
	// Slider: Image panel Aspect Ratio is stage-level (`.wpcp-swiper`), not
	// per-item — force outer media `original` so we do not emit item boxes.
	// Super Flow owns media sizing via the stage + effect CSS; an item box would
	// push edge-crop fragments off-screen (parity with ItemRenderer).
	// Variable width: slides measure rendered image width and collapse to 0 if
	// boxed — force `original` there too.
	const isSliderBlock =
		String(attributes?.blockName || '').replace('wp-carousel-pro/', '') === 'slider';
	const aspect =
		isSliderBlock || superFlow || needsOriginalAspectForVariableWidth(attributes)
			? 'original'
			: resolveOuterMediaAspect(sourceType, imageOptions);
	const titleSource = contentOptions.titleSource || 'image_caption';
	const descriptionSource = contentOptions.descriptionSource || '';

	const slotOn = (slotId) => isSlotVisible(attributes, slotId);
	// Fly-content bubble visibility: title shown by default, every other slot
	// opt-in.
	const slotOnFly = (slotId) => isFlySlotVisible(attributes, slotId);
	const { showRating, showPrice, isPostOrProduct } = getSourceSlotFlags(
		sourceType,
		slotOn,
		ratingOptions,
		productContentOptions
	);

	// Title Length Limit, Description Length Limit and the Read More button's
	// Show Icon are Pro for the post/video family — mirrors
	// SlotRenderer::apply_title_word_limit()/apply_description_word_limit()/
	// render_slot_readmore(), which no longer read those options for this family.
	const isPostFamily = ['post', 'video'].includes(sourceType);

	const sourceContentKey = CONTENT_OPTIONS_KEY_BY_SOURCE[sourceType];
	const sourceContentOptions =
		sourceContentKey && !isPostFamily ? attributes?.[sourceContentKey] ?? {} : null;
	let descLengthOptions = null;
	if (sourceContentOptions) {
		descLengthOptions = sourceContentOptions;
	} else if (MEDIA_FAMILY_SOURCES.includes(sourceType)) {
		descLengthOptions = contentOptions;
	}
	const readMoreOptions = isPostFamily
		? { buttonType: attributes?.postContentOptions?.buttonType ?? 'button' }
		: contentOptions;

	const rawTitleText = showTitle ? getContentField(item, titleSource, 'title') : '';
	const rawDescText = showDesc ? getContentField(item, descriptionSource, 'description') : '';

	// Both slots render through RawHTML, so they carry the same allow-lists the
	// PHP sinks apply (SlotRenderer::render_slot_title/_description). The word/char
	// limit helpers already reduce to plain text, so only the unlimited path needs it.
	const titleText =
		sourceContentOptions?.titleLength === 'limited'
			? getWordLimitText(rawTitleText, sourceContentOptions?.titleWordLimit)
			: sanitizeItemTitle(rawTitleText);

	const descText = isDescriptionLengthLimited(descLengthOptions)
		? truncateLimitedText(rawDescText, {
				limit: getDescriptionWordLimit(descLengthOptions),
				unit: getDescriptionLengthUnit(descLengthOptions),
				ellipsis: '...',
		  })
		: sanitizeItemDescription(rawDescText);

	const displayImageUrl = item.image_url;

	const actionType = clickActionOptions.type || 'lightbox';
	const lightboxModuleActive = isLightboxModuleActive();
	// Open in New Tab and Mark as Nofollow ship with the Pro Link click action,
	// so every Free link uses the same fixed target/rel the PHP renderer emits.
	const newTab = '_self';
	const rel = 'noopener noreferrer';
	// Read More/title URL actions should follow the normalized item URL.
	const hasMediaReadMoreUrl =
		typeof item?.customUrl === 'string'
			? item.customUrl.trim() !== ''
			: typeof item?.custom_url === 'string' && item.custom_url.trim() !== '';
	// Direct media (image/video) has no inherent permalink — item.url carries an
	// attachment-URL fallback (previewItems.js) that must not act as a link. Only an
	// explicit per-item Custom URL counts, mirroring ItemRenderer::resolve_click_action.
	const isDirectMediaSource = ['image', 'video'].includes(sourceType);
	const hasItemUrl = isDirectMediaSource
		? hasMediaReadMoreUrl
		: typeof item?.url === 'string' && item.url.trim() !== '';
	// Post/product permalinks are rendered on the published frontend by PHP (ItemRenderer /
	// SlotRenderer). Editor preview must not wrap image or title in navigation links, and it
	// must not show lightbox affordances for these sources either.
	const sourceLinksToPermalink = ['post', 'product'].includes(sourceType);
	const sourceLinksToPermalinkOnFrontend = !isEditor && sourceLinksToPermalink;
	/**
	 * Editor preview keeps media Read More focused on the inline button instead of
	 * turning the whole media wrapper into the custom link. Frontend click behavior
	 * still comes from PHP/SlotRenderer; the editor only suppresses the wrapper link
	 * when Read More is visible so authors can clearly see the button priority.
	 */
	const mediaReadMorePreviewTakesPriority =
		isEditor &&
		['image', 'video'].includes(sourceType) &&
		showMore &&
		(item?.customUrl || item?.custom_url);
	const shouldApplyUrlToImage =
		hasItemUrl && !mediaReadMorePreviewTakesPriority && sourceLinksToPermalinkOnFrontend;
	const shouldApplyUrlToTitle = hasItemUrl && sourceLinksToPermalinkOnFrontend;
	// Post-like sources with an inherent permalink always use that URL; direct
	// media Read More uses its own Custom URL (mirrors
	// SlotRenderer::should_apply_url_to_readmore).
	const shouldApplyUrlToReadMore =
		('post' === sourceType && hasItemUrl) ||
		(['image', 'video'].includes(sourceType) && hasMediaReadMoreUrl);
	const fancyboxGroup =
		typeof attributes?.advancedOptions?.cssId === 'string' && attributes.advancedOptions.cssId
			? attributes.advancedOptions.cssId
			: attributes.uniqueId;

	const itemRef = useRef(null);
	const contentRef = useRef(null);

	// The -60px lift needs a matching flow shift or the following card content
	// overlaps it.
	useContentBoxFlowShift(itemRef, contentRef, contentOrientation);

	const flyApi = useContext(FlyContentContext);

	const isFlyContent = contentOrientation === 'fly-content';
	const isOverlayStyle = ['overlay', 'diagonal', 'fly-content'].includes(contentOrientation);

	const { mediaStyle, imageStyle } = buildItemMediaStyles(imageOptions, aspect);

	const hasImage = displayImageUrl && displayImageUrl.trim() !== '';

	// Item-level focal point/scale wins over the aspect-driven default
	// `objectFit: 'cover'` so the popup's drag-point reflects in the preview.
	const focalStyle = getImageFocalPointStyle(item);
	const imgStyleWithFocal = { ...imageStyle, ...focalStyle };

	// A custom video aspect ratio sizes the img from the dynamic CSS layer
	// (videoDynamicCss.js → `.wpcp-item-media img { width/height }`). The default
	// inline `height: 'auto'` would shadow that rule (inline beats stylesheet),
	// so drop it and let the custom height win. Mirrors the PHP img, which carries
	// no inline height for video.
	if (sourceType === 'video' && videoOptions?.aspectRatio === 'custom') {
		delete imgStyleWithFocal.height;
	}

	// Ticker/marquee variable-width height is driven by `--wpcp-vw-image-height` or
	// `--wpcp-vw-image-max-height` on the block wrapper. The inline `height: auto`
	// / `maxWidth: 100%` from `buildItemMediaStyles()` would beat those rules.
	if (shouldDeferVariableWidthTickerImageSizing(attributes, imageOptions)) {
		delete imgStyleWithFocal.height;
		delete imgStyleWithFocal.maxWidth;
	}

	if (shouldDeferVariableWidthSwiperImageSizing(attributes, imageOptions)) {
		delete imgStyleWithFocal.height;
		delete imgStyleWithFocal.maxWidth;
	}

	const placeholderEl = (
		<div className="wpcp-item-placeholder" style={imageStyle}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<circle cx="8.5" cy="8.5" r="1.5" />
				<path d="M21 15l-5-5L5 21" />
			</svg>
		</div>
	);

	const imgEl = hasImage ? (
		<img
			src={displayImageUrl}
			alt={item.image_alt || item.title}
			loading={imageOptions?.lazyLoad ?? true ? 'lazy' : undefined}
			className="wpcp-item-img"
			style={imgStyleWithFocal}
		/>
	) : (
		placeholderEl
	);

	const getWrappedImage = () => {
		if (isReflection) {
			return imgEl;
		}
		if (shouldApplyUrlToImage) {
			return (
				// No href in the editor preview — the image link must not navigate the canvas.
				// eslint-disable-next-line
				<a target={newTab} rel={rel}>
					{imgEl}
				</a>
			);
		}
		return imgEl;
	};

	const wrappedImg = getWrappedImage();

	const wrapWithItemLink = (node) => {
		if (!hasItemUrl) {
			return node;
		}
		// Reject javascript:/data: schemes the way PHP's esc_url does; React
		// only warns, it does not block.
		const safeUrl = sanitizeItemUrl(item.url);
		if ('' === safeUrl) {
			return node;
		}
		return (
			<a href={safeUrl} target={newTab} rel={rel}>
				{node}
			</a>
		);
	};

	// External feeds whose items are videos (YouTube) render through the shared
	// video card, exactly like the `video` source — same markup, same
	// videoOptions. Mirrors ItemRenderer::is_external_video().
	const isExternalVideo =
		sourceType === 'external' &&
		item?.extra?.source_type === 'youtube' &&
		(item?.extra?.video_url || item?.url);

	const rawTitleTag = contentOptions.titleTag || 'h4';
	const TitleTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(rawTitleTag)
		? rawTitleTag
		: 'h4';

	const contentOrder = resolveContentOrder(contentAreaOptions, sourceType);
	const showImageSlot = !hideImageSlot && slotOn('image');
	// Classic (image-top) honors the image position in the element order by
	// interleaving `.wpcp-item-media` between `.wpcp-item-content` runs; every
	// other orientation keeps the fixed media-then-content structure.
	const isClassicOrientation = contentOrientation === 'image-top';
	const contentRuns = isClassicOrientation ? splitContentRuns(contentOrder, showImageSlot) : null;

	const isProduct = sourceType === 'product';
	const defaultTaxType = isProduct ? 'product_cat' : 'category';
	const type = attributes?.taxonomyOptions?.type || defaultTaxType;

	const taxKeyMap = isProduct
		? { product_cat: 'category', product_tag: 'tag', product_brand: 'product_brand' }
		: { category: 'category', tag: 'tag' };

	// "Both" is Pro — SlotRenderer::render_slot_taxonomy mirrors this fallback.
	const taxonomyText = item?.extra?.[taxKeyMap[type] || taxKeyMap[defaultTaxType]] || '';
	const rawTaxPosition = attributes?.taxonomyOptions?.position || '';
	// "Over The Thumb" is Pro-only — Free has no renderer for it, so a stored
	// value (legacy content or a downgraded Pro block) always falls back to the
	// default. Product also never gets "beside-meta" (no meta row). Parity with
	// SlotRenderer::resolve_taxonomy_position / AllowedValues::taxonomy_position.
	const normalizedTaxPosition = 'over-thumb' === rawTaxPosition ? '' : rawTaxPosition;
	const taxPosition =
		isProduct && 'beside-meta' === normalizedTaxPosition ? '' : normalizedTaxPosition;

	const metaItems = Array.isArray(metaOptions.showMeta)
		? metaOptions.showMeta
		: ['date', 'author', 'category'];
	const showSocial = slotOn('social') && socialShareOptions.enabled !== false;
	const blockLevelSocialNetworks = socialShareOptions?.networks;
	// Per-item network overrides are Pro — every item shares the block-level list.
	const networks = useMemo(
		() => getSocialNetworks({ networks: blockLevelSocialNetworks }),
		[blockLevelSocialNetworks]
	);
	const permalink = item?.url || '';
	const iconView = socialShareOptions.iconView ?? 'stacked';
	const customStyling = socialShareOptions.customStyling === true;
	const ratingValue = Number(item?.extra?.rating ?? 4);
	// Same wp_kses allow-list the PHP renderer applies (del/ins/span/bdi), so
	// the preview never shows markup the frontend would strip — or execute.
	const priceText = sanitizeItemPrice(item?.extra?.price || item?.price || '');

	const editButton =
		isEditor && onItemEdit ? <ItemEditButton item={item} onItemEdit={onItemEdit} /> : null;

	/* ── Slot gates: each returns the slot element or null, so empty slots
	      never mount a wrapper (parity with the PHP renderer). ───────────── */

	const renderMeta = () => {
		if (isProduct) {
			return null;
		}
		if (!slotOn('meta') || metaOptions.enabled === false) {
			return null;
		}
		if (!isPostOrProduct && sourceType !== 'external') {
			return null;
		}
		const visibleMeta = getVisibleMetaParts(
			item,
			metaItems,
			taxPosition === 'beside-meta',
			sourceType === 'post'
		);
		if (!visibleMeta.length) {
			return null;
		}
		return <MetaRow parts={visibleMeta} separatorKey={metaOptions.separator || 'bullet'} />;
	};

	const renderTaxonomy = () => {
		if (!slotOn('taxonomy')) {
			return null;
		}
		if (!isPostOrProduct && sourceType !== 'external') {
			return null;
		}
		if ('beside-meta' === taxPosition) {
			return null;
		}
		if (taxonomyOptions.enabled === false || !taxonomyText) {
			return null;
		}
		return <TaxonomyList taxonomyText={taxonomyText} />;
	};
	const renderRating = () =>
		showRating ? <RatingStars ratingValue={ratingValue} ratingOptions={ratingOptions} /> : null;

	const renderSocial = () =>
		showSocial && networks.length ? (
			<SocialShareList
				networks={networks}
				permalink={permalink}
				iconView={iconView}
				customStyling={customStyling}
				isEditor={isEditor}
				socialIcons={socialIcons}
			/>
		) : null;

	const renderReadMore = (key = 'readmore') => {
		const readMoreUrl = getReadMoreUrl(item, sourceType);
		/**
		 * Lightbox-only and disabled actions suppress the separate Read More URL
		 * affordance for sources governed by the Click Actions panel.
		 */
		const clickActionSuppressesReadMore =
			['lightbox', 'disable'].includes(actionType) && ['image'].includes(sourceType);
		if (!showMore || !readMoreUrl || clickActionSuppressesReadMore) {
			return null;
		}
		return (
			<ReadMoreButton
				key={key}
				item={item}
				readMoreUrl={readMoreUrl}
				sourceType={sourceType}
				productContentOptions={productContentOptions}
				readMoreOptions={readMoreOptions}
				shouldApplyUrlToReadMore={shouldApplyUrlToReadMore}
				newTab={newTab}
				rel={rel}
				isEditor={isEditor}
			/>
		);
	};

	const wrapContentSlot = (slot, node) => {
		if (!node) {
			return null;
		}
		return (
			<div key={slot} className={classNames('wpcp-content-slot', `wpcp-content-slot--${slot}`)}>
				{node}
			</div>
		);
	};

	const renderOrderedContent = (visFn = slotOn, slotIds = contentOrder) =>
		slotIds.map((part) => {
			if (!visFn(part)) {
				return null;
			}
			switch (part) {
				case 'title': {
					const rawTitleNode =
						showTitle && titleText ? (
							<RawHTML>{`<${TitleTag} class="wpcp-item-title">${titleText}</${TitleTag}>`}</RawHTML>
						) : null;
					const node =
						rawTitleNode && shouldApplyUrlToTitle ? wrapWithItemLink(rawTitleNode) : rawTitleNode;
					return wrapContentSlot('title', node);
				}
				case 'excerpt':
				case 'description': {
					const node =
						showDesc && descText ? (
							<RawHTML>{`<p class="wpcp-item-desc">${descText}</p>`}</RawHTML>
						) : null;
					return wrapContentSlot(part, node);
				}
				case 'price': {
					const node =
						showPrice && priceText ? (
							<div className="wpcp-item-price" dangerouslySetInnerHTML={{ __html: priceText }} />
						) : null;
					return wrapContentSlot('price', node);
				}
				case 'readmore':
					return wrapContentSlot('readmore', renderReadMore('readmore-link'));
				case 'meta':
					return wrapContentSlot('meta', renderMeta());
				case 'taxonomy':
					return wrapContentSlot('taxonomy', renderTaxonomy());
				case 'rating':
					return wrapContentSlot('rating', renderRating());
				case 'social':
					return wrapContentSlot('social', renderSocial());
				default:
					return null;
			}
		});

	// Fly-content bubble: the floating element (rendered once per block by
	// CarouselEdit, outside the Swiper clip, so it is never cropped) shows the
	// SAME ordered slots as a content box, gated by the fly "title only"
	// visibility default. We report those slot nodes + the cursor position
	// (relative to `.wpcp-block-inner`) through context as the pointer moves.
	const flyContentNodes = isFlyContent ? renderOrderedContent(slotOnFly).filter(Boolean) : null;

	const handleFlyMove = (event) => {
		if (!isFlyContent || !flyApi || !itemRef.current) {
			return;
		}
		// No visible slots (e.g. an item with an empty Title under the fly
		// "title only" default) → keep the bubble hidden.
		if (!flyContentNodes || flyContentNodes.length === 0) {
			flyApi.report({ visible: false });
			return;
		}
		const innerWrap = itemRef.current.closest('.wpcp-block-inner');
		if (!innerWrap) {
			return;
		}
		const rect = innerWrap.getBoundingClientRect();
		// Width is a fraction of the hovered item (default 60%), so the bubble
		// scales with the slide rather than the whole block.
		const itemWidth = itemRef.current.getBoundingClientRect().width;
		flyApi.report({
			visible: true,
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
			content: flyContentNodes,
			align: contentAlignment,
			width: flyWidthFromItem(resolveFlyWidthSpec(contentOptions), itemWidth),
		});
	};

	const handleFlyLeave = () => {
		if (isFlyContent && flyApi) {
			flyApi.report({ visible: false });
		}
	};

	const renderContent = (slotIds = contentOrder) => {
		// The bubble is the only content surface in this orientation.
		if (isFlyContent) {
			return null;
		}
		const ordered = renderOrderedContent(slotOn, slotIds);
		if (!ordered.some(Boolean)) {
			return null;
		}
		const diagonalStyle = layoutOptions.diagonalStyle === 'right' ? 'right' : 'left';
		const contentMarkup =
			contentOrientation === 'diagonal' ? (
				<div
					className={`wpcp-diagonal-caption wpcp-diagonal-${diagonalStyle}`}
					style={diagonalCaptionStyle}
				>
					{ordered}
				</div>
			) : (
				ordered
			);

		const contentAnimClass = effectContentClass(effectsOptions, effectGate);

		return (
			<div
				ref={contentOrientation === 'content-box' ? contentRef : undefined}
				className={classNames(
					'wpcp-item-content',
					contentFlowPositionClass,
					contentPositionClass,
					contentBoxPositionClass,
					contentAnimClass,
					{
						'wpcp-content-hover': onHover,
						'wpcp-content-overlay': isOverlayStyle,
					},
					'wpcp-content-align',
					`wpcp-content-align--${contentAlignment}`
				)}
				style={overlayContentStyle || contentBoxWidthStyle}
			>
				{contentMarkup}
			</div>
		);
	};

	const mediaSection = showImageSlot ? (
		<div
			className={classNames(
				'wpcp-item-media',
				aspect === 'custom' && 'wpcp-item-media--custom',
				aspect === 'custom' && 'wpcp-item-media--custom-rsp',
				aspect !== 'custom' && aspect !== 'original' && 'wpcp-item-media--aspect-rsp',
				aspect !== 'custom' && 'wpcp-item-media--maxw-rsp',
				(sourceType === 'video' || isExternalVideo) && 'wpcp-video-section',
				imageOptions?.overlay && 'wpcp-image-overlay',
				superFlow && 'super-flow-image'
			)}
			style={mediaStyle}
		>
			{sourceType !== 'video' && !isExternalVideo && wrappedImg}
			{lightboxModuleActive && !separateInteractionControls && (
				<OverlayIcons
					item={item}
					itemIndex={itemIndex}
					clickActionOptions={clickActionOptions}
					hasImage={hasImage}
					isReflection={isReflection}
					sourceType={sourceType}
					isExternalVideo={!!isExternalVideo}
					sourceLinksToPermalink={sourceLinksToPermalink}
					fancyboxGroup={fancyboxGroup}
				/>
			)}
			<OverlayAnimLayer effectsOptions={effectsOptions} />
			{/* Video media renders for every editor preview slide — not just
			editable ones. Side-strip swipers mount CarouselItem
			without onItemEdit; gating the thumbnail on onItemEdit left those
			strips empty (no img → no height → collapsed), while the PHP
			frontend renders all three strips identically. */}
			{isEditor && (sourceType === 'video' || isExternalVideo) && (
				<VideoItemContent videoPlay={false} videoAttr={videoOptions} img={imgEl} item={item} />
			)}
			{isEditor &&
				onItemEdit &&
				sourceType !== 'external' &&
				!separateInteractionControls &&
				editButton}
		</div>
	) : null;

	return (
		<div
			ref={itemRef}
			className={classNames(
				'wpcp-item-inner',
				effectInnerClasses(effectsOptions, attributes?.blockName),
				`wpcp-orientation-${contentOrientation}`,
				isOverlayStyle && 'wpcp-has-overlay',
				onHover && 'wpcp-content-hover-mode',
				isReflection && 'wpcp-item-inner--reflection',
				isClassicOrientation && contentRuns && runsRequireDomOrder(contentRuns) && 'wpcp-content-runs'
			)}
			{...(isReflection
				? {
						'data-lightbox-ignore': 'true',
						'aria-hidden': 'true',
				  }
				: {})}
			onMouseMove={isFlyContent ? handleFlyMove : undefined}
			onMouseLeave={isFlyContent ? handleFlyLeave : undefined}
		>
			{isClassicOrientation && contentRuns ? (
				contentRuns.map((contentRun, runIndex) =>
					contentRun.type === 'media' ? (
						<Fragment key={`run-media-${runIndex}`}>{mediaSection}</Fragment>
					) : (
						<Fragment key={`run-content-${runIndex}`}>{renderContent(contentRun.slots)}</Fragment>
					)
				)
			) : (
				<>
					{mediaSection}
					{renderContent()}
				</>
			)}
		</div>
	);
}
