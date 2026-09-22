import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo } from '@wordpress/element';
import SpColorPicker from '../color/color.js';
import { Tooltip } from '@wordpress/components';
import { BorderIcon, CheckMark, ResetIcon } from '../../icons/icons.js';
import { BoxSpacing } from './boxSpacing.js';
import './editor.scss';
import Toggle from '../toggle/toggle.js';

const SHADOW_PRESETS = [
	{
		title: 'Subtle (1dp)',
		slug: 'subtle-1dp',
		type: 'outset',
		'x-offset': '0',
		'y-offset': '1',
		blur: '2',
		speared: '0',
		color: 'rgba(0, 0, 0, 0.12)',
	},
	{
		title: 'Light (2dp)',
		slug: 'light-2dp',
		type: 'outset',
		'x-offset': '0',
		'y-offset': '2',
		blur: '4',
		speared: '0',
		color: 'rgba(0, 0, 0, 0.14)',
	},
	{
		title: 'Medium (4dp)',
		slug: 'medium-4dp',
		type: 'outset',
		'x-offset': '0',
		'y-offset': '4',
		blur: '6',
		speared: '0',
		color: 'rgba(0, 0, 0, 0.16)',
	},
	{
		title: 'Strong (8dp)',
		slug: 'strong-8dp',
		type: 'outset',
		'x-offset': '0',
		'y-offset': '8',
		blur: '18',
		speared: '0',
		color: 'rgba(0, 0, 0, 0.18)',
	},
	{
		title: 'Deep (12dp)',
		slug: 'deep-12dp',
		type: 'outset',
		'x-offset': '0',
		'y-offset': '12',
		blur: '17',
		speared: '0',
		color: 'rgba(0, 0, 0, 0.20)',
	},
	{
		title: 'Sharp (4dp)',
		slug: 'sharp-4dp',
		type: 'outset',
		'x-offset': '4',
		'y-offset': '4',
		blur: '0',
		speared: '0',
		color: 'rgba(0, 0, 0, 0.25)',
	},
];

const BoxShadow = ({
	label = __('Box Shadow', 'wp-carousel-free'),
	attributes,
	attributesKey,
	setAttributes,
	defaultColor = '#4E4F521A',
	onChange = false,
	/** When true, omit the enable toggle; parent already gates visibility (avoids duplicate toggles). */
	hideEnableToggle = false,
}) => {
	const [selectedShadow, setSelectedShadow] = useState('var(--wpcp-shadow-medium-4dp)');
	const [customShadow, setCustomShadow] = useState(false);
	const availableShadows = useMemo(
		() =>
			SHADOW_PRESETS.map((shadow) => ({
				...shadow,
				cssValue: `var(--wpcp-shadow-${shadow.slug})`,
				value:
					shadow.type === 'inset'
						? `inset ${shadow['x-offset']}px ${shadow['y-offset']}px ${shadow.blur}px ${
								shadow.spread || shadow.speared || 0
						  }px ${shadow.color}`
						: `${shadow['x-offset']}px ${shadow['y-offset']}px ${shadow.blur}px ${
								shadow.spread || shadow.speared || 0
						  }px ${shadow.color}`,
			})),
		[]
	);

	useEffect(() => {
		if (attributes?.selectDefault && attributes.selectDefault !== 'custom') {
			setSelectedShadow(attributes.selectDefault);
		}
		if (attributes?.selectDefault === 'custom') {
			setCustomShadow(true);
		}
	}, [attributes]);

	const shadowColor = (newColor) => {
		if (onChange) {
			onChange(attributesKey, { ...attributes, color: newColor });
		} else {
			setAttributes({
				[attributesKey]: { ...attributes, color: newColor },
			});
		}
	};

	const shadowHandler = (newValue) => {
		setAttributes({
			[attributesKey]: { ...attributes, selectDefault: newValue },
		});
	};

	const handleShadowType = () => {
		const newCustomShadow = !customShadow;
		setCustomShadow(newCustomShadow);

		if (newCustomShadow) {
			// Switching to custom shadow
			if (onChange) {
				onChange(attributesKey, {
					...attributes,
					selectDefault: 'custom',
				});
			} else {
				setAttributes({
					[attributesKey]: {
						...attributes,
						selectDefault: 'custom',
					},
				});
			}
		} else if (selectedShadow && selectedShadow !== 'custom') {
			// Switching back to preset shadows
			shadowHandler(selectedShadow);
		}
	};

	const handleShadowSelect = (newValue) => {
		setSelectedShadow(newValue);
		if (onChange) {
			onChange(attributesKey, { ...attributes, selectDefault: newValue });
		} else {
			shadowHandler(newValue);
		}
	};

	const handleReset = () => {
		// Reset to the default medium shadow's offset/blur/spread/color/unit.
		// In custom mode, `selectDefault` must stay 'custom' — switching it to a
		// preset var here would silently strand the still-visible number inputs:
		// getBoxShadowValue only reads `value` when selectDefault === 'custom'.
		const defaultShadow = availableShadows.length > 2 ? availableShadows[2] : availableShadows[0];
		const defaultVar = defaultShadow?.cssValue || 'var(--wpcp-shadow-medium-4dp)';
		setSelectedShadow(defaultVar);

		const resetValue = {
			...attributes,
			selectDefault: customShadow ? 'custom' : defaultVar,
			unit: defaultShadow?.type ?? 'outset',
			value: {
				top: Number(defaultShadow?.['x-offset'] ?? 0),
				right: Number(defaultShadow?.['y-offset'] ?? 0),
				bottom: Number(defaultShadow?.blur ?? 0),
				left: Number(defaultShadow?.spread ?? defaultShadow?.speared ?? 0),
			},
			color: defaultShadow?.color ?? attributes.color,
		};

		if (onChange) {
			onChange(attributesKey, resetValue);
		} else {
			setAttributes({ [attributesKey]: resetValue });
		}
	};

	const showShadowControls = hideEnableToggle || attributes?.isActive;

	return (
		<>
			{!hideEnableToggle && (
				<Toggle
					label={label}
					attributes={attributes?.isActive}
					onChange={(newVal) => {
						setAttributes({
							[attributesKey]: { ...attributes, isActive: newVal },
						});
					}}
				/>
			)}
			{showShadowControls && (
				<>
					<div className="shadow-selector-container">
						{/* Header */}
						<div className="shadow-selector-header">
							<p className="shadow-selector-title">Shadow Type</p>
							<div className="shadow-selector-actions">
								{!customShadow && (
									<Tooltip text="Reset to default">
										<button className="action-button action-refresh" onClick={handleReset}>
											<ResetIcon />
										</button>
									</Tooltip>
								)}

								<Tooltip text={customShadow ? 'Switch to Presets' : 'Switch to Custom'}>
									<button onClick={handleShadowType} className="action-button">
										<BorderIcon isActive={customShadow} />
									</button>
								</Tooltip>
							</div>
						</div>

						{customShadow ? (
							<BoxSpacing
								key={attributesKey}
								label={__('Box Shadow', 'wp-carousel-free')}
								customClass={'sp-box-shadow'}
								attributes={attributes}
								attributesKey={attributesKey}
								setAttributes={setAttributes}
								boxUnits={true}
								units={['Outset', 'Inset']}
								labelItem={{
									top: __('X Offset', 'wp-carousel-free'),
									right: __('Y Offset', 'wp-carousel-free'),
									bottom: __('Blur', 'wp-carousel-free'),
									left: __('Speared', 'wp-carousel-free'),
								}}
								handleReset={handleReset}
								onChange={onChange}
							/>
						) : (
							<div className="shadow-options-grid">
								{availableShadows?.map((shadow, i) => {
									const shadowCssVar = shadow?.cssValue || `var(--wpcp-shadow-${shadow.slug})`;
									return (
										<Tooltip key={shadow.slug || i} text={shadow.title} className="custom-tooltip">
											<button
												onClick={() => handleShadowSelect(shadowCssVar)}
												className={`shadow-option ${selectedShadow === shadowCssVar ? 'selected' : ''}`}
												style={{
													boxShadow: shadowCssVar,
												}}
											>
												{selectedShadow === shadowCssVar && (
													<div className="checkmark">
														<CheckMark />
													</div>
												)}
											</button>
										</Tooltip>
									);
								})}
							</div>
						)}
					</div>

					{customShadow && (
						<SpColorPicker
							label={__('Shadow Color', 'wp-carousel-free')}
							value={attributes.color}
							onChange={shadowColor}
							defaultColor={defaultColor}
						/>
					)}
				</>
			)}
		</>
	);
};

export default BoxShadow;
