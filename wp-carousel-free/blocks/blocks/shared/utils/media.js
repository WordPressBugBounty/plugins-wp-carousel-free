/**
 * Build a flat `{ sizeKey: url }` map from a `MediaUpload` selection object.
 *
 * The block editor's `MediaUpload` `onSelect` exposes a `sizes` map
 * (`{ thumbnail: { url, … }, medium: { … }, …, full: { … } }`) synchronously at
 * insert time. Capturing that onto the item lets the editor preview resolve
 * Image Resolution immediately, instead of waiting for the asynchronous
 * `core.getMedia` fetch to hydrate (which caused the chosen size to apply only
 * "sometimes" on fresh loads).
 *
 * @param {Object|null|undefined} media - `MediaUpload` selection object.
 * @return {Object} Flat map of registered size slug → URL (empty when unavailable).
 */
export function extractMediaSizeUrls(media) {
	const map = {};
	if (!media || typeof media !== 'object') {
		return map;
	}
	const sizes = media.sizes && typeof media.sizes === 'object' ? media.sizes : null;
	if (sizes) {
		Object.keys(sizes).forEach((sizeKey) => {
			const url = sizes[sizeKey]?.url;
			if (url) {
				map[sizeKey] = url;
			}
		});
	}
	// `full` is not always a key in the sizes map; the top-level url is the original.
	if (!map.full && media.url) {
		map.full = media.url;
	}
	return map;
}

/**
 * Flatten a `core` store `getMedia` record into a `{ sizeKey: url }` map.
 *
 * @param {Object|null|undefined} media - `getMedia` record.
 * @return {Object|null} Flat size map, or null when the record is unavailable.
 */
function sizeMapFromMediaRecord(media) {
	if (!media || typeof media !== 'object') {
		return null;
	}
	const map = {};
	const sizes =
		media.media_details && typeof media.media_details === 'object' ? media.media_details.sizes : null;
	if (sizes && typeof sizes === 'object') {
		Object.keys(sizes).forEach((sizeKey) => {
			const url = sizes[sizeKey]?.source_url;
			if (url) {
				map[sizeKey] = url;
			}
		});
	}
	if (media.source_url) {
		map.full = media.source_url;
	}
	return map;
}

/**
 * Resolve an image URL for a registered WordPress image size, mirroring
 * `wp_get_attachment_image_src` so the editor preview matches the PHP frontend.
 *
 * Resolution order, per size:
 *   1. The live `core.getMedia` record (kept fresh by WordPress; survives domain
 *      and migration changes).
 *   2. The item-captured `sizes` map (synchronous bridge available at insert time,
 *      before the async `getMedia` fetch resolves).
 *   3. The full/original image when the chosen size was never generated — the same
 *      fallback `wp_get_attachment_image_src` performs (no "next size up" walk,
 *      which previously diverged from the frontend).
 *   4. The plain fallback URL as a last resort.
 *
 * @param {Object|null|undefined} media       - Value from the `core` store `getMedia`.
 * @param {string}                sizeKey     - full|large|medium_large|medium|thumbnail
 * @param {string}                fallbackUrl - e.g. item.url (insert-time URL).
 * @param {Object|null}           itemSizes   - Flat size map captured at insert (see extractMediaSizeUrls).
 * @return {string} Resolved image URL for the size (or full/fallback).
 */
export function getMediaUrlForImageSize(media, sizeKey, fallbackUrl = '', itemSizes = null) {
	const key = String(sizeKey || 'large').toLowerCase();
	const mediaMap = sizeMapFromMediaRecord(media);

	if ('full' !== key) {
		if (mediaMap && mediaMap[key]) {
			return mediaMap[key];
		}
		if (itemSizes && itemSizes[key]) {
			return itemSizes[key];
		}
	}

	const fullUrl = (mediaMap && mediaMap.full) || (itemSizes && itemSizes.full) || '';
	if (fullUrl) {
		return fullUrl;
	}
	return fallbackUrl || '';
}

/**
 * Resolve the intrinsic pixel dimensions of a registered image size from a
 * `core.getMedia` record, mirroring `wp_get_attachment_image_src` (the source
 * of `$src[1]`/`$src[2]` in `ImageSource.php`). Variable-width slides read these
 * to size each slide to the image's natural width, so the editor preview must
 * resolve them the same way the PHP frontend does.
 *
 * Resolution order matches `getMediaUrlForImageSize`: the chosen size's
 * dimensions when generated, otherwise the full/original dimensions.
 *
 * @param {Object|null|undefined} media   - Value from the `core` store `getMedia`.
 * @param {string}                sizeKey - full|large|medium_large|medium|thumbnail
 * @return {{width: number, height: number}|null} Dimensions, or null when unknown.
 */
export function getMediaDimensionsForImageSize(media, sizeKey) {
	const details =
		media &&
		typeof media === 'object' &&
		media.media_details &&
		typeof media.media_details === 'object'
			? media.media_details
			: null;
	if (!details) {
		return null;
	}

	const key = String(sizeKey || 'large').toLowerCase();
	const sizes = details.sizes && typeof details.sizes === 'object' ? details.sizes : null;
	if ('full' !== key && sizes && sizes[key]) {
		const sizeWidth = Number(sizes[key].width);
		const sizeHeight = Number(sizes[key].height);
		if (
			Number.isFinite(sizeWidth) &&
			sizeWidth > 0 &&
			Number.isFinite(sizeHeight) &&
			sizeHeight > 0
		) {
			return { width: sizeWidth, height: sizeHeight };
		}
	}

	const fullWidth = Number(details.width);
	const fullHeight = Number(details.height);
	if (Number.isFinite(fullWidth) && fullWidth > 0 && Number.isFinite(fullHeight) && fullHeight > 0) {
		return { width: fullWidth, height: fullHeight };
	}

	return null;
}

export const videoPlaceholder =
	window?.sp_wp_carousel_pro?.url + 'Blocks/img/video-placeholder.svg';

/**
 * Determines the video source type from a URL.
 *
 * @param {string} url Video URL.
 * @return {string} `youtube`, `vimeo`, or an empty string for an unsupported host.
 */
export function getVideoSourceType(url) {
	if (!url) {
		return 'youtube';
	}

	if (url.includes('youtube.com') || url.includes('youtu.be')) {
		return 'youtube';
	}
	if (url.includes('vimeo.com')) {
		return 'vimeo';
	}

	return '';
}

/**
 * Whether a string parses as an absolute URL. Mirrors the app's own
 * `new URL( value )` usage (no base), so a scheme-less or malformed entry is
 * reported invalid — the same condition that would otherwise throw downstream.
 *
 * @param {string} value Raw user-entered URL.
 * @return {boolean} True when `value` is a parseable absolute URL.
 */
export function isValidAbsoluteUrl(value) {
	const rawUrl = String(value || '').trim();
	if (!rawUrl) {
		return false;
	}
	try {
		// eslint-disable-next-line no-new
		new URL(rawUrl);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Whether a string parses as an absolute http(s) URL. Stricter than
 * `isValidAbsoluteUrl`, which accepts any scheme (e.g. `mailto:` or a typo
 * like `hello:world`) — mirrors PHP's `VideoUrlValidator::is_valid_absolute_url()`.
 *
 * @param {string} value Raw user-entered URL.
 * @return {boolean} True when `value` is a parseable absolute http(s) URL.
 */
export function isValidAbsoluteHttpUrl(value) {
	if (!isValidAbsoluteUrl(value)) {
		return false;
	}

	const { protocol } = new URL(String(value).trim());
	return 'http:' === protocol || 'https:' === protocol;
}

/**
 * Generates an embed URL for a video based on its source.
 *
 * @param {string} videoSource Video provider key.
 * @param {string} url         Video URL.
 * @return {string} Embed URL or original URL if no embed format exists.
 */
export function getVideoEmbedUrl(videoSource, url) {
	if (!url) {
		return '';
	}

	switch (videoSource) {
		case 'youtube': {
			const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&#]+)/);
			if (match) {
				return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=1`;
			}
			return url;
		}

		case 'vimeo': {
			const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
			if (match) {
				return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&controls=1`;
			}
			return url;
		}

		default:
			return url;
	}
}

/**
 * Wraps a cross-origin player embed URL in the same-origin proxy used by the editor preview.
 *
 * The WordPress 7+ editor canvas is a `blob:` iframe whose document has no real URL, so a
 * provider iframe (YouTube, Vimeo) nested directly in it cannot send a valid HTTP Referer
 * and fails with "Error 153". Loading `src/Blocks/video-embed-proxy.html` (a real same-origin
 * URL) and embedding the player from there restores a valid Referer. This is an editor-only
 * concern — the frontend builds players in the top document.
 *
 * @param {string} videoSource Video provider key.
 * @param {string} embedUrl    Provider embed URL (output of `getVideoEmbedUrl`).
 * @return {string} Proxied URL for the editor preview, or the original URL when no proxy applies.
 */
export function getEditorVideoSrc(videoSource, embedUrl) {
	if (!embedUrl) {
		return '';
	}
	const base = window?.sp_wp_carousel_pro?.url;
	if (!base) {
		return embedUrl;
	}
	return `${base}Blocks/video-embed-proxy.html#${encodeURIComponent(embedUrl)}`;
}

/**
 * Resolves a thumbnail URL from a supported video source URL.
 *
 * @param {string} videoSource Video provider key (youtube, vimeo).
 * @param {string} url         Video URL entered by the user.
 * @return {string} Thumbnail URL when available, empty string otherwise.
 */
export function getThumbnailFromUrl(videoSource, url) {
	if (!url) {
		return '';
	}

	switch (videoSource) {
		case 'youtube': {
			const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&#]+)/);
			if (match) {
				return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
			}
			break;
		}

		case 'vimeo': {
			const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
			if (match) {
				return `https://vumbnail.com/${match[1]}.jpg`;
			}
			break;
		}

		default:
			return videoPlaceholder;
	}

	return '';
}

/**
 * Opens a fresh WordPress media frame on a specific tab.
 *
 * A new frame is created on every call, so no tab/selection state survives
 * between opens — each click starts on the requested tab.
 *
 * @param {Object}          options
 * @param {string}          [options.tab='browse']   'upload' for Upload Files; 'browse' for Media Library.
 * @param {string|string[]} [options.allowedTypes]   Allowed type filter (e.g. 'image' or ['image']).
 * @param {boolean|string}  [options.multiple=false] false, true, or 'add'. `true` is normalized to
 *                                                   `'add'` (same as Gutenberg MediaUpload) so
 *                                                   clicks append instead of replacing the selection.
 * @param {string}          [options.title]          Modal title.
 * @param {string}          [options.buttonText]     Confirm button label.
 * @param {Function}        options.onSelect         Receives one attachment object, or an array when multiple is truthy.
 * @param {number[]}        [options.selected=[]]    Attachment IDs to pre-check (edit-gallery flow).
 */
export function openWpMediaModal({
	tab = 'browse',
	allowedTypes,
	multiple = false,
	title,
	buttonText,
	onSelect,
	selected = [],
}) {
	if (!window.wp || !window.wp.media) {
		return;
	}

	// Gutenberg MediaUpload maps boolean `true` → `'add'`. Without that, a plain
	// click replaces the whole selection (looks like single-select).
	const multipleMode = true === multiple ? 'add' : multiple;

	const frame = window.wp.media({
		title,
		button: buttonText ? { text: buttonText } : undefined,
		library: allowedTypes ? { type: allowedTypes } : undefined,
		multiple: multipleMode,
	});

	// Switch to the requested router tab once the frame's content renders.
	frame.on('open', () => {
		// Force the full filter bar ("Filter by type" + "Filter by date") on the
		// Media Library tab. Raw wp.media() frames default to a reduced filterable
		// state that drops the type dropdown; 'all' restores it (matches MediaUpload).
		if (frame.states && 'function' === typeof frame.states.each) {
			frame.states.each((state) => {
				if (undefined !== state.get('filterable')) {
					state.set('filterable', 'all');
				}
			});
		}
		const content = frame.content;
		if (content && 'function' === typeof content.mode) {
			content.mode('upload' === tab ? 'upload' : 'browse');
		}

		// Pre-select existing attachments so reopening the library shows the
		// current gallery checked (edit-gallery flow) instead of an empty picker.
		const selection = frame.state() && frame.state().get('selection');
		if (selection && Array.isArray(selected) && selected.length) {
			selection.reset();
			selected
				.map((id) => parseInt(id, 10))
				.filter((id) => !isNaN(id))
				.forEach((id) => {
					const attachment = window.wp.media.attachment(id);
					attachment.fetch();
					selection.add(attachment);
				});
		}
	});

	frame.on('select', () => {
		const selection = frame.state().get('selection');
		if (!selection) {
			return;
		}
		if (multipleMode) {
			onSelect(selection.toArray().map((model) => model.toJSON()));
		} else {
			const first = selection.first();
			if (first) {
				onSelect(first.toJSON());
			}
		}
	});

	frame.open();
}
