/**
 * Marquee — Pro editor preview.
 *
 * Fully previewable and configurable in the editor and completely absent from
 * the front end: no view script, `save` returns null, and the PHP render
 * callback returns an empty string.
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit.jsx';
import { MarqueeBlockIcon } from './icon.jsx';

registerBlockType(metadata.name, {
	...metadata,
	icon: MarqueeBlockIcon,
	edit,
	save: () => null,
});
