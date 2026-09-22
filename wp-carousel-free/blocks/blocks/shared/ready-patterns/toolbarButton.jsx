/**
 * Editor-level Ready Patterns host + "Ready Patterns Library" header launcher.
 *
 * The button is a plain DOM node re-asserted on every `@wordpress/data` store
 * tick — the same robust pattern other toolbar-library plugins in this stack
 * use (idempotent: a present button short-circuits immediately). Gutenberg
 * exposes no official slot in the header toolbar, and swaps its toolbar
 * between responsive layouts, wiping any node appended there; re-adding a
 * plain node inside the same synchronous callback that discovers it missing
 * leaves no visible gap. A `createPortal`-based version previously drove the
 * button through React state, so a wipe left the button gone until the next
 * render — visible as a flash — and a document.body-wide MutationObserver
 * re-ran that check on every unrelated editor DOM mutation.
 *
 * The React tree registered via `registerPlugin` is the **only** owner of
 * `ReadyPatternsModal`. Blocks request the library through `openReadyPatterns`
 * and never host a modal of their own.
 */

import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { subscribe } from '@wordpress/data';
import ReadyPatternsModal from './ReadyPatternsModal';
import { isReadyPatternsEnabled } from './constants';
import { setReadyPatternsOpener, openReadyPatterns } from './openerRegistry';

const TOOLBAR_SELECTORS = ['.edit-post-header-toolbar', '.editor-header__toolbar'];
const SLOT_CLASS = 'wpcp-ready-patterns-launcher-slot';
const BUTTON_CLASS = 'wpcp-ready-patterns-launcher';
// Inlined mark (white fill — it sits on the brand-coloured button), mirrors LogoMarkIcon's flat-color path data.
const LOGO_SVG =
	'<svg viewBox="0 0 33 24" width="28" height="21" fill="none" aria-hidden="true" focusable="false"><path d="M0 0.666664V23.3334C0 23.7 0.301419 24 0.66982 24H31.4816C31.8499 24 32.1514 23.7 32.1514 23.3334V0.666664C32.1514 0.3 31.8499 0 31.4816 0H0.66982C0.301419 0 0 0.3 0 0.666664ZM27.4492 20.3266H4.70214C4.33374 20.3266 4.03232 20.0266 4.03232 19.66V4.34C4.03232 3.97334 4.33374 3.67334 4.70214 3.67334H27.4492C27.8176 3.67334 28.119 3.97334 28.119 4.34V19.66C28.119 20.0266 27.8176 20.3266 27.4492 20.3266Z" fill="#fff"/><path d="M25.2922 12.2001L22.4455 15.7401C22.3316 15.8868 22.1173 15.9068 21.9766 15.7934L20.5365 14.6401C20.3958 14.5268 20.369 14.3134 20.4829 14.1734L22.0637 12.2134C22.1642 12.0934 22.1642 11.9201 22.0637 11.7934L20.4696 9.82007C20.3557 9.67343 20.3757 9.46679 20.5231 9.35343L21.9632 8.20007C22.1106 8.08679 22.3183 8.10679 22.4321 8.25343L25.0846 11.5468L25.2855 11.7868C25.3927 11.9001 25.3926 12.0734 25.2922 12.2001Z" fill="#fff"/><path d="M10.0807 12.2134L11.6615 14.1734C11.7754 14.3202 11.7553 14.5268 11.6079 14.6402L10.1745 15.7868C10.0271 15.9002 9.81951 15.8802 9.70561 15.7334L6.85218 12.2002C6.75171 12.0802 6.75171 11.9068 6.85218 11.7802L6.90577 11.7134L9.72571 8.24679C9.8396 8.10015 10.0539 8.08015 10.1946 8.19343L11.6347 9.34679C11.782 9.46015 11.8021 9.67343 11.6883 9.81343L10.0807 11.8002C9.98694 11.9202 9.98027 12.0934 10.0807 12.2134Z" fill="#fff"/></svg>';

// Set once the host React tree mounts; the imperative button below calls through it.
let openLibrary = () => {};

/**
 * Build the launcher button node (plain DOM). Opens the React-rendered modal.
 *
 * @return {HTMLElement} The clickable button element.
 */
function buildButton() {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = BUTTON_CLASS;
	// Trusted, hard-coded markup + a translated label added as a text node
	// (never interpolated into the HTML string), so there is no injection vector.
	button.innerHTML = LOGO_SVG;
	button.appendChild(document.createTextNode(__('Patterns Library', 'wp-carousel-free')));
	button.addEventListener('click', () => openLibrary());
	return button;
}

/**
 * Ensure the launcher button is present in the current header toolbar. Cheap and
 * idempotent: returns immediately when the toolbar isn't mounted or the button
 * is already there, and otherwise appends a fresh plain-DOM node synchronously.
 */
function ensureToolbarButton() {
	const toolbar = TOOLBAR_SELECTORS.map((selector) => document.querySelector(selector)).find(
		Boolean
	);
	if (!toolbar || toolbar.querySelector(`.${SLOT_CLASS}`)) {
		return;
	}

	const wrapper = document.createElement('div');
	wrapper.className = SLOT_CLASS;
	wrapper.appendChild(buildButton());
	toolbar.appendChild(wrapper);
}

/**
 * Single editor-level host for the Ready Patterns modal.
 *
 * @return {JSX.Element} Modal owner.
 */
function ReadyPatternsHost() {
	const [isOpen, setIsOpen] = useState(false);
	const [targetClientId, setTargetClientId] = useState(null);
	const [requestedBlockName, setRequestedBlockName] = useState(null);

	useEffect(() => {
		const handler = ({ clientId = null, blockName = null } = {}) => {
			setTargetClientId(clientId || null);
			setRequestedBlockName(blockName || null);
			setIsOpen(true);
		};
		const unsubscribe = setReadyPatternsOpener(handler);
		// Header button: no explicit target (selection fallback runs at insert time).
		openLibrary = () => openReadyPatterns({});
		return () => {
			unsubscribe();
			openLibrary = () => {};
		};
	}, []);

	return (
		<ReadyPatternsModal
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
			targetClientId={targetClientId}
			requestedBlockName={requestedBlockName}
		/>
	);
}

export function registerReadyPatternsLauncher() {
	// The host mounts either way: the dashboard's Demo deep link opens the library
	// whatever the module toggle says. Only the header button follows the toggle.
	registerPlugin('wpcp-ready-patterns-launcher', {
		render: ReadyPatternsHost,
	});

	if (!isReadyPatternsEnabled()) {
		return;
	}
	// Re-assert the button on every editor store change. Re-renders/remounts that
	// drop the node are corrected on the next tick; a present button short-circuits.
	subscribe(ensureToolbarButton);
	ensureToolbarButton();
}
