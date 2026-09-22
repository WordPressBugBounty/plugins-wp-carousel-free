import { PATTERN_LIBRARY_QUERY_PARAM } from '@wp-carousel-pro/common/readyPatternsDeepLink';
import { consumePatternLibraryDeepLink } from '../blocks/shared/ready-patterns/deepLink';

window.addEventListener('load', function () {
	const url = new URL(window.location.href);
	const hasBlockInserter = url.searchParams.has('wpcpblock_inserter');
	const hasPatternLibrary = url.searchParams.has(PATTERN_LIBRARY_QUERY_PARAM);

	if (!hasBlockInserter && !hasPatternLibrary) {
		return;
	}

	function getScrollParent(element) {
		let node = element.parentElement;
		while (node) {
			const overflowY = window.getComputedStyle(node).overflowY;
			const scrollable = 'auto' === overflowY || 'scroll' === overflowY;
			if (scrollable && node.scrollHeight > node.clientHeight + 1) {
				return node;
			}
			node = node.parentElement;
		}
		return null;
	}

	// The panel title is sticky, so its own rect is pinned to the top of the
	// scroller and scrollIntoView on it barely moves: measure the block list
	// underneath it instead and leave room for the pinned title.
	function scrollPanelIntoView(heading) {
		const content = heading.nextElementSibling || heading;
		const container = getScrollParent(heading);
		if (!container) {
			heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
			return;
		}

		const containerTop = container.getBoundingClientRect().top;
		const headingHeight = heading.getBoundingClientRect().height;
		const offset = content.getBoundingClientRect().top - containerTop - headingHeight - 8;
		const target = Math.max(
			0,
			Math.min(container.scrollTop + offset, container.scrollHeight - container.clientHeight)
		);

		if (Math.abs(target - container.scrollTop) < 1) {
			return;
		}
		container.scrollTo({ top: target, behavior: 'smooth' });
	}

	function findPanelHeading() {
		const headings = document.querySelectorAll('.block-editor-inserter__panel-title');
		return Array.from(headings).find((h) => 'WP Carousel' === h.textContent.trim()) || null;
	}

	function tryScroll() {
		const wpCarouselHeading = findPanelHeading();
		if (!wpCarouselHeading) {
			return false;
		}
		scrollPanelIntoView(wpCarouselHeading);
		// Block previews load after the list paints and shift it; re-align once settled.
		[400, 900].forEach((delay) =>
			setTimeout(() => {
				const heading = findPanelHeading();
				if (heading) {
					scrollPanelIntoView(heading);
				}
			}, delay)
		);
		return true;
	}

	function tryClick() {
		if (!wp.data.dispatch) {
			return false;
		}
		const { dispatch } = wp.data;
		if (dispatch('core/editor')) {
			dispatch('core/editor').setIsInserterOpened(true);
		} else if (dispatch('core/edit-post')) {
			dispatch('core/edit-post').setIsInserterOpened(true);
		}
		// clear url.
		url.searchParams.delete('wpcpblock_inserter');
		history.replaceState(null, '', url.toString());

		// Try to scroll every 100ms for up to 3 seconds
		let scrollAttempts = 0;
		const scrollInterval = setInterval(() => {
			scrollAttempts++;
			if (tryScroll() || scrollAttempts > 30) {
				clearInterval(scrollInterval);
			}
		}, 100);

		return true;
	}

	// Handle pattern library. The request goes straight to the editor-level host
	// (parked until it mounts), so the block filter carried in the URL survives —
	// clicking the header launcher button could only ever open it unfiltered.
	if (hasPatternLibrary) {
		consumePatternLibraryDeepLink();
		return;
	}

	// Handle block inserter
	// Try every 100ms for up to 2 seconds
	let attempts = 0;
	const interval = setInterval(() => {
		attempts++;
		if (tryClick() || attempts > 20) {
			clearInterval(interval);
		}
	}, 100);
});
