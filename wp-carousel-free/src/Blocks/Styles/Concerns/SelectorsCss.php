<?php
/**
 * Selector bundle for the dynamic-CSS composer (PHP side).
 *
 * Holds the per-instance scoped selector strings and builds them in
 * create_selectors(). Mirrors blocks/blocks/shared/styles/selectors.js
 * (createSelectors). Any change here MUST land on the JS side in the same
 * commit — the css-parity harness catches a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Scoped selector strings + create_selectors() for CarouselDynamicCss.
 */
trait SelectorsCss {

	/**
	 * Unique ID for CSS scoping.
	 *
	 * @var string
	 */
	private $unique_id;

	/**
	 * Item card selector.
	 *
	 * @var string
	 */
	private $item_card;

	/**
	 * Item title selector.
	 *
	 * @var string
	 */
	private $item_title;

	/**
	 * Item description selector.
	 *
	 * @var string
	 */
	private $item_desc;

	/**
	 * Item rating fill selector.
	 *
	 * @var string
	 */
	private $item_rating_fill;

	/**
	 * Item rating empty selector.
	 *
	 * @var string
	 */
	private $item_rating_empty;

	/**
	 * Item image selector.
	 *
	 * @var string
	 */
	private $item_img;

	/**
	 * Item media selector.
	 *
	 * @var string
	 */
	private $item_media;

	/**
	 * Item taxonomy selector.
	 *
	 * @var string
	 */
	private $item_taxonomy;

	/**
	 * Item social selector.
	 *
	 * @var string
	 */
	private $item_social;

	/**
	 * Item meta selector.
	 *
	 * @var string
	 */
	private $item_meta;

	/**
	 * Content area item selector.
	 *
	 * @var string
	 */
	private $content_area_item;

	/**
	 * Content area item hover selector.
	 *
	 * @var string
	 */
	private $content_area_item_hover;

	/**
	 * Title selector.
	 *
	 * @var string
	 */
	private $title_selector;

	/**
	 * Description selector.
	 *
	 * @var string
	 */
	private $desc_selector;

	/**
	 * Rating fill selector.
	 *
	 * @var string
	 */
	private $rating_fill_selector;

	/**
	 * Rating empty selector.
	 *
	 * @var string
	 */
	private $rating_empty_selector;

	/**
	 * Image selector.
	 *
	 * @var string
	 */
	private $image_selector;

	/**
	 * Image media selector.
	 *
	 * @var string
	 */
	private $image_media_selector;

	/**
	 * Image overlay selector.
	 *
	 * @var string
	 */
	private $image_overlay_selector;

	/**
	 * Image overlay hover selector.
	 *
	 * @var string
	 */
	private $image_overlay_hover_selector;

	/**
	 * Image overlay share selector.
	 *
	 * @var string
	 */
	private $image_overlay_share_selector;

	/**
	 * Image media item hover selector.
	 *
	 * @var string
	 */
	private $image_media_item_hover_selector;

	/**
	 * Image filter scope selector.
	 *
	 * @var string
	 */
	private $image_filter_scope_selector;

	/**
	 * Image filter hover scope selector.
	 *
	 * @var string
	 */
	private $image_filter_hover_scope_selector;

	/**
	 * Taxonomy selector.
	 *
	 * @var string
	 */
	private $taxonomy_selector;

	/**
	 * Taxonomy hover selector.
	 *
	 * @var string
	 */
	private $taxonomy_selector_hover;

	/**
	 * Taxonomy wrapper selector.
	 *
	 * @var string
	 */
	private $taxonomy_wrapper_selector;

	/**
	 * Social selector.
	 *
	 * @var string
	 */
	private $social_selector;

	/**
	 * Meta selector.
	 *
	 * @var string
	 */
	private $meta_selector;

	/**
	 * Read more selector.
	 *
	 * @var string
	 */
	private $read_more_selector;

	/**
	 * Read more button selector.
	 *
	 * @var string
	 */
	private $read_more_btn_selector;

	/**
	 * Read more icon wrap selector.
	 *
	 * @var string
	 */
	private $read_more_icon_wrap_selector;

	/**
	 * Read more icon selector.
	 *
	 * @var string
	 */
	private $read_more_icon_selector;

	/**
	 * Price selector.
	 *
	 * @var string
	 */
	private $price_selector;

	/**
	 * Diagonal caption selector.
	 *
	 * @var string
	 */
	private $diagonal_caption_selector;

	/**
	 * Rating row selector.
	 *
	 * @var string
	 */
	private $rating_row_selector;

	/**
	 * Video play selector.
	 *
	 * @var string
	 */
	private $video_play;

	/**
	 * Video play icon wrapper selector.
	 *
	 * @var string
	 */
	private $video_play_icon_wrapper;

	/**
	 * Video play icon selector.
	 *
	 * @var string
	 */
	private $video_play_icon;

	/**
	 * Video play hover icon selector.
	 *
	 * @var string
	 */
	private $video_play_hover_icon;

	/**
	 * Video play hover selector.
	 *
	 * @var string
	 */
	private $video_play_hover;

	/**
	 * Video thumbnail wrapper selector.
	 *
	 * @var string
	 */
	private $video_thumbnail_wrapper;

	/**
	 * Video thumbnail wrapper overlay selector.
	 *
	 * @var string
	 */
	private $video_thumbnail_wrapper_overlay;

	/**
	 * Tiles grid selector.
	 *
	 * @var string
	 */
	private $tiles_grid_selector;

	/**
	 * Tiles tile selector.
	 *
	 * @var string
	 */
	private $tiles_tile_selector;

	/**
	 * Carousel render selector.
	 *
	 * @var string
	 */
	private $carousel_render_selector;

	/**
	 * Thumbnails area selector.
	 *
	 * @var string
	 */
	private $thumbs_area_selector;

	/**
	 * Thumbnails area strip selector.
	 *
	 * @var string
	 */
	private $thumbs_area_strip_selector;

	/**
	 * Thumbnail selector.
	 *
	 * @var string
	 */
	private $thumb_selector;

	/**
	 * Thumbnail hover selector.
	 *
	 * @var string
	 */
	private $thumb_hover_selector;

	/**
	 * Thumbnail image selector.
	 *
	 * @var string
	 */
	private $thumb_img_selector;

	/**
	 * Thumbnail active selector.
	 *
	 * @var string
	 */
	private $thumb_active_selector;

	/**
	 * Thumbnail active image selector.
	 *
	 * @var string
	 */
	private $thumb_active_img_selector;

	/**
	 * Thumbnail inactive image selector.
	 *
	 * @var string
	 */
	private $thumb_inactive_img_selector;

	/**
	 * Build the CSS selector bundle for this instance into the selector properties.
	 *
	 * Mirrors carouselDynamicCss.js createSelectors() (blocks/blocks/shared/styles/selectors.js).
	 * Verbatim extraction of the former inline constructor block — the selector
	 * strings are unchanged. Any change here MUST land on the JS side in the same
	 * commit; the css-parity harness catches a one-sided edit.
	 */
	private function create_selectors() {
		$this->unique_id = '#' . ( $this->attributes['uniqueId'] ?? '' );

		// Define selectors (descendant classes alone — use with `#id` or `#id:hover`).
		$this->item_card         = '.wpcp-item';
		$this->item_title        = '.wpcp-item-title';
		$this->item_desc         = '.wpcp-item-desc';
		$this->item_rating_fill  = '.wpcp-rating-fill';
		$this->item_rating_empty = '.wpcp-rating-empty';
		$this->item_img          = '.wpcp-item-img';
		$this->item_media        = '.wpcp-item-media';
		$this->item_taxonomy     = '.wpcp-item-taxonomy';
		$this->item_social       = '.wpcp-item-social';
		$this->item_meta         = '.wpcp-item-meta';

		// Combined selectors.
		$this->content_area_item         = $this->unique_id . ' ' . $this->item_card;
		$this->content_area_item_hover   = $this->unique_id . ' ' . $this->item_card . ':hover';
		$this->diagonal_caption_selector = $this->unique_id . ' .wpcp-diagonal-caption';
		$this->title_selector            = $this->unique_id . ' ' . $this->item_title;
		$this->desc_selector             = $this->unique_id . ' ' . $this->item_desc;
		$this->rating_fill_selector      = $this->unique_id . ' ' . $this->item_rating_fill;
		$this->rating_empty_selector     = $this->unique_id . ' ' . $this->item_rating_empty;
		$this->image_selector            = $this->unique_id . ' ' . $this->item_img;
		$this->image_media_selector      = $this->unique_id . ' .wpcp-item-media';
		$this->image_overlay_selector    = $this->unique_id . ' .wpcp-image-overlay.wpcp-item-media::before';
		// Item-scoped hover so Overlay orientation (content on image) keeps the
		// tint when the cursor is over the caption, not only empty media.
		$this->image_overlay_hover_selector      = $this->unique_id . ' .wpcp-item:hover .wpcp-image-overlay.wpcp-item-media::before';
		$this->image_overlay_share_selector      = $this->unique_id . ' .wpcp-item:has(.wpcp-social-share-link:hover) .wpcp-image-overlay.wpcp-item-media::before';
		$this->image_media_item_hover_selector   = $this->unique_id . ' .wpcp-item:hover .wpcp-item-media';
		$this->image_filter_scope_selector       = $this->unique_id . ' .wpcp-item-img, ' . $this->unique_id . ' .wpcp-item-placeholder';
		$this->image_filter_hover_scope_selector = $this->unique_id . ' .wpcp-item:hover .wpcp-item-img, ' . $this->unique_id . ' .wpcp-item:hover .wpcp-item-placeholder';
		$this->taxonomy_selector                 = $this->unique_id . ' ' . $this->item_taxonomy;
		$this->taxonomy_selector_hover           = $this->unique_id . ' ' . $this->item_taxonomy . ':hover';
		$this->taxonomy_wrapper_selector         = $this->unique_id . ' .wpcp-taxonomy-wrapper';
		$this->social_selector                   = $this->unique_id . ' ' . $this->item_social;
		$this->meta_selector                     = $this->unique_id . ' ' . $this->item_meta;
		$this->read_more_selector                = $this->unique_id . ' .wpcp-read-more';
		$this->read_more_btn_selector            = $this->unique_id . ' .wpcp-read-more.wpcp-btn-type-button';
		$this->read_more_icon_wrap_selector      = $this->unique_id . ' .wpcp-read-more .wpcp-readmore-icon';
		$this->read_more_icon_selector           = $this->unique_id . ' .wpcp-read-more .wpcp-readmore-icon svg, ' . $this->unique_id . ' .wpcp-read-more .wpcp-readmore-icon img';
		$this->price_selector                    = $this->unique_id . ' .wpcp-item-price';
		$this->rating_row_selector               = $this->unique_id . ' .wpcp-item-rating';

		// Video selectors (mirrors carouselDynamicCss.js createSelectors).
		$this->video_play                      = $this->unique_id . ' .wpcp-video-item-play';
		$this->video_play_icon_wrapper         = $this->unique_id . ' .wpcp-video-play-icon';
		$this->video_play_icon                 = $this->unique_id . ' .wpcp-video-item-play svg, ' . $this->unique_id . ' .wpcp-video-item-play img';
		$this->video_thumbnail_wrapper         = $this->unique_id . ' .wpcp-video-thumbnail-wrapper';
		$this->video_thumbnail_wrapper_overlay = $this->unique_id . ' .wpcp-video-thumbnail-overlay';
		$this->video_play_hover_icon           = $this->unique_id . ' .wpcp-item:hover .wpcp-video-item-play svg, ' . $this->unique_id . ' .wpcp-item:hover .wpcp-video-item-play img';
		$this->video_play_hover                = $this->unique_id . ' .wpcp-item:hover .wpcp-video-play-icon';

		$this->tiles_grid_selector = $this->unique_id . ' .wpcp-tiles-grid';
		$this->tiles_tile_selector = $this->unique_id . ' .wpcp-tiles-tile';

		// Thumbnails-slider scaffolding selectors (mirrors carouselDynamicCss.js).
		$this->carousel_render_selector    = $this->unique_id . ' .wpcp-carousel-render';
		$this->thumbs_area_selector        = $this->unique_id . ' .wpcp-thumbs-area';
		$this->thumbs_area_strip_selector  = $this->thumbs_area_selector . ' .wpcp-swiper-thumb-wrapper';
		$this->thumb_selector              = $this->unique_id . ' .wpcp-thumb';
		$this->thumb_hover_selector        = $this->unique_id . ' .wpcp-thumb:hover';
		$this->thumb_img_selector          = $this->unique_id . ' .wpcp-thumb img';
		$this->thumb_active_selector       = $this->unique_id . ' .wpcp-thumb.wpcp-thumb-active';
		$this->thumb_active_img_selector   = $this->unique_id . ' .wpcp-thumb.wpcp-thumb-active img';
		$this->thumb_inactive_img_selector = $this->unique_id . ' .wpcp-thumb:not(.wpcp-thumb-active) img';
	}
}
