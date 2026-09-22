import { __ } from '@wordpress/i18n';
import {
	SPRangeControl,
	IconGrid,
	SelectField,
	Toggle,
	SpProNotice,
} from '@wp-carousel-pro/components';
import { PRO_NAVIGATION } from '../../../../constants/proFeatures';
import {
	ARROW_STYLE_OPTIONS,
	DEFAULT_ARROW_SIZE,
	DEFAULT_OFFSET,
	NOOP,
	POSITION_OPTIONS,
	VERTICAL_NAV_POSITIONS,
	OFFSET_X_HIDDEN_POSITIONS,
	OFFSET_X_POSITIVE_ONLY_POSITIONS,
	defaultNavPosition,
	normalizeLengthAttr,
} from './navigationDefaults';

export default function GeneralTabContent({ options, setOpt, blockName }) {
	const arrowSizeVal = {
		device: {
			Desktop: options.arrowSize?.device?.Desktop ?? 16,
			Tablet: options.arrowSize?.device?.Tablet ?? 16,
			Mobile: options.arrowSize?.device?.Mobile ?? 14,
		},
		unit: {
			Desktop: options.arrowSize?.unit?.Desktop ?? 'px',
			Tablet: options.arrowSize?.unit?.Tablet ?? 'px',
			Mobile: options.arrowSize?.unit?.Mobile ?? 'px',
		},
	};

	const handleArrowSizeValueChange = ({ value, deviceType }) => {
		const prev = options.arrowSize || {};
		setOpt({
			arrowSize: {
				device: {
					...DEFAULT_ARROW_SIZE.device,
					...prev.device,
					[deviceType]: value,
				},
				unit: {
					...DEFAULT_ARROW_SIZE.unit,
					...prev.unit,
				},
			},
		});
	};

	const handleArrowSizeUnitChange = ({ unit, deviceType }) => {
		const prev = options.arrowSize || {};
		setOpt({
			arrowSize: {
				device: {
					...DEFAULT_ARROW_SIZE.device,
					...prev.device,
				},
				unit: {
					...DEFAULT_ARROW_SIZE.unit,
					...prev.unit,
					[deviceType]: unit,
				},
			},
		});
	};

	const handleArrowSizeReset = ({ value, unit, deviceType }) => {
		const prev = options.arrowSize || {};
		setOpt({
			arrowSize: {
				device: {
					...DEFAULT_ARROW_SIZE.device,
					...prev.device,
					[deviceType]: value,
				},
				unit: {
					...DEFAULT_ARROW_SIZE.unit,
					...prev.unit,
					[deviceType]: unit,
				},
			},
		});
	};

	const defaultPosition = defaultNavPosition(blockName);
	const pos = options.position ?? defaultPosition;
	const showArrowGap = !VERTICAL_NAV_POSITIONS.has(pos);
	const showOffsetX = !OFFSET_X_HIDDEN_POSITIONS.has(pos);
	const offsetXMin = OFFSET_X_POSITIVE_ONLY_POSITIONS.has(pos) ? 0 : -200;
	const offsetX = normalizeLengthAttr(options.offsetX);
	const offsetY = normalizeLengthAttr(options.offsetY);

	const updateLengthValue =
		(key, current) =>
		({ value }) => {
			setOpt({
				[key]: {
					...current,
					value,
				},
			});
		};

	const updateLengthUnit =
		(key, current) =>
		({ unit }) => {
			setOpt({
				[key]: {
					...current,
					unit,
				},
			});
		};

	const resetLength =
		(key) =>
		({ value, unit }) => {
			setOpt({
				[key]: {
					value,
					unit,
				},
			});
		};

	return (
		<>
			<IconGrid
				label={__('Arrow Style', 'wp-carousel-free')}
				value={options.arrowStyle ?? 'chevron-solid'}
				options={ARROW_STYLE_OPTIONS}
				onChange={(arrowStyle) => setOpt({ arrowStyle })}
			/>

			<SPRangeControl
				label={__('Arrow Size', 'wp-carousel-free')}
				attributes={arrowSizeVal}
				attributesKey="tempNavArrowSize"
				setAttributes={NOOP}
				onValueChange={handleArrowSizeValueChange}
				onUnitChange={handleArrowSizeUnitChange}
				onReset={handleArrowSizeReset}
				max={100}
				defaultValue={DEFAULT_ARROW_SIZE}
				units={['px', '%', 'em']}
			/>

			<Toggle label={__('Show on Hover', 'wp-carousel-free')} onlyPro />

			<SelectField
				label={__('Position', 'wp-carousel-free')}
				attributes={options.position ?? defaultPosition}
				attributesKey="position"
				setAttributes={setOpt}
				items={POSITION_OPTIONS}
			/>

			{showOffsetX && (
				<SPRangeControl
					label={__('Offset X', 'wp-carousel-free')}
					attributes={offsetX}
					attributesKey="offsetX"
					setAttributes={NOOP}
					onValueChange={updateLengthValue('offsetX', offsetX)}
					onUnitChange={updateLengthUnit('offsetX', offsetX)}
					onReset={resetLength('offsetX')}
					min={offsetXMin}
					max={200}
					defaultValue={DEFAULT_OFFSET}
					units={['px', '%', 'em']}
				/>
			)}

			<SPRangeControl
				label={__('Offset Y', 'wp-carousel-free')}
				attributes={offsetY}
				attributesKey="offsetY"
				setAttributes={NOOP}
				onValueChange={updateLengthValue('offsetY', offsetY)}
				onUnitChange={updateLengthUnit('offsetY', offsetY)}
				onReset={resetLength('offsetY')}
				min={-200}
				max={200}
				defaultValue={DEFAULT_OFFSET}
				units={['px', '%', 'em']}
			/>

			{showArrowGap && (
				<SPRangeControl
					label={__('Gap Between Arrows', 'wp-carousel-free')}
					attributes={options.gapBetweenArrows ?? 10}
					attributesKey="gapBetweenArrows"
					setAttributes={setOpt}
					min={0}
					max={200}
					defaultValue={10}
				/>
			)}

			<SpProNotice
				className="is-upsell"
				message={PRO_NAVIGATION.message}
				linkText={PRO_NAVIGATION.linkText}
			/>
		</>
	);
}
