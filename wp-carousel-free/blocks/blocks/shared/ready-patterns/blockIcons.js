/**
 * Ready Patterns — per-block sidebar icons.
 */

import CarouselIcon from '../../carousel/icon';
import { Carousel3DBlockIcon } from '../../carousel-3d/icon';
import { PanoramaBlockIcon } from '../../carousel-panorama/icon';
import { GridBlockIcon } from '../../grid/icon';
import { JustifiedBlockIcon } from '../../justified/icon';
import { MarqueeBlockIcon } from '../../marquee/icon';
import { MasonryBlockIcon } from '../../masonry/icon';
import { SliderBlockIcon } from '../../slider/icon';
import { ThumbSliderBlockIcon } from '../../thumbnails-slider/icon';
import { TilesBlockIcon } from '../../tiles/icon';

export const CATEGORY_ICONS = {
	carousel: CarouselIcon,
	'carousel-3d': Carousel3DBlockIcon,
	'carousel-panorama': PanoramaBlockIcon,
	marquee: MarqueeBlockIcon,
	slider: SliderBlockIcon,
	'thumbnails-slider': ThumbSliderBlockIcon,
	tiles: TilesBlockIcon,
	grid: GridBlockIcon,
	masonry: MasonryBlockIcon,
	justified: JustifiedBlockIcon,
};
