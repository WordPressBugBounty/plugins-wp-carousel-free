/**
 * Editor: clicking a content slot element in the preview selects the block,
 * opens the inspector, and reveals the panel that owns that slot:
 *  - title / description / short description (excerpt) / read-more → Card Content
 *  - meta row (date • author • category …)                       → Meta Data
 *  - taxonomy terms (separate slot)                              → Taxonomy
 *  - social share icons                                          → Social Share
 * Mirrors the pagination-preview → Pagination Dots affordance (`useEditorPaginationSelect`).
 *
 * Capture phase is required: the Read More button calls `stopPropagation()`
 * in the editor (`ReadMoreButton.jsx`), so a bubble-phase listener would never
 * see those clicks. Capture fires top-down before the target's own handlers.
 *
 * Delegated on the carousel scope element so it works for every layout (the
 * content slots live deep inside the Swiper slides / tiles grid) without
 * threading a callback through the whole render tree.
 */
import { useEffect } from '@wordpress/element';

// Preview selector → inspector panel opened on click. Iterated in insertion
// order; the first selector whose `closest()` matches the click target wins.
// `closest()` does exact class matching, so each `.wpcp-content-slot--*` key
// only resolves to its own slot, and the sets are disjoint (title/desc/
// read-more never sit inside a meta/taxonomy/social slot) — a click resolves to
// exactly one panel, never double-firing. Note: taxonomy in the `beside-meta`
// position renders inside the meta slot with no `.wpcp-content-slot--taxonomy`
// wrapper, so it correctly opens Meta Data rather than Taxonomy there.
const SLOT_PANELS = {
	'.wpcp-item-title, .wpcp-item-desc, .wpcp-read-more': 'cardContent',
	'.wpcp-content-slot--meta': 'postMeta',
	'.wpcp-content-slot--taxonomy': 'taxonomy',
	'.wpcp-content-slot--social': 'socialShare',
};

export default function useEditorContentSelect(scopeRef, onSelectSlot, enabled) {
	useEffect(() => {
		if (!enabled || typeof onSelectSlot !== 'function') {
			return undefined;
		}
		const el = scopeRef?.current;
		if (!el) {
			return undefined;
		}
		const handler = (event) => {
			const { target } = event;
			if (!target || typeof target.closest !== 'function') {
				return;
			}
			let panelName = null;
			for (const [selector, panel] of Object.entries(SLOT_PANELS)) {
				if (target.closest(selector)) {
					panelName = panel;
					break;
				}
			}
			if (!panelName) {
				return;
			}
			// Stop title/read-more links from navigating the editor canvas.
			event.preventDefault();
			onSelectSlot(panelName);
		};
		el.addEventListener('click', handler, true);
		return () => {
			el.removeEventListener('click', handler, true);
		};
	}, [enabled, onSelectSlot, scopeRef]);
}
