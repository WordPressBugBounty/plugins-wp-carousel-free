/**
 * Taxonomy dynamic-CSS concern (editor side).
 *
 * Split out of the carouselDynamicCss monolith; the composer imports these.
 * Text/background colors (normal + hover) + box-shadow are emitted as
 * `--wpcp-tax-*` tokens via the style config; the rule-string builders here are
 * the Layer-5 remainder (border, radius, gap, padding).
 * Mirrors the PHP twin in CarouselDynamicCss::base_styles / responsive_css
 * (taxonomy branches).
 */

import { DEFAULTS } from './constants';
import { spacingGenerate } from './cssHelpers';
import {
	hasResolvedOptionValue,
	hasResponsiveSpacing,
	pushStylePropertyRuleIfDiffers,
} from './cssRuleHelpers';

/** @typedef {'Desktop'|'Tablet'|'Mobile'} DeviceType */

/**
 * Resolved gap string for taxonomy (base uses static px; responsive uses taxGap / gap device map).
 *
 * @param {Object}          [taxonomyOptions] - Taxonomy panel options.
 * @param {DeviceType|null} [device=null]     - Breakpoint, or null for base static gap.
 * @return {string|null} CSS gap value with unit, or null when unset.
 */
export const getTaxonomyGap = (taxonomyOptions, device = null) => {
	if (!taxonomyOptions) {
		return null;
	}
	if (device === null || device === undefined) {
		const taxGapObj = taxonomyOptions.taxGap;
		if (taxGapObj?.device && hasResolvedOptionValue(taxGapObj.device.Desktop)) {
			const unit = taxGapObj.unit?.Desktop || 'px';
			return `${taxGapObj.device.Desktop}${unit}`;
		}
		const g = taxonomyOptions.gap;
		if (!hasResolvedOptionValue(g)) {
			return null;
		}
		return `${g}px`;
	}
	const taxGapSrc = taxonomyOptions.taxGap ?? taxonomyOptions.gap;
	const val = taxGapSrc?.device?.[device];
	const unit = taxGapSrc?.unit?.[device] || 'px';
	if (!hasResolvedOptionValue(val)) {
		return null;
	}
	return `${val}${unit}`;
};

export const generateTaxonomyBaseStyles = (selectors, taxonomyOptions) => {
	const rules = [];
	const { taxonomy, taxonomyHover, taxonomyWrapper } = selectors;

	// Text/background colors (normal + hover) + box-shadow are emitted as
	// --wpcp-tax-color / -bg / -shadow tokens via the style config; static SCSS
	// (`.wpcp-item-taxonomy` + `:hover`) consumes them. Border / radius / gap
	// stay below as the Layer-5 remainder.
	pushStylePropertyRuleIfDiffers(
		rules,
		taxonomy,
		'border-radius',
		`${taxonomyOptions?.borderRadius}px`,
		`${DEFAULTS.sizes.taxonomyBorderRadius}px`
	);

	const cateBorder = taxonomyOptions?.cateBorder;
	if (cateBorder?.style && cateBorder.style !== 'none') {
		const widthCss = spacingGenerate(taxonomyOptions?.cateBorderWidth, 'Desktop');
		if (widthCss) {
			rules.push({
				class: taxonomy,
				styles: {
					'border-style': cateBorder.style,
					'border-color': cateBorder.color || '',
					'border-width': widthCss,
				},
			});
		}
		if (cateBorder.hoverColor) {
			rules.push({
				class: taxonomyHover,
				styles: { 'border-color': cateBorder.hoverColor },
			});
		}
	}

	const staticGap = getTaxonomyGap(taxonomyOptions, null);
	pushStylePropertyRuleIfDiffers(
		rules,
		taxonomyWrapper,
		'gap',
		staticGap,
		`${DEFAULTS.sizes.taxonomyGap}px`
	);

	return rules;
};

export const generateTaxonomyResponsiveRules = (selectors, taxonomyOptions, device) => {
	const rules = [];
	const { taxonomy, taxonomyWrapper } = selectors;

	if (taxonomyOptions?.padding && hasResponsiveSpacing(taxonomyOptions.padding)) {
		pushStylePropertyRuleIfDiffers(
			rules,
			taxonomy,
			'padding',
			spacingGenerate(taxonomyOptions.padding, device)
		);
	}

	const gapStr = getTaxonomyGap(taxonomyOptions, device);
	if (gapStr) {
		pushStylePropertyRuleIfDiffers(rules, taxonomyWrapper, 'gap', gapStr);
	}

	const taxonomyBr = taxonomyOptions?.borderRadius;
	if (taxonomyBr && typeof taxonomyBr === 'object') {
		const brCss = spacingGenerate(taxonomyBr, device, false);
		if (brCss) {
			pushStylePropertyRuleIfDiffers(
				rules,
				taxonomy,
				'border-radius',
				brCss,
				`${DEFAULTS.sizes.taxonomyBorderRadius}px`
			);
		}
	} else if (hasResolvedOptionValue(taxonomyBr)) {
		pushStylePropertyRuleIfDiffers(
			rules,
			taxonomy,
			'border-radius',
			`${taxonomyBr}px`,
			`${DEFAULTS.sizes.taxonomyBorderRadius}px`
		);
	}

	return rules;
};
