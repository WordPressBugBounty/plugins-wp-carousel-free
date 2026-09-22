/**
 * VideoItemEditPopup – portal popup for editing a single video item.
 *
 * Used from GalleryEditPopup and CarouselEdit when sourceType === 'video'.
 * Layout matches the design: left column (URL + thumbnail + custom thumb),
 * right column (title, description, custom URL, social share).
 */

import { __ } from '@wordpress/i18n';
import {
	useState,
	useCallback,
	useRef,
	useEffect,
	useMemo,
	createPortal,
} from '@wordpress/element';
import { Button } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { getThumbnailFromUrl, getVideoSourceType, isValidAbsoluteHttpUrl } from '../utils/media';
import {
	looksLikeVideoEmbedCode,
	prepareVideoItemForInsert,
	validateVideoUrl,
} from '../utils/videoUrlValidation';
import { sanitizeItemTextFields } from '../utils/sanitizeItemText';
import { VIDEO_SOURCE_LABELS } from '../constants/sourceMeta';
import VideoUrlFieldFeedback from '../ui/VideoUrlFieldFeedback';
import SocialMediaSelectLocked from './SocialMediaSelectLocked';
import SpProNotice from '../../../components/pro/proNotice';
import { PRO_ITEM_SOCIAL_SHARE } from '../constants/proFeatures';
import './VideoItemEditPopup.scss';
import { DeleteIcon } from '../../../admin/pages/saved-templates/icons';

export default function VideoItemEditPopup({
	item,
	items,
	currentIndex,
	onSave,
	onBack,
	onNavigate,
	onRemoveItem,
}) {
	const [localData, setLocalData] = useState({
		videoUrl: item.videoUrl || '',
		videoSource: item.videoSource || '',
		url: item.url || '',
		title: item.title || '',
		description: item.description || '',
		customUrl: item.customUrl || '',
		customThumbnail: item.customThumbnail || null,
		customThumbnailUrl: item.customThumbnailUrl || '',
	});

	useEffect(() => {
		setLocalData({
			videoUrl: item.videoUrl || '',
			videoSource: item.videoSource || '',
			url: item.url || '',
			title: item.title || '',
			description: item.description || '',
			customUrl: item.customUrl || '',
			customThumbnail: item.customThumbnail || null,
			customThumbnailUrl: item.customThumbnailUrl || '',
		});
		// Sync local form when navigating to a different item.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when item.id changes
	}, [item.id]);

	const panelRef = useRef(null);
	const totalItems = items.length;
	const canGoPrev = currentIndex > 0;
	const canGoNext = currentIndex < totalItems - 1;
	const videoUrlInputId = `wpcp-video-url-${item.id}`;
	const titleInputId = `wpcp-video-title-${item.id}`;
	const descriptionInputId = `wpcp-video-description-${item.id}`;
	const customUrlInputId = `wpcp-video-custom-url-${item.id}`;

	const effectiveVideoSource =
		localData.videoSource || getVideoSourceType(localData.videoUrl) || 'youtube';

	const videoValidation = useMemo(
		() => validateVideoUrl(effectiveVideoSource, localData.videoUrl),
		[effectiveVideoSource, localData.videoUrl]
	);

	const trimmedCustomUrl = localData.customUrl.trim();
	const customUrlInvalid =
		!!trimmedCustomUrl &&
		!looksLikeVideoEmbedCode(trimmedCustomUrl) &&
		!isValidAbsoluteHttpUrl(trimmedCustomUrl);
	const trimmedVideoUrl = localData.videoUrl.trim();
	const videoUrlInvalid = !!trimmedVideoUrl && !videoValidation.valid;
	const canSave = videoValidation.valid && !customUrlInvalid;

	const handleBackdropClick = useCallback(
		(e) => {
			if (e.target === e.currentTarget) {
				onBack();
			}
		},
		[onBack]
	);

	const updateField = (field, value) => {
		setLocalData((prev) => ({ ...prev, [field]: value }));
	};

	const saveCurrentItem = useCallback(() => {
		if (!canSave) {
			return false;
		}

		const nextData = prepareVideoItemForInsert({
			...localData,
			videoSource: effectiveVideoSource,
		});

		onSave(
			sanitizeItemTextFields({
				...item,
				...nextData,
			})
		);
		return true;
	}, [canSave, effectiveVideoSource, item, localData, onSave]);

	const handleSave = () => {
		const saved = saveCurrentItem();
		if (saved) {
			onBack();
		}
	};

	const handleNavigate = useCallback(
		(newIndex) => {
			const saved = saveCurrentItem();
			if (saved) {
				onNavigate(newIndex);
			}
		},
		[saveCurrentItem, onNavigate]
	);

	const handleCustomThumbnailSelect = (selected) => {
		const m = Array.isArray(selected) ? selected[0] : selected;
		setLocalData((prev) => ({
			...prev,
			customThumbnail: m.id,
			customThumbnailUrl: m.url || '',
		}));
	};
	const removeCustomImg = () => {
		setLocalData((prev) => ({
			...prev,
			customThumbnail: '',
			customThumbnailUrl: '',
		}));
	};

	const handleVideoUrlChange = (url) => {
		setLocalData((prev) => {
			const next = { ...prev, videoUrl: url };
			if (!url) {
				next.url = '';
				next.videoSource = prev.videoSource || item.videoSource || 'youtube';
				return next;
			}
			const videoSource = getVideoSourceType(url);
			if (videoSource) {
				next.videoSource = videoSource;
			}
			next.url = getThumbnailFromUrl(next.videoSource, url) || '';
			return next;
		});
	};

	const thumbnailUrl = localData.customThumbnailUrl || localData.url || '';
	const urlLabel = VIDEO_SOURCE_LABELS[effectiveVideoSource] || __('Video URL', 'wp-carousel-free');
	const videoUrlFeedbackId = `${videoUrlInputId}-feedback`;

	return createPortal(
		<div className="wpcp-item-popup-backdrop" onMouseDown={handleBackdropClick}>
			<div className="wpcp-video-item-popup" ref={panelRef}>
				<div className="wpcp-video-item-popup-body">
					<div className="wpcp-video-item-popup-left">
						<div className="wpcp-video-item-popup-field">
							<label htmlFor={videoUrlInputId}>{urlLabel}</label>
							<input
								id={videoUrlInputId}
								type="text"
								value={localData.videoUrl}
								onChange={(e) => handleVideoUrlChange(e.target.value)}
								aria-invalid={videoUrlInvalid}
								aria-describedby={videoUrlFeedbackId}
							/>
							<VideoUrlFieldFeedback
								videoSource={effectiveVideoSource}
								videoUrl={localData.videoUrl}
								feedbackId={videoUrlFeedbackId}
							/>
						</div>

						{thumbnailUrl ? (
							<div className="wpcp-video-item-popup-preview">
								<img src={thumbnailUrl} alt="" />
								<div className="wpcp-video-item-popup-play">
									<svg viewBox="0 0 24 24" width="40" height="40" fill="none">
										<circle cx="12" cy="12" r="12" fill="rgba(25, 148, 158, 0.85)" />
										<path d="M10 8l6 4-6 4V8z" fill="#fff" />
									</svg>
								</div>
							</div>
						) : (
							<div className="wpcp-video-item-popup-preview wpcp-video-item-popup-preview--empty">
								<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" strokeWidth="1">
									<rect x="2" y="3" width="20" height="14" rx="2" />
									<path d="M10 8l6 4-6 4V8z" />
								</svg>
							</div>
						)}

						<div className="wpcp-video-item-popup-thumbnail-row">
							<span className="wpcp-video-item-title">{__('Custom Thumbnail', 'wp-carousel-free')}</span>
							<div className="wpcp-video-item-button">
								<MediaUploadCheck>
									<MediaUpload
										onSelect={handleCustomThumbnailSelect}
										allowedTypes={['image']}
										render={({ open }) => (
											<Button isSecondary onClick={open} className="wpcp-video-item-popup-choose-image">
												{localData.customThumbnailUrl ? (
													<>
														<img src={localData.customThumbnailUrl} alt="" className="wpcp-video-thumb-mini" />
														{__('Change Image', 'wp-carousel-free')}
													</>
												) : (
													__('Choose Image', 'wp-carousel-free')
												)}
											</Button>
										)}
									/>
								</MediaUploadCheck>
								{localData.customThumbnailUrl && (
									<span className="wpcp-remove-custom-thumbnails" onClick={removeCustomImg}>
										<DeleteIcon />
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="wpcp-video-item-popup-right">
						<div className="wpcp-video-item-popup-field">
							<label htmlFor={titleInputId}>{__('Title', 'wp-carousel-free')}</label>
							<input
								id={titleInputId}
								type="text"
								value={localData.title}
								onChange={(e) => updateField('title', e.target.value)}
								placeholder={__('Video Title', 'wp-carousel-free')}
							/>
						</div>
						<div className="wpcp-video-item-popup-field">
							<label htmlFor={descriptionInputId}>{__('Description', 'wp-carousel-free')}</label>
							<textarea
								id={descriptionInputId}
								value={localData.description}
								onChange={(e) => updateField('description', e.target.value)}
								placeholder={__('Video description', 'wp-carousel-free')}
								rows={3}
							/>
						</div>
						<div className="wpcp-video-item-popup-field">
							<label htmlFor={customUrlInputId}>{__('Custom URL', 'wp-carousel-free')}</label>
							<input
								id={customUrlInputId}
								type="url"
								value={localData.customUrl}
								onChange={(e) => updateField('customUrl', e.target.value)}
								aria-invalid={customUrlInvalid}
							/>
							{customUrlInvalid && (
								<p className="wpcp-item-popup-url-error" role="alert">
									{__('Custom URL must be a full link starting with https://', 'wp-carousel-free')}
								</p>
							)}
						</div>
						<div className="wpcp-video-item-popup-field wpcp-pro-locked-row">
							<span>
								{__('Allow Social Media for Sharing', 'wp-carousel-free')}{' '}
								<span className="wpcp-pro-inline-tag">{__('(Pro)', 'wp-carousel-free')}</span>
							</span>
							<SocialMediaSelectLocked />
						</div>
						<SpProNotice
							className="is-upsell"
							message={PRO_ITEM_SOCIAL_SHARE.message}
							linkText={PRO_ITEM_SOCIAL_SHARE.linkText}
						/>
					</div>
				</div>

				<div className="wpcp-video-item-popup-actions">
					<Button isLink className="wpcp-video-item-popup-remove" onClick={() => onRemoveItem(item.id)}>
						{__('Remove Video', 'wp-carousel-free')}
					</Button>
					<Button
						isPrimary
						className="wpcp-video-item-popup-save"
						onClick={handleSave}
						disabled={!canSave}
					>
						{__('Save Changes', 'wp-carousel-free')}
					</Button>
				</div>

				<div className="wpcp-video-item-popup-nav">
					<Button
						isLink
						className="wpcp-video-item-popup-nav-btn"
						disabled={!canGoPrev || !canSave}
						onClick={() => canGoPrev && handleNavigate(currentIndex - 1)}
					>
						<svg
							viewBox="0 0 24 24"
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="15 18 9 12 15 6" />
						</svg>
						{__('Previous', 'wp-carousel-free')}
					</Button>
					<span className="wpcp-video-item-popup-counter">
						{currentIndex + 1}/{totalItems}
					</span>
					<Button
						isLink
						className="wpcp-video-item-popup-nav-btn"
						disabled={!canGoNext || !canSave}
						onClick={() => canGoNext && handleNavigate(currentIndex + 1)}
					>
						{__('Next', 'wp-carousel-free')}
						<svg
							viewBox="0 0 24 24"
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</Button>
				</div>
			</div>
		</div>,
		document.body
	);
}
