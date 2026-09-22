/**
 * Resets donor-site query selections to schema defaults before pattern insert.
 */

import { PRO_TAXONOMY_KEYS, resolveQueryFilter } from '../constants/freeValues';
import { isWpcpBlockName } from './patternBlockAllowList';

/**
 * Query keys that identify the *donor* site rather than the pattern's design.
 *
 * Term ids mean something different on every site, and Filter by Taxonomy is
 * Pro, so these are dropped on insert. Everything else — post types, the filter
 * mode, ordering, limit — is the pattern's design and survives.
 */
export const DONOR_QUERY_OPTION_KEYS = PRO_TAXONOMY_KEYS;

/** Mirrors CarouselBaseSchema queryOptions defaults. */
export const QUERY_OPTIONS_DEFAULTS = {
	postTypes: ['post'],
	filter: 'latest',
	offset: 0,
	limit: 10,
	orderBy: 'date',
	order: 'DESC',
};

/**
 * Drop the donor-identity keys of a pattern's `queryOptions`, keeping its design.
 *
 * A filter mode Free cannot render selects on inputs that are gone, so it falls
 * back to `latest` rather than shipping a filter that silently matches
 * everything — the same collapse `AllowedValues` performs on read.
 *
 * @param {Object} queryOptions Query options branch from the pattern payload.
 * @return {Object} Query options with the donor selections removed.
 */
function sanitizeQueryOptions(queryOptions) {
	const next = { ...queryOptions };

	DONOR_QUERY_OPTION_KEYS.forEach((key) => {
		delete next[key];
	});

	if (undefined !== next.filter) {
		next.filter = resolveQueryFilter(next.filter);
	}

	return next;
}

function isNumericPatternItemId(id) {
	if ('number' === typeof id) {
		return Number.isFinite(id);
	}

	if ('string' !== typeof id) {
		return false;
	}

	return /^\d+$/.test(id.trim());
}

function sanitizeImageItems(items) {
	if (!Array.isArray(items)) {
		return items;
	}

	return items.reduce((nextItems, item, index) => {
		if (!item || 'object' !== typeof item) {
			nextItems.push(item);
			return nextItems;
		}

		if (!isNumericPatternItemId(item.id)) {
			nextItems.push(item);
			return nextItems;
		}

		const url = 'string' === typeof item.url ? item.url.trim() : '';

		if (!url) {
			return nextItems;
		}

		nextItems.push({
			...item,
			id: `wpcp-remote-image-${index}`,
			url,
		});

		return nextItems;
	}, []);
}

/**
 * Sanitize parsed pattern attributes before applying to the editor block.
 *
 * @param {Object} attributes Parsed block attributes from the pattern payload.
 * @return {Object} Sanitized attributes.
 */
export function sanitizePatternAttributes(attributes) {
	if (!attributes || 'object' !== typeof attributes) {
		return attributes;
	}

	const next = { ...attributes };

	// parse() fills schema defaults, so patterns always carry uniqueId (usually "").
	// The target block must keep its own id — per-instance CSS is scoped to it.
	delete next.uniqueId;

	if (next.queryOptions && 'object' === typeof next.queryOptions) {
		next.queryOptions = sanitizeQueryOptions(next.queryOptions);
	}

	if ('image' === next.sourceType && Array.isArray(next.items)) {
		next.items = sanitizeImageItems(next.items);
	}

	return next;
}

/**
 * Whether a block's own attributes describe demo images the user should replace.
 *
 * Computed per block, not once for the payload: a composite may pair an
 * image-source carousel with a post-source one.
 *
 * @param {Object} attributes Sanitized block attributes.
 * @return {boolean} True when the block carries demo images.
 */
function carriesDemoImages(attributes) {
	return (
		'image' === attributes?.sourceType &&
		Array.isArray(attributes?.items) &&
		attributes.items.length > 0
	);
}

/**
 * Sanitize every `wp-carousel-pro/*` block in a parsed pattern tree.
 *
 * Allow-listed core wrappers are returned untouched — by reference when nothing
 * below them changed — so authored headings, copy, and images insert verbatim.
 *
 * @param {Array} blocks Parsed blocks.
 * @return {Array} Blocks with WPCP attributes sanitized.
 */
export function sanitizePatternTree(blocks) {
	if (!Array.isArray(blocks)) {
		return blocks;
	}

	let treeChanged = false;

	const sanitized = blocks.map((block) => {
		const hasInner = Array.isArray(block?.innerBlocks) && block.innerBlocks.length > 0;
		const innerBlocks = hasInner ? sanitizePatternTree(block.innerBlocks) : block?.innerBlocks;

		if (!isWpcpBlockName(block?.name)) {
			if (innerBlocks === block?.innerBlocks) {
				return block;
			}
			treeChanged = true;
			return { ...block, innerBlocks };
		}

		const attributes = sanitizePatternAttributes(block.attributes) || {};
		attributes.patternDemo = carriesDemoImages(attributes);
		treeChanged = true;

		return { ...block, attributes, innerBlocks };
	});

	return treeChanged ? sanitized : blocks;
}
