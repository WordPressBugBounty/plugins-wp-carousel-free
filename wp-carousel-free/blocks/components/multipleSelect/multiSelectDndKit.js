import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { __ } from '@wordpress/i18n';
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { CSS } from '@dnd-kit/utilities';
import './dnd-select.scss';

// Delete Icon
const DeleteIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width={8} height={8} fill="none">
		<path
			fill="#2F2F2F"
			d="M4 4.778 6.722 7.5l.778-.778L4.778 4 7.5 1.278 6.722.5 4 3.222 1.278.5.5 1.278 3.222 4 .5 6.722l.778.778L4 4.778Z"
		/>
	</svg>
);

const SortableItem = memo((props) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};
	const { item, onChange } = props;

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<div className="sp-selected-option">
				{/* Display the label of the item */}
				<span className="sp-select-label">{item?.label}</span>

				{/* Delete button */}
				<button
					type="button"
					className="sp-select-remove-button"
					aria-label={`Remove ${item?.label}`}
					onClick={() => onChange(item.id)}
				>
					<DeleteIcon />
				</button>
			</div>
		</div>
	);
});

// Non-sortable row for callers that disable reordering (`sortable={false}`) —
// same two-level markup as SortableItem (the box styling in dnd-select.scss
// targets `.sp-selected-options div .sp-selected-option`), just no drag
// listeners and no DndContext ancestor required.
const StaticItem = memo(({ item, onChange }) => (
	<div>
		<div className="sp-selected-option sp-selected-option--static">
			<span className="sp-select-label">{item?.label}</span>
			<button
				type="button"
				className="sp-select-remove-button"
				aria-label={`Remove ${item?.label}`}
				onClick={() => onChange(item.id)}
			>
				<DeleteIcon />
			</button>
		</div>
	</div>
));

const MultiSelectDndKit = (props) => {
	// Supports two calling conventions:
	// 1) DnD mode: { items, values, onChange } (used in query builder taxonomies)
	// 2) Wrapper mode: { attributes, attributesKey, options, setAttributes } (used in panels)
	const {
		label = '',
		// DnD mode
		items: itemsProp,
		values: valuesProp,
		onChange: onChangeProp,
		// DnD options
		onInputChange = false,
		searchable = false,
		// Reordering is Pro for some callers (e.g. Meta Items) even though this
		// component itself is shared with Free features (Post Types, Social
		// Media, Taxonomy Terms) — pass sortable={false} to keep add/remove
		// without drag reordering.
		sortable = true,
		// Wrapper mode
		attributes,
		attributesKey,
		setAttributes,
		options,
	} = props;

	const isWrapperMode = useMemo(
		() => typeof setAttributes === 'function' && !!attributesKey,
		[setAttributes, attributesKey]
	);
	const dndItems = useMemo(() => {
		if (Array.isArray(itemsProp)) {
			return itemsProp;
		}
		if (Array.isArray(options)) {
			return options;
		}
		return [];
	}, [itemsProp, options]);

	const normalizedValues = useMemo(() => {
		if (!isWrapperMode) {
			return Array.isArray(valuesProp) ? valuesProp : [];
		}

		const selectedSlugs = Array.isArray(attributes) ? attributes : [];
		const optionsArray = Array.isArray(options) ? options : [];

		return selectedSlugs
			.map((slug) => {
				const opt = optionsArray.find((o) => o?.value === slug);
				const value = opt?.value ?? slug;
				return {
					id: opt?.id ?? value,
					value,
					label: opt?.label ?? String(slug),
				};
			})
			.filter(Boolean);
	}, [isWrapperMode, valuesProp, attributes, options]);

	const dndOnChange = isWrapperMode
		? (nextDndValues) => {
				if (!Array.isArray(nextDndValues)) {
					setAttributes({ [attributesKey]: [] });
					return;
				}
				const nextSlugs = nextDndValues.map((v) => v?.value ?? v?.id);
				setAttributes({ [attributesKey]: nextSlugs });
		  }
		: onChangeProp;
	const [allOptions, setAllOptions] = useState([]);
	const [toggleSelectField, setToggleSelectField] = useState(false);
	const [optionOpen, setOptionOpen] = useState(true);
	const [searchFieldData, setSearchFieldData] = useState('');
	const dndRef = useRef(null);
	const containerRef = useRef(null);
	const allValues = useMemo(() => {
		if (!Array.isArray(normalizedValues) || normalizedValues.some((item) => !item?.value)) {
			return [];
		} // prevents the crash
		return normalizedValues.map((item) => item.value);
	}, [normalizedValues]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		})
	);

	// icons
	const ArrowIconOne = () => (
		<svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} aria-hidden="true" className="">
			<path d="M17.5 11.6 12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z" />
		</svg>
	);
	const ArrowIconTwo = () => (
		<svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} aria-hidden="true">
			<path d="M6.5 12.4 12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z" />
		</svg>
	);

	const containerHeight = normalizedValues?.length * 34 + 2 + 'px';

	const handleDragEnd = (event) => {
		setToggleSelectField(false);
		const { active, over } = event;
		if (!active || !over) {
			return;
		}
		if (active.id !== over.id) {
			const oldIndex = normalizedValues.findIndex((i) => `${i?.id}` === `${active.id}`);
			const newIndex = normalizedValues.findIndex((i) => `${i?.id}` === `${over.id}`);
			const updateValues = arrayMove(normalizedValues, oldIndex, newIndex);
			dndOnChange(updateValues);
			setOptionOpen(true);
		}
	};

	const onDragStart = () => {
		setOptionOpen(false);
		setToggleSelectField(false);
	};

	const handleRemoveItems = (id) => {
		const updatedValues = normalizedValues?.filter((val) => val?.id !== id);
		dndOnChange(updatedValues);
	};

	const toggleSelectFieldVal = () => {
		if (optionOpen) {
			setToggleSelectField((prev) => !prev);
		}
	};

	const filterNotSelectedItems = useCallback(
		(selectFieldItems) => selectFieldItems?.filter((item) => !allValues.includes(item.value)),
		[allValues]
	);

	const handleSelectField = (data) => {
		// const { id, value, label, slug, order } = data;
		// const newValue = [ ...values, { id, value, label, slug, order } ];
		const nextValue = {
			...data,
			id: data?.id ?? data?.value,
			value: data?.value,
			label: data?.label ?? String(data?.value),
		};
		const newValue = [...normalizedValues, nextValue];
		setSearchFieldData('');
		dndOnChange(newValue);
	};

	const handleSearchField = (event) => {
		const value = event.target.value.toLowerCase();
		setSearchFieldData(value);
		const searchableArray = filterNotSelectedItems(dndItems);
		const matchedOption = searchableArray?.filter((i) => i.label.toLowerCase().includes(value));
		if (onInputChange) {
			onInputChange(value);
		} else {
			setAllOptions(matchedOption);
		}
	};

	useEffect(() => {
		let optionList = [];
		if (toggleSelectField) {
			optionList = filterNotSelectedItems(dndItems);
		} else {
			optionList = dndItems;
		}
		setAllOptions(optionList);
	}, [dndItems, toggleSelectField, filterNotSelectedItems]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (containerRef.current && !containerRef.current.contains(event.target)) {
				setToggleSelectField(false);
			}
		};

		if (toggleSelectField) {
			document.addEventListener('click', handleClickOutside);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	}, [toggleSelectField]);

	return (
		<div className="shaped-plugin-multiple-select wpcp-component-mb" ref={dndRef}>
			<div className="sp-multiple-select-dnd-label">
				<p> {label}</p>
			</div>
			<div className="sp-multiple-select-dnd-container" ref={containerRef}>
				<div onClick={toggleSelectFieldVal} className="sp-select-header">
					<div className="sp-selected-options" style={{ height: containerHeight }}>
						{sortable ? (
							<DndContext
								sensors={sensors}
								onDragEnd={handleDragEnd}
								onDragStart={onDragStart}
								modifiers={[restrictToVerticalAxis]}
							>
								<SortableContext
									items={normalizedValues?.map((item) => `${item?.id}`)}
									strategy={verticalListSortingStrategy}
								>
									{normalizedValues?.map((item, index) => (
										<SortableItem
											key={item.id}
											id={`${item.id}`}
											index={index}
											item={item}
											onChange={handleRemoveItems}
										/>
									))}
								</SortableContext>
							</DndContext>
						) : (
							normalizedValues?.map((item) => (
								<StaticItem key={item.id} item={item} onChange={handleRemoveItems} />
							))
						)}
					</div>
					<span className="custom-select-arrow">
						{toggleSelectField ? <ArrowIconTwo /> : <ArrowIconOne />}
					</span>
				</div>
				{allOptions?.length > 0 && toggleSelectField && (
					<div className="sp-select-options">
						{searchable && (
							<input
								placeholder={__('Search here for more…', 'wp-carousel-free')}
								value={searchFieldData}
								onChange={(e) => handleSearchField(e)}
								className="sp-select-search-field"
							/>
						)}
						{allOptions?.map((option) => {
							return (
								<div key={option?.value ?? option?.label}>
									{option?.label && option?.value && (
										<div
											type="button"
											onClick={() => handleSelectField(option)}
											className={`sp-select-option ${
												normalizedValues?.some((v) => v?.value === option.value) ? 'selected' : ''
											}`}
										>
											{option.label}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default memo(MultiSelectDndKit);
