/**
 * Image dynamic-CSS concern (editor side).
 *
 * Split out of the carouselDynamicCss monolith; the composer imports these.
 * Border/radius/inner-padding values are emitted as `--wpcp-img-*` tokens via
 * the style config — the rule-string builders here are the Layer-5 remainder:
 * the algorithmic image overlay (opacity normalize/clamp + 3-selector fan-out +
 * audio style-1 gradient recipe), the image filter presets, and the responsive
 * radius/padding/margin spacing. Mirrors the PHP
 * twin in CarouselDynamicCss::base_styles / responsive_css (image branches).
 */

import { DEFAULTS, SOURCE_TYPES } from './constants';
import { spacingGenerate, resolveOverlayBg } from './cssHelpers';
import {
	hasResponsiveSpacing,
	isZeroSpacingValue,
	pushStylePropertyRuleIfDiffers,
} from './cssRuleHelpers';

const clampUnitOpacity = (opacity) => Math.min(1, Math.max(0, opacity));

const isSliderBlock = (attributes = {}) => {
	const blockName = String(attributes?.blockName || '').toLowerCase();
	return blockName === 'slider' || blockName === 'wp-carousel-pro/slider';
};

// Algorithmic transform behind the Layer-5 image-overlay builder (see
// generateImageBaseStyles): normalizes %-or-fraction input, clamps to 0..1, and
// falls back to 0.5 for unparseable values. Its PHP twin is
// CarouselDynamicCss::resolve_image_overlay_opacity.
export const resolveImageOverlayOpacity = (opacity) => {
	if (typeof opacity === 'number') {
		return clampUnitOpacity(opacity > 1 ? opacity / 100 : opacity);
	}

	if (typeof opacity === 'string' && opacity.trim() !== '') {
		const numericOpacity = parseFloat(opacity);
		return Number.isNaN(numericOpacity)
			? 0.5
			: clampUnitOpacity(numericOpacity > 1 ? numericOpacity / 100 : numericOpacity);
	}

	if (opacity && typeof opacity === 'object') {
		const rawValue = opacity.value ?? opacity?.device?.Desktop ?? opacity.Desktop;
		const rawUnit =
			opacity.unit && typeof opacity.unit === 'object'
				? opacity.unit?.Desktop ?? '%'
				: opacity.unit ?? '%';
		const numericOpacity = parseFloat(rawValue);

		if (Number.isNaN(numericOpacity)) {
			return 0.5;
		}

		return clampUnitOpacity(
			rawUnit === '%' || numericOpacity > 1 ? numericOpacity / 100 : numericOpacity
		);
	}

	return 0.5;
};

const DEFAULT_IMAGE_FILTER = {
	blur: 0,
	brightness: 1,
	contrast: 1,
	saturation: 0,
	hue: 1,
};

/** Legacy preset keys from Image panel → object filter values (keep in sync with ImageCss.php). */
const IMAGE_FILTER_PRESETS = {
	none: DEFAULT_IMAGE_FILTER,
	blur: { ...DEFAULT_IMAGE_FILTER, blur: 4 },
	brightness: { ...DEFAULT_IMAGE_FILTER, brightness: 1.25 },
	contrast: { ...DEFAULT_IMAGE_FILTER, contrast: 1.25 },
	saturate: { ...DEFAULT_IMAGE_FILTER, saturation: 1.6 },
};

const normalizeImageFilterValue = (value) => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return { ...DEFAULT_IMAGE_FILTER, ...value };
	}

	if (typeof value === 'string' && IMAGE_FILTER_PRESETS[value]) {
		return { ...IMAGE_FILTER_PRESETS[value] };
	}

	return { ...DEFAULT_IMAGE_FILTER };
};

const composeImageFilter = (filterOpts = {}) => {
	const filterValue = normalizeImageFilterValue(filterOpts);
	const parts = [];

	if (Number(filterValue.brightness) !== 1) {
		parts.push(`brightness(${Number(filterValue.brightness)})`);
	}
	if (Number(filterValue.contrast) !== 1) {
		parts.push(`contrast(${Number(filterValue.contrast)})`);
	}
	if (Number(filterValue.blur) > 0) {
		parts.push(`blur(${Number(filterValue.blur)}px)`);
	}
	if (Number(filterValue.saturation) > 0) {
		parts.push(`saturate(${Number(filterValue.saturation)})`);
	}
	if (Number(filterValue.hue) !== 1) {
		parts.push(`hue-rotate(${Number(filterValue.hue)}deg)`);
	}

	return parts.join(' ');
};

const resolveImageFilterCssValue = (value) => {
	const filterCss = composeImageFilter(value);
	return filterCss || 'none';
};

// Parse a hex / rgb() / rgba() color string to its { r, g, b, a } channels;
// null when the format is unrecognized (e.g. a named color). Twin of
// CarouselDynamicCss::parse_color_to_rgba — keep the accepted formats in sync.
const parseColorToRgba = (color) => {
	if (typeof color !== 'string') {
		return null;
	}
	const trimmed = color.trim();
	const rgbMatch = trimmed.match(
		/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
	);
	if (rgbMatch) {
		return {
			r: Number(rgbMatch[1]),
			g: Number(rgbMatch[2]),
			b: Number(rgbMatch[3]),
			a: rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1,
		};
	}
	const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/i);
	if (hexMatch) {
		let hex = hexMatch[1];
		if (hex.length === 3 || hex.length === 4) {
			hex = hex
				.split('')
				.map((channel) => channel + channel)
				.join('');
		}
		if (hex.length === 6 || hex.length === 8) {
			return {
				r: parseInt(hex.slice(0, 2), 16),
				g: parseInt(hex.slice(2, 4), 16),
				b: parseInt(hex.slice(4, 6), 16),
				a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
			};
		}
	}
	return null;
};

// Compose the animated overlay-layer tint: the Overlay Color with the Overlay
// Opacity baked into its alpha. The layer's own `opacity` property drives the
// effect reveal (fade/slide/wipe), so the tint strength must live in the color
// itself. null when the color can't be parsed — the caller falls back to the
// raw color. Twin of CarouselDynamicCss::compose_overlay_anim_tint.
export const composeOverlayAnimTint = (color, opacity) => {
	const parsed = parseColorToRgba(color);
	if (!parsed) {
		return null;
	}
	const finalAlpha = clampUnitOpacity(parsed.a * resolveImageOverlayOpacity(opacity));
	return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${finalAlpha.toFixed(3)})`;
};

export const generateImageBaseStyles = (selectors, imageOptions, attributes = {}) => {
	const rules = [];
	const {
		imageOverlayBefore,
		imageOverlayBeforeHover,
		imageOverlayBeforeSocialHover,
		audioStyle1Overlay,
		wrapper,
	} = selectors;

	// Image border (style/width/color + color-hover) is emitted as --wpcp-img-border-*
	// tokens via the style config; the static stylesheet consumes them. See
	// config/style-config.js and the `.wpcp-item-media` border rule in style.scss.

	// Layer-5 (algorithmic) remainder — kept as a rule-string builder, NOT
	// tokenized: the opacity is resolved algorithmically (resolveImageOverlayOpacity:
	// %-or-fraction normalize + clamp + 0.5 fallback) and the color fans out to
	// two selectors, one of which (audio style-1) is a conditional gradient recipe
	// that only exists when overlayColor is set. Gated by CSS-string css-parity
	// against its PHP twin (CarouselDynamicCss::base_styles), not the value-map.
	if (imageOptions?.overlay) {
		// Overlay tint is a Background picker: solid color or gradient. Legacy
		// posts store a bare solid string; resolveOverlayBg maps both forms to the
		// CSS property + value to emit (background-color for solid — identical to
		// the legacy path — or `background` for a gradient).
		const normalBg = resolveOverlayBg(imageOptions.overlayColor, DEFAULTS.colors.overlay);
		const hoverBg = resolveOverlayBg(imageOptions.overlayColorHover, DEFAULTS.colors.overlay);
		const imageOverlayOpacity = resolveImageOverlayOpacity(imageOptions.opacity);
		const overlayOpacityHover = resolveImageOverlayOpacity(imageOptions.opacityHover);
		if (normalBg.css) {
			pushStylePropertyRuleIfDiffers(rules, imageOverlayBefore, normalBg.prop, normalBg.css);
		}
		pushStylePropertyRuleIfDiffers(rules, imageOverlayBefore, 'opacity', imageOverlayOpacity);
		// Feed the overlay tint to the animated overlay-effect layer. An Overlay
		// Effect (Hover Animations panel) is a hover reveal: the static `::before`
		// tint is suppressed (see _hover-anim-library.scss) and `.wpcp-overlay-anim-layer`
		// owns the tint via this var. Source it from the HOVER overlay state (the
		// reveal destination) — sourcing Normal would leave the layer transparent
		// whenever the overlay is a hover-only darken (Normal opacity 0). The layer's
		// own `opacity` drives the effect reveal, so the tint strength can't live
		// there; the layer's `::before` carries the background and reads
		// `--wpcp-overlay-anim-tint-opacity` for its strength. A solid tint bakes the
		// opacity into the rgba alpha (and leaves the var at its 1 default); a gradient
		// can't be alpha-baked, so it ships the raw gradient and drives strength via
		// the tint-opacity var instead. The var is formatted to 3 decimals — mirroring
		// the solid alpha-bake's toFixed(3) — so a fractional opacity (33.3%) stringifies
		// identically JS↔PHP (raw String() would emit 0.33299999999999996 here vs 0.333
		// in PHP). Twin of ImageCss::image_base_styles.
		const animSourceColor = hoverBg.style === 'solid' ? hoverBg.css : '';
		const overlayAnimTint =
			(animSourceColor && composeOverlayAnimTint(animSourceColor, imageOptions.opacityHover)) ||
			hoverBg.css;
		pushStylePropertyRuleIfDiffers(rules, wrapper, '--wpcp-overlay-anim-color', overlayAnimTint);
		if ('gradient' === hoverBg.style && hoverBg.css) {
			pushStylePropertyRuleIfDiffers(
				rules,
				wrapper,
				'--wpcp-overlay-anim-tint-opacity',
				overlayOpacityHover.toFixed(3)
			);
		}
		// Audio style-1 carries a bottom-up darkening gradient built from the solid
		// overlay color; a gradient overlay has no single color to interpolate.
		if (normalBg.style === 'solid' && normalBg.solid) {
			pushStylePropertyRuleIfDiffers(
				rules,
				audioStyle1Overlay,
				'background',
				`linear-gradient(180deg, rgba(0, 0, 0, 0) 33%, ${normalBg.solid} 100%)`
			);
		}

		// Hover state: overlay color/opacity switch with the Image > Style Normal/Hover
		// tab. Emit a `.wpcp-item:hover`-scoped override only for the value(s) that
		// differ from the normal state, so a smooth hover transition reveals them and
		// untouched defaults add no CSS. Mirrors CarouselDynamicCss image-overlay hover.
		const overlayColorChanged = hoverBg.css !== normalBg.css || hoverBg.prop !== normalBg.prop;
		const overlayOpacityChanged = overlayOpacityHover !== imageOverlayOpacity;
		if ((overlayColorChanged || overlayOpacityChanged) && !isSliderBlock(attributes)) {
			const hoverStyles = {};
			if (overlayColorChanged && hoverBg.css) {
				hoverStyles[hoverBg.prop] = hoverBg.css;
			}
			if (overlayOpacityChanged) {
				hoverStyles.opacity = overlayOpacityHover;
			}
			if (Object.keys(hoverStyles).length) {
				rules.push({ class: imageOverlayBeforeHover, styles: hoverStyles });
			}

			// Social-share items restore the NORMAL tint while their parent hovers.
			const socialHoverStyles = {};
			if (overlayColorChanged && normalBg.css) {
				socialHoverStyles[normalBg.prop] = normalBg.css;
			}
			if (overlayOpacityChanged) {
				socialHoverStyles.opacity = imageOverlayOpacity;
			}
			if (Object.keys(socialHoverStyles).length) {
				rules.push({ class: imageOverlayBeforeSocialHover, styles: socialHoverStyles });
			}
		}
	}

	const filterNormal = imageOptions?.filterNormal ?? 'none';
	const filterHover = imageOptions?.filterHover ?? 'none';
	const normalCss = resolveImageFilterCssValue(filterNormal);
	const hoverCss = resolveImageFilterCssValue(filterHover);
	if ('none' !== normalCss || 'none' !== hoverCss) {
		const samePreset = normalCss === hoverCss;
		const imgFilterTargets = `${wrapper} .wpcp-item-img, ${wrapper} .wpcp-item-placeholder`;
		const imgFilterHoverTargets = `${wrapper} .wpcp-item:hover .wpcp-item-img, ${wrapper} .wpcp-item:hover .wpcp-item-placeholder`;

		const baseImgStyles = {
			filter: normalCss,
			WebkitFilter: normalCss,
		};
		rules.push({ class: imgFilterTargets, styles: baseImgStyles });

		if (!samePreset) {
			rules.push({
				class: imgFilterHoverTargets,
				styles: { filter: hoverCss, WebkitFilter: hoverCss },
			});
		}
	}

	return rules;
};

export const generateImageResponsiveRules = (selectors, imageOptions, device) => {
	const rules = [];
	const { media, img } = selectors;

	if (imageOptions?.borderRadius && hasResponsiveSpacing(imageOptions.borderRadius)) {
		// Border-radius takes four distinct corners — emit all sides (true drops three).
		const brCss = spacingGenerate(imageOptions.borderRadius, device, false);
		if (brCss && !isZeroSpacingValue(brCss)) {
			pushStylePropertyRuleIfDiffers(rules, media, 'border-radius', brCss);
			pushStylePropertyRuleIfDiffers(rules, media, 'overflow', 'hidden');
		}
	}

	// Inner padding on <img> only when explicitly set; outer `padding` stays on `.wpcp-item-media`
	// so border-radius and border (on the media box) stay visually consistent.
	if (imageOptions?.innerPadding && hasResponsiveSpacing(imageOptions.innerPadding)) {
		const innerPaddingCss = spacingGenerate(imageOptions.innerPadding, device);
		if (!isZeroSpacingValue(innerPaddingCss)) {
			pushStylePropertyRuleIfDiffers(rules, img, 'padding', innerPaddingCss);
		}
	}

	// if (imageOptions?.padding && hasResponsiveSpacing(imageOptions.padding)) {
	// 	const contentOrientation = resolveContentOrientation(
	// 		sourceType,
	// 		attributes?.layoutOptions?.contentOrientation,
	// 		{ blockName: attributes?.blockName }
	// 	);
	// 	const overlayPaddingSides = getDeviceSpacingSides(imageOptions.padding, device);

	// 	if (
	// 		overlayPaddingSides &&
	// 		['overlay', 'diagonal'].includes(contentOrientation)
	// 	) {
	// 		// Overlay/Diagonal: the Image panel padding insets the content box from the
	// 		// image/item edge. Emit it as per-side MARGIN, not padding, so it stays
	// 		// orthogonal to the content-area padding — that inner padding is emitted
	// 		// separately onto the same element (generateCardResponsiveRules); padding
	// 		// here would clobber it, margin offsets the whole box instead.
	// 		const { unit, top, right, bottom, left } = overlayPaddingSides;

	// 		rules.push({
	// 			class: getContentAreaPaddingSelector(selectors, attributes),
	// 			styles: {
	// 				'margin-top': `${top}${unit}`,
	// 				'margin-right': `${right}${unit}`,
	// 				'margin-bottom': `${bottom}${unit}`,
	// 				'margin-left': `${left}${unit}`,
	// 			},
	// 		});
	// 	} else {
	// 		const padding = spacingGenerate(imageOptions.padding, device);
	// 		const aspect = resolveOuterMediaAspect(sourceType, imageOptions);
	// 		if (aspect !== 'original') {
	// 			const parts = padding.split(' ');
	// 			if (parts.length === 4) {
	// 				pushStylePropertyRuleIfDiffers(rules, media, 'padding-right', parts[1]);
	// 				pushStylePropertyRuleIfDiffers(rules, media, 'padding-bottom', parts[2]);
	// 				pushStylePropertyRuleIfDiffers(rules, media, 'padding-left', parts[3]);
	// 			}
	// 			pushStylePropertyRuleIfDiffers(rules, audioMedia, 'padding', padding);
	// 		} else {
	// 			pushStylePropertyRuleIfDiffers(rules, media, 'padding', padding);
	// 		}
	// 	}
	// }

	if (imageOptions?.margin && hasResponsiveSpacing(imageOptions.margin)) {
		const marginCss = spacingGenerate(imageOptions.margin, device);
		if (!isZeroSpacingValue(marginCss)) {
			pushStylePropertyRuleIfDiffers(rules, media, 'margin', marginCss);
		}
	}

	return rules;
};

export const getEffectiveImageOptions = (attributes = {}) => {
	if ((attributes?.sourceType || SOURCE_TYPES.IMAGE) === SOURCE_TYPES.AUDIO) {
		return attributes?.audioOptions?.imageOptions || attributes?.imageOptions || {};
	}
	return attributes?.imageOptions || {};
};
