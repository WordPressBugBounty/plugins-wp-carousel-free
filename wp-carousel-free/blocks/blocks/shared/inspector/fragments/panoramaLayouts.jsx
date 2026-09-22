import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Layouts } from '@wp-carousel-pro/components';

export const PANORAMA_LAYOUT_VALUES = ['style-one', 'style-two'];

const SVG_PROPS = {
	viewBox: '0 0 119 83',
	fill: 'none',
	xmlns: 'http://www.w3.org/2000/svg',
	preserveAspectRatio: 'xMidYMid meet',
};

const StyleOne = () => (
	<svg
		width={119}
		height={84}
		viewBox="0 0 119 84"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...SVG_PROPS}
	>
		<rect
			x={0.5}
			y={0.5}
			width={118}
			height={82.3}
			rx={3.5}
			stroke="#98B0BF"
			strokeWidth="1.5"
			className="wpcp-layout-frame"
		/>
		<path
			d="M9.52051 27.3699C9.52051 27.3699 17.8257 28.9982 28.5605 30.5517V53.9369C17.8256 55.4904 9.52051 57.1199 9.52051 57.1199V27.3699ZM109.481 57.1199C109.481 57.1199 101.481 55.5509 91.0355 54.024V30.4646C101.481 28.9377 109.481 27.3699 109.481 27.3699V57.1199ZM89.2505 53.7672C83.4349 52.9429 76.9895 52.1587 70.8055 51.6719V32.8167C76.9895 32.3299 83.4349 31.5468 89.2505 30.7226V53.7672ZM30.3455 30.8062C36.1919 31.626 42.6357 32.3955 48.7905 32.862V51.6266C42.6357 52.0931 36.192 52.8637 30.3455 53.6835V30.8062ZM69.0205 51.5383C69.0205 51.5383 62.4767 51.4999 59.5005 51.4999C56.5243 51.4999 50.5755 51.4999 50.5755 51.4999V32.9887C50.5755 32.9887 56.7022 32.9887 59.5005 32.9887C62.4767 32.9887 69.0205 32.9503 69.0205 32.9503V51.5383Z"
			fill="#58707F"
		/>
	</svg>
);

const StyleTwo = () => (
	<svg
		width={119}
		height={84}
		viewBox="0 0 119 84"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...SVG_PROPS}
	>
		<rect
			x={0.5}
			y={0.5}
			width={118}
			height={82.3}
			rx={3.5}
			stroke="#98B0BF"
			strokeWidth="1.5"
			className="wpcp-layout-frame"
		/>
		<path
			d="M59.4995 27.3699C62.4757 27.3699 69.0195 27.4077 69.0195 27.4077V55.8923C69.0195 55.8923 62.4758 55.9299 59.4995 55.9299C56.7012 55.9299 50.5745 55.9299 50.5745 55.9299V27.3701C50.5745 27.3701 56.7012 27.3699 59.4995 27.3699ZM48.7895 55.8056C42.6347 55.3476 36.1909 54.592 30.3445 53.7872V29.514C36.191 28.7091 42.6347 27.9524 48.7895 27.4944V55.8056ZM70.8045 27.5389C76.9886 28.0168 83.4339 28.7868 89.2495 29.5961V53.705C83.434 54.5143 76.9885 55.2831 70.8045 55.7611V27.5389ZM28.5595 53.5373C17.8247 52.012 9.51953 50.4133 9.51953 50.4133V32.8878C9.51953 32.8878 17.8247 31.288 28.5595 29.7627V53.5373ZM91.0345 29.8483C101.48 31.3474 109.48 32.8878 109.48 32.8878V50.4133C109.48 50.4133 101.48 51.9526 91.0345 53.4517V29.8483Z"
			fill="#58707F"
		/>
	</svg>
);

const ITEMS = [
	{
		icon: <StyleOne />,
		value: 'style-one',
		tooltip: __('Curve In', 'wp-carousel-free'),
	},
	{
		icon: <StyleTwo />,
		value: 'style-two',
		tooltip: __('Curve Out', 'wp-carousel-free'),
	},
];

const PanoramaLayouts = ({
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
		grid={2}
		className="wpcp-panorama-layouts"
		label={label}
		onChange={onChange}
		items={ITEMS}
	/>
);

export default memo(PanoramaLayouts);
