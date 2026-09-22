/**
 * Ready Patterns — pre-insert dependency evaluation.
 *
 * Everything a pattern can require is already known to the editor: module flags
 * ride on `extensionModules`, plugin presence and the running plugin version are
 * localized with `readyPatterns`. No extra request, no server round-trip.
 */

import { __, sprintf } from '@wordpress/i18n';
import { isBlockModuleActive } from '../utils/moduleState';

export const REQUIREMENT_PLUGIN = 'plugin';
export const REQUIREMENT_MODULE = 'module';
export const REQUIREMENT_VERSION = 'version';
export const REQUIREMENT_SOURCE = 'source';

/** Plugin slug → display name. */
const PLUGIN_LABELS = {
	woocommerce: 'WooCommerce',
};

/** Content sources that depend on another plugin being active. */
const SOURCE_PLUGIN_DEPENDENCY = {
	product: 'woocommerce',
};

/**
 * Module slug → display name (mirrors the dashboard module registry).
 *
 * @return {Record<string, string>} Label map.
 */
function moduleLabels() {
	return {
		lightbox: __('Lightbox', 'wp-carousel-free'),
		hover: __('Hover Animations', 'wp-carousel-free'),
		'ready-patterns': __('Ready Patterns Library', 'wp-carousel-free'),
	};
}

/**
 * Source slug → display name.
 *
 * @return {Record<string, string>} Label map.
 */
function sourceLabels() {
	return {
		image: __('Images', 'wp-carousel-free'),
		post: __('Posts', 'wp-carousel-free'),
		product: __('Products', 'wp-carousel-free'),
		video: __('Videos', 'wp-carousel-free'),
		audio: __('Audio', 'wp-carousel-free'),
		document: __('Documents', 'wp-carousel-free'),
		external: __('External Feed', 'wp-carousel-free'),
	};
}

/**
 * Humanize an unmapped slug ("real-estate" → "Real Estate").
 *
 * @param {string} slug Slug.
 * @return {string} Readable label.
 */
function humanize(slug) {
	return String(slug || '')
		.split(/[-_]/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Whether a plugin is active according to localized state.
 *
 * @param {string} slug Plugin slug.
 * @return {boolean} True when active.
 */
function isPluginActive(slug) {
	const active = window.wpcpBlockLocalize?.readyPatterns?.activePlugins;

	if (!active || 'object' !== typeof active) {
		// Detection data absent: assume present rather than nag on every pattern.
		return true;
	}

	return Object.prototype.hasOwnProperty.call(active, slug) ? Boolean(active[slug]) : true;
}

/**
 * Running plugin version from localization.
 *
 * @return {string} Version string, or an empty string when unknown.
 */
export function getPluginVersion() {
	return String(window.wpcpBlockLocalize?.readyPatterns?.pluginVersion || '');
}

/**
 * Compare two dotted numeric versions.
 *
 * @param {string} left  First version.
 * @param {string} right Second version.
 * @return {number} Negative when left < right, 0 when equal, positive otherwise.
 */
export function compareVersions(left, right) {
	const toParts = (value) =>
		String(value || '')
			.split('.')
			.map((part) => parseInt(part, 10) || 0);

	const a = toParts(left);
	const b = toParts(right);
	const length = Math.max(a.length, b.length);

	for (let index = 0; index < length; index += 1) {
		const diff = (a[index] || 0) - (b[index] || 0);
		if (0 !== diff) {
			return diff;
		}
	}

	return 0;
}

/**
 * Describe every requirement a pattern declares, with its met state.
 *
 * @param {Object} requires Normalized `requires` object.
 * @return {Array<{category: string, slug: string, label: string, met: boolean}>} Requirement list.
 */
export function describeRequirements(requires) {
	const entries = [];
	const modules = moduleLabels();
	const sources = sourceLabels();

	(requires?.plugins || []).forEach((slug) => {
		const name = PLUGIN_LABELS[slug] || humanize(slug);
		entries.push({
			category: REQUIREMENT_PLUGIN,
			slug,
			met: isPluginActive(slug),
			label: sprintf(
				/* translators: %s: plugin name */
				__('%s must be active', 'wp-carousel-free'),
				name
			),
		});
	});

	(requires?.modules || []).forEach((slug) => {
		const name = modules[slug] || humanize(slug);
		entries.push({
			category: REQUIREMENT_MODULE,
			slug,
			met: isBlockModuleActive(slug),
			label: sprintf(
				/* translators: %s: module name */
				__('%s module must be on', 'wp-carousel-free'),
				name
			),
		});
	});

	(requires?.sources || []).forEach((slug) => {
		const dependency = SOURCE_PLUGIN_DEPENDENCY[slug];
		entries.push({
			category: REQUIREMENT_SOURCE,
			slug,
			met: dependency ? isPluginActive(dependency) : true,
			label: sprintf(
				/* translators: %s: content source name */
				__('Uses the %s content source', 'wp-carousel-free'),
				sources[slug] || humanize(slug)
			),
		});
	});

	const minVersion = requires?.minPluginVersion || '';
	if (minVersion) {
		const running = getPluginVersion();
		entries.push({
			category: REQUIREMENT_VERSION,
			slug: minVersion,
			// An unknown running version cannot be judged too old.
			met: '' === running || 0 <= compareVersions(running, minVersion),
			label: sprintf(
				/* translators: %s: version number */
				__('WP Carousel Pro %s or newer', 'wp-carousel-free'),
				minVersion
			),
		});
	}

	return entries;
}

/**
 * Unmet requirements for a pattern, deduplicated by label.
 *
 * @param {Object} requires Normalized `requires` object.
 * @return {Array<{category: string, label: string}>} Unmet requirement list.
 */
export function evaluateRequirements(requires) {
	const seen = new Set();

	return describeRequirements(requires)
		.filter((entry) => !entry.met)
		.filter((entry) => {
			if (seen.has(entry.label)) {
				return false;
			}
			seen.add(entry.label);
			return true;
		})
		.map(({ category, label }) => ({ category, label }));
}

/**
 * Whether a pattern has unmet requirements on this site.
 *
 * @param {Object} pattern Manifest item.
 * @return {boolean} True when something is unmet.
 */
export function hasUnmetRequirements(pattern) {
	return evaluateRequirements(pattern?.requires).length > 0;
}
