import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useRef, createPortal } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { extractMediaSizeUrls } from '../utils/media';
import { sanitizeItemPlainText, sanitizeItemTextFields } from '../utils/sanitizeItemText';
import { flipImageSupported } from '../constants/blockCapabilities';
import useDialogBehavior from '../hooks/useDialogBehavior';
import SpProNotice from '../../../components/pro/proNotice';
import SocialMediaSelectLocked from './SocialMediaSelectLocked';
import { openPricingPage } from '../../../components/pro/proLinks';
import './ItemEditPopup.scss';

const SCALE_OPTIONS = [
	{ value: 'cover', label: __('Cover', 'wp-carousel-free') },
	{ value: 'contain', label: __('Contain', 'wp-carousel-free') },
	{ value: 'fill', label: __('Fill', 'wp-carousel-free') },
];

const DEFAULT_FOCAL_POSITION = 50;

function normalizePositionAxis(value) {
	if (value === '') {
		return '';
	}

	const numericValue = Number.parseInt(value, 10);

	if (!Number.isFinite(numericValue)) {
		return DEFAULT_FOCAL_POSITION;
	}

	return Math.max(0, Math.min(100, numericValue));
}

function getPositionAxisForInput(value) {
	return value === '' ? '' : normalizePositionAxis(value);
}

function initLocalData(item) {
	return {
		position: item.position || { left: DEFAULT_FOCAL_POSITION, top: DEFAULT_FOCAL_POSITION },
		scale: item.scale || 'cover',
		title: item.title || '',
		alt: item.image_alt || item.alt || '',
		caption: item.caption || '',
		description: item.description || '',
	};
}

function coerceWpTextField(field) {
	// WP REST media fields can be:
	// - string
	// - { raw, rendered }
	// - undefined/null
	if (typeof field === 'string') {
		return field;
	}
	if (field && typeof field === 'object') {
		return field.raw || field.rendered || '';
	}
	return '';
}

// Media-library values seed empty fields as plain text: an attachment
// description carries block markup this field's allow-list would drop anyway,
// and the DOM-based helper resolves entities the old regex left behind.
function stripTags(html) {
	return sanitizeItemPlainText(String(html ?? ''));
}

export default function ItemEditPopup({
	item,
	items,
	currentIndex,
	blockName = '',
	onSave,
	onBack,
	onNavigate,
	onRemoveItem,
	onReplaceItem,
}) {
	const [localData, setLocalData] = useState(() => initLocalData(item));
	const [isDraggingFocal, setIsDraggingFocal] = useState(false);
	const focalRef = useRef(null);
	const leftInputId = `wpcp-item-left-${item.id}`;
	const topInputId = `wpcp-item-top-${item.id}`;
	const titleInputId = `wpcp-item-title-${item.id}`;
	const altInputId = `wpcp-item-alt-${item.id}`;
	const captionInputId = `wpcp-item-caption-${item.id}`;
	const descriptionInputId = `wpcp-item-description-${item.id}`;
	const customUrlInputId = `wpcp-item-custom-url-${item.id}`;

	// Track which item.id we last processed to avoid re-running on same item
	const lastProcessedItemId = useRef(null);

	const media = useSelect(
		(select) => (item.id ? select('core').getEntityRecord('postType', 'attachment', item.id) : null),
		[item.id]
	);

	// Single effect that handles both item change AND media loading
	// This avoids the race condition between two separate effects
	useEffect(() => {
		const isNewItem = lastProcessedItemId.current !== item.id;

		if (isNewItem) {
			// Item changed - reset to item's saved values first
			lastProcessedItemId.current = item.id;

			// Start with item's saved data (may be empty for new items)
			const baseData = initLocalData(item);

			// If media is already loaded, merge media values for empty fields
			if (media) {
				const mediaTitle = stripTags(coerceWpTextField(media.title));
				const mediaCaption = stripTags(coerceWpTextField(media.caption));
				const mediaDescription = stripTags(coerceWpTextField(media.description));
				const mediaAlt = media.alt_text || '';

				setLocalData({
					...baseData,
					title: baseData.title || mediaTitle,
					alt: baseData.alt || mediaAlt || mediaTitle,
					caption: baseData.caption || mediaCaption,
					description: baseData.description || mediaDescription,
				});
			} else {
				// Media not loaded yet - just use base data, will fill when media loads
				setLocalData(baseData);
			}
		} else if (media) {
			// Same item but media just loaded - fill empty fields only
			const mediaTitle = stripTags(coerceWpTextField(media.title));
			const mediaCaption = stripTags(coerceWpTextField(media.caption));
			const mediaDescription = stripTags(coerceWpTextField(media.description));
			const mediaAlt = media.alt_text || '';

			setLocalData((prev) => ({
				...prev,
				title: prev.title || mediaTitle,
				alt: prev.alt || mediaAlt || mediaTitle,
				caption: prev.caption || mediaCaption,
				description: prev.description || mediaDescription,
			}));
		}
	}, [item.id, item, media]);

	const updateFocalPosition = useCallback((e) => {
		if (!focalRef.current) {
			return;
		}
		const rect = focalRef.current.getBoundingClientRect();
		const left = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
		const top = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
		setLocalData((prev) => ({
			...prev,
			position: { left: Math.round(left), top: Math.round(top) },
		}));
	}, []);

	const handleFocalMouseDown = useCallback(
		(e) => {
			e.preventDefault();
			setIsDraggingFocal(true);
			updateFocalPosition(e);
		},
		[updateFocalPosition]
	);

	useEffect(() => {
		if (!isDraggingFocal) {
			return;
		}
		const handleMove = (e) => updateFocalPosition(e);
		const handleUp = () => setIsDraggingFocal(false);
		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', handleUp);
		return () => {
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleUp);
		};
	}, [isDraggingFocal, updateFocalPosition]);

	const updateField = (field, value) => {
		setLocalData((prev) => ({ ...prev, [field]: value }));
	};

	const commitPositionAxis = useCallback((axis) => {
		setLocalData((prev) => ({
			...prev,
			position: {
				...prev.position,
				[axis]: normalizePositionAxis(prev.position?.[axis]),
			},
		}));
	}, []);

	const saveCurrentItem = useCallback(() => {
		// Text fields are filtered on the way into the attribute so the saved value
		// matches what the PHP renderer will emit. The renderer filters again —
		// post content is editable outside this popup — but this keeps the two in
		// step and shows the author what survives.
		onSave(
			sanitizeItemTextFields({
				...item,
				position: {
					left: normalizePositionAxis(localData.position?.left),
					top: normalizePositionAxis(localData.position?.top),
				},
				scale: localData.scale,
				title: localData.title,
				image_alt: localData.alt,
				alt: localData.alt,
				caption: localData.caption,
				description: localData.description,
			})
		);
	}, [item, localData, onSave]);

	const handleSave = () => {
		saveCurrentItem();
		onBack();
	};

	const handleNavigate = useCallback(
		(newIndex) => {
			saveCurrentItem();
			onNavigate(newIndex);
		},
		[saveCurrentItem, onNavigate]
	);

	const flipSupported = flipImageSupported(blockName);
	const totalItems = items.length;
	const canGoPrev = currentIndex > 0;
	const canGoNext = currentIndex < totalItems - 1;
	const panelRef = useRef(null);

	// Escape-to-close + focus restore + Tab cycling, shared with the other
	// portal dialogs (see useDialogBehavior). Markup is untouched.
	const { dialogId } = useDialogBehavior({ isOpen: true, onClose: onBack, panelRef });

	// Close only when the user clicks the backdrop element itself.
	// `e.target === e.currentTarget` is true only for direct hits on the
	// backdrop; any descendant click (including portal'd children like
	// WordPress <Popover>, which sit at document.body via React's portal
	// but still bubble synthetic events through the React tree) is ignored.
	const handleBackdropClick = useCallback(
		(e) => {
			if (panelRef.current && !panelRef.current.contains(e.target)) {
				onBack();
			}
		},
		[onBack]
	);

	return createPortal(
		<div className="wpcp-item-popup-backdrop" onMouseDown={handleBackdropClick}>
			<div
				className="wpcp-item-popup"
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-label={__('Edit item', 'wp-carousel-free')}
				id={dialogId}
			>
				{/* Body – two columns */}
				<div className="wpcp-item-popup-body">
					{/* Left column */}
					<div className="wpcp-item-popup-left">
						{/* Tabs */}
						<div className="wpcp-item-popup-tabs">
							<button type="button" className="wpcp-item-popup-tab is-active" tabIndex={-1}>
								{__('Default Image', 'wp-carousel-free')}
							</button>
							{flipSupported && (
								<div className="wpcp-item-popup-tab is-pro-locked">
									<span>{__('Flipping Image', 'wp-carousel-free')}</span>
									<button type="button" className="wpcp-item-popup-tab-pro-tag" onClick={openPricingPage}>
										{__('(Pro)', 'wp-carousel-free')}
									</button>
								</div>
							)}
						</div>

						{/* Focal point image with grid */}
						<div className="wpcp-item-popup-focal" ref={focalRef} onMouseDown={handleFocalMouseDown}>
							<img
								src={item.url}
								alt=""
								style={{
									objectFit: localData.scale,
									objectPosition: `${localData.position.left}% ${localData.position.top}%`,
								}}
							/>
							<div className="wpcp-item-popup-focal-grid" />
							<div
								className="wpcp-item-popup-focal-point"
								style={{
									left: `${localData.position.left}%`,
									top: `${localData.position.top}%`,
								}}
							/>
						</div>

						{/* Position inputs */}
						<div className="wpcp-item-popup-position">
							<div className="wpcp-item-popup-pos-field">
								<label htmlFor={leftInputId}>{__('Left', 'wp-carousel-free')}</label>
								<div className="wpcp-item-popup-pos-input">
									<input
										id={leftInputId}
										type="number"
										min="0"
										max="100"
										value={getPositionAxisForInput(localData.position.left)}
										onChange={(e) =>
											updateField('position', {
												...localData.position,
												left: e.target.value === '' ? '' : normalizePositionAxis(e.target.value),
											})
										}
										onBlur={() => commitPositionAxis('left')}
									/>
									<span className="wpcp-item-popup-pos-unit">%</span>
								</div>
							</div>
							<div className="wpcp-item-popup-pos-field">
								<label htmlFor={topInputId}>{__('Top', 'wp-carousel-free')}</label>
								<div className="wpcp-item-popup-pos-input">
									<input
										id={topInputId}
										type="number"
										min="0"
										max="100"
										value={getPositionAxisForInput(localData.position.top)}
										onChange={(e) =>
											updateField('position', {
												...localData.position,
												top: e.target.value === '' ? '' : normalizePositionAxis(e.target.value),
											})
										}
										onBlur={() => commitPositionAxis('top')}
									/>
									<span className="wpcp-item-popup-pos-unit">%</span>
								</div>
							</div>
						</div>

						{/* Scale toggle */}
						<div className="wpcp-item-popup-scale">
							<span>{__('Image Scale', 'wp-carousel-free')}</span>
							<div className="wpcp-item-popup-scale-btns">
								{SCALE_OPTIONS.map((opt) => (
									<button
										key={opt.value}
										type="button"
										className={`wpcp-item-popup-scale-btn ${
											localData.scale === opt.value ? 'is-active' : ''
										}`}
										onClick={() => updateField('scale', opt.value)}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Right column */}
					<div className="wpcp-item-popup-right">
						<div className="wpcp-item-popup-field">
							<label htmlFor={titleInputId}>{__('Title', 'wp-carousel-free')}</label>
							<input
								id={titleInputId}
								type="text"
								value={localData.title}
								placeholder={__('Image Title', 'wp-carousel-free')}
								onChange={(e) => updateField('title', e.target.value)}
							/>
						</div>
						<div className="wpcp-item-popup-field">
							<label htmlFor={altInputId}>{__('Alt Text', 'wp-carousel-free')}</label>
							<input
								id={altInputId}
								type="text"
								value={localData.alt}
								placeholder={__('Image', 'wp-carousel-free')}
								onChange={(e) => updateField('alt', e.target.value)}
							/>
						</div>
						<div className="wpcp-item-popup-field">
							<label htmlFor={captionInputId}>{__('Caption', 'wp-carousel-free')}</label>
							<input
								id={captionInputId}
								type="text"
								value={localData.caption}
								placeholder={__('Write a caption', 'wp-carousel-free')}
								onChange={(e) => updateField('caption', e.target.value)}
							/>
						</div>
						<div className="wpcp-item-popup-field">
							<label htmlFor={descriptionInputId}>{__('Description', 'wp-carousel-free')}</label>
							<textarea
								id={descriptionInputId}
								value={localData.description}
								placeholder={__('A little description for demonstration purposes', 'wp-carousel-free')}
								onChange={(e) => updateField('description', e.target.value)}
								rows={3}
							/>
						</div>
						<div className="wpcp-item-popup-field wpcp-pro-locked-row">
							<label htmlFor={customUrlInputId}>
								{__('Custom URL', 'wp-carousel-free')}{' '}
								<span className="wpcp-pro-inline-tag">{__('(Pro)', 'wp-carousel-free')}</span>
							</label>
							<input id={customUrlInputId} type="url" value="" disabled readOnly />
						</div>
						<div className="wpcp-item-popup-field wpcp-pro-locked-row">
							<span>
								{__('Allow Social Media for Sharing', 'wp-carousel-free')}{' '}
								<span className="wpcp-pro-inline-tag">{__('(Pro)', 'wp-carousel-free')}</span>
							</span>
							<SocialMediaSelectLocked />
						</div>
						<SpProNotice
							className="is-upsell"
							message={__(
								'Customize each image individually with image flipping and sharing options.',
								'wp-carousel-free'
							)}
							linkText={__('Upgrade to Pro!', 'wp-carousel-free')}
						/>
					</div>
				</div>

				{/* Bottom actions */}
				<div className="wpcp-item-popup-actions">
					<div className="wpcp-item-popup-actions-left">
						<MediaUploadCheck>
							<MediaUpload
								onSelect={(selected) => {
									const m = Array.isArray(selected) ? selected[0] : selected;
									onReplaceItem(item.id, {
										id: m.id,
										url: m.url,
										sizes: extractMediaSizeUrls(m),
									});
								}}
								allowedTypes={['image']}
								render={({ open }) => (
									<Button isLink onClick={open} className="wpcp-item-popup-replace">
										{__('Replace Image', 'wp-carousel-free')}
									</Button>
								)}
							/>
						</MediaUploadCheck>
						<Button isLink className="wpcp-item-popup-remove" onClick={() => onRemoveItem(item.id)}>
							{' '}
							{__('Remove Image', 'wp-carousel-free')}
						</Button>
					</div>
					<Button isPrimary className="wpcp-item-popup-save" onClick={handleSave}>
						{__('Save Changes', 'wp-carousel-free')}
					</Button>
				</div>

				{/* Item navigation */}
				<div className="wpcp-item-popup-nav">
					<Button
						isLink
						className="wpcp-item-popup-nav-btn"
						disabled={!canGoPrev}
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
					<span className="wpcp-item-popup-nav-counter">
						{currentIndex + 1}/{totalItems}
					</span>
					<Button
						isLink
						className="wpcp-item-popup-nav-btn"
						disabled={!canGoNext}
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
