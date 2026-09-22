/**
 * Inline icon-grid picker for a fixed set of preset options. Each option carries
 * its own React icon element, so the caller owns the icon set (unlike the
 * REST-backed LightboxIconGrid). Selection is a single string value.
 *
 * Used by the Navigation Arrow "Arrow Style" control; reusable anywhere a small
 * set of visual presets reads better as a grid than a dropdown.
 *
 * An option flagged `pro` renders dimmed with a crown badge and opens the
 * pricing page instead of selecting — the handler is never called for it.
 */

import { BaseControl } from '@wordpress/components';
import ProBadge from '../pro/proBadge';
import { openPricingPage } from '../pro/proLinks';
import './editor.scss';
import '../pro/editor.scss';

/**
 * @param {Object}   props
 * @param {Array}    props.options    Ordered list of { value, label, icon, pro }.
 * @param {string}   props.value      Currently selected option value.
 * @param {Function} props.onChange   (value) => void
 * @param {string}   [props.label]    Control label rendered above the grid.
 * @param {number}   [props.col]      Optional number of columns for grid layout.
 * @param {string}   [props.extClass] Optional number of columns for grid layout.
 * @return {JSX.Element} Rendered icon grid.
 */
export default function IconGrid({
	options = [],
	value,
	onChange,
	label,
	col = false,
	extClass = '',
}) {
	const grid = (
		<div
			className={`wpcp-icon-grid ${col ? 'wpcp-d-grid' : 'wpcp-d-flex'} ${extClass}`}
			style={col ? { gridTemplateColumns: `repeat(${col}, 1fr)` } : {}}
		>
			{options.map((option) => {
				const isActive = !option.pro && value === option.value;
				return (
					<button
						key={option.value}
						type="button"
						className={`wpcp-icon-grid__item${isActive ? ' is-active' : ''}${
							option.pro ? ' wpcp-pro-locked' : ''
						}`}
						data-value={option.value}
						aria-label={option.label}
						aria-pressed={option.pro ? undefined : isActive}
						title={option.label}
						onClick={() => (option.pro ? openPricingPage() : onChange(option.value))}
					>
						{option.icon}
						{option.pro && <ProBadge iconOnly isStatic />}
					</button>
				);
			})}
		</div>
	);

	if (!label) {
		return grid;
	}

	return (
		<BaseControl className="wpcp-icon-grid-control" __nextHasNoMarginBottom>
			<BaseControl.VisualLabel>{label}</BaseControl.VisualLabel>
			{grid}
		</BaseControl>
	);
}
