import { Fragment } from '@wordpress/element';

const CheckMark = () => (
	<svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M0 7.73333L4.96774 15H7.09677L16 1.53333L13.9355 0L5.93548 9.46667L2 5.73333L0 7.73333Z"
			fill="white"
		/>
	</svg>
);

const StepArrow = () => (
	<svg
		className="wpcpf-sw-arrow"
		width="35"
		height="12"
		viewBox="0 0 35 12"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M28.5 6H0.5" stroke="#949494" strokeWidth="1.5" strokeLinecap="round" />
		<path
			d="M22.5 1L28.5 6L22.5 11"
			stroke="#949494"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export default function Navigation({ steps, currentStep }) {
	return (
		<div className="wpcpf-sw-navigation">
			{steps.map((step, index) => {
				const isCompleted = index < currentStep;
				let state = 'next';
				if (isCompleted) {
					state = 'completed';
				} else if (index === currentStep) {
					state = 'current';
				}

				return (
					<Fragment key={step.label}>
						<div className={`wpcpf-sw-step ${state}`}>
							<div className="wpcpf-sw-step-number">
								{isCompleted ? <CheckMark /> : String(index + 1).padStart(2, '0')}
							</div>
							<span className="wpcpf-sw-step-label">{step.label}</span>
						</div>
						{index < steps.length - 1 && <StepArrow />}
					</Fragment>
				);
			})}
		</div>
	);
}
