/**
 * Button Style popover for the Card Content panel.
 *
 * The former panels carried TWO structurally different button popovers, not one
 * with a few gated extras. This component source-routes between them:
 *   - image + product → the shared `SharedButtonStyleBody` (formerly
 *     `ButtonStylePopup`, exported from `ProductContentPanel`). Its write
 *     container is retargeted via the `styleOptions`/`onStyleOptionsChange`
 *     buffer: image writes `contentOptions`, product writes
 *     `productContentOptions`.
 *   - post / video → `PostButtonStyleBody`, a disjoint key set with
 *     the post-only box-shadow controls and the `buttonType === 'button'` gate.
 */

import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	SpColorPicker,
	Spacing,
	Divider,
	Popup,
	Border,
	BoxShadow,
	Toggle,
} from '@wp-carousel-pro/components';
import ToggleGroupControl from '@wp-carousel-pro/components/toggleGroupControl/toggleGroupControl';
import { SPACING_DEFAULT, makeCreateSpacingHandlers } from './sourceAccessors/spacing';
import { resolveSharedButtonProps } from './sourceAccessors/buttonRouting';

const NORMAL_HOVER = [
	{ label: __('Normal', 'wp-carousel-free'), value: 'color' },
	{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
];

const BORDER_WIDTH = {
	device: {
		Desktop: { top: 1, right: 1, bottom: 1, left: 1 },
		Tablet: { top: '', right: '', bottom: '', left: '' },
		Mobile: { top: '', right: '', bottom: '', left: '' },
	},
	unit: {
		Desktop: 'px',
		Tablet: 'px',
		Mobile: 'px',
	},
	allChange: true,
};
const BORDER_DEFAULT = {
	style: 'solid',
	color: '#2f2f2f',
	hoverColor: '#2f2f2f',
};

const POST_FAMILY_SOURCES = ['post', 'video'];

/*
 * Shared button-style body (image/audio/document + product). Lifted verbatim
 * from `ProductContentPanel`'s `ButtonStylePopup`.
 */
const SharedButtonStyleBody = ({
	attributes,
	setAttributes,
	styleOptions,
	onStyleOptionsChange,
}) => {
	const pco = styleOptions || attributes.productContentOptions || {};
	const co = attributes.contentOptions || {};
	const [colorState, setColorState] = useState('color');
	const set = (updates) => {
		if (onStyleOptionsChange) {
			onStyleOptionsChange({
				...pco,
				...updates,
			});
			return;
		}

		setAttributes({
			productContentOptions: { ...pco, ...updates },
			contentOptions: {
				...co,
				...(Object.prototype.hasOwnProperty.call(updates, 'titleColor')
					? { titleColor: updates.titleColor }
					: {}),
				...(Object.prototype.hasOwnProperty.call(updates, 'descColor')
					? { descColor: updates.descColor }
					: {}),
			},
		});
	};

	const getCartBorder = () => ({
		...BORDER_DEFAULT,
		...pco?.cartBorder,
	});
	const getCartBorderWidth = () => ({
		...BORDER_WIDTH,
		...pco?.cartBorderWidth,
	});
	const getCartBorderRadius = () => ({
		...SPACING_DEFAULT,
		...pco?.cartBorderRadius,
	});
	const getCartPadding = () => ({
		...SPACING_DEFAULT,
		...pco?.cartPadding,
	});

	const createSpacingHandlers = makeCreateSpacingHandlers(set);

	return (
		<>
			<ToggleGroupControl
				attributes={colorState}
				onClick={(value) => setColorState(value)}
				items={NORMAL_HOVER}
			/>
			{colorState === 'color' && (
				<>
					<SpColorPicker
						label={__('Color', 'wp-carousel-free')}
						attributes={pco.buttonColor ?? ''}
						attributesKey="buttonColor"
						setAttributes={set}
					/>
					<SpColorPicker
						label={__('Background', 'wp-carousel-free')}
						attributes={pco.buttonBg ?? ''}
						attributesKey="buttonBg"
						setAttributes={set}
					/>
				</>
			)}
			{colorState === 'hover' && (
				<>
					<SpColorPicker
						label={__('Hover Color', 'wp-carousel-free')}
						attributes={pco.buttonHoverColor ?? ''}
						attributesKey="buttonHoverColor"
						setAttributes={set}
					/>

					<SpColorPicker
						label={__('Hover Background', 'wp-carousel-free')}
						attributes={pco.buttonHoverBg ?? ''}
						attributesKey="buttonHoverBg"
						setAttributes={set}
					/>
				</>
			)}
			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{
					border: {
						style: getCartBorder().style ?? 'solid',
						color:
							colorState === 'hover' ? getCartBorder().hoverColor ?? '' : getCartBorder().color ?? '',
					},
					borderWidth: getCartBorderWidth(),
				}}
				attributesKey={{ border: 'cartBorder', borderWidth: 'cartBorderWidth' }}
				setAttributes={() => {}}
				parentState={colorState === 'hover' ? 'hover' : 'normal'}
				onStateUpdate={(key, updateValue) => {
					if (key === 'cartBorder') {
						const nextBorder = { ...getCartBorder() };
						nextBorder.style = updateValue.style;
						if (colorState === 'hover') {
							nextBorder.hoverColor = updateValue.color;
						} else {
							nextBorder.color = updateValue.color;
						}
						set({ cartBorder: nextBorder });
					} else if (key === 'cartBorderWidth') {
						set({ cartBorderWidth: updateValue });
					}
				}}
			/>
			<Divider position="sp-w-100pct" />
			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={getCartBorderRadius()}
				attributesKey="cartBorderRadius"
				{...createSpacingHandlers('cartBorderRadius', getCartBorderRadius)}
				indicator="radius"
			/>
			<Spacing
				label={__('Padding', 'wp-carousel-free')}
				attributes={getCartPadding()}
				attributesKey="cartPadding"
				{...createSpacingHandlers('cartPadding', getCartPadding)}
			/>
		</>
	);
};

const normalizeBoxShadow = (val = {}) => ({
	selectDefault: val.selectDefault ?? 'custom',
	color: val.color ?? '#DDD',
	unit: val.unit ?? 'outset',
	value: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		...val.value,
	},
});

/*
 * Post-family button-style body (post/external/video). Lifted verbatim from
 * `PostContentPanel`'s inline read-more popup.
 */
const PostButtonStyleBody = ({ attributes, setAttributes }) => {
	const pco = attributes.postContentOptions || {};
	const [readmoreState, setReadmoreState] = useState('color');
	const set = (updates) => setAttributes({ postContentOptions: { ...pco, ...updates } });

	const getDefaultBtnBorderRadius = () => ({
		...SPACING_DEFAULT,
		...pco?.buttonBorderRadius,
	});
	const getDefaultPadding = () => ({
		...SPACING_DEFAULT,
		...pco?.btnPadding,
	});
	const getDefaultMargin = () => ({
		...SPACING_DEFAULT,
		...pco?.btnMargin,
	});

	const createSpacingHandlers = makeCreateSpacingHandlers(set);

	return (
		<>
			<ToggleGroupControl
				attributes={readmoreState}
				onClick={(newValue) => setReadmoreState(newValue)}
				items={NORMAL_HOVER}
			/>
			{readmoreState === 'color' && (
				<>
					<SpColorPicker
						label={__('Color', 'wp-carousel-free')}
						attributes={pco.buttonColor ?? ''}
						attributesKey="buttonColor"
						setAttributes={set}
					/>
					{pco.buttonType === 'button' && (
						<>
							<SpColorPicker
								label={__('Background', 'wp-carousel-free')}
								attributes={pco.buttonBg ?? ''}
								attributesKey="buttonBg"
								setAttributes={set}
							/>
						</>
					)}
				</>
			)}
			{readmoreState === 'hover' && (
				<>
					<SpColorPicker
						label={__('Hover Color', 'wp-carousel-free')}
						attributes={pco.buttonHoverColor ?? ''}
						attributesKey="buttonHoverColor"
						setAttributes={set}
					/>
					{pco.buttonType === 'button' && (
						<>
							<SpColorPicker
								label={__('Hover Background', 'wp-carousel-free')}
								attributes={pco.buttonHoverBg ?? ''}
								attributesKey="buttonHoverBg"
								setAttributes={set}
							/>
						</>
					)}
				</>
			)}
			{pco.buttonType === 'button' && (
				<Border
					label={__('Border', 'wp-carousel-free')}
					attributes={{
						border: {
							style: pco?.buttonBorder?.style ?? 'solid',
							color:
								readmoreState === 'hover'
									? pco?.buttonBorder?.hoverColor ?? ''
									: pco?.buttonBorder?.color ?? '',
						},
						borderWidth: pco?.btnBorderWidth,
					}}
					attributesKey={{ border: 'buttonBorder', borderWidth: 'btnBorderWidth' }}
					setAttributes={() => {}}
					parentState={readmoreState === 'hover' ? 'hover' : 'normal'}
					onStateUpdate={(key, updateValue) => {
						if (key === 'buttonBorder') {
							const nextBorder = { ...(pco?.buttonBorder || {}) };
							nextBorder.style = updateValue.style;
							if (readmoreState === 'hover') {
								nextBorder.hoverColor = updateValue.color;
							} else {
								nextBorder.color = updateValue.color;
							}
							setAttributes({
								postContentOptions: {
									...pco,
									buttonBorder: nextBorder,
								},
							});
						} else if (key === 'btnBorderWidth') {
							setAttributes({
								postContentOptions: {
									...pco,
									btnBorderWidth: updateValue,
								},
							});
						}
					}}
				/>
			)}
			{readmoreState === 'color' && (
				<>
					<Toggle
						label={__('Box Shadow', 'wp-carousel-free')}
						attributes={pco?.btnBoxShadowEnable}
						attributesKey="btnBoxShadowEnable"
						onChange={() =>
							setAttributes({
								postContentOptions: {
									...pco,
									btnBoxShadowEnable: !pco?.btnBoxShadowEnable,
								},
							})
						}
					/>
					{pco?.btnBoxShadowEnable && (
						<BoxShadow
							hideEnableToggle
							attributes={pco?.btnBoxShadow}
							attributesKey={'btnBoxShadow'}
							setAttributes={() => {}}
							onChange={(key, updateValue) => {
								setAttributes({
									postContentOptions: {
										...pco,
										[key]: normalizeBoxShadow(updateValue),
									},
								});
							}}
							shadowColorBtn={false}
						/>
					)}
				</>
			)}
			{readmoreState === 'hover' && (
				<>
					<Toggle
						label={__('Box Shadow', 'wp-carousel-free')}
						attributes={pco?.btnShadowHoverEnable}
						attributesKey="btnShadowHoverEnable"
						onChange={() =>
							setAttributes({
								postContentOptions: {
									...pco,
									btnShadowHoverEnable: !pco?.btnShadowHoverEnable,
								},
							})
						}
					/>
					{pco?.btnShadowHoverEnable && (
						<BoxShadow
							hideEnableToggle
							attributes={pco?.btnShadowHover}
							attributesKey={'btnShadowHover'}
							setAttributes={() => {}}
							onChange={(key, updateValue) => {
								setAttributes({
									postContentOptions: {
										...pco,
										[key]: normalizeBoxShadow(updateValue),
									},
								});
							}}
							shadowColorBtn={false}
						/>
					)}
				</>
			)}
			<Divider position="sp-w-100pct" />
			{pco.buttonType === 'button' && (
				<>
					<Spacing
						label={__('Border Radius', 'wp-carousel-free')}
						attributes={getDefaultBtnBorderRadius()}
						attributesKey="buttonBorderRadius"
						indicator="radius"
						{...createSpacingHandlers('buttonBorderRadius', getDefaultBtnBorderRadius)}
					/>
					<Spacing
						label={__('Padding', 'wp-carousel-free')}
						attributes={getDefaultPadding()}
						attributesKey="btnPadding"
						{...createSpacingHandlers('btnPadding', getDefaultPadding)}
					/>
				</>
			)}
			<Spacing
				label={__('Margin', 'wp-carousel-free')}
				attributes={getDefaultMargin()}
				attributesKey="btnMargin"
				{...createSpacingHandlers('btnMargin', getDefaultMargin)}
			/>
		</>
	);
};

export default function ButtonStylePopover({ attributes, setAttributes }) {
	const sourceType = attributes?.sourceType || 'image';
	const isPostFamily = POST_FAMILY_SOURCES.includes(sourceType);

	return (
		<Popup
			label={__('Button Style', 'wp-carousel-free')}
			divClassName={
				isPostFamily
					? 'wpcp-post-content-read-more-style-popup'
					: 'wpcp-product-content-button-style-popup'
			}
		>
			{isPostFamily ? (
				<PostButtonStyleBody attributes={attributes} setAttributes={setAttributes} />
			) : (
				<SharedButtonStyleBody {...resolveSharedButtonProps(attributes, setAttributes)} />
			)}
		</Popup>
	);
}
