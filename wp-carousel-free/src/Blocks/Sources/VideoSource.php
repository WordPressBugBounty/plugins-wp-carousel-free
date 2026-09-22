<?php
/**
 * Image Source – reads from the block's `items` attribute (media library attachments).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Sources;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\VideoUrlValidator;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * VideoSource class for querying posts and building carousel items.
 */
class VideoSource implements SourceInterface {

	/**
	 * Build the slide items from the block's video list.
	 *
	 * @param array  $attributes Projected block attributes.
	 * @param string $is_editor  Non-empty when rendering for the editor preview.
	 * @return array
	 */
	public function get_items( array $attributes, string $is_editor = '' ): array {
		$raw_items = isset( $attributes['items'] ) && is_array( $attributes['items'] ) ? $attributes['items'] : array();
		$items     = array();

		foreach ( $raw_items as $raw ) {
			/*
			 * WordPress REST API schema validation for `type: object` items
			 * can cast PHP associative arrays to stdClass objects. Cast back
			 * to array so property access is consistent everywhere.
			 */
			if ( is_object( $raw ) ) {
				$raw = (array) $raw;
			}
			if ( ! is_array( $raw ) ) {
				continue;
			}

			$attachment_id = (int) ( isset( $raw['id'] ) ? $raw['id'] : 0 );

			$extra = array();

			if ( $attachment_id > 0 ) {
				$src = wp_get_attachment_image_src( $attachment_id );
				$url = ( $src && isset( $src[0] ) ) ? $src[0] : ( isset( $raw['url'] ) ? (string) $raw['url'] : '' );
				$alt = (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );
				if ( ! $alt ) {
					$alt = isset( $raw['alt'] ) ? (string) $raw['alt'] : '';
				}
				$title = (string) get_the_title( $attachment_id );
				if ( ! $title ) {
					$title = isset( $raw['title'] ) ? (string) $raw['title'] : '';
				}
				$post     = get_post( $attachment_id );
				$caption  = $post ? wp_strip_all_tags( $post->post_excerpt ) : ( isset( $raw['caption'] ) ? (string) $raw['caption'] : '' );
				$desc     = $post ? wp_strip_all_tags( $post->post_content ) : ( isset( $raw['description'] ) ? (string) $raw['description'] : '' );
				$link_url = (string) wp_get_attachment_url( $attachment_id );
				if ( ! $link_url ) {
					$link_url = $url;
				}
				if ( $src && isset( $src[1], $src[2] ) ) {
					$extra['intrinsicWidth']  = (int) $src[1];
					$extra['intrinsicHeight'] = (int) $src[2];
				}
				$custom_thumb_url = isset( $raw['customThumbnailUrl'] ) ? (string) $raw['customThumbnailUrl'] : '';
				$video_source     = isset( $raw['videoSource'] ) ? $raw['videoSource'] : 'youtube';
				$video_url        = isset( $raw['videoUrl'] ) ? $raw['videoUrl'] : '';
				$custom_url       = isset( $raw['customUrl'] ) ? $raw['customUrl'] : '';
			} else {
				// External URL item – no attachment in library.
				$url              = isset( $raw['url'] ) ? (string) $raw['url'] : '';
				$alt              = isset( $raw['alt'] ) ? (string) $raw['alt'] : '';
				$title            = isset( $raw['title'] ) ? (string) $raw['title'] : '';
				$caption          = isset( $raw['caption'] ) ? (string) $raw['caption'] : '';
				$desc             = isset( $raw['description'] ) ? (string) $raw['description'] : '';
				$link_url         = $url;
				$custom_thumb_url = isset( $raw['customThumbnailUrl'] ) ? (string) $raw['customThumbnailUrl'] : '';
				$video_source     = isset( $raw['videoSource'] ) ? $raw['videoSource'] : 'youtube';
				$video_url        = isset( $raw['videoUrl'] ) ? $raw['videoUrl'] : '';
				$custom_url       = isset( $raw['customUrl'] ) ? $raw['customUrl'] : '';
			}

			$video_source = AllowedValues::video_source( sanitize_key( (string) $video_source ) );

			$video_validation = VideoUrlValidator::validate( $video_source, (string) $video_url );
			if ( ! $video_validation['valid'] ) {
				$video_url = '';
			} else {
				$video_url = VideoUrlValidator::sanitize( (string) $video_url );
			}

			$custom_url = VideoUrlValidator::sanitize( (string) $custom_url );

			$custom_thumb_url = '' !== trim( (string) $custom_thumb_url )
				? esc_url_raw( (string) $custom_thumb_url )
				: '';

			$parts            = wp_parse_url( $video_url );
			$youtube_video_id = '';
			if ( 'youtube' === $video_source && $parts && isset( $parts['query'] ) && $parts['query'] ) {
				$query = array();
				parse_str( $parts['query'], $query );
				$youtube_video_id = isset( $query['v'] ) ? sanitize_text_field( $query['v'] ) : '';
			}

			if ( ! $url ) {
				continue;
			}

			$items[] = array(
				'id'                 => $attachment_id > 0 ? $attachment_id : uniqid( 'ext_' ),
				'image_url'          => $url,
				'image_alt'          => $alt,
				'title'              => $title,
				'description'        => $desc,
				'caption'            => $caption,
				'url'                => $link_url,
				'extra'              => $extra,
				'customThumbnailUrl' => $custom_thumb_url,
				'video_source'       => $video_source,
				'video_url'          => $video_url,
				'custom_url'         => $custom_url,
				'youtubeVideoId'     => $youtube_video_id,
			);
		}

		$layout_options = isset( $attributes['layoutOptions'] ) && is_array( $attributes['layoutOptions'] ) ? $attributes['layoutOptions'] : array();
		// Tiles + AJAX pagination owns its own (deterministic, seeded) shuffle so
		// that the same permutation is reproducible on every page-change request.
		// `shuffle()` here uses non-deterministic `mt_rand` state, which would
		// break the pagination contract (visitors would see duplicates/gaps as
		// they page through). For every other consumer (carousel, slider, tiles
		// without pagination) we keep the historic non-deterministic shuffle.
		$is_paginated_tiles = isset( $attributes['blockName'] ) && 'tiles' === $attributes['blockName']
			&& ! empty( $layout_options['pagination'] );
		if ( ! empty( $layout_options['randomOrder'] ) && ! $is_paginated_tiles ) {
			shuffle( $items );
		}

		return $items;
	}
}
