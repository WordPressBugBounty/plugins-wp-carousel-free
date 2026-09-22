/**
 * Card Content Panel – unified, source-aware card configuration.
 * Shown for: all sources. Replaces the former Card Elements, Content, Post
 * Content, and Product Content panels with one panel that has Settings + Style
 * tabs. Routing by `sourceType` lives in the tabs / `cardContent/sourceAccessors`;
 * attributes and emitted CSS are unchanged.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { TabControls } from '@wp-carousel-pro/components';
import { memo } from '@wordpress/element';
import SettingsTab from './cardContent/SettingsTab';
import StyleTab from './cardContent/StyleTab';

function CardContentPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody
			title={__('Card Content', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
			<TabControls
				attributes={attributes}
				setAttributes={setAttributes}
				GeneralTab={SettingsTab}
				StyleTab={StyleTab}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</PanelBody>
	);
}

export default memo(CardContentPanel);
