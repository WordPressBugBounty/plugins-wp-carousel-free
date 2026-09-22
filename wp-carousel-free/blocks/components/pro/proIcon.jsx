/**
 * Crown mark shared by the Pro notice header and the Pro badge.
 */

const ProIcon = ({ width = 16, height = 16 }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={width}
		height={height}
		fill="none"
		viewBox="0 0 16 16"
		aria-hidden="true"
		focusable="false"
	>
		<path
			className="wpcp-pro-icon-stroke"
			stroke="currentColor"
			strokeWidth={1.185}
			d="M10.384 5.882c.18.329.478.572.842.648.322.068.652-.007.922-.203l.112-.092 1.396-1.279 1.159-1.062-.81 6.437H2.124l-.812-6.437 2.556 2.341c.288.264.666.373 1.035.295.364-.076.662-.32.841-.648l2.32-4.254 2.32 4.254Z"
		/>
		<path
			className="wpcp-pro-icon-fill"
			fill="currentColor"
			d="M13.851 14.873H2.274c-.373 0-.674-.369-.674-.824V12.24h12.925v1.81c0 .454-.301.823-.674.823Z"
		/>
	</svg>
);

export default ProIcon;
