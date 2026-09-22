import { getAjaxConfig } from '../shared/ajaxConfig';
import { readPaginationPayload } from '../shared/paginationPayload';
import { onDocumentReadyAndLoad } from '../shared/domReady';
import { replacePaginationControls } from '../shared/paginationControls';

/* ============================================================================
 * Tiles AJAX pagination glue
 * ----------------------------------------------------------------------------
 * Bound per-block off the `.wpcp-ajax-pagination` wrappers inside a
 * `.wpcp-block-tiles` ancestor. Handles the page swap, the `.is-loading`
 * spinner state, `console.error` on fetch failure (never a throw), and
 * Scroll-to-Top.
 * ========================================================================== */
export function bootAjaxPagination() {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return;
	}

	function getItemsContainer(blockRoot) {
		return blockRoot.querySelector('.wpcp-tiles-grid');
	}

	function relayoutTiles() {
		document.dispatchEvent(new Event('wpcp:tiles:relayout'));
	}

	function setLoading(wrapper, on) {
		wrapper.classList.toggle('is-loading', !!on);
	}

	function ensureSpinner(wrapper) {
		// Reuses the plugin's existing loading-spinner class; when the asset is
		// absent the `.is-loading` class alone still drives the CSS state.
		if (wrapper.querySelector('.wpcp-ajax-pagination__spinner')) {
			return;
		}
		const span = document.createElement('span');
		span.className = 'wpcp-ajax-pagination__spinner wpcp-preloader-spinner';
		span.setAttribute('aria-hidden', 'true');
		wrapper.appendChild(span);
	}

	function fetchPage(payload, page) {
		const cfg = getAjaxConfig();
		if (!cfg || !cfg.restUrl) {
			return Promise.reject(new Error('wpcp: missing AJAX config'));
		}
		// Forward the full attribute payload so AJAX-rendered items match the
		// initial server render — imageOptions, contentAreaOptions, titleOptions
		// and the rest all participate in `render_item`.
		return fetch(cfg.restUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': cfg.nonce || '',
			},
			body: JSON.stringify({ ...payload, page }),
		}).then(function (resp) {
			if (!resp.ok) {
				return Promise.reject(new Error('wpcp: REST status ' + resp.status));
			}
			return resp.json();
		});
	}

	function scrollToTopIfNeeded(blockRoot, payload) {
		const opts = payload.paginationOptions || {};
		if (!opts.scrollToTop) {
			return;
		}
		const offset = Number(opts.scrollOffset || 0);
		const rect = blockRoot.getBoundingClientRect();
		const top = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top - offset;
		window.scrollTo({ top, behavior: 'smooth' });
	}

	function bindNumberMode(blockRoot, wrapper, payload) {
		// Monotonic counter so rapid clicks (2 → 3 → 4) commit the latest
		// click's response, not whichever fetch resolves last.
		let requestSeq = 0;
		let latestRequest = 0;

		function markActivePage(page) {
			const target = String(page);
			wrapper.querySelectorAll('.wpcp-ajax-pagination__btn').forEach(function (b) {
				b.classList.toggle('is-active', b.getAttribute('data-wpcp-page') === target);
			});
		}

		function runPageRequest(nextPage) {
			const itemsContainer = getItemsContainer(blockRoot);
			if (!itemsContainer) {
				return;
			}
			requestSeq += 1;
			const requestId = requestSeq;
			latestRequest = requestId;
			const previousHtml = itemsContainer.innerHTML;
			const previousPage = Number(wrapper.getAttribute('data-wpcp-pagination-current')) || 1;
			setLoading(wrapper, true);
			ensureSpinner(wrapper);
			// Highlight the clicked page up front: `.is-loading` sets
			// `pointer-events: none`, which drops `:hover`, so without this the
			// button flicks back to its default colours until the response lands.
			markActivePage(nextPage);

			fetchPage(payload, nextPage)
				.then(function (result) {
					if (requestId !== latestRequest) {
						return;
					}
					if (typeof result.html === 'string') {
						itemsContainer.innerHTML = result.html;
					}
					const totalPages = Number(result.total_pages) || 1;
					const appliedPage = Math.min(Math.max(1, nextPage), totalPages);
					if (typeof result.controlsHtml === 'string') {
						replacePaginationControls(wrapper, result.controlsHtml, totalPages, appliedPage);
					} else {
						wrapper.setAttribute('data-wpcp-pagination-current', String(appliedPage));
						markActivePage(appliedPage);
					}
					// Signal the carousel runtime that the visible tile set changed
					// so it binds per-item interactions on the new nodes.
					itemsContainer.dispatchEvent(new CustomEvent('wpcp:tiles:swapped', { bubbles: true }));
					requestAnimationFrame(relayoutTiles);
					scrollToTopIfNeeded(blockRoot, payload);
				})
				.catch(function (err) {
					if (requestId !== latestRequest) {
						return;
					}
					itemsContainer.innerHTML = previousHtml;
					markActivePage(previousPage);
					// eslint-disable-next-line no-console
					console.error(err);
				})
				.then(function () {
					if (requestId === latestRequest) {
						setLoading(wrapper, false);
					}
				});
		}

		wrapper.addEventListener('click', function (event) {
			const btn = event.target.closest('.wpcp-ajax-pagination__btn');
			if (!btn || btn.classList.contains('is-ellipsis') || btn.disabled) {
				return;
			}
			const raw = btn.getAttribute('data-wpcp-page');
			if (!raw) {
				return;
			}
			const current = Number(wrapper.getAttribute('data-wpcp-pagination-current')) || 1;
			const total = Number(wrapper.getAttribute('data-wpcp-pages-total')) || 1;
			let nextPage = current;
			if (raw === 'prev') {
				nextPage = Math.max(1, current - 1);
			} else if (raw === 'next') {
				nextPage = Math.min(total, current + 1);
			} else {
				nextPage = parseInt(raw, 10);
			}
			if (!Number.isFinite(nextPage) || nextPage === current) {
				return;
			}
			runPageRequest(nextPage);
		});
	}

	function initWrapper(blockRoot, wrapper) {
		if (wrapper.getAttribute('data-wpcp-pagination-bound') === '1') {
			return;
		}
		wrapper.setAttribute('data-wpcp-pagination-bound', '1');
		const payload = readPaginationPayload(wrapper);
		if (!payload) {
			return;
		}
		if (wrapper.classList.contains('wpcp-ajax-pagination--number')) {
			bindNumberMode(blockRoot, wrapper, payload);
		}
	}

	function initAll() {
		const tilesBlocks = document.querySelectorAll('.wpcp-block-tiles');
		for (let i = 0; i < tilesBlocks.length; i++) {
			const blockRoot = tilesBlocks[i];
			const wrappers = blockRoot.querySelectorAll('.wpcp-ajax-pagination');
			for (let j = 0; j < wrappers.length; j++) {
				initWrapper(blockRoot, wrappers[j]);
			}
		}
	}

	onDocumentReadyAndLoad(initAll);
}
