/**
 * Resolves the current numeric value from block attribute shapes used by SPRangeControl.
 *
 * @param {Object|number|undefined} attributes Block attribute value (object with device/value, or raw number).
 * @param {string}                  deviceType Active breakpoint key.
 * @return {number|undefined} Current slider value.
 */
export function getRangeNumericValue(attributes, deviceType) {
	if (!attributes && attributes !== 0) {
		return undefined;
	}
	if (attributes?.device) {
		return attributes.device[deviceType];
	}
	if (typeof attributes?.value === 'number') {
		return attributes.value;
	}
	return attributes;
}

/**
 * Resolves default value + unit for the active breakpoint for comparison / reset.
 *
 * @param {Object|undefined} defaultValue Default shape from block definition.
 * @param {string}           deviceType   Active breakpoint key.
 * @return {{ value: *, unit: * }} Resolved default value and unit.
 */
export function getResolvedDefault(defaultValue, deviceType) {
	if (!defaultValue || typeof defaultValue !== 'object') {
		return { value: undefined, unit: undefined };
	}
	if (defaultValue.device) {
		return {
			value: defaultValue.device[deviceType],
			unit:
				typeof defaultValue.unit === 'object' ? defaultValue.unit?.[deviceType] : defaultValue.unit,
		};
	}
	return {
		value: defaultValue.value,
		unit: typeof defaultValue.unit === 'object' ? defaultValue.unit?.[deviceType] : defaultValue.unit,
	};
}

/**
 * Current unit string for the active device (px, %, em, …).
 *
 * @param {Object|undefined} attributes Block attribute object.
 * @param {string}           deviceType Active breakpoint key.
 * @return {string|undefined} Lowercased unit or undefined.
 */
export function getActiveUnit(attributes, deviceType) {
	if (typeof attributes?.unit === 'object' && attributes.unit?.[deviceType]) {
		return attributes.unit[deviceType];
	}
	if (typeof attributes?.unit === 'string') {
		return attributes.unit.toLowerCase();
	}
	return undefined;
}

/**
 * Whether the control differs from defaults (for reset visibility / active state).
 *
 * @param {Object|undefined} attributes          Current attribute object.
 * @param {Object|undefined} defaultValue        Default from block / panel.
 * @param {string}           deviceType          Active breakpoint key.
 * @param {number|undefined} currentNumericValue Current resolved value.
 * @return {boolean} True if value or unit differs from default (or default unknown).
 */
export function isRangeValueChanged(attributes, defaultValue, deviceType, currentNumericValue) {
	const hasMeaningfulDefault =
		defaultValue &&
		typeof defaultValue === 'object' &&
		(defaultValue.device !== undefined ||
			defaultValue.value !== undefined ||
			defaultValue.unit !== undefined);

	if (!hasMeaningfulDefault) {
		return true;
	}

	const { value: defVal, unit: defUnit } = getResolvedDefault(defaultValue, deviceType);

	const hasUnitObjects =
		typeof attributes?.unit === 'object' && typeof defaultValue?.unit === 'object';
	const isUnitDifferent =
		hasUnitObjects && defaultValue.unit?.[deviceType] !== attributes.unit?.[deviceType];

	if (isUnitDifferent) {
		return true;
	}

	const activeUnit = getActiveUnit(attributes, deviceType);
	if (activeUnit !== undefined && defUnit !== undefined && activeUnit !== defUnit) {
		return true;
	}

	const num = Number(currentNumericValue);
	const defNum = Number(defVal);
	if (Number.isFinite(num) && Number.isFinite(defNum)) {
		return num !== defNum;
	}
	return currentNumericValue !== defVal;
}
