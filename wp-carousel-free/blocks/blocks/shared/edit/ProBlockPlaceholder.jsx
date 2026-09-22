/**
 * ProBlockPlaceholder – the canvas card a Pro teaser block renders instead of
 * an editor UI.
 *
 * The block itself carries no attributes and no render callback, so this is the
 * whole of its editor surface: what the block does, a demo link, an upgrade
 * link, and a remove button so the author is not stuck with an undo.
 *
 * No block mounts this today: Marquee and Panorama were promoted to full editor
 * previews (see `constants/editorPreviewBlocks.js`). It stays as the teaser
 * primitive for `gallery-filter` and `ajax-search`, which are still to land.
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { memo } from '@wordpress/element';
import { getPricingUrl } from '@wp-carousel-pro/components/pro/proLinks';
import { getProBlockInfo, getProBlockDemoLink } from '../constants/proFeatures';
import { getBlockPreviewShape } from './blockPreviewShapes';
import './ProBlockPlaceholder.scss';

const ProBlockPlaceholder = ({ name, clientId }) => {
	const blockProps = useBlockProps({ className: 'wpcp-pro-block-placeholder' });
	const { removeBlock } = useDispatch(blockEditorStore);
	const info = getProBlockInfo(name);

	if (!info) {
		return null;
	}

	const demoLink = getProBlockDemoLink(name);

	return (
		<div {...blockProps}>
			<div className="wpcp-pro-block-placeholder-inner">
				<button
					type="button"
					className="wpcp-pro-block-placeholder-remove"
					aria-label={__('Remove block', 'wp-carousel-free')}
					onClick={() => removeBlock(clientId)}
				/>
				<div className="wpcp-pro-block-placeholder-body">
					<h3 className="wpcp-pro-block-placeholder-title">{info.title}</h3>
					<p className="wpcp-pro-block-placeholder-desc">{info.description}</p>
					{info.features?.length > 0 && (
						<ul className="wpcp-pro-block-placeholder-list">
							{info.features.map((feature, index) => (
								<li key={index}>{feature}</li>
							))}
						</ul>
					)}
					<div className="wpcp-pro-block-placeholder-actions">
						{demoLink && (
							<a
								className="wpcp-pro-block-placeholder-demo"
								href={demoLink}
								target="_blank"
								rel="noopener noreferrer"
							>
								{__('View Demo', 'wp-carousel-free')}
							</a>
						)}
						<a
							className="wpcp-pro-block-placeholder-upgrade"
							href={getPricingUrl()}
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('Upgrade to Pro', 'wp-carousel-free')}
						</a>
					</div>
				</div>
				<div
					className="wpcp-pro-block-placeholder-preview"
					// eslint-disable-next-line react/no-danger -- trusted static design SVG, not user input.
					dangerouslySetInnerHTML={{ __html: getBlockPreviewShape(info.slug) }}
				/>
			</div>
		</div>
	);
};

export default memo(ProBlockPlaceholder);
