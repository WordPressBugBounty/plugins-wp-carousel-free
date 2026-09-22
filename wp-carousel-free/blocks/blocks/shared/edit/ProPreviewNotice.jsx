/**
 * Canvas banner for a Pro editor-preview block.
 *
 * Sits above the preview to say the block is configurable here but produces no
 * front-end output without WP Carousel Pro.
 *
 * Figma: https://www.figma.com/design/jSLI4lZNWowWPHate1tBQP node 1690:252531
 */

import { __ } from '@wordpress/i18n';
import { getPricingUrl } from '../../../components/pro/proLinks';
import ProIcon from '../../../components/pro/proIcon';
import { getProBlockInfo, getProBlockDemoLink } from '../constants/proFeatures';
import { BLOCK_NAME_TO_CATEGORY, isReadyPatternsEnabled } from '../ready-patterns/constants';
import { openReadyPatterns } from '../ready-patterns/openerRegistry';
import './ProPreviewNotice.scss';

/**
 * @param {Object} props
 * @param {string} props.name Full block type name.
 * @return {JSX.Element|null} The banner, or null for a block with no teaser copy.
 */
export default function ProPreviewNotice({ name }) {
	const info = getProBlockInfo(name);

	if (!info) {
		return null;
	}

	const demoLink = getProBlockDemoLink(name);

	// The block's real demo is its Ready Patterns, and the library is already in
	// this editor — open it filtered rather than sending the user to the demo site.
	// Without the module, or a category to filter by, the hosted demo stands in.
	const opensPatternLibrary =
		isReadyPatternsEnabled() && Object.prototype.hasOwnProperty.call(BLOCK_NAME_TO_CATEGORY, name);

	return (
		<div className="wpcp-pro-preview-notice">
			<p className="wpcp-pro-preview-notice__text">{info.previewNotice}</p>
			<div className="wpcp-pro-preview-notice__actions">
				{opensPatternLibrary && (
					<button
						type="button"
						className="wpcp-pro-preview-notice__demo"
						onClick={() => openReadyPatterns({ blockName: name })}
					>
						{__('View Demo', 'wp-carousel-free')}
					</button>
				)}
				{!opensPatternLibrary && demoLink && (
					<a
						className="wpcp-pro-preview-notice__demo"
						href={demoLink}
						target="_blank"
						rel="noopener noreferrer"
					>
						{__('View Demo', 'wp-carousel-free')}
					</a>
				)}
				<a
					className="wpcp-pro-preview-notice__upgrade"
					href={getPricingUrl()}
					target="_blank"
					rel="noopener noreferrer"
				>
					<ProIcon width={18} height={18} />
					{__('Upgrade to Pro', 'wp-carousel-free')}
				</a>
			</div>
		</div>
	);
}
