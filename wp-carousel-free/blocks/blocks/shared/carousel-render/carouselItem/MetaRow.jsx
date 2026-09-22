/**
 * Post/product meta row (date • author • category …) with a configurable
 * separator. Visibility must be decided by the caller: rendering this
 * component always emits the `.wpcp-item-meta` wrapper.
 */

import { Fragment } from '@wordpress/element';
import { formatDate } from '../../utils/formatters';

// Dash/Pipe/Slash/Back Slash are Pro; AllowedValues::meta_separator() already
// snaps a saved value back to `bullet` on the PHP side, so only these two exist here.
const META_SEPARATORS = {
	bullet: ' • ',
	none: ' ',
};

/**
 * Build comma-separated linked taxonomy labels for the meta row.
 *
 * @param {string}   namesText     Comma-separated term names.
 * @param {string[]} linkUrls      Archive URLs aligned with each name.
 * @param {boolean}  linkToArchive Whether archive links are enabled.
 * @return {import('react').ReactNode[]} Linked or plain taxonomy name nodes.
 */
function renderMetaTaxonomyLinks(namesText, linkUrls, linkToArchive) {
	const names = String(namesText || '')
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);
	const urls = Array.isArray(linkUrls) ? linkUrls : [];

	return names.map((name, index) => {
		const href = linkToArchive ? urls[index] || '' : '';

		if (href) {
			return (
				<a key={`${name}-${index}`} href={href} className="wpcp-item-meta__link">
					{name}
				</a>
			);
		}

		return <Fragment key={`${name}-${index}`}>{name}</Fragment>;
	});
}

/**
 * Resolve visible meta parts for an item, honoring the configured order.
 * Returns an empty array when nothing is visible so the caller can skip the
 * row (and its content slot wrapper) entirely.
 *
 * @param {Object}   item          Preview item.
 * @param {string[]} metaItems     Enabled meta keys (`metaOptions.showMeta`).
 * @param {boolean}  besideMeta    True when taxonomy renders inside the meta row.
 * @param {boolean}  linkToArchive Link post meta to WordPress archives.
 * @return {Array<{ key: string, content: import('react').ReactNode }>} Visible meta parts in order.
 */
export function getVisibleMetaParts(item, metaItems, besideMeta, linkToArchive = true) {
	const extra = item?.extra || {};
	const parts = [];

	metaItems.forEach((key) => {
		switch (key) {
			case 'date': {
				const text = formatDate(extra.date) || '';
				if (!text.trim()) {
					break;
				}
				parts.push({
					key,
					content:
						linkToArchive && extra.date_link ? (
							<a href={extra.date_link} className="wpcp-item-meta__link">
								{text}
							</a>
						) : (
							text
						),
				});
				break;
			}
			case 'author': {
				const text = extra.author || '';
				if (!text.trim()) {
					break;
				}
				parts.push({
					key,
					content:
						linkToArchive && extra.author_url ? (
							<a href={extra.author_url} className="wpcp-item-meta__link">
								{text}
							</a>
						) : (
							text
						),
				});
				break;
			}
			case 'category': {
				if (!besideMeta) {
					break;
				}
				const text = extra.category || '';
				if (!text.trim()) {
					break;
				}
				const labels = renderMetaTaxonomyLinks(text, extra.category_links, linkToArchive);
				parts.push({
					key,
					content: labels.reduce((acc, label, index) => {
						if (index > 0) {
							acc.push(', ');
						}
						acc.push(label);
						return acc;
					}, []),
				});
				break;
			}
			case 'tags': {
				const text = extra.tag || '';
				if (!text.trim()) {
					break;
				}
				const labels = renderMetaTaxonomyLinks(text, extra.tag_links, linkToArchive);
				parts.push({
					key,
					content: labels.reduce((acc, label, index) => {
						if (index > 0) {
							acc.push(', ');
						}
						acc.push(label);
						return acc;
					}, []),
				});
				break;
			}
			case 'comments': {
				if (extra.comment_count === undefined || extra.comment_count === null) {
					break;
				}
				const text = String(extra.comment_count);
				if (!text.trim()) {
					break;
				}
				parts.push({
					key,
					content:
						linkToArchive && extra.comments_link ? (
							<a href={extra.comments_link} className="wpcp-item-meta__link">
								{text}
							</a>
						) : (
							text
						),
				});
				break;
			}
			case 'views': {
				if (extra.views === undefined || extra.views === null) {
					break;
				}
				const text = String(extra.views);
				if (!text.trim()) {
					break;
				}
				parts.push({ key, content: text });
				break;
			}
			default:
				break;
		}
	});

	return parts;
}

/**
 * @param {Object}                                                     props
 * @param {Array<{ key: string, content: import('react').ReactNode }>} props.parts        Visible meta parts.
 * @param {string}                                                     props.separatorKey `metaOptions.separator` value.
 */
export default function MetaRow({ parts, separatorKey }) {
	const separator = (
		<span className="wpcp-meta-separator">{META_SEPARATORS[separatorKey] || ' • '}</span>
	);

	return (
		<div className="wpcp-item-meta">
			{parts.map((part, index) => (
				<Fragment key={part.key}>
					<span className="wpcp-item-meta__part">{part.content}</span>
					{parts.length - 1 !== index && separator}
				</Fragment>
			))}
		</div>
	);
}
