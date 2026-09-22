/**
 * Vertical ticker viewport height: first N variable-height rows + gaps (Desktop row count).
 */

/**
 * @param {HTMLElement} stripEl  Ticker strip element.
 * @param {number}      rowCount Logical rows (columns.Desktop).
 * @param {number}      gapPx    Gap in pixels.
 * @return {number} Viewport height in px (clamped).
 */
export function tickerVerticalViewportPx(stripEl, rowCount, gapPx) {
	if (!stripEl || !stripEl.children.length) {
		return 280;
	}
	const ch = stripEl.children;
	const n = Math.min(Math.max(1, rowCount), ch.length);
	let sum = 0;
	for (let i = 0; i < n; i++) {
		sum += ch[i].getBoundingClientRect().height;
	}
	sum += Math.max(0, n - 1) * gapPx;
	const cap = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.92) : 4000;
	return Math.max(120, Math.min(Math.ceil(sum), cap));
}
