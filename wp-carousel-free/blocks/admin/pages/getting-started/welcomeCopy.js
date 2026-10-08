/**
 * Welcome card copy: a first visit is welcomed to the plugin, a returning user
 * is invited to build the next carousel (ported from Real Testimonials Pro).
 */

import { __, sprintf } from '@wordpress/i18n';

/**
 * The greeting line: "Good morning, Jahirul 👋", or "Good morning 👋" without a name.
 *
 * @param {string} greeting    "Good morning" / "Good afternoon" / "Good evening".
 * @param {string} displayName The user's name, ready to show.
 * @return {string} Greeting line.
 */
export function getSalutation(greeting, displayName) {
	if (displayName) {
		return sprintf(
			/* translators: 1: "Good morning" / "Good afternoon" / "Good evening", 2: the user's first name */
			__('%1$s, %2$s 👋', 'wp-carousel-free'),
			greeting,
			displayName
		);
	}

	return sprintf(
		/* translators: %s: "Good morning" / "Good afternoon" / "Good evening" */
		__('%s 👋', 'wp-carousel-free'),
		greeting
	);
}

/**
 * The returning-user lead, naming only the ways to start that are on screen.
 *
 * @param {Object}  options
 * @param {boolean} options.blockEditor The block editor is available.
 * @param {boolean} options.patterns    Ready Patterns is offered.
 * @param {boolean} options.ai          The AI builder is offered.
 * @return {string} Lead sentence.
 */
function getReturningLead({ blockEditor, patterns, ai }) {
	if (!blockEditor) {
		return __('Create a new carousel, then place it anywhere with a shortcode.', 'wp-carousel-free');
	}

	if (patterns && ai) {
		return __(
			'Start from a ready pattern, let AI build it for you, or start blank.',
			'wp-carousel-free'
		);
	}

	if (patterns) {
		return __('Start from a ready pattern, or start blank.', 'wp-carousel-free');
	}

	if (ai) {
		return __('Let AI build it for you, or start blank.', 'wp-carousel-free');
	}

	return __('Start blank in the block editor.', 'wp-carousel-free');
}

/**
 * Title and lead for the welcome card.
 *
 * @param {Object}  options
 * @param {boolean} options.hasPlacements The site already shows or holds a carousel.
 * @param {boolean} options.blockEditor   The block editor is available.
 * @param {boolean} options.patterns      Ready Patterns is offered.
 * @param {boolean} options.ai            The AI builder is offered.
 * @return {{title: string, lead: string}} Copy.
 */
export function getWelcomeCopy({
	hasPlacements = false,
	blockEditor = false,
	patterns = false,
	ai = false,
} = {}) {
	if (hasPlacements) {
		return {
			title: __('Ready to create your next carousel or gallery?', 'wp-carousel-free'),
			lead: getReturningLead({ blockEditor, patterns, ai }),
		};
	}

	return {
		title: __('Welcome to WP Carousel', 'wp-carousel-free'),
		lead: blockEditor
			? __(
					"Turn your images, posts, products, and videos into eye-catching carousels or galleries in minutes. Choose how you'd like to start.",
					'wp-carousel-free'
			  )
			: __(
					'Turn your images, posts, products, and videos into eye-catching carousels or galleries in minutes, then place them anywhere with a shortcode.',
					'wp-carousel-free'
			  ),
	};
}
