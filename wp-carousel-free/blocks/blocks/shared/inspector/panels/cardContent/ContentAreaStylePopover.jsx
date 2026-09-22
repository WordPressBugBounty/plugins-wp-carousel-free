/**
 * Content Area Style popover.
 *
 * The card-area styling that was the former "Card Elements" Style tab —
 * background, border, box-shadow, border-radius, padding, plus the audio
 * thumbnail-overlay mode — collapsed into a single popover at the bottom of the
 * Card Content panel's Style tab. Body lifted verbatim from
 * `ContentAreaPanel`'s StyleTab; writes the same `contentAreaOptions` attributes.
 */

import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	SPToggleGroupControl,
	Border,
	Divider,
	Background,
	BoxShadow,
	Toggle,
	Spacing,
	Popup,
} from '@wp-carousel-pro/components';
import { useOptionSetter } from '../../../hooks/useOptionSetter';
import { resolveContentOrientation } from '../../fragments/contentOrientations';
import { createSpacingDefaults, normalizeSpacingAttr } from './sourceAccessors/spacing';
import {
	resolveContentAreaStyle,
	resolveContentAreaBackground,
	resolveBoxShadowState,
	getCardElementBackgroundDefault,
	updateResponsiveSpacingUnit,
	DEFAULT_BORDER,
	DEFAULT_BORDER_WIDTH,
	CONTENT_AREA_BG_ITEMS,
} from './contentAreaHelpers';

function ContentAreaStyleBody({ attributes, setAttributes }) {
	const [styleState, setStyleState] = useState('normal');
	const set = useOptionSetter(attributes, setAttributes, 'contentAreaOptions');
	const contentOrientation = resolveContentOrientation(
		attributes?.sourceType || 'image',
		attributes?.layoutOptions?.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const isClassicOrientation = contentOrientation === 'image-top';
	const cao = attributes.contentAreaOptions || {};
	const useSingleStyleState = !isClassicOrientation;
	const showBoxShadowControls = !useSingleStyleState;
	const effectiveStyleState = useSingleStyleState ? 'normal' : styleState;
	const areaStyle = resolveContentAreaStyle(cao);
	const areaBackground = resolveContentAreaBackground(cao, attributes?.sourceType || 'image');
	const cardBackgroundDefault = getCardElementBackgroundDefault(attributes?.sourceType || 'image');
	const shadowState = resolveBoxShadowState(cao, effectiveStyleState);

	const patchCao = set;

	const bgStyleState = effectiveStyleState === 'normal' ? 'color' : 'hover';
	const borderRadiusAttr = normalizeSpacingAttr(cao.borderRadius, 0);
	const updateBorderRadius = (borderRadius) =>
		patchCao({ borderRadius, borderRadiusCustomized: true });
	const resetBorderRadius = (borderRadius) =>
		patchCao({ borderRadius, borderRadiusCustomized: false });
	const updateBorderRadiusUnit = ({ unit, deviceType }) =>
		patchCao({
			borderRadius: updateResponsiveSpacingUnit(
				normalizeSpacingAttr(cao.borderRadius, 0),
				deviceType,
				unit
			),
			borderRadiusCustomized: true,
		});
	const paddingAttr = normalizeSpacingAttr(cao.padding, 0);
	const contentPaddingAttr = normalizeSpacingAttr(cao.contentPadding, 0);
	const updatePadding = (padding) =>
		patchCao({
			padding,
			paddingCustomized: true,
		});
	const resetPadding = (padding) =>
		patchCao({
			padding,
			paddingCustomized: false,
		});
	const updatePaddingUnit = ({ unit, deviceType }) =>
		patchCao({
			padding: updateResponsiveSpacingUnit(paddingAttr, deviceType, unit),
			paddingCustomized: true,
		});
	const updateContentPadding = (contentPadding) =>
		patchCao({
			contentPadding,
			contentPaddingCustomized: true,
		});
	const resetContentPadding = (contentPadding) =>
		patchCao({
			contentPadding,
			contentPaddingCustomized: false,
		});
	const updateContentPaddingUnit = ({ unit, deviceType }) =>
		patchCao({
			contentPadding: updateResponsiveSpacingUnit(contentPaddingAttr, deviceType, unit),
			contentPaddingCustomized: true,
		});
	const isExternalSource = attributes?.sourceType === 'external';

	return (
		<>
			{!useSingleStyleState && (
				<>
					<SPToggleGroupControl
						attributes={styleState}
						items={[
							{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
							{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
						]}
						onClick={(v) => setStyleState(v)}
					/>

					<Background
						label={__('Background Type', 'wp-carousel-free')}
						attributes={areaBackground}
						attributesKey="contentAreaBackground"
						setAttributes={patchCao}
						styleState={bgStyleState}
						items={CONTENT_AREA_BG_ITEMS}
						colorLabel={__('Background Color', 'wp-carousel-free')}
						defaultColor={cardBackgroundDefault.solid}
					/>
				</>
			)}

			{useSingleStyleState && (
				<Background
					label={__('Content Area BG Type', 'wp-carousel-free')}
					attributes={areaBackground}
					attributesKey="contentAreaBackground"
					setAttributes={patchCao}
					styleState="color"
					items={CONTENT_AREA_BG_ITEMS}
					colorLabel={__('Background Color', 'wp-carousel-free')}
					defaultColor={cardBackgroundDefault.solid}
				/>
			)}

			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{
					border: {
						style: areaStyle.normal.border?.style ?? DEFAULT_BORDER.style,
						color: areaStyle.normal.border?.color ?? DEFAULT_BORDER.color,
					},
					borderWidth: areaStyle.normal.borderWidth || { ...DEFAULT_BORDER_WIDTH },
				}}
				attributesKey={{ border: 'border', borderWidth: 'borderWidth' }}
				setAttributes={() => {}}
				parentState="normal"
				onStateUpdate={(key, updateValue) => {
					const base = resolveContentAreaStyle(cao);
					if (key === 'border') {
						patchCao({
							contentAreaStyle: {
								...base,
								normal: {
									...base.normal,
									border: {
										...(base.normal.border || {}),
										style: updateValue.style,
										color: updateValue.color,
									},
								},
							},
						});
					} else if (key === 'borderWidth') {
						patchCao({
							contentAreaStyle: {
								...base,
								normal: { ...base.normal, borderWidth: updateValue },
							},
						});
					}
				}}
			/>

			{showBoxShadowControls && (
				<>
					<Toggle
						label={__('Box Shadow', 'wp-carousel-free')}
						attributes={shadowState.enable}
						attributesKey={shadowState.enableKey}
						setAttributes={(updates) => {
							patchCao(updates);
						}}
					/>

					{shadowState.enable && (
						<BoxShadow
							key={shadowState.dataKey}
							hideEnableToggle
							attributes={shadowState.data}
							attributesKey={shadowState.dataKey}
							setAttributes={patchCao}
							defaultColor="#4E4F521A"
						/>
					)}
					<Divider />
				</>
			)}
			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={borderRadiusAttr}
				attributesKey="borderRadius"
				setAttributes={patchCao}
				onChange={updateBorderRadius}
				onReset={resetBorderRadius}
				onUnitChange={updateBorderRadiusUnit}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 0, right: 0, bottom: 0, left: 0 },
					device: createSpacingDefaults(0).device,
				}}
				indicator="radius"
			/>

			{isClassicOrientation && (
				<Spacing
					label={__('Content Padding', 'wp-carousel-free')}
					attributes={contentPaddingAttr}
					attributesKey="contentPadding"
					setAttributes={patchCao}
					onChange={updateContentPadding}
					onReset={resetContentPadding}
					onUnitChange={updateContentPaddingUnit}
					units={['px', '%', 'em']}
					defaultValue={{
						unit: 'px',
						value: { top: 0, right: 0, bottom: 0, left: 0 },
						device: createSpacingDefaults(0).device,
					}}
				/>
			)}

			<Spacing
				label={
					isClassicOrientation
						? __('Card Padding', 'wp-carousel-free')
						: __('Content Padding', 'wp-carousel-free')
				}
				attributes={paddingAttr}
				attributesKey="padding"
				setAttributes={patchCao}
				onChange={updatePadding}
				onReset={resetPadding}
				onUnitChange={updatePaddingUnit}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 0, right: 0, bottom: 0, left: 0 },
					device: createSpacingDefaults(0).device,
				}}
			/>
			{!isExternalSource && (
				<>
					<Spacing
						label={__('Margin', 'wp-carousel-free')}
						attributes={normalizeSpacingAttr(cao.cardMargin, 0)}
						attributesKey="cardMargin"
						setAttributes={set}
						units={['px', '%', 'em']}
						defaultValue={{
							unit: 'px',
							value: { top: 0, right: 0, bottom: 0, left: 0 },
							device: createSpacingDefaults(0).device,
						}}
					/>
				</>
			)}
		</>
	);
}

export default function ContentAreaStylePopover({ attributes, setAttributes }) {
	return (
		<Popup
			label={__('Content Area Style', 'wp-carousel-free')}
			divClassName="wpcp-content-area-style-popup"
		>
			<ContentAreaStyleBody attributes={attributes} setAttributes={setAttributes} />
		</Popup>
	);
}
