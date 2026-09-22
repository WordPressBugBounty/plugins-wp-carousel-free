/**
 * Editor-preview lightbox opener.
 *
 * WP 7 renders the canvas inside an iframe, so Fancybox's own delegated
 * click listener (bound to the top-window document) never sees trigger
 * clicks. This hook binds a capture-phase click handler on the preview
 * roots and opens Fancybox programmatically via `Fancybox.fromNodes`,
 * keeping the editor Swiper in sync while navigating the lightbox.
 *
 * The handler binds whether or not the Lightbox module is on, because its
 * first job is to swallow the click: preview triggers keep a real `href`
 * for Fancybox to read, and an unhandled click navigates the canvas iframe
 * to that URL — which wipes the editor. Opening the lightbox is the second,
 * module-gated job.
 */

import { useEffect } from '@wordpress/element';
import { buildLightboxOptions } from '../lightbox/buildLightboxOptions';
import {
	collectLightboxTriggers,
	isLightboxIgnored,
	resolveTriggerStartIndex,
} from '../lightbox/lightboxTriggers';
import { isLightboxModuleActive } from '../lightbox/useLightboxModuleSettings';

/**
 * @param {Object}  options
 * @param {boolean} options.isEditor
 * @param {boolean} options.isTiles
 * @param {string}  options.style             Carousel style (tiles never syncs Swiper).
 * @param {boolean} options.loop              Swiper loop mode (sync uses `slideToLoop`).
 * @param {string}  options.swiperKey         Remount key — rebind when the Swiper remounts.
 * @param {number}  options.itemsLength
 * @param {Object}  options.containerRef
 * @param {Object}  options.carouselRef
 * @param {Object}  options.tilesContainerRef
 * @param {Object}  options.swiperRef
 */
export default function useEditorPreviewLightbox({
	isEditor,
	isTiles,
	style,
	loop,
	swiperKey,
	itemsLength,
	containerRef,
	carouselRef,
	tilesContainerRef,
	swiperRef,
}) {
	useEffect(() => {
		if (!isEditor) {
			return undefined;
		}

		const layoutRoots = [containerRef.current, carouselRef.current, tilesContainerRef.current].filter(
			Boolean
		);
		if (!layoutRoots.length) {
			return undefined;
		}

		// Bind on `.wpcp-block-carousel-scope`, not on the layout ref's node: a
		// Layout Style switch (tiles uniform <-> bento, Swiper <-> grid) unmounts
		// that node and mounts a new one, and nothing in this effect's deps changes
		// with it — the listener would be left on a detached element and every
		// trigger click would fall through unhandled. The scope root is stable for
		// the block's whole life and still contains only this block's triggers.
		const roots = [];
		layoutRoots.forEach((node) => {
			const root = node.closest('.wpcp-block-carousel-scope') || node;
			if (!roots.includes(root)) {
				roots.push(root);
			}
		});

		const isTicker = 'ticker' === style;
		const syncSwiperInLightbox = !isTiles && !isTicker;
		const seenLightboxInstances = new WeakSet();
		const ownLightboxInstances = new WeakSet();

		const isOwnPreviewTrigger = (trigger) => roots.some((root) => root.contains(trigger));

		const syncSwiperFromFancybox = (fancybox) => {
			if (!syncSwiperInLightbox || !fancybox || !ownLightboxInstances.has(fancybox)) {
				return;
			}

			const indexedTrigger = fancybox.getSlide?.()?.triggerEl?.closest?.('[data-wpcp-item-index]');
			if (!indexedTrigger || isLightboxIgnored(indexedTrigger)) {
				return;
			}

			// Opening Fancybox fires `Carousel.change` for the clicked item. Do not
			// move the editor Swiper on that initial event; only sync after navigation.
			if (!seenLightboxInstances.has(fancybox)) {
				seenLightboxInstances.add(fancybox);
				return;
			}

			const nextIndex = Number(indexedTrigger.dataset.wpcpItemIndex);
			const swiper = swiperRef.current;

			if (!Number.isInteger(nextIndex) || nextIndex < 0 || !swiper) {
				return;
			}

			if (swiper.realIndex === nextIndex || swiper.activeIndex === nextIndex) {
				return;
			}

			if (loop && typeof swiper.slideToLoop === 'function') {
				swiper.slideToLoop(nextIndex);
				return;
			}

			if (typeof swiper.slideTo === 'function') {
				swiper.slideTo(nextIndex);
			}
		};

		const handleClick = (event) => {
			const trigger = event.target.closest('[data-fancybox]');
			if (!trigger || !isOwnPreviewTrigger(trigger)) {
				return;
			}

			// An empty group is the video card's inline-player placeholder, not a
			// trigger — leave it alone so clicking a slide still selects the block.
			const group = trigger.getAttribute('data-fancybox');
			if (!group) {
				return;
			}

			// A real trigger carries a live `href` (Fancybox reads it) and the WP 7
			// canvas is an iframe, so an unhandled click navigates the editor away from
			// the post. Swallow it first, then decide whether a lightbox can open.
			event.preventDefault();

			// A decorative clone carries a live `href` too, so its click had to be
			// swallowed above — but it is no gallery member. Let it bubble on, so
			// clicking a marquee fill strip still selects the block.
			if (isLightboxIgnored(trigger)) {
				return;
			}

			event.stopPropagation();

			if (!isLightboxModuleActive()) {
				return;
			}

			const Fancybox = window.Fancybox;
			if (!Fancybox || typeof Fancybox.fromNodes !== 'function') {
				return;
			}

			const groupTriggers = collectLightboxTriggers(roots, group);
			const startIndex = resolveTriggerStartIndex(groupTriggers, trigger);

			const options = buildLightboxOptions({
				startIndex,
				// A marquee trigger keeps moving, so on close Fancybox's focus-back
				// scrolls the off-screen trigger into view — which sets `scrollLeft`
				// on the `overflow: hidden` ticker viewport and leaves the strip
				// parked out of frame, looking like a stopped, half-empty marquee.
				// Focus goes back by hand below instead, without the scroll.
				...(isTicker ? { placeFocusBack: false } : {}),
				on: {
					init: (fancybox) => {
						ownLightboxInstances.add(fancybox);
					},
					'Carousel.change': (fancybox) => {
						syncSwiperFromFancybox(fancybox);
					},
					...(isTicker
						? {
								destroy: () => {
									trigger.focus?.({ preventScroll: true });
								},
						  }
						: {}),
				},
			});

			Fancybox.fromNodes(groupTriggers.length ? groupTriggers : [trigger], options);
		};

		roots.forEach((root) => root.addEventListener('click', handleClick, true));

		return () => {
			roots.forEach((root) => root.removeEventListener('click', handleClick, true));
		};
		// Why: refs are stable; rebind only when the preview DOM is rebuilt
		// (swiperKey/items) or the sync mode changes — matches the original
		// effect in CarouselRender.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEditor, isTiles, style, loop, swiperKey, itemsLength]);
}
