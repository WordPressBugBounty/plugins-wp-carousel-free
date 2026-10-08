import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import BrandMarkIcon from '../../../blocks/shared/ai-builder/BrandMarkIcon';
import { AI_BUILDER_QUERY_ARG } from '../../../blocks/shared/ai-builder/constants';
import Placements from './Placements';
import { getFirstName, getGreeting } from './greeting';
import { getSalutation, getWelcomeCopy } from './welcomeCopy';
import './style.scss';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;

// Intro tutorial opened from the hero poster.
const TUTORIAL_EMBED_URL = 'https://www.youtube.com/embed/a2ggJ4U5oi0?autoplay=1';

// Classic Editor, WP < 5.8 or an unbuilt bundle: a new page has no blocks, so
// the Classic carousel CPT is the only entry point that works.
const blockEditorReady = !!wpcpf?.blockEditorReady;
const createUrl = blockEditorReady
	? `${wpcpf?.adminUrl}post-new.php?post_type=page&wpcpblock_inserter=true`
	: `${wpcpf?.adminUrl}post-new.php?post_type=sp_wp_carousel`;

const GettingStarted = ({ readyPatternsEnabled = true, aiBuilderEnabled = true }) => {
	const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
	const showPatterns = blockEditorReady && readyPatternsEnabled;
	// Offered only when the editor will mount the builder, so the link never lands on an empty page.
	const showAIBuilder = blockEditorReady && !!wpcpf?.siteAllowsAi && aiBuilderEnabled;

	// First visit or returning: the stored report decides on load, each scan or Sync after that.
	const [placementsExist, setPlacementsExist] = useState(!!wpcpf?.hasPlacements);

	useEffect(() => {
		if (!isVideoModalOpen) {
			return undefined;
		}
		const onKeyDown = (event) => {
			if ('Escape' === event.key) {
				setIsVideoModalOpen(false);
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [isVideoModalOpen]);

	// The ways to start, in order; the first one shown is the primary.
	const startActions = [
		showPatterns && {
			key: 'patterns',
			href: `${wpcpf?.adminUrl}post-new.php?post_type=page&wpcp_pattern_library`,
			label: __('Use a Pattern', 'wp-carousel-free'),
			icon: 'dashicons-screenoptions',
		},
		showAIBuilder && {
			key: 'ai',
			href: `${wpcpf?.adminUrl}post-new.php?post_type=page&${AI_BUILDER_QUERY_ARG}=true`,
			label: __('Build with AI', 'wp-carousel-free'),
			iconNode: <BrandMarkIcon size={17} />,
		},
		{
			key: 'scratch',
			href: createUrl,
			label: blockEditorReady
				? __('Start Blank', 'wp-carousel-free')
				: __('Create New Carousel', 'wp-carousel-free'),
			icon: 'dashicons-plus-alt2',
		},
	].filter(Boolean);

	const salutation = getSalutation(
		getGreeting(new Date().getHours()),
		getFirstName(wpcpf?.userFirstName, wpcpf?.current_user)
	);
	const welcome = getWelcomeCopy({
		hasPlacements: placementsExist,
		blockEditor: blockEditorReady,
		patterns: showPatterns,
		ai: showAIBuilder,
	});

	return (
		<section className="wpcpf-qs-page">
			<div className="wpcpf-qs-hero">
				<div className="wpcpf-qs-hero__text">
					<p className="wpcpf-qs-greeting">{salutation}</p>
					<h1 className="wpcpf-qs-title">{welcome.title}</h1>
					<p className="wpcpf-qs-lead">{welcome.lead}</p>
					<div className="wpcpf-qs-actions">
						{startActions.map((action, index) => (
							<a
								key={action.key}
								className={`wpcpf-qs-start-btn wpcpf-qs-start-btn--${action.key}${
									0 === index ? ' is-primary' : ''
								}`}
								href={action.href}
							>
								{action.iconNode || <span className={`dashicons ${action.icon}`} aria-hidden="true" />}
								{action.label}
							</a>
						))}
					</div>
				</div>

				<button
					type="button"
					className="wpcpf-qs-video"
					onClick={() => setIsVideoModalOpen(true)}
					aria-label={__('Play the introduction video', 'wp-carousel-free')}
				>
					<img
						className="wpcpf-qs-video__thumb"
						src={`${wpcpf?.pluginUrl}src/Admin/img/dashboard-video-poster.jpg`}
						alt=""
						loading="eager"
						decoding="async"
					/>
					<span className="wpcpf-qs-play-btn">
						<span className="dashicons dashicons-controls-play" aria-hidden="true" />
					</span>
				</button>
			</div>

			<Placements
				createUrl={createUrl}
				onReport={(report) => setPlacementsExist(Array.isArray(report?.rows) && report.rows.length > 0)}
			/>

			{isVideoModalOpen && (
				<div
					className="wpcpf-qs-modal"
					onClick={(event) => {
						if (event.target === event.currentTarget) {
							setIsVideoModalOpen(false);
						}
					}}
				>
					<div className="wpcpf-qs-modal__content" role="dialog" aria-modal="true">
						<button
							type="button"
							className="wpcpf-qs-modal__close"
							onClick={() => setIsVideoModalOpen(false)}
							aria-label={__('Close video', 'wp-carousel-free')}
						>
							×
						</button>
						<div className="wpcpf-qs-modal__video">
							<iframe
								src={TUTORIAL_EMBED_URL}
								title={__('WP Carousel introduction video', 'wp-carousel-free')}
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
							/>
						</div>
					</div>
				</div>
			)}
		</section>
	);
};

export default GettingStarted;
