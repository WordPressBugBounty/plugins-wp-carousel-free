import { ButtonGroup, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import '../pro/editor.scss';
import { useDeviceType } from '../../controls/controls';
import Responsive from '../responsive/responsive';

const SpButtonGroup = ({
	attributes,
	attributesKey,
	setAttributes,
	label,
	items,
	border = false,
	flexStyle = false,
	onClick = false,
}) => {
	// Device type
	const deviceType = useDeviceType();

	// Update button group value
	const setButtonGroup = (newValue) => {
		if (attributes?.device) {
			setAttributes({
				[attributesKey]: {
					...attributes.device,
					[deviceType]: newValue,
				},
			});
		} else {
			setAttributes({ [attributesKey]: newValue });
		}
	};

	// Get the active value
	const activeValue = attributes?.device ? attributes.device?.[deviceType] : attributes;

	// Handle button click. A `pro` item never reaches the setter — the disabled
	// attribute below is presentation, this early return is the lock.
	const handleClick = (value, isPro) => {
		if (isPro) {
			return;
		}
		if (onClick) {
			onClick(value);
		} else {
			setButtonGroup(value);
		}
	};

	return (
		<ButtonGroup
			className={`wpcp-button-group wpcp-component-mb ${
				flexStyle ? 'wpcp-d-flex button-style-2' : ''
			}`}
		>
			{label && (
				<div className="wpcp-component-top wpcp-component-title">
					<span>{label}</span>
					{attributes?.device && <Responsive />}
				</div>
			)}
			<div className={`wpcp-button-group-list ${border ? 'has-border' : ''}`}>
				{items?.map((item, i) => (
					<Button
						className={`${activeValue === item.value ? 'active' : ''}${item.pro ? ' is-pro' : ''}`}
						key={i}
						value={item.value}
						disabled={!!item.pro}
						aria-pressed={item.pro ? undefined : activeValue === item.value}
						aria-label={item.pro || typeof item.label === 'string' ? undefined : item.tooltip}
						onClick={() => handleClick(item.value, item.pro)}
					>
						<span>
							{item.label}
							{item.pro && ` ${__('(Pro)', 'wp-carousel-free')}`}
						</span>
						{!item.pro && item.tooltip && <p>{item.tooltip}</p>}
					</Button>
				))}
			</div>
		</ButtonGroup>
	);
};

export default SpButtonGroup;
