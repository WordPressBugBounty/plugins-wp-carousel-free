/**
 * Gap value + unit conversion, shared by the editor preview and the frontend
 * runtime. Layout engines write gaps as inline styles in both
 * contexts, so the two sides have to resolve a unit identically or the editor
 * and the front end drift apart.
 */

/**
 * Convert gap value + unit to pixels (numeric, e.g. Swiper `spaceBetween`).
 *
 * @param {number}           val  Raw slider value.
 * @param {string}           unit Unit id (px, %, em).
 * @param {HTMLElement|null} el   Measured element (carousel root); optional for first paint.
 */
export function gapToPx(val, unit, el) {
	const n = Number(val);
	if (!Number.isFinite(n)) {
		return 0;
	}
	const u = String(unit || 'px').toLowerCase();
	if (u === 'px') {
		return Math.round(n);
	}
	if (u === '%') {
		let w = 1024;
		if (el?.clientWidth) {
			w = el.clientWidth;
		} else if (typeof window !== 'undefined') {
			w = window.innerWidth;
		}
		return Math.round((w * n) / 100);
	}
	if (u === 'em') {
		let fs = 16;
		if (el) {
			fs = parseFloat(window.getComputedStyle(el).fontSize) || 16;
		} else if (typeof document !== 'undefined') {
			fs = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
		}
		return Math.round(n * fs);
	}
	return Math.round(n);
}

/**
 * CSS `gap` string for grid layout.
 *
 * @param {number} val  Raw slider value.
 * @param {string} unit Unit id (px, %, em).
 */
export function gapCssValue(val, unit) {
	const n = Number(val);
	if (!Number.isFinite(n)) {
		return '0px';
	}
	const u = String(unit || 'px').toLowerCase();
	if (u === 'px') {
		return `${n}px`;
	}
	return `${n}${u}`;
}
