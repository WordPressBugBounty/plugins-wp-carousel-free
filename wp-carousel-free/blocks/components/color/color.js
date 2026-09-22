import { Button, ColorPicker, ColorIndicator, Popover, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import { useMemo, memo, useEffect, useState } from '@wordpress/element';
import { ResetIcon } from '../../icons/icons';
import { useSelect } from '@wordpress/data';

const SpColorPicker = (props) => {
	const {
		setAttributes,
		value,
		attributesKey,
		label,
		colorType = 'normal',
		attributes = {},
		onChange,
		resetButton = true,
		defaultColor = '',
		enableAlpha = true,
	} = props;

	const [isVisible, setIsVisible] = useState(false);
	const normalizeColorValue = (rawValue) => {
		if (typeof rawValue === 'string') {
			return rawValue;
		}
		if (!rawValue || typeof rawValue !== 'object') {
			return '';
		}
		if (typeof rawValue.color === 'string') {
			return rawValue.color;
		}
		if (typeof rawValue.hexString === 'string') {
			return rawValue.hexString;
		}
		if (typeof rawValue.hex === 'string') {
			return rawValue.hex.startsWith('#') ? rawValue.hex : `#${rawValue.hex}`;
		}
		const rgb = rawValue.rgb;
		if (rgb && typeof rgb === 'object') {
			const { r = 0, g = 0, b = 0, a } = rgb;
			if (typeof a === 'number' && a >= 0 && a < 1) {
				return `rgba(${r}, ${g}, ${b}, ${a})`;
			}
			return `rgb(${r}, ${g}, ${b})`;
		}
		return '';
	};
	const activeColor = normalizeColorValue(value ?? attributes?.[colorType] ?? attributes);

	const toggleVisible = () => {
		setIsVisible((state) => !state);
	};

	const themeAllColors = useSelect((_select) => {
		const settings = _select('core/block-editor').getSettings();
		const colors = settings?.colors || [];
		const palette = settings?.__experimentalFeatures?.color?.palette;

		const originalColors = palette?.custom ? palette?.theme : undefined;

		return { colors, originalColors };
	}, []);

	const mergedThemeColors = useMemo(
		() => [...(themeAllColors.originalColors || []), ...(themeAllColors.colors || [])],
		[themeAllColors.originalColors, themeAllColors.colors]
	);

	const colorPickerValue = (pickerValue) => normalizeColorValue(pickerValue);

	const handleColorChange = (_value) => {
		const normalizedValue = normalizeColorValue(_value);
		if (colorType && typeof attributes?.[colorType] !== 'undefined') {
			setAttributes({
				[attributesKey]: { ...attributes, [colorType]: normalizedValue },
			});
		} else {
			setAttributes({ [attributesKey]: normalizedValue });
		}
	};

	const setDefault = () => {
		if (onChange) {
			onChange(defaultColor);
		} else {
			handleColorChange(defaultColor);
		}
	};

	useEffect(() => {
		// Bind the close-on-outside-click listener only while the popover is
		// open. Editors mount many color controls; a per-mount page-lifetime
		// listener means every document click runs one handler per closed picker.
		if (!isVisible) {
			return undefined;
		}
		const clickOutSite = (e) => {
			const target = e.target.closest('.wpcp-picker-pallet-wrapper');
			const buttonTarget = e.target.closest('.wpcp-color-picker-right-area .sp-color-picker-btn');
			if (!target && !buttonTarget) {
				setIsVisible(false);
			}
		};
		window.addEventListener('click', clickOutSite);

		return () => window.removeEventListener('click', clickOutSite);
	}, [isVisible]);

	// Compared directly against `defaultColor`, not a mount-time snapshot — a
	// ref-based snapshot re-seeds itself from the already-changed value every
	// time an inspector tab/panel switch remounts this control, hiding the
	// reset button even though the color still differs from its default.
	const colorChange = colorPickerValue(activeColor) !== normalizeColorValue(defaultColor);

	return (
		<div className="wpcp-color-picker wpcp-component-mb">
			<p className="wpcp-component-title">{label}</p>
			<div className="wpcp-color-picker-right-area">
				{resetButton && colorChange && (
					<Button className="wpcp-header-control-reset" onClick={() => setDefault()}>
						<ResetIcon />
					</Button>
				)}
				<Button className="sp-color-picker-btn" onClick={() => toggleVisible()}>
					<ColorIndicator colorValue={colorPickerValue(activeColor)} />
				</Button>

				{isVisible && (
					<Popover shift={true} focusOnMount={false}>
						<div className={`wpcp-picker-pallet-wrapper`}>
							<ColorPicker
								color={colorPickerValue(activeColor)}
								onChange={onChange || handleColorChange}
								enableAlpha={enableAlpha}
							/>
							<p className="sp-default-color-pallet sp-default-theme-color">
								{__('Theme Color', 'wp-carousel-free')}
							</p>
							<ul className="wpcp-color-picker-palette">
								{mergedThemeColors?.map((item, i) => (
									<Tooltip key={i} text={item?.name}>
										<li
											style={{
												backgroundColor: item.color,
											}}
											className={`${item.color === activeColor ? 'active' : ''}`}
										>
											<Button
												aria-label={item.name}
												onClick={() => (onChange ? onChange(item.color) : handleColorChange(item.color))}
												value={item.color}
											/>
										</li>
									</Tooltip>
								))}
							</ul>
						</div>
					</Popover>
				)}
			</div>
		</div>
	);
};

export default memo(SpColorPicker);
