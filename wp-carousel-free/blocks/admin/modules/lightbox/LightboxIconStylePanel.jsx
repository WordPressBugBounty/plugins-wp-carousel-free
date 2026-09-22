import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';
import Border from '@wp-carousel-pro/components/border/border';
import Divider from '@wp-carousel-pro/components/divider/divider';
import SPRangeControl from '@wp-carousel-pro/components/rangeControl/rangeControl';
import Spacing from '@wp-carousel-pro/components/spacing/spacing';
import { DrawerColorField, DrawerToggleGroupField } from '../components/DrawerWpControlFields';
import {
	iconSizeDefault,
	iconBorderWidthDefault,
	iconBorderRadiusDefault,
	iconPaddingDefault,
	createResponsiveRangeHandlers,
	migrateIconStyleState,
	normalizeRangeAttribute,
	normalizeSpacingAttribute,
	normalizeFlatSpacingAttribute,
} from '../config/lightboxDefaults';

export default function LightboxIconStylePanel({ attributes, setAttributes }) {
	const [activeTab, setActiveTab] = useState('normal');
	const iconStyle = useMemo(() => attributes.iconStyle || {}, [attributes.iconStyle]);

	const state = useMemo(() => {
		const style = attributes.iconStyle || {};
		return migrateIconStyleState(style[activeTab] || {});
	}, [attributes.iconStyle, activeTab]);

	const borderRadius = useMemo(
		() => normalizeFlatSpacingAttribute(iconStyle.borderRadius, iconBorderRadiusDefault),
		[iconStyle.borderRadius]
	);

	const padding = useMemo(
		() => normalizeSpacingAttribute(iconStyle.padding, iconPaddingDefault),
		[iconStyle.padding]
	);

	const iconSize = useMemo(
		() => normalizeRangeAttribute(iconStyle.size, iconSizeDefault),
		[iconStyle.size]
	);

	const patchState = (patch) => {
		setAttributes({
			iconStyle: {
				...iconStyle,
				[activeTab]: {
					...state,
					...patch,
				},
			},
		});
	};

	const patchIconStyleRoot = useCallback(
		(patch) => {
			setAttributes({
				iconStyle: {
					...iconStyle,
					...patch,
				},
			});
		},
		[iconStyle, setAttributes]
	);

	const onStateUpdate = (key, value) => {
		patchState({ [key]: value });
	};

	const getIconSize = useCallback(() => iconSize, [iconSize]);

	const iconSizeHandlers = useMemo(
		() => createResponsiveRangeHandlers('size', getIconSize, patchIconStyleRoot),
		[getIconSize, patchIconStyleRoot]
	);

	const createRootSpacingHandlers = useCallback(
		(key, getter) => ({
			onChange: (value) => patchIconStyleRoot({ [key]: value }),
			onUnitChange: ({ unit, deviceType: unitDevice }) => {
				const current = getter();
				const nextUnit =
					'string' === typeof current?.unit
						? unit
						: {
								...(current?.unit || {}),
								[unitDevice]: unit,
						  };
				patchIconStyleRoot({
					[key]: {
						...current,
						unit: nextUnit,
					},
				});
			},
			updateAllChange: (value) =>
				patchIconStyleRoot({
					[key]: {
						...getter(),
						allChange: value,
					},
				}),
		}),
		[patchIconStyleRoot]
	);

	const getBorderRadius = useCallback(() => borderRadius, [borderRadius]);
	const getPadding = useCallback(() => padding, [padding]);

	const borderRadiusHandlers = useMemo(
		() => createRootSpacingHandlers('borderRadius', getBorderRadius),
		[createRootSpacingHandlers, getBorderRadius]
	);
	const paddingHandlers = useMemo(
		() => createRootSpacingHandlers('padding', getPadding),
		[createRootSpacingHandlers, getPadding]
	);

	return (
		<div className="wpcp-lightbox-icon-style-panel">
			<SPRangeControl
				label={__('Icon Size', 'wp-carousel-free')}
				attributes={iconSize}
				attributesKey="size"
				setAttributes={() => {}}
				units={['px', 'em']}
				min={1}
				max={200}
				defaultValue={iconSizeDefault}
				{...iconSizeHandlers}
			/>

			<DrawerToggleGroupField
				value={activeTab}
				items={[
					{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
					{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
				]}
				onChange={setActiveTab}
			/>

			<DrawerColorField
				label={__('Icon Color', 'wp-carousel-free')}
				value={state.iconColor || ''}
				defaultValue=""
				onChange={(nextColor) => patchState({ iconColor: nextColor })}
			/>
			<DrawerColorField
				label={__('Background Color', 'wp-carousel-free')}
				value={state.backgroundColor || ''}
				defaultValue=""
				onChange={(nextColor) => patchState({ backgroundColor: nextColor })}
			/>

			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{
					border: state.border,
					borderWidth: state.borderWidth,
				}}
				attributesKey={{ border: 'border', borderWidth: 'borderWidth' }}
				setAttributes={(attrs) => patchState(attrs)}
				onStateUpdate={onStateUpdate}
				parentState={activeTab}
				defaultValue={iconBorderWidthDefault}
				defaultColor={state.iconColor || ''}
			/>
			<Divider />

			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={borderRadius}
				attributesKey="borderRadius"
				indicator="radius"
				units={['px', '%', 'em']}
				defaultValue={iconBorderRadiusDefault}
				{...borderRadiusHandlers}
			/>
			<Spacing
				label={__('Padding', 'wp-carousel-free')}
				attributes={padding}
				attributesKey="padding"
				units={['px', '%', 'em']}
				defaultValue={iconPaddingDefault}
				{...paddingHandlers}
			/>
		</div>
	);
}
