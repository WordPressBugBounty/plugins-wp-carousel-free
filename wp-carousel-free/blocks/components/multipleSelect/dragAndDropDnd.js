import { memo, useRef, useState } from '@wordpress/element';
import Toggle from '../toggle/toggle';
import { DndTitleIcon } from '../../icons/icons';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './dnd-select.scss';

const SortableItem = memo((props) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: props.id,
	});

	const { item, toggleBtn, onChange, disabledItem } = props;
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<>
			<div
				ref={setNodeRef}
				style={style}
				{...attributes}
				{...listeners}
				className={`${isDragging ? 'sp-grabbing' : 'sp-grab'}${disabledItem ? ' sp-disabled' : ''}`}
			>
				<div className="sp-selected-option">
					{/* Display the label of the item */}
					<span className={`sp-select-label`}>
						<DndTitleIcon /> {item?.label}
					</span>

					{/* Delete button */}
					{toggleBtn && (
						<span className="sp-select-toggle-button">
							<Toggle attributes={item.show} onChange={() => onChange(item)} />
						</span>
					)}
				</div>
			</div>
		</>
	);
});

const DragAndDropDnd = ({
	label = '',
	items,
	toggleBtn = false,
	onChange,
	catTabCategoryPosition = '',
}) => {
	const [allOptions, setAllOptions] = useState(items);
	const dndRef = useRef(null);
	const containerRef = useRef(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		})
	);

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (active.id !== over.id) {
			const oldIndex = allOptions.findIndex((i) => `${i.id}` === `${active.id}`);
			const newIndex = allOptions.findIndex((i) => `${i.id}` === `${over.id}`);
			const updateValues = arrayMove(allOptions, oldIndex, newIndex);
			onChange(updateValues);
			setAllOptions(updateValues);

			// const taxonomyIndex = updateValues?.findIndex(
			// 	( item ) => item.value === 'taxonomy'
			// );
			// const titleIndex = updateValues.findIndex(
			// 	( item ) => item.value === 'title'
			// );
			// if (
			// 	taxonomyIndex !== -1 &&
			// 	titleIndex !== -1 &&
			// 	taxonomyIndex !== titleIndex - 1 &&
			// 	setAttributes
			// ) {
			// 	setAttributes( { catTabCategoryPosition: '' } );
			// }
		}
	};

	const onToggleControl = (item) => {
		const updatedValues = allOptions?.map((val) => {
			if (val.id === item.id) {
				return { ...val, show: !val.show };
			}
			return val;
		});
		setAllOptions(updatedValues);
		onChange(updatedValues);
	};

	return (
		<div className="shaped-plugin-multiple-select wpcp-component-mb" ref={dndRef}>
			{label && (
				<div className="sp-multiple-select-dnd-label">
					<p> {label}</p>
				</div>
			)}
			<div className="sp-drag-and-drop-dnd-container" ref={containerRef}>
				{!['', 'above-title'].includes(catTabCategoryPosition) && (
					<SortableItem
						key={'0'}
						id={`item-id-sp-0`}
						index={'0'}
						item={{ label: 'Taxonomy (Category)' }}
						disabledItem={true}
					/>
				)}
				<div className="sp-selected-options">
					<DndContext
						sensors={sensors}
						onDragEnd={handleDragEnd}
						modifiers={[restrictToVerticalAxis, restrictToParentElement]}
					>
						<SortableContext
							items={allOptions?.map((item) => `${item.id}`)}
							strategy={verticalListSortingStrategy}
						>
							{['', 'above-title'].includes(catTabCategoryPosition)
								? allOptions?.map((item, index) => (
										<SortableItem
											key={item.id}
											id={`${item.id}`}
											index={index}
											item={item}
											toggleBtn={toggleBtn}
											onChange={onToggleControl}
										/>
								  ))
								: allOptions
										?.filter((t) => t.value !== 'taxonomy')
										.map((item, index) => (
											<SortableItem
												key={item.id}
												id={`${item.id}`}
												index={index}
												item={item}
												toggleBtn={toggleBtn}
												onChange={onToggleControl}
											/>
										))}
						</SortableContext>
					</DndContext>
				</div>
			</div>
		</div>
	);
};

export default memo(DragAndDropDnd);
