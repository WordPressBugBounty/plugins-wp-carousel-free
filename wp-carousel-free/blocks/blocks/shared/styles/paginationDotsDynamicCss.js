/**
 * Slide-bullet pagination dynamic CSS generator.
 *
 * Token bag (`--wpcp-pag-*`) is config-driven via emitTokens; the top offset and
 * the margin stay as a thin Layer-5 remainder.
 *
 * PHP mirror: NavigationBuilder::render_pagination_dynamic_css().
 */

import {
	objectToCssString,
	mergeCssRulesBySelector,
	wrapInMediaQuery,
	dropRulesMatchingBaseline,
} from './cssUtils';
import { TABLET_MEDIA_QUERY, MOBILE_MEDIA_QUERY } from './constants';
import { getDeviceValue } from '../utils/paginationDimsUtils';
import paginationStyleConfig from './config/pagination-style-config';
import { emitTokens } from './tokens/emitTokens';

const DEVICES = ['Desktop', 'Tablet', 'Mobile'];
const MARGIN_UNITS = ['px', 'em', '%'];

const clamp = (value, min, max, fallback) => {
	const n = Number(value);
	if (!Number.isFinite(n)) {
		return fallback;
	}
	return Math.min(max, Math.max(min, n));
};

const getSpacingDevice = (spacing, device) => {
	if (!spacing?.device?.[device]) {
		return null;
	}
	const unitRaw = spacing.unit;
	const unitValue = String(
		typeof unitRaw === 'object' && unitRaw !== null
			? getDeviceValue(unitRaw, device, 'px')
			: unitRaw || 'px'
	).toLowerCase();
	const unit = MARGIN_UNITS.includes(unitValue) ? unitValue : 'px';
	const v = spacing.device[device];
	return {
		unit,
		top: Number(v.top ?? 0),
		right: Number(v.right ?? 0),
		bottom: Number(v.bottom ?? 0),
		left: Number(v.left ?? 0),
	};
};

/**
 * Layer-5 direct property (not tokenized): the top-position offset.
 *
 * @param {Object} pag    - Pagination dots options.
 * @param {string} device - Device key (Desktop, Tablet, Mobile).
 * @return {Object} Per-device CSS property map (top).
 */
const paginationLayoutProps = (pag, device) => {
	const props = {};
	const style = pag?.paginationStyle || 'dots';

	if (style !== 'scrollbar' && pag?.verticalPos === 'top') {
		// Each device holds a four-sided spacing value; the offset is its top side.
		const deviceOffset = getDeviceValue(pag?.verticalPosition?.device, device, 30);
		const offsetTop =
			deviceOffset && typeof deviceOffset === 'object' ? deviceOffset.top : deviceOffset;
		// A blank side falls back like a missing one, matching PHP's is_numeric().
		const verticalOffset =
			'' === offsetTop || null === offsetTop ? 30 : clamp(offsetTop, -200, 400, 30);
		const verticalOffsetUnit = getDeviceValue(pag?.verticalPosition?.unit, device, 'px');
		props.top = `${verticalOffset}${verticalOffsetUnit}`;
	}

	return props;
};

/**
 * Margin sides as custom properties on the block root, where the stage can read them too.
 *
 * @param {Object} pag    - Pagination dots options.
 * @param {string} device - Device key (Desktop, Tablet, Mobile).
 * @return {Object} Per-device custom-property map (empty when every side is 0).
 */
const paginationMarginVars = (pag, device) => {
	const margin = getSpacingDevice(pag?.margin, device);
	if (!margin || !(margin.top || margin.right || margin.bottom || margin.left)) {
		return {};
	}
	return {
		'--wpcp-pag-margin-top': `${margin.top}${margin.unit}`,
		'--wpcp-pag-margin-right': `${margin.right}${margin.unit}`,
		'--wpcp-pag-margin-bottom': `${margin.bottom}${margin.unit}`,
		'--wpcp-pag-margin-left': `${margin.left}${margin.unit}`,
	};
};

const paginationDotsDynamicCss = (blockUniqueId, paginationDotsOptions) => {
	if (!blockUniqueId || !paginationDotsOptions) {
		return '';
	}

	const attributes = { paginationDotsOptions };
	const tokenBags = emitTokens(paginationStyleConfig, attributes);
	const rootSelector = `#${blockUniqueId}`;
	const baseSelector = `${rootSelector} .wpcp-pagination.swiper-pagination`;

	const rulesByDevice = {
		Desktop: [],
		Tablet: [],
		Mobile: [],
	};

	DEVICES.forEach((device) => {
		const styles = {
			...tokenBags[device],
			...paginationLayoutProps(paginationDotsOptions, device),
		};
		if (Object.keys(styles).length > 0) {
			rulesByDevice[device].push({
				class: baseSelector,
				styles,
			});
		}
		const marginVars = paginationMarginVars(paginationDotsOptions, device);
		if (Object.keys(marginVars).length > 0) {
			rulesByDevice[device].push({
				class: rootSelector,
				styles: marginVars,
			});
		}
	});

	// Declare each var once: a Tablet/Mobile value equal to the wider-breakpoint
	// cascade is a no-op, so only emit the device-specific deltas.
	const desktopMerged = mergeCssRulesBySelector(rulesByDevice.Desktop);
	const tabletMerged = mergeCssRulesBySelector(rulesByDevice.Tablet);
	const mobileMerged = mergeCssRulesBySelector(rulesByDevice.Mobile);

	const desktopCss = objectToCssString(desktopMerged);
	const tabletCss = wrapInMediaQuery(
		objectToCssString(dropRulesMatchingBaseline(tabletMerged, [desktopMerged])),
		TABLET_MEDIA_QUERY
	);
	const mobileCss = wrapInMediaQuery(
		objectToCssString(dropRulesMatchingBaseline(mobileMerged, [desktopMerged, tabletMerged])),
		MOBILE_MEDIA_QUERY
	);

	return `${desktopCss} ${tabletCss} ${mobileCss}`.trim();
};

export default paginationDotsDynamicCss;
