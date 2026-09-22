/**
 * Content-box orientation lifts the content element with a translateY; the
 * item needs a matching `--wpcp-content-box-flow-shift` custom property so
 * following flow content doesn't overlap. This hook measures the translate
 * and keeps the property in sync (mirrors the frontend runtime behavior).
 */

import { useLayoutEffect } from '@wordpress/element';

function getTranslateYPx(element) {
	if (!element || typeof window === 'undefined') {
		return 0;
	}

	const transform = window.getComputedStyle(element).transform;
	if (!transform || transform === 'none') {
		return 0;
	}

	if (typeof window.DOMMatrixReadOnly === 'function') {
		try {
			return new window.DOMMatrixReadOnly(transform).m42 || 0;
		} catch {
			// Fall through to string parsing for older browser/editor runtimes.
		}
	}

	const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
	if (matrix3d) {
		const values = matrix3d[1].split(',').map((value) => Number(value.trim()));
		return Number.isFinite(values[13]) ? values[13] : 0;
	}

	const matrix = transform.match(/^matrix\((.+)\)$/);
	if (matrix) {
		const values = matrix[1].split(',').map((value) => Number(value.trim()));
		return Number.isFinite(values[5]) ? values[5] : 0;
	}

	return 0;
}

/**
 * @param {Object} itemRef            Ref to the `.wpcp-item-inner` element.
 * @param {Object} contentRef         Ref to the content element (only set for content-box).
 * @param {string} contentOrientation Resolved content orientation.
 */
export default function useContentBoxFlowShift(itemRef, contentRef, contentOrientation) {
	useLayoutEffect(() => {
		const itemElement = itemRef.current;
		if (!itemElement) {
			return undefined;
		}

		if (contentOrientation !== 'content-box') {
			itemElement.style.removeProperty('--wpcp-content-box-flow-shift');
			return undefined;
		}

		let animationFrame = 0;
		const updateContentBoxFlowShift = () => {
			const contentElement = contentRef.current;
			if (!contentElement) {
				itemElement.style.removeProperty('--wpcp-content-box-flow-shift');
				return;
			}

			const translateY = getTranslateYPx(contentElement);
			const flowShift = Math.max(0, Math.ceil(-translateY));
			if (flowShift > 0) {
				itemElement.style.setProperty('--wpcp-content-box-flow-shift', `${flowShift}px`);
			} else {
				itemElement.style.removeProperty('--wpcp-content-box-flow-shift');
			}
		};

		const scheduleUpdate = () => {
			if (animationFrame) {
				window.cancelAnimationFrame(animationFrame);
			}
			animationFrame = window.requestAnimationFrame(updateContentBoxFlowShift);
		};

		const contentElement = contentRef.current;

		// Toggling to content-box in the editor animates the -60px lift via the
		// shared 0.3s transform transition. A synchronous measure would then read
		// a mid-transition (near-zero) transform, leaving the flow-shift unset and
		// a reserved gap below each card until some later reflow. Suppress the
		// transition for this first measure so we read the settled lift, then
		// restore it so hover transitions keep animating.
		if (contentElement) {
			const previousTransition = contentElement.style.transition;
			contentElement.style.transition = 'none';
			updateContentBoxFlowShift();
			contentElement.style.transition = previousTransition;
		} else {
			updateContentBoxFlowShift();
		}

		let resizeObserver = null;
		if (typeof ResizeObserver !== 'undefined' && contentRef.current) {
			resizeObserver = new ResizeObserver(scheduleUpdate);
			resizeObserver.observe(contentRef.current);
		}

		return () => {
			if (animationFrame) {
				window.cancelAnimationFrame(animationFrame);
			}
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
			itemElement.style.removeProperty('--wpcp-content-box-flow-shift');
		};
	}, [itemRef, contentRef, contentOrientation]);
}
