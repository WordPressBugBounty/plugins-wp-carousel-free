/**
 * The block module's own Swiper, captured when its bundle loaded, so another
 * plugin or theme overwriting `window.Swiper` later cannot swap it out.
 *
 * @return {Function|undefined} Swiper constructor.
 */
export function getSwiperConstructor() {
	return window.wpcpfSwiper || window.Swiper;
}
