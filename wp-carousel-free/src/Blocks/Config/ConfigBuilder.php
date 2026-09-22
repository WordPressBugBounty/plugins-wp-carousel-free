<?php
/**
 * Builds the `data-wpcp` attribute payload and partial-slide view state.
 *
 * Extracted from `BlockRenderer` so Swiper options (columns, effect, direction,
 * partial `slidesPerView` offsets, etc.) stay in one testable class. Pulls
 * pagination style bits from the shared {@see \ShapedPlugin\WPCarouselFree\Blocks\Rendering\NavigationBuilder}
 * so nav inner-block settings match the JSON sent to the frontend script.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Config;

use ShapedPlugin\WPCarouselFree\Blocks\Rendering\NavigationBuilder;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * Normalises attributes into the compact config array consumed by `data-wpcp`.
 */
class ConfigBuilder {

	/**
	 * Normalised block attributes.
	 *
	 * @var array
	 */
	private array $attrs;

	/**
	 * Block slug without namespace, e.g. "carousel".
	 *
	 * @var string
	 */
	private string $slug;

	/**
	 * Pagination options source for data-wpcp.
	 *
	 * @var NavigationBuilder
	 */
	private NavigationBuilder $navigation;

	/**
	 * Constructor.
	 *
	 * @param array             $attrs      Normalised block attributes.
	 * @param string            $slug       Block slug without namespace.
	 * @param NavigationBuilder $navigation Shared builder for pagination config subset.
	 */
	public function __construct( array $attrs, string $slug, NavigationBuilder $navigation ) {
		$this->attrs      = AllowedValues::project( $attrs );
		$this->slug       = $slug;
		$this->navigation = $navigation;
	}

	/**
	 * Main entry: the config array for `wp_json_encode` → `data-wpcp`.
	 *
	 * @param int $total_items Number of slides.
	 * @return array<string, mixed>
	 */
	public function build( int $total_items ): array {
		return $this->build_frontend_config( $total_items );
	}

	/**
	 * Build the compact JSON configuration used by the frontend JS.
	 *
	 * @param int $total_items Item count for loop thresholds.
	 * @return array<string, mixed>
	 */
	private function build_frontend_config( int $total_items ): array {
		$layout_options = $this->attrs['layoutOptions'] ?? array();
		$slider_options = $this->attrs['sliderOptions'] ?? array();
		// Motion Effects is Pro, so every device is always on here. Read from a
		// constant, never from the attributes: `motionDevices` is absent from the
		// Free schema, and core keeps undeclared attributes rather than dropping
		// them, so reading it would let a crafted block comment set this value.
		$motion_devices = array( 'Desktop', 'Tablet', 'Mobile' );

		$carousel_style = $layout_options['carouselStyle'] ?? 'standard';
		$is_tiles       = ( 'tiles' === $this->slug || 'grid' === $carousel_style );

		$effect_raw = isset( $slider_options['effect'] ) ? (string) $slider_options['effect'] : 'slide';
		// The Center style only supports the default 'slide' transition, so any
		// saved effect resolves to 'slide'.
		if ( 'center' === $carousel_style ) {
			$effect_raw = 'slide';
		}
		$single_slide_stack_effect = in_array( $effect_raw, array( 'flip', 'cube' ), true );

		$swiper_spv_desktop = (float) ( $layout_options['columns'] ?? 3 );
		$swiper_spv_tablet  = (float) ( $layout_options['columnsTablet'] ?? 2 );
		$swiper_spv_mobile  = (float) ( $layout_options['columnsMobile'] ?? 1 );
		if ( $single_slide_stack_effect ) {
			$swiper_spv_desktop = 1.0;
			$swiper_spv_tablet  = 1.0;
			$swiper_spv_mobile  = 1.0;
		}

		$is_slider_or_thumb = in_array( $this->attrs['blockName'], array( 'slider', 'thumbnails-slider' ), true );
		$is_slider          = in_array( $this->attrs['blockName'], array( 'slider' ), true );
		$slider_styles      = $is_slider ? $this->attrs['layoutOptions']['sliderLayout'] ?? '' : $carousel_style;
		$navigation_enabled = ! empty( $layout_options['navigation'] );
		$pagination_enabled = ! empty( $layout_options['pagination'] );

		return array(
			'slug'                => $this->slug,
			'isTiles'             => $is_tiles,
			'sourceType'          => $this->attrs['sourceType'] ?? 'image',
			'totalItems'          => $total_items,
			'style'               => $slider_styles,
			'variableWidth'       => ! empty( $layout_options['variableWidth'] ),
			'displayStyle'        => $layout_options['displayStyle'] ?? 'horizontal',
			'contentOrientation'  => $layout_options['contentOrientation'] ?? 'overlay',
			'columns'             => $is_slider_or_thumb ? array(
				'desktop' => 1,
				'tablet'  => 1,
				'mobile'  => 1,
			) : array(
				'desktop' => (int) ( $layout_options['columns'] ?? 3 ),
				'tablet'  => (int) ( $layout_options['columnsTablet'] ?? 2 ),
				'mobile'  => (int) ( $layout_options['columnsMobile'] ?? 1 ),
			),
			'gap'                 => $is_slider_or_thumb ? array(
				'desktop' => 0,
				'tablet'  => 0,
				'mobile'  => 0,
			) : array(
				'desktop' => (int) ( $layout_options['gap'] ?? 20 ),
				'tablet'  => (int) ( $layout_options['gapTablet'] ?? 20 ),
				'mobile'  => (int) ( $layout_options['gapMobile'] ?? 10 ),
			),
			'gapUnit'             => array(
				'desktop' => sanitize_text_field( $layout_options['gapUnit'] ?? 'px' ),
				'tablet'  => sanitize_text_field( $layout_options['gapTabletUnit'] ?? 'px' ),
				'mobile'  => sanitize_text_field( $layout_options['gapMobileUnit'] ?? 'px' ),
			),
			'autoplay'            => ! empty( $slider_options['autoplay'] ),
			'autoplayDelay'       => (int) ( $slider_options['autoplayDelay'] ?? 3000 ),
			'speed'               => (int) ( $slider_options['speed'] ?? 500 ),
			'pauseOnHover'        => ! empty( $slider_options['pauseOnHover'] ),
			'loop'                => ! empty( $slider_options['infiniteLoop'] ),
			'slidesToScroll'      => array(
				'desktop' => (int) ( $slider_options['slidesToScroll'] ?? 1 ),
				'tablet'  => (int) ( $slider_options['slidesToScrollTablet'] ?? $slider_options['slidesToScroll'] ?? 1 ),
				'mobile'  => (int) ( $slider_options['slidesToScrollMobile'] ?? $slider_options['slidesToScroll'] ?? 1 ),
			),
			'direction'           => $slider_options['direction'] ?? 'ltr',
			'adaptiveHeight'      => ! empty( $slider_options['adaptiveHeight'] ),
			'keyboard'            => ! empty( $slider_options['keyboardNav'] ),
			'mousewheel'          => ! empty( $slider_options['mousewheel'] ),
			'freeMode'            => ! empty( $slider_options['freeScroll'] ),
			'effect'              => $effect_raw,
			'navigation'          => $navigation_enabled,
			'pagination'          => $pagination_enabled,
			'paginationOptions'   => $this->navigation->get_pagination_options_for_config(),
			'centeredSlides'      => ( 'center' === $carousel_style ),
			'swiperSlidesPerView' => $is_slider_or_thumb ? array(
				'desktop' => 1,
				'tablet'  => 1,
				'mobile'  => 1,
			) : array(
				'desktop' => $swiper_spv_desktop,
				'tablet'  => $swiper_spv_tablet,
				'mobile'  => $swiper_spv_mobile,
			),
			'devices'             => array_values( array_map( 'sanitize_text_field', (array) $motion_devices ) ),
			'thumbnailsSlider'    => $this->build_thumbnails_slider_config(),
		);
	}

	/**
	 * Thumbnails-slider–specific config consumed by `frontend.js` to wire the
	 * main + thumb-strip Swipers via Swiper's Thumbs module. Returns an empty
	 * array for blocks that aren't `thumbnails-slider` so the JSON stays small.
	 *
	 * @return array<string, mixed>
	 */
	private function build_thumbnails_slider_config(): array {
		if ( 'thumbnails-slider' !== $this->slug ) {
			return array();
		}
		$layout_options    = $this->attrs['layoutOptions'] ?? array();
		$slider_options    = $this->attrs['sliderOptions'] ?? array();
		$thumbnail_options = $this->attrs['thumbnail'] ?? array();
		$thumbs_area       = $this->attrs['thumbsArea'] ?? array();
		$active_style      = AllowedValues::thumbnail_active_style( $thumbnail_options['activeStyle'] ?? 'none' );

		// Gap moved to `thumbsArea` in the redesign; the migrator copies legacy
		// `thumbnail.gap*` values into `thumbsArea.gap*` at read time so this
		// branch can read a single canonical source.
		return array(
			'thumbsLayout'  => sanitize_html_class( (string) ( $layout_options['thumbsLayout'] ?? 'strip' ) ),
			'thumbsPerView' => array(
				'desktop' => (int) ( $layout_options['thumbsPerView'] ?? 5 ),
				'tablet'  => (int) ( $layout_options['thumbsPerViewTablet'] ?? 4 ),
				'mobile'  => (int) ( $layout_options['thumbsPerViewMobile'] ?? 3 ),
			),
			'thumbGap'      => array(
				'desktop' => (int) ( $thumbs_area['gap']['device']['Desktop'] ?? 24 ),
				'tablet'  => (int) ( $thumbs_area['gap']['device']['Tablet'] ?? 24 ),
				'mobile'  => (int) ( $thumbs_area['gap']['device']['Mobile'] ?? 24 ),
			),
			'thumbGapUnit'  => array(
				'desktop' => (string) ( $thumbs_area['gap']['unit']['Desktop'] ?? 'px' ),
				'tablet'  => (string) ( $thumbs_area['gap']['unit']['Tablet'] ?? 'px' ),
				'mobile'  => (string) ( $thumbs_area['gap']['unit']['Mobile'] ?? 'px' ),
			),
			'thumbOpacity'  => is_numeric( $thumbnail_options['opacity'] ?? null ) ? (float) $thumbnail_options['opacity'] : 1.0,
			'activeStyle'   => sanitize_html_class( $active_style ),
			'autoplayDelay' => (int) ( $slider_options['autoplayDelay'] ?? 3000 ),
		);
	}
}
