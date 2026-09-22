/**
 * Mount-time guard for programmatic block insertions that carry a forbidden
 * `sourceType` (e.g. third-party patterns calling `wp.blocks.createBlock`).
 */

import { useEffect } from '@wordpress/element';
import { getAllowedTopLevelSources, isTopLevelSourceAllowed } from '../constants/allowedSources';

/**
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Block attribute updater.
 */
export default function useProgrammaticSourceGuard(attributes, setAttributes) {
	useEffect(() => {
		if (!attributes.blockName) {
			return;
		}
		if (isTopLevelSourceAllowed(attributes.blockName, attributes.sourceType)) {
			return;
		}
		const fallback = getAllowedTopLevelSources(attributes.blockName)[0];
		if (!fallback) {
			return;
		}
		setAttributes({ sourceType: fallback });
		// Why: deps intentionally empty — fires once on mount as a safety net for
		// programmatic insertions. Re-firing on sourceType change would fight the
		// user's picker selection.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
