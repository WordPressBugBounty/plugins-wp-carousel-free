/**
 * Pro notice — the inspector upsell shown in place of a Pro-only control set.
 *
 * Three presentations, picked by which props are supplied:
 *   features[]   – feature-list card, used as a locked panel's whole body
 *   panelNotice  – centered card with a single message, used as a panel footer
 *   neither      – inline message followed by the upgrade link
 */

import { __ } from '@wordpress/i18n';
import ProIcon from './proIcon';
import SparkleIcon from './sparkleIcon';
import { getPricingUrl } from './proLinks';
import './editor.scss';

const UpgradeLink = ({ className, icon = false, children }) => (
	<a className={className} href={getPricingUrl()} target="_blank" rel="noopener noreferrer">
		{icon && <ProIcon width={16} height={16} />}
		{children}
	</a>
);

const SpProNotice = ({
	title = __('Pro Feature', 'wp-carousel-free'),
	subtitle = '',
	message = '',
	features = [],
	linkText = __('Upgrade to Pro', 'wp-carousel-free'),
	linkButton = false,
	panelNotice = false,
	icon = true,
	className = '',
}) => {
	const rootClassName = `wpcp-pro-notice${className ? ` ${className}` : ''}`;

	if (features.length > 0) {
		return (
			<div className={rootClassName}>
				<div className="wpcp-pro-notice-header">
					{icon && (
						<span className="wpcp-pro-notice-icon">
							<ProIcon />
						</span>
					)}
					<h4 className="wpcp-pro-notice-title">{title}</h4>
				</div>
				{subtitle && <p className="wpcp-pro-notice-subtitle">{subtitle}</p>}
				<ul className="wpcp-pro-notice-list">
					{features.map((feature, index) => (
						<li key={index}>
							<SparkleIcon />
							{feature}
						</li>
					))}
				</ul>
				{linkButton && (
					<UpgradeLink className="wpcp-pro-notice-button" icon>
						{linkText}
					</UpgradeLink>
				)}
			</div>
		);
	}

	if (panelNotice) {
		return (
			<div className={`${rootClassName} is-panel-notice`}>
				<div className="wpcp-pro-notice-header">
					{icon && (
						<span className="wpcp-pro-notice-icon">
							<ProIcon />
						</span>
					)}
					<h4 className="wpcp-pro-notice-title">{title}</h4>
				</div>
				{message && <p className="wpcp-pro-notice-message">{message}</p>}
				<UpgradeLink className="wpcp-pro-notice-button">{linkText}</UpgradeLink>
			</div>
		);
	}

	return (
		<div className={`${rootClassName} is-inline`}>
			{message} <UpgradeLink>{linkText}</UpgradeLink>
		</div>
	);
};

export default SpProNotice;
