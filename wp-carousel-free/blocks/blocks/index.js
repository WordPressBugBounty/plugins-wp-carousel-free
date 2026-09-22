/**
 * Editor entry point.
 *
 * Registration follows block-manifest.json, which is also the inserter order.
 */
import {
	updateCategory,
	getBlockType,
	unregisterBlockType,
	registerBlockVariation,
} from '@wordpress/blocks';
import { WPCarouselCategoryIcon, WPCarouselProCategoryIcon } from '@wp-carousel-pro/icons/icons';

import manifest from './block-manifest.json';
import { registerReadyPatternsLauncher } from './shared/ready-patterns/toolbarButton';
// Opens the block inserter when the editor is reached from a dashboard
// "Add New" link (?wpcpblock_inserter), and the Ready Patterns library when
// reached with ?wpcp_pattern_library.
import '../controls/redirect';
import '../admin/saved-template-sidebar';
import './editor.scss';
import './shared/styles/editor-preview.scss';
import './style.scss';

// Mounts the header "WP Carousel Library" button and the single modal host the
// wizard and inspector CTAs open through; a no-op when the module is off.
registerReadyPatternsLauncher();

const MAIN_CATEGORY = 'wp-carousel-pro';
const PRO_CATEGORY = 'wp-carousel-pro-blocks';

// eslint-disable-next-line no-undef
const blockModules = require.context('./', true, /^\.\/[^/]+\/index\.jsx$/);

/**
 * Load one block module by slug.
 *
 * @param {string} slug Block slug from the manifest.
 */
function registerBlockBySlug(slug) {
	const modulePath = `./${slug}/index.jsx`;

	if (!blockModules.keys().includes(modulePath)) {
		return;
	}

	blockModules(modulePath);
}

[
	...(manifest.blocks ?? []),
	...(manifest.proTeasers ?? []),
	...(manifest.proPreviews ?? []),
].forEach(registerBlockBySlug);

// Hide blocks switched off on the dashboard's Blocks page from the inserter.
// Unregistering only our own block types keeps this scoped to WP Carousel —
// unlike gating allowed_block_types_all, which would clobber other plugins'
// block managers. The block stays registered in PHP, so a post that already
// contains one still resolves its block type instead of breaking.
const disabledBlocks = window.wpcpBlockLocalize?.disabledBlocks || [];
disabledBlocks.forEach((blockName) => {
	if (getBlockType(blockName)) {
		unregisterBlockType(blockName);
	}
});

// Categories are registered in PHP; only a dashicon slug can cross that filter, so the SVG is attached here.
updateCategory(MAIN_CATEGORY, { icon: WPCarouselCategoryIcon });
updateCategory(PRO_CATEGORY, { icon: WPCarouselProCategoryIcon });

/**
 * Top-level blocks that support wide alignment open at "Wide width" in the
 * inserter. The schema `align` default stays '' so toolbar "None" is sticky.
 */
const WIDE_ALIGN_TOP_LEVEL_BLOCKS = [
	'carousel',
	'slider',
	'thumbnails-slider',
	'tiles',
	'marquee',
	'carousel-panorama',
].map((slug) => `${MAIN_CATEGORY}/${slug}`);

WIDE_ALIGN_TOP_LEVEL_BLOCKS.forEach((blockName) => {
	const blockType = getBlockType(blockName);

	if (!blockType || !Array.isArray(blockType.supports?.align)) {
		return;
	}

	if (!blockType.supports.align.includes('wide')) {
		return;
	}

	registerBlockVariation(blockName, {
		name: 'wide-default',
		title: blockType.title,
		isDefault: true,
		attributes: { align: 'wide' },
	});
});
