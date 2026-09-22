/**
 * Inline editor preview for the Tiles AJAX pagination region.
 *
 * Renders the same wrapper classes / per-button BEM classes that PHP
 * (`BlockRenderer::renderTiles`) emits. For post / product sources the total
 * page count is unknown at edit time (the query runs server-side), so we fall
 * back to a synthetic `mockPageCount` so authors see styling without an items
 * fetch. For the `image` source the total page count IS known — it is
 * `ceil(attributes.items.length / paginationOptions.imageItemsPerPage)` — so
 * the preview shows the real chrome that will appear on the frontend, mirroring
 * `BlockRenderer::compute_tiles_pagination_state`'s image branch.
 */

import { useState, memo } from '@wordpress/element';
import { buildPaginationButtons } from '../utils/paginationShorten';

const DEFAULT_MOCK_PAGES = 5;

function NumberPreview({ paginationOptions, mockPageCount }) {
	const currentPage = 1;
	const tokens = buildPaginationButtons(
		mockPageCount,
		currentPage,
		paginationOptions.showEllipsis !== false
	);

	return tokens.map((token, index) => {
		if (token.type === 'ellipsis') {
			return (
				<span
					key={`ellipsis-${index}`}
					className="wpcp-ajax-pagination__btn is-ellipsis"
					aria-hidden="true"
				>
					…
				</span>
			);
		}
		const isActive = token.page === currentPage;
		return (
			<button
				key={`page-${token.page}`}
				type="button"
				className={`wpcp-ajax-pagination__btn${isActive ? ' is-active' : ''}`}
				data-wpcp-page={token.page}
			>
				{token.page}
			</button>
		);
	});
}

function PaginationPreview({ attributes }) {
	const paginationOptions = attributes.paginationOptions || {};
	const enabled = attributes.layoutOptions?.pagination === true;
	const [mockPageCount] = useState(DEFAULT_MOCK_PAGES);

	if (!enabled) {
		return null;
	}

	// Image/video sources derive a real total_pages from item count /
	// imageItemsPerPage (mirrors `TilesPaginationRenderer::compute_tiles_pagination_state`).
	// Post/product stay mocked because their queries run server-side.
	const sourceType = attributes.sourceType;
	let pageCount = mockPageCount;
	if (sourceType === 'image' || sourceType === 'video') {
		const itemCount = Array.isArray(attributes.items) ? attributes.items.length : 0;
		const perPage = Number.isFinite(Number(paginationOptions.imageItemsPerPage))
			? Math.max(1, Math.floor(Number(paginationOptions.imageItemsPerPage)))
			: 10;
		pageCount = itemCount > 0 ? Math.max(1, Math.ceil(itemCount / perPage)) : 1;
	}

	const isEmpty = pageCount <= 1;

	const wrapperClass = [
		'wpcp-ajax-pagination',
		'wpcp-ajax-pagination--number',
		isEmpty ? 'is-empty' : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			className={wrapperClass}
			data-wpcp-pages-total={pageCount}
			data-wpcp-pagination-preview="true"
		>
			{!isEmpty && <NumberPreview paginationOptions={paginationOptions} mockPageCount={pageCount} />}
		</div>
	);
}

export default memo(PaginationPreview);
