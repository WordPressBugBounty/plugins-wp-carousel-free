import { __ } from '@wordpress/i18n';
import './editor.scss';
import '../pro/editor.scss';
import Popup from '../popup/popup';

const SelectDropdown = ({
	label,
	options,
	attributes,
	setAttributes,
	attributesKey,
	onClick = null,
	className = '',
	onClose,
}) => {
	return (
		<>
			<Popup label={label}>
				{/* <ul className={ `wpcp-select-dropdown ${ className }` } >
					{ options?.map( ( option, index ) => (
						<li
							key={ index }
							className={ `wpcp-select-dropdown-option ${
								attributes === option.value ? 'active' : ''
							}  ` }
							onClick={ () => {
								selectHandler( option.value );
								if ( typeof onClose === 'function' ) {
									onClose();
								}
							} }
						>
							{ option.label && <span>{ option.label }</span> }
							{ option.icon && <span>{ option.icon }</span> }
						</li>
					) ) }
				</ul> */}
				<SelectDropField
					options={options}
					attributes={attributes}
					setAttributes={setAttributes}
					attributesKey={attributesKey}
					className={className}
					onClick={onClick}
					onClose={onClose}
				/>
			</Popup>
		</>
	);
};

export default SelectDropdown;

const SelectDropField = ({
	options,
	attributes,
	setAttributes,
	attributesKey,
	onClick = null,
	className = '',
	onClose,
}) => {
	// A `pro` option renders as a real `disabled` row, so the click never fires
	// and the attribute stays untouched.
	const selectHandler = (value) => {
		if (onClick) {
			onClick(value);
		} else {
			setAttributes({ [attributesKey]: value });
		}
	};

	return (
		<ul className={`wpcp-select-dropdown ${className}`}>
			{options?.map((option, index) => (
				<li
					key={index}
					className={`wpcp-select-dropdown-option ${
						!option.pro && attributes === option.value ? 'active' : ''
					}${option.pro ? ' is-pro' : ''}`}
				>
					<button
						type="button"
						className={`wpcp-select-dropdown-option-button ${option.icon ? 'has-icon' : ''}`}
						disabled={!!option.pro}
						onClick={() => {
							selectHandler(option.value);
							if (typeof onClose === 'function') {
								onClose();
							}
						}}
					>
						{option.label && (
							<span>
								<span className="wpcp-select-dropdown-option-label">{option.label}</span>
								{option.pro && (
									<span className="wpcp-select-dropdown-option-pro">{__('(Pro)', 'wp-carousel-free')}</span>
								)}
							</span>
						)}
						{option.icon && <span>{option.icon}</span>}
					</button>
				</li>
			))}
		</ul>
	);
};
