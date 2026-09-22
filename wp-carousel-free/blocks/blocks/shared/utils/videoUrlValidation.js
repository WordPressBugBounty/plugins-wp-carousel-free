/**
 * Video URL validation and sanitization.
 *
 * Mirrors `ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\VideoUrlValidator`
 * on the PHP side. Provider-specific patterns follow the embed extractors in
 * `media.js` (`getVideoEmbedUrl` / `getVideoSourceType`).
 */

import { __, sprintf } from '@wordpress/i18n';
import { VIDEO_SUB_SOURCES } from '../constants/allowedSources';
import { VIDEO_SOURCE_LABELS } from '../constants/sourceMeta';
import { getVideoSourceType, isValidAbsoluteUrl } from './media';

const IFRAME_PATTERN = /<iframe/i;

/**
 * Whether a string looks like pasted iframe embed markup.
 *
 * @param {string} value Raw input.
 * @return {boolean} True when the value contains an iframe tag.
 */
export function looksLikeVideoEmbedCode(value) {
	return IFRAME_PATTERN.test(String(value || '').trim());
}

/**
 * Provider-specific URL format checks (must match `getVideoEmbedUrl` extractors).
 *
 * @param {string} videoSource Provider key.
 * @param {string} url         Trimmed URL.
 * @return {boolean} True when the value can be embedded for this provider.
 */
export function canEmbedVideoSource(videoSource, url) {
	const raw = String(url || '').trim();
	if (!raw) {
		return false;
	}

	switch (videoSource) {
		case 'youtube':
			return /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^?&#/]+)/i.test(raw);

		case 'vimeo':
			return /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i.test(raw);

		default:
			return false;
	}
}

/**
 * Sanitize an absolute http(s) link for storage.
 *
 * @param {string} url Raw user input.
 * @return {string} Normalized URL (empty when invalid or blank).
 */
export function sanitizeLinkUrl(url) {
	const trimmed = String(url || '').trim();
	if (!trimmed || looksLikeVideoEmbedCode(trimmed) || !isValidAbsoluteUrl(trimmed)) {
		return '';
	}

	try {
		const parsed = new URL(trimmed);
		if ('http:' !== parsed.protocol && 'https:' !== parsed.protocol) {
			return '';
		}
		return parsed.toString();
	} catch {
		return '';
	}
}

/**
 * Validate a video URL for a given provider.
 *
 * @param {string} videoSource Provider key (`youtube`, `vimeo`).
 * @param {string} videoUrl    Raw user input.
 * @return {{ valid: boolean, errorCode: string|null, detectedSource: string|null }} Validation result.
 */
export function validateVideoUrl(videoSource, videoUrl) {
	const trimmed = String(videoUrl || '').trim();
	const source = String(videoSource || '').trim() || 'youtube';

	if (!trimmed) {
		return { valid: true, errorCode: null, detectedSource: source };
	}

	if (!VIDEO_SUB_SOURCES.includes(source)) {
		return { valid: false, errorCode: 'unsupported_provider', detectedSource: source };
	}

	if (looksLikeVideoEmbedCode(trimmed)) {
		return { valid: false, errorCode: 'embed_code_unsupported', detectedSource: source };
	}

	if (!isValidAbsoluteUrl(trimmed)) {
		return { valid: false, errorCode: 'invalid_url', detectedSource: source };
	}

	try {
		const parsed = new URL(trimmed);
		if ('http:' !== parsed.protocol && 'https:' !== parsed.protocol) {
			return { valid: false, errorCode: 'invalid_url_scheme', detectedSource: source };
		}
	} catch {
		return { valid: false, errorCode: 'invalid_url', detectedSource: source };
	}

	const detectedSource = getVideoSourceType(trimmed);
	if (!detectedSource) {
		return { valid: false, errorCode: 'unsupported_provider', detectedSource };
	}

	if (!canEmbedVideoSource(source, trimmed)) {
		return { valid: false, errorCode: 'invalid_provider_format', detectedSource };
	}

	return { valid: true, errorCode: null, detectedSource };
}

const VIDEO_URL_HELP_MESSAGES = {
	general: __('Paste a full video link (https://…) from YouTube or Vimeo.', 'wp-carousel-free'),
	youtube: __(
		'Example: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID',
		'wp-carousel-free'
	),
	vimeo: __('Example: https://vimeo.com/123456789', 'wp-carousel-free'),
};

/**
 * Contextual help message for a video URL field.
 *
 * @param {string} videoSource Provider key.
 * @return {string} Localized help copy.
 */
export function getVideoUrlHelpMessage(videoSource) {
	return VIDEO_URL_HELP_MESSAGES[videoSource] || VIDEO_URL_HELP_MESSAGES.general;
}

/**
 * Map a validation error code to a user-facing message.
 *
 * @param {string|null} errorCode   Validation error code.
 * @param {string}      videoSource Active provider key.
 * @return {string|null} Localized message, or null when there is no error.
 */
export function getVideoUrlErrorMessage(errorCode, videoSource) {
	if (!errorCode) {
		return null;
	}

	const providerLabel = VIDEO_SOURCE_LABELS[videoSource] || __('Video URL', 'wp-carousel-free');

	switch (errorCode) {
		case 'invalid_url':
			return __(
				'That doesn’t look like a valid URL. Enter a full link starting with https://',
				'wp-carousel-free'
			);
		case 'invalid_url_scheme':
			return __('Only http:// and https:// links are supported.', 'wp-carousel-free');
		case 'unsupported_provider':
			return __(
				'This URL is not from a supported video provider. Use a YouTube or Vimeo link.',
				'wp-carousel-free'
			);
		case 'invalid_provider_format':
			return sprintf(
				/* translators: %s: provider-specific field label, e.g. "YouTube Video URL" */
				__('This URL doesn’t match the expected format for %s.', 'wp-carousel-free'),
				providerLabel
			);
		case 'embed_code_unsupported':
			return __(
				'You pasted iframe embed code. Paste a regular YouTube or Vimeo page URL instead.',
				'wp-carousel-free'
			);
		default:
			return __('Please enter a valid video URL.', 'wp-carousel-free');
	}
}

/**
 * Whether a video item has a non-empty, valid URL ready to insert/save.
 *
 * @param {Object} item Video item attributes.
 * @return {boolean} True when the item has a non-empty, valid video URL.
 */
export function isVideoItemInsertable(item) {
	const url = String(item?.videoUrl || '').trim();
	if (!url) {
		return false;
	}
	return validateVideoUrl(item?.videoSource || 'youtube', url).valid;
}

/**
 * Sanitize video item URL fields before persisting.
 *
 * @param {Object} item Video item attributes.
 * @return {Object} Item with sanitized URL fields.
 */
export function prepareVideoItemForInsert(item) {
	return {
		...item,
		videoUrl: sanitizeLinkUrl(item?.videoUrl || ''),
		customUrl: sanitizeLinkUrl(item?.customUrl || ''),
	};
}
