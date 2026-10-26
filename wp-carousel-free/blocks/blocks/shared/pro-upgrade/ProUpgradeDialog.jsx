/**
 * "Do more with WP Carousel Pro" — what picking a Pro block in the inserter
 * opens instead of putting the block on the canvas.
 *
 * The Pro layouts drifting the way a Marquee does, the Pro features in two
 * columns, and the way to upgrade.
 */

import { Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getPricingUrl } from '@wp-carousel-pro/components/pro/proLinks';
import { PRO_BLOCKS, getProBlockInfo } from '../constants/proFeatures';
import getPluginUrl from '../utils/pluginUrl';
import './pro-upgrade-dialog.scss';

// Layout artwork ships under `src/` so it is packaged; `blocks/` is not.
const IMAGE_DIR = 'src/Blocks/img/';

/**
 * Pro features listed in the dialog.
 *
 * @return {Array<string>} Feature labels.
 */
function getFeatures() {
	return [
		__('All Pro Blocks', 'wp-carousel-free'),
		__('40+ Advanced Layouts & 6 Skins', 'wp-carousel-free'),
		__('200+ Ready Patterns for Quick Start', 'wp-carousel-free'),
		__('Query Builder and Custom Post Types', 'wp-carousel-free'),
		__('Entrance Animations & Motion Effects', 'wp-carousel-free'),
		__('Password Protection & Scheduling', 'wp-carousel-free'), // isolation-ignore
		__('Watermarks, Image Protection & Filters', 'wp-carousel-free'),
		__('Ken Burns, Slicer & 19 WebGL Shader Effects', 'wp-carousel-free'),
		__('30+ Content Animations & 30 Hover Effects', 'wp-carousel-free'),
		__('Filterable, Sortable, Ajax Search', 'wp-carousel-free'),
		__('12+ Video Sources with Inline & Popup Play', 'wp-carousel-free'),
		__('Audio, PDF & External Sources', 'wp-carousel-free'),
		__('20+ Advanced Lightbox Options', 'wp-carousel-free'),
		__('Priority Support', 'wp-carousel-free'),
	];
}

/**
 * The Pro blocks, starting with the one that asked for the dialog.
 *
 * @param {string} [blockName] Pro block that opened the dialog.
 * @return {Array<Object>} Block info entries.
 */
function getLayoutCards(blockName) {
	const names = Object.keys(PRO_BLOCKS);
	const start = Math.max(0, names.indexOf(blockName));

	return [...names.slice(start), ...names.slice(0, start)].map((name) => PRO_BLOCKS[name]);
}

/**
 * One drifting lane of layout cards, doubled so the loop never shows a gap.
 *
 * @param {Object} props
 * @param {string} props.blockName Pro block that opened the dialog.
 * @param {string} props.baseUrl   Plugin URL the artwork loads from.
 * @return {JSX.Element} Lane.
 */
function LayoutLane({ blockName, baseUrl }) {
	const cards = getLayoutCards(blockName);

	return (
		<div className="wpcp-pro-upgrade-lanes" aria-hidden="true">
			<div className="wpcp-pro-upgrade-lane">
				{[...cards, ...cards].map((card, index) => (
					<figure key={index} className="wpcp-pro-upgrade-card">
						<img src={`${baseUrl}${IMAGE_DIR}${card.previewImage}`} alt="" width="326" height="231" decoding="async" />
						<figcaption>{card.title}</figcaption>
					</figure>
				))}
			</div>
		</div>
	);
}

/**
 * The dialog.
 *
 * @param {Object}   props
 * @param {string}   [props.blockName] Pro block that opened it.
 * @param {Function} props.onClose     Closes the dialog.
 * @return {JSX.Element} Dialog.
 */
export default function ProUpgradeDialog({ blockName, onClose }) {
	const baseUrl = getPluginUrl();
	const info = getProBlockInfo(blockName);

	return (
		<Modal
			className="wpcp-pro-upgrade"
			overlayClassName="wpcp-pro-upgrade-overlay"
			title={__('WP Carousel Pro', 'wp-carousel-free')}
			onRequestClose={onClose}
			__experimentalHideHeader
		>
			<div className={`wpcp-pro-upgrade-visual${baseUrl ? '' : ' is-bare'}`}>
				{baseUrl && <LayoutLane blockName={blockName} baseUrl={baseUrl} />}
				<button
					type="button"
					className="wpcp-pro-upgrade-close"
					aria-label={__('Close', 'wp-carousel-free')}
					onClick={onClose}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</div>
			<div className="wpcp-pro-upgrade-body">
				<div className="wpcp-pro-upgrade-intro">
					<h2 className="wpcp-pro-upgrade-title">{__('Do more with WP Carousel Pro', 'wp-carousel-free')}</h2>
					<p className="wpcp-pro-upgrade-subtitle">
						{info
							? createInterpolateElement(
									sprintf(
										/* translators: %s: Pro block title, e.g. "Marquee". */
										__('<strong>%s</strong> is a Pro block. Upgrade to unlock it with more layouts, effects and sources for every carousel, slider, and gallery.', 'wp-carousel-free'),
										info.title
									),
									{ strong: <strong /> }
								)
							: __('More layouts, effects and sources for every carousel, slider, and gallery.', 'wp-carousel-free')}
					</p>
				</div>
				<ul className="wpcp-pro-upgrade-features">
					{getFeatures().map((feature) => (
						<li key={feature}>{feature}</li>
					))}
				</ul>
				<div className="wpcp-pro-upgrade-actions">
					<a className="wpcp-pro-upgrade-cta" href={getPricingUrl()} target="_blank" rel="noopener noreferrer">
						{__('Upgrade to Pro', 'wp-carousel-free')}
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M5 12h14M13 6l6 6-6 6" />
						</svg>
					</a>
					<span className="wpcp-pro-upgrade-guarantee">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
						</svg>
						{__('14-day money-back guarantee', 'wp-carousel-free')}
					</span>
				</div>
			</div>
		</Modal>
	);
}
