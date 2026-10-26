/**
 * 3D Carousel staging math — Coverflow's slide placement.
 *
 * The editor preview and the frontend runtime each wrap this in a Swiper effect
 * module (`carousel-render/layouts/carousel3d/effectCarousel3d.js` and
 * `frontend/carousel/carousel3dEffect.js`); both call `carousel3dSlideState()`
 * per slide on every `progress` tick, so the two contexts stage identically.
 *
 * Deliberately free of `@wordpress/*` and Swiper imports: the frontend bundle,
 * the editor bundle and plain Node (`tests/__tests__`) all read it.
 *
 * Slide progress is Swiper's: 0 on the active slide, +1 on the one before it,
 * -1 on the one after, and fractional while a drag is in flight. Everything
 * below is continuous in that value so dragging stays smooth.
 */

import {
	CAROUSEL_3D_FREE_STYLE,
	CAROUSEL_3D_SIDE_ITEMS,
	CAROUSEL_3D_STAGING,
	carousel3dDeviceKey,
	resolveCarousel3dSideItems,
} from '../constants/carousel3d';

/** Scales the unitless depth strength to pixels: 59 → 295px per step. */
export const CAROUSEL_3D_DEPTH_SCALE = 5;

/**
 * Coverflow authors every distance against a 200px-wide card and multiplies by
 * the card it actually draws, so the fan keeps its shape at any card width.
 */
export const CAROUSEL_3D_REFERENCE_WIDTH = 200;

/** Puts the camera at four card widths at the default perspective of 80. */
export const CAROUSEL_3D_PERSPECTIVE_NORMALIZED_SCALE = 10;

/** Room the stage keeps above and below a card, as a share of its height. */
export const CAROUSEL_3D_STAGE_ROOM_RATIO = 0.08;

/**
 * The card's width against the 200px reference card.
 *
 * @param {number} slideSize Slide width in px.
 * @return {number} Multiplier for a reference-authored distance.
 */
export function carousel3dSizeRatio(slideSize) {
	const width = Math.max(0, toNumber(slideSize, 0));

	return 0 < width ? width / CAROUSEL_3D_REFERENCE_WIDTH : 1;
}

/**
 * The staging numbers for one device.
 *
 * The staging rows are fixed; only Side Items is read off `layoutOptions`. The
 * frontend gets the same bag pre-resolved through `data-wpcp`, built by
 * `ConfigBuilder::build_carousel_3d_config()`.
 *
 * @param {Object} layoutOptions Block `layoutOptions`.
 * @param {string} deviceType    `Desktop`, `Tablet` or `Mobile`.
 * @return {Object} Params for `carousel3dSlideState()`.
 */
export function carousel3dParamsFor(layoutOptions = {}, deviceType = 'Desktop') {
	const device = 'Tablet' === deviceType || 'Mobile' === deviceType ? deviceType : 'Desktop';

	return {
		style: CAROUSEL_3D_FREE_STYLE,
		sideItems: resolveCarousel3dSideItems(
			layoutOptions[carousel3dDeviceKey('sideItems', device)],
			CAROUSEL_3D_SIDE_ITEMS.default[device]
		),
		...CAROUSEL_3D_STAGING,
	};
}

/**
 * Rotation ramps in over the first step, then holds, so the active slide stays square on.
 *
 * @param {number} distance Absolute slide progress.
 * @return {number} A factor between 0 and 1.
 */
function stepRamp(distance) {
	return 1 > distance ? distance : 1;
}

function toNumber(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function clampUnit(value) {
	return Math.min(1, Math.max(0, value));
}

/**
 * The stage's perspective in pixels, or 0 when disabled.
 *
 * @param {number} sidesPerspective Perspective strength.
 * @param {number} [slideSize]      Measured card width.
 * @return {number} Perspective in px, 0 when disabled.
 */
export function carousel3dPerspectivePx(sidesPerspective, slideSize = 0) {
	const strength = Math.max(0, toNumber(sidesPerspective, CAROUSEL_3D_STAGING.sidesPerspective));

	if (0 >= strength) {
		return 0;
	}

	return strength * CAROUSEL_3D_PERSPECTIVE_NORMALIZED_SCALE * carousel3dSizeRatio(slideSize);
}

/**
 * How far back one step of depth pushes a slide.
 *
 * @param {number} slidesDepth Depth strength.
 * @return {number} Depth per step in px.
 */
export function carousel3dDepthPx(slidesDepth) {
	return Math.max(0, toNumber(slidesDepth, CAROUSEL_3D_STAGING.slidesDepth)) * CAROUSEL_3D_DEPTH_SCALE;
}

/**
 * Distance from the centered slide out to the slide `distance` steps away: the
 * first step is the center distance, every later step the spacing.
 *
 * @param {number} distance           Absolute slide progress.
 * @param {number} centerItemDistance First-step distance in px.
 * @param {number} sideSlidesSpacing  Distance between later steps in px.
 * @return {number} Offset in px.
 */
function sideOffsetPx(distance, centerItemDistance, sideSlidesSpacing) {
	return 1 >= distance
		? distance * centerItemDistance
		: centerItemDistance + (distance - 1) * sideSlidesSpacing;
}

/**
 * Where a slide sits round a looping carousel, in steps, measured the short way.
 *
 * @param {number} progress   Swiper slide progress.
 * @param {number} slideCount Items in the carousel.
 * @return {number} Steps from the centered card, negative to the left.
 */
export function carousel3dRingProgress(progress, slideCount) {
	const items = Math.max(1, toNumber(slideCount, 0));
	const steps = toNumber(progress, 0);
	const wrapped = ((steps % items) + items) % items;

	return wrapped > items / 2 ? wrapped - items : wrapped;
}

/**
 * Where one slide sits on the stage.
 *
 * The slides either side step away from the centered one, sink back, and turn
 * to face it. Swiper counts the slide before the active one as +1, and that
 * slide belongs on the left of the stage, so the screen side is the sign flipped.
 *
 * @param {Object}  args            Placement inputs.
 * @param {Object}  args.params     Resolved effect params for the active device.
 * @param {number}  args.progress   Swiper slide progress.
 * @param {number}  args.slideSize  Slide width in px.
 * @param {number}  args.slideCount Items in the carousel.
 * @param {boolean} [args.loop]     Whether Swiper is looping.
 * @return {{x: number, y: number, z: number, rotateX: number, rotateY: number, tilt: number, opacity: number, zIndex: number, origin: string, wash: number, washSide: number}}
 *   The slide's placement.
 */
export function carousel3dSlideState({ params, progress, slideSize, slideCount, loop = false }) {
	// A looping Swiper moves the real slides, so each card is placed the short way round.
	const flankProgress = loop ? carousel3dRingProgress(progress, slideCount) : progress;
	const flankDistance = Math.abs(flankProgress);
	const centerItemDistance = Math.max(
		0,
		toNumber(params.centerItemDistance, CAROUSEL_3D_STAGING.centerItemDistance)
	);
	const sideSlidesSpacing = Math.max(
		0,
		toNumber(params.sideSlidesSpacing, CAROUSEL_3D_STAGING.sideSlidesSpacing)
	);
	const sizeRatio = carousel3dSizeRatio(slideSize);
	const side = 0 < flankProgress ? -1 : 1;
	const offset = sideOffsetPx(flankDistance, centerItemDistance, sideSlidesSpacing) * sizeRatio;
	const depth =
		sideOffsetPx(
			flankDistance,
			carousel3dDepthPx(params.slidesDepth),
			carousel3dDepthPx(params.slidesDepthSpacing)
		) * sizeRatio;
	const turn =
		stepRamp(flankDistance) *
		Math.max(0, toNumber(params.sidesYRotation, CAROUSEL_3D_STAGING.sidesYRotation));
	// The card straight across the loop fades out over the half step where it changes flanks.
	const crossing = loop ? clampUnit((toNumber(slideCount, 0) / 2 - flankDistance) * 2) : 1;

	return {
		x: side * offset,
		y: 0,
		z: -depth,
		rotateX: 0,
		rotateY: -side * turn,
		tilt: 0,
		opacity: carousel3dSideOpacity(flankDistance, params.sideItems) * crossing,
		zIndex: 1000 - Math.round(flankDistance * 10),
		origin: 'center center',
		wash: stepRamp(flankDistance),
		washSide: side,
	};
}

/**
 * How visible a slide is under the Side Items count; the one past the count
 * fades out across a single step, and `all` keeps every slide.
 *
 * @param {number}        distance  Absolute slide progress.
 * @param {number|string} sideItems Side Items for the device.
 * @return {number} Opacity between 0 and 1.
 */
export function carousel3dSideOpacity(distance, sideItems) {
	const count = Number(sideItems);

	if (!Number.isFinite(count) || 0 >= count) {
		return 1;
	}
	if (distance <= count) {
		return 1;
	}
	return Math.max(0, count + 1 - distance);
}

/**
 * The CSS transform for a staged slide.
 *
 * @param {Object} state Result of `carousel3dSlideState()`.
 * @return {string} A `transform` value.
 */
export function carousel3dTransform(state) {
	return (
		`rotateX(${state.tilt}deg)` +
		` translate3d(${state.x}px, ${state.y}px, ${state.z}px)` +
		` rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg)`
	);
}
