import { ToggleControl } from '@wordpress/components';
import './editor.scss';
import '../pro/editor.scss';
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DndTitleIcon } from '../../icons/icons';
import { getPricingUrl } from '../pro/proLinks';

const Toggle = ({
	label = '',
	attributes,
	setAttributes = () => {},
	attributesKey = '',
	onChange = false,
	updated = false,
	helpText = false,
	onlyPro = false,
}) => {
	// A Pro row shows the switch so the inspector matches Pro, but the handler
	// returns before any write — the dimming is presentation, this is the lock.
	const handleChange = (newField) => {
		if (onlyPro) {
			return;
		}
		if (onChange) {
			onChange(newField);
			return;
		}
		setAttributes({ [attributesKey]: !attributes });
	};

	return (
		<>
			<div
				className={`wpcp-toggle wpcp-component-mb ${updated ? 'updated-toggle' : ''}${
					onlyPro ? ' is-pro' : ''
				}`}
			>
				{updated && !onlyPro && (
					<div className="wpcp-toggle-left">
						<DndTitleIcon />
						<span className="wpcp-component-title">{label}</span>
					</div>
				)}
				{onlyPro && (
					<span className="wpcp-toggle-pro-label">
						<span className="wpcp-component-title">{label}</span>
						<a
							className="wpcp-toggle-pro-tag"
							href={getPricingUrl()}
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('(Pro)', 'wp-carousel-free')}
						</a>
					</span>
				)}
				<ToggleControl
					label={!updated && !onlyPro ? label : ''}
					checked={onlyPro ? false : attributes}
					disabled={onlyPro}
					onChange={handleChange}
					help={helpText}
					__nextHasNoMarginBottom={true}
				/>
			</div>
		</>
	);
};

export default memo(Toggle);
