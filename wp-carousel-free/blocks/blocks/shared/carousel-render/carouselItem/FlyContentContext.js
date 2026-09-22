/**
 * Editor fly-content bubble channel. The provider value is a stable object
 * whose `report(partial)` forwards to the single floating bubble's state
 * updater (held in a ref by `CarouselEdit`). Routing pointer moves through this
 * ref means only the bubble re-renders — not the whole carousel, which would
 * otherwise remount Swiper on every mouse move.
 */

import { createContext } from '@wordpress/element';

const FlyContentContext = createContext(null);

export default FlyContentContext;
