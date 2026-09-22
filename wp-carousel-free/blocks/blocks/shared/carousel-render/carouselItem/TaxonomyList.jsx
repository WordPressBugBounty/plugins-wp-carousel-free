/**
 * Taxonomy chips for one item (categories / tags / brands). Visibility must
 * be decided by the caller: rendering this component always emits the
 * `.wpcp-taxonomy-wrapper` element.
 */

const decodeHtmlEntities = (value) =>
	String(value || '')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');

/**
 * @param {Object} props
 * @param {string} props.taxonomyText Comma-separated term names.
 */
export default function TaxonomyList({ taxonomyText }) {
	const taxonomyEl = taxonomyText.split(',').map((tax, i) => (
		<span key={i} className="wpcp-item-taxonomy">
			{decodeHtmlEntities(tax).trim()}
		</span>
	));
	return <div className="wpcp-taxonomy-wrapper">{taxonomyEl}</div>;
}
