/**
 * Cube effect click bridge.
 *
 * Swiper's cube effect rotates each `.swiper-slide` by a multiple of 90deg and
 * counter-rotates the wrapper, so the face on screen ends up frontal. Chromium
 * cannot hit-test a plane that is edge-on in its own parent's coordinate space,
 * so every face whose own `rotateY` is an odd multiple of 90deg (slides 2, 4, 6…)
 * drops out of hit-testing entirely: `elementsFromPoint` over the visible face
 * returns the Swiper container and nothing below it. Clicks therefore never reach
 * the slide's lightbox anchor, card URL, or play icon.
 *
 * Cube shows exactly one slide, so the pointer position plus the active slide's
 * on-screen geometry is enough to resolve what was clicked. When a click lands on
 * the container instead of a slide, walk the active slide and re-dispatch on the
 * deepest element under the pointer; the delegated handlers on the block root
 * (lightbox, card links, video play) then behave as if the face were hittable.
 */

const HIDDEN_DISPLAY = 'none';
const HIDDEN_VISIBILITY = 'hidden';
const NO_POINTER_EVENTS = 'none';

/**
 * Whether an element can receive a pointer at all.
 *
 * @param {HTMLElement} element Candidate element.
 * @return {boolean} True when the element is rendered and accepts pointer events.
 */
function isPointerTarget(element) {
	const style = window.getComputedStyle(element);
	return (
		HIDDEN_DISPLAY !== style.display &&
		HIDDEN_VISIBILITY !== style.visibility &&
		NO_POINTER_EVENTS !== style.pointerEvents &&
		'0' !== style.opacity
	);
}

/**
 * Deepest visible descendant of `slide` whose box contains the given viewport
 * point. Later siblings win over earlier ones, matching paint order.
 *
 * @param {HTMLElement} slide Active slide element.
 * @param {number}      x     Viewport X coordinate.
 * @param {number}      y     Viewport Y coordinate.
 * @return {HTMLElement|null} Resolved element, or null when the point misses.
 */
function deepestElementAt(slide, x, y) {
	let resolved = null;

	const walk = (parent) => {
		Array.prototype.forEach.call(parent.children, function (child) {
			if (!isPointerTarget(child)) {
				return;
			}
			const rect = child.getBoundingClientRect();
			if (!rect.width || !rect.height) {
				return;
			}
			if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
				return;
			}
			resolved = child;
			walk(child);
		});
	};

	walk(slide);
	return resolved;
}

/**
 * Bind the cube click bridge to a Swiper container.
 *
 * Must be called AFTER the Swiper instance is constructed: Swiper's own click
 * handler runs first and calls `stopImmediatePropagation()` while a swipe is in
 * flight, which is what keeps drag-release from being treated as a click here.
 *
 * @param {HTMLElement} swiperEl `.swiper` container running the cube effect.
 */
export function bindCubeFaceClicks(swiperEl) {
	if (!swiperEl || '1' === swiperEl.dataset.wpcpCubeClicksInit) {
		return;
	}
	swiperEl.dataset.wpcpCubeClicksInit = '1';

	swiperEl.addEventListener('click', function (event) {
		if (event.defaultPrevented || 0 !== event.button) {
			return;
		}
		// The face was hittable — let the native target handle it.
		if (event.target.closest('.swiper-slide')) {
			return;
		}
		const slide = swiperEl.querySelector('.swiper-slide-active');
		if (!slide) {
			return;
		}
		const target = deepestElementAt(slide, event.clientX, event.clientY);
		if (!target) {
			return;
		}
		event.preventDefault();
		// Re-dispatch rather than call `click()`: the deepest node under the pointer
		// is often an `<svg>` inside the icon, and `click()` is an HTMLElement method.
		// A dispatched click still runs the anchor's default activation behaviour.
		target.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window,
				clientX: event.clientX,
				clientY: event.clientY,
			})
		);
	});
}
