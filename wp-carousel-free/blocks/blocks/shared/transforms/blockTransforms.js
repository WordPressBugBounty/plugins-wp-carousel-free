/**
 * Block transforms — the "Transform to" menu on every WP Carousel block.
 *
 * Each block offers every other WP Carousel block that can show its current
 * content, and core Image / Gallery blocks offer ours. The Pro editor previews
 * are never transform endpoints: they render nothing on the front end, so
 * landing content in one would publish an empty section.
 */

import { createBlock, getBlockType } from '@wordpress/blocks';
import { isTopLevelSourceAllowed } from '../constants/allowedSources';
import { isEditorPreviewBlock } from '../constants/editorPreviewBlocks';
import manifest from '../../block-manifest.json';
import mapAttributesToBlock from './mapAttributes';
import {
	coreGalleryHasImage,
	coreImagesHaveImage,
	firstOf,
	itemsFromCoreGallery,
	itemsFromCoreImages,
} from './coreMediaItems';

const BLOCK_NAMESPACE = 'wp-carousel-pro/';
const CORE_IMAGE_BLOCK = 'core/image';
const CORE_GALLERY_BLOCK = 'core/gallery';

/**
 * The blocks a transform may land on — the front-end blocks the manifest ships.
 *
 * The manifest is the list `lint:manifest` already holds against the PHP
 * registry, and its order is the switcher's. The predicate is the backstop for
 * a preview slug wrongly filed under `blocks`.
 */
const TRANSFORMABLE_SLUGS = (manifest.blocks ?? []).filter((slug) => !isEditorPreviewBlock(slug));

/** Alignments a core block and our blocks both understand. */
const SHARED_ALIGNMENTS = ['wide', 'full'];

function buildSiblingTransforms(sourceSlug) {
	return TRANSFORMABLE_SLUGS.filter((slug) => slug !== sourceSlug).map((targetSlug) => {
		const targetBlockName = `${BLOCK_NAMESPACE}${targetSlug}`;

		return {
			type: 'block',
			blocks: [targetBlockName],
			isMatch: (attributes) =>
				!!getBlockType(targetBlockName) &&
				isTopLevelSourceAllowed(targetSlug, attributes?.sourceType || 'image'),
			// Inner blocks are deliberately dropped: Free's blocks carry none, and
			// anything a post authored in Pro left behind is invalid here.
			transform: (attributes) =>
				createBlock(targetBlockName, mapAttributesToBlock(attributes, targetBlockName)),
		};
	});
}

function sharedAlignment(align) {
	return SHARED_ALIGNMENTS.includes(align) ? { align } : {};
}

function buildCoreMediaTransforms(targetBlockName) {
	return [
		{
			type: 'block',
			blocks: [CORE_GALLERY_BLOCK],
			isMatch: (attributes, block) => coreGalleryHasImage(attributes, block),
			transform: (attributes, innerBlocks) =>
				createBlock(targetBlockName, {
					...sharedAlignment(attributes?.align),
					sourceType: 'image',
					items: itemsFromCoreGallery(attributes, innerBlocks),
				}),
		},
		{
			type: 'block',
			blocks: [CORE_IMAGE_BLOCK],
			isMultiBlock: true,
			isMatch: (imageAttributes) => coreImagesHaveImage(imageAttributes),
			transform: (imageAttributes) =>
				createBlock(targetBlockName, {
					...sharedAlignment(firstOf(imageAttributes).align),
					sourceType: 'image',
					items: itemsFromCoreImages(imageAttributes),
				}),
		},
	];
}

/**
 * Every block declaring `to` for every sibling already gives a complete matrix,
 * so `from` only has to cover the core blocks.
 *
 * @param {string} blockName Registering block's name.
 * @return {Object} The block type's `transforms` value.
 */
export default function buildBlockTransforms(blockName) {
	return {
		to: buildSiblingTransforms(blockName.replace(BLOCK_NAMESPACE, '')),
		from: buildCoreMediaTransforms(blockName),
	};
}
