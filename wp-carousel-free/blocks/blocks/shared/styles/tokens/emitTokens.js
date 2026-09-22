/**
 * Token emitter (editor side) — a mechanical walk over the style config that
 * produces the per-device `--wpcp-*` token bags for one block instance.
 *
 * Mirrors `src/Blocks/Styles/Tokens/EmitTokens.php` step-for-step; the css-parity
 * value-map gate asserts both sides produce the same bags from the same
 * attributes. Returns `{ Desktop, Tablet, Mobile }`, each a `{ '--wpcp-*': value }`
 * map. The caller renders the Desktop bag at base and wraps Tablet/Mobile in their
 * fixed-breakpoint `@media` blocks (the static SCSS reads the same token names).
 *
 * Import invariant: imports the shared policy + primitives only — never the
 * composer (carouselDynamicCss).
 */

import { shouldEmit } from '../cssRuleHelpers';
import primitives from './primitives';
import { DEVICES } from '../constants';

const DEVICE_LIST = [DEVICES.DESKTOP, DEVICES.TABLET, DEVICES.MOBILE];

// Read a dot-path off the attribute tree, or undefined.
const readPath = (root, path) =>
	String(path)
		.split('.')
		.reduce((node, key) => (node === null || node === undefined ? undefined : node[key]), root);

// Evaluate a declarative `when` gate against the attributes.
const passesWhen = (when, attributes) => {
	if (!when) {
		return true;
	}
	const actual = readPath(attributes, when.attr);
	switch (when.op) {
		case 'eq':
			return actual === when.value;
		case 'neq':
			return actual !== when.value;
		case 'truthy':
			return Boolean(actual);
		case 'in':
			return Array.isArray(when.value) && when.value.includes(actual);
		default:
			return true;
	}
};

// Evaluate optional whenAll / whenAny / when gate arrays on a config row.
const passesRowGates = (row, attributes) => {
	if (row.whenAll && !row.whenAll.every((gate) => passesWhen(gate, attributes))) {
		return false;
	}
	if (row.whenAny && !row.whenAny.some((gate) => passesWhen(gate, attributes))) {
		return false;
	}
	if (row.when && !passesWhen(row.when, attributes)) {
		return false;
	}
	return true;
};

// Extract one device's value from a responsive attribute. A per-device unit falls
// back to the Desktop unit (mirrors getSocialRangerDimension) so an incomplete unit
// map still resolves; for a single-string unit it is used as-is.
const readDeviceValue = (attrValue, device) => {
	if (attrValue && typeof attrValue === 'object') {
		if (attrValue.device && typeof attrValue.device === 'object') {
			const unit =
				attrValue.unit && typeof attrValue.unit === 'object'
					? attrValue.unit[device] || attrValue.unit.Desktop
					: attrValue.unit;
			return { value: attrValue.device[device], unit };
		}
		if (DEVICE_LIST.some((deviceKey) => deviceKey in attrValue)) {
			return attrValue[device];
		}
	}
	return attrValue;
};

// The value the EmissionPolicy gates on (unwrap a `{ value }` pair).
const gateValueOf = (extracted) =>
	extracted && typeof extracted === 'object' && 'value' in extracted ? extracted.value : extracted;

/**
 * Walk the config rows and build the per-device token bags.
 *
 * @param {Array}  config     Style-config rows (StyleConfigRow[]).
 * @param {Object} attributes Block attribute tree.
 * @return {{Desktop: Object, Tablet: Object, Mobile: Object}} Per-device token bags.
 */
export const emitTokens = (config, attributes) => {
	const bags = { Desktop: {}, Tablet: {}, Mobile: {} };
	for (const row of config || []) {
		if (!passesRowGates(row, attributes)) {
			continue;
		}
		const transform = primitives[row.transform] || primitives.raw;
		const attrValue = readPath(attributes, row.attr);

		if (row.device) {
			for (const device of DEVICE_LIST) {
				const extracted = row.wholeAttr ? attrValue : readDeviceValue(attrValue, device);
				if (!row.always && !shouldEmit(gateValueOf(extracted), row.default)) {
					continue;
				}
				const out = transform(extracted, row, device);
				if (out !== null && out !== undefined && out !== '') {
					bags[device][row.var] = out;
				}
			}
			continue;
		}

		if (!row.always && !shouldEmit(attrValue, row.default)) {
			continue;
		}
		const out = transform(attrValue, row);
		if (out !== null && out !== undefined && out !== '') {
			bags.Desktop[row.var] = out;
		}
	}
	return bags;
};

export default emitTokens;
