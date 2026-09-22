import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Toaster } from 'react-hot-toast';
import { Header, Footer } from './templates';
import GettingStarted from './pages/getting-started';
import Blocks from './pages/blocks';
import Modules from './pages/modules';
import SavedTemplates from './pages/saved-templates';
import Settings from './pages/settings';
import LiteVsPro from './pages/lite-vs-pro';
import AboutUs from './pages/about-us';
import SetupWizard from './setup-wizard';
import useDashboardData from './hooks/useDashboardData';

const MENU_ITEMS = [
	{ label: __('Dashboard', 'wp-carousel-free'), value: 'getting-start', hash: '#getting-start' },
	{ label: __('Blocks', 'wp-carousel-free'), value: 'blocks', hash: '#blocks', badge: true },
	{ label: __('Modules', 'wp-carousel-free'), value: 'modules', hash: '#modules' },
	{
		label: __('Saved Templates', 'wp-carousel-free'),
		value: 'saved_templates',
		hash: '#saved_templates',
		module: 'saved-templates',
	},
	{ label: __('Settings', 'wp-carousel-free'), value: 'settings', hash: '#settings' },
	{ divider: true, value: 'divider' },
	{ label: __('Lite vs Pro', 'wp-carousel-free'), value: 'lite-vs-pro', hash: '#lite-vs-pro' },
	{ label: __('About Us', 'wp-carousel-free'), value: 'about-us', hash: '#about-us' },
	{
		label: __('Our Plugins', 'wp-carousel-free'),
		value: 'our-plugins',
		link: 'https://shapedplugin.com/plugins/',
		icon: 'icon-our-plugins.svg',
	},
];

/**
 * Whether a module is on, mirroring the PHP default of on-when-unset so a tab
 * never disappears just because options have not loaded yet.
 *
 * @param {Array}  modulesOptions Registry rows from the server.
 * @param {string} moduleName     Module slug.
 * @return {boolean} True when the module is on or unknown.
 */
const isModuleOn = (modulesOptions, moduleName) => {
	const entry = (modulesOptions || []).find((item) => item.module_name === moduleName);
	return entry ? !!entry.show : true;
};

// Keeps the native WP admin submenu's "current" highlight in sync with the
// SPA's hash route. The Getting Started slug must stay in step with
// Dashboard::PAGE_SLUG_GETTING_STARTED, otherwise no item ever matches.
const updateSidebarActive = (pageName) => {
	const postMenu = document.getElementById('menu-posts-sp_wp_carousel');
	if (!postMenu) {
		return;
	}

	postMenu.querySelectorAll('li').forEach((el) => el.classList.remove('current'));

	const selector =
		pageName === 'getting-start' || pageName === ''
			? 'li a[href="edit.php?post_type=sp_wp_carousel&page=wpcpf_dashboard"]'
			: `li a[href*="#${pageName}"]`;

	postMenu.querySelector(selector)?.closest('li')?.classList.add('current');
};

function getPageFromHash() {
	const hash = (window.location.hash || '').replace('#', '').split('=')[0];
	return hash || 'getting-start';
}

export default function Render() {
	const [page, setPage] = useState(getPageFromHash());
	const { options, setModifiedData, saveOptions } = useDashboardData();

	updateSidebarActive(window.location.hash.replace('#', ''));

	useEffect(() => {
		const h = (window.location.hash || '').replace('#', '').trim();
		if (!h) {
			window.history.replaceState(
				null,
				'',
				window.location.pathname + window.location.search + '#getting-start'
			);
		}
	}, []);

	useEffect(() => {
		const onHashChange = () => {
			setPage(getPageFromHash());
			updateSidebarActive(window.location.hash.replace('#', ''));
		};
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	}, []);

	const setPageAndHash = (pageName) => {
		setPage(pageName);
		window.location.hash = pageName;
	};

	// The wizard is a full-page route: no navbar, no footer, and it is not in
	// MENU_ITEMS, so it has to be handled before the hash-to-tab fallback below
	// would send #setup-wizard back to the dashboard.
	if ('setup-wizard' === page) {
		return (
			<>
				<SetupWizard />
				<Toaster
					position="top-right"
					toastOptions={{
						style: {
							padding: '16px 24px',
							fontSize: '18px',
							borderRadius: '10px',
							maxWidth: '400px',
						},
					}}
				/>
			</>
		);
	}

	// A tab tied to a module disappears with it, and a stale hash pointing at
	// one falls back to the dashboard rather than rendering an orphan page.
	const menuItems = MENU_ITEMS.filter(
		(item) => !item.module || isModuleOn(options?.modulesOptions, item.module)
	);
	const routable = menuItems.filter((item) => item.hash);
	const currentPage = routable.some((item) => item.value === page) ? page : 'getting-start';

	return (
		<>
			<div className="wpcpf-admin-dashboard-container">
				<Header menuItems={menuItems} currentPage={currentPage} setPageAndHash={setPageAndHash} />
				<div className="wpcpf-admin-dashboard-body">
					<div className="wpcpf-admin-dashboard-content">
						{currentPage === 'getting-start' && (
							<GettingStarted
								readyPatternsEnabled={isModuleOn(options?.modulesOptions, 'ready-patterns')}
							/>
						)}
						{currentPage === 'blocks' && (
							<Blocks blockVisibility={options?.blockVisibility} saveOptions={saveOptions} />
						)}
						{currentPage === 'modules' && (
							<Modules
								modulesOptions={options?.modulesOptions}
								extensionSettings={options?.extensionSettings}
								setModifiedData={setModifiedData}
								saveOptions={saveOptions}
							/>
						)}
						{currentPage === 'saved_templates' && <SavedTemplates />}
						{currentPage === 'settings' && options?.pluginSettings && (
							<Settings
								pluginSettings={options.pluginSettings}
								integrations={options?.integrations}
								setModifiedData={setModifiedData}
								saveOptions={saveOptions}
							/>
						)}
						{currentPage === 'lite-vs-pro' && <LiteVsPro />}
						{currentPage === 'about-us' && <AboutUs />}
					</div>
					<Footer />
				</div>
			</div>
			<Toaster
				position="top-right"
				toastOptions={{
					style: {
						padding: '16px 24px',
						fontSize: '18px',
						borderRadius: '10px',
						maxWidth: '400px',
					},
				}}
			/>
		</>
	);
}
