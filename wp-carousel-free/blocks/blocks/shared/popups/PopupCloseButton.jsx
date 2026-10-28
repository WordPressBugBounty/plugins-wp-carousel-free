import { __ } from '@wordpress/i18n';
import './PopupCloseButton.scss';

/**
 * Top-right close button for the item edit popups, styled like the Pro upgrade dialog's.
 *
 * @param {Object}   props
 * @param {Function} props.onClose Close handler.
 * @return {JSX.Element} Close button.
 */
export default function PopupCloseButton({ onClose }) {
	return (
		<button
			type="button"
			className="wpcp-item-popup-close"
			onClick={onClose}
			aria-label={__('Close', 'wp-carousel-free')}
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				aria-hidden="true"
			>
				<path d="M6 6l12 12M18 6L6 18" />
			</svg>
		</button>
	);
}
