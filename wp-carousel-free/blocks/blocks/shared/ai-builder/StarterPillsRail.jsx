import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';

/**
 * Starter prompts, one per block/source pair the Ready Patterns catalog ships.
 *
 * Each prompt names its block in the matcher's own vocabulary plus "images" or
 * "posts", the manifest's source terms. `label` is the pill, `prompt` is what
 * reaches the AI, `blockName` steers the modal's target block, and
 * `requiresPlugin` withholds a pill whose patterns this site cannot serve.
 */
const STARTER_PROMPTS = [
	{
		label: __('Image Carousel', 'wp-carousel-free'),
		prompt:
			'Create an image carousel with rounded cards, smooth autoplay, and a caption under each image.',
		blockName: 'wp-carousel-pro/carousel',
	},
	{
		label: __('Hero Slider', 'wp-carousel-free'),
		prompt: 'Build a fullscreen hero slider with bold overlay text on full-screen images.',
		blockName: 'wp-carousel-pro/slider',
	},
	{
		label: __('Thumbnail Gallery', 'wp-carousel-free'),
		prompt:
			'Build a thumbnail slider gallery with a large stage image and a strip of thumbnails below.',
		blockName: 'wp-carousel-pro/thumbnails-slider',
	},
	{
		label: __('Tiles Grid', 'wp-carousel-free'),
		prompt: 'Create a tiles grid wall of images with hover captions and rounded corners.',
		blockName: 'wp-carousel-pro/tiles',
	},
	{
		label: __('Blog Posts', 'wp-carousel-free'),
		prompt: 'Create a carousel of recent blog posts with post titles, excerpts, and read-more links.',
		blockName: 'wp-carousel-pro/carousel',
	},
	{
		label: __('Featured Posts', 'wp-carousel-free'),
		prompt:
			'Build a full-width slider of featured blog posts with the post title and excerpt over each slide.',
		blockName: 'wp-carousel-pro/slider',
	},
	{
		label: __('Post Gallery', 'wp-carousel-free'),
		prompt:
			'Build a thumbnails slider of recent posts, with the post title on the main slide and thumbnails below.',
		blockName: 'wp-carousel-pro/thumbnails-slider',
	},
	{
		label: __('Post Grid', 'wp-carousel-free'),
		prompt: 'Create a tiles grid of blog posts with post titles and category labels.',
		blockName: 'wp-carousel-pro/tiles',
	},
];

export default function StarterPillsRail({ onSelectPrompt }) {
	const railRef = useRef(null);

	// Blocks switched off on the dashboard are unregistered client-side, so a
	// pill aimed at one is withheld.
	const disabledBlocks = window.wpcpBlockLocalize?.disabledBlocks || [];
	// A pill whose patterns need a companion plugin is withheld where that plugin
	// is inactive: every such pattern is filtered out server-side, so the pill
	// would quietly fall through to attribute generation and hand back a block
	// with nothing to query.
	const activePlugins = window.wpcpBlockLocalize?.readyPatterns?.activePlugins || {};
	const availablePrompts = STARTER_PROMPTS.filter(
		(item) =>
			(!item.blockName || !disabledBlocks.includes(item.blockName)) &&
			(!item.requiresPlugin || activePlugins[item.requiresPlugin])
	);

	if (!availablePrompts.length) {
		return null;
	}

	// Pages the rail forward by ~3/4 of a viewport, stopping at the end; only a click at the end wraps back.
	const pageForward = () => {
		const el = railRef.current;
		if (!el) {
			return;
		}
		const max = el.scrollWidth - el.clientWidth;
		if (max <= 0) {
			return;
		}
		const isAtEnd = el.scrollLeft >= max - 8;
		const next = isAtEnd ? 0 : Math.min(el.scrollLeft + Math.round(el.clientWidth * 0.75), max);
		el.scrollTo({ left: next, behavior: 'smooth' });
	};

	return (
		<div className="wpcp-ai-starters">
			<span className="wpcp-ai-starters__label">{__('Try a starter', 'wp-carousel-free')}</span>
			<div ref={railRef} className="wpcp-ai-starters__rail">
				{availablePrompts.map((item) => (
					<button
						key={item.label}
						type="button"
						onClick={() => onSelectPrompt(item)}
						className="wpcp-ai-starter-pill"
					>
						{item.label}
					</button>
				))}
			</div>
			{availablePrompts.length > 3 && (
				<button
					type="button"
					aria-label={__('More starters', 'wp-carousel-free')}
					onClick={pageForward}
					className="wpcp-ai-starter-more"
				>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
						<path
							d="M7 4.5 11.5 9 7 13.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
			)}
		</div>
	);
}
