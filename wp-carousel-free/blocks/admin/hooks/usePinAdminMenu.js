import { useEffect } from '@wordpress/element';

/**
 * Re-measures core's sticky admin menu whenever the page height changes.
 * Core measures once at load, before this SPA has rendered, so on a tall menu
 * it unpins and scrolls away leaving a blank sidebar.
 */
export default function usePinAdminMenu() {
	useEffect(() => {
		const wrap = document.getElementById('wpwrap');
		const $ = window.jQuery;
		if (!wrap || !$ || 'function' !== typeof window.ResizeObserver) {
			return undefined;
		}

		let frame = 0;
		const observer = new window.ResizeObserver(() => {
			window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => $(document).trigger('wp-pin-menu'));
		});
		observer.observe(wrap);

		return () => {
			window.cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, []);
}
