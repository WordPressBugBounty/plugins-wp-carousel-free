import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { toastSuccessMsg, toastErrorMsg } from '../functions';
import Navigation from './parts/navigation';
import WelcomePage from './pages/welcome';
import BlocksPage from './pages/blocks';
import ModulesPage from './pages/modules';
import FinishPage from './pages/finish';
import useDashboardData from '../hooks/useDashboardData';

const PrevArrow = () => (
	<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M5.826 8.053a.71.71 0 0 0 .048.948l4.25 4.25a.708.708 0 0 0 1.002-1.002L7.376 8.5l3.75-3.749a.708.708 0 1 0-1.002-1.002L5.874 8z"
			fill="#2f2f2f"
		/>
	</svg>
);

const NextArrow = () => (
	<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M11.174 8.053a.71.71 0 0 1-.048.948l-4.25 4.25a.708.708 0 1 1-1.002-1.002L9.624 8.5l-3.75-3.749a.708.708 0 1 1 1.002-1.002L11.126 8z"
			fill="#fff"
		/>
	</svg>
);

// Pro's fifth step is License Key, which Free has no equivalent for.
const STEPS = [
	{ label: __('Welcome', 'wp-carousel-free') },
	{ label: __('Blocks', 'wp-carousel-free') },
	{ label: __('Modules', 'wp-carousel-free') },
	{ label: __('Finish', 'wp-carousel-free') },
];

export default function SetupWizard() {
	const [currentStep, setCurrentStep] = useState(0);
	const { options, saveOptions } = useDashboardData();

	// Held here, not in FinishPage: renderStep() unmounts each step, so page-local
	// state would be discarded the moment the user pressed Previous.
	const [shareData, setShareData] = useState(!!options?.diagnosticConsent);
	const [finishing, setFinishing] = useState(false);

	const isLastStep = currentStep === STEPS.length - 1;

	const goToDashboard = () => {
		const adminUrl = window.wpcpfDashboard?.adminUrl || '';
		window.location.href = `${adminUrl}edit.php?post_type=sp_wp_carousel&page=wpcpf_dashboard`;
	};

	// Both Finish buttons run this, so neither can leave the choice unsaved.
	const finishWizard = async () => {
		setFinishing(true);
		try {
			const result = await saveOptions({ diagnosticConsent: shareData });
			if (result?.success) {
				toastSuccessMsg(__('Settings saved successfully.', 'wp-carousel-free'));
				goToDashboard();
			} else {
				toastErrorMsg(__('Something went wrong.', 'wp-carousel-free'));
			}
		} catch (error) {
			toastErrorMsg(__('Something went wrong.', 'wp-carousel-free'));
		} finally {
			setFinishing(false);
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return <BlocksPage blockVisibility={options?.blockVisibility} saveOptions={saveOptions} />;
			case 2:
				return <ModulesPage modulesOptions={options?.modulesOptions} saveOptions={saveOptions} />;
			case 3:
				return (
					<FinishPage
						shareData={shareData}
						setShareData={setShareData}
						onFinish={finishWizard}
						saving={finishing}
					/>
				);
			default:
				return <WelcomePage />;
		}
	};

	return (
		<div className="wpcpf-sw-wrapper">
			<div className="wpcpf-sw-inner">
				<Navigation steps={STEPS} currentStep={currentStep} />
				{renderStep()}
				<div className="wpcpf-sw-nav-buttons">
					{0 === currentStep && (
						<button type="button" className="wpcpf-sw-skip-button" onClick={goToDashboard}>
							{__('Skip It', 'wp-carousel-free')}
						</button>
					)}
					{currentStep >= 1 && (
						<button
							type="button"
							className="wpcpf-sw-skip-button"
							onClick={() => setCurrentStep(currentStep - 1)}
						>
							<PrevArrow />
							{__('Previous', 'wp-carousel-free')}
						</button>
					)}
					{isLastStep ? (
						<button
							type="button"
							className="wpcpf-sw-next-button"
							onClick={finishWizard}
							disabled={finishing}
						>
							{__('Finish', 'wp-carousel-free')}
						</button>
					) : (
						<button
							type="button"
							className="wpcpf-sw-next-button"
							onClick={() => setCurrentStep(currentStep + 1)}
						>
							{__('Next Step', 'wp-carousel-free')}
							<NextArrow />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
