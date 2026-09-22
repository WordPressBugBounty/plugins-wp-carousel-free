/**
 * Card Content — Style tab.
 *
 * One unified Style layout for every source: Title/Description (label per
 * source) typography·color·margin, product-only Price rows, Button typography +
 * Button Style popover, and the Content Area Style popover at the bottom. All
 * routing (which attribute container, polymorphic color shape, apply-to-all
 * fan-out) comes from the per-source accessor bundle — this component stays
 * source-agnostic. See `sourceAccessors/` for the routing contract.
 */

import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Typography,
	SPToggleGroupControl,
	SpColorPicker,
	Spacing,
	Divider,
} from '@wp-carousel-pro/components';
import { isSlotVisible, isReadMoreSuppressedByClickAction } from '../../visibility';
import { bySource } from './sourceAccessors';
import ButtonStylePopover from './ButtonStylePopover';
import ContentAreaStylePopover from './ContentAreaStylePopover';

const COLOR_STATE_ITEMS = [
	{ label: __('Normal', 'wp-carousel-free'), value: 'color' },
	{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
];

export default function StyleTab({ attributes, setAttributes }) {
	const [colorState, setColorState] = useState('color');
	const acc = bySource(attributes, setAttributes);
	const vis = (id) => isSlotVisible(attributes, id);
	const clickActionSuppressesReadmore = isReadMoreSuppressedByClickAction(attributes);

	return (
		<>
			{vis('title') && (
				<>
					<Typography
						typographyLabel={__('Title Typography', 'wp-carousel-free')}
						attributes={acc.title.typoAttributes}
						setAttributes={acc.title.setTypography}
						applyToAllTypography={acc.title.applyToAll}
						fontSizePresetType={'heading'}
					/>
					<SPToggleGroupControl
						attributes={colorState}
						onClick={(value) => setColorState(value)}
						items={COLOR_STATE_ITEMS}
					/>
					<SpColorPicker {...acc.titleColorProps(colorState)} />
					<Spacing label={__('Margin', 'wp-carousel-free')} {...acc.titleMarginProps} />
				</>
			)}

			{vis('title') && vis(acc.descSlot) && <Divider position="sp-w-100pct" />}

			{vis(acc.descSlot) && (
				<>
					<Typography
						typographyLabel={`${acc.descLabel} ${__('Typography', 'wp-carousel-free')}`}
						attributes={acc.desc.typoAttributes}
						setAttributes={acc.desc.setTypography}
						applyToAllTypography={acc.desc.applyToAll}
					/>
					<SpColorPicker {...acc.descColorProps()} />
					<Spacing label={__('Margin', 'wp-carousel-free')} {...acc.descMarginProps} />
				</>
			)}

			{acc.hasPrice && vis('price') && (
				<>
					<Divider position="sp-w-100pct" />
					<Typography
						typographyLabel={__('Price Typography', 'wp-carousel-free')}
						attributes={acc.price.typoAttributes}
						setAttributes={acc.price.setTypography}
						applyToAllTypography={acc.price.applyToAll}
					/>
					<SpColorPicker {...acc.priceColorProps()} />
					<SpColorPicker {...acc.salePriceColorProps()} />
					<Spacing label={__('Margin', 'wp-carousel-free')} {...acc.priceMarginProps} />
				</>
			)}

			{vis('readmore') && !clickActionSuppressesReadmore && (
				<>
					<Divider position="sp-w-100pct" />
					<Typography
						typographyLabel={__('Button Typography', 'wp-carousel-free')}
						attributes={acc.button.typoAttributes}
						setAttributes={acc.button.setTypography}
						applyToAllTypography={acc.button.applyToAll}
					/>
					<ButtonStylePopover attributes={attributes} setAttributes={setAttributes} />
				</>
			)}

			<Divider position="sp-w-100pct" />
			<ContentAreaStylePopover attributes={attributes} setAttributes={setAttributes} />
		</>
	);
}
