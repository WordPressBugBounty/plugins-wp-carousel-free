import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ sortId, children, initialOpen }) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: sortId,
		disabled: initialOpen,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		marginTop: '10px',
	};

	return (
		<div ref={setNodeRef} style={style} {...listeners} {...attributes}>
			{children}
		</div>
	);
}
