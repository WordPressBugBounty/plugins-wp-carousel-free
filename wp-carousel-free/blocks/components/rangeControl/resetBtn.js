import { memo } from '@wordpress/element';
import { useDeviceType } from '../../controls/controls';
import { Button } from '@wordpress/components';
import { ResetIcon } from '../../icons/icons';
import { getResolvedDefault, isRangeValueChanged } from './rangeValueUtils';

const ResetButton = ({
	attributes,
	setAttributes,
	attributesKey,
	defaultValue,
	value,
	setCurrentValue = () => {},
	setCustomReset = false,
	onValueChange = false,
	onUnitChange = false,
	onReset = false,
}) => {
	const deviceType = useDeviceType();
	const { value: defaultValueOrDevice, unit: defaultUnitOrDevice } = getResolvedDefault(
		defaultValue,
		deviceType
	);

	const activeResetButton = () =>
		isRangeValueChanged(attributes, defaultValue, deviceType, value) ? 'active' : '';

	const setDefault = () => {
		if (typeof setCustomReset === 'function') {
			setCustomReset();
			return;
		}
		if (setCustomReset) {
			return setCurrentValue(defaultValueOrDevice);
		}

		// Controls whose value and unit live in one attribute object behind a shallow-merge
		// setter must reset both in a single write. Firing onValueChange + onUnitChange
		// separately would rebuild the object twice from a stale closure, so the second call
		// clobbers the first (e.g. the value reset gets reverted by the unit reset).
		if (onReset) {
			onReset({ value: defaultValueOrDevice, unit: defaultUnitOrDevice, deviceType });
			setCurrentValue(defaultValueOrDevice);
			return;
		}

		// Controls that wire writes through callbacks (e.g. content-area width) pass a
		// no-op setAttributes; reset through the same callbacks so the attribute actually updates.
		if (onValueChange || onUnitChange) {
			if (onValueChange) {
				onValueChange({ value: defaultValueOrDevice, deviceType });
			}
			if (onUnitChange && undefined !== defaultUnitOrDevice) {
				onUnitChange({ unit: defaultUnitOrDevice, deviceType });
			}
			setCurrentValue(defaultValueOrDevice);
			return;
		}

		if (attributes.device) {
			setAttributes({
				[attributesKey]: {
					...attributes,
					device: {
						...attributes.device,
						[deviceType]: defaultValueOrDevice,
					},
					unit: {
						...attributes.unit,
						[deviceType]: defaultUnitOrDevice,
					},
				},
			});
		} else if ('object' === typeof attributes && 'number' === typeof attributes.value) {
			setAttributes({
				[attributesKey]: {
					...attributes,
					value: defaultValueOrDevice,
				},
			});
		} else {
			setAttributes({ [attributesKey]: defaultValue });
		}

		setCurrentValue(defaultValueOrDevice);
	};

	return (
		<Button
			className={`wpcp-header-control-reset ${activeResetButton()}`.trim()}
			onClick={() => setDefault()}
			aria-label="Reset to default value"
		>
			<ResetIcon />
		</Button>
	);
};

export default memo(ResetButton);
