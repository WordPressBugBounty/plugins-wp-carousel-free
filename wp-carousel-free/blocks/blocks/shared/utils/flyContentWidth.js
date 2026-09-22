/**
 * Fly-content bubble width is relative to the hovered ITEM, not the block.
 *
 * The floating bubble is mounted at `.wpcp-block-inner` scope (outside the
 * Swiper clip), so a CSS percentage there would resolve against the whole
 * block. To make "60%" mean 60% of the slide, the width is resolved at runtime
 * from the hovered item's measured width. Editor-only here: Fly Content is
 * reachable only from a Pro editor preview, which has no PHP renderer and no
 * frontend runtime to mirror.
 */

const ALLOWED_UNITS = ['%', 'px', 'em'];

/**
 * Resolve the author-facing width spec (e.g. `60%`, `320px`). Defaults to the
 * `60%` item-relative default unless the width control was customized.
 *
 * @param {Object} contentOptions Block `contentOptions` attribute.
 * @return {string} Width spec including unit.
 */
export const resolveFlyWidthSpec = (contentOptions = {}) => {
	if (contentOptions?.contentBoxWidthCustomized !== true) {
		return '60%';
	}

	const contentBoxWidth = contentOptions?.contentBoxWidth || {};
	const value = contentBoxWidth?.device?.Desktop;
	let unit = contentBoxWidth?.unit?.Desktop || '%';

	if (value === '' || value === null || value === undefined) {
		return '60%';
	}
	const numeric = Number(value);
	if (Number.isNaN(numeric) || numeric < 0) {
		return '60%';
	}
	if (!ALLOWED_UNITS.includes(unit)) {
		unit = '%';
	}

	return `${numeric}${unit}`;
};

/**
 * Apply a width spec against a measured item width. Percentages resolve to a
 * pixel width relative to the item; absolute units (px/em) pass through.
 *
 * @param {string} spec      Width spec from {@link resolveFlyWidthSpec}.
 * @param {number} itemWidth Measured item width in px.
 * @return {string} CSS width value, or '' when it cannot be resolved.
 */
export const flyWidthFromItem = (spec, itemWidth) => {
	if (typeof spec !== 'string' || spec === '') {
		return '';
	}
	if (spec.trim().endsWith('%')) {
		const percent = parseFloat(spec);
		if (!Number.isNaN(percent) && itemWidth > 0) {
			return `${(percent / 100) * itemWidth}px`;
		}
		return '';
	}
	return spec;
};
