/**
 * Lightbox Slider Settings and Lightbox Toolbar are Pro. These panels are a picture of
 * Pro's popups, not a copy of them — no state, no handlers, no option key, no save path.
 * `ModuleDrawerProPopupRow` renders them inside an `inert` wrapper, so the no-op
 * callbacks below are never reached.
 */
import { __ } from '@wordpress/i18n';
import { DrawerToggleSwitch } from '../components/DrawerWpControlFields';

const noop = () => {};

/**
 * @param {Object}  props
 * @param {string}  props.label
 * @param {boolean} [props.checked] Pro's default for the option.
 */
const ShowcaseToggleRow = ({ label, checked = false }) => (
	<div className="wpcp-drawer-toggle-row">
		<span className="wpcp-drawer-toggle-row__label">{label}</span>
		<DrawerToggleSwitch label={label} checked={checked} onChange={noop} />
	</div>
);

export function LightboxSliderShowcasePanel() {
	return (
		<div className="wpcp-lightbox-slider-panel">
			<ShowcaseToggleRow label={__('AutoPlay', 'wp-carousel-free')} />
			<ShowcaseToggleRow label={__('Loop', 'wp-carousel-free')} checked />
			<ShowcaseToggleRow label={__('Keyboard Navigation', 'wp-carousel-free')} checked />
			<ShowcaseToggleRow label={__('Right Click Protection', 'wp-carousel-free')} />
		</div>
	);
}

export function LightboxToolbarShowcasePanel() {
	return (
		<div className="wpcp-lightbox-toolbar-panel">
			<ShowcaseToggleRow label={__('Zoom Button', 'wp-carousel-free')} />
			<ShowcaseToggleRow label={__('Full-Screen Button', 'wp-carousel-free')} />
			<ShowcaseToggleRow label={__('Slideshow Play Button', 'wp-carousel-free')} />
			<ShowcaseToggleRow label={__('Social Share Button', 'wp-carousel-free')} />
			<ShowcaseToggleRow label={__('Download Button', 'wp-carousel-free')} />
			<ShowcaseToggleRow label={__('Bottom Thumbnails Gallery Icon', 'wp-carousel-free')} />
			<ShowcaseToggleRow label={__('Close Button', 'wp-carousel-free')} checked />
		</div>
	);
}
