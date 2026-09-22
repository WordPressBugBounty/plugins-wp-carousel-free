/**
 * Pro rows in a Free drawer are a picture of the Pro control, never the control.
 * Nothing here holds state, writes a draft key, or reaches a save path.
 *
 * Presentation follows the inspector's Content Position row: dimmed title, a
 * green "(Pro)" link to pricing, and a static BorderIcon in place of the live
 * popup trigger.
 */
import { __ } from '@wordpress/i18n';
import { BorderIcon } from '../../../icons/icons';

/**
 * @param {Object}                    props
 * @param {string}                    props.title
 * @param {string}                    [props.upgradeUrl]
 * @param {import('react').ReactNode} props.children     Inert stand-in for the Pro control.
 */
function ModuleDrawerProRow({ title, upgradeUrl = '', children }) {
	const tag = __('(Pro)', 'wp-carousel-free');

	return (
		<div className="wpcp-module-drawer-row wpcp-module-drawer-row--pro">
			<div className="wpcp-module-drawer-row-text">
				<h4 className="wpcp-module-drawer-row-title">
					<span className="wpcp-module-drawer-pro-title">{title}</span>
					{upgradeUrl ? (
						<a
							className="wpcp-module-drawer-pro-tag"
							href={upgradeUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							{tag}
						</a>
					) : (
						<span className="wpcp-module-drawer-pro-tag">{tag}</span>
					)}
				</h4>
			</div>
			<div className="wpcp-module-drawer-row-control">{children}</div>
		</div>
	);
}

/**
 * Toggle-shaped Pro row: always off, always inert.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.upgradeUrl]
 */
export function ModuleDrawerProToggleRow({ title, upgradeUrl }) {
	return (
		<ModuleDrawerProRow title={title} upgradeUrl={upgradeUrl}>
			<span className="wpcpf-module-toggle wpcp-module-drawer-pro-toggle" aria-hidden="true">
				<span className="wpcpf-module-toggle-slider" />
			</span>
		</ModuleDrawerProRow>
	);
}

/**
 * Popup-shaped Pro row: the trigger is a display-only glyph that opens nothing,
 * so the Pro sub-panel it would have opened need not exist.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.upgradeUrl]
 */
export function ModuleDrawerProPopupRow({ title, upgradeUrl }) {
	return (
		<ModuleDrawerProRow title={title} upgradeUrl={upgradeUrl}>
			<span className="wpcp-module-drawer-pro-static-icon" aria-hidden="true">
				<BorderIcon />
			</span>
		</ModuleDrawerProRow>
	);
}
