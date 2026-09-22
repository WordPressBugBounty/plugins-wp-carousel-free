/**
 * Shared help/validation text for the "Custom CSS Class(es)" / "Custom CSS ID"
 * Advanced fields. Renderers silently sanitize these author values, so the
 * editor surfaces both steady guidance and a warning the moment the value holds
 * characters the frontend would drop (or that would break the id).
 *
 * Mirrors the PHP sanitization:
 *  - class: sanitize_html_class() per space-separated token (strips non-word)
 *  - id (carousel): preg_replace( '/[^a-zA-Z0-9_-]/', '' )
 */

import { __ } from '@wordpress/i18n';

// Class allows spaces (they separate multiple classes); id does not.
export const CSS_CLASS_INVALID = /[^A-Za-z0-9_\- ]/;
export const CSS_ID_INVALID = /[^A-Za-z0-9_-]/;

export const cssClassGuidance = () =>
	__(
		'Add custom CSS class names for additional styling. Separate multiple classes with spaces.',
		'wp-carousel-free'
	);

export const cssIdGuidance = () =>
	__(
		'Add a unique CSS ID to target this block with custom CSS or JavaScript. The ID must be unique on the page.',
		'wp-carousel-free'
	);

export const cssClassWarning = () =>
	__(
		'Enter valid CSS class names without the period (.). Separate multiple classes with spaces, and use only letters, numbers, hyphens (-), and underscores (_).',
		'wp-carousel-free'
	);

export const cssIdWarning = () =>
	__(
		'Enter a unique CSS ID without the hash (#). Use only letters, numbers, hyphens (-), and underscores (_), and do not include spaces.',
		'wp-carousel-free'
	);

/**
 * Build the `help` node for a CSS-identifier field.
 *
 * @param {string} value          Current field value.
 * @param {RegExp} invalidPattern Pattern matching a character that won't survive.
 * @param {string} guidance       Steady note shown when the value is clean.
 * @param {string} warning        Validation message shown when the value is invalid.
 * @return {string|JSX.Element} Plain guidance, or a warning node when invalid.
 */
export function cssFieldHelp(value, invalidPattern, guidance, warning) {
	if (value && invalidPattern.test(value)) {
		return (
			<span className="wpcp-field-warning" style={{ color: '#cc1818' }}>
				{warning}
			</span>
		);
	}
	return guidance;
}
