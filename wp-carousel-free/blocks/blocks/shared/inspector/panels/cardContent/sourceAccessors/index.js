/**
 * Source-routed Style-tab accessor selector for the Card Content panel.
 *
 * The card-content attribute containers never unify (no-migration is a hard
 * requirement), so routing is a permanent per-source contract. Each source
 * family lifts its entire former Style-tab setter block verbatim; this selector
 * picks the right one and returns a uniform accessor bundle the shared Style tab
 * consumes. Keeping the bundles whole per source (rather than a per-concern
 * switch) preserves all four routing laws — typography dual-write, color mirror,
 * margin fallback, and the source-divergent apply-to-all fan-out.
 *
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Gutenberg setter.
 * @return {Object} Uniform Style-tab accessor bundle for the active source.
 */
import { createImageAccessor } from './image';
import { createPostAccessor } from './post';
import { createProductAccessor } from './product';

const POST_FAMILY_SOURCES = ['post', 'video'];

export function bySource(attributes, setAttributes) {
	const sourceType = attributes?.sourceType || 'image';

	if ('product' === sourceType) {
		return createProductAccessor(attributes, setAttributes);
	}

	if (POST_FAMILY_SOURCES.includes(sourceType)) {
		return createPostAccessor(attributes, setAttributes);
	}

	// image / audio / document
	return createImageAccessor(attributes, setAttributes);
}
