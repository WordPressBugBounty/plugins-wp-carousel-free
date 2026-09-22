/**
 * Sanitizers for author-supplied item text (title, caption, description, alt, custom URL).
 *
 * Mirrors src/Blocks/Includes/Utils/Item_Text.php rule for rule. The editor
 * renders these values with RawHTML and writes them into `data-caption`, which
 * Fancybox injects with innerHTML, so the editor needs the same allow-list the
 * PHP renderer applies — otherwise the preview and the frontend disagree about
 * what markup survives.
 */

/**
 * Inline formatting tags allowed in a title or caption, mapped to their allowed attributes.
 *
 * Links are excluded on purpose: a title often sits inside a card that is itself
 * a link, and the same string is reused in attribute contexts (alt, aria-label,
 * data-caption) where an anchor is meaningless.
 */
export const ALLOWED_INLINE_TAGS = {
	b: [],
	br: [],
	code: [],
	em: [],
	i: [],
	mark: [],
	small: [],
	span: ['class'],
	strong: [],
	sub: [],
	sup: [],
	s: [],
	u: [],
};

/**
 * Inline tags plus links, allowed in a description.
 *
 * Block-level tags (p, ul, ol, li, blockquote) are absent by design — a
 * description renders inside a `<p>`. Their text content survives; only the tags
 * are dropped.
 */
export const ALLOWED_RICH_TAGS = {
	...ALLOWED_INLINE_TAGS,
	a: ['href', 'title', 'target', 'rel'],
};

/**
 * Tags allowed in a product price, mirroring the `$allowed_html` map in
 * SlotRenderer::render_price() (del/ins/span/bdi with class + style — the
 * shapes WooCommerce's price HTML uses for sale/strikethrough pricing).
 */
export const ALLOWED_PRICE_TAGS = {
	del: ['class', 'style'],
	ins: ['class', 'style'],
	span: ['class', 'style'],
	bdi: ['class', 'style'],
};

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

// Elements whose text content must go too, rather than being unwrapped.
const DROP_ENTIRELY = new Set([
	'SCRIPT',
	'STYLE',
	'TEMPLATE',
	'NOSCRIPT',
	'IFRAME',
	'OBJECT',
	'EMBED',
]);

/**
 * Decide whether an attribute may stay on an allowed element.
 *
 * @param {string}   name         Lower-cased attribute name.
 * @param {string}   value        Attribute value.
 * @param {string[]} allowedNames Attribute names permitted for this element.
 * @return {boolean} True when the attribute survives.
 */
function isAttributeAllowed(name, value, allowedNames) {
	// Every event handler goes, regardless of the element's allow-list.
	if (name.startsWith('on')) {
		return false;
	}
	if (!allowedNames.includes(name)) {
		return false;
	}
	if ('href' === name) {
		return '' !== sanitizeItemUrl(value);
	}
	return true;
}

/**
 * Replace an element with its own child nodes, keeping the visible text.
 *
 * @param {Element} element Element to unwrap.
 * @return {void}
 */
function unwrap(element) {
	const parent = element.parentNode;
	if (!parent) {
		return;
	}
	while (element.firstChild) {
		parent.insertBefore(element.firstChild, element);
	}
	parent.removeChild(element);
}

/**
 * Filter an HTML fragment down to an allow-list of tags and attributes.
 *
 * Parsing goes through `DOMParser`, which produces an inert document: no
 * scripts run, no resources load, and an `<img onerror>` never fires. Assigning
 * to `innerHTML` on a detached element would not be safe here — a detached
 * `<img src=x>` still requests its source and fires `onerror`.
 *
 * @param {string} html    HTML fragment.
 * @param {Object} allowed Tag → allowed attribute names map.
 * @return {string} Sanitized HTML.
 */
function sanitizeHtml(html, allowed) {
	if (!html || 'string' !== typeof html) {
		return '';
	}

	const doc = new window.DOMParser().parseFromString(html, 'text/html');
	const elements = Array.from(doc.body.querySelectorAll('*'));

	// Walk deepest-first so unwrapping a parent cannot skip its children.
	for (let index = elements.length - 1; 0 <= index; index -= 1) {
		const element = elements[index];
		const tagName = element.tagName;

		if (DROP_ENTIRELY.has(tagName)) {
			element.remove();
			continue;
		}

		const allowedNames = allowed[tagName.toLowerCase()];
		if (!allowedNames) {
			unwrap(element);
			continue;
		}

		Array.from(element.attributes).forEach((attribute) => {
			const name = attribute.name.toLowerCase();
			if (!isAttributeAllowed(name, attribute.value, allowedNames)) {
				element.removeAttribute(attribute.name);
			}
		});
	}

	return doc.body.innerHTML.trim();
}

/**
 * Sanitize a title for rendering as HTML.
 *
 * @param {string} value Raw title.
 * @return {string} Sanitized title.
 */
export function sanitizeItemTitle(value) {
	return sanitizeHtml(value, ALLOWED_INLINE_TAGS);
}

/**
 * Sanitize a description for rendering as HTML.
 *
 * @param {string} value Raw description.
 * @return {string} Sanitized description.
 */
export function sanitizeItemDescription(value) {
	return sanitizeHtml(value, ALLOWED_RICH_TAGS);
}

/**
 * Sanitize a caption for rendering as HTML.
 *
 * @param {string} value Raw caption.
 * @return {string} Sanitized caption.
 */
export function sanitizeItemCaption(value) {
	return sanitizeHtml(value, ALLOWED_INLINE_TAGS);
}

/**
 * Sanitize a product price for rendering as HTML — mirrors SlotRenderer's
 * wp_kses() allow-list so the editor preview shows the same markup the
 * frontend emits.
 *
 * @param {string} value Raw price HTML (e.g. WooCommerce get_price_html()).
 * @return {string} Sanitized price.
 */
export function sanitizeItemPrice(value) {
	return sanitizeHtml(value, ALLOWED_PRICE_TAGS);
}

/**
 * Reduce a value to plain text, for attribute-only sinks such as `alt`.
 *
 * @param {string} value Raw text.
 * @return {string} Plain text.
 */
export function sanitizeItemPlainText(value) {
	if (!value || 'string' !== typeof value) {
		return '';
	}
	const doc = new window.DOMParser().parseFromString(value, 'text/html');

	// `textContent` would otherwise surface script/style source as visible text.
	doc.body.querySelectorAll([...DROP_ENTIRELY].join(',')).forEach((element) => element.remove());

	return (doc.body.textContent || '').trim();
}

/**
 * Per-key sanitizer for the author-editable text fields on an item.
 *
 * Keys absent from an item are left absent — the popups spread partial payloads.
 */
const ITEM_TEXT_SANITIZERS = {
	title: sanitizeItemTitle,
	description: sanitizeItemDescription,
	caption: sanitizeItemCaption,
	alt: sanitizeItemPlainText,
	image_alt: sanitizeItemPlainText,
	customUrl: sanitizeItemUrl,
};

/**
 * Filter every author-editable text field on an item payload.
 *
 * Used by the item-edit popups so the value written into the `items` attribute
 * already matches what the PHP renderer will emit. The renderer filters again —
 * post content is editable outside these popups — but sanitizing here keeps the
 * two in step and shows the author what survives.
 *
 * @param {Object} item Item payload.
 * @return {Object} Payload with its text fields sanitized.
 */
export function sanitizeItemTextFields(item) {
	if (!item || 'object' !== typeof item) {
		return item;
	}

	const sanitized = { ...item };

	Object.keys(ITEM_TEXT_SANITIZERS).forEach((key) => {
		if ('string' === typeof sanitized[key]) {
			sanitized[key] = ITEM_TEXT_SANITIZERS[key](sanitized[key]);
		}
	});

	return sanitized;
}

/**
 * Sanitize an author-supplied item URL.
 *
 * Returns an empty string for anything outside the protocol allow-list, so a
 * `javascript:` or `data:` link becomes no link rather than a live one.
 *
 * @param {string} value Raw URL.
 * @return {string} Safe URL, or an empty string.
 */
export function sanitizeItemUrl(value) {
	if (!value || 'string' !== typeof value) {
		return '';
	}

	// Browsers discard control characters inside a URL, so `java<TAB>script:` is
	// `javascript:` by the time it runs. Drop them before anything else.
	/* eslint-disable-next-line no-control-regex */
	const trimmed = value.trim().replace(/[\u0000-\u001F\u007F]/g, '');
	if ('' === trimmed) {
		return '';
	}

	// The HTML parser decodes entities before the URL is used, so the scheme has
	// to be read from the decoded form — `javascript&colon;alert(1)` and
	// `javascript:alert(1)` are the same link. Only the probe is decoded; the
	// value returned keeps its original encoding.
	const probe = sanitizeItemPlainText(trimmed) || trimmed;

	// No recognisable scheme: a relative, protocol-relative, fragment or
	// query-only link, none of which can execute script.
	if (!/^[a-z][a-z0-9+.-]*:/i.test(probe)) {
		return trimmed;
	}

	const scheme = `${probe.slice(0, probe.indexOf(':'))}:`.toLowerCase();

	return ALLOWED_PROTOCOLS.includes(scheme) ? trimmed : '';
}
