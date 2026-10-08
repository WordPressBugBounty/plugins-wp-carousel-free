/**
 * Pro card badge — crown pinned to a locked card's top-right corner, always
 * visible, with an "Upgrade to Pro" tooltip revealed on card hover.
 *
 * Sits inside a `.wpcp-pro-locked` card, which owns the click.
 */

import { __ } from '@wordpress/i18n';
import ProBadge from './proBadge';
import './editor.scss';

const ProCardBadge = () => (
	<>
		<ProBadge iconOnly isStatic className="wpcp-pro-badge--corner" />
		<span className="wpcp-pro-card-tooltip">{__('Upgrade to Pro', 'wp-carousel-free')}</span>
	</>
);

export default ProCardBadge;
