import { __ } from '@wordpress/i18n';
import {
	Arrow,
	ArrowRight,
	LogoShowcaseIcon,
	WooGalleryIcon,
	EasyAccordionIcon,
	RealTestimonialIcon,
	WooProductIcon,
	WooCategoryIcon,
	SmartPostIcon,
	SmartTabsIcon,
	SmartSwatch,
	SmartTeam,
	SmartBrand,
	LocationWeatherIcon,
} from './icon';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;

const MORE_PLUGINS = [
	{
		name: 'Easy Accordion',
		description: __(
			'Minimize customer support by offering comprehensive FAQs and increasing conversions.',
			'wp-carousel-free'
		),
		url: 'https://easyaccordion.io/',
		icon: <EasyAccordionIcon />,
	},
	{
		name: 'Real Testimonial',
		description: __(
			'Simply collect, manage, and display testimonials on your website and boost conversions.',
			'wp-carousel-free'
		),
		url: 'https://realtestimonials.io/',
		icon: <RealTestimonialIcon />,
	},
	{
		name: 'Smart Tabs',
		description: __(
			'Best WooCommerce custom product tabs and WordPress tabs builder plugin to create responsive tabs.',
			'wp-carousel-free'
		),
		url: 'https://wptabs.com/',
		icon: <SmartTabsIcon />,
	},
	{
		name: 'Smart Post',
		description: __(
			'Filter and display posts (any post type), pages, taxonomies, custom taxonomies and custom fields in beautiful layouts.',
			'wp-carousel-free'
		),
		url: 'https://wpsmartpost.com/',
		icon: <SmartPostIcon />,
	},
	{
		name: 'Smart Team',
		description: __(
			'Showcase your team members in beautiful, responsive grid and carousel layouts.',
			'wp-carousel-free'
		),
		url: 'https://getwpteam.com/',
		icon: <SmartTeam />,
	},
	{
		name: 'Logo Carousel',
		description: __(
			'Showcase a group of logo images with title, description, tooltips, links and popup as a grid or in a carousel.',
			'wp-carousel-free'
		),
		url: 'https://logocarousel.com/',
		icon: <LogoShowcaseIcon />,
	},
	{
		name: 'Location Weather',
		description: __(
			'Display beautiful weather update widgets on your WordPress site in a minute without coding skills!',
			'wp-carousel-free'
		),
		url: 'https://locationweather.io/',
		icon: <LocationWeatherIcon />,
	},
	{
		name: 'Reno Product Gallery',
		description: __(
			'Product gallery slider and additional variation images gallery for WooCommerce to boost your sales.',
			'wp-carousel-free'
		),
		url: 'https://woogallery.io/',
		icon: <WooGalleryIcon />,
	},
	{
		name: 'Product Slider for WooCommerce',
		description: __(
			'Boost sales with an interactive product slider, grid and table in your WooCommerce store.',
			'wp-carousel-free'
		),
		url: 'https://wooproductslider.io/',
		icon: <WooProductIcon />,
	},
	{
		name: 'Reno Product Category',
		description: __(
			'Display a filtered list of categories aesthetically and boost sales.',
			'wp-carousel-free'
		),
		url: 'https://shapedplugin.com/woocategory/',
		icon: <WooCategoryIcon />,
	},
	{
		name: 'Smart Swatches',
		description: __(
			'The best product variation swatches for WooCommerce to boost your store sales.',
			'wp-carousel-free'
		),
		url: 'https://shapedplugin.com/smart-swatches-for-woocommerce',
		icon: <SmartSwatch />,
	},
	{
		name: 'Smart Brands',
		description: __(
			'Smart Brands for WooCommerce helps you display product brands attractively on your online store.',
			'wp-carousel-free'
		),
		url: 'https://shapedplugin.com/smart-brands/',
		icon: <SmartBrand />,
	},
];

export default function AboutUs() {
	return (
		<section id="about-us-tab" className="wpcpf-about-page">
			<div className="wpcpf-about-box">
				<div className="wpcpf-about-info">
					<h3>
						{__('All-In-One Carousel, Slider, & Gallery Solution from', 'wp-carousel-free')}{' '}
						<span className="wpcpf-highlight-text">{__('WP Carousel Team', 'wp-carousel-free')}</span>
					</h3>
					<p>
						{__('At', 'wp-carousel-free')} <b>{__('ShapedPlugin LLC', 'wp-carousel-free')}</b>
						{__(
							', back in 2016, while building WordPress websites for clients and partners, we struggled to find a simple, flexible, and reliable way to showcase real customer feedback. Existing solutions lacked the design quality, usability, and customization we needed—so we decided to build our own.',
							'wp-carousel-free'
						)}
					</p>
					<p>
						<b>{__('WP Carousel', 'wp-carousel-free')}</b>{' '}
						{__(
							'was created to provide a powerful yet easy way to display authentic reviews using carousels, sliders, grids, stacked cards, and modern layouts. It helps you build trust, boost credibility, and showcase social proof effortlessly—we’re confident you’ll love the experience.',
							'wp-carousel-free'
						)}
					</p>
					<div className="wpcpf-video-section-btn">
						<ul>
							<li>
								<a
									target="_blank"
									rel="noreferrer"
									href="https://wpcarousel.io/"
									className="wpcpf-medium-btn"
								>
									{__('Explore WP Carousel', 'wp-carousel-free')}
								</a>
							</li>
							<li>
								<a
									target="_blank"
									rel="noreferrer"
									href="https://shapedplugin.com/about-us/"
									className="wpcpf-medium-btn wpcpf-arrow-btn"
								>
									{__('More About Us', 'wp-carousel-free')} <Arrow />
								</a>
							</li>
						</ul>
					</div>
				</div>
				<div className="wpcpf-about-img">
					<img
						src={`${wpcpf?.pluginUrl || ''}src/Admin/img/team.jpg`}
						alt={__('The ShapedPlugin team', 'wp-carousel-free')}
						height="402"
						width="610"
					/>
					<span>{__('The Creative Minds Behind the WP Carousel Plugin', 'wp-carousel-free')}</span>
				</div>
			</div>

			<div className="wpcpf-more-plugins-section">
				<div className="wpcpf-more-plugins-header">
					<h2 className="wpcpf-more-plugins-title">
						{__('Enhance your Website with our Free Robust Plugins', 'wp-carousel-free')}
					</h2>
					<p className="wpcpf-more-plugins-subtitle">
						{__(
							'Some of our powerful premium plugins are ready to make your website awesome.',
							'wp-carousel-free'
						)}
					</p>
				</div>
				<div className="wpcpf-more-plugins-grid">
					{MORE_PLUGINS.map((plugin) => (
						<a
							key={plugin.name}
							href={plugin.url}
							target="_blank"
							rel="noopener noreferrer"
							className="wpcpf-plugin-card"
						>
							<div className="wpcpf-plugin-card-icon">{plugin.icon}</div>
							<div className="wpcpf-plugin-card-content">
								<h3 className="wpcpf-plugin-card-title">{plugin.name}</h3>
								<p className="wpcpf-plugin-card-desc">{plugin.description}</p>
							</div>
							<span className="wpcpf-plugin-card-arrow">
								<ArrowRight />
							</span>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
