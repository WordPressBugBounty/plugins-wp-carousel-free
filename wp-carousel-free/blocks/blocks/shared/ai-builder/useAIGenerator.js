import { useState, useCallback, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { formatProviderError } from './providers';

/**
 * Strip a value down to what `JSON.stringify` can actually serialize.
 *
 * `existingAttributes` on a Refine request is whatever
 * `getBlockAttributes()` currently holds for the block — and a block built up
 * over several editing sessions (media picks, popup saves, undo/redo) can end
 * up carrying a stray non-plain reference an older code path attached to an
 * item (a DOM node, a `window` reference, a class instance). `apiFetch`
 * JSON-stringifies the request body internally, so a single bad leaf anywhere
 * in the tree throws "Converting circular structure to JSON" and Refine never
 * reaches the network — even though every other attribute is fine. Dropping
 * anything that isn't a plain object/array/primitive (and breaking cycles
 * with the seen-set) means a stale bad value degrades to "that one field
 * reverts to its schema default," not a hard crash that makes Refine look
 * AI-generated-only.
 *
 * @param {*}       value Value to clean.
 * @param {WeakSet} seen  Objects already visited on this branch, for cycle detection.
 * @return {*} A value safe to pass to `JSON.stringify`, or `undefined` when
 *             the whole value had to be dropped.
 */
function toSerializable(value, seen = new WeakSet()) {
	if (null === value || 'object' !== typeof value) {
		return 'function' === typeof value ? undefined : value;
	}

	if (('undefined' !== typeof window && value === window) || (value && value.window === value)) {
		return undefined;
	}
	if ('undefined' !== typeof Node && value instanceof Node) {
		return undefined;
	}
	if (seen.has(value)) {
		return undefined;
	}
	seen.add(value);

	if (Array.isArray(value)) {
		return value.map((item) => toSerializable(item, seen));
	}

	// Only plain objects survive; Map/Set/class instances/etc. are dropped
	// rather than guessed at — the AI catalog never expects them anyway.
	const proto = Object.getPrototypeOf(value);
	if (null !== proto && Object.prototype !== proto) {
		return undefined;
	}

	const cleaned = {};
	for (const [key, child] of Object.entries(value)) {
		const childCleaned = toSerializable(child, seen);
		if (undefined !== childCleaned) {
			cleaned[key] = childCleaned;
		}
	}
	return cleaned;
}

/**
 * Ask the AI builder what to do with a prompt.
 *
 * The response is mode-tagged: `pattern` names a Ready Pattern the editor should
 * insert, `attributes` carries a generated block configuration. A provider
 * failure is remembered per slug (`failures`, slug → reason) until `reset()`,
 * and the latest one is `failure`, so the modal can offer a provider that has not failed.
 *
 * @return {Object} Generator state and actions.
 */
export default function useAIGenerator() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [failure, setFailure] = useState(null);
	const [failures, setFailures] = useState({});
	const controllerRef = useRef(null);

	const generate = useCallback(
		async ({
			prompt,
			blockName,
			existingAttributes = {},
			allowPatterns = true,
			provider = '',
			model = '',
		}) => {
			const controller = new AbortController();
			controllerRef.current = controller;

			setLoading(true);
			setError(null);
			setFailure(null);

			try {
				const response = await apiFetch({
					path: '/wpcp/v2/ai-generate',
					method: 'POST',
					data: {
						prompt,
						blockName,
						existingAttributes: toSerializable(existingAttributes),
						allowPatterns,
						provider,
						model,
					},
					signal: controller.signal,
				});

				if (
					response?.success &&
					('pattern' === response.mode ? response.pattern : response.attributes)
				) {
					return response;
				}

				throw new Error(__('Failed to generate block configuration from AI.', 'wp-carousel-free'));
			} catch (err) {
				// The user hit "Stop" — this isn't a failure worth surfacing.
				if ('AbortError' === err.name) {
					return null;
				}

				const message =
					err.message ||
					__('An error occurred while communicating with the AI service.', 'wp-carousel-free');
				const failedProvider = err?.data?.provider || '';
				if (!failedProvider) {
					setError(message);
					return null;
				}

				const reason = err.data.reason || 'error';
				setFailures((current) => ({ ...current, [failedProvider]: reason }));
				setFailure({ provider: failedProvider, reason });
				setError(
					formatProviderError(failedProvider, failedProvider === provider ? model : '', message)
				);
				return null;
			} finally {
				setLoading(false);
				if (controllerRef.current === controller) {
					controllerRef.current = null;
				}
			}
		},
		[]
	);

	const cancel = useCallback(() => {
		controllerRef.current?.abort();
	}, []);

	const clearFailure = useCallback(() => {
		setFailure(null);
		setError(null);
	}, []);

	const reset = useCallback(() => {
		setError(null);
		setFailure(null);
		setFailures({});
	}, []);

	return { generate, cancel, reset, loading, error, setError, failure, clearFailure, failures };
}
