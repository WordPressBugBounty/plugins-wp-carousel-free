import { __ } from '@wordpress/i18n';
import { useState, useId, createInterpolateElement } from '@wordpress/element';
import ProIcon from '../../../components/pro/proIcon';
import { getPricingUrl } from '../../../components/pro/proLinks';

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
							'Help us improve WP Carousel and get useful tips by sharing non-sensitive diagnostic data. See',
							'wp-carousel-free'
						)}
					</span>
					<button type="button" onClick={() => setShowModal(true)} className="wpcpf-sw-footer-link">
						{__('what we collect', 'wp-carousel-free')}
					</button>
					<span>.</span>
				</div>
			</div>

			{showModal && (
				<div
					className="wpcpf-sw-modal-overlay"
					role="presentation"
					onClick={() => setShowModal(false)}
					onKeyDown={(e) => 'Escape' === e.key && setShowModal(false)}
				>
					<div className="wpcpf-sw-modal" role="presentation" onClick={(e) => e.stopPropagation()}>
						<div className="wpcpf-sw-modal-header">
							<h3 className="wpcpf-sw-modal-title">{__('What We Collect?', 'wp-carousel-free')}</h3>
							<button
								type="button"
								className="wpcpf-sw-modal-close"
								onClick={() => setShowModal(false)}
								aria-label={__('Close', 'wp-carousel-free')}
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M7 7L17 17M7 17L17 7" stroke="#757575" strokeWidth="1.5" strokeLinecap="round" />
								</svg>
							</button>
						</div>

						<div className="wpcpf-sw-modal-divider" />

						<div className="wpcpf-sw-modal-content">
							<p className="wpcpf-sw-modal-text">
								{__(
									'We collect only non-sensitive diagnostic data and basic plugin usage information. This may include:',
									'wp-carousel-free'
								)}
							</p>
							<ul className="wpcpf-sw-modal-list">
								<li>{__('WordPress & PHP version', 'wp-carousel-free')}</li>
								<li>{__('Active theme and plugins', 'wp-carousel-free')}</li>
								<li>{__('General system details', 'wp-carousel-free')}</li>
								<li>
									{__(
										'Email address only for sending helpful updates or optional offers.',
										'wp-carousel-free'
									)}
								</li>
							</ul>
							<p className="wpcpf-sw-modal-text">
								{__(
									'This information helps us improve performance, fix issues faster, and ensure',
									'wp-carousel-free'
								)}{' '}
								<strong>{__('WP Carousel', 'wp-carousel-free')}</strong>{' '}
								{__('stays compatible with the popular plugins and themes.', 'wp-carousel-free')}
							</p>
							<p className="wpcpf-sw-modal-text wpcpf-sw-modal-text-bold">
								{__('No personal data is collected, and we never send spam—promise.', 'wp-carousel-free')}
							</p>
						</div>

						<span className="wpcpf-sw-modal-btn">
							<span className="wpcpf-sw-modal-btn-text">
								{__('Your Privacy is First', 'wp-carousel-free')}
							</span>
							<a
								href="https://shapedplugin.com/information-we-collect/"
								target="_blank"
								rel="noopener noreferrer"
								className="wpcpf-sw-modal-btn-link"
							>
								{__('Learn More', 'wp-carousel-free')}
								<svg
									width="14"
									height="14"
									viewBox="0 0 14 14"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M4.55517 10.3881C4.29482 10.6484 3.87216 10.6484 3.61181 10.3881C3.35173 10.1278 3.35184 9.706 3.61181 9.44568L4.55517 10.3881ZM10.5835 9.91638C10.5835 10.2846 10.2846 10.5834 9.9165 10.5834C9.54846 10.5845 9.25048 10.2845 9.25048 9.91638V5.69275L4.55517 10.3881L4.08349 9.91638L3.61181 9.44568L8.30712 4.75037H4.08349C3.7153 4.75037 3.4165 4.45156 3.4165 4.08337C3.4165 3.71518 3.7153 3.41638 4.08349 3.41638H9.9165C10.2846 3.41638 10.5835 3.71518 10.5835 4.08337V9.91638Z"
										fill="#4E4F52"
									/>
								</svg>
							</a>
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
