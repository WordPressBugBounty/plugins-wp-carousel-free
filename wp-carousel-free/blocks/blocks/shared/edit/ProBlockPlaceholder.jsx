/**
 * ProBlockPlaceholder – the editor view every Pro block shares.
 *
 * Picking one in the inserter opens the "Do more with WP Carousel Pro" dialog
 * and takes the block straight back out: Free has nothing to render for it. A
 * Pro block already saved in a post (by 3.0.x, or by Pro before a downgrade)
 * stays put as a slim line that opens the same dialog, so no content is lost.
 *
 * Marquee and Panorama keep their full PHP schema, so attributes saved by
 * 3.0.x survive a round trip; this view never writes one.
 */

import { __, sprintf } from '@wordpress/i18n';
import { BlockIcon, useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { memo, useEffect, useRef } from '@wordpress/element';
import { getPricingUrl } from '@wp-carousel-pro/components/pro/proLinks';
import { getProBlockInfo } from '../constants/proFeatures';
import { hasProUpgradeOpener, openProUpgradeDialog } from '../pro-upgrade/openerRegistry';
import useInsertedTeaser from '../pro-upgrade/useInsertedTeaser';
import BlockPreviewShape from './BlockPreviewShape';
import './ProBlockPlaceholder.scss';

const ProBlockLine = ({ name, clientId }) => {
	const blockProps = useBlockProps({ className: 'wpcp-pro-block-placeholder' });
	const { justInserted, removeSilently } = useInsertedTeaser(clientId);
	const info = getProBlockInfo(name);
	// Without a dialog host the block stays and its line links to the pricing page.
	const hasDialog = hasProUpgradeOpener();
	const handsOff = justInserted && hasDialog;
	// StrictMode runs mount effects twice; a ref survives that, so the dialog opens and the block goes once.
	const hasHandedOff = useRef(false);

	useEffect(() => {
		if (!handsOff || hasHandedOff.current) {
			return;
		}

		hasHandedOff.current = true;
		openProUpgradeDialog({ blockName: name });
		removeSilently();
		// Once, for the insert that mounted this block.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [handsOff]);

	if (handsOff) {
		return <div {...blockProps} />;
	}

	if (!info) {
		return null;
	}

	return (
		<div {...blockProps}>
			<div className="wpcp-pro-block-placeholder-line">
				<span className="wpcp-pro-block-placeholder-icon" aria-hidden="true">
					<BlockIcon icon={getBlockType(name)?.icon} />
				</span>
				<span className="wpcp-pro-block-placeholder-text">
					{sprintf(
						/* translators: %s: Pro block title, e.g. "Marquee". */
						__('%s is a WP Carousel Pro block.', 'wp-carousel-free'),
						info.title
					)}
				</span>
				{hasDialog ? (
					<button
						type="button"
						className="wpcp-pro-block-placeholder-learn-more"
						onClick={() => openProUpgradeDialog({ blockName: name })}
					>
						{__('Learn more', 'wp-carousel-free')}
					</button>
				) : (
					<a
						className="wpcp-pro-block-placeholder-learn-more"
						href={getPricingUrl()}
						target="_blank"
						rel="noopener noreferrer"
					>
						{__('Upgrade to Pro', 'wp-carousel-free')}
					</a>
				)}
			</div>
		</div>
	);
};

/**
 * The inserter preview shows the layout shape, like every other block; the canvas hands off to the dialog.
 *
 * @param {Object} props Block edit props.
 * @return {JSX.Element|null} Inserter preview or the line.
 */
const ProBlockPlaceholder = (props) => {
	const isPreviewMode = useSelect((select) => {
		const settings = select(blockEditorStore).getSettings();
		return !!(settings.isPreviewMode ?? settings.__unstableIsPreviewMode);
	}, []);

	if (isPreviewMode) {
		return <BlockPreviewShape name={props.name} />;
	}

	return <ProBlockLine {...props} />;
};

export default memo(ProBlockPlaceholder);
