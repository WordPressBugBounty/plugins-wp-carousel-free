/**
 * Hover Animations — shared effect-class + gating logic.
 *
 * Single source of truth, mirrored 1:1 by `src/Blocks/Rendering/EffectClasses.php`
 * so the editor preview (`CarouselItem.jsx`) and the PHP frontend renderer emit
 * identical effect classes and overlay DOM. Keeping the gating and class strings
 * in one place prevents JS↔PHP drift.
 *
 * Class contract (see `docs/hover-animations-implementation.md`):
 *   - `wpcp-hover-{imageHover}`        on `.wpcp-item-inner` (Custom mode only)
 *   - `wpcp-anim-{animationEffect}`    on `.wpcp-item-inner` (Premade mode)
 *   - `wpcp-overlay-anim-{overlayEffect}` (+ `wpcp-has-overlay-anim`) on `.wpcp-item-inner` (gated)
 *   - `wpcp-content-anim-{contentAnimation}` on `.wpcp-item-content` (gated)
 */

const isActiveEffect = (value) => typeof value === 'string' && value !== '' && value !== 'none';

const isCustom = (effectsOptions) => (effectsOptions || {}).effectType === 'custom';

/**
 * Orientations where the text content overlays the media and is sensibly hidden
 * until hover. The single source of truth for "Display Content on Hover Only"
 * and the Content-axis hover reveal — consumed by the inspector panel, the
 * editor preview, and the PHP renderer (mirrored in EffectClasses.php) so every
 * site honors the same set. Classic (below-image flow) is intentionally excluded.
 */
export const CONTENT_HOVER_ORIENTATIONS = ['overlay', 'diagonal'];

/**
 * Whether an orientation supports the hover-reveal content behavior.
 *
 * @param {string} contentOrientation Resolved content orientation.
 * @return {boolean} Whether the orientation overlays content and hides it until hover.
 */
export function isContentHoverOrientation(contentOrientation) {
	return CONTENT_HOVER_ORIENTATIONS.includes(contentOrientation);
}

/**
 * The Content axis animates the overlay TEXT reveal, so it applies only to the
 * overlay-style orientations (overlay/diagonal) AND when the content is revealed
 * on hover (Display Content on Hover Only). Image Hover, Premade, and Overlay are
 * exempt — the Overlay axis is a self-contained layer that animates in on hover
 * (matching the source "Image Overlay Hover Effects"), independent of the content
 * reveal.
 *
 * @param {string}  contentOrientation Resolved content orientation.
 * @param {boolean} displayOnHover     contentOptions.displayOnHover.
 * @return {boolean} Whether the Content axis is active.
 */
export function isOverlayContentGateOpen(contentOrientation, displayOnHover) {
	return isContentHoverOrientation(contentOrientation) && displayOnHover === true;
}

/**
 * Normalize a stored or registered block name to the short slug
 * (`slider`, `thumbnails-slider`, …).
 *
 * @param {string} blockName Block name or `wp-carousel-pro/{slug}`.
 * @return {string} Short block slug.
 */
export function normalizeBlockName(blockName) {
	return String(blockName || '').replace(/^wp-carousel-pro\//, '');
}

/**
 * Blocks that show one active slide at a time (Slider / Thumbnails-Slider).
 * Their Effects panel is hidden, so per-item hover effects are suppressed.
 * Mirrored in EffectClasses.php.
 *
 * @param {string} blockName Block name.
 * @return {boolean} Whether the block is a one-slide-at-a-time slider.
 */
function isOneSlideBlock(blockName) {
	const name = normalizeBlockName(blockName);
	return 'slider' === name || 'thumbnails-slider' === name;
}

/**
 * Effect classes for `.wpcp-item-inner` (image hover + premade + overlay). The
 * Overlay axis is self-contained — it renders an overlay layer that animates in
 * on hover in any orientation, so it is NOT subject to the content-reveal gate.
 *
 * @param {Object} effectsOptions effectsOptions attribute branch.
 * @param {string} [blockName]    Block name — suppresses the image-hover axis
 *                                for the one-slide slider blocks (their Effects
 *                                panel is hidden, so the default zoom would be
 *                                uncontrollable).
 * @return {string[]} Effect class list.
 */
export function effectInnerClasses(effectsOptions = {}, blockName = '') {
	const eo = effectsOptions || {};
	const classes = [];
	const premadeActive = !isCustom(eo) && isActiveEffect(eo.animationEffect);

	// Image hover is scoped to Custom mode only. Keep stored values intact when the
	// user switches to Premade so returning to Custom restores the previous choice.
	if (isCustom(eo) && !isOneSlideBlock(blockName)) {
		classes.push(`wpcp-hover-${eo.imageHover || 'zoom'}`);
	}

	// Premade composite — its own mode, ungated.
	if (premadeActive) {
		classes.push(`wpcp-anim-${eo.animationEffect}`);
	}

	// Overlay — Custom mode, self-contained (animates an overlay layer in on
	// hover, like the source artifact); works in any orientation, ungated.
	if (isCustom(eo) && isActiveEffect(eo.overlayEffect)) {
		classes.push('wpcp-has-overlay-anim', `wpcp-overlay-anim-${eo.overlayEffect}`);
	}

	return classes;
}

/**
 * Content-animation class for `.wpcp-item-content` (Custom mode, gated).
 *
 * @param {Object}  effectsOptions          effectsOptions attribute branch.
 * @param {Object}  gate                    Gating context.
 * @param {string}  gate.contentOrientation Resolved content orientation.
 * @param {boolean} gate.displayOnHover     contentOptions.displayOnHover.
 * @return {string} Content class, or '' when inactive/gated.
 */
export function effectContentClass(effectsOptions = {}, gate = {}) {
	const { contentOrientation = 'image-top', displayOnHover = false } = gate;
	const eo = effectsOptions || {};
	if (
		isCustom(eo) &&
		isActiveEffect(eo.contentAnimation) &&
		isOverlayContentGateOpen(contentOrientation, displayOnHover)
	) {
		return `wpcp-content-anim-${eo.contentAnimation}`;
	}
	return '';
}

/**
 * Whether an animated overlay layer (`.wpcp-overlay-anim-layer`) should render —
 * true whenever a Custom-mode overlay effect is selected (self-contained, ungated).
 *
 * @param {Object} effectsOptions effectsOptions attribute branch.
 * @return {boolean} Whether to render the overlay layer.
 */
export function hasOverlayAnimLayer(effectsOptions = {}) {
	const eo = effectsOptions || {};
	return isCustom(eo) && isActiveEffect(eo.overlayEffect);
}
