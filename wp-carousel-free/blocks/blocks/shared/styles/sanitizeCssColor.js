/**
 * CSS color sanitizer — mirrors {@see Css_Helpers::sanitize_color()} on the PHP side.
 *
 * Accepts hex, rgb/rgba, hsl/hsla, transparent, and currentColor; returns null
 * for anything else (including named keywords and injection payloads).
 */

const clamp255 = (n) => Math.min(255, Math.max(0, Number(n)));

/**
 * @param {*} raw Raw color value from block attributes.
 * @return {string|null} Safe CSS color, or null when invalid / empty.
 */
export const sanitizeCssColor = (raw) => {
	if (raw === null || raw === undefined) {
		return null;
	}
	const value = String(raw).trim();
	if (value === '') {
		return null;
	}
	const lower = value.toLowerCase();
	if (lower === 'transparent') {
		return 'transparent';
	}
	if (lower === 'currentcolor') {
		return 'currentColor';
	}

	// 3-, 4-, 6-, or 8-digit hex.
	if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
		return value;
	}

	const rgbMatch = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
	if (rgbMatch) {
		const red = clamp255(rgbMatch[1]);
		const green = clamp255(rgbMatch[2]);
		const blue = clamp255(rgbMatch[3]);
		if (red > 255 || green > 255 || blue > 255) {
			return null;
		}
		return `rgb(${red},${green},${blue})`;
	}

	const rgbaMatch = value.match(
		/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1(?:\.0+)?|0?\.\d+)\s*\)$/i
	);
	if (rgbaMatch) {
		const red = clamp255(rgbaMatch[1]);
		const green = clamp255(rgbaMatch[2]);
		const blue = clamp255(rgbaMatch[3]);
		if (red > 255 || green > 255 || blue > 255) {
			return null;
		}
		return `rgba(${red},${green},${blue},${rgbaMatch[4]})`;
	}

	const hslMatch = value.match(/^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i);
	if (hslMatch) {
		const hue = Number(hslMatch[1]);
		const saturation = Number(hslMatch[2]);
		const lightness = Number(hslMatch[3]);
		if (hue > 360 || saturation > 100 || lightness > 100) {
			return null;
		}
		return `hsl(${hue},${saturation}%,${lightness}%)`;
	}

	const hslaMatch = value.match(
		/^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(0|1(?:\.0+)?|0?\.\d+)\s*\)$/i
	);
	if (hslaMatch) {
		const hue = Number(hslaMatch[1]);
		const saturation = Number(hslaMatch[2]);
		const lightness = Number(hslaMatch[3]);
		if (hue > 360 || saturation > 100 || lightness > 100) {
			return null;
		}
		return `hsla(${hue},${saturation}%,${lightness}%,${hslaMatch[4]})`;
	}

	return null;
};
