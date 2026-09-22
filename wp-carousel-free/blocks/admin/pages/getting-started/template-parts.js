import { __ } from '@wordpress/i18n';
import { DocIcon, SupportIcon, LoveIcon } from './icons';

/**
 * Sidebar call-to-action card: an icon beside a heading, one line of supporting
 * copy, and a single outlined link. All three sidebar cards are the same shape,
 * so they share this instead of repeating the markup.
 *
 * @param {Object}   props
 * @param {Function} props.Icon      Icon component rendered beside the title.
 * @param {string}   props.title     Card heading.
 * @param {string}   props.desc      Supporting copy.
 * @param {string}   props.href      Link target.
 * @param {string}   props.linkLabel Link text.
 */
const CtaCard = ({ Icon, title, desc, href, linkLabel }) => (
	<div className="wpcpf-qs-info-card">
		<div className="wpcpf-qs-info-text">
			<div className="wpcpf-qs-info-header">
				<span className="wpcpf-qs-info-icon">
					<Icon />
				</span>
				<h4 className="wpcpf-qs-info-title">{title}</h4>
			</div>
			<p className="wpcpf-qs-info-desc">{desc}</p>
		</div>
		<a href={href} target="_blank" rel="noreferrer" className="wpcpf-qs-info-link">
			{linkLabel}
		</a>
	</div>
);

export const DocumentationCard = () => (
	<CtaCard
		Icon={DocIcon}
		title={__('Documentation', 'wp-carousel-free')}
		desc={__(
			'Explore clear, well-organized documentation to understand features, settings, and get the most out of the plugin.',
			'wp-carousel-free'
		)}
		href="https://docs.wpcarousel.io/guide/introduction"
		linkLabel={__('Browse Now', 'wp-carousel-free')}
	/>
);

export const SupportCard = () => (
	<CtaCard
		Icon={SupportIcon}
		title={__('Technical Support', 'wp-carousel-free')}
		desc={__(
			'Need assistance? Reach out to our expert support team for fast, reliable help with any issues or questions.',
			'wp-carousel-free'
		)}
		href="https://shapedplugin.com/create-new-ticket/"
		linkLabel={__('Get Support', 'wp-carousel-free')}
	/>
);

export const ShowYourLoveCard = () => (
	<CtaCard
		Icon={LoveIcon}
		title={__('Show Your Love', 'wp-carousel-free')}
		desc={__(
			'Leave us a quick review—your feedback helps us improve and serve you better every day with confidence together.',
			'wp-carousel-free'
		)}
		href="https://wordpress.org/support/plugin/wp-carousel-free/reviews/?filter=5"
		linkLabel={__('Rate Us', 'wp-carousel-free')}
	/>
);
