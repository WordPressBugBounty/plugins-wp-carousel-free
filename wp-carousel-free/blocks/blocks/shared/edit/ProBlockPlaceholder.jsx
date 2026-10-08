/**
 * ProBlockPlaceholder – the canvas card a Pro block renders instead of an
 * editor UI: what it is, a demo link, an upgrade link, a remove button, and a
 * stacked preview of the layout.
 *
 * Marquee and Panorama mount it. Their PHP side is still an EditorPreviewBlock
 * with the full schema, so attributes saved by 3.0.x survive a round trip; the
 * card itself never writes one.
 */

import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { memo } from '@wordpress/element';
import { Icon, close } from '@wordpress/icons';
import { getPricingUrl } from '@wp-carousel-pro/components/pro/proLinks';
import ProIcon from '@wp-carousel-pro/components/pro/proIcon';
import { getProBlockInfo, getProBlockDemoLink } from '../constants/proFeatures';
import { BLOCK_NAME_TO_CATEGORY, isReadyPatternsEnabled } from '../ready-patterns/constants';
import { openReadyPatterns } from '../ready-patterns/openerRegistry';
import BlockPreviewShape from './BlockPreviewShape';
import getPluginUrl from '../utils/pluginUrl';
import './ProBlockPlaceholder.scss';

// Card artwork ships under `src/` so it is packaged; `blocks/` is not.
const IMAGE_DIR = 'src/Blocks/img/';

/**
 * The stacked-sheets artwork for the block's layout.
 *
 * @param {Object} props
 * @param {string} props.file Image file name in `src/Blocks/img/`.
 * @return {JSX.Element|null} Decorative artwork, or null without a plugin URL to load it from.
 */
function ProBlockArtwork({ file }) {
	const base = getPluginUrl();

	if (!base || !file) {
		return null;
	}

	return (
		<div className="wpcp-pro-block-placeholder-art" aria-hidden="true">
			<img src={`${base}${IMAGE_DIR}${file}`} alt="" width="326" height="231" decoding="async" />
		</div>
	);
}

/**
 * View Demo: the block's Ready Patterns when the library is on, else the hosted demo.
 *
 * @param {Object} props
 * @param {string} props.name Full block type name.
 * @return {JSX.Element|null} Demo action, or null when there is nowhere to go.
 */
function DemoAction({ name }) {
	const className = 'wpcp-pro-block-placeholder-demo';

	if (
		isReadyPatternsEnabled() &&
		Object.prototype.hasOwnProperty.call(BLOCK_NAME_TO_CATEGORY, name)
	) {
		return (
			<button
				type="button"
				className={className}
				onClick={() => openReadyPatterns({ blockName: name })}
			>
				{__('View Demo', 'wp-carousel-free')}
			</button>
		);
	}

	const demoLink = getProBlockDemoLink(name);

	if (!demoLink) {
		return null;
	}

	return (
		<a className={className} href={demoLink} target="_blank" rel="noopener noreferrer">
			{__('View Demo', 'wp-carousel-free')}
		</a>
	);
}

const ProBlockCard = ({ name, clientId }) => {
	const blockProps = useBlockProps({ className: 'wpcp-pro-block-placeholder' });
	const { removeBlock } = useDispatch(blockEditorStore);
	const info = getProBlockInfo(name);

	if (!info) {
		return null;
	}

	return (
		<div {...blockProps}>
			<div className="wpcp-pro-block-placeholder-inner">
				<div className="wpcp-pro-block-placeholder-body">
					<h3 className="wpcp-pro-block-placeholder-title">{info.title}</h3>
					<p className="wpcp-pro-block-placeholder-desc">
						{sprintf(
							/* translators: %s: Pro block title, e.g. "Panorama Carousel" */
							__('Unlock %s and advanced layouts by upgrading to the Pro plan.', 'wp-carousel-free'),
							info.title
						)}
					</p>
					<div className="wpcp-pro-block-placeholder-actions">
						<DemoAction name={name} />
						<a
							className="wpcp-pro-block-placeholder-upgrade"
							href={getPricingUrl()}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ProIcon width={18} height={18} />
							{__('Upgrade to Pro', 'wp-carousel-free')}
						</a>
					</div>
				</div>
				<ProBlockArtwork file={info.previewImage} />
				<button
					type="button"
					className="wpcp-pro-block-placeholder-remove"
					aria-label={__('Remove block', 'wp-carousel-free')}
					onClick={() => removeBlock(clientId)}
				>
					<Icon icon={close} size={20} />
				</button>
			</div>
		</div>
	);
};

/**
 * The inserter preview shows the layout shape, like every other block; the canvas shows the card.
 *
 * @param {Object} props Block edit props.
 * @return {JSX.Element|null} Inserter preview or the card.
 */
const ProBlockPlaceholder = (props) => {
	const isPreviewMode = useSelect((select) => {
		const settings = select(blockEditorStore).getSettings();
		return !!(settings.isPreviewMode ?? settings.__unstableIsPreviewMode);
	}, []);

	if (isPreviewMode) {
		return <BlockPreviewShape name={props.name} />;
	}

	return <ProBlockCard {...props} />;
};

export default memo(ProBlockPlaceholder);
