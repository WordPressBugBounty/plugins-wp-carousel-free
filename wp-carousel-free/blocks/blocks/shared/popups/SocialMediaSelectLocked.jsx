/**
 * Locked stand-in for the per-item social platform multi-select.
 *
 * Choosing platforms per item is Pro. The box is drawn so the field reads the
 * same as in Pro, but it holds no value, opens nothing and writes no attribute
 * — the caller wraps it in `.wpcp-pro-locked-row`, which also kills hover.
 */

import './SocialMediaSelect.scss';

export default function SocialMediaSelectLocked() {
	return (
		<div className="wpcp-social-select">
			<div className="wpcp-social-select-control">
				<div className="wpcp-social-select-values" />
				<span className="wpcp-social-select-arrow">
					<svg
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</span>
			</div>
		</div>
	);
}
