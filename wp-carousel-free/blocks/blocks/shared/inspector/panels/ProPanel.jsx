/**
 * A whole-feature Pro panel.
 *
 * Keeps the panel in the inspector so the Free sidebar has the same shape as
 * Pro's, and fills it with the upsell instead of controls. It reads no
 * attributes and calls no setter, so opening it cannot change the block.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo } from '@wordpress/element';
import { SpProNotice } from '@wp-carousel-pro/components';
import { PRO_PANELS } from '../../constants/proFeatures';

const ProPanel = ({ panelId, panelOpen, onPanelToggle }) => {
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
					title={__('Unlock Pro Features!', 'wp-carousel-free')}
					subtitle={info.subtitle}
					features={info.features}
					icon={false}
					linkButton
					className="is-upsell"
				/>
			)}
		</PanelBody>
	);
};

export default memo(ProPanel);
