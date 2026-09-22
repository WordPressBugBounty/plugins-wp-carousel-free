import { __ } from '@wordpress/i18n';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { getLightboxDefaults, migrateLightboxDraft } from '../config/lightboxDefaults';
import { toastSuccessMsg, toastErrorMsg } from '../../functions';

function deepClone(value) {
	return JSON.parse(JSON.stringify(value));
}

function getDefaultSettingsForModule(moduleName) {
	if ('lightbox' === moduleName) {
		return getLightboxDefaults();
	}
	return {};
}

function migrateDraftForModule(moduleName, draft) {
	if ('lightbox' === moduleName) {
		return migrateLightboxDraft(draft);
	}
	return draft;
}

export default function useModuleSettingsDrawer({
	moduleName,
	savedSettings,
	allExtensionSettings,
	saveOptions,
}) {
	const [draft, setDraft] = useState(null);
	const [saving, setSaving] = useState(false);
	const initialRef = useRef(null);
	const defaultsRef = useRef(null);

	useEffect(() => {
		if (!moduleName) {
			setDraft(null);
			initialRef.current = null;
			defaultsRef.current = null;
			return;
		}

		const defaults = migrateDraftForModule(
			moduleName,
			deepClone(getDefaultSettingsForModule(moduleName))
		);
		const base = savedSettings && typeof savedSettings === 'object' ? savedSettings : defaults;

		const clone = migrateDraftForModule(moduleName, deepClone(base));
		setDraft(clone);
		initialRef.current = deepClone(clone);
		defaultsRef.current = deepClone(defaults);
	}, [moduleName, savedSettings]);

	const patchDraft = useCallback((updater) => {
		setDraft((prev) => {
			if (!prev) {
				return prev;
			}
			return typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
		});
	}, []);

	const resetDraft = useCallback(() => {
		if (defaultsRef.current) {
			setDraft(deepClone(defaultsRef.current));
		}
	}, []);

	const saveDraft = useCallback(() => {
		if (!moduleName || !draft || !saveOptions) {
			return Promise.resolve();
		}
		setSaving(true);
		const payload = {
			extensionSettings: {
				...(allExtensionSettings || {}),
				[moduleName]: draft,
			},
		};
		return saveOptions(payload)
			.then((json) => {
				if (json?.success) {
					initialRef.current = deepClone(draft);
					toastSuccessMsg(__('Settings saved successfully.', 'wp-carousel-free'));
				} else {
					toastErrorMsg(json?.data?.message || __('Could not save settings.', 'wp-carousel-free'));
				}
				return json;
			})
			.catch(() => {
				toastErrorMsg(__('Could not save settings.', 'wp-carousel-free'));
			})
			.finally(() => setSaving(false));
	}, [allExtensionSettings, draft, moduleName, saveOptions]);

	return {
		draft,
		patchDraft,
		resetDraft,
		saveDraft,
		saving,
		canReset:
			draft && defaultsRef.current
				? JSON.stringify(draft) !== JSON.stringify(defaultsRef.current)
				: false,
		hasChanges:
			draft && initialRef.current
				? JSON.stringify(draft) !== JSON.stringify(initialRef.current)
				: false,
	};
}
