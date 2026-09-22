import Select from 'react-select';
import { useMemo } from '@wordpress/element';
import './editor.scss';

const MultipleSelect = ({
	attributes,
	setAttributes,
	attributesKey,
	label,
	items,
	objectData = false,
	value = false,
	onChange = false,
	flex = false,
	reset = false,
	onInputChange = false,
	helpText = '',
}) => {
	// Ensure items is always an array
	const itemsArray = useMemo(() => (Array.isArray(items) ? items : []), [items]);

	// Calculate selected values - filter items that match the attributes array
	// This recalculates when either items or attributes change
	// Handles cases where attributes might not be an array or items might be empty
	const selectedValues = useMemo(() => {
		const attributesArray = Array.isArray(attributes) ? attributes : [];

		if (!attributesArray.length || !itemsArray.length) {
			return [];
		}

		// Normalize both sides for comparison to handle type mismatches (string vs number)
		// Create a Set for O(1) lookup
		const normalizedAttributesSet = new Set(
			attributesArray.map((attr) => {
				const num = Number(attr);
				return isNaN(num) ? String(attr) : num;
			})
		);

		return itemsArray.filter((item) => {
			const itemValue = item?.value;
			if (itemValue === undefined || itemValue === null) {
				return false;
			}
			// Try both the original value and normalized value
			const normalizedItemValue = typeof itemValue === 'number' ? itemValue : Number(itemValue);
			return (
				normalizedAttributesSet.has(itemValue) ||
				(!isNaN(normalizedItemValue) && normalizedAttributesSet.has(normalizedItemValue)) ||
				normalizedAttributesSet.has(String(itemValue))
			);
		});
	}, [attributes, itemsArray]);

	const updateValue = (data) => {
		if (objectData) {
			const updatedValues = data?.map((d) => {
				return { value: d.value, type: d.type };
			});
			setAttributes({ [attributesKey]: updatedValues });
		} else {
			const updatedValues = data?.map((d) => d.value);
			setAttributes({ [attributesKey]: updatedValues });
		}
	};

	return (
		<div className={`wpcp-multi-select ${flex ? 'd-flex' : ''} wpcp-component-mb`}>
			<span className="wpcp-component-title">{label}</span>
			<Select
				value={value ? value : selectedValues}
				isMulti
				options={itemsArray}
				isClearable={reset}
				onChange={(data) => (onChange ? onChange(data) : updateValue(data))}
				onInputChange={(e) => (onInputChange ? onInputChange(e) : '')}
				className="wpcp-basic-multi-select"
			/>
			{helpText && <span className="sp-smart-help-text">{helpText}</span>}
		</div>
	);
};

export default MultipleSelect;
