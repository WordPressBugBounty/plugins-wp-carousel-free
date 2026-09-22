import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Layouts } from '@wp-carousel-pro/components';
import {
	CoverflowLayoutIcon,
	CubeLayoutIcon,
	FadeLayoutIcon,
	FashionLayoutIcon,
	FlipLayoutIcon,
	KenBurnsLayoutIcon,
	ShadersLayoutIcon,
	ShuttersLayoutIcon,
	SlicerLayoutIcon,
	SlideLayoutIcon,
	SuperFlowLayoutIcon,
} from '../../../slider/icon';

const ITEMS = [
	{
		icon: <SlideLayoutIcon />,
		value: 'slide',
		tooltip: __('Slide', 'wp-carousel-free'),
		label: __('Slide', 'wp-carousel-free'),
	},
	{
		icon: <FlipLayoutIcon />,
		value: 'flip',
		tooltip: __('Flip', 'wp-carousel-free'),
		label: __('Flip', 'wp-carousel-free'),
	},
	{
		icon: <CoverflowLayoutIcon />,
		value: 'coverflow',
		tooltip: __('Coverflow', 'wp-carousel-free'),
		label: __('Coverflow', 'wp-carousel-free'),
	},
	{
		icon: <CubeLayoutIcon />,
		value: 'cube',
		tooltip: __('Cube', 'wp-carousel-free'),
		label: __('Cube', 'wp-carousel-free'),
	},
	{
		icon: <FadeLayoutIcon />,
		value: 'fade',
		onlyPro: true,
		tooltip: __('Fade', 'wp-carousel-free'),
		label: __('Fade', 'wp-carousel-free'),
	},
	{
		icon: <SuperFlowLayoutIcon />,
		value: 'super-flow',
		onlyPro: true,
		tooltip: __('Super Flow', 'wp-carousel-free'),
		label: __('Super Flow', 'wp-carousel-free'),
	},
	{
		icon: <ShadersLayoutIcon />,
		value: 'shaders',
		onlyPro: true,
		tooltip: __('Shaders', 'wp-carousel-free'),
		label: __('Shaders', 'wp-carousel-free'),
	},
	{
		icon: <KenBurnsLayoutIcon />,
		value: 'ken-burns',
		onlyPro: true,
		tooltip: __('Ken Burns', 'wp-carousel-free'),
		label: __('Ken Burns', 'wp-carousel-free'),
	},
	{
		icon: <ShuttersLayoutIcon />,
		value: 'shutters',
		onlyPro: true,
		tooltip: __('Shutters', 'wp-carousel-free'),
		label: __('Shutters', 'wp-carousel-free'),
	},
	{
		icon: <SlicerLayoutIcon />,
		value: 'slicer',
		onlyPro: true,
		tooltip: __('Slicer', 'wp-carousel-free'),
		label: __('Slicer', 'wp-carousel-free'),
	},
	{
		icon: <FashionLayoutIcon />,
		value: 'fashion',
		onlyPro: true,
		tooltip: __('Fashion', 'wp-carousel-free'),
		label: __('Fashion', 'wp-carousel-free'),
	},
];

const SliderLayouts = ({
	attributes,
	setAttributes,
	attributesKey,
	label = '',
	onChange = false,
}) => (
	<Layouts
		attributes={attributes}
		setAttributes={setAttributes}
		attributesKey={attributesKey}
		displayActive={true}
		grid={3}
		className="wpcp-slider-layouts"
		label={label}
		onChange={onChange}
		items={ITEMS}
	/>
);

export default memo(SliderLayouts);
