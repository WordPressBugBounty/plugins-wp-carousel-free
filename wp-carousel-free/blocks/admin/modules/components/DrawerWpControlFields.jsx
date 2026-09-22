import { __ } from '@wordpress/i18n';
import { useState, useId } from '@wordpress/element';
import {
	BaseControl,
	Button,
	ColorIndicator,
	ColorPicker,
	Popover,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalNumberControl as NumberControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import Units from '../../../components/rangeControl/units';
import { ResetIcon } from '../../../icons/icons';

/**
 * Compact single-line number + unit field for a drawer row (no slider, non-responsive).
 *
 * @param {Object}   props
 * @param {number}   props.value
 * @param {string}   [props.unit]
 * @param {string[]} [props.units]
 * @param {Function} props.onChange      Called with the next numeric value.
 * @param {Function} props.onUnitChange  Called with the next unit string.
 * @param {number}   props.defaultValue
 * @param {string}   [props.defaultUnit]
 * @param {number}   [props.min]
 * @param {number}   [props.max]
 */
export function DrawerNumberField({
	value,
	unit = 'px',
	units = ['px', '%', 'em'],
	onChange,
	onUnitChange,
	defaultValue,
	defaultUnit = 'px',
	min = 0,
	max = 200,
}) {
	const numericValue = Number.isFinite(Number(value)) ? Number(value) : defaultValue;
	const maxForUnit = '%' === unit ? 100 : max;
	const showReset = numericValue !== defaultValue || unit !== defaultUnit;

	const clamp = (next) => {
		const parsed = Number(next);
		if (!Number.isFinite(parsed)) {
			return defaultValue;
		}
		return Math.min(Math.max(parsed, min), maxForUnit);
	};

	return (
		<div className="wpcp-drawer-number-field">
			{showReset && (
				<Button
					className="wpcp-drawer-wp-reset"
					icon={ResetIcon}
					label={__('Reset', 'wp-carousel-free')}
					onClick={() => {
						onChange(defaultValue);
						onUnitChange(defaultUnit);
					}}
					size="small"
				/>
			)}
			<NumberControl
				className="wpcp-drawer-number-field__input"
				value={numericValue}
				min={min}
				max={maxForUnit}
				step={1}
				spinControls="native"
				onChange={(next) => onChange(clamp(next))}
				__next40pxDefaultSize
			/>
			<Units
				attributes={{ unit }}
				units={units}
				onUnitChange={({ unit: nextUnit }) => onUnitChange(nextUnit)}
			/>
		</div>
	);
}

/**
 * Toggle pill only — for use inside a ModuleDrawerRow where the row title is the label.
 * Reuses the module card's own toggle markup and styles.
 *
 * @param {Object}   props
 * @param {string}   props.label    Accessible label (aria-label).
 * @param {boolean}  props.checked
 * @param {Function} props.onChange
 */
export function DrawerToggleSwitch({ label, checked, onChange }) {
	const toggleId = useId();

	return (
		<label className="wpcpf-module-toggle" htmlFor={toggleId} aria-label={label}>
			<input
				id={toggleId}
				type="checkbox"
				checked={!!checked}
				onChange={(event) => onChange(event.target.checked)}
			/>
			<span className="wpcpf-module-toggle-slider" />
		</label>
	);
}

/**
 * @param {Object}   props
 * @param {string}   props.label
 * @param {string}   props.value
 * @param {Function} props.onChange
 * @param {string}   [props.defaultValue]
 * @param {boolean}  [props.hideLabel]    When true, render only the color control.
 */
export function DrawerColorField({ label, value, onChange, defaultValue = '', hideLabel = false }) {
	const [isOpen, setIsOpen] = useState(false);
	const activeColor = value || '';
	const showReset = activeColor !== defaultValue;

	const control = (
		<div className="wpcp-drawer-wp-color-row__control">
			{showReset && (
				<Button
					className="wpcp-drawer-wp-reset"
					icon={ResetIcon}
					label={__('Reset', 'wp-carousel-free')}
					onClick={() => onChange(defaultValue)}
					size="small"
				/>
			)}
			<Button
				className="wpcp-drawer-wp-color-trigger"
				onClick={() => setIsOpen((open) => !open)}
				aria-expanded={isOpen}
				aria-haspopup="dialog"
			>
				<ColorIndicator colorValue={activeColor || undefined} />
			</Button>
			{isOpen && (
				<Popover className="wpcp-drawer-wp-color-popover" onClose={() => setIsOpen(false)} shift>
					<div className="wpcp-drawer-wp-color-popover__inner">
						<ColorPicker color={activeColor} onChange={onChange} enableAlpha />
					</div>
				</Popover>
			)}
		</div>
	);

	if (hideLabel) {
		return control;
	}

	return (
		<div className="wpcp-drawer-wp-color-row">
			<span className="wpcp-drawer-wp-color-row__label">{label}</span>
			{control}
		</div>
	);
}

/**
 * @param {Object}   props
 * @param {string}   [props.label]
 * @param {string}   props.value
 * @param {Array}    props.items
 * @param {Function} props.onChange
 */
export function DrawerToggleGroupField({ label = '', value, items, onChange }) {
	const fieldId = useId();

	return (
		<BaseControl id={fieldId} className="wpcp-drawer-wp-toggle-group" label={label}>
			<ToggleGroupControl
				value={value}
				onChange={onChange}
				isBlock
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			>
				{items.map((item) => (
					<ToggleGroupControlOption
						key={item.value}
						value={item.value}
						label={item.label}
						aria-label={item.ariaLabel || item.label}
					/>
				))}
			</ToggleGroupControl>
		</BaseControl>
	);
}
