import { buildLightboxOptions } from '../../shared/lightbox/buildLightboxOptions';

/**
 * Block lightbox init — Fancybox 5 scoped per `.wpcp-block` root.
 *
 * @param {HTMLElement} blockRoot `.wpcp-block`
 */
export function initBlockLightbox(blockRoot) {
	if (!blockRoot || blockRoot.dataset.wpcpLightboxInit === '1') {
		return;
	}

	const Fancybox = window.Fancybox;
	if (
		!Fancybox ||
		typeof Fancybox.bind !== 'function' ||
		typeof window.wpcp_lightbox !== 'object' ||
		window.wpcp_lightbox === null ||
		typeof window.wpcp_lightbox.fancybox !== 'object'
	) {
		return;
	}

	blockRoot.dataset.wpcpLightboxInit = '1';

	const blockId = blockRoot.getAttribute('id');
	if (!blockId) {
		return;
	}

	// PHP-generated ids are selector-safe, but CSS.escape keeps the selector
	// correct even if a metacharacter ever slips into an id (pattern already
	// used for the filter targets).
	const escapedId = window.CSS && CSS.escape ? CSS.escape(blockId) : blockId;
	const selector = `#${escapedId} [data-fancybox^="wpcp-"]`;

	Fancybox.bind(blockRoot, selector, buildLightboxOptions());

	// Overlay lightbox icons are click proxies (no `data-fancybox`) when the slide
	// media is already a gallery member — forward their click to that media anchor
	// so the gallery isn't duplicated (one slide per image, not per trigger).
	blockRoot.addEventListener('click', (event) => {
		const proxy = event.target.closest('.wpcp-lightbox-icon[data-wpcp-lb-proxy]');
		if (!proxy || !blockRoot.contains(proxy)) {
			return;
		}
		// Normal slides nest the icon inside `.wpcp-item-media` next to the media
		// anchor. Super Flow renders its controls in a slide-level
		// `.wpcp-premium-slide-controls` layer (a sibling of the media), so fall
		// back to the whole slide to find the media anchor — otherwise the proxy
		// resolves to nothing and the icon's href navigates to the image instead.
		const scope = proxy.closest('.wpcp-item-media') || proxy.closest('.wpcp-item');
		const mediaAnchor = scope && scope.querySelector('a[data-fancybox^="wpcp-"]');
		if (mediaAnchor) {
			event.preventDefault();
			mediaAnchor.click();
		}
	});
}
