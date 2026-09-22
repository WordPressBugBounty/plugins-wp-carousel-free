// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __experimentalInputControl as Input, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import { useDeviceType } from '../../controls/controls';
import Responsive from '../responsive/responsive';
import { useState } from '@wordpress/element';

// Inline eye glyphs — the installed @wordpress/icons (v4) has no seen/unseen
// icons, so the toggle ships its own SVGs (same glyphs as the frontend form).
const eyeIconProps = {
	viewBox: '0 0 24 24',
	width: 20,
	height: 20,
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	'aria-hidden': true,
	focusable: false,
};

const eyeShowIcon = (
	<svg {...eyeIconProps}>
		<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
		<circle cx="12" cy="12" r="3" />
	</svg>
);

const eyeHideIcon = (
	<svg {...eyeIconProps}>
		<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
		<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
		<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
		<line x1="1" y1="1" x2="23" y2="23" />
	</svg>
);

const InputControl = ({
	attributes,
	attributesKey,
	setAttributes,
	label,
	ajax = false,
	flex = true,
	inputType = 'number',
	placeholder,
	onChange = false,
	help = false,
	min = 1,
	step = 1,
	max = 100000,
	className = '',
	responsive = true,
}) => {
	// Check device (desktop/tablet/mobile).
	const deviceType = useDeviceType();

	const isNumberInput = inputType === 'number';
	const isPasswordInput = inputType === 'password';
	const [showPassword, setShowPassword] = useState(false);

	const value = attributes?.device ? attributes?.device?.[deviceType] : attributes;
	const [currentValue, setCurrentValue] = useState(value);
	const [ajaxLod, setAjaxLoad] = useState(false);
	const normalizeNumberInputValue = (inputValue) => {
		if (inputType !== 'number') {
			return inputValue;
		}
		return inputValue === 'auto' || inputValue === undefined || inputValue === null ? '' : inputValue;
	};
	const displayValue = normalizeNumberInputValue(ajax ? currentValue : value);

	const setInputValue = (newValue) => {
		if (attributes?.device) {
			setAttributes({
				[attributesKey]: {
					...attributes,
					device: { ...attributes.device, [deviceType]: newValue },
				},
			});
		} else {
			setAttributes({ [attributesKey]: newValue });
		}
	};

	const setClearTimeOut = setTimeout(() => {
		if (ajax && ajaxLod) {
			setInputValue(currentValue);
			setAjaxLoad(false);
		}
	}, 500);

	// Set value function.
	const setValue = (newValue) => {
		// Clamp only numeric inputs; text-like inputs (password, date…) accept any value.
		if (isNumberInput) {
			newValue = newValue > max ? max : newValue;
		}

		if (ajax) {
			clearTimeout(setClearTimeOut);
			setCurrentValue(newValue);
			setAjaxLoad(true);
		} else {
			setInputValue(newValue);
		}
	};

	return (
		<>
			<div className={`wpcp-input-control wpcp-component-mb ${className}`}>
				<div className="wpcp-spacing-part-1">
					<div className={`wpcp-header-input-control ${flex ? 'd-flex' : 'd-block'}`}>
						<div className="wpcp-header-control-left">
							<span className="wpcp-component-title">{label}</span>
							{responsive && attributes?.device && <Responsive />}
						</div>
						<div className="wpcp-header-control-right">
							<Input
								type={isPasswordInput && showPassword ? 'text' : inputType}
								value={displayValue}
								onChange={(val) => (onChange ? onChange(val, deviceType) : setValue(val))}
								placeholder={placeholder} // Use placeholder prop here
								help={help}
								{...(isNumberInput ? { step, min, max } : {})}
								suffix={
									isPasswordInput ? (
										<Button
											label={
												showPassword
													? __('Hide password', 'wp-carousel-free')
													: __('Show password', 'wp-carousel-free')
											}
											onClick={() => setShowPassword(!showPassword)}
											size="small"
											className="wpcp-password-visibility-toggle"
										>
											{showPassword ? eyeHideIcon : eyeShowIcon}
										</Button>
									) : undefined
								}
								__next40pxDefaultSize
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default InputControl;
