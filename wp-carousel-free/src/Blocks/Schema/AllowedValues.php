<?php
/**
 * Free-tier value allow-lists.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Query_Options_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * The Free values for each constrained option.
 *
 * Top-level string attributes carry an `enum` so core rejects a bad value
 * before the render callback runs. Keys nested inside an object attribute
 * cannot use that route: a failed nested validation makes WordPress discard the
 * whole bag and fall back to its default, which would silently wipe an
 * author's other settings. Those are whitelisted on read instead, which is why
 * every accessor here returns a safe fallback rather than the raw value.
 */
class AllowedValues {

	/**
	 * Content sources with a provider in Free.
	 *
	 * @var string[]
	 */
	const SOURCES = array( 'image', 'post', 'product', 'video' );

	/**
	 * Video providers with an embed builder in Free.
	 *
	 * TikTok, Twitch, TED, DailyMotion, Rumble, Wistia, SproutVideo, raw embed
	 * code, self-hosted files and MP4 URLs are Pro; their extractors are absent
	 * from `VideoCardRenderer`, so a saved value snaps back to `youtube`.
	 *
	 * @var string[]
	 */
	const VIDEO_SOURCES = array( 'youtube', 'vimeo' );

	/**
	 * Carousel styles available in Free.
	 *
	 * `grid` and `thumbnails` are the Tiles and Thumbnails Slider defaults —
	 * both Free blocks — so they belong here even though no picker offers them.
	 *
	 * @var string[]
	 */
	const CAROUSEL_STYLES = array( 'standard', 'center', 'grid', 'thumbnails' );

	/**
	 * The block slugs Free registers.
	 *
	 * `blockName` is what selects the block-aware fallback in
	 * `carousel_style_fallback()`, `content_orientation_fallback()`,
	 * `default_nav_position()` and `default_image_aspect_ratio()`, so an
	 * arbitrary string would silently pick the carousel branch of all four.
	 * Kept in step with `blocks/blocks/block-manifest.json` by
	 * `npm run lint:manifest`.
	 *
	 * @var string[]
	 */
	const BLOCK_NAMES = array( 'carousel', 'slider', 'thumbnails-slider', 'tiles', 'marquee', 'carousel-panorama' );

	/**
	 * Content orientations available in Free.
	 *
	 * @var string[]
	 */
	const CONTENT_ORIENTATIONS = array( 'image-top', 'overlay', 'diagonal' );

	/**
	 * Content orientations the Slider and Thumbnails Slider offer.
	 *
	 * Both blocks show one full-bleed slide, so Classic's below-image flow has
	 * nowhere to sit; Overlay Box is Pro. Free ships Overlay and Diagonal.
	 *
	 * @var string[]
	 */
	const SLIDER_CONTENT_ORIENTATIONS = array( 'overlay', 'diagonal' );

	/**
	 * Slide transitions available in Free.
	 *
	 * @var string[]
	 */
	const EFFECTS = array( 'slide', 'flip', 'cube' );

	/**
	 * Slider block styles available in Free.
	 *
	 * Fade and the UI Initiative styles (Super Flow, Shaders, Ken Burns,
	 * Shutters, Slicer, Fashion) are Pro; their parameters are absent from
	 * `effectOptions.js`, so a saved value lands back on `slide`.
	 *
	 * @var string[]
	 */
	const SLIDER_LAYOUTS = array( 'slide', 'flip', 'coverflow', 'cube' );

	/**
	 * Thumbnails Slider layouts available in Free — Thumb Bottom only. Thumb
	 * Overlay, Slidable Menu and Spotlight Thumb are Pro; their render, CSS and
	 * frontend branches are absent, so a saved value lands back on `strip`.
	 *
	 * @var string[]
	 */
	const THUMBS_LAYOUTS = array( 'strip' );

	/**
	 * Thumb-strip positions available in Free — below the stage only. Top, Left
	 * and Right are Pro, along with the strip width, side-strip width and
	 * alignment; the grid, vertical-strip and width branches are absent, so a
	 * saved value lands back on `bottom`.
	 *
	 * @var string[]
	 */
	const THUMBS_AREA_POSITIONS = array( 'bottom' );

	/**
	 * Active thumbnail styles available in Free — Default only. Frame,
	 * Indicator, Grayscale, Overlay and Countdown are Pro, so a saved value
	 * lands back on `none` and only that style's decoration exists in the tree.
	 *
	 * @var string[]
	 */
	const THUMBNAIL_ACTIVE_STYLES = array( 'none' );

	/**
	 * Display orientations available in Free. Vertical is Pro; this whitelist
	 * makes its Swiper direction branch unreachable on read, so a saved value
	 * lands back on `horizontal`. (The branch itself — BlockRenderer,
	 * ConfigBuilder, swiperCarousel.js, verticalLayout.js — is not yet deleted;
	 * tracked as a follow-up cleanup pass.)
	 *
	 * @var string[]
	 */
	const DISPLAY_STYLES = array( 'horizontal' );

	/**
	 * Tile layouts available in Free — the uniform grid plus the Hero + 2 × 2
	 * bento preset. The seven remaining presets are Pro; their span tables are
	 * absent from `Rendering\TilesBinPack`, so a saved value lands back on `one`.
	 *
	 * @var string[]
	 */
	const TILE_LAYOUTS = array( 'one', 'two', 'three' );

	/**
	 * Navigation arrow styles available in Free — the first preset only. The
	 * remaining eleven are Pro; their SVGs are absent from
	 * `Rendering\NavigationBuilder`, so a saved value lands back on
	 * `chevron-solid`.
	 *
	 * @var string[]
	 */
	const ARROW_STYLES = array( 'chevron-solid' );

	/**
	 * Navigation arrow positions available in Free — the three side presets.
	 * The six top/bottom presets are Pro; their inset and offset branches are
	 * absent from the navigation dynamic CSS, so a saved value lands back on
	 * `nav-vertical-center`.
	 *
	 * @var string[]
	 */
	const NAV_POSITIONS = array(
		'nav-vertical-center-inner',
		'nav-vertically-inner-and-outer',
		'nav-vertical-center',
	);

	/**
	 * Click action types available in Free. Link and Both are Pro; their
	 * anchor dispatch, overlay URL icon and Apply-URL-To branches are absent,
	 * so a saved value lands back on `lightbox`.
	 *
	 * @var string[]
	 */
	const CLICK_ACTION_TYPES = array( 'lightbox', 'disable' );

	/**
	 * Pagination styles available in Free. Numbers, Strokes, Scrollbar and
	 * Fraction are Pro; their Swiper params, size variables and CSS rules are
	 * absent, so a saved value lands back on `dots`.
	 *
	 * @var string[]
	 */
	const PAGINATION_STYLES = array( 'dots', 'dynamic', 'stepper' );

	/**
	 * Ajax pagination types available in Free — numbered pages only. Load More
	 * and Infinite Scroll are Pro; their controls, frontend runtime and CSS are
	 * absent, so a saved value lands back on `number`.
	 *
	 * @var string[]
	 */
	const PAGINATION_TYPES = array( 'number' );

	/**
	 * Ajax pagination number display styles available in Free. Number +
	 * Next/Previous is Pro; the prev/next buttons, their icon set and icon
	 * sizing are absent, so a saved value lands back on `number`.
	 *
	 * @var string[]
	 */
	const PAGINATION_NUMBER_STYLES = array( 'number' );

	/**
	 * Image aspect ratios available in Free. Custom is Pro; its
	 * `customImageWidth`/`customImageHeight` dimension controls are absent from
	 * the Free inspector, so a saved value lands back on the schema default.
	 *
	 * @var string[]
	 */
	const IMAGE_ASPECT_RATIOS = array( 'original', '1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9' );

	/**
	 * Hover animation "Effects and Animation Type" values available in Free.
	 * Both modes ship; each one's effect list is trimmed to its Free values.
	 *
	 * @var string[]
	 */
	const EFFECT_TYPES = array( 'premade', 'custom' );

	/**
	 * Premade hover-animation effects available in Free. Only the Move
	 * transforms ship CSS here; every other preset (Jazz, Apollo, Selena,
	 * Oscar, Layla, Bubba, Push Image, Flash, Fold Up, Ripple Expand, Curtain
	 * Close) is Pro and lists as a disabled `(Pro)` option, so a saved value
	 * lands back on `none`.
	 *
	 * @var string[]
	 */
	const ANIMATION_EFFECTS = array( 'none', 'move-left', 'move-right', 'move-top', 'move-bottom' );

	/**
	 * Custom-mode Image Hover effects available in Free — Zoom In and Zoom
	 * Out. Move, Rotate, Grow Rotate, Shine and the Shine combinations are
	 * Pro; their CSS is absent, so a saved value lands back on `zoom`.
	 *
	 * @var string[]
	 */
	const IMAGE_HOVER_EFFECTS = array( 'none', 'zoom', 'zoom-out' );

	/**
	 * Custom-mode Overlay effects available in Free — Zoom Out and Zoom In.
	 * The rest of the overlay catalog is Pro; its CSS is absent, so a saved
	 * value lands back on `none`.
	 *
	 * @var string[]
	 */
	const OVERLAY_EFFECTS = array( 'none', 'zoomOut', 'zoomInCenter' );

	/**
	 * Custom-mode Content effects available in Free — the four Zoom In
	 * reveals. Every other content animation is Pro; its CSS is absent, so a
	 * saved value lands back on `zoomIn`.
	 *
	 * @var string[]
	 */
	const CONTENT_ANIMATIONS = array( 'none', 'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight' );

	/**
	 * Scale and Animation Duration are Pro on every effect axis. Free emits no
	 * duration or scale custom property, so these keys are dropped on read.
	 *
	 * @var string[]
	 */
	const PRO_EFFECT_KEYS = array(
		'animationDuration',
		'imageHoverScale',
		'hoverDuration',
		'overlayDuration',
		'contentDuration',
	);

	/**
	 * `queryOptions.filter` values available in Free, for post and product alike.
	 *
	 * Every other filter — Filter by Taxonomy, Featured, Popular, Best Selling,
	 * Top Rated, On Sale, Filter by Date Range, Filter by Author, Specific
	 * Posts/Products — is Pro: the inspector lists them as disabled `(Pro)`
	 * options, no source applies a filter to its WP_Query, and a saved value
	 * lands back on `latest`.
	 *
	 * @var string[]
	 */
	const QUERY_FILTERS = array( 'latest' );

	/**
	 * `queryOptions` keys that only the Pro taxonomy filter writes. Free has no
	 * reader for them, so they are dropped on read.
	 *
	 * @var string[]
	 */
	const PRO_TAXONOMY_KEYS = array( 'taxonomySlug', 'taxonomyTermIds', 'taxonomyOperator' );

	/**
	 * Taxonomy panel "Display Position" values available in Free. Over The
	 * Thumb is Pro; its media-box injection and over-thumb CSS are absent, so a
	 * saved value lands back on the default in-flow position.
	 *
	 * @var string[]
	 */
	const TAXONOMY_POSITIONS = array( '', 'beside-meta' );

	/**
	 * Taxonomy panel "Taxonomy Type" values available in Free — Category and
	 * Tag. Both is Pro; its combined-terms renderer branch is absent, so a
	 * saved value lands back on `category`.
	 *
	 * @var string[]
	 */
	const TAXONOMY_TYPES = array( 'category', 'tag' );

	/**
	 * Meta Data panel "Separator" values available in Free — Bullet and None.
	 * Dash, Pipe, Slash and Back Slash are Pro; their entries are absent from
	 * the renderer's separator map, so a saved value lands back on `bullet`.
	 *
	 * @var string[]
	 */
	const META_SEPARATORS = array( 'bullet', 'none' );

	/**
	 * Resolve a video provider.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function video_source( $value ) {
		return self::pick( $value, self::VIDEO_SOURCES, 'youtube' );
	}

	/**
	 * Resolve a carousel style.
	 *
	 * @param mixed  $value    Saved value.
	 * @param string $fallback Value to use when rejected.
	 * @return string
	 */
	public static function carousel_style( $value, $fallback = 'standard' ) {
		return self::pick( $value, self::CAROUSEL_STYLES, $fallback );
	}

	/**
	 * Resolve a content orientation.
	 *
	 * @param mixed  $value    Saved value.
	 * @param string $fallback Value to use when rejected.
	 * @return string
	 */
	public static function content_orientation( $value, $fallback = 'image-top' ) {
		return self::pick( $value, self::CONTENT_ORIENTATIONS, $fallback );
	}

	/**
	 * The content orientations a block offers.
	 *
	 * Mirrors `getContentOrientationItems()` in `contentOrientations.jsx`.
	 *
	 * @param mixed $block_name Saved `blockName` attribute.
	 * @return string[]
	 */
	public static function content_orientations_for_block( $block_name ) {
		$block_name = is_string( $block_name ) ? strtolower( $block_name ) : '';

		return in_array( $block_name, array( 'slider', 'thumbnails-slider' ), true )
			? self::SLIDER_CONTENT_ORIENTATIONS
			: self::CONTENT_ORIENTATIONS;
	}

	/**
	 * Resolve a slide transition.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function effect( $value ) {
		return self::pick( $value, self::EFFECTS, 'slide' );
	}

	/**
	 * Resolve a slider block style.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function slider_layout( $value ) {
		return self::pick( $value, self::SLIDER_LAYOUTS, 'slide' );
	}

	/**
	 * Resolve a thumbnails layout.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function thumbs_layout( $value ) {
		return self::pick( $value, self::THUMBS_LAYOUTS, 'strip' );
	}

	/**
	 * Resolve a thumb-strip position.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function thumbs_area_position( $value ) {
		return self::pick( $value, self::THUMBS_AREA_POSITIONS, 'bottom' );
	}

	/**
	 * Resolve an active thumbnail style.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function thumbnail_active_style( $value ) {
		return self::pick( $value, self::THUMBNAIL_ACTIVE_STYLES, 'none' );
	}

	/**
	 * Resolve a tile layout.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function tile_layout( $value ) {
		return self::pick( $value, self::TILE_LAYOUTS, 'one' );
	}

	/**
	 * Resolve a navigation arrow style.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function arrow_style( $value ) {
		return self::pick( $value, self::ARROW_STYLES, 'chevron-solid' );
	}

	/**
	 * Resolve a navigation arrow position.
	 *
	 * @param mixed  $value    Saved value.
	 * @param string $fallback Value to use when rejected.
	 * @return string
	 */
	public static function nav_position( $value, $fallback = 'nav-vertical-center' ) {
		return self::pick( $value, self::NAV_POSITIONS, $fallback );
	}

	/**
	 * Resolve a pagination style.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function pagination_style( $value ) {
		return self::pick( $value, self::PAGINATION_STYLES, 'dots' );
	}

	/**
	 * Resolve an ajax pagination type.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function pagination_type( $value ) {
		return self::pick( $value, self::PAGINATION_TYPES, 'number' );
	}

	/**
	 * Resolve an ajax pagination number display style.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function pagination_number_style( $value ) {
		return self::pick( $value, self::PAGINATION_NUMBER_STYLES, 'number' );
	}

	/**
	 * Resolve a click action type.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function click_action_type( $value ) {
		return self::pick( $value, self::CLICK_ACTION_TYPES, 'lightbox' );
	}

	/**
	 * Resolve an effects-and-animation type.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function effect_type( $value ) {
		return self::pick( $value, self::EFFECT_TYPES, 'premade' );
	}

	/**
	 * Resolve a premade hover-animation effect.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function animation_effect( $value ) {
		return self::pick( $value, self::ANIMATION_EFFECTS, 'none' );
	}

	/**
	 * Resolve a custom-mode Image Hover effect.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function image_hover_effect( $value ) {
		return self::pick( $value, self::IMAGE_HOVER_EFFECTS, 'zoom' );
	}

	/**
	 * Resolve a custom-mode Content effect.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function content_animation( $value ) {
		return self::pick_exact( $value, self::CONTENT_ANIMATIONS, 'zoomIn' );
	}

	/**
	 * Resolve an overlay-effect value.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function overlay_effect( $value ) {
		return self::pick_exact( $value, self::OVERLAY_EFFECTS, 'none' );
	}

	/**
	 * Resolve a display style.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function display_style( $value ) {
		return self::pick( $value, self::DISPLAY_STYLES, 'horizontal' );
	}

	/**
	 * Resolve a query filter.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function query_filter( $value ) {
		return self::pick( $value, self::QUERY_FILTERS, 'latest' );
	}

	/**
	 * Resolve an image aspect ratio.
	 *
	 * @param mixed  $value    Saved value.
	 * @param string $fallback Value to use when rejected.
	 * @return string
	 */
	public static function image_aspect_ratio( $value, $fallback = '4:3' ) {
		return self::pick( $value, self::IMAGE_ASPECT_RATIOS, $fallback );
	}

	/**
	 * Resolve a taxonomy display position.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function taxonomy_position( $value ) {
		return self::pick( $value, self::TAXONOMY_POSITIONS, '' );
	}

	/**
	 * Resolve a taxonomy type for a non-product source.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function taxonomy_type( $value ) {
		return self::pick( $value, self::TAXONOMY_TYPES, 'category' );
	}

	/**
	 * Resolve a meta separator.
	 *
	 * @param mixed $value Saved value.
	 * @return string
	 */
	public static function meta_separator( $value ) {
		return self::pick( $value, self::META_SEPARATORS, 'bullet' );
	}

	/**
	 * Snap every constrained nested key in an attribute bag to a Free value.
	 *
	 * The single enforcement point for options that live inside an object
	 * attribute, where an `enum` would make core discard the whole bag. Call it
	 * on any path that reads saved attributes — render, dynamic CSS, frontend
	 * config, REST — so a hand-authored block comment cannot reach Pro code.
	 *
	 * Absent keys stay absent: adding them would change the markup of a block
	 * that never set them.
	 *
	 * @param array<string,mixed> $attributes Saved or merged attributes.
	 * @return array<string,mixed>
	 */
	public static function project( array $attributes ): array {
		if ( isset( $attributes['layoutOptions'] ) && is_array( $attributes['layoutOptions'] ) ) {
			$layout = $attributes['layoutOptions'];

			if ( isset( $layout['carouselStyle'] ) ) {
				$layout['carouselStyle'] = self::carousel_style(
					$layout['carouselStyle'],
					self::carousel_style_fallback( $attributes['blockName'] ?? '' )
				);
			}

			if ( isset( $layout['contentOrientation'] ) ) {
				$block_name                   = $attributes['blockName'] ?? '';
				$layout['contentOrientation'] = self::pick(
					$layout['contentOrientation'],
					self::content_orientations_for_block( $block_name ),
					self::content_orientation_fallback( $block_name )
				);
			}

			if ( isset( $layout['sliderLayout'] ) ) {
				$layout['sliderLayout'] = self::slider_layout( $layout['sliderLayout'] );
			}

			if ( isset( $layout['thumbsLayout'] ) ) {
				$layout['thumbsLayout'] = self::thumbs_layout( $layout['thumbsLayout'] );
			}

			if ( isset( $layout['tileLayout'] ) ) {
				$layout['tileLayout'] = self::tile_layout( $layout['tileLayout'] );
			}

			if ( isset( $layout['displayStyle'] ) ) {
				$layout['displayStyle'] = self::display_style( $layout['displayStyle'] );
			}

			// Gallery / Category Filter, Ajax Search and the Custom Layout
			// bin-pack are Pro. The inspector shows them locked; Free has no
			// reader for any of these, and no bin-pack to spend `tileSpans` on.
			unset(
				$layout['showFilter'],
				$layout['showAjaxSearch'],
				$layout['customLayout'],
				$layout['tileSpans'],
				$layout['tileResponsiveRescale']
			);

			$attributes['layoutOptions'] = $layout;
		}

		if ( isset( $attributes['thumbsArea'] ) && is_array( $attributes['thumbsArea'] ) ) {
			$thumbs_area = $attributes['thumbsArea'];

			if ( isset( $thumbs_area['position'] ) ) {
				$thumbs_area['position'] = self::thumbs_area_position( $thumbs_area['position'] );
			}

			// Thumb Area Width is Pro, along with the side-strip width and
			// vertical alignment that only apply to a left/right strip. Strip
			// alignment goes with them: at the fixed 100% width there is no
			// slack to align into, so Free has no reader for any of these.
			unset(
				$thumbs_area['width'],
				$thumbs_area['widthTablet'],
				$thumbs_area['widthMobile'],
				$thumbs_area['widthUnit'],
				$thumbs_area['sideThumbAreaWidth'],
				$thumbs_area['verticalAlign'],
				$thumbs_area['alignment']
			);

			$attributes['thumbsArea'] = $thumbs_area;
		}

		if ( isset( $attributes['thumbnail'] ) && is_array( $attributes['thumbnail'] ) ) {
			$thumbnail = $attributes['thumbnail'];

			if ( isset( $thumbnail['activeStyle'] ) ) {
				$thumbnail['activeStyle'] = self::thumbnail_active_style( $thumbnail['activeStyle'] );
			}

			// Thumb title and description are Pro — the strip renders images
			// only, so Free has no reader left for these keys, the text styling
			// that hung off them, or the four Pro active-style option bags.
			unset(
				$thumbnail['thumbnailTitle'],
				$thumbnail['thumbnailDescription'],
				$thumbnail['descriptionWordLimit'],
				$thumbnail['descriptionLengthUnit'],
				$thumbnail['contentImageGap'],
				$thumbnail['contentImageGapTablet'],
				$thumbnail['contentImageGapMobile'],
				$thumbnail['title'],
				$thumbnail['description'],
				$thumbnail['contentAreaOptions'],
				$thumbnail['indicator'],
				$thumbnail['halfOverlay'],
				$thumbnail['countdown']
			);

			$attributes['thumbnail'] = $thumbnail;
		}

		if ( isset( $attributes['navigationOptions'] ) && is_array( $attributes['navigationOptions'] ) ) {
			$navigation = $attributes['navigationOptions'];

			if ( isset( $navigation['arrowStyle'] ) ) {
				$navigation['arrowStyle'] = self::arrow_style( $navigation['arrowStyle'] );
			}

			if ( isset( $navigation['position'] ) ) {
				$navigation['position'] = self::nav_position(
					$navigation['position'],
					self::default_nav_position( $attributes['blockName'] ?? '' )
				);
			}

			$attributes['navigationOptions'] = $navigation;
		}

		if ( isset( $attributes['paginationDotsOptions'] ) && is_array( $attributes['paginationDotsOptions'] ) ) {
			$pagination = $attributes['paginationDotsOptions'];

			if ( isset( $pagination['paginationStyle'] ) ) {
				$pagination['paginationStyle'] = self::pagination_style( $pagination['paginationStyle'] );
			}

			$attributes['paginationDotsOptions'] = $pagination;
		}

		if ( isset( $attributes['paginationOptions'] ) && is_array( $attributes['paginationOptions'] ) ) {
			$ajax_pagination = $attributes['paginationOptions'];

			if ( isset( $ajax_pagination['type'] ) ) {
				$ajax_pagination['type'] = self::pagination_type( $ajax_pagination['type'] );
			}

			if ( isset( $ajax_pagination['numberDisplayStyle'] ) ) {
				$ajax_pagination['numberDisplayStyle'] = self::pagination_number_style( $ajax_pagination['numberDisplayStyle'] );
			}

			// Load More brings Infinite Scroll, its button text, alignment and
			// ending message; Number + Next/Previous brings the prev/next
			// buttons and their icon. Free has no reader left for any of them.
			unset(
				$ajax_pagination['infiniteScroll'],
				$ajax_pagination['loadMoreAlignment'],
				$ajax_pagination['loadMoreText'],
				$ajax_pagination['endingMessage'],
				$ajax_pagination['showPrevNext'],
				$ajax_pagination['showPrevNextText'],
				$ajax_pagination['prevNextIconEnabled'],
				$ajax_pagination['prevNextIcon'],
				$ajax_pagination['iconSize']
			);

			$attributes['paginationOptions'] = $ajax_pagination;
		}

		if ( isset( $attributes['clickActionOptions'] ) && is_array( $attributes['clickActionOptions'] ) ) {
			$click_action = $attributes['clickActionOptions'];

			if ( isset( $click_action['type'] ) ) {
				$click_action['type'] = self::click_action_type( $click_action['type'] );
			}

			// Override Global Settings is Pro — no reader is left in Free, and
			// dropping the key keeps an injected `true` out of the config payload.
			unset( $click_action['overrideGlobal'] );

			$attributes['clickActionOptions'] = $click_action;
		}

		if ( isset( $attributes['sliderOptions'] ) && is_array( $attributes['sliderOptions'] ) ) {
			$slider = $attributes['sliderOptions'];

			if ( isset( $slider['effect'] ) ) {
				$slider['effect'] = self::effect( $slider['effect'] );
			}

			// Adaptive Height is Pro — its Swiper autoHeight branch is unreachable
			// on read, so an injected `true` never leaves horizontal's default.
			if ( ! empty( $slider['adaptiveHeight'] ) ) {
				$slider['adaptiveHeight'] = false;
			}

			// Content Animation is Pro apart from None — Free has no renderer,
			// CSS or runtime left for it, so both keys are dropped.
			unset( $slider['contentAnimation'], $slider['contentAnimationDuration'] );

			$attributes['sliderOptions'] = $slider;
		}

		if ( isset( $attributes['imageOptions'] ) && is_array( $attributes['imageOptions'] ) ) {
			$image = $attributes['imageOptions'];

			if ( isset( $image['aspectRatio'] ) ) {
				$image['aspectRatio'] = self::image_aspect_ratio(
					$image['aspectRatio'],
					self::default_image_aspect_ratio( $attributes['blockName'] ?? '' )
				);
			}

			$attributes['imageOptions'] = $image;
		}

		if ( isset( $attributes['queryOptions'] ) && is_array( $attributes['queryOptions'] ) ) {
			// The block comment is hand-editable, so these values are as untrusted
			// here as they are on the REST routes — same helper, so the render path,
			// the editor preview and AJAX pagination all resolve one answer.
			$query = Query_Options_Helper::sanitize_untrusted_query_options( $attributes['queryOptions'] );

			if ( isset( $query['filter'] ) ) {
				$query['filter'] = self::query_filter( $query['filter'] );
			}

			foreach ( self::PRO_TAXONOMY_KEYS as $pro_key ) {
				unset( $query[ $pro_key ] );
			}

			$attributes['queryOptions'] = $query;
		}

		if ( isset( $attributes['effectsOptions'] ) && is_array( $attributes['effectsOptions'] ) ) {
			$effects = $attributes['effectsOptions'];

			if ( isset( $effects['effectType'] ) ) {
				$effects['effectType'] = self::effect_type( $effects['effectType'] );
			}

			if ( isset( $effects['animationEffect'] ) ) {
				$effects['animationEffect'] = self::animation_effect( $effects['animationEffect'] );
			}

			if ( isset( $effects['imageHover'] ) ) {
				$effects['imageHover'] = self::image_hover_effect( $effects['imageHover'] );
			}

			if ( isset( $effects['overlayEffect'] ) ) {
				$effects['overlayEffect'] = self::overlay_effect( $effects['overlayEffect'] );
			}

			if ( isset( $effects['contentAnimation'] ) ) {
				$effects['contentAnimation'] = self::content_animation( $effects['contentAnimation'] );
			}

			foreach ( self::PRO_EFFECT_KEYS as $pro_key ) {
				unset( $effects[ $pro_key ] );
			}

			$attributes['effectsOptions'] = $effects;
		}

		if ( isset( $attributes['postContentOptions'] ) && is_array( $attributes['postContentOptions'] ) ) {
			$post_content = $attributes['postContentOptions'];

			// Title Length Limit and Description Length Limit are Pro for the
			// post/video family — Free always renders the full text, so a
			// saved `limited` value snaps back before rendering.
			if ( isset( $post_content['titleLength'] ) ) {
				$post_content['titleLength'] = 'full';
			}

			if ( isset( $post_content['excerptLength'] ) ) {
				$post_content['excerptLength'] = 'full';
			}

			// Show Icon (Read More button) is Pro for this family — no reader
			// is left for it, so the flag and its sub-options are dropped.
			if ( ! empty( $post_content['showIcon'] ) ) {
				$post_content['showIcon'] = false;
			}
			unset( $post_content['showIconHover'] );

			$attributes['postContentOptions'] = $post_content;
		}

		if ( isset( $attributes['productContentOptions'] ) && is_array( $attributes['productContentOptions'] ) ) {
			$product_content = $attributes['productContentOptions'];

			// Title Length Limit and Description Length Limit are Pro for the
			// product family — Free always renders the full text, so a saved
			// `limited` value snaps back before rendering.
			if ( isset( $product_content['titleLength'] ) ) {
				$product_content['titleLength'] = 'full';
			}

			if ( isset( $product_content['excerptLimit'] ) ) {
				$product_content['excerptLimit'] = 'full';
			}

			// Show Cart Icon is Pro — force it off so the renderer never
			// emits the cart icon markup for Free.
			if ( ! empty( $product_content['showCartIcon'] ) ) {
				$product_content['showCartIcon'] = false;
			}

			$attributes['productContentOptions'] = $product_content;
		}

		if ( isset( $attributes['taxonomyOptions'] ) && is_array( $attributes['taxonomyOptions'] ) ) {
			$taxonomy = $attributes['taxonomyOptions'];

			if ( isset( $taxonomy['position'] ) ) {
				$taxonomy['position'] = self::taxonomy_position( $taxonomy['position'] );
			}

			// Product taxonomies are dynamic (product_cat, product_tag, custom
			// product taxonomies) and are not gated here — only the fixed
			// post/video "Both" value is Pro.
			if ( isset( $taxonomy['type'] ) && 'product' !== ( $attributes['sourceType'] ?? 'post' ) ) {
				$taxonomy['type'] = self::taxonomy_type( $taxonomy['type'] );
			}

			$attributes['taxonomyOptions'] = $taxonomy;
		}

		if ( isset( $attributes['metaOptions'] ) && is_array( $attributes['metaOptions'] ) ) {
			$meta = $attributes['metaOptions'];

			if ( isset( $meta['separator'] ) ) {
				$meta['separator'] = self::meta_separator( $meta['separator'] );
			}

			$attributes['metaOptions'] = $meta;
		}

		if ( isset( $attributes['contentAreaOptions'] ) && is_array( $attributes['contentAreaOptions'] ) ) {
			$content_area = $attributes['contentAreaOptions'];

			// Zigzag Orientation is Pro — the alternating image/content layout
			// class never applies in Free.
			if ( ! empty( $content_area['zigZag'] ) ) {
				$content_area['zigZag'] = false;
			}

			$attributes['contentAreaOptions'] = $content_area;
		}

		if ( isset( $attributes['videoOptions'] ) && is_array( $attributes['videoOptions'] ) ) {
			$video = $attributes['videoOptions'];

			// Inline Play Mode and Play Icon Position are Pro. Free plays every
			// video in the lightbox popup and pins the icon at the centre, so no
			// reader is left for these keys or for the inline player settings.
			unset(
				$video['playMode'],
				$video['iconPosition'],
				$video['iconOffset'],
				$video['videoAutoplay'],
				$video['playOnHover'],
				$video['videoLoop'],
				$video['playbackControls']
			);

			$attributes['videoOptions'] = $video;
		}

		return $attributes;
	}

	/**
	 * The orientation a rejected value lands on.
	 *
	 * Slider and Thumbnails Slider have no stacked layout, so a rejected Pro
	 * orientation there must not land on the carousel's `image-top` — that
	 * would render content the block has nowhere to put. The Thumbnails Slider
	 * offers Diagonal in Classic's slot, so a block saved on either Classic or
	 * a Pro orientation resolves to `diagonal`.
	 *
	 * Mirrors `getContentOrientationFallback()` in `contentOrientations.jsx`.
	 *
	 * @param mixed $block_name Saved `blockName` attribute.
	 * @return string
	 */
	public static function content_orientation_fallback( $block_name ) {
		$block_name = is_string( $block_name ) ? strtolower( $block_name ) : '';

		if ( 'thumbnails-slider' === $block_name ) {
			return 'diagonal';
		}

		return 'slider' === $block_name ? 'overlay' : 'image-top';
	}

	/**
	 * The schema default carousel style for a block.
	 *
	 * Tiles and the Thumbnails Slider ship their own style, so a rejected Pro
	 * style there must not land on the carousel's `standard` — that would drop
	 * a Tiles block to a single-row carousel and strip the thumbnail strip off
	 * the Thumbnails Slider. Mirrors each block's schema default.
	 *
	 * @param mixed $block_name Saved `blockName` attribute.
	 * @return string
	 */
	public static function carousel_style_fallback( $block_name ) {
		$block_name = is_string( $block_name ) ? strtolower( $block_name ) : '';

		if ( 'tiles' === $block_name ) {
			return 'grid';
		}

		return 'thumbnails-slider' === $block_name ? 'thumbnails' : 'standard';
	}

	/**
	 * The schema default arrow position for a block.
	 *
	 * Thumbnails Slider keeps its arrows inside the single-slide stage, so a
	 * rejected Pro position there must land on `nav-vertical-center-inner`.
	 * Mirrors ThumbnailsSliderSchema over PaginationNavigationDefaults.
	 *
	 * @param mixed $block_name Saved `blockName` attribute.
	 * @return string
	 */
	private static function default_nav_position( $block_name ) {
		$block_name = is_string( $block_name ) ? $block_name : '';

		return 'thumbnails-slider' === $block_name ? 'nav-vertical-center-inner' : 'nav-vertical-center';
	}

	/**
	 * The schema default image aspect ratio for a block.
	 *
	 * Slider's stage-level aspect box defaults to `original`; every other
	 * block's per-item box defaults to `4:3`. Mirrors SliderSchema over
	 * CarouselBaseSchema.
	 *
	 * @param mixed $block_name Saved `blockName` attribute.
	 * @return string
	 */
	private static function default_image_aspect_ratio( $block_name ) {
		$block_name = is_string( $block_name ) ? $block_name : '';

		return 'slider' === $block_name ? 'original' : '4:3';
	}

	/**
	 * Return the value when allowed, otherwise the fallback — case-sensitive,
	 * for the camelCase effect enums.
	 *
	 * @param mixed    $value    Saved value.
	 * @param string[] $allowed  Allowed values.
	 * @param string   $fallback Value to use when rejected.
	 * @return string
	 */
	private static function pick_exact( $value, array $allowed, $fallback ) {
		if ( ! is_string( $value ) ) {
			return $fallback;
		}

		$value = trim( $value );

		return in_array( $value, $allowed, true ) ? $value : $fallback;
	}

	/**
	 * Return the value when allowed, otherwise the fallback — lowercases first,
	 * so every allow-list it reads must be lowercase.
	 *
	 * @param mixed    $value    Saved value.
	 * @param string[] $allowed  Allowed values, all lowercase.
	 * @param string   $fallback Value to use when rejected.
	 * @return string
	 */
	private static function pick( $value, array $allowed, $fallback ) {
		if ( ! is_string( $value ) ) {
			return $fallback;
		}

		$value = strtolower( trim( $value ) );

		return in_array( $value, $allowed, true ) ? $value : $fallback;
	}
}
