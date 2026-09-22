import { __ } from '@wordpress/i18n';
import { useState, memo, useEffect, useRef } from '@wordpress/element';
import SpColorPicker from '../color/color';
import SPToggleGroupControl from '../toggleGroupControl/toggleGroupControl';
import { DashedStyle, DottedStyle, DoubleStyle, SolidStyle } from '../../icons/icons';
import './editor.scss';
import Spacing from '../spacing/spacing';
import { useDeviceType } from '../../controls/controls';

const Border = ({
	label = 'Border',
	attributes,
	setAttributes,
	attributesKey,
	units = ['px', '%', 'em'],
	btnType = false,
	/** When set, parent provides a single Normal/Hover tab - hide internal Normal/Hover/Active tabs and show only this state. */
	parentState = false,
	defaultValue = {
		unit: 'px',
		value: { top: 0, right: 0, bottom: 0, left: 0 },
	},
	defaultColor = '#fff',
	onStateUpdate = false,
}) => {
	const [buttonTab, setButtonTab] = useState('color');
	const { border, borderWidth } = attributes;
	// When parentState is set, use it instead of internal buttonTab; always use 'style' for border style.
	const effectiveTab = parentState ? parentState : buttonTab;
	const useParentState = parentState === 'normal' || parentState === 'hover';

	const deviceType = useDeviceType();

	const borderColorOptions = [
		{ label: 'Color', value: 'color' },
		...(attributes.border?.hoverColor ||
		attributes.border?.hoverColor === '' ||
		attributes.border?.hover ||
		attributes.border?.hover === ''
			? [{ label: 'Hover', value: 'hover' }]
			: []),
		...(attributes.border?.activeColor ||
		attributes.border?.activeColor === '' ||
		attributes.border?.active ||
		attributes.border?.active === ''
			? [{ label: 'Active', value: 'activeColor' }]
			: []),
	];

	const hoverColor = () => {
		if (border?.hoverColor !== undefined) {
			return 'hoverColor';
		}
		if (border?.hover !== undefined) {
			return 'hover';
		}
		if (border?.activeColor !== undefined) {
			return 'activeColor';
		}
		return 'active';
	};

	// Border style+width are shared across normal/hover — only color differs —
	// so every state reads/writes `style`. Legacy blocks saved before that
	// contract may carry `hoverStyle` instead; read it as a fallback, never
	// write it (writes always target `style`).
	const borderStyleString = () =>
		'style' in (border ?? {}) || !('hoverStyle' in (border ?? {})) ? 'style' : 'hoverStyle';
	const updateBorderWithHandler = (newValue) => {
		if (onStateUpdate) {
			onStateUpdate(attributesKey.borderWidth, newValue);
		}
		return false;
	};

	const SIDE_KEYS = ['top', 'right', 'bottom', 'left'];

	const isSidesEmpty = (sides) => {
		if (!sides || typeof sides !== 'object') {
			return true;
		}
		return SIDE_KEYS.every((s) => {
			const v = sides[s];
			return v === '' || v === undefined || v === null || Number(v) === 0;
		});
	};

	const isBorderWidthEmpty = (bw) => {
		if (!bw || typeof bw !== 'object') {
			return true;
		}
		if (bw.device && typeof bw.device === 'object') {
			const deviceMap = bw.device;
			const keys = Object.keys(deviceMap);
			if (keys.length === 0) {
				return true;
			}
			return keys.every((k) => isSidesEmpty(deviceMap[k]));
		}
		if (bw.value && typeof bw.value === 'object') {
			return isSidesEmpty(bw.value);
		}
		return isSidesEmpty(bw);
	};

	const fillBorderWidthDefault = (bw) => {
		const ones = { top: 1, right: 1, bottom: 1, left: 1 };
		if (bw && bw.device && typeof bw.device === 'object') {
			return {
				...bw,
				device: { ...bw.device, [deviceType]: ones },
			};
		}
		if (bw && bw.value && typeof bw.value === 'object') {
			return { ...bw, value: ones };
		}
		return ones;
	};

	// Auto-fill border-width with 1px on the first transition from 'none'/'' to a real style.
	// Runs in an effect (not the click handler) so the parent's style update commits first;
	// firing the borderWidth update synchronously after the style update would let panels with
	// stale-closure setAttributes (e.g. setTaxonomyOptions) overwrite the just-set style.
	const currentStyle = border?.[borderStyleString()];
	const prevStyleRef = useRef();
	useEffect(() => {
		const prev = prevStyleRef.current;
		const wasInactive = ['none', '', undefined, null].includes(prev);
		const isActive = !['none', ''].includes(currentStyle);
		if (wasInactive && isActive && isBorderWidthEmpty(borderWidth)) {
			const nextBorderWidth = fillBorderWidthDefault(borderWidth);
			if (onStateUpdate) {
				onStateUpdate(attributesKey.borderWidth, nextBorderWidth);
			} else {
				setAttributes({ [attributesKey.borderWidth]: nextBorderWidth });
			}
		}
		prevStyleRef.current = currentStyle;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentStyle]);
	const mergeBorderWidthUnit = (prevUnit, unitDeviceKey, nextUnitStr) => {
		const normalized = String(nextUnitStr ?? '').toLowerCase();
		if (typeof prevUnit === 'string') {
			return { Desktop: normalized, Tablet: normalized, Mobile: normalized };
		}
		return {
			...(prevUnit && typeof prevUnit === 'object' ? prevUnit : {}),
			[unitDeviceKey]: normalized,
		};
	};

	const updateSpacingUtilityHandler = (type, newUtility) => {
		const isUnitPayload =
			type === 'unit' &&
			newUtility &&
			typeof newUtility === 'object' &&
			Object.prototype.hasOwnProperty.call(newUtility, 'unit');
		const unitDevice = isUnitPayload ? newUtility.deviceType || deviceType : deviceType;
		const unitValue = isUnitPayload ? newUtility.unit : newUtility;

		if (onStateUpdate) {
			onStateUpdate(attributesKey.borderWidth, {
				...attributes.borderWidth,
				[type]:
					type === 'unit' && isUnitPayload
						? mergeBorderWidthUnit(attributes.borderWidth?.unit, unitDevice, unitValue)
						: newUtility,
			});
		} else {
			let updateAttr = { ...attributes.borderWidth, [type]: newUtility };
			if (type === 'allChange') {
				updateAttr = { ...attributes.borderWidth, allChange: newUtility };
			} else if (type === 'unit' && isUnitPayload) {
				updateAttr = {
					...attributes.borderWidth,
					unit: mergeBorderWidthUnit(attributes.borderWidth?.unit, unitDevice, unitValue),
				};
			}
			setAttributes({ [attributesKey.borderWidth]: updateAttr });
		}
	};

	return (
		<>
			<div className="wpcp-border-control wpcp-component-mb ">
				<div className="wpcp-header-control sp-mb-8px">
					<span className="wpcp-component-title">{label}</span>
				</div>
				<div
					className={`wpcp-border-style-wrapper${
						!['none', ''].includes(border?.[borderStyleString()]) ? ' wpcp-component-mb' : ''
					}`}
				>
					<SPToggleGroupControl
						attributes={border?.[borderStyleString()]}
						onClick={(newValue) => {
							const nextBorder = { ...border, style: newValue };
							if (onStateUpdate) {
								onStateUpdate(attributesKey.border, nextBorder);
							} else {
								setAttributes({ [attributesKey.border]: nextBorder });
							}
						}}
						items={[
							{ label: 'None', value: 'none' },
							{ label: <SolidStyle />, value: 'solid' },
							{ label: <DashedStyle />, value: 'dashed' },
							{ label: <DottedStyle />, value: 'dotted' },
							{ label: <DoubleStyle />, value: 'double' },
						]}
					/>
				</div>
				{!['none', ''].includes(border?.[borderStyleString()]) && (
					<>
						<div className="wpcp-component-mb">
							<Spacing
								key={borderStyleString()}
								label={'Border Width'}
								attributes={borderWidth}
								attributesKey={attributesKey.borderWidth}
								setAttributes={setAttributes}
								units={units}
								rangeStep={0.5}
								min={0}
								max={10}
								rangeMax={2}
								defaultValue={defaultValue}
								onChange={onStateUpdate ? updateBorderWithHandler : false}
								onUnitChange={(newValue) => updateSpacingUtilityHandler('unit', newValue)}
								updateAllChange={(newValue) => updateSpacingUtilityHandler('allChange', newValue)}
							/>
						</div>
						{!btnType && !useParentState && (
							<SPToggleGroupControl
								attributes={buttonTab}
								items={borderColorOptions}
								onClick={(newValue) => setButtonTab(newValue)}
							/>
						)}
						{/* {[btnType, buttonTab].includes("color") && ( */}
						{((btnType && btnType === 'color') || (!btnType && buttonTab === 'color')) && (
							<SpColorPicker
								label={__('Border Color', 'wp-carousel-free')}
								value={border?.color}
								onChange={(newValue) =>
									onStateUpdate
										? onStateUpdate(attributesKey.border, {
												...border,
												color: newValue,
										  })
										: setAttributes({
												[attributesKey.border]: {
													...border,
													color: newValue,
												},
										  })
								}
								defaultColor={typeof defaultColor === 'object' ? defaultColor.color : defaultColor}
							/>
						)}
						{/* Parent Normal/Hover tabs already scope border state; skip nested hover/active color. */}
						{!useParentState &&
							([btnType, effectiveTab].includes('hover') ||
								[btnType, effectiveTab].includes('activeColor')) && (
								<SpColorPicker
									label={__('Border Color Hover', 'wp-carousel-free')}
									value={border?.[hoverColor()]}
									onChange={(newValue) =>
										onStateUpdate
											? onStateUpdate(attributesKey.border, {
													...border,
													hoverColor: newValue,
											  })
											: setAttributes({
													[attributesKey.border]: {
														...border,
														[hoverColor()]: newValue,
													},
											  })
									}
									defaultColor={typeof defaultColor === 'object' ? defaultColor.hover : defaultColor}
								/>
							)}
					</>
				)}
			</div>
		</>
	);
};

export default memo(Border);
