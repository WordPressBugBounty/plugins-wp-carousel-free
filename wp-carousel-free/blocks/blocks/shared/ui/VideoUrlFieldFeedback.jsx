/**
 * Inline validation error or contextual help for a video URL field.
 */

import { useMemo } from '@wordpress/element';
import {
	getVideoUrlErrorMessage,
	getVideoUrlHelpMessage,
	validateVideoUrl,
} from '../utils/videoUrlValidation';

/**
 * @param {Object} props
 * @param {string} props.videoSource      Active provider key.
 * @param {string} props.videoUrl         Current field value.
 * @param {string} props.feedbackId       Element id for aria-describedby wiring.
 * @param {string} [props.errorClassName] Error paragraph class.
 * @param {string} [props.helpClassName]  Help paragraph class.
 * @return {?JSX.Element} Inline error/help markup, or null when neither applies.
 */
export default function VideoUrlFieldFeedback({
	videoSource,
	videoUrl,
	feedbackId,
	errorClassName = 'wpcp-item-popup-url-error',
	helpClassName = 'wpcp-video-item-popup-help',
}) {
	const validation = useMemo(() => validateVideoUrl(videoSource, videoUrl), [videoSource, videoUrl]);
	const trimmedUrl = String(videoUrl || '').trim();
	const errorMessage = trimmedUrl
		? getVideoUrlErrorMessage(validation.errorCode, videoSource)
		: null;
	const helpMessage = !errorMessage ? getVideoUrlHelpMessage(videoSource) : null;

	if (!errorMessage && !helpMessage) {
		return null;
	}

	return (
		<div id={feedbackId}>
			{errorMessage && (
				<p className={errorClassName} role="alert">
					{errorMessage}
				</p>
			)}
			{helpMessage && <p className={helpClassName}>{helpMessage}</p>}
		</div>
	);
}

/**
 * Whether the current video URL field value is valid (empty is valid).
 *
 * @param {string} videoSource Provider key.
 * @param {string} videoUrl    Current field value.
 * @return {boolean} True when the URL is empty or passes validation.
 */
export function isVideoUrlFieldValid(videoSource, videoUrl) {
	return validateVideoUrl(videoSource, videoUrl).valid;
}
