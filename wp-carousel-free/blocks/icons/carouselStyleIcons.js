/**
 * Carousel style icons – inline SVG (same pattern as contentOrientationIcons).
 * Source: wp-carousel-doc/carousel-style
 */

const STROKE_ACTIVE = '#1A74E4';
const STROKE_DEFAULT = '#98B0BF';

export const CarouselStyleStandardIcon = ({ value }) => {
	const stroke = value === 'standard' ? STROKE_ACTIVE : STROKE_DEFAULT;
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={75} height={55} viewBox="0 0 100 70" fill="none">
			<rect x={0.75} y={0.75} width={98.5} height={68.5} rx={3.25} stroke={stroke} strokeWidth={1.5} />
			<path
				d="M19.9 43.6H37c.5 0 .8-.4.8-.8V27.2c0-.5-.4-.8-.8-.8H19.9c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9m21.5 0h17.1c.5 0 .8-.4.8-.8V27.2c0-.5-.4-.8-.8-.8H41.4c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9m21.5 0H80c.5 0 .8-.4.8-.8V27.2c0-.5-.4-.8-.8-.8H62.9c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9m26.5-9.1L86 31.1c-.1-.1-.4-.1-.5 0l-.6.6c-.1.1-.1.4 0 .5l2.7 2.7c.1.1.1.4 0 .5l-2.7 2.7c-.1.1-.1.4 0 .5l.6.6c.1.1.4.1.5 0l3.4-3.4.6-.6zM15.2 32q.3-.3 0-.6l-.6-.6a.37.37 0 0 0-.6 0l-3.4 3.4-.6.6.6.6 3.4 3.4a.37.37 0 0 0 .6 0l.5-.5q.3-.3 0-.6l-2.5-2.5q-.3-.3 0-.6zM50 47.3a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2"
				fill="#58707f"
			/>
			<path
				d="M46 47.3a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2m8 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2"
				fill="#c1c4c6"
			/>
		</svg>
	);
};

export const CarouselStyleCenterIcon = ({ value }) => {
	const stroke = value === 'center' ? STROKE_ACTIVE : STROKE_DEFAULT;
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={75} height={55} viewBox="0 0 100 70" fill="none">
			<rect x={0.75} y={0.75} width={98.5} height={68.5} rx={3.25} stroke={stroke} strokeWidth={1.5} />
			<path
				d="M46 53.1a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m8 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2M33.1 27.3H19.8c-.4 0-.6.3-.6.6v12c0 .4.3.7.6.7h13.3c.4 0 .6-.3.6-.6V28c0-.4-.3-.7-.6-.7m47.1 0H66.9c-.4 0-.6.3-.6.6v12c0 .4.3.7.6.7h13.3c.4 0 .6-.3.6-.6V28c0-.4-.3-.7-.6-.7"
				fill="#98b0bf"
			/>
			<path
				d="M50 53.1a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2M61.8 22H38.1c-.7 0-1.1.6-1.1 1.1v21.6c0 .7.6 1.3 1.1 1.3h23.8c.7 0 1.1-.6 1.1-1.1V23.2c0-.7-.6-1.2-1.2-1.2m27.6 11.3L86 30c-.1-.1-.4-.1-.5 0l-.6.6c-.1.1-.1.4 0 .5l2.7 2.7c.1.1.1.4 0 .5L84.9 37c-.1.1-.1.4 0 .5l.6.6c.1.1.4.1.5 0l3.4-3.4.6-.7zm-74.2-2.1q.3-.3 0-.6l-.6-.6a.37.37 0 0 0-.6 0l-3.4 3.4-.6.6.6.6L14 38a.37.37 0 0 0 .6 0l.5-.5q.3-.3 0-.6l-2.5-2.5q-.3-.3 0-.6z"
				fill="#58707f"
			/>
		</svg>
	);
};

export const CarouselStyleMultiRowIcon = ({ value }) => {
	const stroke = value === 'multirow' ? STROKE_ACTIVE : STROKE_DEFAULT;
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={75} height={55} viewBox="0 0 100 70" fill="none">
			<rect x={0.75} y={0.75} width={98.5} height={68.5} rx={3.25} stroke={stroke} strokeWidth={1.5} />
			<path
				d="M20.9 53.2H38c.5 0 .8-.4.8-.8V36.8c0-.5-.4-.8-.8-.8H20.9c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9m21.5 0h17.1c.5 0 .8-.4.8-.8V36.8c0-.5-.4-.8-.8-.8H42.4c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9m21.5 0H81c.5 0 .8-.4.8-.8V36.8c0-.5-.4-.8-.8-.8H63.9c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9M51 56.9a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2M20.9 33.2H38c.5 0 .8-.4.8-.8V16.8c0-.5-.4-.8-.8-.8H20.9c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9m21.5 0h17.1c.5 0 .8-.4.8-.8V16.8c0-.5-.4-.8-.8-.8H42.4c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9m21.5 0H81c.5 0 .8-.4.8-.8V16.8c0-.5-.4-.8-.8-.8H63.9c-.5 0-.8.4-.8.8v15.5c0 .5.4.9.8.9"
				fill="#58707f"
			/>
			<path
				d="M47 56.9a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2m8 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2"
				fill="#c1c4c6"
			/>
			<path
				d="M14.363 30.863a.9.9 0 0 1 1.274 1.274L13.273 34.5l2.364 2.363a.9.9 0 0 1-1.274 1.274l-3-3a.9.9 0 0 1 0-1.274zm71 0a.9.9 0 0 1 1.274 0l3 3a.9.9 0 0 1 0 1.274l-3 3a.9.9 0 0 1-1.274-1.274l2.364-2.363-2.364-2.363a.9.9 0 0 1 0-1.274"
				fill="#58707f"
			/>
		</svg>
	);
};

export const CarouselStyleTripleIcon = ({ value }) => {
	const stroke = value === 'triple' ? STROKE_ACTIVE : STROKE_DEFAULT;
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={75} height={53} viewBox="0 0 100 70" fill="none">
			<rect x={0.75} y={0.75} width={98.5} height={68.5} rx={3.25} stroke={stroke} strokeWidth={1.5} />
			<path
				d="M45.6 57.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m8 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2"
				fill="#98b0bf"
			/>
			<path d="M49.6 57.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2" fill="#58707f" />
			<path
				d="M20 24.033a1 1 0 0 1 1.033-1l21 .685a1 1 0 0 1 .967 1v20.564a1 1 0 0 1-.967 1l-21 .684a1 1 0 0 1-1.033-1zm60 0a1 1 0 0 0-1.033-1l-21 .685a1 1 0 0 0-.967 1v20.564a1 1 0 0 0 .967 1l21 .684a1 1 0 0 0 1.033-1z"
				fill="#98b0bf"
			/>
			<path
				d="M64 20H36a1 1 0 0 0-1 1v28a1 1 0 0 0 1 1h28a1 1 0 0 0 1-1V21a1 1 0 0 0-1-1"
				fill="#58707f"
			/>
		</svg>
	);
};

export const CarouselStyleSpringIcon = ({ value }) => {
	const stroke = value === 'spring' ? STROKE_ACTIVE : STROKE_DEFAULT;
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={75} height={53} viewBox="0 0 100 70" fill="none">
			<rect x={0.75} y={0.75} width={98.5} height={68.5} rx={3.25} stroke={stroke} strokeWidth={1.5} />
			<path
				d="M45.6 63.1a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m8 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2"
				fill="#98b0bf"
			/>
			<path
				d="M49.6 63.1a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2M27 20H17a1 1 0 0 0-1 1v28a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V21a1 1 0 0 0-1-1m27 0H44a1 1 0 0 0-1 1v28a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V21a1 1 0 0 0-1-1m27 0H71a1 1 0 0 0-1 1v28a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V21a1 1 0 0 0-1-1"
				fill="#58707f"
			/>
			<path d="m43 41.75-15-21v7.5l15 21zm27 0-15-21v7.5l15 21z" fill="#98b0bf" />
		</svg>
	);
};

export const CarouselStylePartialViewIcon = ({ value }) => {
	const stroke = value === 'partialView' ? STROKE_ACTIVE : STROKE_DEFAULT;
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={75} height={53} viewBox="0 0 100 70" fill="none">
			<rect x={0.75} y={0.75} width={98.5} height={68.5} rx={3.25} stroke={stroke} strokeWidth={1.5} />
			<path
				d="M36.214 26H17.939a.834.834 0 0 0-.855.837v16.221c0 .523.427.942.855.942h18.275a.834.834 0 0 0 .855-.837V26.837c0-.523-.428-.837-.855-.837m-22.23.837v16.326c0 .418-.32.837-.854.837H8V26h5.237c.32 0 .748.314.748.837M59.192 26H40.916a.834.834 0 0 0-.855.837v16.221c0 .523.428.942.855.942h18.275a.834.834 0 0 0 .855-.837V26.837c0-.523-.428-.837-.855-.837m22.977 0H63.893a.834.834 0 0 0-.855.837v16.221c0 .523.428.942.855.942h18.275a.834.834 0 0 0 .855-.837V26.837c0-.523-.428-.837-.855-.837M92 26v18h-5.023c-.427 0-.977-.419-.977-.942v-16.22c0-.42.443-.838.977-.838z"
				fill="#58707f"
			/>
		</svg>
	);
};
