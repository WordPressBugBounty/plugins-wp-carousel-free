/**
 * Typography dynamic-CSS concern (editor side).
 *
 * Split out of the carouselDynamicCss monolith; the composer imports this.
 * Multi-property typography across the six text selectors (title, desc, meta,
 * taxonomy, read-more, price) is a Layer-5 rule-string builder — the flat
 * four-category token model can't express it (see §14.1). Mirrors the PHP twin
 * in CarouselDynamicCss::responsive_css (typography branch).
 */

import { getTypographyStyles } from './cssHelpers';
import { getSourceConfig } from './sourceConfigHelpers';

export const generateTypographyRules = (selectors, attributes, device) => {
	const { contentOptions = {}, metaOptions = {}, taxonomyOptions = {} } = attributes;

	const { buttonTypography, priceTypography } = getSourceConfig(attributes);

	const typographyMap = [
		{ config: contentOptions?.titleTypography, selector: selectors.title },
		{ config: contentOptions?.descTypography, selector: selectors.desc },
		{ config: metaOptions?.typography, selector: selectors.meta },
		{ config: taxonomyOptions?.typography, selector: selectors.taxonomy },
		{ config: buttonTypography, selector: selectors.readMore },
		{ config: priceTypography, selector: selectors.price },
	];

	const rules = [];
	for (const { config, selector } of typographyMap) {
		if (!config) {
			continue;
		}
		const styles = getTypographyStyles({
			typography: config,
			fontSize: config.fontSize,
			fontSpacing: config.fontSpacing,
			lineHeight: config.lineHeight,
			wordSpacing: config.wordSpacing,
			device,
		});
		if (Object.keys(styles).length > 0) {
			rules.push({ class: selector, styles });
		}
	}
	return rules;
};
