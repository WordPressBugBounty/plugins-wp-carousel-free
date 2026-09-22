// V1

import { RangeControl } from '@wordpress/components';
import { ResetButton, SpLinkedButton, Units } from '../utility';
import Responsive from '../responsive/responsive';
import { BorderIcon } from '../../icons/icons';
import './editor.scss';
import { sideAxisIcons } from '../../controls/constants';
import { useDeviceType } from '../../controls/controls';
import { memo, useCallback, useEffect, useState } from '@wordpress/element';

const SpCustomRanger = ({
	attr,
	sideKey = 'all',
	onChangeHandler,
	rangeStep,
	min,
	max,
	step,
	rangeMax,
	indicator = '',
	selectUnit = '',
	showSideIcon = true,
}) => {
	const [showInput, setShowInput] = useState(true); // when user clicks presetControl
	const rangerStep = showInput ? rangeStep : step;
	const iconType = indicator ? `${indicator}-${sideKey}` : sideKey;

	const rangerValue = () => {
		if (sideKey === 'all') {
			return Number(attr.top) || '';
		}
		return Number(attr[sideKey] || '');
	};

	const rangeValue = rangerValue();
	useEffect(() => {
		if (rangeValue % rangeStep !== 0) {
			setShowInput(false);
		}
		if (rangeMax && rangeValue > rangeMax) {
			setShowInput(false);
		}
		if (typeof rangeValue === 'undefined' || rangeValue === '') {
			setShowInput(true);
		}
	}, [step, sideKey, attr, rangeStep, rangeMax, rangeValue]);

	return (
		<div className="sp-smart-range-control-ranger-row">
			{showSideIcon && (
				<div className="sp-smart-range-control sp-side-demo-icon">
					<span className="sp-link-side-icon">{sideAxisIcons[iconType]}</span>
				</div>
			)}
			<div className="sp-smart-range-control sp-ranger">
				<RangeControl
					value={rangeValue || 0}
					onChange={(val) => onChangeHandler(sideKey, val)}
					step={rangerStep}
					min={min}
					max={showInput && rangeMax ? rangeMax : max}
					withInputField={showInput ? false : true}
					marks={showInput ? true : false}
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					renderTooltipContent={(value) => `${value}${selectUnit}`}
				/>
			</div>
			<div className="sp-smart-range-control sp-preset-btn" onClick={() => setShowInput(!showInput)}>
				<BorderIcon isActive={!showInput} />
			</div>
		</div>
	);
};

const Spacing = ({
	label,
	attributes,
	attributesKey,
	setAttributes = () => {},
	onChange,
	onReset,
	units = ['px', '%', 'em'],
	rangeStep = 8,
	step = 1,
	min = 0,
	max = 300,
	rangeMax = 50,
	resetIcon = true,
	onUnitChange = false,
	// sidesAxis = false, // array [ 'horizontal', 'vertical']
	indicator = '',
	defaultValue = {
		unit: 'px',
		value: { top: '', right: '', bottom: '', left: '' },
	},
	customClass = '',
	updateAllChange,
	showLink = true,
	showSideIcon = true,
}) => {
	const deviceType = useDeviceType();

	const attrValue = useCallback(() => {
		let attributesValue;
		if ('object' === typeof attributes?.device) {
			attributesValue = attributes?.device?.[deviceType];
		} else if ('object' === typeof attributes?.value) {
			attributesValue = attributes?.value;
		} else {
			attributesValue = attributes;
		}
		if (attributesValue && typeof attributesValue === 'object') {
			return attributesValue;
		}
		const empty = { top: '', right: '', bottom: '', left: '' };
		if (defaultValue?.value && typeof defaultValue.value === 'object') {
			return { ...empty, ...defaultValue.value };
		}
		return empty;
	}, [attributes, defaultValue, deviceType]);

	const [simpleAttr, setSimpleAttr] = useState(() => attrValue());

	useEffect(() => {
		setSimpleAttr(attrValue());
	}, [attrValue]);

	let linked = true;
	if (showLink) {
		linked = attributes?.allChange === undefined ? true : attributes?.allChange;
	}

	// Active Label function
	const activeLabel = (e) => {
		const input = e.target.parentNode.parentNode.parentNode;
		const inputId = input.querySelector('input')?.getAttribute('id');
		if (inputId) {
			e.target.setAttribute('for', inputId);
		}
	};

	const commitAttributes = useCallback(
		(newAttributes) => {
			if (onChange) {
				onChange(newAttributes);
			} else {
				setAttributes({ [attributesKey]: newAttributes });
			}
		},
		[onChange, setAttributes, attributesKey]
	);

	const onChangeHandler = (side, newVal) => {
		let updatedValue = { ...simpleAttr };

		switch (side) {
			case 'all':
				updatedValue = {
					top: newVal,
					right: newVal,
					bottom: newVal,
					left: newVal,
				};
				break;
			default:
				updatedValue[side] = newVal;
				break;
		}

		let newAttributes;
		if (attributes?.device && typeof attributes.device === 'object') {
			newAttributes = {
				...attributes,
				device: {
					...attributes.device,
					[deviceType]: updatedValue,
				},
			};
		} else {
			newAttributes = {
				...attributes,
				value: updatedValue,
			};
		}
		commitAttributes(newAttributes);
		setSimpleAttr(updatedValue);
	};

	const resolveResetSides = () => {
		if (defaultValue?.value && typeof defaultValue.value === 'object') {
			return defaultValue.value;
		}
		if (defaultValue?.device?.[deviceType]) {
			return defaultValue.device[deviceType];
		}
		if (defaultValue?.device?.Desktop) {
			return defaultValue.device.Desktop;
		}
		return { top: '', right: '', bottom: '', left: '' };
	};

	const onValueReset = () => {
		const resetValue = resolveResetSides();
		let newAttributes;
		if (attributes?.device && typeof attributes.device === 'object') {
			newAttributes = {
				...attributes,
				device: {
					...attributes.device,
					[deviceType]: resetValue,
				},
			};
		} else {
			newAttributes = {
				...attributes,
				value: resetValue,
			};
		}
		if (defaultValue?.allChange !== undefined) {
			newAttributes.allChange = defaultValue.allChange;
		}
		commitAttributes(newAttributes);
		if (onReset) {
			onReset(newAttributes);
		}
		setSimpleAttr(resetValue);
	};

	const handleUpdateAllChange =
		updateAllChange || ((value) => commitAttributes({ ...attributes, allChange: value }));

	// useEffect(() => {
	// 	const deviceValue = attributes?.device?.[deviceType];
	// 	if (deviceValue) {
	// 		if (Object.values(deviceValue).every((side) => side === deviceValue.top)) {
	// 			setAttributes({
	// 				[attributesKey]: { ...attributes, allChange: true },
	// 			});
	// 		}
	// 	}
	// }, []);

	return (
		<div
			className={`wpcp-spacing-range-control wpcp-range-control wpcp-component-mb${
				customClass ? ' ' + customClass : ''
			}`}
		>
			<div className="wpcp-header-control">
				<div className="wpcp-header-control-left">
					<span onClick={(e) => activeLabel(e)} className="wpcp-component-title">
						{label}
					</span>
					{attributes?.device && <Responsive />}
				</div>
				<div className="wpcp-header-control-right">
					{resetIcon && <ResetButton onClick={() => onValueReset()} />}
					{showLink && (
						<SpLinkedButton
							attributes={attributes}
							attributesKey={attributesKey}
							setAttributes={setAttributes}
							Icon={indicator ? sideAxisIcons['radius-all'] : sideAxisIcons.all}
							updateAllChange={handleUpdateAllChange}
						/>
					)}
					{units && (
						<Units
							attributes={attributes}
							setAttributes={setAttributes}
							attributesKey={attributesKey}
							units={units}
							onUnitChange={onUnitChange ? onUnitChange : false}
						/>
					)}
				</div>
			</div>
			{linked && (
				<SpCustomRanger
					key={linked}
					attr={simpleAttr}
					sideKey={'all'}
					onChangeHandler={onChangeHandler}
					min={min}
					max={max}
					rangeStep={rangeStep}
					step={step}
					rangeMax={rangeMax}
					indicator={indicator}
					selectUnit={attributes.unit?.[deviceType]}
					showSideIcon={showSideIcon}
				/>
			)}
			{!linked &&
				['top', 'right', 'bottom', 'left'].map((side) => (
					<SpCustomRanger
						key={`${side}${linked}`}
						attr={simpleAttr}
						sideKey={side}
						onChangeHandler={onChangeHandler}
						min={min}
						max={max}
						rangeStep={rangeStep}
						step={step}
						rangeMax={rangeMax}
						indicator={indicator}
						selectUnit={attributes?.unit?.[deviceType] || attributes?.unit}
						showSideIcon={showSideIcon}
					/>
				))}
		</div>
	);
};

export default memo(Spacing);

// Update Version of Space Control v2.
// import { RangeControl } from '@wordpress/components';
// import { __ } from '@wordpress/i18n';
// import { ResetButton, SpLinkedButton, Units } from '../utility';
// import Responsive from '../responsive/responsive';
// import { BorderIcon } from '../../icons/icons';
// import './editor.scss';
// import { sideAxisIcons } from '../../controls/constants';
// import { useDeviceType } from '../../controls/controls';
// import { memo, useEffect, useState, useMemo } from '@wordpress/element';

// const SpCustomRanger = ({
// 	attr,
// 	sideKey = 'all',
// 	onChangeHandler,
// 	rangeStep,
// 	min,
// 	max,
// 	step,
// 	rangeMax,
// 	indicator = '',
// 	selectUnit = '',
// }) => {
// 	const [showInput, setShowInput] = useState(true);
// 	const rangerStep = showInput ? rangeStep : step;
// 	const iconType = indicator ? `${indicator}-${sideKey}` : sideKey;

// 	// FIX: Use nullish check so 0 is treated as a number, not a falsy empty string
// 	const rangeValue = useMemo(() => {
// 		const val = sideKey === 'all' ? attr?.top : attr?.[sideKey];
// 		return val !== undefined && val !== null && val !== '' ? Number(val) : 0;
// 	}, [attr, sideKey]);

// 	return (
// 		<div className="sp-smart-range-control-ranger-row">
// 			<div className="sp-smart-range-control sp-side-demo-icon">
// 				<span className="sp-link-side-icon">{sideAxisIcons[iconType]}</span>
// 			</div>
// 			<div className="sp-smart-range-control sp-ranger">
// 				<RangeControl
// 					value={rangeValue}
// 					onChange={(val) => onChangeHandler(sideKey, val)}
// 					step={rangerStep}
// 					min={min}
// 					max={showInput && rangeMax ? rangeMax : max}
// 					withInputField={!showInput}
// 					marks={showInput}
// 					__nextHasNoMarginBottom
// 					__next40pxDefaultSize
// 					renderTooltipContent={(value) => `${value}${selectUnit || ''}`}
// 				/>
// 			</div>
// 			<div className="sp-smart-range-control sp-preset-btn" onClick={() => setShowInput(!showInput)}>
// 				<BorderIcon isActive={!showInput} />
// 			</div>
// 		</div>
// 	);
// };

// const Spacing = ({
// 	label,
// 	attributes,
// 	attributesKey,
// 	setAttributes = () => {},
// 	onChange,
// 	units = false,
// 	rangeStep = 8,
// 	step = 1,
// 	min = 0,
// 	max = 300,
// 	rangeMax = 50,
// 	resetIcon = true,
// 	onUnitChange = false,
// 	indicator = '',
// 	defaultValue = { top: 0, right: 0, bottom: 0, left: 0 },
// 	customClass = '',
// }) => {
// 	const deviceType = useDeviceType();

// 	// FIX: Match "desktop" hook value to "Desktop" attribute key
// 	const normalizedDevice = deviceType.charAt(0).toUpperCase() + deviceType.slice(1);

// 	const getDeviceAttr = () => {
// 		return attributes?.device?.[normalizedDevice] || attributes?.value || attributes || {};
// 	};

// 	// FIX: Ensure state updates when the device or attributes change externally
// 	const [simpleAttr, setSimpleAttr] = useState(getDeviceAttr());

// 	useEffect(() => {
// 		setSimpleAttr(getDeviceAttr());
// 	}, [deviceType, attributes]);

// 	const linked = attributes?.allChange || false;

// 	const onChangeHandler = (side, newVal) => {
// 		let updatedValue = { ...simpleAttr };

// 		if (side === 'all') {
// 			updatedValue = { top: newVal, right: newVal, bottom: newVal, left: newVal };
// 		} else {
// 			updatedValue[side] = newVal;
// 		}

// 		const newAttributes = {
// 			...attributes,
// 			device: {
// 				...attributes?.device,
// 				[normalizedDevice]: updatedValue,
// 			},
// 		};

// 		if (onChange) {
// 			onChange(newAttributes);
// 		} else {
// 			setAttributes({ [attributesKey]: newAttributes });
// 		}
// 		setSimpleAttr(updatedValue);
// 	};

// 	const onValueReset = () => {
// 		const resetVal = defaultValue?.value || defaultValue;
// 		onChangeHandler('all', resetVal.top || 0);
// 	};

// 	return (
// 		// <div className={`wpcp-spacing-range-control wpcp-range-control ${customClass}`}>
// 		<div
// 			className={`wpcp-spacing-range-control wpcp-range-control wpcp-component-mb${
// 				customClass ? ' ' + customClass : ''
// 			}`}
// 		>
// 			<div className="wpcp-header-control">
// 				<div className="wpcp-header-control-left">
// 					<span className="wpcp-component-title">{label}</span>
// 					{attributes?.device && <Responsive />}
// 				</div>
// 				<div className="wpcp-header-control-right">
// 					{resetIcon && <ResetButton onClick={onValueReset} />}
// 					<SpLinkedButton
// 						attributes={attributes}
// 						attributesKey={attributesKey}
// 						setAttributes={setAttributes}
// 						Icon={indicator ? sideAxisIcons['radius-all'] : sideAxisIcons.all}
// 					/>
// 					{units && (
// 						<Units
// 							attributes={attributes}
// 							setAttributes={setAttributes}
// 							attributesKey={attributesKey}
// 							units={units}
// 							onUnitChange={onUnitChange}
// 						/>
// 					)}
// 				</div>
// 			</div>

// 			<div className="wpcp-spacing-body">
// 				{linked ? (
// 					<SpCustomRanger
// 						attr={simpleAttr}
// 						sideKey="all"
// 						onChangeHandler={onChangeHandler}
// 						min={min}
// 						max={max}
// 						rangeStep={rangeStep}
// 						step={step}
// 						rangeMax={rangeMax}
// 						indicator={indicator}
// 						selectUnit={attributes?.unit?.[normalizedDevice]}
// 					/>
// 				) : (
// 					['top', 'right', 'bottom', 'left'].map((side) => (
// 						<SpCustomRanger
// 							key={side}
// 							attr={simpleAttr}
// 							sideKey={side}
// 							onChangeHandler={onChangeHandler}
// 							min={min}
// 							max={max}
// 							rangeStep={rangeStep}
// 							step={step}
// 							rangeMax={rangeMax}
// 							indicator={indicator}
// 							selectUnit={attributes?.unit?.[normalizedDevice]}
// 						/>
// 					))
// 				)}
// 			</div>
// 		</div>
// 	);
// };

// export default memo(Spacing);
