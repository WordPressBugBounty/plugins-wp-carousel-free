import { useId } from '@wordpress/element';

const GRADIENT_START = '#157592';
const GRADIENT_END = '#00b4c4';

// Glyph artwork on a 150x150 grid; `gradient` is the gradient each path takes in the colored mark.
const BRAND_MARK_PATHS = [
	{
		d: 'M83.439 33.972a7.347 7.347 0 0 0-7.347-7.347H7.124c-1.477 0-2.685 1.2-2.685 2.667v90.666c0 1.467 1.208 2.667 2.685 2.667h123.543c1.477 0 2.686-1.2 2.686-2.667V86.625a8 8 0 0 0-8-8h-.168a8 8 0 0 0-8 8v18.64c0 1.467-1.209 2.667-2.686 2.667H23.292c-1.477 0-2.685-1.2-2.685-2.667v-61.28c0-1.467 1.208-2.667 2.685-2.667h52.8a7.347 7.347 0 0 0 7.347-7.346',
		evenOdd: true,
		gradient: 'frame',
	},
	{
		d: 'm105.85 75.425-4.997 6.2-6.417 7.96a1.337 1.337 0 0 1-1.88.214l-5.774-4.614c-.564-.453-.672-1.306-.215-1.866l1.37-1.694 4.968-6.146c.403-.48.403-1.174 0-1.68l-6.392-7.894c-.456-.586-.376-1.413.215-1.866l5.775-4.614c.59-.453 1.423-.373 1.88.214l10.635 13.173.806.96c.429.453.429 1.147.026 1.653',
		gradient: 'frame',
	},
	{
		d: 'm44.858 75.479 6.339 7.84c.456.587.376 1.413-.215 1.867l-5.748 4.586c-.59.454-1.423.374-1.88-.213l-11.44-14.133c-.404-.48-.404-1.174 0-1.68l.214-.267 11.307-13.867a1.34 1.34 0 0 1 1.88-.213l5.774 4.613c.59.454.672 1.307.215 1.867l-6.446 7.947c-.376.48-.402 1.173 0 1.653',
		gradient: 'frame',
	},
	{
		d: 'M93.181 40.162c-1.013.345-1.013 2.081 0 2.426 15.763 5.366 21.243 18.55 23.1 25.803.117.455 1.716.455 1.833 0 1.857-7.254 7.337-20.437 23.1-25.803 1.013-.345 1.013-2.081 0-2.426-15.763-5.366-21.243-18.55-23.1-25.803-.117-.455-1.716-.455-1.833 0-1.857 7.254-7.337 20.437-23.1 25.803',
		gradient: 'sparkle',
	},
];

const GRADIENT_VECTORS = {
	frame: { x1: '13.463', y1: '26.625', x2: '92.686', y2: '146.16' },
	sparkle: { x1: '92.805', y1: '9.375', x2: '150.152', y2: '66.487' },
};

const GradientStops = () => (
	<>
		<stop stopColor={GRADIENT_START} />
		<stop offset="1" stopColor={GRADIENT_END} />
	</>
);

const GlyphPaths = ({ fillFor }) =>
	BRAND_MARK_PATHS.map(({ d, evenOdd, gradient }) => (
		<path
			key={d}
			d={d}
			fill={fillFor(gradient)}
			{...(evenOdd ? { fillRule: 'evenodd', clipRule: 'evenodd' } : {})}
		/>
	));

/**
 * WP Carousel AI brand mark, shared by every place the AI builder shows its icon.
 *
 * Gradient ids are namespaced per mount so two marks on one screen never share fills.
 *
 * @param {Object} props
 * @param {number} [props.size] Width/height in pixels.
 * @return {JSX.Element} The brand mark.
 */
export default function BrandMarkIcon({ size = 22 }) {
	const uid = useId();
	const gradientId = (gradient) => `wpcpAiBrand-${gradient}${uid}`;

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 150 150"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<GlyphPaths fillFor={(gradient) => `url(#${gradientId(gradient)})`} />
			<defs>
				{Object.entries(GRADIENT_VECTORS).map(([gradient, vector]) => (
					<linearGradient
						key={gradient}
						id={gradientId(gradient)}
						{...vector}
						gradientUnits="userSpaceOnUse"
					>
						<GradientStops />
					</linearGradient>
				))}
			</defs>
		</svg>
	);
}

/**
 * The brand mark in white on a gradient tile, as the Modules page draws the AI module.
 *
 * @param {Object} props
 * @param {number} [props.size] Width/height in pixels.
 * @return {JSX.Element} The tile.
 */
export function BrandMarkTile({ size = 36 }) {
	const gradientId = `wpcpAiTile${useId()}`;

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 44 44"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<rect width="44" height="44" rx="7.135" fill={`url(#${gradientId})`} />
			<svg x="8" y="8" width="28" height="28" viewBox="0 0 150 150">
				<GlyphPaths fillFor={() => '#fff'} />
			</svg>
			<defs>
				<linearGradient id={gradientId} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
					<GradientStops />
				</linearGradient>
			</defs>
		</svg>
	);
}
