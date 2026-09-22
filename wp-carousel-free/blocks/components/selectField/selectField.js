import { SelectControl } from '@wordpress/components';
import './editor.scss';
import { memo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDeviceType } from '../../controls/controls';
import Responsive from '../responsive/responsive';

const SelectField = ({
	attributes,
	attributesKey,
	setAttributes,
	label,
	items,
	flexStyle = false,
	onChange = false,
	value = false,
	defaultOption = false,
	extraClassName = '',
}) => {
	// Device check fn
	const deviceType = useDeviceType();
	// A Pro option stays listed so the inspector matches Pro, but it is a real
	// `disabled` <option> and the write is refused here too.
	const proValues = new Set(items.filter((item) => item.pro).map((item) => item.value));

	// Set Button value
	const setNewValue = (newValue) => {
		if (proValues.has(newValue)) {
			return;
		}
		if (attributes?.device) {
			setAttributes({
				[attributesKey]: {
					device: { ...attributes?.device, [deviceType]: newValue },
				},
			});
		} else {
			setAttributes({ [attributesKey]: newValue });
		}
	};

	// Get active button value
	const activeValue = attributes?.device ? attributes?.device?.[deviceType] : attributes;

	const lockedItems = items.map(({ pro, ...item }) =>
		pro
			? {
					...item,
					/* translators: %s: option label. */
					label: sprintf(__('%s (Pro)', 'wp-carousel-free'), item.label),
					disabled: true,
			  }
			: item
	);
	const selectItems = defaultOption
		? [{ label: 'Default', value: '' }, ...lockedItems]
		: lockedItems;

	return (
		<div
			className={`wpcp-select-field wpcp-component-mb ${
				flexStyle ? 'wpcp-d-flex' : 'wpcp-d-block'
			} ${extraClassName}`.trim()}
		>
			<div className="wpcp-header">
				<span className={attributes?.device ? 'wpcp-select-component-title' : 'wpcp-component-title'}>
					{' '}
					{label}
				</span>
				{attributes?.device && <Responsive />}
			</div>
			<SelectControl
				className="custom-select-control"
				value={value ? value : activeValue}
				options={selectItems}
				onChange={(newField) => {
					if (proValues.has(newField)) {
						return;
					}
					if (onChange) {
						onChange(newField);
						return;
					}
					setNewValue(newField);
				}}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
		</div>
	);
};

export default memo(SelectField);
