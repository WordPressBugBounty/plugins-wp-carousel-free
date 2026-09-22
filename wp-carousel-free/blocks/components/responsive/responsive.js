import { Button } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import './editor.scss';
import { DesktopIcon, MobileIcon, TabletIcon } from './icon';
import { useDeviceType } from '../../controls/controls';
import { useModuleDeviceTypeContext } from '../../controls/moduleDeviceTypeContext';

const Responsive = () => {
	const moduleDevice = useModuleDeviceTypeContext();

	const Device = (e) => {
		const nextDevice = e.target.closest('button').value;
		if (moduleDevice?.setDeviceType) {
			moduleDevice.setDeviceType(nextDevice);
			return;
		}
		const canvas = document.getElementsByClassName('edit-site-visual-editor__editor-canvas');
		if (canvas.length > 0) {
			dispatch('core/edit-site').__experimentalSetPreviewDeviceType(nextDevice);
		} else {
			dispatch('core/edit-post').__experimentalSetPreviewDeviceType(nextDevice);
		}
	};

	const deviceType = useDeviceType();

	const DeviceIcon = () => {
		if ('Desktop' === deviceType) {
			return <DesktopIcon />;
		}
		if ('Tablet' === deviceType) {
			return <TabletIcon />;
		}
		if ('Mobile' === deviceType) {
			return <MobileIcon />;
		}
	};

	return (
		<>
			<div className="wpcp-responsive">
				<div className="wpcp-units">
					<span aria-label="Change device preview">
						<DeviceIcon />
					</span>
					<div className="wpcp-units-btn">
						<Button
							aria-label="Switch to desktop view"
							className={deviceType === 'Desktop' ? 'active' : ''}
							value={'Desktop'}
							onClick={Device}
						>
							<DesktopIcon />
						</Button>
						<Button
							aria-label="Switch to tablet view"
							className={deviceType === 'Tablet' ? 'active' : ''}
							value={'Tablet'}
							onClick={Device}
						>
							<TabletIcon />
						</Button>
						<Button
							aria-label="Switch to mobile view"
							className={deviceType === 'Mobile' ? 'active' : ''}
							value={'Mobile'}
							onClick={Device}
						>
							<MobileIcon />
						</Button>
					</div>
				</div>
			</div>
		</>
	);
};

export default Responsive;
