/**
 * Normalize an icon-list entry's path data into a flat list of `<path>` specs.
 *
 * Most icons carry a single `path` string. Curated grid icons (lightbox / link)
 * can be multi-path and may need `fill-rule="evenodd"` to render holes, so they
 * carry a `paths` array of `{ d, fill_rule }` and/or an icon-level `fill_rule`.
 *
 * @param {Object} icon Icon-list entry.
 * @return {Array<{d: string, fillRule: (string|undefined)}>} Path specs.
 */
export function iconPathList(icon) {
	if (!icon) {
		return [];
	}
	if (Array.isArray(icon.paths) && icon.paths.length) {
		return icon.paths
			.filter((part) => part && part.d)
			.map((part) => ({
				d: part.d,
				fillRule: part.fill_rule || icon.fill_rule || undefined,
			}));
	}
	if (icon.path) {
		return [{ d: icon.path, fillRule: icon.fill_rule || undefined }];
	}
	return [];
}
