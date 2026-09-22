import './editor.scss';

const ButtonSet = ({
	label = '',
	attributes,
	attributesKey,
	setAttributes,
	columns = 4,
	items,
	onChange = false,
}) => {
	const handleClick = (value) => {
		if (value === attributes) {
			return;
		}
		if (onChange) {
			onChange(value);
		} else {
			setAttributes({ [attributesKey]: value });
		}
	};
	return (
		<div className="wpcp-button-set wpcp-component-mb">
			{label && (
				<div className="wpcp-component-top wpcp-component-title">
					<span>{label}</span>
				</div>
			)}
			<div className={`wpcp-button-set-list sp-col-${columns}`}>
				{items?.map((item, index) => (
					<span
						key={index}
						className={`wpcp-button-set-item${attributes === item.value ? ' active' : ''}`}
						value={item.value}
						onClick={() => handleClick(item.value)}
					>
						<span className="sp-item-set-btn">{item.label}</span>
						{item.tooltip && <p>{item.tooltip}</p>}
					</span>
				))}
			</div>
		</div>
	);
};
export default ButtonSet;
