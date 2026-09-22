/**
 * Button Style popover container-routing for the image family + product.
 *
 * The shared button-style body (`ButtonStylePopup`) retargets its write
 * container through the `styleOptions` / `onStyleOptionsChange` buffer rather
 * than writing a fixed container — this indirection IS the button source
 * routing:
 *   - image   → buffer writes `contentOptions`
 *   - product → NO buffer; the body writes `productContentOptions` directly (a
 *               button style set on an image must never leak into
 *               `productContentOptions`).
 *
 * Kept here (not inline in the JSX) so the routing contract is unit-testable
 * without rendering the component tree.
 */

/**
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Gutenberg setter.
 * @return {Object} Props for the shared button-style body (with the buffer for
 *   image; bare for product).
 */
export function resolveSharedButtonProps(attributes, setAttributes) {
	const sourceType = attributes?.sourceType || 'image';

	if ('product' === sourceType) {
		return { attributes, setAttributes };
	}

	const co = attributes.contentOptions || {};

	return {
		attributes,
		setAttributes,
		styleOptions: co,
		onStyleOptionsChange: (nextStyleOptions) =>
			setAttributes({ contentOptions: { ...co, ...nextStyleOptions } }),
	};
}
