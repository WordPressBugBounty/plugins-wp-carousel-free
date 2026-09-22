import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import SelectField from '@wp-carousel-pro/components/selectField/selectField';
import { DrawerNumberField, DrawerToggleSwitch } from '../components/DrawerWpControlFields';
import { ModuleDeviceTypeProvider } from '../../../controls/moduleDeviceTypeContext';
import ModuleDrawerSection from '../components/ModuleDrawerSection';
import ModuleDrawerRow from '../components/ModuleDrawerRow';
import ModuleDrawerPopupRow from '../components/ModuleDrawerPopupRow';
import LightboxIconPicker from './LightboxIconPicker';
import LightboxIconStylePanel from './LightboxIconStylePanel';
import ModuleDrawerProNote from '../components/ModuleDrawerProNote';
import {
	ModuleDrawerProPopupRow,
	ModuleDrawerProToggleRow,
} from '../components/ModuleDrawerProRow';
import {
	LIGHTBOX_ICON_POSITION_OPTIONS,
	LIGHTBOX_THEME_OPTIONS,
	LIGHTBOX_TRANSITION_OPTIONS,
	LIGHTBOX_THUMBNAIL_OPTIONS,
} from '../config/lightboxConfig';
import {
	defaultLightboxIcon,
	iconOffsetDefault,
	normalizeOffset,
} from '../config/lightboxDefaults';

export default function LightboxSettingsPanel({ draft, patchDraft, disabled, upgradeUrl }) {
	const attributes = draft || {};
	const setAttributes = useCallback(
		(partial) => {
			if (disabled || !partial || typeof partial !== 'object') {
				return;
			}
			patchDraft((prev) => ({
				...prev,
				...partial,
			}));
		},
		[disabled, patchDraft]
	);

	const lightboxIcon = attributes.lightboxIcon || defaultLightboxIcon();
	const iconOffset = useMemo(() => normalizeOffset(attributes.iconOffset), [attributes.iconOffset]);
	const setIconOffset = useCallback(
		(partial) => {
			if (disabled || !partial || typeof partial !== 'object') {
				return;
			}
			patchDraft((prev) => {
				const previousOffset = normalizeOffset(prev?.iconOffset);
				return {
					...prev,
					iconOffset: {
						...previousOffset,
						...partial,
					},
				};
			});
		},
		[disabled, patchDraft]
	);

	if (!draft) {
		return null;
	}

	return (
		<ModuleDeviceTypeProvider>
			<div className="wpcp-lightbox-settings-panel">
				<ModuleDrawerSection title={__('Lightbox Icon', 'wp-carousel-free')}>
					<ModuleDrawerRow
						title={__('Lightbox Icon', 'wp-carousel-free')}
						className="wpcp-module-drawer-row--stacked"
					>
						<LightboxIconPicker
							lightboxIcon={lightboxIcon}
							onChange={(icon) => setAttributes({ lightboxIcon: icon })}
						/>
					</ModuleDrawerRow>
					<ModuleDrawerPopupRow title={__('Lightbox Icon Style', 'wp-carousel-free')}>
						<LightboxIconStylePanel attributes={attributes} setAttributes={setAttributes} />
					</ModuleDrawerPopupRow>
					<ModuleDrawerRow title={__('Icon Display Position', 'wp-carousel-free')}>
						<SelectField
							label=""
							attributes={attributes.iconDisplayPosition || 'top-right'}
							attributesKey="iconDisplayPosition"
							setAttributes={setAttributes}
							items={LIGHTBOX_ICON_POSITION_OPTIONS}
							flexStyle
							extraClassName="wpcp-module-drawer-select"
						/>
					</ModuleDrawerRow>
					<ModuleDrawerRow
						title={__('Offset', 'wp-carousel-free')}
						infoTip={__('Distance from the image edge.', 'wp-carousel-free')}
					>
						<DrawerNumberField
							value={iconOffset.value}
							unit={iconOffset.unit}
							units={['px', '%', 'em']}
							min={0}
							max={200}
							defaultValue={iconOffsetDefault.value}
							defaultUnit={iconOffsetDefault.unit}
							onChange={(nextValue) => setIconOffset({ value: nextValue })}
							onUnitChange={(nextUnit) => setIconOffset({ unit: nextUnit })}
						/>
					</ModuleDrawerRow>
				</ModuleDrawerSection>

				<ModuleDrawerSection title={__('General Setting', 'wp-carousel-free')}>
					<ModuleDrawerRow title={__('Lightbox Theme', 'wp-carousel-free')}>
						<SelectField
							label=""
							attributes={attributes.lightboxTheme || 'dark'}
							attributesKey="lightboxTheme"
							setAttributes={setAttributes}
							items={LIGHTBOX_THEME_OPTIONS}
							flexStyle
							extraClassName="wpcp-module-drawer-select"
						/>
					</ModuleDrawerRow>
					<ModuleDrawerRow title={__('Close When Click Outside', 'wp-carousel-free')}>
						<DrawerToggleSwitch
							label={__('Close When Click Outside', 'wp-carousel-free')}
							checked={!!attributes.closeOnClickOutside}
							onChange={(value) => setAttributes({ closeOnClickOutside: value })}
						/>
					</ModuleDrawerRow>
					<ModuleDrawerProPopupRow
						title={__('Lightbox Slider Settings', 'wp-carousel-free')}
						upgradeUrl={upgradeUrl}
					/>
					<ModuleDrawerRow title={__('Lightbox Navigation Arrow', 'wp-carousel-free')}>
						<DrawerToggleSwitch
							label={__('Lightbox Navigation Arrow', 'wp-carousel-free')}
							checked={!!attributes.navigationArrow}
							onChange={(value) => setAttributes({ navigationArrow: value })}
						/>
					</ModuleDrawerRow>
					<ModuleDrawerRow title={__('Lightbox Transition Effect', 'wp-carousel-free')}>
						<SelectField
							label=""
							attributes={attributes.transitionEffect || 'zoom'}
							attributesKey="transitionEffect"
							setAttributes={setAttributes}
							items={LIGHTBOX_TRANSITION_OPTIONS}
							flexStyle
							extraClassName="wpcp-module-drawer-select"
						/>
					</ModuleDrawerRow>
				</ModuleDrawerSection>

				<ModuleDrawerSection title={__('Lightbox Image and Thumbnails', 'wp-carousel-free')}>
					<ModuleDrawerProToggleRow
						title={__('Image Content', 'wp-carousel-free')}
						upgradeUrl={upgradeUrl}
					/>
					<ModuleDrawerRow
						title={__('Item Counter', 'wp-carousel-free')}
						infoTip={__('Display the current slide number in the gallery.', 'wp-carousel-free')}
					>
						<DrawerToggleSwitch
							label={__('Item Counter', 'wp-carousel-free')}
							checked={!!attributes.itemCounter}
							onChange={(value) => setAttributes({ itemCounter: value })}
						/>
					</ModuleDrawerRow>
					<ModuleDrawerRow title={__('Lightbox Thumbnails Display Style', 'wp-carousel-free')}>
						<SelectField
							label=""
							attributes={attributes.thumbnailsDisplayStyle || 'classic'}
							attributesKey="thumbnailsDisplayStyle"
							setAttributes={setAttributes}
							items={LIGHTBOX_THUMBNAIL_OPTIONS}
							flexStyle
							extraClassName="wpcp-module-drawer-select"
						/>
					</ModuleDrawerRow>
					<ModuleDrawerProToggleRow
						title={__('Transformation controls', 'wp-carousel-free')}
						upgradeUrl={upgradeUrl}
					/>
					<ModuleDrawerProPopupRow
						title={__('Lightbox Toolbar', 'wp-carousel-free')}
						upgradeUrl={upgradeUrl}
					/>
					<ModuleDrawerProToggleRow
						title={__('Right Click Protection', 'wp-carousel-free')}
						upgradeUrl={upgradeUrl}
					/>
					<ModuleDrawerProNote
						text={__('Want these lightbox options?', 'wp-carousel-free')}
						href={upgradeUrl}
					/>
				</ModuleDrawerSection>
			</div>
		</ModuleDeviceTypeProvider>
	);
}
