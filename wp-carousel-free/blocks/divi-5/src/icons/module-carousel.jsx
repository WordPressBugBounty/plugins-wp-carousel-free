/**
 * WP Carousel mark for the Divi 5 module library.
 *
 * Divi 5 does not read the PHP `et_builder_module_icons` filter — that is the
 * Divi 4 path (`ET_Builder_Element::get_module_icons()`). A D5 module names its
 * icon with `moduleIcon` in module.json and Divi resolves that name against a JS
 * registry, so the same mark ships a second time as a React component here.
 *
 * Divi supplies the <svg> wrapper and fills it from its own CSS, so this exports
 * the bare path with the viewport handed over separately — no <svg> root, no
 * width/height, no fill.
 *
 * The module list forces a `0 0 16 16` viewport that overrides the icon's own
 * viewBox, while the artwork spans 1285×1000. The <g> maps that box into the
 * 16×16 grid, vertically centred, so the path stays byte-identical to the
 * `src/Admin/PageBuilders/Divi/icon.svg` the Divi 4 module reads.
 */

const React = window?.vendor?.React;

/**
 * Icon name — the value module.json's `moduleIcon` points at.
 *
 * @type {string}
 */
export const name = 'wpcp/module-carousel';

/**
 * Viewport Divi puts on the <svg> it wraps around the artwork.
 *
 * @type {string}
 */
export const viewBox = '0 0 16 16';

/**
 * Icon artwork, without the <svg> wrapper Divi supplies.
 *
 * @return {Object} React element.
 */
export const component = () => (
	<g transform="translate(0 1.774) scale(0.0124514)">
		<path
			transform="translate(0,850) scale(1,-1)"
			d="M1285-150h-1285v1000h1285v-1000z m-1140 145h995v710h-995v-710z m872 336l-149-149c-11-11-28-11-38 0l-25 25c-10 10-10 27 0 37l106 106-106 106c-10 10-10 27 0 37l25 25c10 11 27 11 37 0l150-149c11-11 11-27 0-38z m-749 38l150 149c10 11 27 11 37 0l25-24c10-11 10-27 0-38l-106-106 106-106c10-10 10-27 0-37l-25-25c-10-11-27-11-37 0l-150 149c-10 11-10 27 0 38z"
		/>
	</g>
);
