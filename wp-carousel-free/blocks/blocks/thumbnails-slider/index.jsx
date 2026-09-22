import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit.jsx';
import save from './save.jsx';
import { ThumbSliderBlockIcon } from './icon';
import buildBlockTransforms from '../shared/transforms/blockTransforms';

registerBlockType(metadata.name, {
	...metadata,
	icon: ThumbSliderBlockIcon,
	viewScript: 'wpcpf-blocks-frontend',
	transforms: buildBlockTransforms(metadata.name),
	edit,
	save,
});
