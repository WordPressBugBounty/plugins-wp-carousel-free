/**
 * Global Lightbox extension — WP core images: refresh Fancybox + image-link → icon click.
 */
( function () {
	const config = typeof window.wpcp_lightbox === 'object' ? window.wpcp_lightbox : null;

	const refreshFancybox = () => {
		if ( typeof window.Fancybox !== 'undefined' && window.Fancybox.refresh ) {
			window.Fancybox.refresh();
		}
	};

	const bindWpImageLinkClicks = () => {
		document.querySelectorAll( '.wpcp-wp-lightbox-host' ).forEach( ( host ) => {
			const icon = host.querySelector( '.wpcp-advanced-image-lightbox-icon' );
			if ( ! icon ) {
				return;
			}
			host.querySelectorAll( 'a.wpcp-wp-lightbox-image-link' ).forEach( ( link ) => {
				if ( link.dataset.wpcpWpLbBound === '1' ) {
					return;
				}
				link.dataset.wpcpWpLbBound = '1';
				link.addEventListener( 'click', ( event ) => {
					event.preventDefault();
					icon.click();
				} );
			} );
		} );
	};

	const initWpLightbox = () => {
		bindWpImageLinkClicks();
		refreshFancybox();
	};

	if ( config && config.wpImages ) {
		if ( document.readyState === 'loading' ) {
			document.addEventListener( 'DOMContentLoaded', initWpLightbox );
		} else {
			initWpLightbox();
		}
		window.addEventListener( 'load', initWpLightbox );
	}
} )();
