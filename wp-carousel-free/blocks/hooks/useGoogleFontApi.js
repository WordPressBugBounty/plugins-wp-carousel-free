import { googleFonts } from './googleFontsData.js';

/**
 * Provides the Google Fonts list for the editor typography control.
 *
 * The list ships as a static snapshot (./googleFontsData) rather than being
 * fetched at runtime, so the Font Family dropdown always populates regardless
 * of network availability. The snapshot mirrors the canonical PHP list used by
 * the classic admin typography field.
 */
const useGoogleFonts = () => ({ googleFonts });

export default useGoogleFonts;
