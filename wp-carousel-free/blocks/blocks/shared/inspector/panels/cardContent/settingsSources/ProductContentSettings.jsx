/**
 * Settings-tab content controls for the product source. Lifted verbatim from the
 * former `ProductContentPanel` General tab — title tag, title/description length
 * + word limits, and the cart-icon toggle. Writes `productContentOptions`
 * (mirroring show* flags into `contentOptions`).
 */

import { __ } from '@wordpress/i18n';
import { Toggle, SPRangeControl, Divider, SPToggleGroupControl } from '@wp-carousel-pro/components';
import { isSlotVisible } from '../../../visibility';
import {
	DESCRIPTION_LENGTH_UNIT_LABELS,
	descriptionLengthLabelToUnit,
	descriptionLengthRangeAttributes,
} from './lengthUnitHelpers';

const TITLE_TAGS = [
	{ label: 'H1', value: 'h1' },
	{ label: 'H2', value: 'h2' },
	{ label: 'H3', value: 'h3' },
	{ label: 'H4', value: 'h4' },
	{ label: 'H5', value: 'h5' },
	{ label: 'H6', value: 'h6' },
	{ label: 'Span', value: 'span' },
];

const TITLE_LENGTH_OPTIONS = [
	{ label: __('Full', 'wp-carousel-free'), value: 'full' },
	{ label: __('Limited', 'wp-carousel-free'), value: 'limited', pro: true },
];

const DESCRIPTION_LENGTH_OPTIONS = [
	{ label: __('Full', 'wp-carousel-free'), value: 'full' },
	{ label: __('Limited', 'wp-carousel-free'), value: 'limited', pro: true },
];

export default function ProductContentSettings({ attributes, setAttributes }) {
	const pco = attributes.productContentOptions || {};
	const co = attributes.contentOptions || {};
	const set = (updates) => {
		const merged = { ...pco, ...updates };
		const contentSync = {};
		if (Object.prototype.hasOwnProperty.call(updates, 'showTitle')) {
			contentSync.showTitle = merged.showTitle;
			contentSync.titleSource = 'post_title';
		}
		if (Object.prototype.hasOwnProperty.call(updates, 'titleTag')) {
			contentSync.titleTag = merged.titleTag;
		}
		if (Object.prototype.hasOwnProperty.call(updates, 'showDescription')) {
			contentSync.showDescription = merged.showDescription;
			contentSync.descriptionSource = 'post_excerpt';
		}
		if (Object.prototype.hasOwnProperty.call(updates, 'showAddToCart')) {
			// Keep preview behavior aligned with existing renderer capability.
			contentSync.showReadMore = merged.showAddToCart;
		}
		setAttributes({
			productContentOptions: merged,
			contentOptions: {
				...co,
				...contentSync,
			},
		});
	};

	const vis = (id) => isSlotVisible(attributes, id);

	return (
		<>
			{/* Title Section */}
			{vis('title') && (
				<>
					<SPToggleGroupControl
						label={__('Title HTML Tag', 'wp-carousel-free')}
						attributes={pco.titleTag ?? 'h4'}
						attributesKey="titleTag"
						setAttributes={set}
						items={TITLE_TAGS}
					/>
					<SPToggleGroupControl
						label={__('Title Length', 'wp-carousel-free')}
						attributes={pco.titleLength ?? 'full'}
						attributesKey="titleLength"
						setAttributes={set}
						items={TITLE_LENGTH_OPTIONS}
					/>
					{pco.titleLength === 'limited' && (
						<SPRangeControl
							label={__('Title Word Limit', 'wp-carousel-free')}
							attributes={pco.titleWordLimit ?? 10}
							attributesKey="titleWordLimit"
							setAttributes={() => {}}
							onValueChange={({ value }) => set({ titleWordLimit: value })}
							min={1}
							max={50}
							defaultValue={10}
							units={false}
						/>
					)}
				</>
			)}
			{vis('title') && vis('excerpt') && <Divider position="sp-w-100pct" />}
			{/* Short Description Section */}
			{vis('excerpt') && (
				<>
					<SPToggleGroupControl
						label={__('Description Length', 'wp-carousel-free')}
						attributes={pco.excerptLimit ?? 'full'}
						attributesKey="excerptLimit"
						setAttributes={set}
						items={DESCRIPTION_LENGTH_OPTIONS}
					/>
					{pco.excerptLimit === 'limited' && (
						<SPRangeControl
							label={__('Description Length', 'wp-carousel-free')}
							attributes={descriptionLengthRangeAttributes(
								pco.excerptWordLimit ?? 15,
								pco.excerptLengthUnit ?? 'word'
							)}
							attributesKey="excerptWordLimit"
							setAttributes={() => {}}
							onValueChange={({ value }) => set({ excerptWordLimit: value })}
							onUnitChange={({ unit }) => set({ excerptLengthUnit: descriptionLengthLabelToUnit(unit) })}
							min={1}
							max={100}
							defaultValue={{ value: 15, unit: 'Words' }}
							units={DESCRIPTION_LENGTH_UNIT_LABELS}
						/>
					)}
				</>
			)}

			{/* Add to Cart Section */}
			{vis('readmore') && (
				<>
					<Divider position="sp-w-100pct" />
					<Toggle
						label={__('Show Cart Icon', 'wp-carousel-free')}
						attributes={pco.showCartIcon ?? false}
						attributesKey="showCartIcon"
						setAttributes={set}
						onlyPro
					/>
				</>
			)}
		</>
	);
}
