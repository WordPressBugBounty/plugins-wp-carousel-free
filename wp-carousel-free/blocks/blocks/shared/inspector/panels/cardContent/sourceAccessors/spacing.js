/**
 * Spacing/margin helpers shared by the per-source Style-tab accessors.
 *
 * The three former panels used two different spacing conventions, both kept
 * here verbatim so each source writes the exact same margin shape it did before
 * the merge:
 *   - image/audio/document (`ContentPanel`): `normalizeSpacingAttr` +
 *     `createSpacingDefaults` with a single-device default.
 *   - post/product: an all-device `SPACING_DEFAULT` base; product additionally
 *     wires onChange/onUnitChange/updateAllChange via `createSpacingHandlers`.
 */

// image/audio/document (ContentPanel) ----------------------------------------

export function createSpacingDefaults(initial = 0) {
	return {
		allChange: true,
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		// Only Desktop until the user edits Tablet/Mobile — avoids saving fake zeros that override CSS.
		device: {
			Desktop: { top: initial, right: initial, bottom: initial, left: initial },
		},
	};
}

export function normalizeSpacingAttr(value, fallback = 0) {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	const initial = Number.isFinite(Number(value)) ? Number(value) : fallback;
	return createSpacingDefaults(initial);
}

// post/product ---------------------------------------------------------------

export const SPACING_DEFAULT = {
	device: {
		Desktop: { top: '', right: '', bottom: '', left: '' },
		Tablet: { top: '', right: '', bottom: '', left: '' },
		Mobile: { top: '', right: '', bottom: '', left: '' },
	},
	unit: {
		Desktop: 'px',
		Tablet: 'px',
		Mobile: 'px',
	},
	allChange: true,
};

/**
 * Builds the product-style spacing handlers (onChange/onUnitChange/updateAllChange)
 * bound to a container `set`. Lifted verbatim from `ProductContentPanel`.
 *
 * @param {(updates: Object) => void} set Container setter.
 * @return {(key: string, getter: () => Object) => Object} Handler factory.
 */
export function makeCreateSpacingHandlers(set) {
	return (key, getter) => ({
		onChange: (value) => set({ [key]: value }),

		onUnitChange: ({ unit, deviceType }) =>
			set({
				[key]: {
					...getter(),
					unit: {
						...SPACING_DEFAULT?.unit,
						...getter()?.unit,
						[deviceType]: unit,
					},
				},
			}),

		updateAllChange: (value) =>
			set({
				[key]: {
					...getter(),
					allChange: value,
				},
			}),
	});
}
