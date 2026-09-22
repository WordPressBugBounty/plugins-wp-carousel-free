/**
 * Build the React inline-style props that pin an image's focal point.
 *
 * Focal/scale only — callers merge with base `imgStyle` in `CarouselItem.jsx`.
 * On the server, `BlockRenderer::build_item_focal_style_attr()` emits the same
 * `object-fit` / `object-position` pair on the `<img>` (no absolute fill, so
 * the flex-based `.wpcp-item-media` layout keeps a height).
 *
 * Returns an empty object when neither `scale` nor `position` is valid —
 * callers can spread the result without leaking style keys onto items
 * that have never been edited (keeps legacy markup identical).
 *
 * @param {Object} item Normalised carousel item.
 * @return {{objectFit?: string, objectPosition?: string}} Style props to spread onto the `<img>`.
 */
export function getImageFocalPointStyle(item) {
	const style = {};
	if (!item || typeof item !== 'object') {
		return style;
	}

	const scale = item.scale;
	if (typeof scale === 'string' && ['cover', 'contain', 'fill'].includes(scale)) {
		style.objectFit = scale;
	}

	// `object-position` is meaningless under `object-fit: fill` (the image is
	// stretched to both edges, leaving no overflow to position), so skip it —
	// mirrors ItemRenderer::build_item_focal_style_attr() on the server.
	const position = item.position;
	if (scale !== 'fill' && position && typeof position === 'object') {
		const left = Number(position.left);
		const top = Number(position.top);
		if (Number.isFinite(left) && Number.isFinite(top)) {
			const clampedLeft = Math.max(0, Math.min(100, left));
			const clampedTop = Math.max(0, Math.min(100, top));
			style.objectPosition = `${formatAxis(clampedLeft)}% ${formatAxis(clampedTop)}%`;
		}
	}

	return style;
}

function formatAxis(value) {
	// Match PHP's number_format(2) + rtrim('0').rtrim('.') so 50 stays "50".
	const rounded = Math.round(value * 100) / 100;
	return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}
