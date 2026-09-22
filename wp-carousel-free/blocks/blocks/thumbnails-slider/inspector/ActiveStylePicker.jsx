/**
 * Active thumbnail indicator picker — 6-tile visual chooser.
 *
 * Free writes only `none`; Frame, Indicator, Grayscale, Overlay and Countdown
 * are locked cards that open the pricing page instead of writing the attribute.
 * (Option three is grayscale dimming, not a polygon-pointer.) The picker only
 * writes the enum value; runtime markup mirrors a `wpcp-active-style-{value}`
 * class on the active thumb so visual differences are CSS-driven.
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import { Layouts } from '@wp-carousel-pro/components';

const SVG_PROPS = {
	width: 75,
	height: 58,
	viewBox: '0 0 105 75',
	fill: 'none',
	xmlns: 'http://www.w3.org/2000/svg',
};

// Brand color applied to the selected tile's outer frame, mirroring the
// active-state treatment of the thumbnails-style and carousel-style pickers.
const ACTIVE_COLOR = '#1A74E4';
const DEFAULT_COLOR = '#98B0BF';

const Frame = ({ children, active = false }) => (
	<svg {...SVG_PROPS}>
		<rect x={0.5} y={0.5} width={104} height={74} rx={4} fill="#fff" />
		<rect
			x={0.5}
			y={0.5}
			width={104}
			height={74}
			rx={4}
			strokeWidth="1.5"
			stroke={active ? ACTIVE_COLOR : DEFAULT_COLOR}
		/>
		{children}
	</svg>
);

const NoneTile = ({ active = false }) => (
	<Frame active={active}>
		<g mask="url(#a)">
			<rect x={10.5} y={10.5} width={84} height={54} rx={2} fill="#718491" />
			<path d="M49.5 24a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0" fill="#fff" />
			<path
				opacity={0.8}
				d="M97.5 64.5h-90l26.787-31.644a1.94 1.94 0 0 1 3.101 0L48.56 47.61l16.912-22.336a1.94 1.94 0 0 1 3.101 0z"
				fill="#fff"
			/>
			<rect x={10.7} y={10.7} width={83.6} height={53.6} rx={1.8} stroke="#718491" strokeWidth={0.4} />
		</g>
	</Frame>
);

const FrameTile = ({ active = false }) => (
	<Frame active={active}>
		<g mask="url(#a)">
			<rect x={10.5} y={10.5} width={84} height={54} rx={2} fill="#718491" />
			<path opacity={0.2} d="M49.5 24a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0" fill="#fff" />
			<path
				opacity={0.2}
				d="M97.5 64.5h-90l26.787-31.644a1.94 1.94 0 0 1 3.101 0L48.56 47.61l16.912-22.336a1.94 1.94 0 0 1 3.101 0z"
				fill="#fff"
			/>
			<rect x={10.7} y={10.7} width={83.6} height={53.6} rx={1.8} stroke="#718491" strokeWidth={0.4} />
			<rect x={15} y={15} width={75} height={45} rx={1.5} stroke="#fff" />
		</g>
	</Frame>
);

const BorderTile = ({ active = false }) => (
	<Frame active={active}>
		<path
			d="M52.117 10.797a1.46 1.46 0 0 1 1.766 0l7.156 5.601c.932.73.356 2.102-.882 2.102H45.843c-1.238 0-1.814-1.372-.883-2.102z"
			fill="#718491"
		/>
		<g mask="url(#a)">
			<rect x={10.5} y={16.5} width={84} height={48} rx={2} fill="#718491" />
			<path d="M50.5 32.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0" fill="#fff" />
			<path
				opacity={0.8}
				d="M94.5 65.5h-85l25.299-25.315c.738-.826 2.192-.826 2.929 0l10.55 11.803 15.973-17.869c.737-.825 2.191-.825 2.93 0z"
				fill="#fff"
			/>
			<rect x={10.7} y={16.7} width={83.6} height={47.6} rx={1.8} stroke="#718491" strokeWidth={0.4} />
		</g>
	</Frame>
);

const FilterTile = ({ active = false }) => (
	<Frame active={active}>
		<g mask="url(#a)">
			<rect x={10.5} y={10.5} width={84} height={54} rx={2} fill="#718491" />
			<path opacity={0.2} d="M49.5 24a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0" fill="#fff" />
			<path
				opacity={0.2}
				d="M97.5 64.5h-90l26.787-31.644a1.94 1.94 0 0 1 3.101 0L48.56 47.61l16.912-22.336a1.94 1.94 0 0 1 3.101 0z"
				fill="#fff"
			/>
			<rect x={10.7} y={10.7} width={83.6} height={53.6} rx={1.8} stroke="#718491" strokeWidth={0.4} />
			<path
				d="M49.376 45.48a4.9 4.9 0 0 0 3.093-1.112 4.903 4.903 0 0 0 7.423-1.399 4.88 4.88 0 0 0 .263-4.162 4.9 4.9 0 0 0-3.047-2.851 4.89 4.89 0 0 0-.66-4.417 4.9 4.9 0 0 0-7.958 0 4.89 4.89 0 0 0-.66 4.417 4.885 4.885 0 0 0-2.391 7.511 4.9 4.9 0 0 0 3.937 2.013m9.537-4.89a3.353 3.353 0 0 1-6.702 0c0-.098 0-.197.015-.294v-.073c0-.095.023-.188.044-.283q.03-.144.073-.284l.023-.072q.043-.131.093-.258l.01-.024h.258l.272-.023q.23-.028.454-.074h.062q.212-.047.42-.116l.08-.044q.206-.069.402-.157l.061-.028c.137-.062.258-.129.4-.203h.015a4 4 0 0 0 .374-.24l.046-.03q.178-.128.342-.271l.06-.051a4 4 0 0 0 .309-.302l.05-.054q.151-.166.288-.345h.001a3.35 3.35 0 0 1 2.55 3.225m-6.444-9.525c1.2.002 2.307.646 2.904 1.687a3.34 3.34 0 0 1-.224 3.657l-.072.09a4 4 0 0 1-.163.19l-.095.096a2 2 0 0 1-.17.157l-.106.088q-.092.072-.188.136l-.108.077c-.072.046-.144.084-.22.125l-.095.052q-.162.08-.331.142h-.032q-.139.048-.284.084a4.9 4.9 0 0 0-2.312-1.677l-.05-.013a4 4 0 0 0-.351-.096c-.05 0-.098-.028-.147-.04-.093-.021-.188-.032-.284-.047s-.152-.028-.23-.036c-.077-.008-.165 0-.257-.013-.093-.012-.183-.025-.278-.025a3.34 3.34 0 0 1 .305-3.144 3.35 3.35 0 0 1 2.788-1.49m-3.467 6.201q.186-.021.374-.023c.109 0 .216 0 .325.018h.098c.074 0 .152.02.226.036l.106.023q.117.027.232.065l.08.023q.15.052.298.115l.06.029c.077.036.155.074.226.118l.093.055q.096.059.185.123l.088.062.044.036-.093.149h.001a4.9 4.9 0 0 0-.662 2.898c0 .041 0 .083.013.124 0 .096.023.188.038.28 0 .045.015.091.023.134q.028.143.068.286c0 .036.018.072.028.108q.054.195.124.381l.02.052q.062.16.137.316l.056.114q.065.13.137.257l.068.111.044.074h-.001a3.35 3.35 0 0 1-5.174-1.365 3.34 3.34 0 0 1 .223-2.977 3.35 3.35 0 0 1 2.515-1.614z"
				fill="#fff"
			/>
		</g>
	</Frame>
);

const HalfOverlayTile = ({ active = false }) => (
	<Frame active={active}>
		<g mask="url(#a)">
			<rect x={10.5} y={10.5} width={84} height={54} rx={2} fill="#718491" />
			<path d="M49.5 24a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0" fill="#fff" />
			<path
				opacity={0.8}
				d="M97.5 64.5h-90l26.787-31.644a1.94 1.94 0 0 1 3.101 0L48.56 47.61l16.912-22.336a1.94 1.94 0 0 1 3.101 0z"
				fill="#fff"
			/>
			<rect x={10.7} y={10.7} width={83.6} height={53.6} rx={1.8} stroke="#718491" strokeWidth={0.4} />
			<rect opacity={0.6} x={10.5} y={10.5} width={43} height={54} rx={2} fill="#000" />
		</g>
	</Frame>
);

const CountdownTile = ({ active = false }) => (
	<Frame active={active}>
		<g mask="url(#a)">
			<rect x={10.5} y={10.5} width={84} height={54} rx={2} fill="#718491" />
			<path opacity={0.2} d="M49.5 24a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0" fill="#fff" />
			<path
				opacity={0.2}
				d="M97.5 64.5h-90l26.787-31.644a1.94 1.94 0 0 1 3.101 0L48.56 47.61l16.912-22.336a1.94 1.94 0 0 1 3.101 0z"
				fill="#fff"
			/>
			<rect x={10.7} y={10.7} width={83.6} height={53.6} rx={1.8} stroke="#718491" strokeWidth={0.4} />
			<path
				d="M56.1 39.244q0-.15-.088-.27-.087-.121-.324-.223a3.2 3.2 0 0 0-.672-.193 5 5 0 0 1-.74-.218 2.6 2.6 0 0 1-.59-.324 1.4 1.4 0 0 1-.387-.445 1.24 1.24 0 0 1-.14-.595q0-.329.14-.619.146-.29.411-.513.27-.227.658-.353.391-.13.88-.13.683 0 1.17.218.494.217.755.6.266.376.266.86h-1.393a.75.75 0 0 0-.087-.363.57.57 0 0 0-.261-.256.93.93 0 0 0-.455-.097.9.9 0 0 0-.401.083.6.6 0 0 0-.261.212.5.5 0 0 0-.087.29q0 .122.048.218a.5.5 0 0 0 .17.17q.115.077.3.145.188.062.463.115a5.4 5.4 0 0 1 1.011.305q.445.184.706.503.262.315.261.827 0 .348-.154.639a1.54 1.54 0 0 1-.445.507 2.3 2.3 0 0 1-.697.334q-.401.117-.904.116-.73 0-1.238-.261a1.96 1.96 0 0 1-.764-.663 1.54 1.54 0 0 1-.257-.831h1.32q.01.285.146.459.14.174.353.252.217.077.469.077.27 0 .45-.073.18-.077.27-.203a.5.5 0 0 0 .097-.3m-3.757.358v1.089h-4.817v-.93l2.278-2.441q.342-.383.541-.673.198-.294.285-.527.093-.237.092-.45 0-.319-.106-.546a.8.8 0 0 0-.314-.358.94.94 0 0 0-.503-.126.97.97 0 0 0-.552.155 1 1 0 0 0-.348.43 1.6 1.6 0 0 0-.116.624h-1.398q0-.628.3-1.15.3-.528.847-.837.546-.315 1.296-.315.74 0 1.247.242.513.237.774.687.267.444.266 1.064 0 .349-.111.682-.11.329-.32.657-.202.325-.492.658-.29.334-.644.692l-1.223 1.373z"
				fill="#fff"
			/>
			<path d="M52.5 24.5a13 13 0 1 1 0 26v-2.34a10.66 10.66 0 0 0 0-21.32z" fill="#fff" />
		</g>
	</Frame>
);

/** Order: One … Six. */
export const ACTIVE_STYLE_VALUES = [
	'none',
	'frame',
	'filter',
	'indicator',
	'half-overlay',
	'countdown',
];

const ActiveStylePicker = ({ attributes, setAttributes, attributesKey, label = '' }) => {
	const items = [
		{
			icon: <NoneTile active={'none' === attributes} />,
			value: 'none',
			tooltip: __('Default', 'wp-carousel-free'),
		},
		{
			icon: <FrameTile active={'frame' === attributes} />,
			value: 'frame',
			onlyPro: true,
			tooltip: __('Frame', 'wp-carousel-free'),
		},
		{
			icon: <BorderTile active={'indicator' === attributes} />,
			value: 'indicator',
			onlyPro: true,
			tooltip: __('Indicator', 'wp-carousel-free'),
		},
		{
			icon: <FilterTile active={'filter' === attributes} />,
			value: 'filter',
			onlyPro: true,
			tooltip: __('Grayscale', 'wp-carousel-free'),
		},
		{
			icon: <HalfOverlayTile active={'half-overlay' === attributes} />,
			value: 'half-overlay',
			onlyPro: true,
			tooltip: __('Overlay', 'wp-carousel-free'),
		},
		{
			icon: <CountdownTile active={'countdown' === attributes} />,
			value: 'countdown',
			onlyPro: true,
			tooltip: __('Countdown', 'wp-carousel-free'),
		},
	];

	return (
		<Layouts
			attributes={attributes}
			setAttributes={setAttributes}
			attributesKey={attributesKey}
			displayActive={true}
			grid={3}
			className="wpcp-active-style-picker"
			label={label}
			items={items}
		/>
	);
};

export default memo(ActiveStylePicker);
