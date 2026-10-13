import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useEffect, useId, useRef } from '@wordpress/element';
import './diagnostic-data-modal.scss';

const INFORMATION_WE_COLLECT_URL = 'https://shapedplugin.com/information-we-collect/';

/**
 * "What We Collect?" disclosure, shared by the setup wizard and Settings → Advanced Controls.
 *
 * @param {Object}   props         Component props.
 * @param {Function} props.onClose Called when the modal is dismissed.
 */
const DiagnosticDataModal = ({ onClose }) => {
	const titleId = useId();
	const dialogRef = useRef(null);
	// Latest onClose without re-running the effect, which would bounce focus on every parent render.
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		// Focus moves into the dialog, and back to its opener on close.
		const opener = dialogRef.current?.ownerDocument.activeElement;
		dialogRef.current?.focus();

		const handleKeyDown = (event) => {
			if ('Escape' === event.key) {
				onCloseRef.current();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			opener?.focus?.();
		};
	}, []);

	return (
		// Backdrop click is a mouse convenience; Escape and the close button cover the keyboard.
		<div className="wpcpf-collect-modal-overlay" onClick={onClose}>
			{/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- stops the backdrop handler only */}
			<div
				ref={dialogRef}
				tabIndex={-1}
				className="wpcpf-collect-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="wpcpf-collect-modal-header">
					<h1 id={titleId} className="wpcpf-collect-modal-title">
						{__('What We Collect?', 'wp-carousel-free')}
					</h1>
					<button
						type="button"
						className="wpcpf-collect-modal-close"
						onClick={onClose}
						aria-label={__('Close', 'wp-carousel-free')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
							<path d="m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06L13.06 12Z" />
						</svg>
					</button>
				</div>

				<hr />

				<p className="wpcpf-collect-modal-text">
					{__(
						'We collect only diagnostic data and basic plugin usage information. This may include:',
						'wp-carousel-free'
					)}
				</p>
				<ul>
					<li>{__('WordPress & PHP version', 'wp-carousel-free')}</li>
					<li>{__('Active theme and plugins', 'wp-carousel-free')}</li>
					<li>{__('General system details', 'wp-carousel-free')}</li>
					<li>{__('Email address only for sending helpful updates or optional offers.', 'wp-carousel-free')}</li>
				</ul>
				<p className="wpcpf-collect-modal-text">
					{__(
						'This information helps us improve performance, fix issues faster, and ensure WP Carousel stays compatible with the popular plugins and themes.',
						'wp-carousel-free'
					)}
				</p>
				<p className="wpcpf-collect-modal-text">
					{createInterpolateElement(
						__(
							'We <b>do not collect sensitive personal data,</b> and <b>never send spam</b> promise.',
							'wp-carousel-free'
						),
						{ b: <b /> }
					)}
				</p>
				<p className="wpcpf-collect-modal-text">
					<b>{__('Your privacy comes first.', 'wp-carousel-free')}</b>
				</p>
				<a
					href={INFORMATION_WE_COLLECT_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="wpcpf-collect-modal-link"
				>
					{__('Learn More', 'wp-carousel-free')}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" focusable="false">
						<path d="m5.39 5.382.057 1.6 6.708-.244-7.664 7.664 1.132 1.13 7.666-7.665-.246 6.712 1.6.056.35-9.601-9.603.348Z" />
					</svg>
				</a>
			</div>
		</div>
	);
};

export default DiagnosticDataModal;
