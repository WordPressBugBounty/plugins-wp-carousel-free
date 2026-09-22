<?php
/**
 * Image Source – reads from the block's `items` attribute (media library attachments).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Sources;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Item_Text;

defined( 'ABSPATH' ) || exit;

/**
 * ImageSource class for querying posts and building carousel items.
 */
class ImageSource implements SourceInterface {

	/**
	 * Build the slide items from the block's selected media.
	 *
	 * @param array  $attributes Projected block attributes.
	 * @param string $is_editor  Non-empty when rendering for the editor preview.
	 * @return array
	 */
	public function get_items( array $attributes, string $is_editor = '' ): array {
		$raw_items  = isset( $attributes['items'] ) && is_array( $attributes['items'] ) ? $attributes['items'] : array();
		$image_opts = isset( $attributes['imageOptions'] ) && is_array( $attributes['imageOptions'] ) ? $attributes['imageOptions'] : array();
		$resolution = isset( $image_opts['resolution'] ) ? (string) $image_opts['resolution'] : 'large';

		// For thumbnails-slider, get the thumbnail resolution from thumbnail.imageSize attribute.
		$block_name           = isset( $attributes['blockName'] ) ? (string) $attributes['blockName'] : '';
		$is_thumbnails_slider = 'thumbnails-slider' === $block_name;
		$thumb_resolution     = 'thumbnail';
		if ( $is_thumbnails_slider ) {
			$thumbnail_opts   = isset( $attributes['thumbnail'] ) && is_array( $attributes['thumbnail'] ) ? $attributes['thumbnail'] : array();
			$thumb_image_size = isset( $thumbnail_opts['imageSize'] ) ? (string) $thumbnail_opts['imageSize'] : 'default';
			// Map 'default' to 'thumbnail' to match editor behavior.
			$thumb_resolution = 'default' === $thumb_image_size ? 'thumbnail' : $thumb_image_size;
		}

		$items = array();

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
				$src = wp_get_attachment_image_src( $attachment_id, $resolution );
				$url = ( $src && isset( $src[0] ) ) ? $src[0] : ( isset( $raw['url'] ) ? (string) $raw['url'] : '' );

				// Saved item text is author input from post content, so it is filtered
				// here rather than at each sink — this is the one path both the normal
				// render and the AJAX pagination route share.
				$raw_alt         = Item_Text::plain( isset( $raw['image_alt'] ) ? $raw['image_alt'] : ( $raw['alt'] ?? '' ) );
				$raw_title       = Item_Text::title( $raw['title'] ?? '' );
				$raw_caption     = Item_Text::caption( $raw['caption'] ?? '' );
				$raw_description = Item_Text::description( $raw['description'] ?? '' );

				$alt = (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );
				if ( '' === $alt ) {
					$alt = $raw_alt;
				}
				$post = get_post( $attachment_id );

				$title = $raw_title;
				if ( '' === $title ) {
					$title = (string) get_the_title( $attachment_id );
				}

				$caption = $raw_caption;
				if ( '' === $caption ) {
					$caption = $post ? wp_strip_all_tags( $post->post_excerpt ) : '';
				}

				$desc = $raw_description;
				if ( '' === $desc ) {
					$desc = $post ? wp_strip_all_tags( $post->post_content ) : '';
				}

				$link_url = Item_Text::url( $raw['customUrl'] ?? '' );
				if ( '' === $link_url ) {
					$link_url = (string) wp_get_attachment_url( $attachment_id );
				}
				if ( '' === $link_url ) {
					$link_url = $url;
				}
				if ( $src && isset( $src[1], $src[2] ) ) {
					$extra['intrinsicWidth']  = (int) $src[1];
					$extra['intrinsicHeight'] = (int) $src[2];
				}

				// The lightbox opens the original, unscaled upload. WordPress stores a
				// `-scaled` copy for uploads above the big-image threshold and serves it
				// as the "full" size, so `wp_get_original_image_url()` is the only way
				// to reach the true full-resolution file. Fall back to the attachment
				// URL when the original is unavailable (e.g. missing file).
				$original_url = function_exists( 'wp_get_original_image_url' ) ? wp_get_original_image_url( $attachment_id ) : false;
				if ( false === $original_url ) {
					$original_url = wp_get_attachment_url( $attachment_id );
				}
				$original_url = (string) $original_url;
			} else {
				// External URL item – no attachment in library.
				$fallback_url = isset( $raw['url'] ) ? (string) $raw['url'] : '';
				$item_sizes   = self::normalize_item_sizes( $raw['sizes'] ?? null );
				$url          = self::resolve_url_for_size( $item_sizes, $resolution, $fallback_url );
				$alt          = Item_Text::plain( $raw['alt'] ?? '' );
				$title        = Item_Text::title( $raw['title'] ?? '' );
				$caption      = Item_Text::caption( $raw['caption'] ?? '' );
				$desc         = Item_Text::description( $raw['description'] ?? '' );
				$link_url     = Item_Text::url( $raw['customUrl'] ?? '' );
				if ( '' === $link_url ) {
					$link_url = $url;
				}
				// The lightbox and any download affordance want the largest file the item
				// knows about, which is the `full` entry of the captured size map when the
				// item carries one and the plain URL otherwise.
				$original_url = self::resolve_url_for_size( $item_sizes, 'full', $fallback_url );
			}

			// Keep saved items whose attachment or URL is no longer available.
			// The editor preserves these entries and renders its missing-image
			// placeholder, so the frontend source must pass them to ItemRenderer
			// to produce the same slide instead of silently removing it.

			$filter_ids_raw = isset( $raw['filterIds'] ) && is_array( $raw['filterIds'] ) ? $raw['filterIds'] : array();
			$filter_ids     = array();
			foreach ( $filter_ids_raw as $fid ) {
				if ( is_string( $fid ) && '' !== $fid ) {
					$filter_ids[] = $fid;
				}
			}

			$normalized = array(
				'id'          => $attachment_id > 0 ? $attachment_id : uniqid( 'ext_' ),
				'image_url'   => $url,
				'image_alt'   => $alt,
				'title'       => $title,
				'description' => $desc,
				'caption'     => $caption,
				'url'         => $link_url,
				// Keep the explicit custom URL so Read More visibility can require it.
				'custom_url'  => Item_Text::url( $raw['customUrl'] ?? '' ),
				'extra'       => $extra,
				'filterIds'   => $filter_ids,
			);

			$position = self::normalize_focal_position( $raw['position'] ?? null );
			if ( null !== $position ) {
				$normalized['position'] = $position;
			}
			$scale = self::normalize_focal_scale( $raw['scale'] ?? null );
			if ( null !== $scale ) {
				$normalized['scale'] = $scale;
			}

			// Original (unscaled) image URL — feeds the lightbox so it opens the
			// full-resolution file. Omitted when unavailable; the renderer then
			// falls back to the displayed image URL.
			if ( '' !== $original_url ) {
				$normalized['image_original_url'] = $original_url;
			}

			// For thumbnails-slider, add thumbImg with the thumbnail resolution.
			if ( $is_thumbnails_slider && $attachment_id > 0 ) {
				$thumb_src = wp_get_attachment_image_src( $attachment_id, $thumb_resolution );
				if ( $thumb_src && isset( $thumb_src[0] ) ) {
					$normalized['thumbImg'] = $thumb_src[0];
				} else {
					// Fallback to the main image URL if thumbnail not available.
					$normalized['thumbImg'] = $url;
				}
			} elseif ( $is_thumbnails_slider ) {
				// External URL items resolve the rail's own size from the captured size
				// map when they carry one, so the rail matches the editor preview instead
				// of reusing the (larger) stage image.
				$normalized['thumbImg'] = self::resolve_url_for_size(
					self::normalize_item_sizes( $raw['sizes'] ?? null ),
					$thumb_resolution,
					$url
				);
			}

			$items[] = $normalized;
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

	/**
	 * Flatten a saved item's `sizes` map to `size slug => URL`.
	 *
	 * The editor captures this map from `MediaUpload`'s selection object
	 * (`shared/utils/media.js` `extractMediaSizeUrls`) so a URL-only item — a
	 * Ready Pattern's remote image, or an Insert-from-URL pick — can still honour
	 * Image Resolution. Values arrive as plain strings; anything else is dropped.
	 *
	 * @param mixed $raw Raw `sizes` value from the item.
	 * @return array<string,string> Flat size map (may be empty).
	 */
	private static function normalize_item_sizes( $raw ): array {
		if ( is_object( $raw ) ) {
			$raw = (array) $raw;
		}
		if ( ! is_array( $raw ) ) {
			return array();
		}

		$sizes = array();
		foreach ( $raw as $size_key => $size_url ) {
			if ( ! is_string( $size_key ) || ! is_string( $size_url ) || '' === $size_url ) {
				continue;
			}
			$sizes[ strtolower( $size_key ) ] = $size_url;
		}

		return $sizes;
	}

	/**
	 * Resolve an image URL for a registered size from a captured size map.
	 *
	 * Mirrors `getMediaUrlForImageSize()` in `shared/utils/media.js` so the editor
	 * preview and this renderer pick the same file: the requested size when the
	 * item carries it, otherwise the original, otherwise the saved URL. `full`
	 * always means the original, never a generated size.
	 *
	 * @param array<string,string> $sizes        Flat size map from normalize_item_sizes().
	 * @param string               $resolution   Requested size key.
	 * @param string               $fallback_url URL saved on the item.
	 * @return string Resolved URL (may be '' when the item has none).
	 */
	private static function resolve_url_for_size( array $sizes, string $resolution, string $fallback_url ): string {
		$size_key = '' !== $resolution ? strtolower( $resolution ) : 'large';

		if ( 'full' !== $size_key && isset( $sizes[ $size_key ] ) ) {
			return $sizes[ $size_key ];
		}

		if ( isset( $sizes['full'] ) ) {
			return $sizes['full'];
		}

		return $fallback_url;
	}

	/**
	 * Sanitize the per-item focal point (left/top 0..100).
	 *
	 * @param mixed $raw Raw value from block attribute.
	 * @return array{left: float, top: float}|null Validated pair, or null when missing/invalid.
	 */
	private static function normalize_focal_position( $raw ): ?array {
		if ( is_object( $raw ) ) {
			$raw = (array) $raw;
		}
		if ( ! is_array( $raw ) || ! isset( $raw['left'], $raw['top'] ) ) {
			return null;
		}
		if ( ! is_numeric( $raw['left'] ) || ! is_numeric( $raw['top'] ) ) {
			return null;
		}
		return array(
			'left' => max( 0.0, min( 100.0, (float) $raw['left'] ) ),
			'top'  => max( 0.0, min( 100.0, (float) $raw['top'] ) ),
		);
	}

	/**
	 * Sanitize the per-item scale value (`cover` | `contain` | `fill`).
	 *
	 * @param mixed $raw Raw value from block attribute.
	 * @return string|null Validated scale or null when missing/invalid.
	 */
	private static function normalize_focal_scale( $raw ): ?string {
		if ( ! is_string( $raw ) ) {
			return null;
		}
		return in_array( $raw, array( 'cover', 'contain', 'fill' ), true ) ? $raw : null;
	}
}
