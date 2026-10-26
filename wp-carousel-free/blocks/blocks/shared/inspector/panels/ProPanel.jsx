/**
 * A whole-feature Pro panel.
 *
 * Keeps the panel in the inspector so the Free sidebar has the same shape as
 * Pro's, and fills it with the upsell instead of controls. It reads no
 * attributes and calls no setter, so opening it cannot change the block.
 */

import { PanelBody } from '@wordpress/components';
import { memo } from '@wordpress/element';
import { SpProNotice } from '@wp-carousel-pro/components';
import { PRO_PANELS, getProPanelBlockName } from '../../constants/proFeatures';

const ProPanel = ({ panelId, blockName, panelOpen, onPanelToggle }) => {
	const info = PRO_PANELS[panelId];

	if (!info) {
		return null;
	}

	return (
		<PanelBody
			title={info.title}
			opened={panelOpen}
			onToggle={onPanelToggle}
			className="wpcp-panel-pro"
		>
			{panelOpen && (
				<SpProNotice
					title={info.noticeTitle(getProPanelBlockName(blockName))}
					subtitle={info.subtitle}
					features={info.features}
					className="is-standalone"
				/>
			)}
		</PanelBody>
	);
};

export default memo(ProPanel);
