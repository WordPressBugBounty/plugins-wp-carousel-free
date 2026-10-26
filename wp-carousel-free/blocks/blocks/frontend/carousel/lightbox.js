import { buildLightboxOptions } from '../../shared/lightbox/buildLightboxOptions';

/**
 * Slide the trigger's own Swiper to the slide holding it.
 *
 * @param {HTMLElement}      blockRoot `.wpcp-block`
 * @param {HTMLElement|null} trigger   Current lightbox slide's trigger.
 */
function syncSwiperToTrigger(blockRoot, trigger) {
	const slide = trigger?.closest?.('.swiper-slide');
	const swiper = slide?.closest('.swiper')?.swiper;
	if (!swiper || swiper.destroyed || !blockRoot.contains(slide)) {
		return;
	}

	if (swiper.params.loop) {
		const realIndex = Number(slide.dataset.swiperSlideIndex);
		if (Number.isInteger(realIndex) && realIndex !== swiper.realIndex) {
			swiper.slideToLoop(realIndex);
		}
		return;
	}

	const index = swiper.slides.indexOf(slide);
	if (index >= 0 && index !== swiper.activeIndex) {
		swiper.slideTo(index);
	}
}

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

	const openedInstances = new WeakSet();

	Fancybox.bind(
		blockRoot,
		selector,
		buildLightboxOptions({
			on: {
				// Follow lightbox navigation, as the editor preview does; skips the change fired on open.
				'Carousel.change': (fancybox) => {
					if (!openedInstances.has(fancybox)) {
						openedInstances.add(fancybox);
						return;
					}
					syncSwiperToTrigger(blockRoot, fancybox?.getSlide?.()?.triggerEl);
				},
				// Fancybox scrolls an off-screen trigger into view on close, which shifts the clipped Swiper viewport.
				destroy: () => {
					blockRoot.querySelectorAll('.swiper').forEach((swiperEl) => {
						swiperEl.scrollLeft = 0;
						swiperEl.scrollTop = 0;
					});
				},
			},
		})
	);

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
