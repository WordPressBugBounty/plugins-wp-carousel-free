<?php
/**
 * Video card markup, embed-URL building, and source-type detection for block render.
 *
 * Frontend counterpart to the editor preview at
 * `blocks/blocks/shared/carousel-render/carouselItem/VideoCard.jsx`.
 * Build rules mirror `blocks/blocks/shared/utils/media.js` (`getVideoSourceType` /
 * `getVideoEmbedUrl`).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

use ShapedPlugin\WPCarouselFree\Blocks\Lightbox\Lightbox_Frontend;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * Builds the video-card HTML and per-provider embed URLs from block attributes.
 */
class VideoCardRenderer {

	/**
	 * Normalised block attributes (same shape as BlockRenderer).
	 *
	 * @var array
	 */
	private array $attrs;

	/**
	 * Root DOM id of the parent block — used as the FancyBox group identifier so
	 * all videos in the same carousel share a single lightbox gallery.
	 *
	 * @var string
	 */
	private string $root_element_id;

	/**
	 * Constructor.
	 *
	 * @param array  $attrs           Normalised block attributes.
	 * @param string $root_element_id DOM id of the block root (used for FancyBox grouping).
	 */
	public function __construct( array $attrs, string $root_element_id ) {
		$this->attrs           = $attrs;
		$this->root_element_id = $root_element_id;
	}

	/**
	 * Render the video card markup for a single item.
	 *
	 * @param string $img  The pre-built `<img>` tag (poster / thumbnail).
	 * @param array  $item Normalised item carrying `video_url`, `video_source`, etc.
	 * @return string HTML for the video card.
	 */
	public function render_card( string $img, array $item ): string {
		$video_options = $this->attrs['videoOptions'] ?? array();

		// Extract video attributes.
		$video_icon      = $video_options['videoIcon'] ?? '';
		$icon_view       = $video_options['iconView'] ?? 'solid';
		$show_on_hover   = ! empty( $video_options['showOnHover'] );
		$animation       = $video_options['animation'] ?? 'none';
		$aspect_ratio    = $video_options['aspectRatio'] ?? '16:9';
		$thumbnail_size  = $video_options['thumbnailSize'] ?? 'cover';
		$overlay_enable  = ! empty( $video_options['overlayEnable'] );
		$use_source_icon = ! empty( $video_options['useSourceIcon'] );

		// Get video source and URL from item.
		$video_source = AllowedValues::video_source( $item['video_source'] ?? $item['extra']['videoSource'] ?? $this->get_source_type( $item['extra']['videoUrl'] ?? $item['video_url'] ?? '' ) );
		$video_url    = $item['extra']['videoUrl'] ?? $item['video_url'] ?? '';

		// Build icon content.
		$icon_content = $this->get_play_icon( $video_icon );
		if ( $use_source_icon ) {
			$source_play_icon = $this->get_source_play_icon( $video_source );
			if ( '' !== $source_play_icon ) {
				$icon_content = $source_play_icon;
			}
		}

		$icon_view_class = $use_source_icon ? 'normal' : $icon_view;

		// Format aspect ratio class.
		$aspect_ratio_class = str_replace( ':', '-', $aspect_ratio );

		// Build classes.
		$wrapper_classes   = array( 'wpcp-video-thumbnail-wrapper' );
		$thumbnail_classes = array(
			'wpcp-video-thumbnail',
			'wpcp-thumb-size-' . sanitize_html_class( $thumbnail_size ),
			'wpcp-aspect-ratio-' . sanitize_html_class( $aspect_ratio_class ),
		);

		$play_button_classes = array(
			'wpcp-video-item-play',
			'wpcp-icon-view-' . sanitize_html_class( $icon_view_class ),
		);

		if ( $show_on_hover ) {
			$play_button_classes[] = 'wpcp-icon-on-hover';
		}
		$play_icon_classes = array(
			'wpcp-video-play-icon',
			'wpcp-icon-animation-' . sanitize_html_class( $animation ),
		);
		if ( $use_source_icon ) {
			$play_icon_classes[] = 'wpcp-source-icon';
		}
		$play_icon_classes = implode( ' ', $play_icon_classes );

		// The popup always opens on a click, and that user gesture is what lets the
		// embed start playing with sound.
		$embed_url = $this->get_embed_url( $video_source, $video_url, true, false );
		if ( empty( $embed_url ) ) {
			$embed_url = $video_url;
		}

		// Build HTML.
		$html = '<div class="' . esc_attr( implode( ' ', $wrapper_classes ) ) . '">';

		if ( $overlay_enable ) {
			$html .= '<div class="wpcp-video-thumbnail-overlay"></div>';
		}

		// Wrap thumbnail/play button with anchor tag for popup mode.
		if ( Lightbox_Frontend::is_lightbox_active() ) {
			// Every provider Free supports is an iframe player; FancyBox needs no other type.
			// Group matches the image anchor (`wpcp-{root_element_id}`) — `initBlockLightbox`
			// only binds `[data-fancybox^="wpcp-"]`.
			$thumbnail_wrapper_open  = '<a href="' . esc_url( $embed_url ) . '" data-fancybox="wpcp-' . esc_attr( $this->root_element_id ) . '" data-src="' . esc_url( $embed_url ) . '" data-type="iframe" data-autoplay="true" data-width="70vw" data-height="calc(100vh - 88px)">';
			$thumbnail_wrapper_close = '</a>';
		} else {
			$thumbnail_wrapper_open  = '<a href="' . esc_url( $embed_url ) . '" target="_blank" rel="noopener noreferrer">';
			$thumbnail_wrapper_close = '</a>';
		}

		$html .= $thumbnail_wrapper_open;
		$html .= '<div class="' . esc_attr( implode( ' ', $thumbnail_classes ) ) . '">' . $img . '</div>';

		// A span, not a button — the card is already wrapped in the popup anchor,
		// and a button inside an anchor is invalid HTML.
		$html .= '<span class="' . esc_attr( implode( ' ', $play_button_classes ) ) . '">';
		$html .= '<span class="' . esc_attr( $play_icon_classes ) . '">';
		$html .= $icon_content;
		$html .= '</span>';
		$html .= '</span>';
		$html .= $thumbnail_wrapper_close;

		$html .= '</div>';

		return $html;
	}

	/**
	 * Get video source type from URL.
	 * Matches JavaScript `getVideoSourceType` in blocks/blocks/shared/utils/media.js.
	 *
	 * @param string $url Video URL.
	 * @return string Video source type: youtube or vimeo.
	 */
	public function get_source_type( string $url ): string {
		if ( empty( $url ) ) {
			return 'youtube';
		}

		$host = wp_parse_url( $url, PHP_URL_HOST );
		if ( ! is_string( $host ) || '' === $host ) {
			return 'youtube';
		}

		$host = strtolower( $host );

		if ( strpos( $host, 'vimeo.com' ) !== false ) {
			return 'vimeo';
		}

		return 'youtube';
	}

	/**
	 * Get video embed URL.
	 * Matches JavaScript `getVideoEmbedUrl` in blocks/blocks/shared/utils/media.js.
	 *
	 * @param string $source   Video source type.
	 * @param string $url      Video URL.
	 * @param bool   $autoplay Autoplay flag.
	 * @param bool   $muted    Start the player muted. A lightbox opened by a click carries a
	 *                         user gesture, so it may start with sound.
	 * @return string Embed URL or raw HTML for embed type.
	 */
	public function get_embed_url( string $source, string $url, bool $autoplay = true, bool $muted = true ): string {
		if ( empty( $url ) ) {
			return '';
		}

		switch ( $source ) {

			case 'vimeo':
				$video_id = $this->extract_vimeo_id( $url );
				if ( ! $video_id ) {
					return $url;
				}

				$params = array(
					'autoplay' => (int) $autoplay,
					'loop'     => 0,
					'muted'    => (int) $muted,
					'controls' => 1,
				);

				return 'https://player.vimeo.com/video/' . $video_id . '?' . http_build_query( $params );

			case 'youtube':
			default:
				$video_id = $this->extract_youtube_id( $url );
				if ( ! $video_id ) {
					return $url;
				}

				$params = array(
					'autoplay' => (int) $autoplay,
					'mute'     => (int) $muted,
					'controls' => 1,
				);

				return 'https://www.youtube.com/embed/' . $video_id . '?' . http_build_query( $params );
		}
	}

	/**
	 * Extract YouTube video ID from URL.
	 *
	 * @param string $url YouTube URL.
	 * @return string Video ID or empty string.
	 */
	private function extract_youtube_id( string $url ): string {
		preg_match( '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i', $url, $matches );
		return $matches[1] ?? '';
	}

	/**
	 * Extract Vimeo video ID from URL.
	 *
	 * @param string $url Vimeo URL.
	 * @return string Video ID or empty string.
	 */
	private function extract_vimeo_id( string $url ): string {
		preg_match( '/(?:vimeo(?:pro)?\.com)\/(?:[^\d]+)?(\d+)(?:.*)/', $url, $matches );
		return $matches[1] ?? '';
	}

	/**
	 * Get the selected play-icon SVG from the IconGrid set.
	 *
	 * Mirrors `PlayIconOne`–`PlayIconSix` (the PlayIconSet grid) in
	 * blocks/icons/videoSourceIcons.js. Each glyph is filled with
	 * currentColor so the dynamic-CSS icon color drives its tint.
	 *
	 * @param string $video_icon Play icon key (playIconOne … playIconSix).
	 * @return string SVG HTML.
	 */
	private function get_play_icon( string $video_icon ): string {
		switch ( $video_icon ) {
			case 'playIconTwo':
				return '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none"><path d="M.721.219A1.33 1.33 0 0 1 2.127.183l12.116 6.568C14.71 7 15 7.465 15 8s-.289 1-.757 1.25L2.127 15.816c-.432.25-.973.25-1.406-.036A1.42 1.42 0 0 1 0 14.568V1.432C0 .932.288.47.721.22m1.01 13.885L12.945 8 1.73 1.932z" fill="currentColor"/></svg>';
			case 'playIconThree':
				return '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none"><path d="m0 0 15 8-15 8z" fill="currentColor"/></svg>';
			case 'playIconFour':
				return '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none"><path d="M0 14.167V0l1.667.9 11.632 6.2L15 8l-1.701.933L1.667 15.1 0 16zm1.667-.9L11.563 8 1.666 2.733z" fill="currentColor"/></svg>';
			case 'playIconFive':
				return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.38 7.038 5.34.85A2.3 2.3 0 0 0 2.99.8 2.3 2.3 0 0 0 1.8 2.826v12.322c0 1.29 1.04 2.345 2.317 2.352h.01c.4 0 .816-.125 1.204-.362a.663.663 0 1 0-.69-1.132c-.182.11-.36.168-.516.168a1.03 1.03 0 0 1-.998-1.026V2.826c0-.366.19-.69.51-.87a.98.98 0 0 1 1.007.022l10.04 6.19a.98.98 0 0 1 .475.85.98.98 0 0 1-.479.848L7.42 14.31a.663.663 0 1 0 .693 1.13l7.259-4.444a2.3 2.3 0 0 0 1.112-1.977 2.3 2.3 0 0 0-1.104-1.982" fill="currentColor"/></svg>';
			case 'playIconSix':
				return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><g clip-path="url(#clip0_6715_126846)"><path d="M9 0a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9m3.776 10.181-4.982 2.876a1.372 1.372 0 0 1-2.056-1.188V6.117A1.372 1.372 0 0 1 7.794 4.93l4.982 2.876c.914.53.914 1.849 0 2.376" fill="currentColor"/></g></svg>';
			case 'playIconOne':
			default:
				return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="m3.627 1.183 12.116 6.568c.469.25.757.714.757 1.249s-.288 1-.757 1.25L3.627 16.816c-.432.25-.973.25-1.406-.036a1.42 1.42 0 0 1-.721-1.213V2.432c0-.5.252-.963.721-1.213a1.33 1.33 0 0 1 1.406-.036" fill="currentColor"/></svg>';
		}
	}

	/**
	 * Get source-specific play icon SVG.
	 *
	 * Mirrors `sourcePlayIcon` in
	 * blocks/blocks/shared/carousel-render/carouselItem/VideoCard.jsx.
	 *
	 * @param string $source Video source key.
	 * @return string SVG HTML, or empty string when the source has no override.
	 */
	private function get_source_play_icon( string $source ): string {
		switch ( $source ) {
			case 'youtube':
				return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M23.4471 5.982c-.2742-1.074-1.0858-1.921-2.118-2.211C19.4625 3.25 11.973 3.25 11.973 3.25s-7.486 0-9.356.521C1.589 4.057.777 4.905.499 5.982 0 7.931 0 12 0 12s0 4.069.499 6.018c.274 1.074 1.086 1.921 2.118 2.211 1.87.521 9.356.521 9.356.521s7.49 0 9.356-.521c1.029-.29 1.84-1.137 2.118-2.211C23.946 16.07 23.946 12 23.946 12s0-4.069-.499-6.018Z" fill="#FF0000"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M9.581 15.749 15.802 12 9.581 8.248v7.501Z" fill="#fff"></path></svg>';

			case 'vimeo':
				return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M0 7a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3z" fill="#1ab7ea"></path><path fill-rule="evenodd" clip-rule="evenodd" d="m9 15.501 6.22-3.75L9 8z" fill="#fff"></path></svg>';

			default:
				return '';
		}
	}
}
