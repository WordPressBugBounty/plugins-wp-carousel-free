import { __ } from '@wordpress/i18n';
import './template.scss';
import ChildPanelBody from '../childPanelBody/childPanelBody';
import { filterSelectOptions, findDataFromArray } from '../../controls/controls';
import SelectField from '../selectField/selectField';
import DndKit from '../dndKit/dndkit';
import MultiSelectDndKit from '../multipleSelect/multiSelectDndKit';

const RenderTaxonomy = ({ props }) => {
	const {
		uniqueId,
		taxonomy,
		resetTaxonomyType,
		updateTaxonomyData,
		allTaxonomies,
		setAttributes,
		attributes,
	} = props;

	const { taxonomies } = attributes;

	const { type, id, value, operator } = taxonomy;
	const taxonomiesSelectOptions = filterSelectOptions(allTaxonomies, 'label', 'name');
	const selectedTaxonomy = findDataFromArray(allTaxonomies, 'name', type);
	const taxonomyTypeTitle = type ? selectedTaxonomy?.label : __('Taxonomy', 'wp-carousel-free');
	const terms = selectedTaxonomy?.terms_items.map((item) => ({
		...item,
		id: item.value,
	}));

	const onToggle = (e, _id) => {
		const newData = taxonomies.map((item) => {
			return {
				...item,
				initialOpen: item.id === _id && e ? true : false,
			};
		});
		setAttributes({ taxonomies: newData });
	};

	return (
		<div className="wpcp-taxonomies">
			<ChildPanelBody
				title={taxonomyTypeTitle}
				opened={taxonomy.initialOpen}
				onToggle={(e) => onToggle(e, id)}
				resetIcon={true}
				resetButtonAction={() => resetTaxonomyType(id)}
			>
				<SelectField
					label={__('Taxonomy Type', 'wp-carousel-free')}
					attributes={type}
					onChange={(e) => {
						updateTaxonomyData(id, 'type', e);
					}}
					items={taxonomiesSelectOptions}
					defaultOption={true}
				/>
				{type !== '' && (
					<MultiSelectDndKit
						label={`${taxonomyTypeTitle} (s)`}
						uniqueId={uniqueId}
						items={terms}
						values={value}
						searchable={true}
						onChange={(e) => updateTaxonomyData(id, 'value', e)}
					/>
				)}
				{type !== '' && (
					<SelectField
						label={__('Operator', 'wp-carousel-free')}
						attributes={operator}
						onChange={(e) => updateTaxonomyData(id, 'operator', e)}
						flexStyle={true}
						items={[
							{ label: 'IN', value: 'IN' },
							{ label: 'AND', value: 'AND' },
							{ label: 'NOT IN', value: 'NOT IN' },
						]}
					/>
				)}
			</ChildPanelBody>
		</div>
	);
};

// Next available row id: max of existing ids (guarded against an empty list,
// where a bare Math.max() would yield -Infinity) plus one.
const nextRowId = (rows) => Math.max(0, ...(rows || []).map((row) => row?.id || 0)) + 1;

const Taxonomies = ({ attributes, setAttributes, allTaxonomies }) => {
	const { taxonomies, relation } = attributes;

	const addNewTaxonomy = () => {
		const newTaxonomy = {
			id: nextRowId(taxonomies),
			type: '',
			value: [],
			operator: 'IN',
		};

		setAttributes({
			taxonomies: [...taxonomies, newTaxonomy],
		});
	};
	const resetTaxonomyType = (_id) => {
		let updatedTaxonomy = [];
		if (taxonomies?.length <= 1) {
			updatedTaxonomy = [
				{
					id: nextRowId(taxonomies),
					type: '',
					value: [],
					operator: 'IN',
				},
			];
		} else {
			updatedTaxonomy = taxonomies?.filter((tax) => tax.id !== _id);
		}
		setAttributes({
			taxonomies: updatedTaxonomy,
		});
	};
	const updateTaxonomyData = (id, selector, newData) => {
		const updatedTaxonomy = taxonomies?.map((taxonomy) => {
			if (taxonomy.id === id && selector !== 'value') {
				// return { ...taxonomy, [ selector ]: newData, value: [] };
				return { ...taxonomy, [selector]: newData };
			} else if (taxonomy.id === id && selector === 'value') {
				return { ...taxonomy, value: newData };
			}
			return taxonomy;
		});
		setAttributes({ taxonomies: updatedTaxonomy });
	};

	return (
		<div className="wpcp-taxonomy-panel-container">
			<h4 className="wpcp-sub-panel-title">
				{__('Taxonomy (Categories, Tags…)', 'wp-carousel-free')}
			</h4>
			<DndKit
				items={taxonomies}
				attributesKey="taxonomies"
				setAttributes={setAttributes}
				attributes={attributes}
				RenderTaxonomy={RenderTaxonomy}
				allTaxonomies={allTaxonomies}
				resetTaxonomyType={resetTaxonomyType}
				updateTaxonomyData={updateTaxonomyData}
			/>

			{taxonomies?.filter((item) => item.type !== '').length > 0 && (
				<button className="wpcp-taxonomy-add-button wpcp-component-mb" onClick={addNewTaxonomy}>
					{__('Add New', 'wp-carousel-free')}
				</button>
			)}
			{taxonomies?.filter((item) => item.type !== '').length > 1 && (
				<SelectField
					label={__('Relation', 'wp-carousel-free')}
					items={[
						{ label: 'AND', value: 'AND' },
						{ label: 'OR', value: 'OR' },
					]}
					flexStyle={true}
					attributes={relation}
					attributesKey={'relation'}
					setAttributes={setAttributes}
				/>
			)}
		</div>
	);
};

export default Taxonomies;
