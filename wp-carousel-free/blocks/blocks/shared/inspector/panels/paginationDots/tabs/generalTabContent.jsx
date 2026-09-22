import { __ } from '@wordpress/i18n';
import { useDeviceType } from '../../../../../../controls/controls';
import { SPRangeControl, SelectDropdown, SPToggleGroupControl } from '@wp-carousel-pro/components';

import { getResolvedPaginationDims } from '../../../../utils/paginationDimsUtils';
import {
	ALIGN_ITEMS,
	DEFAULT_DIM_UNITS,
	DOTS_DYNAMIC_SIZE_DEFAULT,
	STEPPER_WIDTH_DEFAULT,
	STEPPER_HEIGHT_DEFAULT,
	NOOP,
	mergeDimField,
} from './paginationDefaults';
import { PAGINATION_STYLES } from '@wp-carousel-pro/icons/icons';

const RESET_DOT_GAP = {
	device: { Desktop: 8, Tablet: 8, Mobile: 8 },
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
};

export default function GeneralTabContent({ options, setOpt }) {
	const currentStyle = options.paginationStyle ?? 'dots';
	const resolved = getResolvedPaginationDims(options);
	const d = resolved[currentStyle] || resolved.dots;
	const previewDeviceType = useDeviceType();

	const resetDimFieldForDevice = (fieldKey, defaults) => {
		const deviceType = previewDeviceType;
		setOpt(
			mergeDimField(options, currentStyle, fieldKey, {
				device: { [deviceType]: defaults?.device?.[deviceType] },
				unit: { [deviceType]: defaults?.unit?.[deviceType] },
			})
		);
	};

	const resetGapForDevice = (defaults) => {
		const deviceType = previewDeviceType;
		setOpt({
			gap: {
				...options.gap,
				device: {
					...options.gap?.device,
					[deviceType]: defaults?.device?.[deviceType],
				},
				unit: {
					...options.gap?.unit,
					[deviceType]: defaults?.unit?.[deviceType],
				},
			},
		});
	};

	const getDimRangeProps = (fieldKey, defaults) => ({
		onValueChange: ({ value, deviceType }) => {
			setOpt(mergeDimField(options, currentStyle, fieldKey, { device: { [deviceType]: value } }));
		},
		onUnitChange: ({ unit, deviceType }) => {
			setOpt(mergeDimField(options, currentStyle, fieldKey, { unit: { [deviceType]: unit } }));
		},
		defaultValue: defaults,
		setCustomReset: () => resetDimFieldForDevice(fieldKey, defaults),
		units: DEFAULT_DIM_UNITS,
	});

	const handleStyleChange = (value) => {
		const nextFull = getResolvedPaginationDims({ ...options, paginationStyle: value });

		setOpt({
			paginationStyle: value,
			dims: {
				...(options.dims || {}),
				[value]: {
					...nextFull[value],
					...(options.dims?.[value] || {}),
				},
			},
		});
	};

	const gapVal = {
		device: {
			Desktop: options.gap?.device?.Desktop ?? 8,
			Tablet: options.gap?.device?.Tablet ?? 8,
			Mobile: options.gap?.device?.Mobile ?? 8,
		},
		unit: {
			Desktop: options.gap?.unit?.Desktop ?? 'px',
			Tablet: options.gap?.unit?.Tablet ?? 'px',
			Mobile: options.gap?.unit?.Mobile ?? 'px',
		},
	};

	return (
		<>
			<SelectDropdown
				label={__('Pagination Style', 'wp-carousel-free')}
				attributes={currentStyle}
				attributesKey="paginationStyle"
				setAttributes={setOpt}
				onClick={handleStyleChange}
				options={PAGINATION_STYLES}
			/>

			{(currentStyle === 'dots' || currentStyle === 'dynamic') && (
				<>
					<SPRangeControl
						label={__('Width', 'wp-carousel-free')}
						attributes={d.width}
						attributesKey="tempPagItemW"
						setAttributes={NOOP}
						min={2}
						max={80}
						{...getDimRangeProps('width', DOTS_DYNAMIC_SIZE_DEFAULT)}
					/>
					<SPRangeControl
						label={__('Height', 'wp-carousel-free')}
						attributes={d.height}
						attributesKey="tempPagItemH"
						setAttributes={NOOP}
						min={2}
						max={80}
						{...getDimRangeProps('height', DOTS_DYNAMIC_SIZE_DEFAULT)}
					/>
				</>
			)}

			{currentStyle === 'stepper' && (
				<>
					<SPRangeControl
						label={__('Segment width', 'wp-carousel-free')}
						attributes={d.width}
						attributesKey="tempPagStepW"
						setAttributes={NOOP}
						min={4}
						max={80}
						{...getDimRangeProps('width', STEPPER_WIDTH_DEFAULT)}
					/>
					<SPRangeControl
						label={__('Segment height', 'wp-carousel-free')}
						attributes={d.height}
						attributesKey="tempPagStepH"
						setAttributes={NOOP}
						min={2}
						max={24}
						{...getDimRangeProps('height', STEPPER_HEIGHT_DEFAULT)}
					/>
				</>
			)}

			{currentStyle !== 'scrollbar' && (
				<>
					<SPRangeControl
						label={__('Space Between Dots', 'wp-carousel-free')}
						attributes={gapVal}
						attributesKey="tempPagGap"
						setAttributes={NOOP}
						onValueChange={({ value, deviceType }) => {
							const key = deviceType;
							setOpt({
								gap: {
									...options.gap,
									device: { ...options.gap?.device, [key]: value },
								},
							});
						}}
						onUnitChange={({ unit, deviceType }) => {
							const key = deviceType;
							setOpt({
								gap: {
									...options.gap,
									unit: { ...options.gap?.unit, [key]: unit },
								},
							});
						}}
						min={0}
						max={64}
						defaultValue={RESET_DOT_GAP}
						setCustomReset={() => resetGapForDevice(RESET_DOT_GAP)}
						units={DEFAULT_DIM_UNITS}
					/>

					<SPToggleGroupControl
						label={__('Alignment', 'wp-carousel-free')}
						attributes={options.alignment ?? 'center'}
						attributesKey="alignment"
						setAttributes={setOpt}
						items={ALIGN_ITEMS}
						flexStyle={false}
					/>
				</>
			)}
		</>
	);
}
