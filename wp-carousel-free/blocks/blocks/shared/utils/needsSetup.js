/**
 * Determines if a newly inserted block still needs source configuration.
 *
 * @param {Object} attributes - Block attributes
 * @return {boolean}        - True if block needs source setup
 */
export function needsSetup(attributes) {
	const { sourceType, items } = attributes || {};
	if (sourceType === 'post' || sourceType === 'product') {
		return false;
	}
	if ((sourceType === 'image' || sourceType === 'video') && (!items || items.length === 0)) {
		return true;
	}
	return !sourceType;
}
