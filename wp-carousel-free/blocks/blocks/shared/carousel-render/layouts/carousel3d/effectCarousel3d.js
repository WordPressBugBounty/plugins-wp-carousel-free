/**
 * Editor-preview registration of the 3D Carousel effect.
 *
 * `swiper/react` takes a module function in its `modules` array; the module
 * itself is built in `shared/utils/carousel3dEffectModule.js`, which the
 * frontend runtime registers too.
 */

import { createCarousel3dEffectModule } from '../../../utils/carousel3dEffectModule';

export default createCarousel3dEffectModule();
