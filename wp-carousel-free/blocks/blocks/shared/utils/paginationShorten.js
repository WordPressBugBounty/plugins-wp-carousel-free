/**
 * Pagination button-list shortening algorithm.
 *
 * Both the editor preview (PaginationPreview) and PHP `BlockRenderer::renderTiles`
 * call this to produce the same number/ellipsis pattern. Keep it dependency-free
 * and side-effect-free so the PHP mirror in `src/Blocks/BlockRenderer.php`
 * (`build_pagination_tokens`) stays a 1:1 port.
 *
 * When `totalPages <= 7`, every page is returned in order.
 *
 * When `totalPages > 7`, the returned pattern is `first … (current-1) current (current+1) … last`,
 * collapsing the left or right ellipsis when current is near a boundary.
 *
 * @param {number}  totalPages   Total number of pages (>= 1).
 * @param {number}  currentPage  The active page (1-indexed).
 * @param {boolean} showEllipsis Whether long lists should be shortened with ellipses.
 * @return {Array<{type: 'page'|'ellipsis', page?: number}>} Render tokens.
 */
export function buildPaginationButtons(totalPages, currentPage, showEllipsis = true) {
	const total = Math.max(1, Math.floor(Number(totalPages) || 1));

	if (!showEllipsis || total <= 7) {
		const out = [];
		for (let page = 1; page <= total; page++) {
			out.push({ type: 'page', page });
		}
		return out;
	}

	const current = Math.min(total, Math.max(1, Math.floor(Number(currentPage) || 1)));
	const leftSiblingPage = Math.max(2, current - 1);
	const rightSiblingPage = Math.min(total - 1, current + 1);
	const tokens = [{ type: 'page', page: 1 }];

	if (leftSiblingPage > 2) {
		tokens.push({ type: 'ellipsis' });
	}

	for (let page = leftSiblingPage; page <= rightSiblingPage; page++) {
		tokens.push({ type: 'page', page });
	}

	if (rightSiblingPage < total - 1) {
		tokens.push({ type: 'ellipsis' });
	}

	tokens.push({ type: 'page', page: total });

	return tokens;
}
