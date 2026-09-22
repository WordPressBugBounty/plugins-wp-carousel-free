/**
 * Navigation Panel (carousel-style blocks).
 *
 * Surfaces on `carousel`, `slider`,
 * `thumbnails-slider` when `layoutOptions.navigation === true`. Does NOT
 * surface on `tiles`.
 *
 * Single `PanelBody` with General + Style tabs only — no Advanced sub-panel.
 *
 * Attribute home: `attributes.navigationOptions` (declared on each of the five
 * carousel-style block schemas under `src/Blocks/Schema/`).
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo, useState } from '@wordpress/element';
import { TabControls } from '@wp-carousel-pro/components';
import GeneralTabContent from './navigation/tabs/generalTabContent';
import StyleTabContent from './navigation/tabs/styleTabContent';
import { useOptionSetter } from '../../hooks/useOptionSetter';

const EMPTY_OBJECT = {};

function NavigationGeneralTab({ attributes, setAttributes }) {
	const options = attributes.navigationOptions || EMPTY_OBJECT;
	const setOpt = useOptionSetter(attributes, setAttributes, 'navigationOptions');
	return <GeneralTabContent options={options} setOpt={setOpt} blockName={attributes.blockName} />;
}

function NavigationStyleTab({ attributes, setAttributes }) {
	const options = attributes.navigationOptions || EMPTY_OBJECT;
	const setOpt = useOptionSetter(attributes, setAttributes, 'navigationOptions');
	const [styleScope, setStyleScope] = useState('normal');
	return (
		<StyleTabContent
			options={options}
			setOpt={setOpt}
			styleScope={styleScope}
			setStyleScope={setStyleScope}
		/>
	);
}

function NavigationPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	const isTilesBlock = attributes.blockName === 'tiles';
	// Omitted key inherits the schema default (on) — same convention as
	// shouldShowInspectorPanel, so a saved block predating the toggle behaves
	// the same in both gates.
	const navigationEnabled = attributes.layoutOptions?.navigation !== false;
	if (isTilesBlock || !navigationEnabled) {
		return null;
	}

	return (
		<PanelBody
			title={__('Navigation Arrow', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
			<TabControls
				attributes={attributes}
				setAttributes={setAttributes}
				GeneralTab={NavigationGeneralTab}
				StyleTab={NavigationStyleTab}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</PanelBody>
	);
}

export default memo(NavigationPanel);
