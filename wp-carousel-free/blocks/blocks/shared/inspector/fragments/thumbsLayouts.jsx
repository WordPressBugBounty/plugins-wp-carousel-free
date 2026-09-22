/**
 * Thumbnails layout preset.
 *
 * Free ships Thumb Bottom (`strip`) — the strip's top / bottom / left / right
 * position comes from Thumbnails Area → position. Thumb Overlay (`overlay`),
 * Slidable Menu (`list`) and Spotlight Thumb (`centered`) are Pro, drawn in
 * place as badged cards that open the pricing page instead of writing
 * `layoutOptions.thumbsLayout`.
 *
 * The picker is wired in `LayoutsPanel.jsx` only when the active block is
 * `wp-carousel-pro/thumbnails-slider`.
 */

import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Layouts } from '@wp-carousel-pro/components';
import { resolveThumbsLayout } from '../../constants/freeValues';

const SVG_PROPS = {
	viewBox: '0 0 120 84',
	fill: 'none',
	xmlns: 'http://www.w3.org/2000/svg',
	preserveAspectRatio: 'xMidYMid meet',
	width: 119,
	height: 83,
};

// Brand color applied to the selected card's illustration, mirroring the
// active-state treatment of the carousel-style picker (`carouselStyleIcons`).
const ACTIVE_COLOR = '#1A74E4';
const DEFAULT_COLOR = '#98B0BF';

const StyleOne = ({ active = false }) => {
	const color = active ? ACTIVE_COLOR : DEFAULT_COLOR;
	return (
		<svg {...SVG_PROPS}>
			<rect x={0.75} y={0.75} width={118.5} height={82.5} rx={3.25} stroke={color} strokeWidth={1.5} />
			<path
				d="M10 59a2 2 0 0 1 2-2h13.6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2zm20.6 0a2 2 0 0 1 2-2h13.6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H32.6a2 2 0 0 1-2-2zm20.6 0a2 2 0 0 1 2-2h13.6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H53.2a2 2 0 0 1-2-2zm20.6 0a2 2 0 0 1 2-2h13.6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H73.8a2 2 0 0 1-2-2zm20.6 0a2 2 0 0 1 2-2H108a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H94.4a2 2 0 0 1-2-2zM10 12a2 2 0 0 1 2-2h96a2 2 0 0 1 2 2v40a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2z"
				fill="#718491"
			/>
			<path
				d="M17.264 28.264a.9.9 0 0 1 1.273 1.273L16.174 31.9l2.363 2.364a.9.9 0 0 1-1.273 1.273l-3-3a.9.9 0 0 1 0-1.273zm84 0a.9.9 0 0 1 1.273 0l3 3a.9.9 0 0 1 0 1.273l-3 3a.9.9 0 1 1-1.273-1.273l2.363-2.364-2.363-2.363a.9.9 0 0 1 0-1.273"
				fill="#fff"
			/>
		</svg>
	);
};

const StyleTwo = ({ active = false }) => {
	const color = active ? ACTIVE_COLOR : DEFAULT_COLOR;
	return (
		<svg {...SVG_PROPS}>
			<rect x={0.75} y={0.75} width={118.5} height={82.5} rx={3.25} stroke={color} strokeWidth={1.5} />
			<rect x={10} y={10} width={100} height={64} rx={2} fill="#718491" />
			<path
				d="M14 58.733c0-.957.824-1.733 1.84-1.733h12.512c1.016 0 1.84.776 1.84 1.733v9.534c0 .957-.824 1.733-1.84 1.733H15.84c-1.016 0-1.84-.776-1.84-1.733zm18.952 0c0-.957.824-1.733 1.84-1.733h12.512c1.016 0 1.84.776 1.84 1.733v9.534c0 .957-.824 1.733-1.84 1.733H34.792c-1.016 0-1.84-.776-1.84-1.733zm18.952 0c0-.957.824-1.733 1.84-1.733h12.512c1.016 0 1.84.776 1.84 1.733v9.534c0 .957-.824 1.733-1.84 1.733H53.744c-1.016 0-1.84-.776-1.84-1.733zm18.952 0c0-.957.824-1.733 1.84-1.733h12.512c1.016 0 1.84.776 1.84 1.733v9.534c0 .957-.824 1.733-1.84 1.733H72.696c-1.016 0-1.84-.776-1.84-1.733zm18.952 0c0-.957.824-1.733 1.84-1.733h12.512c1.016 0 1.84.776 1.84 1.733v9.534c0 .957-.824 1.733-1.84 1.733H91.648c-1.016 0-1.84-.776-1.84-1.733zm-70.445-27.37a.9.9 0 0 1 1.274 1.274L18.273 35l2.364 2.363a.9.9 0 0 1-1.274 1.274l-3-3a.9.9 0 0 1 0-1.274zm80 0a.9.9 0 0 1 1.274 0l3 3a.9.9 0 0 1 0 1.274l-3 3a.901.901 0 0 1-1.274-1.274L101.727 35l-2.364-2.363a.9.9 0 0 1 0-1.274"
				fill="#fff"
			/>
		</svg>
	);
};

const StyleThree = ({ active = false }) => {
	const color = active ? ACTIVE_COLOR : DEFAULT_COLOR;
	return (
		<svg {...SVG_PROPS}>
			<rect x={0.75} y={0.75} width={118.5} height={82.5} rx={3.25} stroke={color} strokeWidth={1.5} />
			<rect x={10} y={10} width={100} height={64} rx={2} fill="#718491" />
			<rect x={10} y={10} width={30} height={64} rx={2} fill="#8796a1" />
			<path
				d="M13 14a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zm23.25 1.25a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1 0-1.5zm-3 3a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1 0-1.5zM13 26a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zm23.25 1.25a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1 0-1.5zm-3 3a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1 0-1.5zM13 38a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zm23.25 1.25a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1 0-1.5zm-3 3a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1 0-1.5zM13 50a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zm23.25 1.25a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1 0-1.5zm-3 3a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1 0-1.5zM13 62a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zm23.25 1.25a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1 0-1.5zm-3 3a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1 0-1.5z"
				fill="#fff"
			/>
		</svg>
	);
};

const StyleFour = ({ active = false }) => {
	const color = active ? ACTIVE_COLOR : DEFAULT_COLOR;
	return (
		<svg {...SVG_PROPS}>
			<rect x={0.75} y={0.75} width={118.5} height={82.5} rx={3.25} stroke={color} strokeWidth={1.5} />
			<path
				d="M26 64.467c0-.81.6-1.467 1.34-1.467h9.112c.74 0 1.34.657 1.34 1.467v8.066c0 .81-.6 1.467-1.34 1.467H27.34c-.74 0-1.34-.657-1.34-1.467zm13.802 0c0-.81.6-1.467 1.34-1.467h9.112c.74 0 1.34.657 1.34 1.467v8.066c0 .81-.6 1.467-1.34 1.467h-9.112c-.74 0-1.34-.657-1.34-1.467zm13.802 0c0-.81.6-1.467 1.34-1.467h9.112c.74 0 1.34.657 1.34 1.467v8.066c0 .81-.6 1.467-1.34 1.467h-9.112c-.74 0-1.34-.657-1.34-1.467zm13.802 0c0-.81.6-1.467 1.34-1.467h9.112c.74 0 1.34.657 1.34 1.467v8.066c0 .81-.6 1.467-1.34 1.467h-9.112c-.74 0-1.34-.657-1.34-1.467zm13.802 0c0-.81.6-1.467 1.34-1.467h9.112c.74 0 1.34.657 1.34 1.467v8.066c0 .81-.6 1.467-1.34 1.467h-9.112c-.74 0-1.34-.657-1.34-1.467zM26 12a2 2 0 0 1 2-2h63a2 2 0 0 1 2 2v46a2 2 0 0 1-2 2H28a2 2 0 0 1-2-2zm71 3a2 2 0 0 1 2-2h20v44H99a2 2 0 0 1-2-2zM1 13h20a2 2 0 0 1 2 2v40a2 2 0 0 1-2 2H1z"
				fill="#718491"
			/>
		</svg>
	);
};

const ThumbsLayouts = ({
	attributes,
	setAttributes,
	attributesKey,
	label = '',
	onChange = false,
}) => {
	const lo = attributes.layoutOptions || {};
	const thumbsLayout = resolveThumbsLayout(lo.thumbsLayout);

	const items = [
		{
			icon: <StyleOne active={'strip' === thumbsLayout} />,
			value: 'strip',
			tooltip: __('Thumb Bottom', 'wp-carousel-free'),
		},
		{
			icon: <StyleTwo />,
			value: 'overlay',
			onlyPro: true,
			tooltip: __('Thumb Overlay', 'wp-carousel-free'),
		},
		{
			icon: <StyleThree />,
			value: 'list',
			onlyPro: true,
			tooltip: __('Slidable Menu', 'wp-carousel-free'),
		},
		{
			icon: <StyleFour />,
			value: 'centered',
			onlyPro: true,
			tooltip: __('Spotlight Thumb', 'wp-carousel-free'),
		},
	];
	return (
		<Layouts
			attributes={thumbsLayout}
			setAttributes={setAttributes}
			attributesKey={attributesKey}
			displayActive={true}
			grid={2}
			className="wpcp-thumbs-layouts"
			label={label}
			onChange={onChange}
			items={items}
		/>
	);
};

export default memo(ThumbsLayouts);
