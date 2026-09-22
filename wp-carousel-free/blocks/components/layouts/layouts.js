import { memo } from '@wordpress/element';
import { Tooltip } from '@wordpress/components';
import { RightSymbolIcon } from '../../icons/icons';
import ProBadge from '../pro/proBadge';
import { openPricingPage } from '../pro/proLinks';
import './editor.scss';

const Layout = ({ layout, handleActive, activeLayout, displayActive }) => {
	const { icon, value, label, tooltip, onlyPro, demoLink } = layout;
	const tooltipText = tooltip || label;
	const isActive = value === activeLayout;

	// Native <button> so each layout preset is keyboard-focusable and exposes a
	// role/pressed state to assistive tech. The accessible name comes from the
	// preset's label/tooltip; the visual tooltip is provided by the WP <Tooltip>
	// wrapper below, so no native title (which would double up).
	const layoutCard = (
		<button
			type="button"
			onClick={() => (onlyPro ? openPricingPage() : handleActive(value))}
			className={`wpcp-layout-card ${isActive ? 'active' : 'inactive'}${
				onlyPro ? ' wpcp-pro-locked' : ''
			}`}
			aria-label={tooltipText || undefined}
			aria-pressed={onlyPro ? undefined : isActive}
		>
			{isActive && displayActive && !onlyPro && (
				<span className="active-symbol">
					<RightSymbolIcon />
				</span>
			)}
			<div className="sp-smart-layout-img">{icon}</div>
			{onlyPro && <ProBadge demoLink={demoLink} />}
		</button>
	);

	if (tooltipText) {
		return (
			<Tooltip text={tooltipText} placement="top">
				{layoutCard}
			</Tooltip>
		);
	}

	return layoutCard;
};

const Layouts = ({
	attributes,
	setAttributes,
	attributesKey,
	displayActive = false,
	label = '',
	grid = 2,
	items,
	onChange = false,
	className = '',
}) => {
	const handleActive = (value) => {
		if (value === attributes) {
			return;
		}
		if (onChange) {
			onChange(value);
		}
		setAttributes({ [attributesKey]: value });
	};

	const activeItem = items?.find((item) => item.value === attributes);
	const activeTitle = activeItem?.label || activeItem?.tooltip || '';

	return (
		<div className={`wpcp-layout-picker wpcp-panel-pb ${className}`}>
			{(label || activeTitle) && (
				<div className="wpcp-layout-picker-head">
					{label && <p className="wpcp-component-title">{label}</p>}
					{activeTitle && <p className="wpcp-layout-active-title">{activeTitle}</p>}
				</div>
			)}
			<div className={`wpcp-layouts grid-${grid}`}>
				{items?.map((layout, index) => (
					<Layout
						key={index}
						layout={layout}
						displayActive={displayActive}
						handleActive={handleActive}
						activeLayout={attributes}
					/>
				))}
			</div>
		</div>
	);
};

export default memo(Layouts);
