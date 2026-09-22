/**
 * Click Action Panel – what happens when an item is clicked.
 * Shown for: image source type.
 *
 * Free ships Lightbox and Disable. Link, Both and Override Global Settings are
 * Pro: Link shows as a locked segment that writes nothing, Both is absent, and
 * neither value is in `AllowedValues::CLICK_ACTION_TYPES`. The override toggle
 * is locked, so the lightbox icon always comes from the global Lightbox settings.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo } from '@wordpress/element';
import {
	SPToggleGroupControl,
	Toggle,
	PanelNotice,
	SpProNotice,
} from '@wp-carousel-pro/components';
import {
	isLightboxModuleActive,
	getModulesPageUrl,
} from '../../lightbox/useLightboxModuleSettings';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import { resolveClickActionType } from '../../constants/freeValues';
import { PRO_CLICK_ACTIONS } from '../../constants/proFeatures';

const ACTION_TYPES = [
	{
		label: __('Lightbox', 'wp-carousel-free'),
		value: 'lightbox',
		tooltip: __('Open the image in a popup lightbox on click.', 'wp-carousel-free'),
	},
	{
		label: __('Link', 'wp-carousel-free'),
		value: 'link',
		pro: true,
	},
	{
		label: __('Disable', 'wp-carousel-free'),
		value: 'disable',
		tooltip: __('No action when the item is clicked.', 'wp-carousel-free'),
	},
];

function ClickActionPanel({ attributes, setAttributes, panelOpen, onPanelToggle }) {
	const clickActionOptions = attributes.clickActionOptions || {};
	const setClickActionOptions = useOptionSetter(attributes, setAttributes, 'clickActionOptions');

	const actionType = resolveClickActionType(clickActionOptions.type ?? 'lightbox');
	const moduleActive = isLightboxModuleActive();
	const modulesUrl = getModulesPageUrl();

	return (
		<PanelBody
			title={__('Click Actions', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
			className="wpcp-tab-panel"
		>
			<SPToggleGroupControl
				label={__('Click Action Type', 'wp-carousel-free')}
				attributes={actionType}
				attributesKey="type"
				setAttributes={setClickActionOptions}
				items={ACTION_TYPES}
				extraClass="wpcp-click-action-type"
			/>

			{'lightbox' === actionType && (
				<>
					{!moduleActive && (
						<PanelNotice>
							<p>
								{__('Lightbox requires the Lightbox module to be enabled.', 'wp-carousel-free')}
								{modulesUrl && (
									<>
										{' '}
										<a href={modulesUrl} target="_blank" rel="noopener noreferrer">
											{__('Enable in Modules', 'wp-carousel-free')}
										</a>
									</>
								)}
							</p>
						</PanelNotice>
					)}
					<Toggle
						label={__('Override Global Settings', 'wp-carousel-free')}
						attributes={false}
						onlyPro
					/>
				</>
			)}

			<SpProNotice
				className="is-upsell"
				message={PRO_CLICK_ACTIONS.message}
				linkText={PRO_CLICK_ACTIONS.linkText}
			/>
		</PanelBody>
	);
}

export default memo(ClickActionPanel);
