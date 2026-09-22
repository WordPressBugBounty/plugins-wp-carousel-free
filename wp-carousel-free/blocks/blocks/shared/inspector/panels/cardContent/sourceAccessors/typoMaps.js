/**
 * Typography control key/value maps shared by the per-source Style-tab accessors.
 *
 * `Typography` reads/writes flat keys (family, fontSize, …) via the *Key props;
 * the accessor setters merge those updates into the nested `*Typography` object
 * on the appropriate attribute container. These maps are lifted verbatim from
 * the former Content/Post Content/Product Content panels (identical in each).
 */

export const TYPO_KEY_MAP = {
	familyKey: 'family',
	fontSizeKey: 'fontSize',
	lineHeightKey: 'lineHeight',
	fontSpacingKey: 'fontSpacing',
	wordSpacingKey: 'wordSpacing',
};

export const TYPO_MAP = {
	family: '',
	fontSize: {
		device: {
			Desktop: '',
		},
		unit: {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
		},
	},
	lineHeight: {
		device: {
			Desktop: '',
		},
		unit: {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
		},
	},
	fontSpacing: {
		device: {
			Desktop: '',
		},
		unit: {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
		},
	},
	wordSpacing: {
		device: {
			Desktop: '',
		},
		unit: {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
		},
	},
};

/**
 * Merge a typography update into an existing typography object.
 *
 * The `family` value is itself an object bundling the font name with its
 * style (`fontWeight`, `style`, `transform`, `decoration`). Apply-to-All
 * sends a family-only patch, so a shallow merge would wipe each target's own
 * style. Deep-merge `family` instead, letting the target keep its style while
 * only the supplied fields change. Normal edits pass the full family object,
 * so this is a no-op for them.
 *
 * @param {Object} [existingTypography] Target typography object.
 * @param {Object} [updates]            Incoming update (e.g. `{ family: { family } }`).
 * @return {Object} Merged typography object.
 */
export const mergeTypographyUpdate = (existingTypography, updates) => {
	const existing = existingTypography || {};
	const merged = { ...existing, ...(updates || {}) };

	if (updates && updates.family && 'object' === typeof updates.family) {
		const existingFamily =
			existing.family && 'object' === typeof existing.family ? existing.family : {};
		merged.family = { ...existingFamily, ...updates.family };
	}

	return merged;
};
