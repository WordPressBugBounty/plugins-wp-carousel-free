import { __, sprintf } from '@wordpress/i18n';
import { useState, useId } from '@wordpress/element';
import { getModuleInfo } from './module-data';
import { DocsIcon, SettingsIcon } from './icons';
import ProIcon from '../../../components/pro/proIcon';
import { moduleHasDrawerSettings } from '../../modules/config/moduleSettingsRegistry';
import { toastSuccessMsg } from '../../functions';

const FALLBACK_GRADIENT = 'linear-gradient(135deg, rgb(247, 97, 161) 0%, rgb(140, 27, 171) 100%)';

/**
 * One module row. A Pro module is genuinely inert: it carries a PRO badge in
 * place of the switch, a permanently disabled gear when the feature has a
 * settings drawer in Pro, and never calls saveOptions. An upcoming module has no
 * switch and no docs — just an Upcoming badge on a dimmed, inert card.
 * Neither can be stored — the server's slug allow-list rejects both.
 *
 * @param {Object}   props
 * @param {Object}   props.item             Row from the server (module_name, title, show, isPro).
 * @param {Array}    props.allItems         Full list, sent back on every toggle.
 * @param {Function} props.saveOptions      Dashboard save helper.
 * @param {Function} [props.onOpenSettings] Opens the module's settings drawer.
 */
export function ModuleCard({ item, allItems, saveOptions, onOpenSettings }) {
	const [saving, setSaving] = useState(false);
	const toggleInputId = useId();
	const isPro = !!item.isPro;
	const isUpcoming = 'upcoming' === item.status;

	const moduleInfo = getModuleInfo(item.module_name);
	const gradient = moduleInfo.gradient || FALLBACK_GRADIENT;
	const title = moduleInfo.title || item.title || item.module_name;
	const description =
		moduleInfo.description ||
		__('Enable this module to add more functionality to your carousels.', 'wp-carousel-free');
	// A Free module's gear appears once it has a drawer, and only works while the
	// module is on. A Pro module with a drawer in Pro gets a working gear too, but
	// it opens a locked showcase of those settings rather than offering them.
	const isProShowcase = isPro && !isUpcoming && !!moduleInfo.hasProSettings;
	const hasDrawerSettings =
		!isUpcoming && (isPro ? isProShowcase : moduleHasDrawerSettings(item.module_name));
	const settingsEnabled = hasDrawerSettings && (isProShowcase || (!isPro && !!item.show));

	const handleChange = () => {
		if (isUpcoming) {
			return;
		}
		setSaving(true);
		const message = item.show
			? __('Module disabled successfully.', 'wp-carousel-free')
			: __('Module enabled successfully.', 'wp-carousel-free');
		const updated = (allItems || [])
			.filter((m) => !m.isPro && 'upcoming' !== m.status)
			.map((m) => (m.module_name === item.module_name ? { ...m, show: !m.show } : m));

		// saveOptions reports its own failures, so only success is announced here.
		saveOptions({ modulesOptions: updated })
			.then((json) => {
				if (json?.success) {
					toastSuccessMsg(message);
				}
			})
			.catch(() => {})
			.finally(() => setSaving(false));
	};

	return (
		<div
			className={`wpcpf-module-card${isPro ? ' wpcpf-module-card--pro' : ''}${
				isUpcoming ? ' wpcpf-module-card--upcoming' : ''
			}`}
		>
			<div className="wpcpf-module-card-icon">
				<div className="wpcpf-module-icon-gradient" style={{ backgroundImage: gradient }}>
					{moduleInfo.icon}
				</div>
			</div>
			<div className="wpcpf-module-card-content">
				<div className="wpcpf-module-card-top">
					<div className="wpcpf-module-title-row">
						<h4 className="wpcpf-module-title">{title}</h4>
						{isUpcoming && (
							<span className="wpcpf-module-upcoming-badge">{__('Upcoming', 'wp-carousel-free')}</span>
						)}
						{!isUpcoming &&
							(isPro ? (
								<span className="wpcpf-module-pro-badge">
									<ProIcon width={12} height={12} />
									{__('PRO', 'wp-carousel-free')}
								</span>
							) : (
								<label
									className="wpcpf-module-toggle"
									htmlFor={toggleInputId}
									aria-label={
										/* translators: %s: module title */
										sprintf(__('Toggle %s module', 'wp-carousel-free'), title)
									}
								>
									<input
										id={toggleInputId}
										type="checkbox"
										checked={!!item.show}
										onChange={handleChange}
										disabled={saving}
									/>
									<span className="wpcpf-module-toggle-slider" />
								</label>
							))}
					</div>
				</div>

				<p className="wpcpf-module-description">{description}</p>

				{!isUpcoming && (
					<div className="wpcpf-module-card-links">
						<div className="wpcpf-module-links-wrapper">
							{moduleInfo.docLink && (
								<a
									href={moduleInfo.docLink}
									target="_blank"
									rel="noopener noreferrer"
									className="wpcpf-module-link"
								>
									<DocsIcon />
									<span>{__('Docs', 'wp-carousel-free')}</span>
								</a>
							)}
						</div>
						{hasDrawerSettings && (
							<button
								type="button"
								className={`wpcpf-module-settings${settingsEnabled ? '' : ' is-disabled'}`}
								aria-label={
									/* translators: %s: module title */
									sprintf(__('%s settings', 'wp-carousel-free'), title)
								}
								onClick={settingsEnabled ? () => onOpenSettings?.(item) : undefined}
								disabled={!settingsEnabled}
							>
								<SettingsIcon />
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
