import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { getModuleInfo } from '../../pages/modules/module-data';
import { toastSuccessMsg, toastErrorMsg } from '../../functions';
import ProIcon from '../../../components/pro/proIcon';

/**
 * Modules step. A Free module gets a working toggle; a Pro module gets the PRO
 * badge in its place and no control at all, so there is nothing to switch and
 * nothing to post. Unreleased modules are left out entirely.
 *
 * @param {Object}   props
 * @param {Array}    props.modulesOptions Registry rows from the server.
 * @param {Function} props.saveOptions    Dashboard save helper.
 */
export default function ModulesPage({ modulesOptions, saveOptions }) {
	const [saving, setSaving] = useState(false);

	const list = (modulesOptions || []).filter((item) => 'upcoming' !== item.status);

	const handleChange = (moduleName) => {
		setSaving(true);
		const message = list.find((item) => item.module_name === moduleName)?.show
			? __('Module disabled successfully.', 'wp-carousel-free')
			: __('Module enabled successfully.', 'wp-carousel-free');

		// Pro rows are dropped rather than echoed back: the server's slug
		// allow-list rejects them anyway, same as the dashboard's Modules page.
		const updated = list
			.filter((item) => !item.isPro)
			.map((item) => (item.module_name === moduleName ? { ...item, show: !item.show } : item));

		saveOptions({ modulesOptions: updated })
			.then(() => {
				setSaving(false);
				toastSuccessMsg(message);
			})
			.catch(() => {
				setSaving(false);
				toastErrorMsg(__('Something went wrong', 'wp-carousel-free'));
			});
	};

	return (
		<div className="wpcpf-sw-content-card wpcpf-sw-modules-page">
			<div className="wpcpf-sw-modules-header">
				<h2 className="wpcpf-sw-modules-title">
					{__('Enable the Modules You Need', 'wp-carousel-free')}
				</h2>
				<p className="wpcpf-sw-modules-description">
					{__(
						'Unlock powerful features to enhance your showcases — fully customizable anytime.',
						'wp-carousel-free'
					)}
				</p>
			</div>

			<div className="wpcpf-sw-modules-grid">
				{list.map((item) => {
					const moduleInfo = getModuleInfo(item.module_name);
					const isPro = !!item.isPro;
					const title = moduleInfo.title || item.title || item.module_name;

					return (
						<div
							key={item.module_name}
							className={`wpcpf-sw-module-card${isPro ? ' wpcpf-sw-module-card--pro' : ''}`}
						>
							<div className="wpcpf-sw-module-card-inner">
								<div className="wpcpf-sw-module-icon" style={{ backgroundImage: moduleInfo.gradient }}>
									{moduleInfo.icon}
								</div>

								<div className="wpcpf-sw-module-title">
									<span>{title}</span>
								</div>

								{isPro ? (
									<span className="wpcpf-module-pro-badge">
										<ProIcon width={12} height={12} />
										{__('PRO', 'wp-carousel-free')}
									</span>
								) : (
									<label
										className="wpcpf-sw-module-toggle"
										htmlFor={`wpcpf-sw-module-toggle-${item.module_name}`}
										aria-label={__('Toggle module', 'wp-carousel-free')}
									>
										<input
											id={`wpcpf-sw-module-toggle-${item.module_name}`}
											type="checkbox"
											checked={!!item.show}
											onChange={() => handleChange(item.module_name)}
											disabled={saving}
										/>
										<span className="wpcpf-sw-module-toggle-slider" />
									</label>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
