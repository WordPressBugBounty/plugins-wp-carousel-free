import { hasOverlayAnimLayer } from '../utils';

/**
 * Hover-Animation overlay layer (`.wpcp-overlay-anim-layer`), or null when no
 * bundled-Premade overlay effect is active. Mirrors the PHP renderer
 * (`EffectClasses::overlay_anim_layer_html`). Shared by the standard item
 * preview (`CarouselItem`) and the premium slider overlay host
 * (`PremiumImageOverlay`) so both emit identical overlay DOM.
 *
 * @param {Object} props                Component props.
 * @param {Object} props.effectsOptions effectsOptions attribute branch.
 * @return {JSX.Element|null} The overlay layer node, or null when inactive.
 */
export default function OverlayAnimLayer({ effectsOptions = {} }) {
	if (!hasOverlayAnimLayer(effectsOptions)) {
		return null;
	}
	return <div className="wpcp-overlay-anim-layer" aria-hidden="true" />;
}
