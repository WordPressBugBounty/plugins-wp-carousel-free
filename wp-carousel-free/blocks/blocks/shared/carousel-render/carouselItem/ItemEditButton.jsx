/**
 * Pencil button overlaid on an item in the editor preview; opens the
 * per-item edit popup. Editor-only chrome — never rendered on the frontend.
 */

import { __ } from '@wordpress/i18n';

/**
 * @param {Object}   props
 * @param {Object}   props.item       Item being edited.
 * @param {Function} props.onItemEdit Callback receiving the item.
 */
export default function ItemEditButton({ item, onItemEdit }) {
	return (
		<button
			type="button"
			className="wpcp-item-edit-btn"
			onClick={(event) => {
				event.preventDefault();
				event.stopPropagation();
				onItemEdit(item);
			}}
			aria-label={__('Edit item', 'wp-carousel-free')}
		>
			<svg
				viewBox="0 0 24 24"
				width="14"
				height="14"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M12 20h9" />
				<path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
			</svg>
		</button>
	);
}
