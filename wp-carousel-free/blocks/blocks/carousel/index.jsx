/**
 * Carousel block registration – standard horizontal carousel.
 *
 * Deprecation v1: the old static <div data-carousel-id> shell.
 * WordPress will silently migrate old blocks to the new dynamic save on re-save.
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit.jsx';
import save from './save.jsx';
import icon from './icon.jsx';
import buildBlockTransforms from '../shared/transforms/blockTransforms';

registerBlockType(metadata.name, {
	...metadata,
	icon,
	viewScript: 'wpcpf-blocks-frontend',
	transforms: buildBlockTransforms(metadata.name),
	edit,
	save,
});
