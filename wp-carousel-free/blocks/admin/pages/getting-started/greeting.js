/**
 * Time-of-day greeting for the welcome card (ported from Logo Carousel).
 */

import { __ } from '@wordpress/i18n';

/**
 * A greeting for the given 24h hour.
 *
 * @param {number} hour Hour of day, 0–23.
 * @return {string} Localized greeting.
 */
export function getGreeting(hour) {
	if (hour < 12) {
		return __('Good morning', 'wp-carousel-free');
	}

	if (hour < 18) {
		return __('Good afternoon', 'wp-carousel-free');
	}

	return __('Good evening', 'wp-carousel-free');
}

/**
 * A display name with each word's first letter capitalised ("john doe" → "John Doe");
 * the rest is left as typed, so "McDonald" keeps its capitals.
 *
 * @param {string} name Display name.
 * @return {string} Name for the greeting.
 */
export function capitalizeName(name) {
	return String(name || '')
		.trim()
		.replace(/(^|[\s-])(\p{L})/gu, (match, before, letter) => before + letter.toLocaleUpperCase());
}

/**
 * The name a greeting addresses the user by: the profile's First Name when set,
 * otherwise the display name's first word ("jahirul islam" → "Jahirul").
 *
 * @param {string} firstName   Profile First Name; may be empty.
 * @param {string} displayName Display name, the fallback.
 * @return {string} First name, capitalised; empty when neither is set.
 */
export function getFirstName(firstName, displayName) {
	const first = String(firstName || '').trim();

	if (first) {
		return capitalizeName(first);
	}

	return capitalizeName(
		String(displayName || '')
			.trim()
			.split(/\s+/)[0]
	);
}
