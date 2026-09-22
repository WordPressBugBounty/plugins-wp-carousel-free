import { __ } from '@wordpress/i18n';

/**
 * Closing note under a drawer's Pro rows, pointing at the pricing page.
 *
 * @param {Object} props
 * @param {string} props.text   Lead-in sentence.
 * @param {string} [props.href] Pricing page. Omit to render the note without a link.
 */
export default function ModuleDrawerProNote({ text, href = '' }) {
	const cta = __('Upgrade to Pro!', 'wp-carousel-free');

	return (
		<div className="wpcp-module-drawer-pro-note">
			<p className="wpcp-module-drawer-pro-note__text">
				{text}{' '}
				{href ? (
					<a
						className="wpcp-module-drawer-pro-note__cta"
						href={href}
						target="_blank"
						rel="noopener noreferrer"
					>
						{cta}
					</a>
				) : (
					<strong className="wpcp-module-drawer-pro-note__cta">{cta}</strong>
				)}
			</p>
		</div>
	);
}
