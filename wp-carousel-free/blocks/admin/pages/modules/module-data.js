import { __ } from '@wordpress/i18n';
import {
	LightboxIcon,
	WatermarkIcon,
	VisibilityIcon,
	HoverIcon,
	MotionIcon,
	VideoPlayerIcon,
	AudioPlayerIcon,
	ReadyPatternsIcon,
	SavedTemplatesIcon,
	BuildCustomLayoutIcon,
	WhiteLabelingIcon,
	RoleManagementIcon,
} from './icons';

// Presentation metadata only — which modules exist, and which are Free, is
// decided by the PHP registry (Dashboard::get_modules_list) and arrives with
// the dashboard options.
export const modulesInfo = {
	lightbox: {
		icon: <LightboxIcon />,
		gradient: 'linear-gradient(135deg, rgb(247, 97, 161) 0%, rgb(140, 27, 171) 100%)',
		title: __('Lightbox', 'wp-carousel-free'),
		description: __(
			'Responsive lightbox allows you to display images and media in a focused popup view for better user engagement.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/features/lightbox',
	},
	watermark: {
		icon: <WatermarkIcon />,
		gradient: 'linear-gradient(135deg, rgb(151, 171, 255) 0%, rgb(18, 53, 151) 100%)',
		title: __('Watermark', 'wp-carousel-free'),
		description: __(
			'This allows you to add custom text or image watermarks to protect your media and strengthen brand identity.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/features/watermark',
		// Has a settings drawer in Pro — the gear shows, permanently disabled.
		hasProSettings: true,
	},
	visibility: {
		icon: <VisibilityIcon />,
		gradient: 'linear-gradient(135deg, rgb(0, 175, 255) 0%, rgb(41, 116, 255) 100%)',
		title: __('Visibility & Scheduling', 'wp-carousel-free'), // isolation-ignore -- upsell label, not an implementation.
		description: __(
			'This lets you control who can access your content and schedule automatic start and end times for your showcase block.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/features/visibility-scheduling',
	},
	hover: {
		icon: <HoverIcon />,
		gradient: 'linear-gradient(-45deg, rgb(255, 76, 79) 0%, rgb(36, 2, 227) 100%)',
		title: __('Hover Animations', 'wp-carousel-free'),
		description: __(
			'This enables you to add advanced hover effects, overlays, and animations for more dynamic presentations.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/carousel#hover-animations',
	},
	motion: {
		icon: <MotionIcon />,
		gradient: 'linear-gradient(180deg, rgb(146, 5, 35) 0%, rgb(226, 85, 115) 100%)',
		title: __('Motion Effects', 'wp-carousel-free'),
		description: __(
			'This allows you to apply smooth entrance animations with adjustable speed and delay settings.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/carousel#motion-effects',
	},
	'ready-patterns': {
		icon: <ReadyPatternsIcon />,
		gradient: 'linear-gradient(135deg, rgb(247, 97, 161) 0%, rgb(140, 27, 171) 100%)',
		title: __('Ready Patterns Library', 'wp-carousel-free'),
		description: __(
			'This enables you to access pre-designed layout patterns to quickly build sections without starting from scratch.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/features/ready-made-patterns',
	},
	'video-player': {
		icon: <VideoPlayerIcon />,
		gradient: 'linear-gradient(135deg, rgb(151, 171, 255) 0%, rgb(18, 53, 151) 100%)',
		title: __('Custom Video Player', 'wp-carousel-free'),
		description: __(
			'This lets you use an advanced video player with enhanced controls and improved playback options.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/carousel#video',
	},
	'audio-player': {
		icon: <AudioPlayerIcon />,
		gradient: 'linear-gradient(135deg, rgb(0, 175, 255) 0%, rgb(41, 116, 255) 100%)',
		title: __('Custom Audio Player', 'wp-carousel-free'),
		description: __(
			'This allows you to integrate a customizable audio player for showcasing music or audio content.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/carousel#audio-player',
	},
	'build-custom-layout': {
		icon: <BuildCustomLayoutIcon />,
		gradient: 'linear-gradient(135deg, #79f1a4 0%, #0e5cad 100%)',
		title: __('Build Custom Layout', 'wp-carousel-free'),
		description: __(
			'This allows you to create custom carousel layouts with a drag-and-drop builder for unique designs.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/blocks/tiles#layouts',
	},
	'white-labeling': {
		icon: <WhiteLabelingIcon />,
		gradient: 'linear-gradient(135deg, #ffbd29 0%, #ff2db6 100%)',
		title: __('White Labeling', 'wp-carousel-free'),
		description: __(
			'This allows you to replace WP Carousel branding with your own brand name and logo for a fully customized client experience.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/introduction',
	},
	'role-management': {
		icon: <RoleManagementIcon />,
		gradient: 'linear-gradient(-45deg, #79f1a4 0%, #0e5cad 100%)',
		title: __('Role Management', 'wp-carousel-free'),
		description: __(
			'This enables you to control user access by assigning permissions to create, edit, or manage galleries based on WordPress roles.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/introduction',
	},
	'saved-templates': {
		icon: <SavedTemplatesIcon />,
		gradient: 'linear-gradient(135deg, rgb(0, 175, 255) 0%, rgb(41, 116, 255) 100%)',
		title: __('Saved Templates', 'wp-carousel-free'),
		description: __(
			'This lets you create unlimited templates by converting blocks into shortcodes to reuse anywhere.',
			'wp-carousel-free'
		),
		docLink: 'https://docs.wpcarousel.io/guide/dashboard/saved-templates',
	},
};

/**
 * Presentation metadata for a module slug. Returns an empty object for anything
 * the client doesn't know about, so the card falls back to the server-sent
 * title rather than borrowing another module's identity.
 *
 * @param {string} moduleName Module slug.
 * @return {Object} Presentation metadata, or an empty object.
 */
export const getModuleInfo = (moduleName) => {
	if (!moduleName) {
		return {};
	}

	if (modulesInfo[moduleName]) {
		return modulesInfo[moduleName];
	}

	// Tolerate an underscored variant; the registry sends hyphenated slugs.
	const hyphenKey = moduleName.replace(/_/g, '-');
	return modulesInfo[hyphenKey] || {};
};
