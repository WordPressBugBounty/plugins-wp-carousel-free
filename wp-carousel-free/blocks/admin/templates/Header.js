import { __ } from '@wordpress/i18n';
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import Drawer from './Drawer';
import useChangelogData from '../hooks/useChangelogData';
import {
	Arrow,
	BlogIcon,
	Community,
	DocumentationIcon,
	FeatRequest,
	Roadmap,
	SetupWizard,
	Support,
	TechSupport,
	VideoIcon,
	WhatsNew,
} from './help-icons';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;

// Same items, order, icons and links as Pro's dropdown.
const GET_HELP_ITEMS = [
	{
		title: __('Documentation', 'wp-carousel-free'),
		Icon: DocumentationIcon,
		link: 'https://docs.wpcarousel.io/guide/introduction',
	},
	{
		title: __('Technical Support', 'wp-carousel-free'),
		Icon: TechSupport,
		link: 'https://shapedplugin.com/create-new-ticket/',
	},
	{
		title: __('Setup Wizard', 'wp-carousel-free'),
		Icon: SetupWizard,
		link: `${
			wpcpf?.adminUrl || ''
		}edit.php?post_type=sp_wp_carousel&page=wpcpf_dashboard#setup-wizard`,
	},
	{
		title: __('Public Roadmap', 'wp-carousel-free'),
		Icon: Roadmap,
		link: '',
	},
	{
		title: __('Request a Feature', 'wp-carousel-free'),
		Icon: FeatRequest,
		link: 'https://shapedplugin.com/contact-us/',
	},
	{
		title: __('Video Tutorials', 'wp-carousel-free'),
		Icon: VideoIcon,
		link: 'https://www.youtube.com/watch?v=a2ggJ4U5oi0&list=PLoUb-7uG-5jNgTTcnUflIiytxgTWaBEzm',
	},
	{
		title: __("What's New", 'wp-carousel-free'),
		Icon: WhatsNew,
		link: 'https://wpcarousel.io/changelog/',
	},
	{
		title: __('Blog: Latest News', 'wp-carousel-free'),
		Icon: BlogIcon,
		link: 'https://shapedplugin.com/blog/',
	},
	{
		title: __('Join Community', 'wp-carousel-free'),
		Icon: Community,
		link: 'https://community.shapedplugin.com/',
	},
];

const img = (file) => `${wpcpf?.pluginUrl || ''}src/Admin/img/${file}`;

export default function Header({ menuItems, currentPage, setPageAndHash }) {
	const [showHelp, setShowHelp] = useState(false);
	const [showChangelog, setShowChangelog] = useState(false);
	const [indicator, setIndicator] = useState({ left: 0, width: 0 });
	const navRef = useRef();
	const itemsRef = useRef({});

	const { status: changelogStatus, changelog } = useChangelogData(showChangelog);

	// Slide the underline to the active tab. Measured rather than drawn on the
	// item itself so it can animate between them.
	useEffect(() => {
		const item = itemsRef.current[currentPage];
		const nav = navRef.current;
		if (!item || !nav) {
			return undefined;
		}

		const measure = () => {
			const navRect = nav.getBoundingClientRect();
			const itemRect = item.getBoundingClientRect();
			setIndicator({ left: itemRect.left - navRect.left, width: itemRect.width });
		};

		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, [currentPage]);

	return (
		<Fragment>
			<div className="wpcpf-navbar">
				<div className="wpcpf-navbar-inner">
					<div className="wpcpf-navbar-logo">
						<img className="wpcpf-navbar-logo-img" src={img('wpcp-logo.svg')} alt="WP Carousel" />
						{wpcpf?.pluginVersion && (
							<button
								type="button"
								className="wpcpf-navbar-version"
								onClick={() => setShowChangelog(true)}
								aria-label={__('View changelog', 'wp-carousel-free')}
							>
								<img src={img('icon-changelog.svg')} alt="" aria-hidden="true" />
								{wpcpf.pluginVersion}
							</button>
						)}
					</div>

					<nav className="wpcpf-navbar-nav" ref={navRef}>
						<span
							className="wpcpf-nav-sliding-indicator"
							style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
						/>
						{menuItems.map((item) =>
							item.divider ? (
								<span key={item.value} className="wpcpf-navbar-divider" aria-hidden="true" />
							) : (
								<a
									key={item.value}
									ref={(el) => {
										itemsRef.current[item.value] = el;
									}}
									href={item.hash || item.link}
									className={`wpcpf-navbar-item${currentPage === item.value ? ' is-active' : ''}`}
									{...(item.link
										? { target: '_blank', rel: 'noopener noreferrer' }
										: {
												onClick: (e) => {
													e.preventDefault();
													setPageAndHash(item.value);
												},
										  })}
								>
									{item.icon && <img src={img(item.icon)} alt="" aria-hidden="true" />}
									{item.label}
									{item.badge && (
										<span className="wpcpf-navbar-badge">{__('New!', 'wp-carousel-free')}</span>
									)}
								</a>
							)
						)}
					</nav>

					<div
						className="wpcpf-navbar-help"
						onMouseEnter={() => setShowHelp(true)}
						onMouseLeave={() => setShowHelp(false)}
					>
						<button type="button" className="wpcpf-navbar-help-btn">
							<Support />
							{__('Get Help', 'wp-carousel-free')}
						</button>
						{showHelp && (
							<div className="wpcpf-navbar-help-menu">
								{GET_HELP_ITEMS.filter(({ link }) => link).map(({ title, link, Icon }) => (
									<a
										key={link}
										className="wpcpf-navbar-help-link"
										href={link}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Icon />
										<span>{title}</span>
										<span className="wpcpf-navbar-help-arrow">
											<Arrow />
										</span>
									</a>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<Drawer open={showChangelog} onClose={() => setShowChangelog(false)}>
				<div className="wpcpf-changelog">
					<div className="wpcpf-changelog-heading">
						<p className="wpcpf-changelog-title">
							{__('Latest Updates - Changelog', 'wp-carousel-free')}
						</p>
						<button
							type="button"
							className="wpcpf-changelog-close"
							onClick={() => setShowChangelog(false)}
							aria-label={__('Close', 'wp-carousel-free')}
						>
							&times;
						</button>
					</div>
					{'loading' === changelogStatus && (
						<div className="wpcpf-changelog-details">{__('Loading…', 'wp-carousel-free')}</div>
					)}
					{'error' === changelogStatus && (
						<div className="wpcpf-changelog-details">
							<p>{__("Couldn't load the latest changelog.", 'wp-carousel-free')}</p>
							<a
								href="https://wordpress.org/plugins/wp-carousel-free/#developers"
								target="_blank"
								rel="noopener noreferrer"
							>
								{__('View changelog on WordPress.org', 'wp-carousel-free')}
							</a>
						</div>
					)}
					{'success' === changelogStatus && (
						<div
							className="wpcpf-changelog-details"
							// eslint-disable-next-line react/no-danger -- wp_kses_post'd server side.
							dangerouslySetInnerHTML={{ __html: changelog }}
						/>
					)}
				</div>
			</Drawer>
		</Fragment>
	);
}
