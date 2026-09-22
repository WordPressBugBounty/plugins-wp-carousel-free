/**
 * Default shapes for lightbox module settings (mirrors PHP Lightbox_Settings defaults).
 */

export const RANGER_DEFAULT = {
	device: {
		Desktop: '',
		Tablet: '',
		Mobile: '',
	},
	unit: {
		Desktop: 'px',
		Tablet: 'px',
		Mobile: 'px',
	},
};

/**
 * @param {number|string} [initial]
 * @return {Object} Responsive spacing default (block editor shape).
 */
export function createResponsiveSpacingDefault(initial = 0) {
	const side = String(initial);
	return {
		allChange: true,
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		device: {
			Desktop: { top: side, right: side, bottom: side, left: side },
		},
	};
}

/**
 * Flat (non-responsive) spacing default. Omitting the `device` key keeps the
 * Spacing control device-independent and hides its per-device switcher.
 *
 * @param {number|string} [initial]
 * @return {Object} Flat spacing default ({ value, unit } shape).
 */
export function createFlatSpacingDefault(initial = 0) {
	const side = String(initial);
	return {
		allChange: true,
		unit: 'px',
		value: { top: side, right: side, bottom: side, left: side },
	};
}

export const iconBorderDefault = {
	style: 'none',
	color: '',
};

export const iconBorderWidthDefault = createResponsiveSpacingDefault(0);
// Border radius is a single, device-independent value (no responsive switcher).
export const iconBorderRadiusDefault = createFlatSpacingDefault(0);
// Matches static `.wpcp-overlay-icon` padding fallback (11px).
export const iconPaddingDefault = createResponsiveSpacingDefault(11);
export const iconSizeDefault = {
	device: { Desktop: 20, Tablet: 20, Mobile: 20 },
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
};
/** Pre-Figma global lightbox icon size (baked into saved settings before the 20px default). */
export const LEGACY_ICON_SIZE_PX = 75;
export const iconOffsetDefault = { value: 12, unit: 'px' };

export const DEFAULT_LIGHTBOX_ICON_NAME = 'search';

export const defaultLightboxIcon = () => ({
	source: 'icon',
	iconName: DEFAULT_LIGHTBOX_ICON_NAME,
	image: {},
});
const defaultIconStateStyle = () => ({
	iconColor: '',
	backgroundColor: '',
	border: { ...iconBorderDefault },
	borderWidth: { ...iconBorderWidthDefault },
});

/**
 * @return {Object} Default lightbox module settings shape.
 */
export function getLightboxDefaults() {
	return {
		lightboxProvider: 'fancybox',
		wpImagesEnable: true,
		lightboxIcon: defaultLightboxIcon(),
		lightboxIconStyle: 'default',
		iconDisplayPosition: 'top-right',
		iconVisible: 'hover',
		iconOffset: { ...iconOffsetDefault },
		lightboxTheme: 'dark',
		closeOnClickOutside: true,
		navigationArrow: true,
		transitionEffect: 'zoom',
		itemCounter: true,
		thumbnailsDisplayStyle: 'classic',
		iconStyle: {
			size: { ...iconSizeDefault },
			borderRadius: { ...iconBorderRadiusDefault },
			padding: { ...iconPaddingDefault },
			normal: defaultIconStateStyle(),
			hover: defaultIconStateStyle(),
		},
	};
}

/**
 * @param {number|Object|undefined} attr Range attribute or legacy number.
 * @return {boolean} True when the value is exactly the pre-Figma 75px default.
 */
export function isLegacyIconSizeDefault(attr) {
	if (typeof attr === 'number' && !Number.isNaN(attr)) {
		return LEGACY_ICON_SIZE_PX === attr;
	}
	if (!attr || typeof attr !== 'object') {
		return false;
	}
	if (typeof attr.value === 'number') {
		return LEGACY_ICON_SIZE_PX === attr.value;
	}
	if (attr.device && typeof attr.device === 'object') {
		const values = ['Desktop', 'Tablet', 'Mobile']
			.map((device) => attr.device[device])
			.filter((value) => value !== '' && value !== undefined && value !== null)
			.map((value) => Number(value));
		if (0 === values.length) {
			return false;
		}
		return values.every((value) => LEGACY_ICON_SIZE_PX === value);
	}
	return false;
}

/**
 * Coerce the pre-Figma baked default (75px) to the current 20px default so
 * saved module settings open/render at the Figma size without a manual reset.
 *
 * @param {number|Object|undefined} attr Range attribute or legacy number.
 * @return {number|Object|undefined} Migrated size, or the original attribute.
 */
export function migrateLegacyIconSize(attr) {
	if (!isLegacyIconSizeDefault(attr)) {
		return attr;
	}
	return {
		device: { ...iconSizeDefault.device },
		unit: { ...iconSizeDefault.unit },
	};
}

/**
 * @param {number|Object} attr     Range attribute or legacy number.
 * @param {Object}        fallback Default responsive range shape.
 * @return {Object} Normalized responsive range attribute.
 */
export function normalizeRangeAttribute(attr, fallback = iconSizeDefault) {
	const resolved = migrateLegacyIconSize(attr);
	if (resolved && typeof resolved === 'object' && resolved.device) {
		return {
			...RANGER_DEFAULT,
			...fallback,
			...resolved,
			device: {
				...RANGER_DEFAULT.device,
				...(fallback.device || {}),
				...resolved.device,
			},
			unit: {
				...RANGER_DEFAULT.unit,
				...(fallback.unit || {}),
				...(resolved.unit || {}),
			},
		};
	}
	if (typeof resolved === 'number' && !Number.isNaN(resolved)) {
		return {
			device: { Desktop: resolved, Tablet: resolved, Mobile: resolved },
			unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		};
	}
	if (resolved && typeof resolved === 'object' && typeof resolved.value === 'number') {
		const unit = resolved.unit || fallback.unit?.Desktop || 'px';
		return {
			device: { Desktop: resolved.value, Tablet: resolved.value, Mobile: resolved.value },
			unit: { Desktop: unit, Tablet: unit, Mobile: unit },
		};
	}
	return {
		...RANGER_DEFAULT,
		...fallback,
		device: { ...RANGER_DEFAULT.device, ...(fallback.device || {}) },
		unit: { ...RANGER_DEFAULT.unit, ...(fallback.unit || {}) },
	};
}

/**
 * @param {string}   key
 * @param {Function} getter
 * @param {Function} patch
 * @return {Object} SPRangeControl handler props.
 */
export function createResponsiveRangeHandlers(key, getter, patch) {
	return {
		onValueChange: ({ value, deviceType }) =>
			patch({
				[key]: {
					...getter(),
					device: {
						...getter().device,
						[deviceType]: value,
					},
				},
			}),
		onUnitChange: ({ unit, deviceType }) =>
			patch({
				[key]: {
					...getter(),
					unit: {
						...(getter().unit || {}),
						[deviceType]: unit,
					},
				},
			}),
		onReset: ({ value, unit, deviceType }) =>
			patch({
				[key]: {
					...getter(),
					device: {
						...getter().device,
						[deviceType]: value,
					},
					unit: {
						...(getter().unit || {}),
						[deviceType]: unit,
					},
				},
			}),
	};
}

/**
 * @param {Object} state Raw icon style state (normal/hover).
 * @return {Object} Sanitized normal/hover icon style state.
 */
export function migrateIconStyleState(state = {}) {
	const next = { ...state };

	if (typeof state.borderType === 'string' && !state.border) {
		next.border = {
			...iconBorderDefault,
			style: state.borderType,
		};
		delete next.borderType;
	}

	if (!next.border) {
		next.border = { ...iconBorderDefault };
	}

	if (!next.borderWidth) {
		next.borderWidth = { ...iconBorderWidthDefault };
	} else {
		next.borderWidth = migrateGlobalSpacing(next.borderWidth, iconBorderWidthDefault);
	}

	if (next.border && typeof next.border === 'object') {
		const { hoverColor, hover, hoverStyle, activeColor, active, ...borderRest } = next.border;
		next.border = borderRest;
	}

	delete next.borderRadius;
	delete next.padding;
	delete next.margin;

	return next;
}

/**
 * @param {Object} spacing  Raw spacing from state or root.
 * @param {Object} fallback Default spacing shape.
 * @return {Object} Normalized spacing attribute.
 */
function migrateGlobalSpacing(spacing, fallback) {
	if (typeof spacing === 'number') {
		return createResponsiveSpacingDefault(spacing);
	}
	if (spacing && typeof spacing === 'object' && spacing.device) {
		const merged = { ...fallback, ...spacing };
		if (undefined === merged.allChange) {
			merged.allChange = fallback.allChange !== undefined ? fallback.allChange : true;
		}
		merged.unit = {
			Desktop: 'px',
			Tablet: 'px',
			Mobile: 'px',
			...(fallback.unit || {}),
			...(spacing.unit || {}),
		};
		merged.device = {
			...(fallback.device || {}),
			...(spacing.device || {}),
		};
		return merged;
	}
	if (spacing && typeof spacing === 'object' && spacing.value) {
		const sides = spacing.value;
		const unit =
			typeof spacing.unit === 'string'
				? { Desktop: spacing.unit, Tablet: spacing.unit, Mobile: spacing.unit }
				: {
						Desktop: 'px',
						Tablet: 'px',
						Mobile: 'px',
						...(spacing.unit || {}),
				  };
		const migrated = {
			...fallback,
			...spacing,
			allChange: spacing.allChange !== undefined ? spacing.allChange : true,
			unit,
			device: {
				Desktop: { ...sides },
			},
		};
		delete migrated.value;
		return migrated;
	}
	return { ...fallback };
}

/**
 * Icon offset is a single (non-responsive) length. Read it as a flat
 * { value, unit } shape, tolerating the legacy responsive { device, unit } shape.
 *
 * @param {number|Object} attr Offset attribute.
 * @return {{ value: number, unit: string }} Flat offset value.
 */
export function normalizeOffset(attr) {
	const fallbackValue = iconOffsetDefault.value;
	const fallbackUnit = iconOffsetDefault.unit;
	let rawValue = fallbackValue;
	let rawUnit = fallbackUnit;

	if (typeof attr === 'number') {
		rawValue = attr;
	} else if (attr && typeof attr === 'object') {
		if (attr.value !== undefined) {
			rawValue = attr.value;
			if (typeof attr.unit === 'string') {
				rawUnit = attr.unit;
			}
		} else if (attr.device && attr.device.Desktop !== undefined) {
			rawValue = attr.device.Desktop;
			if (attr.unit && typeof attr.unit === 'object' && attr.unit.Desktop) {
				rawUnit = attr.unit.Desktop;
			} else if (typeof attr.unit === 'string') {
				rawUnit = attr.unit;
			}
		}
	}

	const value = Number.isFinite(Number(rawValue)) ? Number(rawValue) : fallbackValue;
	const unit = ['px', '%', 'em'].includes(rawUnit) ? rawUnit : fallbackUnit;
	return { value, unit };
}

/**
 * @param {Object} draft Lightbox extension draft.
 * @return {Object} Migrated lightbox draft merged with defaults.
 */
export function migrateLightboxDraft(draft) {
	if (!draft || typeof draft !== 'object') {
		return draft;
	}

	const defaults = getLightboxDefaults();
	const iconStyle = draft.iconStyle || {};
	const normalRaw = iconStyle.normal || {};
	const hoverRaw = iconStyle.hover || {};

	const borderRadius =
		iconStyle.borderRadius !== undefined
			? normalizeFlatSpacingAttribute(iconStyle.borderRadius, iconBorderRadiusDefault)
			: normalizeFlatSpacingAttribute(
					normalRaw.borderRadius ?? hoverRaw.borderRadius,
					iconBorderRadiusDefault
			  );

	const padding =
		iconStyle.padding !== undefined
			? migrateGlobalSpacing(iconStyle.padding, iconPaddingDefault)
			: migrateGlobalSpacing(normalRaw.padding ?? hoverRaw.padding, iconPaddingDefault);

	return {
		...defaults,
		...draft,
		lightboxProvider: draft.lightboxProvider || defaults.lightboxProvider,
		iconVisible:
			draft.iconVisible === 'hover' || draft.iconVisible === 'always' ? draft.iconVisible : 'hover',
		iconOffset: normalizeOffset(draft.iconOffset),
		iconStyle: {
			...iconStyle,
			size: normalizeRangeAttribute(iconStyle.size, iconSizeDefault),
			borderRadius,
			padding,
			normal: migrateIconStyleState(normalRaw),
			hover: migrateIconStyleState(hoverRaw),
		},
	};
}

/**
 * @param {Object} spacing  Raw spacing attribute.
 * @param {Object} fallback Default spacing shape.
 * @return {Object} Normalized spacing attribute.
 */
export function normalizeSpacingAttribute(spacing, fallback) {
	return migrateGlobalSpacing(spacing, fallback);
}

/**
 * Coerce any spacing shape (number, flat { value }, or responsive { device })
 * into the flat, device-independent { value, unit } shape. Used for controls
 * that must not expose a per-device switcher (e.g. icon border radius). Legacy
 * responsive values are flattened to their Desktop value.
 *
 * @param {number|Object} spacing  Raw spacing attribute.
 * @param {Object}        fallback Flat spacing default.
 * @return {Object} Flat spacing attribute.
 */
export function normalizeFlatSpacingAttribute(spacing, fallback = iconBorderRadiusDefault) {
	if (typeof spacing === 'number' && !Number.isNaN(spacing)) {
		return createFlatSpacingDefault(spacing);
	}

	if (spacing && typeof spacing === 'object') {
		const allChange = spacing.allChange !== undefined ? spacing.allChange : true;
		const unit =
			'object' === typeof spacing.unit ? spacing.unit.Desktop || 'px' : spacing.unit || 'px';

		const sides =
			spacing.device && typeof spacing.device === 'object' ? spacing.device.Desktop : spacing.value;

		if (sides && typeof sides === 'object') {
			const value = {
				top: sides.top ?? '0',
				right: sides.right ?? '0',
				bottom: sides.bottom ?? '0',
				left: sides.left ?? '0',
			};
			return {
				allChange,
				unit,
				value,
			};
		}
	}

	return { ...fallback };
}
