/**
 * BlockPreviewShape – the visual rendered in the Gutenberg inserter preview
 * panel for each WP Carousel Pro block.
 *
 * Shows the stylised layout-shape diagram inside a bordered box (design "Block
 * Preview" card, Figma node 6094-57102). The block icon, title and description
 * beneath it are rendered by core's inserter `BlockCard`, so this component is
 * only the preview visual. Used when `edit` runs in `isPreviewMode` — see
 * CarouselEdit's default export and `docs/plans/block-preview-plan.md`.
 */

import { useBlockProps } from '@wordpress/block-editor';
import { getBlockPreviewShape } from './blockPreviewShapes';
import './BlockPreviewShape.scss';

/**
 * @param {Object} props      Component props.
 * @param {string} props.name Full block type name (e.g. `wp-carousel-pro/tiles`).
 * @return {JSX.Element} Inserter preview visual.
 */
export default function BlockPreviewShape({ name }) {
	const blockProps = useBlockProps({ className: 'wpcp-inserter-preview' });
	const shortName = (name || '').replace('wp-carousel-pro/', '');
	const shape = getBlockPreviewShape(shortName);

	return (
		<div {...blockProps}>
			<div className="wpcp-inserter-preview-box">
				<span
					className="wpcp-inserter-preview-shape"
					// eslint-disable-next-line react/no-danger -- trusted static design SVG, not user input.
					dangerouslySetInnerHTML={{ __html: shape }}
				/>
			</div>
		</div>
	);
}
