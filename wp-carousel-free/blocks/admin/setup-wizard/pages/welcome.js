import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;
const overlayImg = `${
	wpcpf?.pluginUrl || ''
}src/Admin/img/setup-wizard/welcome-video-overlay-img.png`;

const VIDEO_SRC = 'https://www.youtube.com/embed/a2ggJ4U5oi0?enablejsapi=1';

const FEATURES_LEFT = [
	__('Dynamic Image, Post & Product', 'wp-carousel-free'),
	__('Video and Audio Sources', 'wp-carousel-free'),
	__('Classic or Gutenberg Form Editor', 'wp-carousel-free'),
	__('Elementor, Divi, Beaver & More.', 'wp-carousel-free'),
];

const FEATURES_RIGHT = [
	__('Custom Video & Audio Players', 'wp-carousel-free'),
	__('Right Click & Watermark Protection', 'wp-carousel-free'),
	__('Built-in Lazy Load & Lightbox', 'wp-carousel-free'),
	__('Password Protection & Scheduling', 'wp-carousel-free'), // isolation-ignore -- upsell label, not an implementation.
];

const BulletIcon = () => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 14 14"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className="wpcpf-sw-bullet-icon"
	>
		<path
			d="M11.376 6.13892C11.0322 6.13892 10.7536 6.41763 10.7536 6.76137V11.2605C10.7536 11.5215 10.5412 11.7338 10.2802 11.7338H2.15573C1.89476 11.7338 1.68241 11.5215 1.68241 11.2605V3.13594C1.68241 2.87497 1.89476 2.66268 2.15573 2.66268H8.82047C9.1642 2.66268 9.44292 2.38396 9.44292 2.04022C9.44292 1.69649 9.1642 1.41777 8.82047 1.41777H2.15573C1.20827 1.41777 0.4375 2.18854 0.4375 3.13594V11.2605C0.4375 12.2079 1.20827 12.9787 2.15573 12.9787H10.2802C11.2277 12.9787 11.9985 12.2079 11.9985 11.2605V6.76137C11.9985 6.4176 11.7198 6.13892 11.376 6.13892Z"
			fill="#19949E"
		/>
		<path
			d="M12.4992 1.20441L5.57666 8.15301L3.79754 6.36746C3.55489 6.12391 3.16081 6.12325 2.91726 6.36585C2.67371 6.60849 2.673 7.00263 2.91565 7.24612L4.89274 9.23035C5.07521 9.41366 5.31804 9.51459 5.57669 9.51459H5.57721C5.83604 9.51442 6.07899 9.41323 6.26075 9.23032L13.3811 2.08308C13.6237 1.83953 13.623 1.44537 13.3794 1.2028C13.1359 0.960151 12.7418 0.960917 12.4992 1.20441Z"
			fill="#19949E"
		/>
	</svg>
);

/**
 * Greeting for the current hour.
 *
 * @return {string} Translated greeting.
 */
function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) {
		return __('Good morning', 'wp-carousel-free');
	}
	if (hour < 17) {
		return __('Good afternoon', 'wp-carousel-free');
	}
	if (hour < 21) {
		return __('Good evening', 'wp-carousel-free');
	}
	return __('Good night', 'wp-carousel-free');
}

export default function WelcomePage() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [videoSrc, setVideoSrc] = useState(VIDEO_SRC);

	// useSelect rather than a one-shot select(): getCurrentUser is resolved
	// asynchronously, so a single synchronous read always comes back empty.
	const userName = useSelect((selectStore) => {
		const user = selectStore('core').getCurrentUser();
		return user?.name || user?.nickname || '';
	}, []);

	const handlePlay = () => {
		setVideoSrc(`${VIDEO_SRC}&autoplay=1`);
		setIsPlaying(true);
	};

	return (
		<div className="wpcpf-sw-content-card">
			<div className="wpcpf-sw-about-section">
				<div className="wpcpf-sw-text-area">
					<div className="wpcpf-sw-title-section">
						<p className="wpcpf-sw-greeting">
							{sprintf(
								/* translators: 1: time-of-day greeting, 2: user's display name. */
								__('%1$s, %2$s', 'wp-carousel-free'),
								getGreeting(),
								userName || __('there', 'wp-carousel-free')
							)}
						</p>
						<h1 className="wpcpf-sw-welcome-title">
							{__('Welcome to', 'wp-carousel-free')}{' '}
							<span className="wpcpf-sw-gradient-text">{__('WP Carousel!', 'wp-carousel-free')}</span>
						</h1>
					</div>
					<p className="wpcpf-sw-description">
						{__(
							'Thank you for installing WP Carousel — your complete solution for building beautiful, interactive, and fully responsive carousels, sliders, galleries, media, post and products showcases without writing a single line of code.',
							'wp-carousel-free'
						)}
					</p>

					<div className="wpcpf-sw-features-section">
						<p className="wpcpf-sw-features-intro">
							{__('Get set up in minutes and start building using', 'wp-carousel-free')}{' '}
							<span className="wpcpf-sw-highlight">
								{__('18+ flexible blocks and 500+ ready-made patterns', 'wp-carousel-free')}
							</span>
							{__('. Packed with features, including:', 'wp-carousel-free')}
						</p>

						<div className="wpcpf-sw-features-grid">
							{[FEATURES_LEFT, FEATURES_RIGHT].map((column, columnIndex) => (
								<ul key={columnIndex} className="wpcpf-sw-features-list">
									{column.map((feature) => (
										<li key={feature} className="wpcpf-sw-feature-item">
											<BulletIcon />
											<span>{feature}</span>
										</li>
									))}
								</ul>
							))}
						</div>
					</div>
				</div>

				<div className="wpcpf-sw-video-section">
					<div className="wpcpf-sw-video-thumbnail">
						<iframe
							className="wpcpf-sw-video-iframe"
							src={videoSrc}
							title={__('WP Carousel introduction video', 'wp-carousel-free')}
							frameBorder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							referrerPolicy="strict-origin-when-cross-origin"
							allowFullScreen
						/>
						<div className="wpcpf-sw-video-overlay" style={{ display: isPlaying ? 'none' : 'block' }}>
							<img src={overlayImg} alt="" aria-hidden="true" className="wpcpf-sw-video-overlay-img" />
						</div>
						<button
							type="button"
							className="wpcpf-sw-play-button"
							onClick={handlePlay}
							aria-label={__('Play video', 'wp-carousel-free')}
							style={{ display: isPlaying ? 'none' : 'flex' }}
						>
							<svg
								width="22"
								height="22"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M4.375 19.4572V1.79282C4.375 1.29364 4.93134 0.995894 5.34669 1.27279L18.595 10.105C18.966 10.3524 18.966 10.8976 18.595 11.145L5.34669 19.9772C4.93134 20.2541 4.375 19.9564 4.375 19.4572Z"
									fill="#004DBE"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
