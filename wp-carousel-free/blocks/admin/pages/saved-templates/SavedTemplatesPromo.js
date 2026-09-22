import { __ } from '@wordpress/i18n';
import { PlusIcon } from './icons';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;

const addNewUrl = wpcpf?.homeUrl
	? `${wpcpf.homeUrl.replace(
			/\/$/,
			''
	  )}/wp-admin/post-new.php?post_type=sp_wpcp_template&wpcpblock_inserter=true`
	: '#';

const promoArtwork = `${wpcpf?.pluginUrl || ''}src/Admin/img/saved-template-promo.png`;

export const SavedTemplatesPromo = () => (
	<div className="wpcpf-saved-template-promo" style={{ backgroundImage: `url(${promoArtwork})` }}>
		<div className="wpcpf-saved-template-promo__text">
			<div className="wpcpf-saved-template-promo__title-wrap">
				<h2 className="wpcpf-saved-template-promo__title">
					{__('Create Reusable Templates', 'wp-carousel-free')}
				</h2>
				<p className="wpcpf-saved-template-promo__desc">
					{__(
						'Create a carousel/gallery once and reuse it anywhere with a shortcode — pages, posts, widgets, or page builders like Elementor and Divi.',
						'wp-carousel-free'
					)}
				</p>
			</div>
			<a href={addNewUrl} rel="noreferrer" className="wpcpf-saved-template-promo__cta">
				<PlusIcon />
				{__('Create a Saved Template', 'wp-carousel-free')}
			</a>
		</div>
	</div>
);
