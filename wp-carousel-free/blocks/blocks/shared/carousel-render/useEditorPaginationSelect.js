/**
 * Editor: after Swiper handles pagination clicks (slide change), select the pagination
 * inner block in the block list. Uses bubble on `.wpcp-pagination` so Swiper
 * `clickable` handlers on bullets run in the normal event path; capture plus
 * stopImmediatePropagation
 * would swallow the event and slides would not move.
 */
import { useLayoutEffect } from '@wordpress/element';

export default function useEditorPaginationSelect(
	onSelectPagination,
	paginRef,
	enabled,
	paginationVisible = true
) {
	useLayoutEffect(() => {
		if (!enabled || !paginationVisible || typeof onSelectPagination !== 'function') {
			return undefined;
		}
		const el = paginRef?.current;
		if (!el) {
			return undefined;
		}
		const handler = () => {
			onSelectPagination();
		};
		el.addEventListener('click', handler);
		return () => {
			el.removeEventListener('click', handler);
		};
	}, [enabled, paginationVisible, onSelectPagination, paginRef]);
}
