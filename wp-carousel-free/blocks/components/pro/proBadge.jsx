/**
 * Pro badge — the pill drawn over a locked preset card.
 *
 * Sits inside a `.wpcp-pro-locked` card; the card's hover state reveals it and
 * dims the preview underneath. Optionally shows a "Demo" pill above the PRO
 * pill when the feature has a demo page.
 *
 * `iconOnly` drops the "PRO" text and pins a crown-only pill to the card's
 * corner, always visible — for tiles too small to hold the full pill (the
 * Arrow Style and Pagination Style pickers).
 */

import { __ } from '@wordpress/i18n';
import ProIcon from './proIcon';
import { getPricingUrl } from './proLinks';
import './editor.scss';

const stopPropagation = (event) => event.stopPropagation();

const ProBadge = ({
	demoLink = '',
	label = __('PRO', 'wp-carousel-free'),
	iconOnly = false,
	isStatic = false,
	className = '',
}) => {
	// Inside a <button> the pill must not be a link — the parent's own click
	// handler opens the pricing page instead.
	if (isStatic) {
		return (
			<span
				className={`wpcp-pro-badge${iconOnly ? ' wpcp-pro-badge--icon-only' : ''}${
					className ? ` ${className}` : ''
				}`}
			>
				<span className="wpcp-pro-badge-link">
					<ProIcon width={14} height={14} />
					{!iconOnly && label}
				</span>
			</span>
		);
	}

	return (
		<span
			className={`wpcp-pro-badge${iconOnly ? ' wpcp-pro-badge--icon-only' : ''}${
				className ? ` ${className}` : ''
			}`}
		>
			{demoLink && (
				<a
					className="wpcp-pro-badge-demo"
					href={demoLink}
					target="_blank"
					rel="noopener noreferrer"
					onClick={stopPropagation}
				>
					{__('Demo', 'wp-carousel-free')}
				</a>
			)}
			<a
				className="wpcp-pro-badge-link"
				aria-label={label}
				href={getPricingUrl()}
				target="_blank"
				rel="noopener noreferrer"
				onClick={stopPropagation}
			>
				<ProIcon width={14} height={14} />
				{!iconOnly && label}
			</a>
		</span>
	);
};

export default ProBadge;
