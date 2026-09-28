import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import {
	CheckIcon,
	GeneratorSettingsPageArrow,
	AdvancedIcon,
	CustomCssJsIcon,
	ChevronRightIcon,
	IntegrationsTabIcon,
	ClassicSettingsIcon,
	ToolsTabIcon,
} from './icons';
import { toastSuccessMsg, toastErrorMsg } from '../../functions';
import CodeSettingField from './CodeSettingField.jsx';
import Integrations from '../integrations';

const getWpcpfDashboard = () => (typeof window !== 'undefined' ? window.wpcpfDashboard || {} : {});

const TABS = [
	{ id: 'integrations', label: __('Integrations', 'wp-carousel-free'), Icon: IntegrationsTabIcon },
	{ id: 'advanced', label: __('Advanced Controls', 'wp-carousel-free'), Icon: AdvancedIcon },
	{ id: 'custom', label: __('Custom CSS & JS', 'wp-carousel-free'), Icon: CustomCssJsIcon },
];

// Links out to the classic shortcode-generator settings page. The URLs come from
// PHP, which knows the admin path and the options framework's tab ids.
const CLASSIC_LINKS = [
	{
		id: 'classic-settings',
		label: __('Classic Settings', 'wp-carousel-free'),
		Icon: ClassicSettingsIcon,
		urlKey: 'classicSettingsUrl',
	},
	{
		id: 'classic-tools',
		label: __('Tools', 'wp-carousel-free'),
		Icon: ToolsTabIcon,
		urlKey: 'classicToolsUrl',
	},
];

const ADVANCED_SETTINGS = [
	{
		id: 'wpcf_delete_all_data',
		title: __('Clean-up Data on Deletion', 'wp-carousel-free'),
		description: __(
			"Check to remove plugin's data when plugin is uninstalled or deleted.",
			'wp-carousel-free'
		),
		checked: false,
	},
	{
		id: 'wpcp_use_cache',
		title: __('Cache', 'wp-carousel-free'),
		description: __(
			'Cache carousel queries for faster page loads. Cleared automatically whenever content changes.',
			'wp-carousel-free'
		),
		checked: false,
	},
];

export default function Settings({ pluginSettings, integrations, saveOptions }) {
	const [activeTab, setActiveTab] = useState('integrations');
	const [advancedSettings, setAdvancedSettings] = useState(ADVANCED_SETTINGS);
	const [saving, setSaving] = useState(false);
	const [resetting, setResetting] = useState(false);
	const [flushing, setFlushing] = useState(false);
	const [customCss, setCustomCss] = useState('');
	const [customJs, setCustomJs] = useState('');

	// Per-language wp.codeEditor settings from wp_enqueue_code_editor(). Absent when
	// the user has switched syntax highlighting off in their profile — the fields then
	// render as plain textareas.
	const codeEditorSettings = getWpcpfDashboard().codeEditor || {};

	// Raw JS output needs unfiltered_html, which a multisite site admin does not
	// have. The server drops the key either way; this keeps the field from
	// accepting input it would discard.
	const canEditCustomJs = !!getWpcpfDashboard().canEditCustomJs;

	useEffect(() => {
		if (!pluginSettings) {
			return;
		}
		setAdvancedSettings((prev) =>
			prev.map((item) => {
				const stored = pluginSettings[item.id];
				// An absent or empty value means "never set", so the row keeps
				// its own default. Mirrors Cache::is_enabled() on the PHP side.
				if (undefined === stored || '' === stored) {
					return item;
				}
				return { ...item, checked: '1' === stored || true === stored };
			})
		);
		setCustomCss(pluginSettings.wpcp_custom_css || '');
		setCustomJs(pluginSettings.wpcp_custom_js || '');
	}, [pluginSettings]);

	const handleToggleSetting = (id) => {
		setAdvancedSettings((prev) =>
			prev.map((setting) => (setting.id === id ? { ...setting, checked: !setting.checked } : setting))
		);
	};

	const handleSaveChanges = async () => {
		setSaving(true);
		try {
			const result = await saveOptions({
				sp_wpcp_settings: {
					wpcf_delete_all_data: advancedSettings.find((s) => s.id === 'wpcf_delete_all_data')?.checked
						? '1'
						: '0',
					wpcp_use_cache: advancedSettings.find((s) => s.id === 'wpcp_use_cache')?.checked ? '1' : '0',
					wpcp_custom_css: customCss,
					...(canEditCustomJs ? { wpcp_custom_js: customJs } : {}),
				},
			});
			if (result?.success) {
				toastSuccessMsg(__('Settings saved successfully!', 'wp-carousel-free'));
			} else {
				toastErrorMsg(__('Error saving settings.', 'wp-carousel-free'));
			}
		} catch (error) {
			toastErrorMsg(__('Error saving settings.', 'wp-carousel-free'));
		} finally {
			setSaving(false);
		}
	};

	const handleFlushCache = async () => {
		const dashboard = getWpcpfDashboard();
		if (!dashboard.ajaxUrl || !dashboard.nonce) {
			return;
		}

		setFlushing(true);
		const form = new FormData();
		form.append('action', 'wpcpf_flush_cache');
		form.append('nonce', dashboard.nonce);

		try {
			const response = await fetch(dashboard.ajaxUrl, {
				method: 'POST',
				body: form,
				credentials: 'same-origin',
			});
			const result = await response.json();

			if (result?.success) {
				toastSuccessMsg(__('Cache cleared successfully!', 'wp-carousel-free'));
			} else {
				toastErrorMsg(__('Error clearing cache.', 'wp-carousel-free'));
			}
		} catch (error) {
			toastErrorMsg(__('Error clearing cache.', 'wp-carousel-free'));
		} finally {
			setFlushing(false);
		}
	};

	const handleResetChanges = () => {
		const message = __(
			'Are you sure you want to reset these settings? Advanced controls go back to their defaults and your custom CSS & JS will be cleared.',
			'wp-carousel-free'
		);

		// eslint-disable-next-line no-alert -- intentional confirmation before a destructive reset
		if (!window.confirm(message)) {
			return;
		}

		setResetting(true);
		setAdvancedSettings(ADVANCED_SETTINGS);
		setCustomCss('');
		setCustomJs('');
		setTimeout(() => {
			setResetting(false);
		}, 1000);
	};

	return (
		<div className="wpcpf-settings-page">
			<div className="wpcpf-settings-section">
				<div className="wpcpf-settings-aside">
					<div className="wpcpf-settings-sidebar">
						<ul className="wpcpf-settings-tabs wpcpf-d-flex wpcpf-flex-col wpcpf-gap-8px">
							{TABS.map(({ label, id, Icon }) => (
								// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
								<li
									key={id}
									className={`wpcpf-settings-tab wpcpf-d-flex wpcpf-cursor-pointer wpcpf-align-center wpcpf-justify-between${
										activeTab === id ? ' wpcpf-settings-tab-active' : ''
									}`}
									onClick={() => setActiveTab(id)}
								>
									<span className="wpcpf-settings-tab-label wpcpf-d-flex wpcpf-align-center wpcpf-gap-8px">
										<span className="wpcpf-settings-icon">
											<Icon />
										</span>
										<span>{label}</span>
									</span>
									{activeTab === id && (
										<span className="wpcpf-settings-tab-arrow">
											<ChevronRightIcon />
										</span>
									)}
								</li>
							))}
						</ul>
					</div>

					<nav
						className="wpcpf-settings-sidebar wpcpf-settings-classic-links"
						aria-label={__('Classic settings', 'wp-carousel-free')}
					>
						<ul className="wpcpf-settings-classic-list wpcpf-d-flex wpcpf-flex-col wpcpf-gap-8px">
							{CLASSIC_LINKS.map(({ id, label, Icon, urlKey }) => (
								<li key={id}>
									<a
										href={getWpcpfDashboard()[urlKey] || ''}
										className="wpcpf-settings-classic-link wpcpf-d-flex wpcpf-align-center wpcpf-justify-between"
									>
										<span className="wpcpf-settings-tab-label wpcpf-d-flex wpcpf-align-center wpcpf-gap-8px">
											<span className="wpcpf-settings-icon">
												<Icon />
											</span>
											<span>{label}</span>
										</span>
										<span className="wpcpf-settings-classic-link-arrow">
											<GeneratorSettingsPageArrow />
										</span>
									</a>
								</li>
							))}
						</ul>
					</nav>
				</div>

				<div className="wpcpf-settings-content">
					{activeTab === 'integrations' && (
						<Integrations integrations={integrations} saveOptions={saveOptions} />
					)}

					{activeTab === 'advanced' && (
						<div className="wpcpf-settings-advanced-content">
							<div className="wpcpf-settings-list">
								{advancedSettings.map((setting) => (
									<div key={setting.id} className="wpcpf-setting-item">
										<div className="wpcpf-setting-info">
											<h4 className="wpcpf-setting-title">{setting.title}</h4>
											<p className="wpcpf-setting-description">{setting.description}</p>
										</div>
										<button
											type="button"
											className={`wpcpf-setting-checkbox ${
												setting.checked ? 'wpcpf-setting-checkbox-checked' : ''
											}`}
											onClick={() => handleToggleSetting(setting.id)}
											aria-label={
												setting.checked
													? __('Unchecked', 'wp-carousel-free')
													: __('Checked', 'wp-carousel-free')
											}
										>
											{setting.checked && <CheckIcon />}
										</button>
									</div>
								))}

								<div className="wpcpf-setting-item">
									<div className="wpcpf-setting-info">
										<h4 className="wpcpf-setting-title">{__('Clear Cached', 'wp-carousel-free')}</h4>
										<p className="wpcpf-setting-description">
											{__(
												'Clear all cached data to refresh content and apply recent changes immediately.',
												'wp-carousel-free'
											)}
										</p>
									</div>
									<button
										type="button"
										className="wpcpf-flush-cache-btn"
										onClick={handleFlushCache}
										disabled={flushing}
									>
										{flushing ? __('Clearing…', 'wp-carousel-free') : __('Flush Cache', 'wp-carousel-free')}
									</button>
								</div>
							</div>

							<div className="wpcpf-settings-actions">
								<button
									type="button"
									className="wpcpf-save-btn"
									onClick={handleSaveChanges}
									disabled={saving}
								>
									{saving ? __('Saving…', 'wp-carousel-free') : __('Save Changes', 'wp-carousel-free')}
								</button>
								<button
									type="button"
									className="wpcpf-reset-btn"
									onClick={handleResetChanges}
									disabled={resetting}
								>
									{resetting
										? __('Resetting…', 'wp-carousel-free')
										: __('Reset Changes', 'wp-carousel-free')}
								</button>
							</div>
						</div>
					)}

					{activeTab === 'custom' && (
						<div className="wpcpf-settings-custom-content">
							<CodeSettingField
								label={__('Custom CSS', 'wp-carousel-free')}
								value={customCss}
								onChange={setCustomCss}
								mode="css"
								settings={codeEditorSettings.css}
							/>
							{canEditCustomJs && (
								<CodeSettingField
									label={__('Custom JS', 'wp-carousel-free')}
									value={customJs}
									onChange={setCustomJs}
									mode="javascript"
									settings={codeEditorSettings.js}
								/>
							)}

							<div className="wpcpf-settings-actions">
								<button
									type="button"
									className="wpcpf-save-btn"
									onClick={handleSaveChanges}
									disabled={saving}
								>
									{saving ? __('Saving…', 'wp-carousel-free') : __('Save Changes', 'wp-carousel-free')}
								</button>
								<button
									type="button"
									className="wpcpf-reset-btn"
									onClick={handleResetChanges}
									disabled={resetting}
								>
									{resetting
										? __('Resetting…', 'wp-carousel-free')
										: __('Reset Changes', 'wp-carousel-free')}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
