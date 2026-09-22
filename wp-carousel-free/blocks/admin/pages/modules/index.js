import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { ModuleCard } from './template-parts';
import { RocketIcon } from './icons';

const PRO_URL = 'https://wpcarousel.io/pricing/?ref=1';
import ModuleSettingsDrawer from '../../modules/components/ModuleSettingsDrawer';

export default function Modules({ modulesOptions, extensionSettings, saveOptions }) {
	const [settingsDrawer, setSettingsDrawer] = useState(null);
	// Which modules exist, and in what order, is the server's call — render
	// what it sent rather than reconciling against a second list here. Free and
	// Pro share one grid; a Pro row is told apart by its badge.
	const list = useMemo(() => modulesOptions || [], [modulesOptions]);
	const freeModules = useMemo(
		() => list.filter((item) => !item.isPro && 'upcoming' !== item.status),
		[list]
	);
	const proModules = useMemo(() => list.filter((item) => item.isPro), [list]);

	return (
		<div className="wpcpf-dashboard-modules">
			<div className="wpcpf-page-header">
				<h2 className="wpcpf-page-title">{__('Manage Modules', 'wp-carousel-free')}</h2>
				<p className="wpcpf-page-desc">
					{__(
						'Enable only the modules you need to keep your site fast and optimized. These modules works on blocks.',
						'wp-carousel-free'
					)}
				</p>
			</div>

			{freeModules.length > 0 && (
				<div className="wpcpf-module-grid">
					{freeModules.map((item) => (
						<ModuleCard
							key={item.module_name}
							item={item}
							allItems={list}
							saveOptions={saveOptions}
							onOpenSettings={setSettingsDrawer}
						/>
					))}
				</div>
			)}

			{proModules.length > 0 && (
				<>
					<div className="wpcpf-modules-pro-banner">
						<div className="wpcpf-modules-pro-banner-text">
							<h3>{__('Unlock Powerful Features with Pro!', 'wp-carousel-free')}</h3>
							<p>
								{__(
									'Upgrade now to access advanced features that help you build and display richer carousels, sliders and galleries.',
									'wp-carousel-free'
								)}
							</p>
						</div>
						<a
							className="wpcpf-modules-pro-banner-cta"
							href={PRO_URL}
							target="_blank"
							rel="noopener noreferrer"
						>
							<RocketIcon />
							{__('Upgrade to Pro', 'wp-carousel-free')}
						</a>
					</div>
					<div className="wpcpf-module-grid">
						{proModules.map((item) => (
							<ModuleCard
								key={item.module_name}
								item={item}
								allItems={list}
								saveOptions={saveOptions}
								onOpenSettings={setSettingsDrawer}
							/>
						))}
					</div>
				</>
			)}

			<ModuleSettingsDrawer
				open={!!settingsDrawer}
				moduleName={settingsDrawer?.module_name}
				moduleTitle={settingsDrawer?.title}
				extensionSettings={extensionSettings}
				saveOptions={saveOptions}
				upgradeUrl={PRO_URL}
				onClose={() => setSettingsDrawer(null)}
			/>
		</div>
	);
}
