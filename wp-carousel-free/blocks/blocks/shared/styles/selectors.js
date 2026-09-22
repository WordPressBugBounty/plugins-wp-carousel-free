/**
 * CSS selector bundle for one carousel instance (editor side).
 *
 * Extracted verbatim from `carouselDynamicCss.js` so the orchestrator and the
 * per-concern generators share one selector source. Mirrored on the PHP frontend
 * side by `CarouselDynamicCss::create_selectors()`. Pure — depends only on the
 * passed `uniqueId`. Any selector change here MUST land on the PHP side in the
 * same commit; the css-parity harness catches a one-sided edit.
 */

/**
 * CSS selector bundle for one carousel instance.
 *
 * @param {string} uniqueId     - Block uniqueId (without `#`).
 * @param {string} [sourceType] - Block sourceType; gates the audio-card media selectors.
 * @return {Record<string, string>} Selector strings keyed by role.
 */
export const createSelectors = (uniqueId, sourceType) => {
	const wrapper = `#${uniqueId}`;
	// The image media box is shared with audio cards, but the audio-card selectors only
	// match audio markup. Append them only for the audio source so a non-audio block's
	// border/radius/padding/dimension rules don't emit inert `.wpcp-audio-card__*`
	// selectors. Mirrors CarouselDynamicCss::create_selectors().
	const isAudioSource = sourceType === 'audio';
	const audioMediaTail = isAudioSource
		? `, ${wrapper} .wpcp-audio-card__media, ${wrapper} .wpcp-audio-card__thumb`
		: '';
	const audioMediaHoverTail = isAudioSource
		? `, ${wrapper} .wpcp-item:hover .wpcp-audio-card__media, ${wrapper} .wpcp-item:hover .wpcp-audio-card__thumb`
		: '';
	const media = `${wrapper} .wpcp-item-media${audioMediaTail}`;
	const mediaHover = `${wrapper} .wpcp-item:hover .wpcp-item-media${audioMediaHoverTail}`;
	const audioMedia = `${wrapper} .wpcp-audio-card__media, ${wrapper} .wpcp-audio-card__thumb`;

	return {
		wrapper,
		// Inner content wrapper inside the block root. Carries the General-tab
		// padding and is the chrome positioning context; mirrors the PHP
		// selector `$this->unique_id . ' > .wpcp-block-inner'`.
		inner: `${wrapper} > .wpcp-block-inner`,
		swiperWrapper: `${wrapper} .swiper-wrapper`,
		// Slider block fixed-height stage. `.wpcp-swiper` is the Swiper root in both
		// the editor preview (sliderPreview.jsx) and the PHP render (BlockRenderer),
		// so these resolve identically across editor/frontend.
		sliderStage: `${wrapper} .wpcp-swiper`,
		sliderWrapper: `${wrapper} .wpcp-swiper .swiper-wrapper`,
		sliderSlide: `${wrapper} .wpcp-swiper .swiper-slide`,
		sliderInner: `${wrapper} .wpcp-swiper .wpcp-item-inner`,
		sliderMedia: `${wrapper} .wpcp-swiper .wpcp-item-media`,
		sliderImg: `${wrapper} .wpcp-swiper .wpcp-item-img`,
		item: `${wrapper} .wpcp-item`,
		itemHover: `${wrapper} .wpcp-item:hover`,
		content: `${wrapper} .wpcp-item-content`,
		diagonalCaption: `${wrapper} .wpcp-diagonal-caption`,
		title: `${wrapper} .wpcp-item-title`,
		titleLink: `${wrapper} .wpcp-content-slot--title > a`,
		desc: `${wrapper} .wpcp-item-desc`,
		readMore: `${wrapper} .wpcp-read-more`,
		readMoreBtn: `${wrapper} .wpcp-read-more.wpcp-btn-type-button`,
		readMoreIconWrap: `${wrapper} .wpcp-read-more .wpcp-readmore-icon`,
		readMoreIcon: `${wrapper} .wpcp-read-more .wpcp-readmore-icon svg, ${wrapper} .wpcp-read-more .wpcp-readmore-icon img`,
		price: `${wrapper} .wpcp-item-price`,
		ratingFill: `${wrapper} .wpcp-rating-fill`,
		ratingEmpty: `${wrapper} .wpcp-rating-empty`,
		media,
		audioMedia,
		audioStyle1Overlay: `${wrapper} .wpcp-audio-card--style1 .wpcp-audio-card__overlay`,
		// Per-slide hover (hovering the carousel root matched every slide before).
		mediaHover,
		mediaBefore: `${wrapper} .wpcp-item-media::before`,
		imageOverlayBefore: `${wrapper} .wpcp-image-overlay.wpcp-item-media::before`,
		// Item-scoped hover so Overlay orientation (content on image) keeps the
		// tint when the cursor is over the caption, not only empty media.
		imageOverlayBeforeHover: `${wrapper} .wpcp-item:hover .wpcp-image-overlay.wpcp-item-media::before`,
		imageOverlayBeforeSocialHover: `${wrapper} .wpcp-item:has(.wpcp-social-share-link:hover) .wpcp-image-overlay.wpcp-item-media::before`,
		img: `${wrapper} .wpcp-item-img`,
		taxonomyWrapper: `${wrapper} .wpcp-taxonomy-wrapper`,
		taxonomy: `${wrapper} .wpcp-item-taxonomy`,
		taxonomyHover: `${wrapper} .wpcp-item-taxonomy:hover`,
		social: `${wrapper} .wpcp-item-social`,
		socialWrapperHover: `${wrapper}:hover .wpcp-item-social`,
		meta: `${wrapper} .wpcp-item-meta`,
		ratingRow: `${wrapper} .wpcp-item-rating`,
		socialSvg: `${wrapper} .wpcp-item-social .wpcp-social-share-link svg`,
		socialLink: `${wrapper} .wpcp-item-social .wpcp-social-share-link`,
		socialHoverSvg: `${wrapper} .wpcp-item-social .wpcp-social-share-link:hover svg`,
		socialHoverLink: `${wrapper} .wpcp-item-social .wpcp-social-share-link:hover`,
		videoPlay: `${wrapper} .wpcp-video-item-play`,
		videoPlayIconWrapper: `${wrapper} .wpcp-video-play-icon`,
		videoPlayIcon: `${wrapper} .wpcp-video-item-play svg, ${wrapper} .wpcp-video-item-play img`,
		videoThumbnailWrapper: `${wrapper} .wpcp-video-thumbnail-wrapper`,
		videoThumbnailWrapperOverlay: `${wrapper} .wpcp-video-thumbnail-overlay`,
		videoPlayHoverIcon: `${wrapper} .wpcp-item:hover .wpcp-video-item-play svg, ${wrapper} .wpcp-item:hover .wpcp-video-item-play img`,
		videoPlayHover: `${wrapper} .wpcp-item:hover .wpcp-video-play-icon`,
		clickActionWrapper: `${wrapper} .wpcp-overlay-icons`,
		clickActionIcon: `${wrapper} .wpcp-overlay-icon`,
		clickActionLightbox: `${wrapper} .wpcp-lightbox-icon`,
		clickActionLightboxHover: `${wrapper} .wpcp-lightbox-icon:hover`,
		clickActionLink: `${wrapper} .wpcp-link-icon`,
		clickActionLinkHover: `${wrapper} .wpcp-link-icon:hover`,
		audioPlayer: `${wrapper} .wpcp-audio-card__player`,
		audioOutput: `${wrapper} .wpcp-audio-card__player-element, ${wrapper} .wpcp-audio-card__player-embed, ${wrapper} .wpcp-audio-card__fallback`,
		audioPlayerItems: `${wrapper} .wpcp-audio-card__player, ${wrapper} .wpcp-audio-card__player-element, ${wrapper} .wpcp-audio-card__player-embed, ${wrapper} .wpcp-audio-card__fallback, ${wrapper} .wpcp-audio-player-preview, ${wrapper} .wpcp-audio-player-preview__time`,
		audioPlayerSolidIcons: `${wrapper} .wpcp-audio-player-preview__value, ${wrapper} .wpcp-audio-player-preview__thumb, ${wrapper} .wpcp-audio-player-preview__button--pause::before, ${wrapper} .wpcp-audio-player-preview__button--pause::after, ${wrapper} .wpcp-audio-player-preview__button--gear::after`,
		audioPlayerBorderIcons: `${wrapper} .wpcp-audio-player-preview__button--volume::after, ${wrapper} .wpcp-audio-player-preview__button--gear::before`,
		audioPlayerVolumeIcon: `${wrapper} .wpcp-audio-player-preview__button--volume::before`,
		audioPlayerWebkitText: `${wrapper} .wpcp-audio-card__player-element::-webkit-media-controls-current-time-display, ${wrapper} .wpcp-audio-card__player-element::-webkit-media-controls-time-remaining-display`,
		tilesGrid: `${wrapper} .wpcp-tiles-grid`,
		tilesTile: `${wrapper} .wpcp-tiles-tile`,
		// Thumbnails-slider scaffolding selectors. The `.wpcp-thumbs-area` element
		// itself is rendered by the thumbnails-slider render branch (when the
		// main-stage / thumb-strip architecture lands); the rules below activate
		// the moment that markup appears.
		carouselRender: `${wrapper} .wpcp-carousel-render`,
		thumbsArea: `${wrapper} .wpcp-thumbs-area`,
		thumbsAreaStrip: `${wrapper} .wpcp-thumbs-area .wpcp-swiper-thumb-wrapper`,
		thumb: `${wrapper} .wpcp-thumb`,
		thumbImg: `${wrapper} .wpcp-thumb img`,
		thumbActive: `${wrapper} .wpcp-thumb.wpcp-thumb-active`,
		thumbActiveImg: `${wrapper} .wpcp-thumb.wpcp-thumb-active img`,
		thumbInactiveImg: `${wrapper} .wpcp-thumb:not(.wpcp-thumb-active) img`,
		thumbHover: `${wrapper} .wpcp-thumb:hover`,
	};
};
