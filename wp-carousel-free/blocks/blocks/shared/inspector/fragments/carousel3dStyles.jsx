/**
 * 3D Carousel style picker (visual layout cards).
 *
 * Shown only on the 3D Carousel block, which keeps `carouselStyle` at its schema
 * default and picks its look through `layoutOptions.carousel3dStyle` instead.
 * Coverflow is Free; the other three cards are Pro-locked and write nothing.
 */

import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Layouts } from '@wp-carousel-pro/components';

const SVG_PROPS = {
	width: 119,
	height: 84,
	viewBox: '0 0 119 84',
	fill: 'none',
	xmlns: 'http://www.w3.org/2000/svg',
	preserveAspectRatio: 'xMidYMid meet',
};

const Frame = () => (
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
);

const StyleOne = () => (
	<svg {...SVG_PROPS}>
		<Frame />
		<g transform="translate(9.127 22.474) scale(1.19)">
			<path
				d="M24.332 9.36557L0.757595 7.7707L0.757568 24.6628L24.6436 23.0215L24.332 9.36557Z"
				fill="#9EA9B2"
			/>
			<path
				d="M33.2546 8.7057L7.11442 6.93725L7.11439 25.6678L33.6002 23.8479L33.2546 8.7057Z"
				fill="#8796A1"
			/>
			<path
				d="M43.1915 7.62776L13.8257 5.64109L13.8256 26.683L43.5797 24.6385L43.1915 7.62776Z"
				fill="#718491"
			/>
			<path
				d="M58.826 9.36557L82.4004 7.7707L82.4004 24.6628L58.5144 23.0215L58.826 9.36557Z"
				fill="#9EA9B2"
			/>
			<path
				d="M49.9034 8.7057L76.0436 6.93725L76.0436 25.6678L49.5578 23.8479L49.9034 8.7057Z"
				fill="#8796A1"
			/>
			<path
				d="M39.9665 7.62776L69.3323 5.64109L69.3323 26.683L39.5783 24.6385L39.9665 7.62776Z"
				fill="#718491"
			/>
			<g filter="url(#wpcp-carousel-3d-style-one-shadow)">
				<path d="M27.2634 4.93689H58.211V27.0423H27.2634V4.93689Z" fill="#58707F" />
			</g>
		</g>
		<defs>
			<filter
				id="wpcp-carousel-3d-style-one-shadow"
				x="25.159"
				y="2.83246"
				width="35.1564"
				height="26.3142"
				filterUnits="userSpaceOnUse"
				colorInterpolationFilters="sRGB"
			>
				<feFlood floodOpacity="0" result="BackgroundImageFix" />
				<feColorMatrix
					in="SourceAlpha"
					type="matrix"
					values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
					result="hardAlpha"
				/>
				<feOffset />
				<feGaussianBlur stdDeviation="1.05222" />
				<feComposite in2="hardAlpha" operator="out" />
				<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
				<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
				<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
			</filter>
		</defs>
	</svg>
);

const StyleTwo = () => (
	<svg {...SVG_PROPS}>
		<Frame />
		<g transform="translate(9.996 24.091) scale(1.19)">
			<path d="M81.3063 1.54802L84.0337 3.16972V27.4952L81.3063 25.8735V1.54802Z" fill="#718491" />
			<path
				d="M4.1008e-05 3.16972L2.80116 1.54802V25.8735L4.1008e-05 27.4952V3.16972Z"
				fill="#718491"
			/>
			<path
				d="M20.4187 0.442312L41.5009 2.95639e-05V13.8582L20.4187 14.3005V0.442312Z"
				fill="#8796A1"
			/>
			<path d="M3.24344 1.59519L19.6079 0.516025V11.2311L3.24344 12.3102V1.59519Z" fill="#8796A1" />
			<path
				d="M42.6066 2.95639e-05L63.6887 0.442312V14.3005L42.6066 13.8582V2.95639e-05Z"
				fill="#8796A1"
			/>
			<path d="M64.4995 0.516025L80.9377 1.59962V12.4576L64.4995 11.374V0.516025Z" fill="#8796A1" />
			<path d="M23.5884 4.93885H60.4453V29.2644H23.5884V4.93885Z" fill="#58707F" />
			<path d="M61.9195 4.93885L83.6651 3.16972V27.4952L61.9195 29.2644V4.93885Z" fill="#58707F" />
			<path d="M0.368609 3.16972L22.1142 4.93885V29.2644L0.368609 27.4952V3.16972Z" fill="#58707F" />
		</g>
	</svg>
);

const StyleThree = () => (
	<svg {...SVG_PROPS}>
		<Frame />
		<g transform="translate(16.66 18.326) scale(1.19)">
			<path d="M13.9484 30.5139H72.0667L58.1183 38.9473H3.17891e-07L13.9484 30.5139Z" fill="#F0F0F0" />
			<path d="M11.6278 25.9139H69.7667L58.1389 38.9473H3.17891e-07L11.6278 25.9139Z" fill="#D8DADB" />
			<path d="M9.30575 20.5473H67.4667L58.1609 38.9473H3.17891e-07L9.30575 20.5473Z" fill="#BBC2C7" />
			<path d="M6.98214 14.4139H65.1667L58.1845 38.9473H3.17891e-07L6.98214 14.4139Z" fill="#9EA9B2" />
			<path d="M4.65679 9.04727H62.8667L58.2099 38.9473H3.17891e-07L4.65679 9.04727Z" fill="#8796A1" />
			<path d="M2.32949 4.44727H60.5667L58.2372 38.9473H3.17891e-07L2.32949 4.44727Z" fill="#718491" />
			<rect width="58.0808" height="38.7205" fill="#58707F" />
		</g>
	</svg>
);

/** The fanned-out pair; the right half is the left half mirrored, as in the design. */
const SideFan = () => (
	<>
		<path
			d="M18.0641 0.893479L24.198 1.74802L24.7184 11.0419L18.7703 9.70358L18.0641 0.893479Z"
			fill="#8796A1"
		/>
		<path
			d="M25.9817 4.76837e-06L29.8851 1.00375L30.1453 9.85154L26.3906 8.17864L25.9817 4.76837e-06Z"
			fill="#718491"
		/>
		<path
			d="M10.6279 2.2679L19.3657 2.7886L20.0332 10.6324L11.5943 10.6324L10.6279 2.2679Z"
			fill="#9EA9B2"
		/>
		<path
			d="M4.2714 4.23793L15.7956 4.238L16.6507 12.9743L5.3493 12.9743L4.2714 4.23793Z"
			fill="#D8DADB"
		/>
		<path
			d="M0.018501 6.71709L14.346 5.87366L15.7587 16.952L1.7435 17.9558L0.018501 6.71709Z"
			fill="#BBC2C7"
		/>
		<path
			d="M0.0223556 10.0601L15.9707 7.73297L17.4322 20.8559L2.0787 24.5363L0.0223556 10.0601Z"
			fill="#9EA9B2"
		/>
		<path
			d="M6.42759 13.5694L21.2607 9.59129L22.376 23.8299L8.50962 30.1126L6.42759 13.5694Z"
			fill="#8796A1"
		/>
		<path
			d="M21.0751 16.395L30.3314 11.0046L31.1493 26.2094L22.4874 34.7227L21.0751 16.395Z"
			fill="#718491"
		/>
	</>
);

const StyleFour = () => (
	<svg {...SVG_PROPS}>
		<Frame />
		<g transform="translate(46.708 19.501) scale(1.19)">
			<rect width="21.56" height="21.56" rx="0.442" fill="#58707F" />
		</g>
		<g transform="translate(9.615 20.65) scale(1.19)">
			<SideFan />
		</g>
		<g transform="translate(109.46 20.65) scale(-1.19 1.19)">
			<SideFan />
		</g>
	</svg>
);

/** Card artwork and label per style, in picker order. */
const ITEMS = [
	{ icon: <StyleOne />, value: 'style-one', tooltip: __('Coverflow', 'wp-carousel-free') },
	{
		icon: <StyleTwo />,
		value: 'style-two',
		onlyPro: true,
		tooltip: __('Cylinder', 'wp-carousel-free'),
	},
	{
		icon: <StyleThree />,
		value: 'style-three',
		onlyPro: true,
		tooltip: __('Card Stack', 'wp-carousel-free'),
	},
	{
		icon: <StyleFour />,
		value: 'style-four',
		onlyPro: true,
		tooltip: __('Orbit', 'wp-carousel-free'),
	},
];

const Carousel3dStyles = ({
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
		className="wpcp-carousel-3d-layouts"
		label={label}
		onChange={onChange}
		items={ITEMS}
	/>
);

export default memo(Carousel3dStyles);
