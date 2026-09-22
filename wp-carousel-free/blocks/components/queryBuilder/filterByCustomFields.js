import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import ChildPanelBody from '../childPanelBody/childPanelBody';
import InputControl from '../inputControl/inputControl';
import SelectField from '../selectField/selectField';
import { getObjectValuesToJsArray } from '../../blocks/shared/utils/dom';

const CustomFields = ({ props }) => {
	const { data, resetButton, updateCustomFieldsData, metaKeysSelectOptions } = props;
	const { id, key, value, operator, type } = data;

	const textOperators = [
		{ label: 'Equal (=)', value: '=' },
		{ label: 'Not Equal (!=)', value: '!=' },
		{ label: 'Like', value: 'LIKE' },
		{ label: 'Not Like', value: 'NOT LIKE' },
		{ label: 'In', value: 'IN' },
		{ label: 'Not In', value: 'NOT IN' },
		{ label: 'Exists', value: 'EXISTS' },
		{ label: 'Not Exists', value: 'NOT EXISTS' },
	];
	const numberOperators = [
		{ label: 'Equal (=)', value: '=' },
		{ label: 'Not Equal (!=)', value: '!=' },
		{ label: 'Greater (>)', value: '>' },
		{ label: 'Greater or Equal (>=)', value: '>=' },
		{ label: 'Less (<)', value: '<' },
		{ label: 'Less or Equal (<=)', value: '<=' },
		{ label: 'In', value: 'IN' },
		{ label: 'Not In', value: 'NOT IN' },
		{ label: 'Between', value: 'BETWEEN' },
		{ label: 'Not Between', value: 'NOT BETWEEN' },
		{ label: 'Exists', value: 'EXISTS' },
		{ label: 'Not Exists', value: 'NOT EXISTS' },
	];
	const dateOperators = [
		{ label: 'Today', value: 'TODAY' },
		{ label: 'Now and Past', value: 'NOW_PAST' },
		{ label: 'Now and Future', value: 'NOW_FUTURE' },
		{ label: 'In the past', value: 'IN_PAST' },
		{ label: 'Equal(=)', value: '=' },
		{ label: 'Not Equal(!=)', value: '!=' },
		{ label: 'Greater(>)', value: '>' },
		{ label: 'Greater or Equal (>=)', value: '>=' },
		{ label: 'Less (<)', value: '<' },
		{ label: 'Less or Equal (<=)', value: '<=' },
		{ label: 'Between', value: 'BETWEEN' },
		{ label: 'Not Between', value: 'NOT BETWEEN' },
		{ label: 'Exists', value: 'EXISTS' },
		{ label: 'Not Exists', value: 'NOT EXISTS' },
	];
	const booleanOperators = [
		{ label: 'Equal(=)', value: '=' },
		{ label: 'Not Equal(!=)', value: '!=' },
		{ label: 'Exists', value: 'EXISTS' },
		{ label: 'Not Exists', value: 'NOT EXISTS' },
	];

	const inputTypesData = {
		CHAR: {
			value: textOperators,
			input: 'text',
		},
		NUMERIC: {
			value: numberOperators,
			input: 'number',
		},
		DATE: {
			value: dateOperators,
			input: 'date',
		},
		BOOLEAN: {
			value: booleanOperators,
			input: 'dropdown',
		},
	};
	const operatorValues = inputTypesData[type]?.value;
	const inputType = inputTypesData[type]?.input;
	const metaTitle = key && key.trim() ? key : __('Select Field Key', 'wp-carousel-free');

	return (
		<div className="wpcp-taxonomies">
			<ChildPanelBody
				title={metaTitle}
				initialOpen={true}
				resetIcon={true}
				resetButtonAction={() => resetButton(id)}
			>
				<SelectField
					label={__('Custom Fields Key', 'wp-carousel-free')}
					attributes={key}
					multiple={false}
					onChange={(e) => updateCustomFieldsData(id, 'key', e)}
					items={[{ label: 'Select key', value: '' }, ...metaKeysSelectOptions]}
				/>
				<SelectField
					label={__('Value Type', 'wp-carousel-free')}
					attributes={type}
					onChange={(e) => updateCustomFieldsData(id, 'type', e)}
					items={[
						{ label: 'Text', value: 'CHAR' },
						{ label: 'Number', value: 'NUMERIC' },
						{ label: 'Date', value: 'DATE' },
						{ label: 'True/False', value: 'BOOLEAN' },
					]}
				/>
				<SelectField
					label={__('Compare Operator', 'wp-carousel-free')}
					attributes={operator}
					onChange={(e) => updateCustomFieldsData(id, 'operator', e)}
					flexStyle={false}
					items={operatorValues}
				/>
				{inputType !== 'dropdown' && (
					<InputControl
						label={__('Compare Value', 'wp-carousel-free')}
						attributes={value}
						inputType={inputType}
						flex={false}
						onChange={(e) => updateCustomFieldsData(id, 'value', e)}
					/>
				)}
				{inputType === 'dropdown' && (
					<SelectField
						label={__('Compare Value', 'wp-carousel-free')}
						attributes={value}
						items={[
							{ label: 'True', value: 'true' },
							{ label: 'False', value: 'false' },
						]}
						flex={true}
						onChange={(e) => updateCustomFieldsData(id, 'value', e)}
					/>
				)}
			</ChildPanelBody>
		</div>
	);
};

const FilterByCustomFields = ({ attributes, setAttributes, metaKeys }) => {
	const { filterByCustomFields, customFieldRelation } = attributes;
	const metaKeysArray = getObjectValuesToJsArray(metaKeys);
	const metaKeysSelectOptions = metaKeysArray?.map((meta) => {
		return { label: meta, value: meta };
	});
	// Holds the pending commit timer and the latest rows so rapid edits in
	// different fields commit together instead of the last edit winning.
	const commitTimerRef = useRef(null);
	const pendingRowsRef = useRef(filterByCustomFields);
	// Keep the pending rows in step with externally replaced attributes
	// (undo/redo, reset) so the next edit builds on the current rows — but
	// never clobber rows an uncommitted edit already staged.
	if (!commitTimerRef.current) {
		pendingRowsRef.current = filterByCustomFields;
	}

	useEffect(() => {
		return () => {
			clearTimeout(commitTimerRef.current);
		};
	}, []);

	// Commit any edit still inside the debounce window before a structural
	// change (add/reset) replaces the rows — otherwise the pending edit is
	// silently dropped by the replacement.
	const flushPendingEdit = () => {
		if (commitTimerRef.current) {
			clearTimeout(commitTimerRef.current);
			commitTimerRef.current = null;
			setAttributes({ filterByCustomFields: pendingRowsRef.current });
			return pendingRowsRef.current;
		}
		return filterByCustomFields;
	};

	const addNewCustomFieldsFn = () => {
		const currentRows = flushPendingEdit();
		// Max existing id + 1 so removing a row never produces a duplicate id.
		const nextId = Math.max(0, ...(currentRows || []).map((filterRow) => filterRow.id || 0)) + 1;
		const newFilter = {
			id: nextId,
			type: 'CHAR',
			key: '',
			value: '',
			operator: '=',
			ajaxLiveFilter: '',
		};
		setAttributes({
			filterByCustomFields: [...(currentRows || []), newFilter],
		});
	};
	const resetButton = (id) => {
		const currentRows = flushPendingEdit();
		if (currentRows?.length >= 2) {
			const updatedArray = currentRows?.filter((f) => f.id !== id);
			setAttributes({ filterByCustomFields: updatedArray });
		} else {
			setAttributes({
				filterByCustomFields: [],
			});
		}
	};
	const updateCustomFieldsData = (id, selector, newData) => {
		pendingRowsRef.current = (pendingRowsRef.current || []).map((t) => {
			if (t.id === id) {
				return { ...t, [selector]: newData };
			}
			return t;
		});

		clearTimeout(commitTimerRef.current);

		const timerId = setTimeout(() => {
			commitTimerRef.current = null;
			setAttributes({ filterByCustomFields: pendingRowsRef.current });
		}, 1000);
		commitTimerRef.current = timerId;
	};

	return (
		<div className="wpcp-taxonomy-panel-container">
			<h4 className="wpcp-sub-panel-title">{__('Filter By Custom Fields', 'wp-carousel-free')}</h4>
			{filterByCustomFields.length > 0 &&
				filterByCustomFields?.map((data) => (
					<CustomFields
						key={data.id}
						props={{
							data,
							resetButton,
							updateCustomFieldsData,
							metaKeysSelectOptions,
						}}
					/>
				))}
			<button className="wpcp-taxonomy-add-button wpcp-component-mb" onClick={addNewCustomFieldsFn}>
				{__('Add New', 'wp-carousel-free')}
			</button>
			{filterByCustomFields.length > 1 && (
				<SelectField
					label={__('Relation', 'wp-carousel-free')}
					items={[
						{ label: 'AND', value: 'AND' },
						{ label: 'OR', value: 'OR' },
					]}
					flexStyle={true}
					attributes={customFieldRelation}
					attributesKey={'customFieldRelation'}
					setAttributes={setAttributes}
				/>
			)}
		</div>
	);
};

export default FilterByCustomFields;
