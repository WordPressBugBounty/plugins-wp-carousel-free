/**
 * Swap the wrapper's inner number buttons with server-rendered HTML returned
 * by the Tiles AJAX endpoint.
 *
 * @param {HTMLElement} wrapper      Pagination wrapper.
 * @param {string}      controlsHtml HTML for the inner controls.
 * @param {number}      totalPages   New total page count.
 * @param {number}      currentPage  New current page.
 */
export function replacePaginationControls(wrapper, controlsHtml, totalPages, currentPage) {
	if (!wrapper) {
		return;
	}
	wrapper.classList.toggle('is-empty', totalPages <= 1);
	const toRemove = Array.prototype.filter.call(wrapper.children, function (child) {
		return child.classList.contains('wpcp-ajax-pagination__btn');
	});
	toRemove.forEach(function (el) {
		el.parentNode.removeChild(el);
	});
	if (typeof controlsHtml === 'string' && controlsHtml.length) {
		const fragment = document.createRange().createContextualFragment(controlsHtml);
		wrapper.appendChild(fragment);
	}
	wrapper.setAttribute('data-wpcp-pages-total', String(Math.max(1, totalPages)));
	wrapper.setAttribute('data-wpcp-pagination-current', String(Math.max(1, currentPage)));
}
