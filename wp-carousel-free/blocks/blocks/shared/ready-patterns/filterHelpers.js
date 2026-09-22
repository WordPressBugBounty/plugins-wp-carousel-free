/**
 * Ready Patterns — pure filter, sort, and count helpers (unit-testable).
 */

import {
	canonicalizeCategory,
	CATEGORY_SLUGS,
	FILTER_ALL,
	SORT_DEFAULT,
	SORT_LATEST,
	SORT_POPULAR,
	SOURCE_TYPE_SLUGS,
	TIER_ALL,
	TIER_FREE,
	TIER_PREMIUM,
	USE_CASE_SLUGS,
} from './constants';

/**
 * Resolved tier for an item — explicit `tier` wins, legacy `pro` is the fallback.
 *
 * @param {Object} item Manifest item.
 * @return {string} "free" or "pro".
 */
export function resolveItemTier(item) {
	if ('free' === item?.tier) {
		return 'free';
	}
	if ('pro' === item?.tier || 'premium' === item?.tier) {
		return 'pro';
	}

	return item?.pro ? 'pro' : 'free';
}

/**
 * Tally manifest items per block-axis category slug.
 *
 * Every category present is counted, not only the pinned ones — a slug the count
 * map has no key for is how Pro-block patterns went uncountable before.
 *
 * @param {Array} items Normalized manifest items.
 * @return {Record<string, number>} Count map keyed by category slug.
 */
export function tallyCategoryCounts(items) {
	const counts = { all: items.length };
	CATEGORY_SLUGS.forEach((slug) => {
		counts[slug] = 0;
	});
	items.forEach((item) => {
		const category = canonicalizeCategory(item?.category);
		// A literal "all" category would inflate the All Patterns badge past the
		// item count; the axis owns that slug, the source does not.
		if (category && FILTER_ALL !== category) {
			counts[category] = (counts[category] || 0) + 1;
		}
	});
	return counts;
}

/**
 * Block-axis terms to render: the pinned slugs, then any extra the manifest carries.
 *
 * Pinned rows stay visible at zero because the axis is a showcase of what the
 * plugin can build; an unpinned term earns its row by having patterns.
 *
 * @param {Array} items Manifest items.
 * @return {string[]} Ordered category terms.
 */
export function collectCategoryTerms(items) {
	const present = new Set();
	items.forEach((item) => {
		const category = canonicalizeCategory(item?.category);
		if (category && FILTER_ALL !== category) {
			present.add(category);
		}
	});

	const extra = Array.from(present)
		.filter((term) => !CATEGORY_SLUGS.includes(term))
		.sort();

	return [...CATEGORY_SLUGS, ...extra];
}

/**
 * Tally manifest items per tier (free vs premium).
 *
 * @param {Array} items Normalized manifest items.
 * @return {Record<string, number>} Count map keyed by tier.
 */
export function tallyTierCounts(items) {
	const counts = { [TIER_ALL]: items.length, [TIER_FREE]: 0, [TIER_PREMIUM]: 0 };
	items.forEach((item) => {
		counts['pro' === resolveItemTier(item) ? TIER_PREMIUM : TIER_FREE] += 1;
	});
	return counts;
}

/**
 * Tally items per term of a list-valued field (use cases, tags).
 *
 * Only terms present in the manifest are counted — a derived axis must not invent
 * rows for vocabulary the server never sent.
 *
 * @param {Array}  items Manifest items.
 * @param {string} field Item field holding a term list.
 * @return {Record<string, number>} Count map keyed by term.
 */
export function tallyTermCounts(items, field) {
	const counts = { [FILTER_ALL]: items.length };

	items.forEach((item) => {
		const terms = Array.isArray(item?.[field]) ? item[field] : [];
		terms.forEach((term) => {
			if (!term) {
				return;
			}
			counts[term] = (counts[term] || 0) + 1;
		});
	});

	return counts;
}

/**
 * Tally items per source type, always listing the fixed facet values.
 *
 * @param {Array} items Manifest items.
 * @return {Record<string, number>} Count map keyed by source type.
 */
export function tallySourceTypeCounts(items) {
	const counts = { [FILTER_ALL]: items.length };
	SOURCE_TYPE_SLUGS.forEach((slug) => {
		counts[slug] = 0;
	});

	items.forEach((item) => {
		const sourceType = item?.sourceType;
		if (sourceType) {
			counts[sourceType] = (counts[sourceType] || 0) + 1;
		}
	});

	return counts;
}

/**
 * Use-case terms present in the manifest, canonical order first.
 *
 * @param {Array} items Manifest items.
 * @return {string[]} Ordered use-case terms.
 */
export function collectUseCaseTerms(items) {
	const present = new Set();
	items.forEach((item) => {
		(Array.isArray(item?.useCases) ? item.useCases : []).forEach((term) => {
			if (term) {
				present.add(term);
			}
		});
	});

	const canonical = USE_CASE_SLUGS.filter((slug) => present.has(slug));
	const unknown = Array.from(present)
		.filter((term) => !USE_CASE_SLUGS.includes(term))
		.sort();

	return [...canonical, ...unknown];
}

/**
 * Tags present in the manifest, ordered by frequency then alphabetically.
 *
 * @param {Array}  items   Manifest items.
 * @param {number} [limit] Maximum tags returned.
 * @return {string[]} Ordered tags.
 */
export function collectTags(items, limit = 0) {
	const counts = tallyTermCounts(items, 'tags');
	const tags = Object.keys(counts)
		.filter((tag) => FILTER_ALL !== tag)
		.sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));

	return limit > 0 ? tags.slice(0, limit) : tags;
}

/**
 * Searchable haystack for an item: name, description, tags, keywords.
 *
 * @param {Object} item Manifest item.
 * @return {string} Lower-cased haystack.
 */
function searchHaystack(item) {
	const parts = [item?.name || '', item?.description || ''];

	if (Array.isArray(item?.tags)) {
		parts.push(item.tags.join(' '));
	}
	if (Array.isArray(item?.keywords)) {
		parts.push(item.keywords.join(' '));
	}

	return parts.join(' ').toLowerCase();
}

/**
 * Timestamp used by the "Latest" sort: created, then modified, then ID.
 *
 * @param {Object} item Manifest item.
 * @return {number} Comparable value.
 */
function latestRank(item) {
	const stamp = item?.created || item?.modified || '';
	if (stamp) {
		const parsed = Date.parse(stamp);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}

	const numericId = Number(item?.id);

	return Number.isNaN(numericId) ? 0 : numericId;
}

/**
 * Filter manifest items across every axis (AND between axes, OR within tags).
 *
 * @param {Array}  items   Manifest items.
 * @param {Object} filters { tier, category, useCase, sourceType, tags, search }.
 * @return {Array} Filtered manifest items.
 */
export function filterPatterns(items, filters) {
	const {
		tier = TIER_ALL,
		category = FILTER_ALL,
		useCase = FILTER_ALL,
		sourceType = FILTER_ALL,
		tags = [],
		search = '',
	} = filters;
	const needle = search.trim().toLowerCase();
	const activeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];

	return items.filter((item) => {
		const itemTier = resolveItemTier(item);
		if (TIER_FREE === tier && 'free' !== itemTier) {
			return false;
		}
		if (TIER_PREMIUM === tier && 'pro' !== itemTier) {
			return false;
		}
		if (FILTER_ALL !== category && canonicalizeCategory(item.category) !== category) {
			return false;
		}
		if (FILTER_ALL !== useCase) {
			const itemUseCases = Array.isArray(item.useCases) ? item.useCases : [];
			if (!itemUseCases.includes(useCase)) {
				return false;
			}
		}
		if (FILTER_ALL !== sourceType && item.sourceType !== sourceType) {
			return false;
		}
		if (activeTags.length > 0) {
			const itemTags = Array.isArray(item.tags) ? item.tags : [];
			if (!activeTags.some((tag) => itemTags.includes(tag))) {
				return false;
			}
		}
		if (needle && !searchHaystack(item).includes(needle)) {
			return false;
		}
		return true;
	});
}

/**
 * Sort manifest items.
 *
 * @param {Array}  items Manifest items.
 * @param {string} sort  Sort key.
 * @return {Array} Sorted manifest items.
 */
export function sortPatterns(items, sort) {
	const copy = [...items];
	if (SORT_POPULAR === sort) {
		copy.sort((a, b) => (b.hit || 0) - (a.hit || 0));
		return copy;
	}
	if (SORT_LATEST === sort) {
		copy.sort((a, b) => latestRank(b) - latestRank(a));
		return copy;
	}
	return copy;
}

/**
 * Whether a pattern is favorited.
 *
 * Favorites are stored by durable slug; entries written before that change are
 * plain IDs, so both are matched until the next toggle rewrites them.
 *
 * @param {Array}                favorites Favorited keys (slugs, or legacy IDs).
 * @param {string|number|Object} pattern   Manifest item, or a bare id/slug.
 * @return {boolean} True when favorited.
 */
export function isPatternFavorite(favorites, pattern) {
	const list = favorites || [];
	const keys =
		pattern && 'object' === typeof pattern
			? [pattern.slug, pattern.id].filter((key) => undefined !== key && null !== key && '' !== key)
			: [pattern];

	return list.some((entry) => keys.some((key) => String(entry) === String(key)));
}

/**
 * Compose filter + sort pipeline.
 *
 * @param {Array}  items   Manifest items.
 * @param {Object} options Filter and sort options.
 * @return {Array} Visible patterns after filter and sort.
 */
export function getVisiblePatterns(items, options) {
	const scoped = options.favoritesOnly
		? items.filter((item) => isPatternFavorite(options.favorites, item))
		: items;
	const filtered = filterPatterns(scoped, options);
	return sortPatterns(filtered, options.sort || SORT_DEFAULT);
}
