/**
 * Block toolbar controls per content source: edit/add items for the image
 * source and popup-based add for video. Renders nothing until the source has
 * items (the wizard handles the empty state).
 */

import { __ } from '@wordpress/i18n';
import { BlockControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { extractMediaSizeUrls } from '../utils/media';

/**
 * Merges selected media with existing items while preserving current item metadata.
 *
 * @param {Array}    selectedMediaItems  - Media items returned from MediaUpload
 * @param {Array}    existingItems       - Current block items
 * @param {Function} createItemFromMedia - Fallback item builder for new media entries
 * @return {Array} Merged, de-duplicated items
 */
function mergeSelectedMediaItems(selectedMediaItems, existingItems, createItemFromMedia) {
	const incomingMediaItems = Array.isArray(selectedMediaItems)
		? selectedMediaItems
		: [selectedMediaItems];
	const existingItemsById = new Map(
		existingItems.map((existingItem) => [existingItem.id, existingItem])
	);
	const seenMediaIds = new Set();

	return incomingMediaItems
		.filter((mediaItem) => {
			if (seenMediaIds.has(mediaItem.id)) {
				return false;
			}
			seenMediaIds.add(mediaItem.id);
			return true;
		})
		.map((mediaItem) => existingItemsById.get(mediaItem.id) || createItemFromMedia(mediaItem));
}

function createImageItem(mediaItem) {
	return {
		id: mediaItem.id,
		url: mediaItem.url || '',
		sizes: extractMediaSizeUrls(mediaItem),
	};
}

/**
 * @param {Object}   props
 * @param {string}   props.sourceType
 * @param {object[]} props.items
 * @param {boolean}  [props.patternDemo] Block holds demo images from a pattern; Edit Gallery opens the media library to replace them.
 * @param {Function} props.setAttributes
 * @param {Function} props.onEditItems   Open the gallery/items edit popup.
 * @param {Function} props.onAddVideo    Open the video add popup.
 */
export default function SourceToolbar({
	sourceType,
	items,
	patternDemo,
	setAttributes,
	onEditItems,
	onAddVideo,
}) {
	const mergeAndCommit = (selected, createItemFromMedia) => {
		setAttributes({
			items: mergeSelectedMediaItems(selected, items, createItemFromMedia),
			patternDemo: false,
		});
	};

	// Replace the whole set with the user's picks (used to swap out demo images).
	const replaceWithSelection = (selected, createItemFromMedia) => {
		const incoming = Array.isArray(selected) ? selected : [selected];
		setAttributes({ items: incoming.map(createItemFromMedia), patternDemo: false });
	};

	if (sourceType === 'image' && items.length > 0) {
		return (
			<BlockControls>
				<ToolbarGroup>
					{patternDemo ? (
						<MediaUploadCheck>
							<MediaUpload
								onSelect={(selected) => replaceWithSelection(selected, createImageItem)}
								allowedTypes={['image']}
								multiple="add"
								value={[]}
								render={({ open }) => (
									<ToolbarButton
										className="wpcp-source-toolbar__edit-gallery"
										icon="edit"
										label={__('Edit Gallery', 'wp-carousel-free')}
										onClick={open}
									>
										{__('Edit Gallery', 'wp-carousel-free')}
									</ToolbarButton>
								)}
							/>
						</MediaUploadCheck>
					) : (
						<ToolbarButton
							className="wpcp-source-toolbar__edit-gallery"
							icon="edit"
							label={__('Edit Gallery', 'wp-carousel-free')}
							onClick={onEditItems}
						>
							{__('Edit Gallery', 'wp-carousel-free')}
						</ToolbarButton>
					)}
					<MediaUploadCheck>
						<MediaUpload
							onSelect={(selected) => mergeAndCommit(selected, createImageItem)}
							allowedTypes={['image']}
							multiple="add"
							value={items.map((i) => i.id)}
							render={({ open }) => (
								<ToolbarButton icon="plus-alt2" label={__('Add Images', 'wp-carousel-free')} onClick={open}>
									{__('Add Images', 'wp-carousel-free')}
								</ToolbarButton>
							)}
						/>
					</MediaUploadCheck>
				</ToolbarGroup>
			</BlockControls>
		);
	}

	if (sourceType === 'video' && items.length > 0) {
		return (
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						className="wpcp-source-toolbar__edit-gallery"
						icon="edit"
						label={__('Edit Videos', 'wp-carousel-free')}
						onClick={onEditItems}
					>
						{__('Edit Videos', 'wp-carousel-free')}
					</ToolbarButton>
					<ToolbarButton
						icon="plus-alt2"
						label={__('Add Videos', 'wp-carousel-free')}
						onClick={onAddVideo}
					>
						{__('Add Videos', 'wp-carousel-free')}
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
		);
	}

	return null;
}
