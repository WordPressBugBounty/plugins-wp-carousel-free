/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDeviceType } from '../../controls/controls';
// import Responsive from '../responsive/responsive';
import './editor.scss';
import '../pro/editor.scss';
import { memo } from '@wordpress/element';
import Responsive from '../responsive/responsive';

const SPToggleGroupControl = ({
	attributes,
	attributesKey,
	setAttributes,
	label = '',
	items,
	border = false,
	flexStyle = false,
	onClick = false,
	hasDivider = true,
	extraClass = '',
}) => {
	// Device type
	const deviceType = useDeviceType();

	// Update button group value
	const setButtonGroup = (newValue) => {
		if (attributes?.device) {
			setAttributes({
				[attributesKey]: {
					...attributes,
					device: {
						...attributes.device,
						[deviceType]: newValue,
					},
				},
			});
		} else {
			setAttributes({ [attributesKey]: newValue });
		}
	};

	// Get the active value
	const activeValue = attributes?.device ? attributes.device?.[deviceType] : attributes;

	// Handle option click. A `pro` item never reaches the setter — its
	// `is-pro` class below is presentation, this early return is the lock.
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
		<div className="wpcp-toggle-button-group-wrapper wpcp-component-mb">
			<div className="wpcp-header">
				<span
					// onClick={ ( e ) => activeLabel( e ) }
					className="wpcp-component-title"
				>
					{label}
				</span>
				{attributes?.device && <Responsive />}
			</div>
			<ToggleGroupControl
				className={`wpcp-toggle-button-group wpcp-component-mb${label ? '' : ' sp-negative-space'} ${
					flexStyle ? 'wpcp-d-flex button-style-2' : ''
				}`}
				// label={ hasDevice ? '' : label }
				// aria-label={
				// 	label
				// 		? label
				// 		: __(
				// 				'Normal and Hover Button Control',
				// 				'smart-post-show'
				// 		  )
				// }
				value={activeValue}
				isBlock
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				onChange={(value) => handleClick(value, items?.find((item) => item.value === value)?.pro)}
			>
				<div
					className={`wpcp-toggle-button-group-list ${border ? 'has-border' : ''}${
						hasDivider ? ' sp-has-divider' : ''
					} ${extraClass}`}
				>
					{items?.map((item, i) => (
						<ToggleGroupControlOption
							key={i}
							value={item.value}
							label={
								item.pro ? (
									<span className="wpcp-toggle-group-pro-option">
										<span className="wpcp-toggle-group-pro-label">{item.label}</span>
										<span className="wpcp-toggle-group-pro-tag">{__('(Pro)', 'wp-carousel-free')}</span>
									</span>
								) : (
									item.label
								)
							}
							showTooltip={!item.pro && !!item.tooltip}
							aria-label={item.pro ? undefined : item.tooltip}
							className={`${activeValue === item.value ? 'active' : ''}${item.pro ? ' is-pro' : ''}`}
						/>
					))}
				</div>
			</ToggleGroupControl>
		</div>
	);
};

export default memo(SPToggleGroupControl);
