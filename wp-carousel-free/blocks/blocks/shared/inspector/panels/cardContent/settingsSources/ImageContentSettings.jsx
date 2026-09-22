/**
 * Settings-tab content controls for the image family (image / audio / document).
 * Lifted verbatim from the former `ContentPanel` General tab — title/description
 * source, read-more button + icon options, audio text alignment, and the
 * diagonal content height. Writes `contentOptions` unchanged.
 */

import { __ } from '@wordpress/i18n';
import {
	SelectField,
	Divider,
	InputControl,
	Toggle,
	SPRangeControl,
} from '@wp-carousel-pro/components';
import ToggleGroupControl from '@wp-carousel-pro/components/toggleGroupControl/toggleGroupControl';
import { useMemo } from '@wordpress/element';
import { useOptionSetter } from '../../../../hooks/useOptionSetter';
import { isSlotVisible, isReadMoreSuppressedByClickAction } from '../../../visibility';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from '@wp-carousel-pro/icons/icons';
import { resolveContentOrientation } from '../../../fragments/contentOrientations';
import ComponentsTopSection from '@wp-carousel-pro/components/componentsTopControl/ComponentsTopSection';
import { ARROW_ICON_OPTIONS } from '@wp-carousel-pro/icons/arrowIcons';
import {
	DESCRIPTION_LENGTH_UNIT_LABELS,
	descriptionLengthLabelToUnit,
	descriptionLengthRangeAttributes,
} from './lengthUnitHelpers';

const TITLE_SOURCES = [
	{ label: __('Image Title', 'wp-carousel-free'), value: 'image_title' },
	{ label: __('Image Caption', 'wp-carousel-free'), value: 'image_caption' },
	{ label: __('Image Alt Text', 'wp-carousel-free'), value: 'image_alt' },
];

const DESC_SOURCES = [
	{ label: __('Image Description', 'wp-carousel-free'), value: 'image_description' },
	{ label: __('Image Caption', 'wp-carousel-free'), value: 'image_caption' },
	// { label: __('Post Excerpt', 'wp-carousel-free'), value: 'post_excerpt' },
];

const POST_EXCERPT_DESCRIPTION_SOURCES = ['post', 'product', 'video'];

function getDescriptionSourceItems(sourceType = 'image') {
	// Media-first sources such as Image store description/caption data on the media
	// item itself, so "Post Excerpt" is not a meaningful choice there. Keep the
	// option available only for sources that can actually provide excerpt data.
	if (!POST_EXCERPT_DESCRIPTION_SOURCES.includes(sourceType)) {
		return DESC_SOURCES.filter(({ value }) => value !== 'post_excerpt');
	}

	return DESC_SOURCES;
}

function getDescriptionSourceValue(sourceType = 'image', descriptionSource = 'image_description') {
	const items = getDescriptionSourceItems(sourceType);
	const hasSelectedSource = items.some(({ value }) => value === descriptionSource);

	// Existing Image-source blocks may still have a legacy `post_excerpt` value
	// saved in attributes. Fall back to a media-safe default in the editor UI so
	// the dropdown only displays options that are actually applicable.
	return hasSelectedSource ? descriptionSource : 'image_description';
}

const DESCRIPTION_LENGTH_OPTIONS = [
	{ label: __('Full', 'wp-carousel-free'), value: 'full' },
	{ label: __('Limited', 'wp-carousel-free'), value: 'limited', pro: true },
];

const TITLE_TAGS = [
	{ label: 'H1', value: 'h1' },
	{ label: 'H2', value: 'h2' },
	{ label: 'H3', value: 'h3' },
	{ label: 'H4', value: 'h4' },
	{ label: 'H5', value: 'h5' },
	{ label: 'H6', value: 'h6' },
	{ label: 'Span', value: 'span' },
];

const ALIGNMENTS = [
	{ label: <AlignLeftIcon />, value: 'left' },
	{ label: <AlignCenterIcon />, value: 'center' },
	{ label: <AlignRightIcon />, value: 'right' },
];
const READ_MORE_BUTTON_TYPES = [
	{ label: __('Button', 'wp-carousel-free'), value: 'button' },
	{ label: __('Text Link', 'wp-carousel-free'), value: 'link' },
];

export default function ImageContentSettings({ attributes, setAttributes }) {
	const co = useMemo(() => attributes.contentOptions || {}, [attributes.contentOptions]);
	const set = useOptionSetter(attributes, setAttributes, 'contentOptions');
	const vis = (id) => isSlotVisible(attributes, id);
	const sourceType = attributes.sourceType || 'image';
	const descriptionSourceItems = getDescriptionSourceItems(sourceType);
	const descriptionSourceValue = getDescriptionSourceValue(
		sourceType,
		co.descriptionSource ?? 'image_description'
	);
	const orientation = resolveContentOrientation(
		sourceType,
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const isReadMoreEnabled =
		!isReadMoreSuppressedByClickAction(attributes) && vis('readmore') && (co.showReadMore ?? false);

	return (
		<>
			{vis('title') && (
				<>
					{attributes.sourceType !== 'audio' && (
						<SelectField
							label={__('Title Source', 'wp-carousel-free')}
							attributes={co.titleSource ?? 'image_caption'}
							attributesKey="titleSource"
							setAttributes={set}
							items={TITLE_SOURCES}
							flexStyle={false}
						/>
					)}

					<ToggleGroupControl
						label={__('Title HTML Tag', 'wp-carousel-free')}
						attributes={co.titleTag ?? 'h4'}
						attributesKey="titleTag"
						setAttributes={set}
						items={TITLE_TAGS}
					/>
				</>
			)}

			{vis('description') && attributes.sourceType !== 'audio' && (
				<>
					<SelectField
						label={__('Description Source', 'wp-carousel-free')}
						attributes={co.descriptionSource ?? 'image_description'}
						attributesKey="descriptionSource"
						setAttributes={set}
						items={descriptionSourceItems}
						value={descriptionSourceValue}
						flexStyle={false}
					/>
					<ToggleGroupControl
						label={__('Description Length', 'wp-carousel-free')}
						attributes={co.descriptionLength ?? 'full'}
						attributesKey="descriptionLength"
						setAttributes={set}
						items={DESCRIPTION_LENGTH_OPTIONS}
					/>
					{co.descriptionLength === 'limited' && (
						<SPRangeControl
							label={__('Description Length', 'wp-carousel-free')}
							attributes={descriptionLengthRangeAttributes(
								co.descriptionWordLimit ?? 20,
								co.descriptionLengthUnit ?? 'word'
							)}
							attributesKey="descriptionWordLimit"
							setAttributes={() => {}}
							onValueChange={({ value }) => set({ descriptionWordLimit: value })}
							onUnitChange={({ unit }) =>
								set({ descriptionLengthUnit: descriptionLengthLabelToUnit(unit) })
							}
							min={1}
							max={100}
							defaultValue={{ value: 20, unit: 'Words' }}
							units={DESCRIPTION_LENGTH_UNIT_LABELS}
						/>
					)}
				</>
			)}

			{isReadMoreEnabled && (
				<>
					<ToggleGroupControl
						label={__('Button Type', 'wp-carousel-free')}
						attributes={co.buttonType ?? 'button'}
						attributesKey="buttonType"
						setAttributes={set}
						items={READ_MORE_BUTTON_TYPES}
					/>
					<Toggle
						label={__('Show Icon', 'wp-carousel-free')}
						attributes={co.showIcon ?? false}
						onChange={(next) =>
							set(next ? { showIcon: true } : { showIcon: false, showIconHover: false })
						}
					/>
					{co.showIcon && (
						<>
							<Toggle
								label={__('Show Icon on Hover', 'wp-carousel-free')}
								attributes={co.showIconHover ?? false}
								attributesKey="showIconHover"
								setAttributes={set}
							/>
							<div className="wpcp-icon-set-group wpcp-component-mb">
								{ARROW_ICON_OPTIONS?.map((item, i) => {
									return (
										<span
											key={`wp-icon-${i}`}
											className={`wpcp-icon-set-item ${
												co.chooseIcon === item.value ? 'wpcp-active-icon' : ''
											}`}
											onClick={() => set({ iconSource: 'library', chooseIcon: item.value })}
											value={item.value}
										>
											{item?.icon}
										</span>
									);
								})}
							</div>

							<SPRangeControl
								label={__('Icon Size', 'wp-carousel-free')}
								attributes={co.iconSize ?? false}
								attributesKey="iconSize"
								setAttributes={set}
								max={100}
								units={['px', 'rem', 'em']}
								defaultValue={{ unit: 'px', value: 16 }}
							/>
							<SelectField
								label={__('Icon Position', 'wp-carousel-free')}
								attributes={co.iconPosition ?? 'right'}
								attributesKey="iconPosition"
								setAttributes={set}
								items={[
									{ label: __('Left', 'wp-carousel-free'), value: 'left' },
									{ label: __('Right', 'wp-carousel-free'), value: 'right' },
								]}
								flexStyle={true}
							/>
							<SPRangeControl
								label={__('Icon Gap', 'wp-carousel-free')}
								attributes={co.iconGap ?? false}
								attributesKey="iconGap"
								setAttributes={set}
								max={100}
								units={['px', 'rem', 'em']}
								defaultValue={{ unit: 'px', value: 10 }}
							/>
						</>
					)}
				</>
			)}

			{attributes.sourceType !== 'audio' && <Divider position="sp-w-100pct" />}

			{attributes.sourceType === 'audio' && (
				<ToggleGroupControl
					label={__('Text Alignment', 'wp-carousel-free')}
					attributes={co.alignment ?? 'left'}
					attributesKey="alignment"
					setAttributes={set}
					items={ALIGNMENTS}
				/>
			)}

			{/* Content width/height size the overlay content box only, so they are
			   hidden on content box, fly content, and classic; diagonal keeps the
			   height control for its caption area. */}
			{orientation === 'diagonal' && (
				<div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, marginBottom: '16px' }}>
					<ComponentsTopSection
						label={__('Height', 'wp-carousel-free')}
						attributes={co?.contentHeight}
						attributesKey={'contentHeight'}
						setAttributes={() => {}}
						units={['px', '%', 'em']}
						onUnitChange={({ unit, deviceType }) =>
							set({
								contentHeight: {
									...co?.contentHeight,
									unit: { ...co?.contentHeight?.unit, [deviceType]: unit },
								},
							})
						}
						defaultUnit={'px'}
					/>
					<InputControl
						attributes={co?.contentHeight}
						attributesKey={'contentHeight'}
						setAttributes={() => {}}
						onChange={(value, deviceType) =>
							set({
								contentHeight: {
									...co?.contentHeight,
									device: { ...co?.contentHeight?.device, [deviceType]: value },
								},
							})
						}
						placeholder={'auto'}
						flex={false}
						responsive={false}
					/>
				</div>
			)}
		</>
	);
}
