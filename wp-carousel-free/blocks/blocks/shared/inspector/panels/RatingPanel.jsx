/**
 * Rating Panel – star rating display options.
 * Shown for: product only.
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import { PanelBody } from '@wordpress/components';
import { SPRangeControl, TabControls, SpColorPicker, IconGrid } from '@wp-carousel-pro/components';
import { RatingIconSet } from '@wp-carousel-pro/icons/iconSet';

const RANGER_DEFAULT = {
	device: {
		Desktop: '',
		Tablet: '',
		Mobile: '',
	},
	unit: {
		Desktop: 'px',
		Tablet: 'px',
		Mobile: 'px',
	},
};

function GeneralTab({ attributes, setAttributes }) {
	const ro = attributes.ratingOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'ratingOptions');

	const getIconSize = () => ({
		...RANGER_DEFAULT,
		...ro?.iconSize,
	});
	const getIconGap = () => ({
		...RANGER_DEFAULT,
		...ro?.iconGap,
	});

	const createRangeHandlers = (key, getter) => ({
		onValueChange: ({ value, deviceType }) =>
			set({
				[key]: {
					...getter(),
					device: {
						...RANGER_DEFAULT.device,
						...getter()?.device,
						[deviceType]: value,
					},
				},
			}),

		onUnitChange: ({ unit, deviceType }) =>
			set({
				[key]: {
					...getter(),
					unit: {
						...RANGER_DEFAULT.unit,
						...getter()?.unit,
						[deviceType]: unit,
					},
				},
			}),
		onReset: ({ value, unit, deviceType }) =>
			set({
				[key]: {
					...getter(),
					device: { ...getter()?.device, [deviceType]: value },
					unit: { ...getter()?.unit, [deviceType]: unit },
				},
			}),
	});

	return (
		<>
			{/* <SPToggleGroupControl
				label={__('Rating Icon', 'wp-carousel-free')}
				attributes={ro.iconSource ?? 'library'}
				attributesKey="iconSource"
				setAttributes={set}
				items={ICON_SOURCES}
			/>
			{ro.iconSource === 'library' && (
				<>
				<IconsLibrary
					attributes={ ro.ratingIcon }
					attributesKey={ 'ratingIcon' }
					setAttributes={ () => {} }
					onChange={ ( value ) => { set({ ratingIcon: value })}}
				/>
				</>
			)}
			{ro.iconSource === 'custom' && (
				<>
				<MediaPicker
					backgroundImage={ ro.customIcon }
					attributesKey={ 'customIcon' }
					setAttributes={ () => {} }
					onSelect={ ( value ) => { set({ customIcon: value }) }}
				/>
				</>
			)} */}
			<IconGrid
				label={__('Rating Icon', 'wp-carousel-free')}
				value={ro.ratingIcon || 'star-set-1'}
				options={RatingIconSet}
				onChange={(ratingIcon) => set({ ratingIcon })}
				col={4}
				extClass="wpcp-rating-icon-set"
			/>
			<SPRangeControl
				label={__('Icon Size', 'wp-carousel-free')}
				attributes={getIconSize()}
				attributesKey="iconSize"
				setAttributes={() => {}}
				min={8}
				max={50}
				defaultValue={{ unit: 'px', value: 16 }}
				units={['px', '%', 'em']}
				{...createRangeHandlers('iconSize', getIconSize)}
			/>
			<SPRangeControl
				label={__('Gap Between Icons', 'wp-carousel-free')}
				attributes={getIconGap()}
				attributesKey="iconGap"
				setAttributes={() => {}}
				min={0}
				max={200}
				defaultValue={{ unit: 'px', value: 2 }}
				units={['px', '%', 'em']}
				{...createRangeHandlers('iconGap', getIconGap)}
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const ro = attributes.ratingOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'ratingOptions');

	return (
		<>
			<SpColorPicker
				label={__('Filled Star Color', 'wp-carousel-free')}
				attributes={ro.fillColor ?? '#FFD700'}
				attributesKey="fillColor"
				setAttributes={set}
			/>
			<SpColorPicker
				label={__('Filled Star Hover Color', 'wp-carousel-free')}
				attributes={ro.fillHoverColor ?? ''}
				attributesKey="fillHoverColor"
				setAttributes={set}
			/>
			<SpColorPicker
				label={__('Empty Star Color', 'wp-carousel-free')}
				attributes={ro.emptyColor ?? '#E0E0E0'}
				attributesKey="emptyColor"
				setAttributes={set}
			/>
		</>
	);
}

function RatingPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody title={__('Rating', 'wp-carousel-free')} opened={panelOpen} onToggle={onPanelToggle}>
			<TabControls
				attributes={attributes}
				setAttributes={setAttributes}
				GeneralTab={GeneralTab}
				StyleTab={StyleTab}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
		</PanelBody>
	);
}

export default memo(RatingPanel);
