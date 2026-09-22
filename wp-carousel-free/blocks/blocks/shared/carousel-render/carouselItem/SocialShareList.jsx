/**
 * Social share icon list for one item — markup mirrors the frontend
 * `SocialShareRenderer` so editor styling stays aligned.
 */

import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { SOCIAL_ICON_KEYS } from '../constants';

const EMPTY_SOCIAL_ICONS = Object.freeze({});

function getSocialUrl(platform, encodedPermalink) {
	switch (platform) {
		case 'facebook':
			return `https://www.facebook.com/sharer/sharer.php?u=${encodedPermalink}`;
		case 'x':
			return `https://twitter.com/intent/tweet?url=${encodedPermalink}`;
		case 'linkedin':
		case 'linkedin-in':
			return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedPermalink}`;
		case 'pinterest':
			return `https://pinterest.com/pin/create/button/?url=${encodedPermalink}`;
		case 'instagram':
			return `https://www.instagram.com/?url=${encodedPermalink}`;
		case 'vkontakte':
			return `https://vk.com/share.php?url=${encodedPermalink}`;
		case 'digg':
			return `http://digg.com/submit?url=${encodedPermalink}`;
		case 'tumblr':
			return `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodedPermalink}`;
		case 'reddit':
			return `https://www.reddit.com/submit?url=${encodedPermalink}`;
		case 'whatsapp':
			return `https://api.whatsapp.com/send?text=${encodedPermalink}`;
		case 'pocket':
			return `https://getpocket.com/save?url=${encodedPermalink}`;
		case 'xing':
			return `https://www.xing.com/spi/shares/new?url=${encodedPermalink}`;
		case 'mail':
			return `mailto:?subject=&body=${encodedPermalink}`;
		default:
			return encodedPermalink;
	}
}

function renderIcon(icon, fallback) {
	return icon?.path ? (
		<svg viewBox={icon.viewBox} width={icon.width || 20} height={icon.height || 20}>
			<path d={icon.path} />
		</svg>
	) : (
		<span>{fallback}</span>
	);
}

function preventEditorClick(event) {
	event.preventDefault();
}

/**
 * @param {Object}   props
 * @param {string[]} props.networks
 * @param {string}   props.permalink
 * @param {string}   props.iconView
 * @param {boolean}  props.customStyling
 * @param {boolean}  props.isEditor
 * @param {Object}   props.socialIcons
 */
function SocialShareList({
	networks,
	permalink,
	iconView,
	customStyling,
	isEditor,
	socialIcons = EMPTY_SOCIAL_ICONS,
}) {
	const encodedPermalink = encodeURIComponent(permalink || '');

	return (
		<ul
			className={classNames('wpcp-item-social', 'wpcp-social-share', {
				'icon-only': iconView === 'normal',
				'icon-round': iconView === 'stacked' || iconView === 'round',
				'icon-square': iconView === 'square',
				'icon-framed': iconView === 'framed',
				'original-css': !customStyling,
			})}
			data-component="social_share"
		>
			{networks.map((network) => {
				const socialUrl = isEditor ? '' : getSocialUrl(network, encodedPermalink);
				const iconKey = SOCIAL_ICON_KEYS[network];
				const icon = socialIcons[iconKey];

				return (
					<li key={network} className="wpcp-social-share-icon" style={{ pointerEvents: 'all' }}>
						{network === 'clone' ? (
							<span className="wpcp-copy-url-area">
								{/*
								 * Mirrors the frontend markup (SocialShareRenderer): the copy
								 * control is an <a href="#"> the frontend script binds to. The
								 * editor preview must match it, so the anchor-as-button a11y
								 * rule is intentionally suppressed here.
								 */}
								{/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
								<a
									href="#"
									title={__('Copy post URL', 'wp-carousel-free')}
									className="wpcp-social-share-link wpcp-copy-btn wpcp-share-btn wpcp-share-clone"
									data-url={permalink}
									data-action="copy"
									onClick={preventEditorClick}
								>
									{renderIcon(icon, 'C')}
									<div className="wpcp-post-url-copy-popup wpcp-d-hidden">
										{__('Copied!', 'wp-carousel-free')}
									</div>
								</a>
							</span>
						) : (
							<a
								href={socialUrl}
								target="_blank"
								rel="noopener noreferrer"
								className={classNames('wpcp-social-share-link', 'wpcp-share-btn', `wpcp-share-${network}`)}
								title={network.charAt(0).toUpperCase() + network.slice(1)}
								data-action="share"
								onClick={preventEditorClick}
							>
								{renderIcon(icon, network.charAt(0).toUpperCase())}
							</a>
						)}
					</li>
				);
			})}
		</ul>
	);
}

export default memo(SocialShareList);
