import { useState, useEffect, useRef } from '@wordpress/element';
import { select, subscribe } from '@wordpress/data';

/**
 * useEditorSaveStatus
 *
 * Detects if *any* entity (post, page, template, widget, etc.)
 * is currently being saved — works in Site Editor, Post Editor, and Widgets.
 *
 * @return {Object} { isSaving, isAutosaving }
 */
export const useEditorSaveStatus = () => {
	const [isSaving, setIsSaving] = useState(false);
	const [isAutosaving, setIsAutosaving] = useState(false);
	const prevSavingRef = useRef(false);

	useEffect(() => {
		const unsubscribe = subscribe(() => {
			const core = select('core');
			if (!core) {
				return;
			}

			const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } = core;

			if (typeof __experimentalGetDirtyEntityRecords !== 'function') {
				return;
			}

			const dirtyEntities = __experimentalGetDirtyEntityRecords();

			// Check if any entity is saving
			const isNowSaving = dirtyEntities.some((record) =>
				isSavingEntityRecord(record.kind, record.name, record.key)
			);

			// Detect autosaving from post editor if available
			const coreEditor = select('core/editor');
			const isNowAutosaving =
				typeof coreEditor?.isAutosavingPost === 'function' ? coreEditor.isAutosavingPost() : false;

			// Update only when changed
			if (prevSavingRef.current !== isNowSaving) {
				setIsSaving(isNowSaving);
				prevSavingRef.current = isNowSaving;
			}
			setIsAutosaving(isNowAutosaving);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return { isSaving, isAutosaving };
};
