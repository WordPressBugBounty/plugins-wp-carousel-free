import Popup from '@wp-carousel-pro/components/popup/popup';
import ModuleDrawerRow from './ModuleDrawerRow';

/**
 * Drawer row with a settings popup trigger on the right (Figma pattern).
 *
 * @param {Object}                    props
 * @param {string}                    props.title
 * @param {string}                    [props.infoTip]
 * @param {string}                    [props.className]
 * @param {import('react').ReactNode} props.children
 */
export default function ModuleDrawerPopupRow({ title, infoTip, className = '', children }) {
	return (
		<ModuleDrawerRow title={title} infoTip={infoTip} className={className}>
			<Popup label="" divClassName="wpcp-module-drawer-popup">
				{children}
			</Popup>
		</ModuleDrawerRow>
	);
}
