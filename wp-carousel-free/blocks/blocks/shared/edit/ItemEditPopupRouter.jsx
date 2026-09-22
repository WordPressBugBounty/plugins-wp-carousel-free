/**
 * Per-source single-item edit popup. Both popups share the same save /
 * navigate / remove wiring; only the popup component differs by source
 * (video, default media/image).
 */

import { ItemEditPopup, VideoItemEditPopup } from '../popups';

/**
 * @param {Object}           props
 * @param {object[]}         props.items
 * @param {string}           props.sourceType
 * @param {string}           props.blockName        `attributes.blockName` (gates ItemEditPopup features).
 * @param {?(number|string)} props.editingItemId    Id of the item being edited (null = closed).
 * @param {Function}         props.setEditingItemId
 * @param {Function}         props.setAttributes
 * @return {?JSX.Element} The active popup, or null when closed / item missing.
 */
export default function ItemEditPopupRouter({
	items,
	sourceType,
	blockName,
	editingItemId,
	setEditingItemId,
	setAttributes,
}) {
	if (editingItemId === null) {
		return null;
	}

	const currentIndex = items.findIndex((i) => i.id === editingItemId);
	const item = currentIndex >= 0 ? items[currentIndex] : null;
	if (!item) {
		return null;
	}

	const sharedHandlers = {
		onSave: (updated) => {
			setAttributes({
				items: items.map((i) => (i.id === updated.id ? updated : i)),
			});
		},
		onBack: () => setEditingItemId(null),
		onNavigate: (newIndex) => {
			const target = items[newIndex];
			if (target) {
				setEditingItemId(target.id);
			}
		},
		onRemoveItem: (id) => {
			setAttributes({ items: items.filter((i) => i.id !== id) });
			setEditingItemId(null);
		},
	};

	if (sourceType === 'video') {
		return (
			<VideoItemEditPopup item={item} items={items} currentIndex={currentIndex} {...sharedHandlers} />
		);
	}

	return (
		<ItemEditPopup
			item={item}
			items={items}
			currentIndex={currentIndex}
			blockName={blockName}
			{...sharedHandlers}
			onReplaceItem={(oldId, newData) => {
				setAttributes({
					items: items.map((i) => (i.id === oldId ? { ...i, ...newData } : i)),
				});
				setEditingItemId(newData.id);
			}}
		/>
	);
}
