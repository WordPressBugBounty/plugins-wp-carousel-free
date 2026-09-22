/**
 * Inspector label info icon — circular “i” with tooltip on hover/focus.
 * Used beside control labels (e.g. Items per page, Layouts toggles).
 */

import { __ } from '@wordpress/i18n';
import { useState, useCallback, useRef } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import './editor.scss';

export default function InfoIcon({ tooltip, label, disablePopup = false }) {
	const [isVisible, setIsVisible] = useState(false);
	const hideDelayRef = useRef(null);
	const helpLabel = label || __('More info', 'wp-carousel-free');
	const showPopup = !disablePopup && Boolean(tooltip) && isVisible;

	const show = useCallback(() => {
		if (hideDelayRef.current) {
			clearTimeout(hideDelayRef.current);
			hideDelayRef.current = null;
		}
		setIsVisible(true);
	}, []);

	const hide = useCallback(() => {
		hideDelayRef.current = setTimeout(() => {
			setIsVisible(false);
			hideDelayRef.current = null;
		}, 100);
	}, []);

	return (
		<span className="wpcp-info-icon">
			<button
				type="button"
				className="wpcp-info-icon__trigger"
				aria-label={helpLabel}
				onMouseEnter={show}
				onMouseLeave={hide}
				onFocus={show}
				onBlur={hide}
			>
				<span className="dashicons dashicons-info-outline"></span>
			</button>
			{/* {showPopup && (
				<span
					className="wpcp-info-icon__popup"
					role="tooltip"
					onMouseEnter={show}
					onMouseLeave={hide}
				>
					<span className="wpcp-info-icon__text">{tooltip}</span>
				</span>
			)} */}
			{showPopup && (
				<Popover onFocusOutside={hide} className={'wpcp-info-icon__popup'}>
					<span className="wpcp-info-icon__text">{tooltip}</span>
				</Popover>
			)}
		</span>
	);
}
