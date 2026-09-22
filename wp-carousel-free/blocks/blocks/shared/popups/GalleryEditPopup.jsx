import { __ } from '@wordpress/i18n';
import { useState, useCallback, useRef, createPortal } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { SpProBadge, openPricingPage } from '@wp-carousel-pro/components';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import {
	SortableContext,
	rectSortingStrategy,
	verticalListSortingStrategy,
	arrayMove,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ItemEditPopup from './ItemEditPopup';
import VideoItemEditPopup from './VideoItemEditPopup';
import SocialMediaSelectLocked from './SocialMediaSelectLocked';
import SpProNotice from '../../../components/pro/proNotice';
import { PRO_ITEM_SOCIAL_SHARE } from '../constants/proFeatures';
import { getThumbnailFromUrl, extractMediaSizeUrls } from '../utils/media';
import { isVideoItemInsertable, prepareVideoItemForInsert } from '../utils/videoUrlValidation';
import { sanitizeItemTextFields } from '../utils/sanitizeItemText';
import VideoUrlFieldFeedback, { isVideoUrlFieldValid } from '../ui/VideoUrlFieldFeedback';
import {
	getAllowedSubSources,
	PRO_VIDEO_SUB_SOURCES,
	VIDEO_SUB_SOURCES,
} from '../constants/allowedSources';
import { VIDEO_SOURCES, VIDEO_SOURCE_LABELS, VIDEO_SOURCE_META } from '../constants/sourceMeta';

let _videoIdCounter = 0;
function generateVideoId() {
	return `video_popup_${Date.now()}_${++_videoIdCounter}`;
}

/**
 * Creates the default video item shape used by the popup's add-flow.
 *
 * @param {string} [blockName] Active block, used to pick a video sub-source the
 *                             block allows. Defaults to `'youtube'` when omitted.
 * @return {Object} Empty video item attributes.
 */
function createEmptyVideoItem(blockName) {
	const allowed = blockName ? getAllowedSubSources(blockName, 'video') : null;
	const defaultSource = allowed && allowed.length > 0 ? allowed[0] : 'youtube';
	return {
		id: generateVideoId(),
		videoSource: defaultSource,
		videoUrl: '',
		url: '',
		title: '',
		description: '',
		customUrl: '',
		customThumbnail: null,
		customThumbnailUrl: '',
	};
}

function getVideoPanelHeaderText(isExpanded, videoUrl, sourceLabel, urlLabel) {
	if (isExpanded) {
		return __('Add Video', 'wp-carousel-free');
	}
	if (videoUrl) {
		return `${sourceLabel}:  ${videoUrl}`;
	}
	return `${sourceLabel}:  ${urlLabel}`;
}

function getGalleryPopupTitle(isVideo, sourceType) {
	if (isVideo) {
		return __('Video', 'wp-carousel-free');
	}
	if ('image' === sourceType) {
		return __('Images', 'wp-carousel-free');
	}
	return __('Gallery', 'wp-carousel-free');
}

function renderThumbPlaceholderIcon() {
	return (
		<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#aaa" strokeWidth="1">
			<rect x="2" y="3" width="20" height="14" rx="2" />
			<path d="M10 8l6 4-6 4V8z" />
		</svg>
	);
}

function renderGalleryAddIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width="16"
			height="16"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="8" x2="12" y2="16" />
			<line x1="8" y1="12" x2="16" y2="12" />
		</svg>
	);
}

function renderGalleryMediaButtonIcon() {
	return (
		<>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
		</>
	);
}

function renderGalleryEditControl({ isVideo, localItems, handleAddMedia, setShowVideoAdd }) {
	if (isVideo) {
		return (
			<Button isLink onClick={() => setShowVideoAdd(true)}>
				{renderGalleryAddIcon()}
				{__('Add Video', 'wp-carousel-free')}
			</Button>
		);
	}
	return (
		<MediaUploadCheck>
			<MediaUpload
				onSelect={handleAddMedia}
				allowedTypes={['image']}
				multiple="add"
				value={localItems.map((i) => i.id)}
				render={({ open }) => (
					<Button isLink onClick={open}>
						<svg
							viewBox="0 0 24 24"
							width="16"
							height="16"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							{renderGalleryMediaButtonIcon()}
						</svg>
						{__('Edit Gallery', 'wp-carousel-free')}
					</Button>
				)}
			/>
		</MediaUploadCheck>
	);
}

function SortableVideoPanel({ blockName, item, isExpanded, onToggle, onDelete, onUpdate }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});
	const [showInfo, setShowInfo] = useState(false);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const sourceObj = VIDEO_SOURCES.find((s) => s.value === item.videoSource);
	const sourceLabel = sourceObj?.label || 'YouTube';
	const urlLabel = VIDEO_SOURCE_LABELS[item.videoSource] || __('Video URL', 'wp-carousel-free');
	const videoUrlInputId = `wpcp-video-url-${item.id}`;
	const videoUrlFeedbackId = `${videoUrlInputId}-feedback`;
	const trimmedVideoUrl = String(item.videoUrl || '').trim();
	const videoUrlInvalid =
		!!trimmedVideoUrl && !isVideoUrlFieldValid(item.videoSource, item.videoUrl);
	const videoTitleInputId = `wpcp-video-title-${item.id}`;
	const videoDescriptionInputId = `wpcp-video-description-${item.id}`;
	const videoCustomUrlInputId = `wpcp-video-custom-url-${item.id}`;

	const updateField = (field, value) => {
		const updated = { ...item, [field]: value };
		if (field === 'videoUrl') {
			updated.url = getThumbnailFromUrl(item.videoSource, value) || item.url;
		}
		if (field === 'videoSource' && item.videoUrl) {
			updated.url = getThumbnailFromUrl(value, item.videoUrl) || '';
		}
		onUpdate(updated);
	};

	const handleCustomThumbnailSelect = (selected) => {
		const m = Array.isArray(selected) ? selected[0] : selected;
		onUpdate({
			...item,
			customThumbnail: m.id,
			customThumbnailUrl: m.url || '',
		});
	};

	const handleRemoveThumbnail = () => {
		onUpdate({
			...item,
			customThumbnail: null,
			customThumbnailUrl: '',
		});
	};

	const headerText = getVideoPanelHeaderText(isExpanded, item.videoUrl, sourceLabel, urlLabel);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`wpcp-wizard-video-panel ${isDragging ? 'is-dragging' : ''} ${
				isExpanded ? 'is-expanded' : ''
			}`}
			{...attributes}
		>
			<div className="wpcp-wizard-video-panel-header">
				<span className="wpcp-wizard-video-panel-drag" {...listeners}>
					<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
						<circle cx="7" cy="4" r="1.5" />
						<circle cx="13" cy="4" r="1.5" />
						<circle cx="7" cy="10" r="1.5" />
						<circle cx="13" cy="10" r="1.5" />
						<circle cx="7" cy="16" r="1.5" />
						<circle cx="13" cy="16" r="1.5" />
					</svg>
				</span>
				<span
					className="wpcp-wizard-video-panel-header-text"
					onClick={onToggle}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => e.key === 'Enter' && onToggle()}
				>
					{headerText}
				</span>
				<div className="wpcp-wizard-video-panel-header-actions">
					<button
						type="button"
						className="wpcp-wizard-video-panel-action"
						onClick={onDelete}
						aria-label={__('Delete', 'wp-carousel-free')}
					>
						<svg
							viewBox="0 0 24 24"
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
					<button
						type="button"
						className="wpcp-wizard-video-panel-action"
						onClick={onToggle}
						aria-label={__('Toggle', 'wp-carousel-free')}
					>
						<svg
							viewBox="0 0 24 24"
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							{isExpanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
						</svg>
					</button>
				</div>
			</div>

			{isExpanded && (
				<div className="wpcp-wizard-video-panel-body">
					<p className="wpcp-wizard-video-panel-subtitle">
						{__('Choose a Video Source', 'wp-carousel-free')}
					</p>

					<div className="wpcp-wizard-grid wpcp-wizard-video-source-grid">
						{[
							...(getAllowedSubSources(blockName, 'video') || VIDEO_SUB_SOURCES),
							...PRO_VIDEO_SUB_SOURCES,
						].map((value) => {
							const meta = VIDEO_SOURCE_META[value];
							if (!meta) {
								return null;
							}
							// Pro providers keep their catalogue position; the card is a badged
							// teaser that opens the pricing page rather than selecting a source.
							const selectSource = () =>
								meta.pro ? openPricingPage() : updateField('videoSource', meta.value);
							return (
								<div
									key={meta.value}
									className={`wpcp-wizard-card wpcp-wizard-video-card ${
										item.videoSource === meta.value ? 'is-active' : ''
									}${meta.pro ? ' wpcp-pro-locked' : ''}`}
									role="button"
									tabIndex={0}
									aria-pressed={item.videoSource === meta.value}
									onClick={selectSource}
									onKeyDown={(e) => e.key === 'Enter' && selectSource()}
								>
									<span className="wpcp-wizard-card-icon">{meta.icon}</span>
									<span className="wpcp-wizard-card-label">{meta.label}</span>
									{meta.pro && <SpProBadge />}
								</div>
							);
						})}
					</div>

					<div className="wpcp-wizard-video-panel-field">
						<label htmlFor={videoUrlInputId}>{urlLabel}</label>
						<input
							id={videoUrlInputId}
							type="text"
							value={item.videoUrl || ''}
							onChange={(e) => updateField('videoUrl', e.target.value)}
							placeholder={__('Video URL', 'wp-carousel-free')}
							aria-invalid={videoUrlInvalid}
							aria-describedby={videoUrlFeedbackId}
						/>
						<VideoUrlFieldFeedback
							videoSource={item.videoSource}
							videoUrl={item.videoUrl || ''}
							feedbackId={videoUrlFeedbackId}
							errorClassName="wpcp-item-popup-url-error"
							helpClassName="wpcp-wizard-video-panel-help"
						/>
					</div>

					<div className="wpcp-wizard-video-panel-thumb-row">
						<span className="wpcp-wizard-video-panel-thumb-label">
							{__('Custom Thumbnail', 'wp-carousel-free')}
						</span>
						<MediaUploadCheck>
							<MediaUpload
								onSelect={handleCustomThumbnailSelect}
								allowedTypes={['image']}
								render={({ open }) => (
									<Button isSecondary onClick={open} className="wpcp-wizard-video-panel-choose-image">
										{item.customThumbnailUrl ? (
											<>
												<img src={item.customThumbnailUrl} alt="" className="wpcp-wizard-video-thumb-mini" />
												{__('Change Image', 'wp-carousel-free')}
											</>
										) : (
											__('Choose Image', 'wp-carousel-free')
										)}
									</Button>
								)}
							/>
						</MediaUploadCheck>
						{item.customThumbnailUrl && (
							<button
								type="button"
								className="wpcp-wizard-video-panel-remove-thumb"
								onClick={handleRemoveThumbnail}
								aria-label={__('Remove thumbnail', 'wp-carousel-free')}
							>
								<svg
									viewBox="0 0 24 24"
									width="16"
									height="16"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
									<path d="M10 11v6" />
									<path d="M14 11v6" />
								</svg>
							</button>
						)}
						<button
							type="button"
							className="wpcp-wizard-video-panel-toggle-info"
							onClick={() => setShowInfo(!showInfo)}
						>
							{showInfo
								? __('Hide video info', 'wp-carousel-free')
								: __('Add video info', 'wp-carousel-free')}
						</button>
					</div>

					{showInfo && (
						<div className="wpcp-wizard-video-panel-info">
							<div className="wpcp-wizard-video-panel-field">
								<label htmlFor={videoTitleInputId}>{__('Video Title', 'wp-carousel-free')}</label>
								<input
									id={videoTitleInputId}
									type="text"
									value={item.title || ''}
									onChange={(e) => updateField('title', e.target.value)}
									placeholder={__('Give a custom title', 'wp-carousel-free')}
								/>
							</div>
							<div className="wpcp-wizard-video-panel-field">
								<label htmlFor={videoDescriptionInputId}>
									{__('Video Description', 'wp-carousel-free')}
								</label>
								<textarea
									id={videoDescriptionInputId}
									value={item.description || ''}
									onChange={(e) => updateField('description', e.target.value)}
									placeholder={__('Give a custom description', 'wp-carousel-free')}
									rows={3}
								/>
							</div>
							<div className="wpcp-wizard-video-panel-field">
								<label htmlFor={videoCustomUrlInputId}>{__('Custom URL', 'wp-carousel-free')}</label>
								<input
									id={videoCustomUrlInputId}
									type="url"
									value={item.customUrl || ''}
									onChange={(e) => updateField('customUrl', e.target.value)}
								/>
							</div>
							<div className="wpcp-wizard-video-panel-field wpcp-pro-locked-row">
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
					)}
				</div>
			)}
		</div>
	);
}

function SortableThumb({ item, onDelete, onItemEdit, isVideo }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	const thumbUrl = item.customThumbnailUrl || item.url || '';

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`wpcp-wizard-thumb ${isDragging ? 'is-dragging' : ''}`}
			{...attributes}
			{...listeners}
		>
			{thumbUrl ? (
				<img src={thumbUrl} alt="" />
			) : (
				<div className="wpcp-wizard-thumb-placeholder">{renderThumbPlaceholderIcon()}</div>
			)}

			{isVideo && (
				<div className="wpcp-wizard-thumb-play">
					<svg viewBox="0 0 24 24" width="28" height="28" fill="none">
						<circle cx="12" cy="12" r="12" fill="rgba(25, 148, 158, 0.85)" />
						<path d="M10 8l6 4-6 4V8z" fill="#fff" />
					</svg>
				</div>
			)}

			<div className="wpcp-wizard-thumb-overlay">
				<button
					type="button"
					className="wpcp-wizard-thumb-action"
					onClick={(e) => {
						e.stopPropagation();
						onItemEdit(item);
					}}
					aria-label={__('Edit item', 'wp-carousel-free')}
				>
					<svg
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 20h9" />
						<path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
					</svg>
				</button>
				<button
					type="button"
					className="wpcp-wizard-thumb-action wpcp-wizard-thumb-delete"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(item.id);
					}}
					aria-label={__('Delete item', 'wp-carousel-free')}
				>
					<svg
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="3 6 5 6 21 6" />
						<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
						<path d="M10 11v6" />
						<path d="M14 11v6" />
						<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
					</svg>
				</button>
			</div>
		</div>
	);
}

export function VideoSourceAddPopup({ blockName, onInsert, onClose }) {
	const [videoItems, setVideoItems] = useState(() => [createEmptyVideoItem(blockName)]);
	const [expandedId, setExpandedId] = useState(() => videoItems[0]?.id || null);
	const panelRef = useRef(null);
	const panelsRef = useRef(null);

	// Close only when the user clicks the backdrop element itself.
	// `e.target === e.currentTarget` is true only for direct hits on the
	// backdrop; any descendant click (including portal'd children like
	// WordPress <Popover>, which sit at document.body via React's portal
	// but still bubble synthetic events through the React tree) is ignored.
	const handleBackdropClick = useCallback(
		(e) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		},
		[onClose]
	);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	const handleDragEnd = useCallback(
		(event) => {
			const { active, over } = event;
			if (active && over && active.id !== over.id) {
				const oldIndex = videoItems.findIndex((i) => i.id === active.id);
				const newIndex = videoItems.findIndex((i) => i.id === over.id);
				setVideoItems(arrayMove(videoItems, oldIndex, newIndex));
			}
		},
		[videoItems]
	);

	const handleToggle = (id) => {
		setExpandedId(expandedId === id ? null : id);
	};

	const handleDelete = (id) => {
		const newItems = videoItems.filter((i) => i.id !== id);
		setVideoItems(newItems);
		if (expandedId === id && newItems.length > 0) {
			setExpandedId(newItems[newItems.length - 1].id);
		} else if (newItems.length === 0) {
			setExpandedId(null);
		}
	};

	const handleUpdate = (updatedItem) => {
		setVideoItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
	};

	const handleAddNew = () => {
		const newItem = createEmptyVideoItem(blockName);
		setVideoItems((prev) => [...prev, newItem]);
		setExpandedId(newItem.id);
		requestAnimationFrame(() => {
			setTimeout(() => {
				if (panelsRef.current) {
					panelsRef.current.scrollTo({ top: panelsRef.current.scrollHeight, behavior: 'smooth' });
				}
			}, 100);
		});
	};

	const handleInsert = () => {
		const validItems = videoItems.filter((videoItem) => isVideoItemInsertable(videoItem));
		if (validItems.length === 0) {
			return;
		}
		onInsert(validItems.map(prepareVideoItemForInsert));
		onClose();
	};

	const hasValidItems = videoItems.some((videoItem) => isVideoItemInsertable(videoItem));
	const hasBlockingInvalidUrl = videoItems.some((videoItem) => {
		const trimmed = String(videoItem.videoUrl || '').trim();
		return trimmed && !isVideoUrlFieldValid(videoItem.videoSource, videoItem.videoUrl);
	});
	const canInsert = hasValidItems && !hasBlockingInvalidUrl;

	return createPortal(
		<div className="wpcp-item-popup-backdrop" onMouseDown={handleBackdropClick}>
			<div className="wpcp-video-source-add-popup" ref={panelRef}>
				<div className="wpcp-wizard-header">
					<h2 className="wpcp-wizard-title">{__('Video', 'wp-carousel-free')}</h2>
				</div>

				<div className="wpcp-wizard-video-panels-wrap" ref={panelsRef}>
					<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
						<SortableContext items={videoItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
							{videoItems.map((item) => (
								<SortableVideoPanel
									key={item.id}
									blockName={blockName}
									item={item}
									isExpanded={expandedId === item.id}
									onToggle={() => handleToggle(item.id)}
									onDelete={() => handleDelete(item.id)}
									onUpdate={handleUpdate}
								/>
							))}
						</SortableContext>
					</DndContext>
				</div>

				<button type="button" className="wpcp-wizard-add-video-btn" onClick={handleAddNew}>
					<svg
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="16" />
						<line x1="8" y1="12" x2="16" y2="12" />
					</svg>
					{__('Add New Video', 'wp-carousel-free')}
				</button>

				<div className="wpcp-wizard-footer-actions">
					<Button isPrimary disabled={!canInsert} onClick={handleInsert}>
						{__('Insert Videos', 'wp-carousel-free')}
					</Button>
				</div>
			</div>
		</div>,
		document.body
	);
}

export default function GalleryEditPopup({ blockName, items, sourceType, onClose, onSave }) {
	const [localItems, setLocalItems] = useState(items);
	const [editingItemId, setEditingItemId] = useState(null);
	const [showVideoAdd, setShowVideoAdd] = useState(false);
	const panelRef = useRef(null);
	const isVideo = sourceType === 'video';

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	// Close only when the user clicks the backdrop element itself.
	// `e.target === e.currentTarget` is true only for direct hits on the
	// backdrop; any descendant click (including portal'd children like
	// WordPress <Popover>, which sit at document.body via React's portal
	// but still bubble synthetic events through the React tree) is ignored.
	// Save-on-backdrop-click behavior is preserved.
	// Field edits stream into `localItems` per keystroke, so filtering happens at
	// the commit points instead — sanitizing mid-typing would eat a half-typed tag.
	const commitItems = useCallback(() => {
		onSave(localItems.map(sanitizeItemTextFields));
	}, [localItems, onSave]);

	const handleBackdropClick = useCallback(
		(e) => {
			if (e.target === e.currentTarget) {
				commitItems();
				onClose();
			}
		},
		[onClose, commitItems]
	);

	const handleDragEnd = useCallback(
		(event) => {
			const { active, over } = event;
			if (active && over && active.id !== over.id) {
				const oldIndex = localItems.findIndex((i) => i.id === active.id);
				const newIndex = localItems.findIndex((i) => i.id === over.id);
				setLocalItems(arrayMove(localItems, oldIndex, newIndex));
			}
		},
		[localItems]
	);

	const handleDelete = (id) => {
		setLocalItems((prev) => prev.filter((i) => i.id !== id));
	};

	const handleItemSave = (updatedItem) => {
		setLocalItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
	};

	const handleReplaceItem = (oldId, newData) => {
		setLocalItems((prev) => prev.map((i) => (i.id === oldId ? { ...i, ...newData } : i)));
		setEditingItemId(newData.id);
	};

	const handleAddMedia = (selected) => {
		const incoming = Array.isArray(selected) ? selected : [selected];
		const existingMap = new Map(localItems.map((i) => [i.id, i]));
		const seen = new Set();
		const merged = incoming
			.filter((m) => {
				if (seen.has(m.id)) {
					return false;
				}
				seen.add(m.id);
				return true;
			})
			.map(
				(m) =>
					existingMap.get(m.id) || {
						id: m.id,
						url: m.url || '',
						sizes: extractMediaSizeUrls(m),
					}
			);
		setLocalItems(merged);
	};

	const handleVideoInsert = (newItems) => {
		setLocalItems((prev) => [...prev, ...newItems]);
		setShowVideoAdd(false);
	};

	const title = getGalleryPopupTitle(isVideo, sourceType);
	const subtitle = __(
		'Drag and drop images, upload, or choose from your library.',
		'wp-carousel-free'
	);

	return createPortal(
		<>
			<div className="wpcp-item-popup-backdrop" onMouseDown={handleBackdropClick}>
				<div className="wpcp-gallery-edit-popup" ref={panelRef}>
					<div className="wpcp-wizard-header">
						<h2 className="wpcp-wizard-title">{title}</h2>
						<p className="wpcp-wizard-subtitle">{subtitle}</p>
					</div>
					<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
						<SortableContext items={localItems.map((i) => i.id)} strategy={rectSortingStrategy}>
							<div className="wpcp-wizard-thumbs">
								{localItems.map((item) => (
									<SortableThumb
										key={item.id}
										item={item}
										onDelete={handleDelete}
										onItemEdit={(itm) => setEditingItemId(itm.id)}
										isVideo={isVideo}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>

					<div className="wpcp-wizard-edit-gallery">
						{renderGalleryEditControl({
							isVideo,
							localItems,
							handleAddMedia,
							setShowVideoAdd,
						})}
					</div>

					<div className="wpcp-gallery-edit-footer">
						<Button isLink className="wpcp-gallery-edit-reset" onClick={() => setLocalItems(items)}>
							{__('Reset Changes', 'wp-carousel-free')}
						</Button>
						<Button
							isLink
							className="wpcp-gallery-edit-update"
							onClick={() => {
								commitItems();
								onClose();
							}}
						>
							{__('Update & Close', 'wp-carousel-free')}
						</Button>
					</div>
				</div>
			</div>

			{showVideoAdd && (
				<VideoSourceAddPopup
					blockName={blockName}
					onInsert={handleVideoInsert}
					onClose={() => setShowVideoAdd(false)}
				/>
			)}

			{editingItemId !== null &&
				(() => {
					const idx = localItems.findIndex((i) => i.id === editingItemId);
					const itm = idx >= 0 ? localItems[idx] : null;
					if (!itm) {
						return null;
					}

					if (isVideo) {
						return (
							<VideoItemEditPopup
								item={itm}
								items={localItems}
								currentIndex={idx}
								onSave={handleItemSave}
								onBack={() => setEditingItemId(null)}
								onNavigate={(newIdx) => {
									const target = localItems[newIdx];
									if (target) {
										setEditingItemId(target.id);
									}
								}}
								onRemoveItem={(id) => {
									handleDelete(id);
									setEditingItemId(null);
								}}
							/>
						);
					}

					return (
						<ItemEditPopup
							item={itm}
							items={localItems}
							currentIndex={idx}
							onSave={handleItemSave}
							onBack={() => setEditingItemId(null)}
							onNavigate={(newIdx) => {
								const target = localItems[newIdx];
								if (target) {
									setEditingItemId(target.id);
								}
							}}
							onRemoveItem={(id) => {
								handleDelete(id);
								setEditingItemId(null);
							}}
							blockName={blockName}
							onReplaceItem={handleReplaceItem}
						/>
					);
				})()}
		</>,
		document.body
	);
}
