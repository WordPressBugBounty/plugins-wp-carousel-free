import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import ProIcon from '../../../components/pro/proIcon';
import InfoIcon from '../../../components/infoIcon/infoIcon';
import Testimonial from './testimonial';

const CheckIcon = () => (
	<svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M3.5 9.5 7 13l7.5-8"
			stroke="#00ba37"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const CloseIcon = () => (
	<svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M4.5 4.5l9 9M13.5 4.5l-9 9"
			stroke="#f2545b"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

// Row shape follows Easy Accordion's comparison table: `free`/`pro` is 'yes',
// 'no', a number (rendered bold) or any other string passed through verbatim,
// with independent `new` / `hot` / `info` flags per row.
//
// Content covers both subsystems: the Classic `[sp_wpcarousel]` shortcode rows
// first, then the Gutenberg block module. Every count is the number of options
// the plugin actually renders, read off the Classic metabox config and the
// block inspector rather than off marketing copy.
const FEATURES = [
	/* Classic ([sp_wpcarousel] shortcode) comparison — temporarily hidden so the
	 * page shows only the Gutenberg block comparison. The rows are unchanged;
	 * restore them by deleting this opening marker and the closing one below.

	{
		title: __('All Free Version Features', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
	},
	{
		title: __(
			'Content Source Types (Images, Posts, Products, Videos, Audios, Content, Mix, External)',
			'wp-carousel-free'
		),
		free: 4,
		pro: 8,
	},
	{
		title: __(
			'Layout Presets (Carousel, Slider, Grid, Thumbnails Slider, Tiles, Masonry, Justified)',
			'wp-carousel-free'
		),
		free: 3,
		pro: 7,
	},
	{
		title: __(
			'Item/Card Styles (Default, Caption, Overlay, Diagonal, Content Box, Moving)',
			'wp-carousel-free'
		),
		free: 1,
		pro: 7,
	},
	{
		title: __('Item Content Positions', 'wp-carousel-free'),
		free: 2,
		pro: 23,
	},
	{
		title: __('Floating or Moving Content/Caption Styles', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __(
			'Display Posts, Pages from Custom Post Types, Taxonomies, Custom Taxonomies',
			'wp-carousel-free'
		),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __(
			'Filtering Products (Latest, Featured, Categories, Specific, On Sale)',
			'wp-carousel-free'
		),
		free: 2,
		pro: 5,
	},
	{
		title: __(
			'Supported Video Platforms (YouTube, Vimeo, TikTok, Twitch, Dailymotion, Wistia, SproutVideo, Bunny CDN, Self-hosted)',
			'wp-carousel-free'
		),
		free: 1,
		pro: 9,
	},
	{
		title: __('Supported Audio Sources (Embed Audio & Self-hosted)', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Create External (RSS & YouTube Feeds) & Mix-Content Carousel', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __(
			'Carousel Modes (Standard, Center, Ticker, Multi-Row, 3D, Panorama, Triple, Spring)',
			'wp-carousel-free'
		),
		free: 2,
		pro: 8,
	},
	{
		title: __('Items in Random Order', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
	},
	{
		title: __('Item Click Action Types (Lightbox, Link, None)', 'wp-carousel-free'),
		free: 2,
		pro: 3,
	},
	{
		title: __('Scheduling Carousel/Gallery at Specific Time Intervals', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __(
			'Multiple Ajax Pagination Types (Number, Load More, Infinite) & Items Per Page/Click',
			'wp-carousel-free'
		),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Items Vertical Alignment', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
	},
	{
		title: __('Content Vertical Alignment and Equal Height for All the Items', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __(
			'Overlay Content Styles (Visibility, 14 Animations, Solid & Gradient Background)',
			'wp-carousel-free'
		),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Items Inner Padding, Content Box Padding, & Custom Background', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Show Item Title/Caption', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
	},
	{
		title: __('Item Description (Full, Word Limit, Read More)', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Show WooCommerce Brands & Quick View Button', 'wp-carousel-free'),
		free: 'yes',
		pro: 'no',
	},
	{
		title: __('Image Custom Dimensions and Retina (2x) Support', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Image Lazy Load', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
	},
	{
		title: __('Specific Image Height for Responsive Devices & Variable Width', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Image Grayscale Modes and Custom Color', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Apply Watermark and Image Protection (Disabling Right-click)', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Responsive Lightbox Gallery Options for Images', 'wp-carousel-free'),
		free: 4,
		pro: 30,
	},
	{
		title: __(
			'Carousel Settings (Autoplay, Speed, Pause on Hover, Loop, RTL, Swipe, Free Mode)',
			'wp-carousel-free'
		),
		free: 'yes',
		pro: 'yes',
	},
	{
		title: __('Navigation Arrow Styles', 'wp-carousel-free'),
		free: 2,
		pro: 8,
	},
	{
		title: __('Navigation Arrow Positions', 'wp-carousel-free'),
		free: 2,
		pro: 9,
	},
	{
		title: __(
			'Pagination Styles (Bullets, Dynamic, Strokes, Scrollbar, Fraction, Numbers)',
			'wp-carousel-free'
		),
		free: 2,
		pro: 6,
	},
	{
		title: __('Slide to Scroll, Adaptive Height & Navigation Background', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Multi-Row Carousels and Vertical Carousel Orientation', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('WebGL Shader Slider Effects (Classic)', 'wp-carousel-free'),
		free: 'no',
		pro: 19,
	},
	{
		title: __('Stylize your Carousel/Gallery Typography with 1000+ Google Fonts', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	*/

	{
		title: __('All Free Version Features', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
	},
	{
		title: __(
			'Gutenberg Blocks (Carousel, Slider, Thumbnails Slider, Tiles, Marquee, Panorama, Gallery Filter, Ajax Search)',
			'wp-carousel-free'
		),
		free: 4,
		pro: 9,
		new: true,
		hot: true,
	},
	{
		title: __(
			'Content Sources (Images, Videos, Posts, Products, Audio, External Feeds)',
			'wp-carousel-free'
		),
		free: 4,
		pro: 6,
	},
	{
		title: __(
			'Video Providers (YouTube, Vimeo, TikTok, Twitch, Dailymotion, Wistia, and more)',
			'wp-carousel-free'
		),
		free: 2,
		pro: 12,
	},
	{
		title: __('Display Posts from Any Post Type & Custom Post Types', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
		new: true,
	},
	{
		title: __(
			'Advanced Query Filters (Taxonomy, Date Range, Author, Best Selling, On Sale, Specific Items)',
			'wp-carousel-free'
		),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Mix-Content Carousel', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __(
			'Carousel Styles (Standard, Center, Multi-Row, Triple, Spring, Partial View)',
			'wp-carousel-free'
		),
		free: 2,
		pro: 6,
	},
	{
		title: __(
			'Slider Layouts (Slide, Flip, Cube, Coverflow, Fade, Super Flow, Shaders, Ken Burns, Fashion)',
			'wp-carousel-free'
		),
		free: 4,
		pro: 11,
		new: true,
		hot: true,
	},
	{
		title: __('WebGL Shader Slider Effects', 'wp-carousel-free'),
		free: 'no',
		pro: 20,
		new: true,
	},
	{
		title: __(
			'Thumbnails Slider Layouts (Thumb Bottom, Thumb Overlay, Slidable Menu, Spotlight Thumb)',
			'wp-carousel-free'
		),
		free: 1,
		pro: 4,
	},
	{
		title: __('Tiles Layout Presets', 'wp-carousel-free'),
		free: 3,
		pro: 9,
	},
	{
		title: __('Masonry & Justified Gallery Layouts', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Gallery Filter & Ajax Search', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
		new: true,
		hot: true,
	},
	{
		title: __(
			'Carousel Settings (Autoplay, Speed, Pause on Hover, Infinite Loop, RTL, Swipe, Free Mode)',
			'wp-carousel-free'
		),
		free: 'yes',
		pro: 'yes',
	},
	{
		title: __('Adaptive Height', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Vertical Carousel Orientation', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Navigation Arrow Styles & Positions', 'wp-carousel-free'),
		free: 1,
		pro: 12,
	},
	{
		title: __(
			'Pagination Styles (Dots, Dynamic, Stepper, Strokes, Scrollbar, Fraction, Numbers)',
			'wp-carousel-free'
		),
		free: 3,
		pro: 7,
	},
	{
		title: __('Ajax Pagination with Load More & Infinite Scroll', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
		new: true,
	},
	{
		title: __(
			'Content Orientations (Overlay, Image Top, Diagonal, Content Box, Fly Content)',
			'wp-carousel-free'
		),
		free: 3,
		pro: 5,
	},
	{
		title: __('Title & Description Length Control (Full, Limited, Read More)', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Content Vertical Alignment & Equal Height for All Items', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Taxonomy Display Types (Category, Tag, Both) & Positions', 'wp-carousel-free'),
		free: 2,
		pro: 3,
	},
	{
		title: __('Click Action Types (Lightbox, Link, Both, Disable)', 'wp-carousel-free'),
		free: 2,
		pro: 4,
	},
	{
		title: __('Hover Animations & Image, Overlay, Content Effects', 'wp-carousel-free'),
		free: 5,
		pro: 16,
		new: true,
		hot: true,
	},
	{
		title: __('Motion Effects — Entrance Animations', 'wp-carousel-free'),
		free: 'no',
		pro: 29,
		new: true,
		hot: true,
	},
	{
		title: __(
			'Visibility & Scheduling (Public, Password, Private, Start/End Date)',
			'wp-carousel-free'
		),
		free: 'no',
		pro: 'yes',
		new: true,
	},
	{
		title: __('Custom Image Dimensions, Aspect Ratio & Retina (2x) Support', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __(
			'Image Filters (Grayscale, Blur, Brightness, Contrast, Saturation, Hue)',
			'wp-carousel-free'
		),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Responsive Image Height & Variable Width Items', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Image & Text Watermark and Right Click Protection', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
		new: true,
	},
	{
		title: __('Social Share (14 Networks)', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
		new: true,
		hot: true,
	},
	{
		title: __('Lightbox Module for Blocks', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
		new: true,
		hot: true,
	},
	{
		title: __('Lightbox Slideshow, Toolbar & Social Share', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Show WooCommerce Brands & Quick View Button', 'wp-carousel-free'),
		free: 'yes',
		pro: 'no',
	},
	{
		title: __('Ready Patterns Library', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
		new: true,
		hot: true,
	},
	{
		title: __('Saved Templates (Convert Blocks to Shortcodes)', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
		new: true,
	},
	{
		title: __(
			'Page Builder Integrations (Elementor, Divi, WPBakery, Oxygen, Beaver, Bricks)',
			'wp-carousel-free'
		),
		free: 'yes',
		pro: 'yes',
		new: true,
	},
	{
		title: __('Block Typography with Google Fonts', 'wp-carousel-free'),
		free: 'yes',
		pro: 'yes',
		new: true,
		hot: true,
	},
	{
		title: __('All Premium Features, Security Enhancements, and Compatibility', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
	{
		title: __('Priority Top-notch Support', 'wp-carousel-free'),
		free: 'no',
		pro: 'yes',
	},
];

/**
 * One Free/Pro cell. A number reads as a count and is emphasised; 'yes' and 'no'
 * become the tick and cross; anything else is passed through as written, which
 * is how values like '10+' render.
 *
 * @param {Object}        props
 * @param {string|number} props.value Cell value from the FEATURES row.
 * @return {JSX.Element} Rendered cell content.
 */
const Cell = ({ value }) => {
	if ('number' === typeof value) {
		return <b>{value}</b>;
	}
	if ('yes' === value) {
		return <CheckIcon />;
	}
	if ('no' === value) {
		return <CloseIcon />;
	}
	return <b>{value}</b>;
};

export default function LiteVsPro() {
	return (
		<div className="wpcpf-lite-vs-pro-page">
			<div className="wpcpf-lite-vs-pro-card">
				<div className="wpcpf-lite-vs-pro-title">
					<div className="wpcpf-lite-vs-pro-title-text">
						<h2>{__('Lite vs Pro Comparison', 'wp-carousel-free')}</h2>
						<p>
							{__('Get WP Carousel Pro today and unlock all the powerful features', 'wp-carousel-free')}
						</p>
					</div>
					<a
						target="_blank"
						rel="noopener noreferrer"
						href="https://wpcarousel.io/pricing/?ref=1"
						className="wpcpf-lite-vs-pro-cta"
					>
						<ProIcon width={18} height={18} />
						{__('Upgrade to Pro Now!', 'wp-carousel-free')}
					</a>
				</div>

				<div className="wpcpf-lite-vs-pro-table">
					<div className="wpcpf-lite-vs-pro-row wpcpf-lite-vs-pro-row-header">
						<span className="wpcpf-lite-vs-pro-feature">{__('Features', 'wp-carousel-free')}</span>
						<span className="wpcpf-lite-vs-pro-free">{__('Free', 'wp-carousel-free')}</span>
						<span className="wpcpf-lite-vs-pro-pro">
							<ProIcon width={18} height={18} />
							{__('Pro', 'wp-carousel-free')}
						</span>
					</div>
					{FEATURES.map((row) => (
						<div key={row.title} className="wpcpf-lite-vs-pro-row">
							<span className="wpcpf-lite-vs-pro-feature">
								{row.title}
								{row.info && <InfoIcon tooltip={row.info} label={row.info} />}
								{row.new && (
									<span className="wpcpf-lite-vs-pro-badge wpcpf-lite-vs-pro-badge--new">
										{__('New', 'wp-carousel-free')}
									</span>
								)}
								{row.hot && (
									<span className="wpcpf-lite-vs-pro-badge wpcpf-lite-vs-pro-badge--hot">
										{__('Hot', 'wp-carousel-free')}
									</span>
								)}
							</span>
							<span className="wpcpf-lite-vs-pro-free">
								<Cell value={row.free} />
							</span>
							<span className="wpcpf-lite-vs-pro-pro">
								<Cell value={row.pro} />
							</span>
						</div>
					))}
				</div>
			</div>

			<div className="wpcpf-lite-vs-pro-cta-section">
				<div className="wpcpf-lite-vs-pro-cta-content">
					<h2>{__('Upgrade To PRO & Enjoy Advanced Features!', 'wp-carousel-free')}</h2>
					<p>
						{createInterpolateElement(
							__(
								'Already, <strong>5,000+</strong> people are using WP Carousel to build more engaging and dynamic sections.',
								'wp-carousel-free'
							),
							{ strong: <strong /> }
						)}
					</p>
				</div>
				<div className="wpcpf-lite-vs-pro-cta-buttons">
					<a
						target="_blank"
						rel="noopener noreferrer"
						href="https://wpcarousel.io/pricing/?ref=1"
						className="wpcpf-lite-vs-pro-cta-button wpcpf-lite-vs-pro-cta-button--primary"
					>
						{__('Upgrade to Pro Now!', 'wp-carousel-free')}
					</a>
					<a
						target="_blank"
						rel="noopener noreferrer"
						href="https://wpcarousel.io/"
						className="wpcpf-lite-vs-pro-cta-button wpcpf-lite-vs-pro-cta-button--secondary"
					>
						{__('See Full Features', 'wp-carousel-free')}
					</a>
				</div>
			</div>

			<Testimonial />
		</div>
	);
}
