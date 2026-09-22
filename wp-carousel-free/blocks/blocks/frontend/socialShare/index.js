/**
 * Social-share "Copy post URL" support — frontend runtime.
 *
 * Each carousel item's share row (server-rendered by SocialShareRenderer) ends
 * with a Copy control: an `<a class="wpcp-copy-btn" data-action="copy"
 * data-url="…">` whose only child feedback element is a "Copied!" popup
 * (`.wpcp-post-url-copy-popup`, hidden via `.wpcp-d-hidden`). The network share
 * links are native anchors and need no help; only the copy action does. There is
 * no handler for it anywhere — not in this bundle, not in the classic shortcode
 * system — so until now the control has been inert.
 *
 * One delegated `document` click handler owns every copy control on the page,
 * which means it also covers the deep clone the lightbox share popover shows —
 * no extra wiring is needed for the lightbox. A window-level guard keeps it
 * idempotent, matching the `bootPasswordToggle` shape, so the handler binds at
 * most once even if a future bundle also boots it.
 */

/**
 * The copy control selector. `data-action="copy"` distinguishes it from the
 * network `<a data-action="share">` links it sits beside.
 */
const COPY_BUTTON_SELECTOR = '.wpcp-copy-btn[data-action="copy"]';

/**
 * The "Copied!" feedback popup that lives inside each copy control.
 */
const POPUP_SELECTOR = '.wpcp-post-url-copy-popup';

/**
 * Class that hides the popup (`display: none`); removing it reveals the popup.
 */
const HIDDEN_CLASS = 'wpcp-d-hidden';

/** How long the "Copied!" popup stays visible, in milliseconds. */
const FLASH_MS = 1500;

/**
 * Active flash timers keyed by their popup element, so a rapid second click on
 * the same control resets the timer instead of stacking two. A WeakMap keeps
 * this off the DOM and lets the popup be garbage-collected with its list.
 */
const popupTimers = new WeakMap();

/**
 * Copy `text` to the clipboard, preferring the async Clipboard API and falling
 * back to a transient textarea + `document.execCommand('copy')` — the only path
 * on non-secure origins, where the async API is unavailable. Mirrors the admin
 * `copyText` helper (sans console logging, since this ships to every visitor).
 *
 * @param {string} text The text to copy.
 * @return {Promise<boolean>} Whether a copy path reported success.
 */
async function copyToClipboard(text) {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (err) {
			// Permission denied or non-secure context — try the legacy path.
		}
	}

	try {
		const textarea = document.createElement('textarea');
		textarea.value = text;

		// Keep the transient textarea off-screen so the copy is invisible.
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		textarea.style.pointerEvents = 'none';

		document.body.appendChild(textarea);
		textarea.select();

		const success = document.execCommand('copy');
		document.body.removeChild(textarea);
		return success;
	} catch (err) {
		return false;
	}
}

/**
 * Flash the "Copied!" popup inside the clicked control for a short moment.
 * Re-clicking the same control before the flash ends resets the timer rather
 * than cutting it short or layering a second one.
 *
 * @param {Element} button The copy `<a>` element that was clicked.
 */
function flashCopiedPopup(button) {
	if (!(button instanceof Element)) {
		return;
	}
	const popup = button.querySelector(POPUP_SELECTOR);
	if (!popup) {
		return;
	}
	popup.classList.remove(HIDDEN_CLASS);

	clearTimeout(popupTimers.get(popup));
	popupTimers.set(
		popup,
		setTimeout(() => {
			popup.classList.add(HIDDEN_CLASS);
			popupTimers.delete(popup);
		}, FLASH_MS)
	);
}

/**
 * Bind the delegated copy behavior exactly once. Safe to call from both the
 * carousel and marquee boot paths — a window guard short-circuits repeats.
 */
export function bootSocialShare() {
	if (window.wpcpSocialShareBound) {
		return;
	}
	window.wpcpSocialShareBound = true;

	document.addEventListener('click', async (event) => {
		const target = event.target;
		if (!target || typeof target.closest !== 'function') {
			return;
		}
		const button = target.closest(COPY_BUTTON_SELECTOR);
		if (!button) {
			return;
		}

		// The control is an `<a href="#">`; stop it from appending `#` to the URL
		// (and from scrolling) before the awaited clipboard write resolves.
		event.preventDefault();

		const url = button.dataset.url || '';
		if (url) {
			await copyToClipboard(url);
		}
		flashCopiedPopup(button);
	});
}
