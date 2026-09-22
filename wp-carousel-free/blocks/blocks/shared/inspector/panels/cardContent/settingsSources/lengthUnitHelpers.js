/**
 * Maps description-length schema units (`word` | `char`) to SPRangeControl unit
 * button labels (same pattern as px / % / em on spacing controls).
 */

export const DESCRIPTION_LENGTH_UNIT_LABELS = ['Words', 'Chars'];

/** @param {'word'|'char'|'letter'|string} unit */
export const descriptionLengthUnitToLabel = (unit) =>
	'char' === unit || 'letter' === unit ? 'Chars' : 'Words';

/** @param {string} label */
export const descriptionLengthLabelToUnit = (label) => ('Chars' === label ? 'char' : 'word');

/**
 * @param {number}                        limit
 * @param {'word'|'char'|'letter'|string} unit
 */
export const descriptionLengthRangeAttributes = (limit, unit) => ({
	value: limit,
	unit: descriptionLengthUnitToLabel(unit),
});
