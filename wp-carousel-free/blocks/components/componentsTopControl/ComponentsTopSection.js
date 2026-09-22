import { memo } from '@wordpress/element';
import Responsive from '../responsive/responsive';
import { ResetButton, Units } from '../utility';

const ComponentsTopSection = ({
	label,
	units = false,
	attributes,
	setAttributes,
	attributesKey = '',
	onReset = false,
	onUnitChange,
	defaultUnit = false,
}) => {
	return (
		<div className="wpcp-header-control sp-mb-8px">
			<div className="wpcp-header-control-left">
				<span className="wpcp-component-title">{label}</span>
				{attributes?.device && <Responsive />}
			</div>
			{units && (
				<div className="wpcp-header-control-right">
					{onReset && <ResetButton onClick={() => onReset()} />}
					<Units
						attributes={attributes}
						setAttributes={setAttributes}
						attributesKey={attributesKey}
						units={units}
						onUnitChange={onUnitChange}
						defaultUnit={defaultUnit}
					/>
				</div>
			)}
		</div>
	);
};

export default memo(ComponentsTopSection);
