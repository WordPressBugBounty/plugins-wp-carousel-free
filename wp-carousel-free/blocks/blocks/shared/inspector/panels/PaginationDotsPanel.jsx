/**
 * Pagination Dots Panel (carousel-style blocks).
 *
 * Surfaces on `carousel`, `slider`,
 * `thumbnails-slider` when `layoutOptions.pagination === true`. Does NOT
 * surface on `tiles`.
 *
 * Single `PanelBody` with General + Style tabs only — no Advanced sub-panel.
 *
 * Attribute home: `attributes.paginationDotsOptions` (declared on each of the
 * five carousel-style block schemas under `src/Blocks/Schema/`).
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo, useState } from '@wordpress/element';
import { TabControls } from '@wp-carousel-pro/components';
import GeneralTabContent from './paginationDots/tabs/generalTabContent';
import StyleTabContent from './paginationDots/tabs/styleTabContent';
import { useOptionSetter } from '../../hooks/useOptionSetter';

const TILES_BLOCK = 'wp-carousel-pro/tiles';
const EMPTY_OBJECT = {};

function PaginationDotsGeneralTab({ attributes, setAttributes }) {
	const options = attributes.paginationDotsOptions || EMPTY_OBJECT;
	const setOpt = useOptionSetter(attributes, setAttributes, 'paginationDotsOptions');
	return <GeneralTabContent options={options} setOpt={setOpt} />;
}

function PaginationDotsStyleTab({ attributes, setAttributes }) {
	const options = attributes.paginationDotsOptions || EMPTY_OBJECT;
	const setOpt = useOptionSetter(attributes, setAttributes, 'paginationDotsOptions');
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

function PaginationDotsPanel({
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
	const paginationEnabled = attributes.layoutOptions?.pagination !== false;
	if (isTilesBlock || !paginationEnabled) {
		return null;
	}

	return (
		<PanelBody
			title={__('Pagination Dots', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
			<TabControls
				attributes={attributes}
				setAttributes={setAttributes}
				GeneralTab={PaginationDotsGeneralTab}
				StyleTab={PaginationDotsStyleTab}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</PanelBody>
	);
}

export { TILES_BLOCK };
export default memo(PaginationDotsPanel);
