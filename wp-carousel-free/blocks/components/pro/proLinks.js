/**
 * Upsell URLs for the Pro teaser UI.
 *
 * The pricing URL comes from `wpcpfBlocks.upgradeUrl` (localized in
 * AssetManager) so a campaign or UTM change never needs a rebuild.
 */

const FALLBACK_PRICING_URL = 'https://wpcarousel.io/pricing/?ref=1';

/**
 * Pricing page URL.
 *
 * @return {string} Upgrade URL.
 */
export function getPricingUrl() {
	if ('undefined' === typeof window) {
		return FALLBACK_PRICING_URL;
	}
	return window.wpcpfBlocks?.upgradeUrl || FALLBACK_PRICING_URL;
}

/**
 * Open the pricing page in a new tab.
 */
export function openPricingPage() {
	if ('undefined' === typeof window) {
		return;
	}
	window.open(getPricingUrl(), '_blank', 'noopener,noreferrer');
}
