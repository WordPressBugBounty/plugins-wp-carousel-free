import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import Drawer from '../../templates/Drawer';
import useModuleSettingsDrawer from '../hooks/useModuleSettingsDrawer';
import { getModuleSettingsEntry } from '../config/moduleSettingsRegistry';
import { RocketIcon } from '../../pages/modules/icons';

export default function ModuleSettingsDrawer({
	open,
	moduleName,
	moduleTitle,
	extensionSettings,
	saveOptions,
	onClose,
	upgradeUrl,
}) {
	const [displayModule, setDisplayModule] = useState(null);

	useEffect(() => {
		if (open && moduleName) {
			setDisplayModule(moduleName);
		}
	}, [open, moduleName]);

	useEffect(() => {
		if (open || !displayModule) {
			return undefined;
		}
		const timeout = setTimeout(() => setDisplayModule(null), 250);
		return () => clearTimeout(timeout);
	}, [open, displayModule]);

	useEffect(() => {
		if (!open) {
			return undefined;
		}
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		document.body.classList.add('wpcp-module-drawer-active');
		return () => {
			document.body.style.overflow = previousOverflow;
			document.body.classList.remove('wpcp-module-drawer-active');
		};
	}, [open]);

	useEffect(() => {
		if (!open) {
			return undefined;
		}
		const onKey = (event) => {
			if ('Escape' === event.key) {
				onClose();
			}
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	const entry = getModuleSettingsEntry(displayModule);
	const savedSettings = extensionSettings?.[displayModule];
	const drawer = useModuleSettingsDrawer({
		moduleName: displayModule,
		savedSettings,
		allExtensionSettings: extensionSettings,
		saveOptions,
	});

	const Panel = entry?.Panel;
	const title = moduleTitle || entry?.title || '';
	// A Pro module's drawer is a picture of its Pro settings. Only the header stays
	// live, so the panel gets no draft and the footer no handlers.
	const isShowcase = !!entry?.showcase;

	if (!displayModule || !Panel) {
		return null;
	}

	return (
		<Drawer open={open} onClose={onClose} className="wpcp-module-settings-drawer">
			<div className={`wpcp-module-settings-drawer-inner${isShowcase ? ' is-showcase' : ''}`}>
				<header className="wpcp-module-settings-drawer-header wpcpf-d-flex wpcpf-justify-between wpcpf-align-center">
					<div className="wpcp-module-settings-drawer-title-wrap wpcpf-d-flex wpcpf-align-center">
						<span className="wpcp-module-settings-drawer-title-icon" aria-hidden="true">
							{entry?.icon || (
								<svg
									viewBox="0 0 24 24"
									width="18"
									height="18"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.75"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35M11 8v6M8 11h6" />
								</svg>
							)}
						</span>
						<h2 className="wpcp-module-settings-drawer-title">{title}</h2>
					</div>
					<button
						type="button"
						className="wpcp-module-settings-drawer-close"
						onClick={onClose}
						aria-label={__('Close', 'wp-carousel-free')}
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<path
								d="M15 5L5 15M5 5L15 15"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</header>

				<div
					className={`wpcp-module-settings-drawer-body${
						isShowcase ? ' wpcp-module-drawer-showcase' : ''
					}`}
					inert={isShowcase ? '' : undefined}
					aria-hidden={isShowcase ? 'true' : undefined}
				>
					{isShowcase ? (
						<Panel />
					) : (
						<Panel
							draft={drawer.draft}
							patchDraft={drawer.patchDraft}
							disabled={drawer.saving}
							upgradeUrl={upgradeUrl}
						/>
					)}
				</div>

				{isShowcase && upgradeUrl && (
					<a
						className="wpcp-module-drawer-showcase-cta"
						href={upgradeUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						<RocketIcon />
						{__('Upgrade to Pro!', 'wp-carousel-free')}
					</a>
				)}

				<footer
					className={`wpcp-module-settings-drawer-footer${
						isShowcase ? ' wpcp-module-drawer-showcase' : ''
					}`}
					inert={isShowcase ? '' : undefined}
					aria-hidden={isShowcase ? 'true' : undefined}
				>
					<button
						type="button"
						className="wpcp-module-settings-drawer-btn wpcp-module-settings-drawer-btn-secondary"
						onClick={isShowcase ? undefined : drawer.resetDraft}
						disabled={isShowcase || drawer.saving || !drawer.canReset}
					>
						{__('Reset Changes', 'wp-carousel-free')}
					</button>
					<button
						type="button"
						className="wpcp-module-settings-drawer-btn wpcp-module-settings-drawer-btn-primary"
						onClick={isShowcase ? undefined : drawer.saveDraft}
						disabled={isShowcase || drawer.saving || !drawer.hasChanges}
					>
						{drawer.saving ? __('Saving…', 'wp-carousel-free') : __('Save Changes', 'wp-carousel-free')}
					</button>
				</footer>
			</div>
		</Drawer>
	);
}
