import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { SortableItem } from './sortableItem';

const DndKit = ({
	items,
	attributesKey,
	setAttributes,
	attributes,
	RenderTaxonomy,
	allTaxonomies,
	resetTaxonomyType,
	updateTaxonomyData,
}) => {
	// drag and drop functions.
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 2 },
		})
	);

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			const oldIndex = items.findIndex((i) => active.id === i.id);
			const newIndex = items.findIndex((i) => over.id === i.id);
			setAttributes({
				[attributesKey]: arrayMove(items, oldIndex, newIndex),
			});
		}
	};

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
			<SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
				{items?.map((item) => (
					<SortableItem key={item.id} sortId={item.id} initialOpen={item.initialOpen}>
						<RenderTaxonomy
							props={{
								attributes,
								taxonomy: item,
								allTaxonomies,
								setAttributes,
								resetTaxonomyType,
								updateTaxonomyData,
							}}
						/>
					</SortableItem>
				))}
			</SortableContext>
		</DndContext>
	);
};

export default DndKit;
