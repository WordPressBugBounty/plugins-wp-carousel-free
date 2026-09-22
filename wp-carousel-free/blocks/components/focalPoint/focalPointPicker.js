import { memo } from '@wordpress/element';
import { FocalPointPicker } from '@wordpress/components';
import './editor.scss';

const SPFocalPointPicker = ({
	label = 'Focal Point',
	url = '',
	attributes,
	attributesKey,
	setAttributes,
	showLabel = true,
}) => {
	const focalPointHandler = (newValue) => {
		setAttributes({ [attributesKey]: newValue });
	};
	return (
		<>
			<div className={`wpcp-focal-point wpcp-component-mb`}>
				{showLabel && (
					<div className="wpcp-header-control">
						<div className="wpcp-header-control-left">
							<span className="wpcp-component-title">{label}</span>
						</div>
					</div>
				)}
				<div className="wpcp-focal-point-control">
					<FocalPointPicker
						__nextHasNoMarginBottom
						url={url}
						value={attributes}
						onChange={focalPointHandler}
					/>
				</div>
			</div>
		</>
	);
};

export default memo(SPFocalPointPicker);
