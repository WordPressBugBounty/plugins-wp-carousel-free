import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { getReadyPatternsModulesUrl } from './constants';

/**
 * Blocking dialog listing a pattern's unmet requirements before insertion.
 *
 * Advisory rather than hard-blocking: plugin detection is heuristic (forks,
 * mu-plugin loaders, white-labelled builds), so the failure mode being fixed is
 * silence, not user choice.
 *
 * @param {Object}   props
 * @param {string}   props.patternName Pattern display name.
 * @param {Array}    props.unmet       Unmet requirement entries.
 * @param {Function} props.onCancel    Cancel handler.
 * @param {Function} props.onProceed   "Insert anyway" handler.
 * @return {JSX.Element} Dialog markup.
 */
export default function PreflightDialog({ patternName, unmet, onCancel, onProceed }) {
	const cancelRef = useRef(null);

	useEffect(() => {
		cancelRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if ('Escape' === event.key) {
				event.preventDefault();
				event.stopPropagation();
				onCancel();
			}
		};

		document.addEventListener('keydown', handleKeyDown, true);
		return () => document.removeEventListener('keydown', handleKeyDown, true);
	}, [onCancel]);

	return (
		<div className="wpcp-ready-patterns-preflight-backdrop">
			<div
				className="wpcp-ready-patterns-preflight"
				role="dialog"
				aria-modal="true"
				aria-labelledby="wpcp-ready-patterns-preflight-title"
			>
				<h2 className="wpcp-ready-patterns-preflight-title" id="wpcp-ready-patterns-preflight-title">
					{__('This pattern needs a little more', 'wp-carousel-free')}
				</h2>
				<p className="wpcp-ready-patterns-preflight-intro">
					{sprintf(
						/* translators: %s: pattern name */
						__('"%s" will insert, but these are not available on this site:', 'wp-carousel-free'),
						patternName
					)}
				</p>
				<ul className="wpcp-ready-patterns-preflight-list">
					{unmet.map((entry) => (
						<li key={`${entry.category}-${entry.label}`}>
							<span className="wpcp-ready-patterns-preflight-category">
								{requirementCategoryLabel(entry.category)}
							</span>
							{entry.label}
						</li>
					))}
				</ul>
				<div className="wpcp-ready-patterns-preflight-actions">
					<a
						className="wpcp-ready-patterns-preflight-link"
						href={getReadyPatternsModulesUrl()}
						target="_blank"
						rel="noopener noreferrer"
					>
						{__('Open module settings', 'wp-carousel-free')}
					</a>
					<button
						type="button"
						className="wpcp-ready-patterns-preflight-cancel"
						onClick={onCancel}
						ref={cancelRef}
					>
						{__('Cancel', 'wp-carousel-free')}
					</button>
					<button type="button" className="wpcp-ready-patterns-preflight-proceed" onClick={onProceed}>
						{__('Insert anyway', 'wp-carousel-free')}
					</button>
				</div>
			</div>
		</div>
	);
}

/**
 * Short category label shown beside each unmet requirement.
 *
 * @param {string} category Requirement category.
 * @return {string} Translated label.
 */
function requirementCategoryLabel(category) {
	if ('plugin' === category) {
		return __('Plugin', 'wp-carousel-free');
	}
	if ('module' === category) {
		return __('Module', 'wp-carousel-free');
	}
	if ('version' === category) {
		return __('Version', 'wp-carousel-free');
	}

	return __('Source', 'wp-carousel-free');
}
