/**
 * Atomic, reset-safe shallow-merge setter for nested option attributes.
 *
 * Reads the latest option slice at call time (via a ref) so rapid inspector
 * updates and reset buttons never clobber with a stale closure.
 */

import { useCallback, useRef } from '@wordpress/element';

/**
 * @param {Object}   attributes    Full block attributes.
 * @param {Function} setAttributes Gutenberg setter.
 * @param {string}   optionKey     Nested option key (e.g. `videoOptions`).
 * @return {(updates: Object) => void} Shallow-merge setter for the option key.
 */
export function useOptionSetter(attributes, setAttributes, optionKey) {
	const attributesRef = useRef(attributes);
	attributesRef.current = attributes;

	return useCallback(
		(updates) => {
			if (!updates || typeof updates !== 'object') {
				return;
			}
			const previous = attributesRef.current[optionKey] || {};
			setAttributes({ [optionKey]: { ...previous, ...updates } });
		},
		[setAttributes, optionKey]
	);
}
