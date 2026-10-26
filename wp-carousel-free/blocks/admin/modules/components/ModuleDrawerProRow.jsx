/**
 * Pro rows in a Free drawer are a picture of the Pro control, never the control.
 * Nothing here holds state, writes a draft key, or reaches a save path.
 *
 * Presentation follows the inspector's Content Position row: dimmed title, a
 * green "(Pro)" tag, and either a static BorderIcon or a popup that
 * holds an inert picture of the Pro sub-panel.
 */
import { __ } from '@wordpress/i18n';
import Popup from '@wp-carousel-pro/components/popup/popup';
import { BorderIcon } from '../../../icons/icons';
import ModuleDrawerProNote from './ModuleDrawerProNote';

/**
 * @param {Object}                    props
 * @param {string}                    props.title
 * @param {string}                    [props.className] Extra row modifier class.
 * @param {import('react').ReactNode} props.children    Inert stand-in for the Pro control.
 */
function ModuleDrawerProRow({ title, className = '', children }) {
	const tag = __('(Pro)', 'wp-carousel-free');

	return (
		<div
			className={`wpcp-module-drawer-row wpcp-module-drawer-row--pro${
				className ? ` ${className}` : ''
			}`}
		>
			<div className="wpcp-module-drawer-row-text">
				<h4 className="wpcp-module-drawer-row-title">
					<span className="wpcp-module-drawer-pro-title">{title}</span>
					<span className="wpcp-module-drawer-pro-tag">{tag}</span>
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
 */
export function ModuleDrawerProToggleRow({ title }) {
	return (
		<ModuleDrawerProRow title={title}>
			<span className="wpcpf-module-toggle wpcp-module-drawer-pro-toggle" aria-hidden="true">
				<span className="wpcpf-module-toggle-slider" />
			</span>
		</ModuleDrawerProRow>
	);
}

/**
 * Inert popup body: the showcase is visible but unreachable; only the upgrade note is live.
 *
 * @param {Object}                    props
 * @param {string}                    [props.upgradeUrl]
 * @param {import('react').ReactNode} props.children
 */
function ProPopupBody({ upgradeUrl = '', children }) {
	return (
		<div className="wpcp-module-drawer-pro-popup">
			<div className="wpcp-module-drawer-pro-popup__body" inert="">
				{children}
			</div>
			<ModuleDrawerProNote
				text={__('These options are available in Pro.', 'wp-carousel-free')}
				href={upgradeUrl}
			/>
		</div>
	);
}

/**
 * Popup-shaped Pro row. With children, the trigger opens a read-only picture of
 * the Pro sub-panel; without, it is a display-only glyph that opens nothing.
 *
 * @param {Object}                    props
 * @param {string}                    props.title
 * @param {string}                    [props.upgradeUrl]
 * @param {import('react').ReactNode} [props.children]   Showcase of the Pro sub-panel.
 */
export function ModuleDrawerProPopupRow({ title, upgradeUrl, children }) {
	if (children) {
		return (
			<ModuleDrawerProRow
				title={title}
				className="wpcp-module-drawer-row--pro-popup"
			>
				<Popup label="" divClassName="wpcp-module-drawer-popup">
					<ProPopupBody upgradeUrl={upgradeUrl}>{children}</ProPopupBody>
				</Popup>
			</ModuleDrawerProRow>
		);
	}

	return (
		<ModuleDrawerProRow title={title}>
			<span className="wpcp-module-drawer-pro-static-icon" aria-hidden="true">
				<BorderIcon />
			</span>
		</ModuleDrawerProRow>
	);
}
