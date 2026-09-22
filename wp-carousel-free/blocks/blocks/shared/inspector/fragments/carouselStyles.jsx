/**
 * Carousel style picker (visual layout cards, same pattern as content orientations).
 *
 * Which blocks draw this picker, and which of these cards it offers, live in
 * `shared/constants/carouselStyles.js` — block transforms read the same answer
 * to decide whether a style can be carried onto the target.
 */

import { memo } from '@wordpress/element';
import { Layouts } from '@wp-carousel-pro/components';
import {
	CarouselStyleStandardIcon,
	CarouselStyleCenterIcon,
	CarouselStyleMultiRowIcon,
	CarouselStyleTripleIcon,
	CarouselStyleSpringIcon,
	CarouselStylePartialViewIcon,
} from '@wp-carousel-pro/icons/carouselStyleIcons';

const CarouselStyles = ({
	label = '',
	attributes,
	setAttributes,
	attributesKey,
	onChange = false,
}) => {
	const items = [
		{
			icon: <CarouselStyleStandardIcon value={attributes} />,
			value: 'standard',
			tooltip: 'Standard',
		},
		{
			icon: <CarouselStyleCenterIcon value={attributes} />,
			value: 'center',
			tooltip: 'Center',
		},
		{
			icon: <CarouselStyleMultiRowIcon value={attributes} />,
			value: 'multirow',
			onlyPro: true,
			tooltip: 'MultiRow',
		},

		{
			icon: <CarouselStyleTripleIcon value={attributes} />,
			value: 'triple',
			onlyPro: true,
			tooltip: 'Triple',
		},
		{
			icon: <CarouselStyleSpringIcon value={attributes} />,
			value: 'spring',
			onlyPro: true,
			tooltip: 'Spring',
		},
		{
			icon: <CarouselStylePartialViewIcon value={attributes} />,
			value: 'partialView',
			onlyPro: true,
			tooltip: 'Partial View',
		},
	];

	return (
		<Layouts
			attributes={attributes}
			setAttributes={setAttributes}
			attributesKey={attributesKey}
			displayActive={true}
			grid={3}
			label={label}
			onChange={onChange}
			items={items}
		/>
	);
};

export default memo(CarouselStyles);
