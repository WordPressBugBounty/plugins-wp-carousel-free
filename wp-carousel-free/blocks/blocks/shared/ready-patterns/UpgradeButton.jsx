/**
 * Insert replacement shown on a Pro-tier pattern.
 *
 * Free lists and previews every pattern in the library but inserts only the free
 * ones, so the Insert control becomes an upgrade link rather than disappearing —
 * the card keeps its shape and the grid never reflows between tiers.
 *
 * @param {Object} props
 * @param {string} [props.label] Overrides the default 'Pro' label.
 */

import { __ } from '@wordpress/i18n';
import ProIcon from '@wp-carousel-pro/components/pro/proIcon';
import { getPricingUrl } from '@wp-carousel-pro/components/pro/proLinks';

export default function UpgradeButton({ label }) {
	return (
		<a
			className="wpcp-ready-patterns-upgrade-btn"
			href={getPricingUrl()}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={__('Upgrade to Pro to use this pattern', 'wp-carousel-free')}
		>
			<ProIcon width={14} height={14} />
			{label || __('Pro', 'wp-carousel-free')}
		</a>
	);
}
