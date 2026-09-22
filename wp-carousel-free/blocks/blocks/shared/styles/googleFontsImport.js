/**
 * Editor-only Google Fonts `@import` collector.
 *
 * Split out of the carouselDynamicCss monolith; the composer calls
 * `buildGoogleFontsImport(attributes, mode)` for the editor preview only — the
 * frontend enqueues Google Fonts via PHP, so this returns '' unless
 * `mode === 'editor'`. No `--wpcp-*` tokens (value-map unaffected); editor
 * chrome with no PHP mirror.
 */

import { SOURCE_TYPES } from './constants';
import { firstTypographyValue, getAudioReadMoreButtonStyle } from './sourceConfigHelpers';

const isDefaultOrEmptyFontFamily = (name) => {
	if (name === null || name === undefined) {
		return true;
	}
	const s = String(name).trim();
	return s === '' || /^default$/i.test(s);
};

const normalizeFamilyForGoogleCss2 = (family) => String(family).trim().replace(/\s+/g, '+');

// CSS generic family keywords and global values are never web fonts and have no
// Google Fonts counterpart — they must never become a css2 `family=` param.
const CSS_NON_WEB_FAMILIES = new Set([
	'serif',
	'sans-serif',
	'monospace',
	'cursive',
	'fantasy',
	'system-ui',
	'ui-serif',
	'ui-sans-serif',
	'ui-monospace',
	'ui-rounded',
	'math',
	'emoji',
	'fangsong',
	'inherit',
	'initial',
	'revert',
	'revert-layer',
	'unset',
]);

/**
 * Whether a font-family value should be requested from Google Fonts.
 *
 * The typography control stores Google fonts as a bare name ("Freehand") but
 * system/theme fonts as a full CSS fallback stack ("Manrope, sans-serif").
 * Only bare names are valid css2 `family=` params; a fallback stack or CSS
 * keyword would produce a malformed `@import` that breaks the editor
 * stylesheet, so such values are excluded here. The family still applies via
 * the emitted `font-family` CSS rule either way.
 *
 * @param {*} family Font-family value from a typography node.
 * @return {boolean} True when the family is a requestable Google web font.
 */
const isGoogleWebFont = (family) => {
	if (family === null || family === undefined) {
		return false;
	}
	const trimmed = String(family).trim();
	if (trimmed === '') {
		return false;
	}
	// A comma signals a multi-family fallback stack = a system/theme font.
	if (trimmed.includes(',')) {
		return false;
	}
	const bare = trimmed
		.replace(/^["']|["']$/g, '')
		.trim()
		.toLowerCase();
	return !CSS_NON_WEB_FAMILIES.has(bare);
};

const collectFontRequestsFromTypographies = (typographyNodes) => {
	const typographyPairs = (typographyNodes || []).filter(Boolean);

	const requests = new Set();
	for (const typographyAttr of typographyPairs) {
		if (!typographyAttr) {
			continue;
		}

		// Typography control stores family + fontWeight at the same level (expected),
		// but some saves store them nested under `family` as an object.
		const familyRaw = typographyAttr?.family;
		let family = familyRaw;
		let fontWeightOverride = null;
		let styleRaw = typographyAttr?.style || '';

		if (familyRaw && typeof familyRaw === 'object') {
			family =
				familyRaw?.family ?? familyRaw?.googleFont?.family ?? familyRaw?.typography?.family ?? '';
			fontWeightOverride = familyRaw?.fontWeight ?? familyRaw?.['font-weight'] ?? null;
			styleRaw = typographyAttr?.style ?? familyRaw?.style ?? '';
		}

		if (isDefaultOrEmptyFontFamily(family)) {
			continue;
		}

		// System/theme fonts are CSS fallback stacks (e.g. "Manrope, sans-serif")
		// or generic keywords — never a Google font. Exclude them so they don't
		// corrupt the css2 `@import`; they still apply via `font-family` CSS.
		if (!isGoogleWebFont(family)) {
			continue;
		}

		const hasOverride =
			fontWeightOverride !== null &&
			fontWeightOverride !== undefined &&
			String(fontWeightOverride).trim() !== '';
		const fontWeight = hasOverride ? String(fontWeightOverride) : typographyAttr?.fontWeight || '400';

		const isItalic = String(styleRaw).toLowerCase().includes('italic');

		const familyPlus = normalizeFamilyForGoogleCss2(family);
		requests.add(`${familyPlus}|${fontWeight}|${isItalic ? 'italic' : 'normal'}`);
	}

	return Array.from(requests).map((v) => {
		const [familyPlus, fontWeight, ital] = v.split('|');
		return { familyPlus, fontWeight, isItalic: ital === 'italic' };
	});
};

const collectTypographyFontRequests = (attributes) => {
	const {
		contentOptions = {},
		metaOptions = {},
		taxonomyOptions = {},
		postContentOptions = {},
		productContentOptions = {},
		audioOptions = {},
		paginationOptions = {},
		sourceType,
	} = attributes || {};
	const audioReadMoreButtonStyle = getAudioReadMoreButtonStyle(audioOptions, productContentOptions);

	let buttonTypography;
	if (sourceType === SOURCE_TYPES.AUDIO) {
		buttonTypography = firstTypographyValue(audioReadMoreButtonStyle?.buttonTypography);
	} else if ([SOURCE_TYPES.POST, SOURCE_TYPES.EXTERNAL, SOURCE_TYPES.VIDEO].includes(sourceType)) {
		buttonTypography = firstTypographyValue(
			postContentOptions?.buttonTypography,
			contentOptions?.buttonTypography
		);
	} else if (sourceType === SOURCE_TYPES.PRODUCT) {
		buttonTypography = firstTypographyValue(
			productContentOptions?.buttonTypography,
			contentOptions?.buttonTypography
		);
	} else {
		buttonTypography = firstTypographyValue(contentOptions?.buttonTypography);
	}
	const priceTypography = productContentOptions?.priceTypography;

	return collectFontRequestsFromTypographies([
		contentOptions?.titleTypography,
		contentOptions?.descTypography,
		metaOptions?.typography,
		taxonomyOptions?.typography,
		buttonTypography,
		priceTypography,
		paginationOptions?.typography,
	]);
};

const requestsToImportLine = (requests) => {
	if (!requests.length) {
		return '';
	}

	const fontListParams = requests.map(({ familyPlus, fontWeight, isItalic }) => {
		return `family=${familyPlus}${isItalic ? `:ital,wght@1,${fontWeight}` : `:wght@${fontWeight}`}&`;
	});

	return `@import url('https://fonts.googleapis.com/css2?${fontListParams.join('')}display=swap');`;
};

/**
 * Build the editor-preview Google Fonts `@import` line (empty unless editor mode).
 *
 * @param {Object}          attributes - Block attributes.
 * @param {'editor'|'base'} mode       - `editor` collects fonts; otherwise ''.
 * @return {string} `@import url(...)` line or ''.
 */
export const buildGoogleFontsImport = (attributes, mode) => {
	if (mode !== 'editor') {
		return '';
	}

	return requestsToImportLine(collectTypographyFontRequests(attributes));
};

/**
 * Build an editor-preview Google Fonts `@import` line from a raw list of
 * typography nodes. Used by standalone blocks (e.g. gallery-filter) whose
 * typography lives outside the carousel attribute buckets.
 *
 * @param {Array}           typographyNodes - Typography attribute objects.
 * @param {'editor'|'base'} mode            - `editor` collects fonts; otherwise ''.
 * @return {string} `@import url(...)` line or ''.
 */
export const buildGoogleFontsImportFromTypographies = (typographyNodes, mode = 'editor') => {
	if (mode !== 'editor') {
		return '';
	}

	return requestsToImportLine(collectFontRequestsFromTypographies(typographyNodes));
};
