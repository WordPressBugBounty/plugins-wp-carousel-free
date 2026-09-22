/**
 * useCarouselPosts – fetches posts/products from the WordPress REST API
 * based on the block's queryOptions attribute.
 *
 * Returns { posts, isLoading, error }.
 * Each post item is already normalised to the same shape as an ImageSource item
 * so the CarouselRender component can treat all sources identically.
 */

import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export default function useCarouselPosts(attributes) {
	const { sourceType, queryOptions = {} } = attributes;

	const isPostSource = sourceType === 'post' || sourceType === 'product';

	const [posts, setPosts] = useState([]);
	// Start in the loading state for post/product so the first render shows the
	// reserved-height loading placeholder instead of briefly flashing the empty
	// "No posts found" notice before the fetch effect runs — that flash, the
	// spinner, and the resolved carousel are three different heights and the
	// canvas jumps between them on load.
	const [isLoading, setLoading] = useState(isPostSource);
	const [error, setError] = useState(null);

	// Forward `blockName` so PostSource / ProductSource mirror the frontend
	// fetch semantics — most notably the Tiles AJAX-pagination branch which
	// returns the full result set when `blockName === 'tiles' && pagination`.
	// Without this, the editor preview undercounts items vs frontend (and the
	// Category Filter strip ends up with fewer terms / smaller counts).
	const blockName = attributes.blockName ?? '';

	// Refetch only when something that changes the *fetched result* changes.
	// Layout/style tweaks (columns, gap, navigation, effect, …) live in
	// `layoutOptions`/`imageOptions` but do not affect which posts come back, so
	// keying the fetch on the whole objects blanked the preview to a loading
	// spinner — remounting the carousel — on every slider drag. Only these
	// fields reach the query: image size (`resolution`), random order, and the
	// Tiles AJAX-pagination flag (full result set). See PostSource / ProductSource.
	const queryKey = JSON.stringify({
		sourceType,
		queryOptions,
		blockName,
		resolution: attributes.imageOptions?.resolution ?? 'large',
		randomOrder: attributes.layoutOptions?.randomOrder ?? false,
		tilesPagination: attributes.layoutOptions?.pagination ?? false,
	});

	useEffect(() => {
		if (!isPostSource) {
			setPosts([]);
			setLoading(false);
			return undefined;
		}

		// Guard against out-of-order responses: rapid Query Builder edits fire
		// overlapping requests, and if an older one resolves last it would
		// otherwise overwrite the preview with stale results. The cleanup runs
		// before the next effect (and on unmount), flipping this flag so a
		// superseded request's `.then`/`.catch` never touches state.
		let stale = false;

		setLoading(true);
		setError(null);
		apiFetch({
			path: '/wpcp/v2/preview-source-items',
			method: 'POST',
			data: {
				attributes: {
					sourceType,
					queryOptions,
					blockName,
					imageOptions: attributes.imageOptions ?? {},
					layoutOptions: attributes.layoutOptions ?? {},
				},
			},
		})
			.then((results) => {
				if (stale) {
					return;
				}
				if (!Array.isArray(results)) {
					throw new Error('Invalid response from server.');
				}
				setPosts(results);
				setLoading(false);
			})
			.catch((err) => {
				if (stale) {
					return;
				}
				const msg = err?.message || err?.code || 'Failed to load posts.';
				setError(msg);
				setLoading(false);
			});

		return () => {
			stale = true;
		};
		/* queryKey aggregates every fetch-affecting field; the POST body reads
		   the latest full attributes at fetch time. */
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryKey, isPostSource]);

	return { posts, isLoading, error };
}
