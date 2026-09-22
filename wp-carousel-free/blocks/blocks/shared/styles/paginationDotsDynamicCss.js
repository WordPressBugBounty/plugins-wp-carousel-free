/**
 * Slide-bullet pagination dynamic CSS generator.
 *
 * Token bag (`--wpcp-pag-*`) is config-driven via emitTokens; top/margin stay as
 * a thin Layer-5 remainder (direct properties, not CSS variables).
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
	const unit =
		typeof unitRaw === 'object' && unitRaw !== null
			? getDeviceValue(unitRaw, device, 'px')
			: unitRaw || 'px';
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
 * Layer-5 direct properties (not tokenized): top offset + margin.
 *
 * @param {Object} pag    - Pagination dots options.
 * @param {string} device - Device key (Desktop, Tablet, Mobile).
 * @return {Object} Per-device CSS property map (top/margin).
 */
const paginationLayoutProps = (pag, device) => {
	const props = {};
	const style = pag?.paginationStyle || 'dots';

	if (style !== 'scrollbar' && pag?.verticalPos === 'top') {
		const verticalOffset = clamp(
			getDeviceValue(pag?.verticalPosition?.device, device, 30),
			-200,
			400,
			30
		);
		const verticalOffsetUnit = getDeviceValue(pag?.verticalPosition?.unit, device, 'px');
		props.top = `${verticalOffset}${verticalOffsetUnit}`;
	}

	const margin = getSpacingDevice(pag?.margin, device);
	if (margin && (margin.top || margin.right || margin.bottom || margin.left)) {
		props.margin = `${margin.top}${margin.unit} ${margin.right}${margin.unit} ${margin.bottom}${margin.unit} ${margin.left}${margin.unit}`;
	}

	return props;
};

const paginationDotsDynamicCss = (blockUniqueId, paginationDotsOptions) => {
	if (!blockUniqueId || !paginationDotsOptions) {
		return '';
	}

	const attributes = { paginationDotsOptions };
	const tokenBags = emitTokens(paginationStyleConfig, attributes);
	const baseSelector = `#${blockUniqueId} .wpcp-pagination.swiper-pagination`;

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
