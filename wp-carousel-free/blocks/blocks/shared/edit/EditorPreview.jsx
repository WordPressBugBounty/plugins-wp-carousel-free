/**
 * Resolves the item list for the active source and renders the live Swiper
 * preview (`CarouselRender`).
 *
 * For image/video/audio → items come from the `items` attribute
 * (mapped by `previewItems.js`). For the Pro editor-preview blocks → the
 * curated set in `previewDemoItems.js`. For post/product → fetched via REST
 * Tiles + AJAX pagination renders only the first page, mirroring
 * `BlockRenderer::compute_tiles_pagination_state`.
 */

import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import CarouselRender from './CarouselRender';
import useCarouselPosts from '../hooks/useCarouselPosts';
import applyLayoutRandomOrder from '../utils/applyLayoutRandomOrder';
import {
	HANDLED_SOURCE_TYPES,
	buildImagePreviewItems,
	buildVideoPreviewItems,
	buildAudioPreviewItems,
	buildFallbackPreviewItems,
} from './previewItems';
import getPreviewDemoItems from './previewDemoItems';
import { isEditorPreviewBlock } from '../constants/editorPreviewBlocks';

// Stable empty result for the mediaById selector — returning a fresh `{}`
// from useSelect would fail its reference equality check on every store
// change and re-render the preview for unrelated sources.
const EMPTY_OBJECT = Object.freeze({});

function EmptyPreviewNotice({ message }) {
	return (
		<div className="wpcp-editor-empty">
			<p>{message}</p>
		</div>
	);
}

/**
 * @param {Object}   props
 * @param {Object}   props.attributes                Block attributes.
 * @param {Function} props.setAttributes             Block attribute updater.
 * @param {string}   props.name                      Block type name (e.g. `wp-carousel-pro/tiles`); gates Tiles-specific pagination slicing.
 * @param {Function} props.onItemEdit                Callback when editing an item.
 * @param {Function} [props.onEditorPaginationClick] Click preview pagination to select the pagination block.
 * @return {JSX.Element} Editor preview component.
 */
export default function EditorPreview({
	attributes,
	setAttributes,
	name,
	onItemEdit,
	onEditorPaginationClick,
}) {
	const { sourceType, items = [] } = attributes;
	const isTilesBlock = name === 'wp-carousel-pro/tiles';
	const isThumbnailsSlider = attributes?.blockName === 'thumbnails-slider';

	// Post/product source: fetch via REST API.
	const { posts, isLoading, error } = useCarouselPosts(attributes);

	// Image preview needs per-attachment title/description/alt to match backend `ImageSource.php`.
	// We fetch it from the WP data store by attachment id.
	const attachmentIds = useMemo(() => {
		const idForItem = (item) => {
			if (sourceType === 'video') {
				return null;
			}
			if (sourceType === 'audio') {
				return item?.customThumbnail ?? null;
			}
			return item?.id ?? null;
		};
		// Attachment id 0 is never a real record, and an item transformed from a
		// core Image outside the media library carries a `wpcp-core-image-*` id
		// that would be fetched as a media record and 404 once per item, on every
		// editor load. A legacy numeric string still resolves: the map is keyed by
		// the coerced id, and an object key is a string either way.
		return items
			.map((item) => Number(idForItem(item)))
			.filter((id) => Number.isInteger(id) && id > 0);
		// Only re-run when the image ids change.
	}, [sourceType, items]);

	// One stable per-id selector per attachment: building a fresh `map` in a
	// single selector invalidated every downstream useMemo on each store
	// notification even when the records were identical.
	const mediaById = useSelect(
		(select) => {
			if (sourceType !== 'image' && sourceType !== 'audio' && sourceType !== 'video') {
				return EMPTY_OBJECT;
			}
			const core = select('core');
			const map = {};
			for (const id of attachmentIds) {
				const media = core.getEntityRecord('postType', 'attachment', id);
				if (media) {
					map[id] = media;
				}
			}
			return map;
		},
		[sourceType, attachmentIds]
	);

	const randomOrder = !!attributes.layoutOptions?.randomOrder;

	const postsForRender = useMemo(
		() => applyLayoutRandomOrder(posts, randomOrder),
		[posts, randomOrder]
	);

	// Editor preview parity with PHP first-page slice for query-driven sources.
	// Tiles + post/product + AJAX pagination on → render only the first
	// `queryOptions.limit` items so the canvas matches the frontend's initial
	// render. Mirrors the post/product branch in
	// `BlockRenderer::compute_tiles_pagination_state` (`queryOptions.limit` as
	// per-page; non-positive or >= total means "show everything as one page").
	const tilesQueryPaginationEnabled =
		isTilesBlock &&
		(sourceType === 'post' || sourceType === 'product') &&
		attributes.layoutOptions?.pagination === true;
	const queryLimitPerPage = Number.isFinite(Number(attributes.queryOptions?.limit))
		? Math.max(1, Math.floor(Number(attributes.queryOptions.limit)))
		: 10;
	const slicedPostsForRender = useMemo(() => {
		if (!Array.isArray(postsForRender) || !tilesQueryPaginationEnabled) {
			return postsForRender;
		}
		if (queryLimitPerPage >= postsForRender.length) {
			return postsForRender;
		}
		return postsForRender.slice(0, queryLimitPerPage);
	}, [postsForRender, tilesQueryPaginationEnabled, queryLimitPerPage]);

	const imageResolution =
		sourceType === 'audio'
			? attributes.audioOptions?.imageOptions?.resolution ?? 'large'
			: attributes.imageOptions?.resolution ?? 'large';
	const thumbnailResolution = attributes.thumbnail?.imageSize ?? 'thumbnail';

	// Marquee and Panorama have no Source step, so their canvas renders the
	// curated showcase set instead of the user's media. Keyed on the block type
	// name, never the saved `blockName`, so a crafted attribute cannot reach
	// this path.
	const demoPreviewItems = useMemo(
		() => (isEditorPreviewBlock(name) ? getPreviewDemoItems() : null),
		[name]
	);

	const imagePreviewItems = useMemo(() => {
		if (sourceType !== 'image' || !items.length) {
			return null;
		}
		return buildImagePreviewItems({
			items,
			mediaById,
			imageResolution,
			thumbnailResolution,
			isThumbnailsSlider,
		});
	}, [sourceType, items, mediaById, imageResolution, thumbnailResolution, isThumbnailsSlider]);

	const imageItemsForRender = useMemo(
		() => (imagePreviewItems ? applyLayoutRandomOrder(imagePreviewItems, randomOrder) : null),
		[imagePreviewItems, randomOrder]
	);

	// Editor preview parity with PHP first-page slice — when tiles + image +
	// AJAX pagination is active, render only the first `paginationOptions
	// .imageItemsPerPage` items in the canvas. Mirrors the slicing rules in
	// `BlockRenderer::compute_tiles_pagination_state` (no slice when per-page
	// is non-positive or covers the whole list).
	const tilesImagePaginationEnabled =
		isTilesBlock && sourceType === 'image' && attributes.layoutOptions?.pagination === true;
	const imageItemsPerPage = Number.isFinite(Number(attributes.paginationOptions?.imageItemsPerPage))
		? Math.max(1, Math.floor(Number(attributes.paginationOptions.imageItemsPerPage)))
		: 10;
	const slicedImageItemsForRender = useMemo(() => {
		if (!imageItemsForRender) {
			return imageItemsForRender;
		}
		if (!tilesImagePaginationEnabled) {
			return imageItemsForRender;
		}
		if (imageItemsPerPage >= imageItemsForRender.length) {
			return imageItemsForRender;
		}
		return imageItemsForRender.slice(0, imageItemsPerPage);
	}, [imageItemsForRender, tilesImagePaginationEnabled, imageItemsPerPage]);

	const videoItemsForRender = useMemo(() => {
		if (sourceType !== 'video' || !items.length) {
			return null;
		}
		return applyLayoutRandomOrder(buildVideoPreviewItems({ items }), randomOrder);
	}, [sourceType, items, randomOrder]);

	const tilesVideoPaginationEnabled =
		isTilesBlock && sourceType === 'video' && attributes.layoutOptions?.pagination === true;
	const slicedVideoItemsForRender = useMemo(() => {
		if (!videoItemsForRender) {
			return videoItemsForRender;
		}
		if (!tilesVideoPaginationEnabled) {
			return videoItemsForRender;
		}
		if (imageItemsPerPage >= videoItemsForRender.length) {
			return videoItemsForRender;
		}
		return videoItemsForRender.slice(0, imageItemsPerPage);
	}, [videoItemsForRender, tilesVideoPaginationEnabled, imageItemsPerPage]);

	const audioItemsForRender = useMemo(() => {
		if (sourceType !== 'audio' || !items.length) {
			return null;
		}
		return applyLayoutRandomOrder(
			buildAudioPreviewItems({ items, mediaById, imageResolution }),
			randomOrder
		);
	}, [sourceType, items, mediaById, imageResolution, randomOrder]);

	const fallbackPreviewItems = useMemo(() => {
		if (HANDLED_SOURCE_TYPES.has(sourceType) || !items.length) {
			return null;
		}
		return applyLayoutRandomOrder(buildFallbackPreviewItems(items), randomOrder);
	}, [sourceType, items, randomOrder]);

	// `reorderedDerivedItems` is the new order of items currently in the
	// canvas. Map back to source items by id; the result preserves original
	// fields. When AJAX pagination is active for image tiles, only the first
	// page is rendered, so a drag-reorder gives back a partial list — we
	// prepend it back onto the rest of the gallery instead of failing the
	// full-length check (which would silently drop the reorder).
	const handleImageItemsReorder = (reorderedDerivedItems) => {
		if (!Array.isArray(reorderedDerivedItems) || !Array.isArray(items)) {
			return;
		}
		const idToOriginal = new Map(items.map((item) => [item.id, item]));
		if (tilesImagePaginationEnabled && reorderedDerivedItems.length < items.length) {
			const reorderedIds = new Set(reorderedDerivedItems.map((d) => d.id));
			const firstPage = reorderedDerivedItems.map((d) => idToOriginal.get(d.id)).filter(Boolean);
			const rest = items.filter((it) => !reorderedIds.has(it.id));
			setAttributes({ items: [...firstPage, ...rest] });
			return;
		}
		const newItems = reorderedDerivedItems.map((d) => idToOriginal.get(d.id)).filter(Boolean);
		if (newItems.length === items.length) {
			setAttributes({ items: newItems });
		}
	};

	if (sourceType === 'post' || sourceType === 'product') {
		// Only blank to the spinner/error on the initial load. Once posts exist,
		// keep rendering them through a background refetch so a legit query change
		// (e.g. post count) doesn't unmount + remount the whole carousel.
		if (isLoading && !posts.length) {
			return (
				<div className="wpcp-editor-loading">
					<Spinner />
					<span>{__('Loading posts…', 'wp-carousel-free')}</span>
				</div>
			);
		}
		if (error && !posts.length) {
			return (
				<div className="wpcp-editor-error">
					{__('Could not load posts:', 'wp-carousel-free')}
					{error}
				</div>
			);
		}
		if (!posts.length) {
			return (
				<EmptyPreviewNotice
					message={__('No posts found. Adjust the Query Builder settings.', 'wp-carousel-free')}
				/>
			);
		}
		return (
			<CarouselRender
				items={slicedPostsForRender}
				attributes={attributes}
				isEditor={true}
				onUpdateLayoutOptions={(layoutOptions) => setAttributes({ layoutOptions })}
				onEditorPaginationClick={onEditorPaginationClick}
			/>
		);
	}

	if (sourceType === 'image') {
		if (!items.length && !demoPreviewItems) {
			return (
				<EmptyPreviewNotice
					message={__('No images selected. Use "Edit Gallery" in the toolbar.', 'wp-carousel-free')}
				/>
			);
		}

		return (
			<CarouselRender
				items={demoPreviewItems ?? slicedImageItemsForRender ?? []}
				attributes={attributes}
				isEditor={true}
				onUpdateLayoutOptions={(layoutOptions) => setAttributes({ layoutOptions })}
				// Demo items are not the block's own, so they stay read-only:
				// reordering would persist them into `items`, and the per-item popup
				// would open against ids `items` does not hold.
				onUpdateItems={demoPreviewItems ? undefined : handleImageItemsReorder}
				onItemEdit={demoPreviewItems ? undefined : onItemEdit}
				onEditorPaginationClick={onEditorPaginationClick}
			/>
		);
	}

	if (sourceType === 'video') {
		if (!items.length) {
			return (
				<EmptyPreviewNotice
					message={__('No videos added. Use "Edit Videos" in the toolbar.', 'wp-carousel-free')}
				/>
			);
		}

		return (
			<CarouselRender
				items={slicedVideoItemsForRender ?? []}
				attributes={attributes}
				isEditor={true}
				onUpdateLayoutOptions={(layoutOptions) => setAttributes({ layoutOptions })}
				onItemEdit={onItemEdit}
				onEditorPaginationClick={onEditorPaginationClick}
			/>
		);
	}

	if (sourceType === 'audio') {
		if (!items.length) {
			return (
				<EmptyPreviewNotice
					message={__('No audio added. Use "Edit Audios" in the toolbar.', 'wp-carousel-free')}
				/>
			);
		}

		return (
			<CarouselRender
				items={audioItemsForRender ?? []}
				attributes={attributes}
				isEditor={true}
				onUpdateLayoutOptions={(layoutOptions) => setAttributes({ layoutOptions })}
				onItemEdit={onItemEdit}
				onEditorPaginationClick={onEditorPaginationClick}
			/>
		);
	}

	// Fallback for other sources.
	if (!items.length || !fallbackPreviewItems) {
		return <EmptyPreviewNotice message={__('No items found.', 'wp-carousel-free')} />;
	}

	return (
		<CarouselRender
			items={fallbackPreviewItems}
			attributes={attributes}
			isEditor={true}
			onUpdateLayoutOptions={(layoutOptions) => setAttributes({ layoutOptions })}
			onItemEdit={onItemEdit}
			onEditorPaginationClick={onEditorPaginationClick}
		/>
	);
}
