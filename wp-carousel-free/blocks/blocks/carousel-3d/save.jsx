/**
 * Dynamic block — PHP render_callback outputs carousel HTML.
 * Inner block list (e.g. Pagination) is serialized via InnerBlocks.Content.
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function Save() {
	return <InnerBlocks.Content />;
}
