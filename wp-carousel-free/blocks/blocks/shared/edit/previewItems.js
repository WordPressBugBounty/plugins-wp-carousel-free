/**
 * Pure per-source mappers: block `items` / fetched feed data → the normalized
 * item shape `CarouselRender` consumes. Field resolution must mirror the PHP
 * sources (`ImageSource.php`, …) so the editor preview matches the frontend.
 */

import { getMediaUrlForImageSize, getMediaDimensionsForImageSize } from '../utils/media';
import {
	sanitizeItemTitle,
	sanitizeItemDescription,
	sanitizeItemCaption,
	sanitizeItemPlainText,
	sanitizeItemUrl,
} from '../utils/sanitizeItemText';

/** Source types with a dedicated preview pipeline in `EditorPreview`. */
export const HANDLED_SOURCE_TYPES = new Set(['post', 'product', 'image', 'video']);

/**
 * Reduces a media-library value to plain text.
 *
 * Attachment descriptions carry block markup that the description allow-list
 * drops anyway, so seeding from the media store starts from plain text.
 *
 * @param {string} html - HTML string to strip
 * @return {string}     - Plain text without HTML tags
 */
function stripTags(html) {
	return sanitizeItemPlainText(String(html ?? ''));
}

/**
 * Image-source preview items. Per-attachment title/description/alt come from
 * the WP media store (`mediaById`) to match backend `ImageSource.php`.
 *
 * @param {Object}   args
 * @param {object[]} args.items
 * @param {Object}   args.mediaById           Attachment id → media entity record.
 * @param {string}   args.imageResolution     Image size slug for the main image.
 * @param {string}   args.thumbnailResolution Image size slug for thumbnails-slider thumbs.
 * @param {boolean}  args.isThumbnailsSlider  Adds `thumbImg` for the thumbnails-slider block.
 * @return {object[]} Normalized preview items.
 */
export function buildImagePreviewItems({
	items,
	mediaById,
	imageResolution,
	thumbnailResolution,
	isThumbnailsSlider,
}) {
	return items.map((item) => {
		const media = mediaById?.[item.id];
		const mediaTitle = media?.title?.raw || media?.title?.rendered || '';
		const titleFallback = (item.title ?? '') || mediaTitle;
		const altFromItem = item.image_alt ?? item.alt ?? '';
		const altFromMedia = media?.alt_text ?? '';
		const resolvedAlt = (altFromItem || altFromMedia || '').toString();
		const descriptionFromMedia = media?.description?.raw ?? media?.description?.rendered ?? '';
		const captionFromMedia = media?.caption?.raw ?? media?.caption?.rendered ?? '';
		const descriptionFromItem = item.description ?? '';
		const captionFromItem = item.caption ?? '';

		// Mirror ImageSource.php: expose the resolved size's intrinsic dimensions so
		// variable-width slides size to the image's natural width. Without this the
		// slide falls back to `max-content`, which collapses to nothing when the
		// media is an absolutely-positioned aspect-ratio frame and the content sits
		// in an overlay (overlay/diagonal) — both removed from normal flow,
		// leaving the slide with no width.
		const intrinsicDimensions = getMediaDimensionsForImageSize(media, imageResolution);

		return {
			id: item.id,
			image_url: getMediaUrlForImageSize(media, imageResolution, item.url || '', item.sizes),
			// Mirror ImageSource.php's allow-lists so the preview shows exactly the
			// markup the frontend will render — inline formatting kept, everything
			// else unwrapped to its text.
			image_alt: sanitizeItemPlainText(resolvedAlt || titleFallback),
			title: sanitizeItemTitle((item.title ?? '').toString() || mediaTitle),
			description: sanitizeItemDescription(
				descriptionFromItem && descriptionFromItem !== ''
					? descriptionFromItem.toString()
					: stripTags(descriptionFromMedia)
			),
			caption: sanitizeItemCaption(
				captionFromItem && captionFromItem !== ''
					? captionFromItem.toString()
					: stripTags(captionFromMedia)
			),
			// Mirror ImageSource.php: Read More should use the custom item URL when set.
			url: sanitizeItemUrl(item.customUrl || '') || item.url || '',
			// Keep the explicit custom URL so Read More visibility can require it.
			customUrl: sanitizeItemUrl(item.customUrl || ''),
			extra: intrinsicDimensions
				? {
						intrinsicWidth: intrinsicDimensions.width,
						intrinsicHeight: intrinsicDimensions.height,
				  }
				: {},
			// Per-item popup fields must mirror `ImageSource.php` so preview matches PHP output.
			...(item.position !== null && typeof item.position === 'object'
				? { position: item.position }
				: {}),
			...(typeof item.scale === 'string' && item.scale ? { scale: item.scale } : {}),
			...(isThumbnailsSlider
				? {
						thumbImg: getMediaUrlForImageSize(media, thumbnailResolution, item.url || '', item.sizes),
				  }
				: {}),
		};
	});
}

/**
 * Video-source preview items.
 *
 * @param {Object}   args
 * @param {object[]} args.items
 * @return {object[]} Normalized preview items.
 */
export function buildVideoPreviewItems({ items }) {
	const videoId = (item) => {
		const url = item?.videoUrl;
		if (!url) {
			return;
		}
		try {
			const itemUrl = new URL(url);
			return itemUrl?.searchParams?.get('v');
		} catch (error) {
			// A malformed URL must not crash the whole editor preview — an
			// invalid entry simply yields no video id.
		}
	};

	return items.map((item) => {
		const posterUrl = item.customThumbnailUrl || item.url || '';
		return {
			id: item.id,
			image_url: posterUrl,
			image_alt: '',
			title: item.title || '',
			description: item.description || '',
			url: posterUrl,
			customUrl: item.customUrl || '',
			extra: {
				videoUrl: item.videoUrl,
				videoSource: item.videoSource,
				videoId: videoId(item) || '',
			},
		};
	});
}

/**
 * Audio-source preview items. Thumbnails resolve through the media store by
 * the item's `customThumbnail` attachment id.
 *
 * @param {Object}   args
 * @param {object[]} args.items
 * @param {Object}   args.mediaById       Attachment id → media entity record.
 * @param {string}   args.imageResolution Image size slug for the thumbnail.
 * @return {object[]} Normalized preview items.
 */
export function buildAudioPreviewItems({ items, mediaById, imageResolution }) {
	return items.map((item) => ({
		id: item.id,
		image_url: getMediaUrlForImageSize(
			mediaById?.[item.customThumbnail],
			imageResolution,
			item.customThumbnailUrl || item.url || ''
		),
		image_alt: mediaById?.[item.customThumbnail]?.alt_text || '',
		title: item.title || '',
		description: item.description || '',
		url: item.customUrl || '',
		customUrl: item.customUrl || '',
		custom_url: item.custom_url || item.customUrl || '',
		audioUrl: item.audioUrl || '',
		...(Array.isArray(item.socialShare) ? { socialShare: item.socialShare } : {}),
		extra: {
			audioUrl: item.audioUrl || '',
			audioSource: item.audioSource,
			fallbackUrl: item.url || '',
		},
	}));
}

/**
 * External-feed preview items (data fetched via `useExternalFeed`).
 *
 * @param {object[]} data
 * @return {object[]} Normalized preview items.
 */
export function buildExternalPreviewItems(data) {
	return data.map((item) => ({
		id: item.id,
		image_url: item?.image_url || '',
		image_alt: item?.image_alt || '',
		title: item.title || '',
		description: item.description || '',
		url: item.url || '',
		audioUrl: item.audioUrl || '',
		// Video feeds (YouTube) carry the same keys as the video source so the
		// shared video card can render them.
		video_source: item.video_source || '',
		video_url: item.video_url || '',
		extra: item.extra,
		taxonomy: item?.extra?.category || '',
	}));
}

/**
 * Fallback preview items for any source without a dedicated pipeline.
 *
 * @param {object[]} items
 * @return {object[]} Normalized preview items.
 */
export function buildFallbackPreviewItems(items) {
	return items.map((item) => ({
		id: item.id,
		image_url: item.url || '',
		image_alt: '',
		title: '',
		description: '',
		url: item.url || '',
		extra: {},
	}));
}
