import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

// The icon list is static (served from a PHP file), so fetch it once per editor
// session and share the in-flight/resolved promise across every hook instance.
// Without this cache, each consumer — and each remount — fires its own request;
// a frequently-remounting subtree (e.g. a Swiper track, which mounts several
// icon pickers per item) can then saturate the browser connection pool and throw
// `net::ERR_INSUFFICIENT_RESOURCES`.
const iconListCache = new Map();
const EMPTY_ICON_LIST = Object.freeze({});

const fetchIconList = (path, nonce) => {
	const key = `${path}|${nonce}`;
	if (!iconListCache.has(key)) {
		iconListCache.set(
			key,
			apiFetch({
				path,
				method: 'GET',
				headers: { 'X-WP-Nonce': nonce },
			})
				.then((response) => (response && typeof response === 'object' ? response : {}))
				.catch(() => {
					// Drop the rejected promise so a later mount can retry.
					iconListCache.delete(key);
					return {};
				})
		);
	}
	return iconListCache.get(key);
};

const useIconList = (options = {}) => {
	const { initialIcons = EMPTY_ICON_LIST, enabled = true } = options;
	const resolvedInitialIcons =
		initialIcons && 'object' === typeof initialIcons ? initialIcons : EMPTY_ICON_LIST;
	const [icon, setIcon] = useState(resolvedInitialIcons);
	const iconConfig =
		typeof window !== 'undefined' && window.wpcpIconLibraryConfig ? window.wpcpIconLibraryConfig : {};
	const path = iconConfig.iconListPath || '/wpcp/v2/icon-list';
	const nonce = iconConfig.nonce || '';

	useEffect(() => {
		if (!enabled) {
			return undefined;
		}
		let cancelled = false;
		fetchIconList(path, nonce).then((response) => {
			if (!cancelled) {
				setIcon(response);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [enabled, path, nonce]);

	return icon;
};

export default useIconList;
