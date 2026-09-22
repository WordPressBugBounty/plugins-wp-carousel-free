import { useEffect, useRef, useState } from '@wordpress/element';

const CLOSE_ANIMATION_MS = 300;

export default function Drawer({ open, onClose, children, className = '' }) {
	const [shouldRender, setShouldRender] = useState(open);
	const [isVisible, setIsVisible] = useState(false);
	const closeTimeoutRef = useRef(null);
	const showFrameRef = useRef(null);

	useEffect(() => {
		if (open) {
			clearTimeout(closeTimeoutRef.current);
			setShouldRender(true);
			return undefined;
		}

		setIsVisible(false);
		closeTimeoutRef.current = setTimeout(() => setShouldRender(false), CLOSE_ANIMATION_MS);

		return () => clearTimeout(closeTimeoutRef.current);
	}, [open]);

	useEffect(() => {
		if (!open || !shouldRender) {
			return undefined;
		}

		showFrameRef.current = requestAnimationFrame(() => {
			showFrameRef.current = requestAnimationFrame(() => setIsVisible(true));
		});

		return () => cancelAnimationFrame(showFrameRef.current);
	}, [open, shouldRender]);

	if (!shouldRender) {
		return null;
	}

	return (
		<div
			className={`wpcp-drawer-overlay ${isVisible ? 'is-open' : ''}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) {
					onClose();
				}
			}}
			role="presentation"
		>
			<div className={`wpcp-drawer wpcp-drawer-right ${className}`} role="dialog" aria-modal="true">
				{children}
			</div>
		</div>
	);
}
