/**
 * Editor-level host for the Pro upgrade dialog, registered as an editor
 * plugin so the dialog outlives the Pro block that opened it.
 */

import { useEffect, useState } from '@wordpress/element';
import { getPlugin, registerPlugin } from '@wordpress/plugins';
import ProUpgradeDialog from './ProUpgradeDialog';
import { setProUpgradeOpener } from './openerRegistry';

export const PRO_UPGRADE_PLUGIN = 'wpcp-pro-upgrade-dialog';

/**
 * Holds the open request and renders the dialog while there is one.
 *
 * @return {?JSX.Element} Dialog, or nothing while closed.
 */
export function ProUpgradeDialogHost() {
	const [request, setRequest] = useState(null);

	useEffect(() => setProUpgradeOpener((options = {}) => setRequest(options)), []);

	if (!request) {
		return null;
	}

	return <ProUpgradeDialog blockName={request.blockName} onClose={() => setRequest(null)} />;
}

/**
 * Register the host. Safe to call more than once.
 *
 * @return {void}
 */
export function registerProUpgradeDialog() {
	if (getPlugin(PRO_UPGRADE_PLUGIN)) {
		return;
	}

	registerPlugin(PRO_UPGRADE_PLUGIN, { render: ProUpgradeDialogHost });
}
