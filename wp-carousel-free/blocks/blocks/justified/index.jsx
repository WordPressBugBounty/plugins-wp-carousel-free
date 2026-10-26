/**
 * Justified — Pro block.
 *
 * The editor shows an upgrade card and the front end nothing: no view script
 * and no render callback. `save` keeps any inner blocks a Pro-saved block holds.
 */

import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from './block.json';
import edit from './edit.jsx';
import { JustifiedBlockIcon } from './icon.jsx';

registerBlockType(metadata.name, {
	...metadata,
	icon: JustifiedBlockIcon,
	edit,
	save: () => <InnerBlocks.Content />,
});
