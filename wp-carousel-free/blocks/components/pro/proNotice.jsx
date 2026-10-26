/**
 * Pro notice — the inspector upsell card: title, subtitle, feature list and
 * the upgrade link. Writes no attribute.
 */

import { __ } from '@wordpress/i18n';
import SparkleIcon from './sparkleIcon';
import { getPricingUrl } from './proLinks';
import './editor.scss';

const SpProNotice = ({
	title,
	subtitle = '',
	features = [],
	linkText = __('Upgrade to Pro', 'wp-carousel-free'),
	className = '',
}) => (
	<div className={`wpcp-pro-notice${className ? ` ${className}` : ''}`}>
		<h4 className="wpcp-pro-notice-title">{title}</h4>
		{subtitle && <p className="wpcp-pro-notice-subtitle">{subtitle}</p>}
		{features.length > 0 && (
			<ul className="wpcp-pro-notice-list">
				{features.map((feature) => (
					<li key={feature}>
						<SparkleIcon width={11} height={11} />
						<span>{feature}</span>
					</li>
				))}
			</ul>
		)}
		<a className="wpcp-pro-notice-button" href={getPricingUrl()} target="_blank" rel="noopener noreferrer">
			{linkText}
		</a>
	</div>
);

export default SpProNotice;
