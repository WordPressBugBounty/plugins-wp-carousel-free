/**
 * Shared dialog accessibility behavior for portal popups/modals.
 *
 * Extracted from the ReadyPatternsModal implementation (the in-repo reference
 * for correct behavior): Escape-to-close, focus restore on unmount, and an
 * optional Tab focus trap. Visual markup is owned by the caller — this hook
 * only wires events, so routing a popup through it changes no markup/styles.
 */

import { useEffect, useRef } from '@wordpress/element';

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param {Object}      props
 * @param {boolean}     props.isOpen           Whether the dialog is currently open.
 * @param {Function}    props.onClose          Called when Escape is pressed.
 * @param {Object|null} props.panelRef         Ref to the dialog surface (used for the focus trap).
 * @param {boolean}     [props.trapFocus=true] Cycle Tab within the dialog while open.
 * @param {string}      [props.label]          Accessible name (set once on mount via the returned id).
 * @return {{ dialogId: string }} Stable id to reference in aria-labelledby/aria-describedby.
 */
export default function useDialogBehavior({ isOpen, onClose, panelRef, trapFocus = true, label }) {
	// Captured before anything inside the dialog takes focus, restored after.
	const previousFocusRef = useRef(null);

	useEffect(() => {
		if (!isOpen) {
			return undefined;
		}
		// Capture/restore via the dialog surface's own document (editor canvas
		// iframes own their focus), not the top-level globals.
		const ownerDocument = panelRef?.current?.ownerDocument || document;
		previousFocusRef.current = ownerDocument.activeElement;

		const handleKeyDown = (event) => {
			if ('Escape' === event.key) {
				event.preventDefault();
				onClose();
				return;
			}
			if ('Tab' === event.key && trapFocus && panelRef?.current) {
				const focusable = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
				if (0 === focusable.length) {
					return;
				}
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				const active = ownerDocument.activeElement;
				if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
					event.preventDefault();
					first.focus();
				}
			}
		};

		ownerDocument.addEventListener('keydown', handleKeyDown);
		return () => {
			ownerDocument.removeEventListener('keydown', handleKeyDown);
			if (previousFocusRef.current && 'function' === typeof previousFocusRef.current.focus) {
				previousFocusRef.current.focus();
			}
		};
		// onClose identity changes per render in some callers; re-binding the
		// listener for it is cheap and keeps the close callback fresh.
	}, [isOpen, onClose, panelRef, trapFocus]);

	// Per-instance id for aria wiring. Stable across renders.
	const idRef = useRef('');
	if ('' === idRef.current) {
		idRef.current = `wpcp-dialog-${Math.random().toString(36).substring(2, 9)}`;
	}

	return { dialogId: idRef.current, label };
}
