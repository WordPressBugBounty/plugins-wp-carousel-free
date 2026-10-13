import { __ } from '@wordpress/i18n';
import { useState, useId, createInterpolateElement } from '@wordpress/element';
import ProIcon from '../../../components/pro/proIcon';
import { getPricingUrl } from '../../../components/pro/proLinks';
import DiagnosticDataModal from '../../templates/DiagnosticDataModal';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;
const img = (file) => `${wpcpf?.pluginUrl || ''}src/Admin/img/setup-wizard/${file}`;

const CheckMark = () => (
	<svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M0.75 3.08333L2.61164 5.56552C2.68466 5.66289 2.827 5.673 2.91306 5.58694L7.75 0.75"
			stroke="white"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>
);

/**
 * Finish step. The consent choice and its save live in SetupWizard, so stepping
 * back and forward cannot discard it and both Finish buttons store the same value.
 *
 * @param {Object}   props
 * @param {boolean}  props.shareData    Whether diagnostic sharing is ticked.
 * @param {Function} props.setShareData Toggles the tick.
 * @param {Function} props.onFinish     Saves the choice and leaves the wizard.
 * @param {boolean}  props.saving       Whether the save is in flight.
 */
export default function FinishPage({ shareData, setShareData, onFinish, saving }) {
	const [showModal, setShowModal] = useState(false);
	const consentCheckboxId = useId();

	return (
		<div className="wpcpf-sw-content-card wpcpf-sw-finish-page">
			<div className="wpcpf-sw-finish-top">
				<div className="wpcpf-sw-celebration">
					<img
						src={img('celebration.png')}
						alt=""
						aria-hidden="true"
						className="wpcpf-sw-celebration-img"
					/>
				</div>

				<div className="wpcpf-sw-finish-header">
					<h2 className="wpcpf-sw-finish-title">
						{__('Ready to Create Your First Showcase', 'wp-carousel-free')}
					</h2>
					<p className="wpcpf-sw-finish-description">
						{__(
							'WP Carousel is now ready to use. Create beautiful sliders, galleries, post and product showcases, and more in just a few clicks.',
							'wp-carousel-free'
						)}
					</p>
				</div>

				<button type="button" className="wpcpf-sw-finish-btn" onClick={onFinish} disabled={saving}>
					{__("Finish & Let's Get Started", 'wp-carousel-free')}
				</button>
			</div>

			<div className="wpcpf-sw-upgrade-card">
				<div className="wpcpf-sw-upgrade-title">
					<h3 className="wpcpf-sw-upgrade-heading">
						{__('Building Stunning Showcase Without Limits', 'wp-carousel-free')}
					</h3>
					<p className="wpcpf-sw-upgrade-text">
						{createInterpolateElement(
							__(
								'Trusted by <count>80,000+</count> creators to build beautiful carousels and galleries with powerful features — now it’s your turn!',
								'wp-carousel-free'
							),
							{ count: <strong /> }
						)}
					</p>
				</div>

				<a
					className="wpcpf-sw-upgrade-btn"
					href={getPricingUrl()}
					target="_blank"
					rel="noopener noreferrer"
				>
					<ProIcon width={24} height={24} />
					{__('Upgrade to Pro!', 'wp-carousel-free')}
				</a>

				{/* Decorative showcase stack. Fixed sizes and transforms come from the
				    design; aria-hidden because it carries no information. */}
				<div className="wpcpf-sw-upgrade-slides" aria-hidden="true">
					<span className="wpcpf-sw-upgrade-slide wpcpf-sw-upgrade-slide--blank-back" />
					<span className="wpcpf-sw-upgrade-slide wpcpf-sw-upgrade-slide--blank-front" />
					<span className="wpcpf-sw-upgrade-slide wpcpf-sw-upgrade-slide--left">
						<img src={img('upgrade-slide-left.jpg')} alt="" />
					</span>
					<span className="wpcpf-sw-upgrade-slide wpcpf-sw-upgrade-slide--mid">
						<img src={img('upgrade-slide-mid.jpg')} alt="" />
					</span>
					<span className="wpcpf-sw-upgrade-slide wpcpf-sw-upgrade-slide--right">
						<img src={img('upgrade-slide-right.jpg')} alt="" />
					</span>
				</div>
			</div>

			<div className="wpcpf-sw-finish-footer">
				<label className="wpcpf-sw-footer-checkbox" htmlFor={consentCheckboxId}>
					<input
						id={consentCheckboxId}
						type="checkbox"
						checked={shareData}
						onChange={() => setShareData(!shareData)}
					/>
					<span className="wpcpf-sw-footer-checkbox-box">{shareData && <CheckMark />}</span>
				</label>
				<div className="wpcpf-sw-footer-text">
					<span>
						{__(
							'Help us improve WP Carousel and get useful tips by sharing diagnostic data. See',
							'wp-carousel-free'
						)}
					</span>
					<button type="button" onClick={() => setShowModal(true)} className="wpcpf-sw-footer-link">
						{__('what we collect', 'wp-carousel-free')}
					</button>
					<span>.</span>
				</div>
			</div>

			{showModal && <DiagnosticDataModal onClose={() => setShowModal(false)} />}
		</div>
	);
}
