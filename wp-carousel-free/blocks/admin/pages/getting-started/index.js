import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { PlayIcon } from './icons';
import './style.scss';
import { DocumentationCard, SupportCard, ShowYourLoveCard } from './template-parts';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;

// Intro tutorial opened from the hero poster.
const TUTORIAL_EMBED_URL = 'https://www.youtube.com/embed/a2ggJ4U5oi0?autoplay=1';

// Classic Editor, WP < 5.8 or an unbuilt bundle: a new page has no blocks, so
// the Classic carousel CPT is the only entry point that works.
const blockEditorReady = !!wpcpf?.blockEditorReady;
const createUrl = blockEditorReady
	? `${wpcpf?.adminUrl}post-new.php?post_type=page&wpcpblock_inserter=true`
	: `${wpcpf?.adminUrl}post-new.php?post_type=sp_wp_carousel`;

// The welcome copy names only the entry points actually on screen.
const welcomeText = (showPatterns) => {
	if (showPatterns) {
		return __(
			"Thanks for choosing WP Carousel! Everything's ready to go. Create your first carousel or gallery in the block editor — or start from a Ready Pattern.",
			'wp-carousel-free'
		);
	}
	if (blockEditorReady) {
		return __(
			"Thanks for choosing WP Carousel! Everything's ready to go. Create your first carousel or gallery in the block editor.",
			'wp-carousel-free'
		);
	}
	return __(
		"Thanks for choosing WP Carousel! Everything's ready to go. Create your first carousel or gallery, then place it anywhere with a shortcode.",
		'wp-carousel-free'
	);
};

const GettingStarted = ({ readyPatternsEnabled = true }) => {
	const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
	const showPatterns = blockEditorReady && readyPatternsEnabled;

	return (
		<div className="wpcpf-qs-page">
			<div className="wpcpf-qs-content">
				{/* Left: welcome copy, the two entry points, intro video */}
				<div className="wpcpf-qs-left">
					<div className="wpcpf-qs-about-section">
						<div className="wpcpf-qs-about-text">
							<div className="wpcpf-qs-about-copy">
								<h3 className="wpcpf-qs-welcome-title">
									{__('Welcome to WP Carousel!', 'wp-carousel-free')}
								</h3>
								<p className="wpcpf-qs-welcome-desc">{welcomeText(showPatterns)}</p>
							</div>
							<div className="wpcpf-qs-actions">
								<a href={createUrl} className="wpcpf-qs-create-btn">
									<i className="dashicons dashicons-plus-alt2"></i>
									{__('Create New Carousel / Gallery', 'wp-carousel-free')}
								</a>
								{showPatterns && (
									<a
										href={`${wpcpf?.adminUrl}post-new.php?post_type=page&wpcp_pattern_library`}
										className="wpcpf-qs-patterns-btn"
									>
										{__('Start with Ready Patterns', 'wp-carousel-free')}
									</a>
								)}
							</div>
						</div>

						<button
							type="button"
							className="wpcpf-qs-video-wrapper"
							onClick={() => setIsVideoModalOpen(true)}
							aria-label={__('Play the introduction video', 'wp-carousel-free')}
						>
							<img
								src={`${wpcpf?.pluginUrl}src/Admin/img/dashboard-video-poster.jpg`}
								alt=""
								className="wpcpf-qs-video-placeholder"
							/>
							<span className="wpcpf-qs-play-btn">
								<PlayIcon />
							</span>
						</button>
					</div>
				</div>

				{/* Right: docs, support, review */}
				<div className="wpcpf-qs-sidebar">
					<DocumentationCard />
					<SupportCard />
					<ShowYourLoveCard />
				</div>
			</div>

			{isVideoModalOpen && (
				<div className="wpcpf-qs-video-modal" onClick={() => setIsVideoModalOpen(false)}>
					<div className="wpcpf-qs-video-modal-content" onClick={(e) => e.stopPropagation()}>
						<button
							type="button"
							className="wpcpf-qs-video-modal-close"
							onClick={() => setIsVideoModalOpen(false)}
							aria-label={__('Close video', 'wp-carousel-free')}
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
								<path
									d="M12 4L4 12M4 4L12 12"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
								/>
							</svg>
						</button>
						<div className="wpcpf-qs-video-modal-wrapper">
							<iframe
								width="100%"
								height="100%"
								src={TUTORIAL_EMBED_URL}
								title={__('WP Carousel introduction video', 'wp-carousel-free')}
								frameBorder="0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
							></iframe>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default GettingStarted;
