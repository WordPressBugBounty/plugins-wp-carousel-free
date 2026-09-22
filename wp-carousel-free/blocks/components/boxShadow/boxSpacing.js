import { Button } from '@wordpress/components';
import Responsive from '../responsive/responsive';
import { useDeviceType } from '../../controls/controls';
import { ResetIcon } from '../../icons/icons';

export const BoxSpacing = ({
	label,
	customClass,
	attributes,
	attributesKey,
	setAttributes,
	boxUnits,
	units,
	labelItem,
	handleReset,
	onChange = false,
}) => {
	const deviceType = useDeviceType();

	// Detect device-specific structure
	const haveDevice = typeof attributes?.device !== 'undefined';

	// Current spacing values
	const attrValue = haveDevice ? attributes?.device?.[deviceType] : attributes?.value;

	// Get correct unit (string or object)
	const currentUnit =
		typeof attributes?.unit === 'object' ? attributes.unit?.[deviceType] : attributes?.unit;

	const setSpacingData = (newValue, side) => {
		const parsed = newValue === '' ? '' : parseInt(newValue);

		const updateValue = haveDevice
			? {
					...attributes,
					device: {
						...attributes.device,
						[deviceType]: {
							...attributes.device?.[deviceType],
							[side]: parsed,
						},
					},
			  }
			: {
					...attributes,
					value: {
						...attributes.value,
						[side]: parsed,
					},
			  };

		if (onChange) {
			onChange(attributesKey, updateValue);
		} else {
			setAttributes({ [attributesKey]: updateValue });
		}
	};

	const setUnit = (value) => {
		const updateUnit = haveDevice ? { ...attributes.unit, [deviceType]: value } : value;

		const updated = { ...attributes, unit: updateUnit };

		if (onChange) {
			onChange(attributesKey, updated);
		} else {
			setAttributes({ [attributesKey]: updated });
		}
	};

	return (
		<div className={`wpcp-spacing${customClass ? ' ' + customClass : ''} wpcp-component-mb`}>
			<div className="wpcp-spacing-part-1">
				<div className="wpcp-header-control">
					<div className="wpcp-header-control-left">
						<span className="wpcp-component-title">{label}</span>
						{attributes?.device && <Responsive />}
					</div>

					<div className="wpcp-header-control-right">
						<Button onClick={handleReset} className="wpcp-header-control-reset">
							<ResetIcon />
						</Button>

						<div className={`wpcp-units ${boxUnits ? 'box' : ''}`}>
							<span className={boxUnits ? 'box-unit' : ''}>{currentUnit}</span>

							<div className="wpcp-units-btn">
								{units?.map((item, i) => (
									<Button
										key={i}
										value={item.toLowerCase()}
										className={currentUnit === item.toLowerCase() ? 'active' : ''}
										onClick={(e) => setUnit(e.target.value)}
									>
										{item}
									</Button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="wpcp-spacing-part-2">
				{['top', 'right', 'bottom', 'left'].map((side, i) => (
					<div key={i} className={`wpcp-spacing-${side}`}>
						<span className="wpcp-spacing-wrapper">
							<input
								id={`wpcp-spacing-${side}-${i}`}
								type="number"
								value={attrValue?.[side] ?? ''}
								onChange={(e) => setSpacingData(e.target.value, side)}
							/>
						</span>
						<label htmlFor={`wpcp-spacing-${side}-${i}`}>{labelItem?.[side]}</label>
					</div>
				))}
			</div>
		</div>
	);
};
