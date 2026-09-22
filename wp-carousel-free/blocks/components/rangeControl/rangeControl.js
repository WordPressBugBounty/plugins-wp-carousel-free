import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import '../pro/editor.scss';
import { memo, useState, useEffect, useMemo, useRef, useCallback } from '@wordpress/element';
import { useDeviceType } from '../../controls/controls';
import Responsive from '../responsive/responsive';
import Units from './units';
import ResetButton from './resetBtn';
import { BorderIcon } from '../../icons/icons';
import { sideAxisIcons } from '../../controls/constants';
import { getRangeNumericValue, isRangeValueChanged } from './rangeValueUtils';
import { getPricingUrl } from '../pro/proLinks';

const noop = () => {};

const SPRangeControl = ({
	attributes,
	attributesKey,
	setAttributes = () => {},
	label,
	onValueChange = false,
	onUnitChange = false,
	onReset = false,
	units,
	/** Read-only unit indicator (e.g. "ms") for scalar controls that have a single fixed unit. */
	staticUnit = '',
	resetIcon = true,
	min = 0,
	max = 200,
	step = 1,
	/** Units whose value/visual max auto-clamp to 100 (200 if typoLineHeight). */
	capUnits = ['%'],
	defaultValue = {},
	className = '',
	helpText = '',
	typoLineHeight = false,
	customValue = '',
	setCustomReset = false,
	/** When true, reset is shown only if value/unit differs from default (like location-weather). */
	showResetOnlyWhenChanged = false,
	/** New: Toggle between preset mode (no input) and step mode */
	globalSteps = false,
	/** New: Show side axis icon (top, right, bottom, left) */
	sideAxisIcon = false,
	/** When false, do not render the responsive device switcher icon. */
	showResponsiveIcon = true,
	/** Pro-only row: the row dims, the label carries a "(Pro)" tag and no write happens. */
	onlyPro = false,
}) => {
	const deviceType = useDeviceType();
	const debounceRef = useRef(null);
	const isDragging = useRef(false);
	const lastKnownValue = useRef(null);
	const [showInput, setShowInput] = useState(globalSteps);

	const value = useMemo(
		() => getRangeNumericValue(attributes, deviceType),
		[attributes, deviceType]
	);

	const [currentValue, setCurrentValue] = useState(value);

	const setRangerAttributes = useCallback(
		(newValue) => {
			// A Pro row shows the slider so the inspector matches Pro, but the
			// setter returns before any write — the dimming is presentation.
			if (onlyPro) {
				return;
			}
			if (onValueChange) {
				onValueChange({ value: newValue, deviceType });
				return;
			}
			if (attributes.device) {
				setAttributes({
					[attributesKey]: {
						...attributes,
						device: {
							...attributes.device,
							[deviceType]: newValue,
						},
					},
				});
				return;
			}
			if ('object' === typeof attributes && 'number' === typeof attributes.value) {
				setAttributes({
					[attributesKey]: {
						...attributes,
						value: newValue,
					},
				});
				return;
			}
			setAttributes({ [attributesKey]: newValue });
		},
		[attributes, attributesKey, deviceType, onlyPro, onValueChange, setAttributes]
	);

	useEffect(() => {
		const newValue = getRangeNumericValue(attributes, deviceType);
		if (newValue !== lastKnownValue.current) {
			setCurrentValue(newValue);
			lastKnownValue.current = newValue;
		}
		// Clear the dragging flag after value sync to ensure device switches always reflect the correct value
		isDragging.current = false;
	}, [attributes, deviceType]);

	const unitKey = useMemo(() => {
		if (typeof attributes?.unit === 'string') {
			return attributes.unit;
		}
		return attributes?.unit?.[deviceType];
	}, [attributes?.unit, deviceType]);

	useEffect(() => {
		if (!capUnits.includes(unitKey)) {
			return;
		}
		const n = Number(getRangeNumericValue(attributes, deviceType));
		if (!Number.isFinite(n)) {
			return;
		}
		const cap = typoLineHeight ? 200 : 100;
		if (n <= cap) {
			return;
		}
		setRangerAttributes(cap);
		setCurrentValue(cap);
	}, [unitKey, capUnits, typoLineHeight, attributes, deviceType, setRangerAttributes]);

	const setValue = (newValue) => {
		setCurrentValue(newValue);

		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => {
			debounceRef.current = null;
			setRangerAttributes(newValue);
		}, 100);
	};

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const activeLabel = (e) => {
		const input = e.target.parentNode.parentNode.parentNode;
		const inputId = input.querySelector('input')?.getAttribute('id');
		if (inputId) {
			e.target.setAttribute('for', inputId);
		}
	};

	let maxForUnit = max;
	if ('object' === typeof attributes?.unit && capUnits.includes(attributes?.unit?.[deviceType])) {
		maxForUnit = typoLineHeight ? 200 : 100;
	}

	const rangeValue = customValue !== '' && customValue !== undefined ? customValue : currentValue;

	// A locked row has nothing to reset, and dropping the button gives the label
	// back the header width the "(Pro)" tag takes.
	const showReset =
		resetIcon &&
		!onlyPro &&
		(!showResetOnlyWhenChanged || isRangeValueChanged(attributes, defaultValue, deviceType, value));

	return (
		<div
			className={`wpcp-range-control wpcp-component-mb${
				!attributes?.device && !units ? ' sp-negative-space' : ''
			}${onlyPro ? ' is-pro' : ''} ${className}`.trim()}
		>
			<div className="wpcp-header-control">
				<div className="wpcp-header-control-left">
					<span
						onClick={(e) => activeLabel(e)}
						className={`wpcp-component-title${onlyPro ? ' wpcp-pro-inline-title' : ''}`}
					>
						{label}
					</span>
					{onlyPro && (
						<a
							className="wpcp-pro-inline-tag"
							href={getPricingUrl()}
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('(Pro)', 'wp-carousel-free')}
						</a>
					)}
					{showResponsiveIcon && attributes?.device && <Responsive />}
				</div>
				<div className="wpcp-header-control-right">
					{showReset && (
						<ResetButton
							attributes={attributes}
							setAttributes={setAttributes}
							attributesKey={attributesKey}
							defaultValue={defaultValue}
							value={value}
							setCurrentValue={setCurrentValue}
							setCustomReset={setCustomReset}
							onValueChange={onValueChange}
							onUnitChange={onUnitChange}
							onReset={onReset}
						/>
					)}
					{units && (
						<Units
							attributes={attributes}
							setAttributes={onlyPro ? noop : setAttributes}
							attributesKey={attributesKey}
							units={units}
							onUnitChange={!onlyPro && onUnitChange ? onUnitChange : false}
						/>
					)}
					{!units && staticUnit && (
						<div className="wpcp-units">
							<span className="wpcp-units-indicator-label">{staticUnit}</span>
						</div>
					)}
				</div>
			</div>

			<div className={globalSteps ? `sp-smart-range-control-ranger-row` : ''}>
				{sideAxisIcon && (
					<div className="sp-smart-range-control sp-side-demo-icon">
						<span className="sp-link-side-icon">{sideAxisIcons[sideAxisIcon]}</span>
					</div>
				)}
				<div className="sp-smart-range-control sp-ranger">
					<RangeControl
						value={rangeValue}
						color="var(--wpcp-carousel-primary-2-800)"
						onChange={(newValue) => {
							if (onlyPro) {
								return;
							}
							isDragging.current = true;
							setCurrentValue(newValue);
							if (onValueChange) {
								if (debounceRef.current) {
									clearTimeout(debounceRef.current);
								}
								debounceRef.current = setTimeout(() => {
									debounceRef.current = null;
									isDragging.current = false;
									onValueChange({ value: newValue, deviceType });
								}, 80);
							} else {
								setValue(newValue);
							}
						}}
						disabled={onlyPro}
						min={min}
						max={showInput && globalSteps ? 50 : maxForUnit}
						step={showInput && globalSteps ? 8 : step}
						withInputField={showInput ? false : true}
						marks={showInput ? true : false}
						help={helpText}
						__nextHasNoMarginBottom={true}
						__next40pxDefaultSize
					/>
				</div>
				{globalSteps && (
					<div className="sp-smart-range-control sp-preset-btn" onClick={() => setShowInput(!showInput)}>
						<BorderIcon isActive={!showInput} />
					</div>
				)}
			</div>
		</div>
	);
};

export default memo(SPRangeControl);
