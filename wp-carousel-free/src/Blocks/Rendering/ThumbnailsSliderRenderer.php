<?php
/**
 * Thumbnails-slider layout renderer.
 *
 * Extracted from BlockRenderer: builds the thumbnails-slider markup — a
 * `.wpcp-stage` Swiper for the active slide plus a `.wpcp-thumbs-area` Swiper
 * for the thumb strip (wired together at runtime by `frontend.js` via Swiper's
 * Thumbs module). Parity-locked to the editor
 * `ThumbnailsSliderLayout.jsx`. Per-item stage HTML comes from BlockRenderer
 * (`render_item`), injected as a callable.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * ThumbnailsSliderRenderer class.
 */
class ThumbnailsSliderRenderer {

	/**
	 * Block attributes (the thumbnails-slider block's attributes).
	 *
	 * @var array
	 */
	private $attrs;

	/**
	 * Constructor.
	 *
	 * @param array $attrs Block attributes.
	 */
	public function __construct( array $attrs ) {
		$this->attrs = $attrs;
	}

	/**
	 * Thumbnails-slider main markup: a `.wpcp-stage` Swiper for the active slide
	 * plus a `.wpcp-thumbs-area` Swiper for the thumb strip. The two are wired
	 * together at runtime in `blocks/blocks/frontend.js` (`initThumbnailsSliderCarousel`)
	 * via Swiper's Thumbs module. The strip starts hidden via
	 * `wpcp-thumbs-area--no-js` so it doesn't collapse to a vertical stack
	 * before JS runs; `frontend.js` removes that class on init.
	 *
	 * Markup mirrors `blocks/blocks/shared/carousel-render/layouts/ThumbnailsSliderLayout.jsx`.
	 *
	 * @param array    $items          Normalised items.
	 * @param array    $layout_options    Block layoutOptions.
	 * @param callable $render_item       Renders one stage slide's inner HTML (BlockRenderer::render_item).
	 * @param string   $navigation_markup Navigation arrows markup.
	 * @return string
	 */
	public function render_thumbnails_slider_main( array $items, array $layout_options, callable $render_item, string $navigation_markup = '' ): string {
		$thumbnail_options = $this->attrs['thumbnail'] ?? array();
		$thumbs_area       = isset( $this->attrs['thumbsArea'] ) && is_array( $this->attrs['thumbsArea'] ) ? $this->attrs['thumbsArea'] : array();
		$active_style      = sanitize_html_class( AllowedValues::thumbnail_active_style( $thumbnail_options['activeStyle'] ?? 'none' ) );
		$thumbs_layout     = sanitize_html_class( (string) ( $layout_options['thumbsLayout'] ?? 'strip' ) );
		$thumbs_per_view   = (int) ( $layout_options['thumbsPerView'] ?? 5 );
		$thumb_gap         = (int) ( $thumbs_area['gap']['device']['Desktop'] ?? 24 );

		$rendered_thumbs_per_view = max( 1, $thumbs_per_view );

		$strip_style = sprintf(
			'--wpcp-thumbs-per-view:%d;--wpcp-thumbs-gap:%dpx',
			$rendered_thumbs_per_view,
			max( 0, $thumb_gap )
		);

		$rendered_thumbs_position = sanitize_html_class( (string) ( $thumbs_area['position'] ?? 'bottom' ) );

		// Build outer wrapper classes to match JSX.
		$wrapper_classes = array(
			'wpcp-carousel-render',
			'wpcp-style-thumbnails',
			'wpcp-thumbs-layout-' . $thumbs_layout,
			'wpcp-thumbs-position-' . $rendered_thumbs_position,
			'wpcp-active-style-' . $active_style,
		);

		// Main stage Swiper: full-resolution slide rendered via the shared item renderer.
		$stage = '<div class="wpcp-stage"><div class="wpcp-swiper wpcp-thumbs-main swiper" dir="ltr"><div class="swiper-wrapper">';
		foreach ( $items as $item ) {
			$stage .= $render_item( $item );
		}
		$stage .= '</div></div>' . $navigation_markup . '</div>';

		// Thumb-strip Swiper: minimal markup per tile so the active-style indicators
		// (`wpcp-active-style-{value}`) and dynamic CSS rules in `style.scss` apply
		// without competing with the full content slots.
		$strip            = sprintf(
			'<div class="wpcp-thumbs-area wpcp-thumbs-area--no-js" data-active-style="%1$s" style="%2$s">',
			esc_attr( $active_style ),
			esc_attr( $strip_style )
		);
		$strip           .= '<div class="wpcp-swiper-thumb-wrapper">';
		$strip           .= '<div class="wpcp-thumbs-strip wpcp-swiper swiper" dir="ltr"><div class="swiper-wrapper">';
		$thumb_class_base = 'wpcp-thumb wpcp-active-style-' . $active_style;
		$show_image       = ! isset( $thumbnail_options['showImage'] ) || false !== $thumbnail_options['showImage'];

		foreach ( $items as $thumb_index => $item ) {
			// Use thumbImg for thumbnails slider (thumbnail resolution), fallback to image_url.
			$image_url    = isset( $item['thumbImg'] ) ? (string) $item['thumbImg'] : ( isset( $item['image_url'] ) ? (string) $item['image_url'] : '' );
			$image_alt    = isset( $item['image_alt'] ) ? (string) $item['image_alt'] : ( $item['title'] ?? '' );
			$image_attr   = $show_image && '' !== $image_url
				? '<img class="wpcp-thumb-img" src="' . esc_url( $image_url ) . '" alt="' . esc_attr( $image_alt ) . '" loading="lazy" />'
				: '<span class="wpcp-thumb-img wpcp-thumb-img--placeholder" aria-hidden="true"><span class="wpcp-item-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg></span></span>';
			$active_class = 0 === $thumb_index ? ' wpcp-thumb-active' : '';

			$thumb_image_wrapper = '<span class="wpcp-thumb-img-wrapper">' . $image_attr . '</span>';

			$strip .= '<div class="swiper-slide ' . esc_attr( $thumb_class_base ) . esc_attr( $active_class ) . '">'
				. $thumb_image_wrapper
				. '</div>';
		}
		$strip .= '</div></div>'; // .swiper-wrapper + .wpcp-thumbs-strip.
		$strip .= '</div>';      // .wpcp-swiper-thumb-wrapper.
		$strip .= '</div>';      // .wpcp-thumbs-area.

		// Wrap everything in the outer container div with all classes.
		$outer_wrapper  = '<div class="' . esc_attr( implode( ' ', $wrapper_classes ) ) . '">';
		$outer_wrapper .= $stage . $strip;
		$outer_wrapper .= '</div>';

		return $outer_wrapper;
	}
}
