/**
 * Panorama Carousel — Pro block.
 *
 * The editor shows an upgrade card and the front end nothing: no view script,
 * `save` returns null, and the PHP render callback returns an empty string.
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit.jsx';
import { PanoramaBlockIcon } from './icon.jsx';

registerBlockType(metadata.name, {
	...metadata,
	icon: PanoramaBlockIcon,
	edit,
	save: () => null,
});
