import { __ } from '@wordpress/i18n';
import { useState, useId } from '@wordpress/element';
import { buildPatternLibraryEditorUrl } from '@wp-carousel-pro/common/readyPatternsDeepLink';
import { carouselBlocksInfo, showcaseBlocks } from './block-data';
import { DocsIcon, DemoIcon } from './icons';
import ProIcon from '../../../components/pro/proIcon';
import { toastSuccessMsg, toastErrorMsg } from '../../functions';

/**
 * Accessible name for a block's switch, which also has to explain why it is off.
 *
 * @param {boolean} isPro      Whether the block is Pro-only.
 * @param {boolean} comingSoon Whether the block ships in a future version.
 * @return {string} Label text.
 */
function proOrSoonLabel(isPro, comingSoon) {
	if (isPro) {
		return __('Available in WP Carousel Pro', 'wp-carousel-free');
	}
	if (comingSoon) {
		return __('Block coming in a future version', 'wp-carousel-free');
	}
	return __('Toggle block visibility', 'wp-carousel-free');
}

/**
 * One block row. A Pro block is genuinely inert: it carries a PRO badge and a
 * disabled switch, and never calls saveOptions — the server's slug allow-list
 * rejects it too.
 *
 * @param {Object}   props
 * @param {Object}   props.item            Row from the server (name, title, show, isPro).
 * @param {Function} props.saveOptions     Dashboard save helper.
 * @param {Array}    props.blockVisibility Full list, sent back on every toggle.
 */
export function BlockCard({ item, saveOptions, blockVisibility }) {
	const [saving, setSaving] = useState(false);
	const blockInfo = carouselBlocksInfo[item.name] || {};
	const toggleInputId = useId();
	const isPro = !!item.isPro;
	const comingSoon = !!item.coming_soon;

	const toggleDisabled = isPro || comingSoon;

	// A carousel block's demo is its Ready Patterns: open a fresh page with the
	// library already filtered to that block. Pro blocks included — their patterns
	// preview in the editor and carry the upgrade path. An upcoming block has no
	// patterns yet, so it shows no Demo link.
	const demoHref =
		!comingSoon && showcaseBlocks.includes(item.name)
			? buildPatternLibraryEditorUrl(window.wpcpfDashboard?.adminUrl, item.name)
			: null;

	const handleChange = () => {
		if (toggleDisabled) {
			return;
		}
		setSaving(true);
		const message = item.show
			? __('Block disabled successfully.', 'wp-carousel-free')
			: __('Block enabled successfully.', 'wp-carousel-free');
		const updatedVisibility = (blockVisibility || [])
			.filter((block) => !block.isPro)
			.map((block) => (block.name === item.name ? { ...block, show: !block.show } : block));

		saveOptions({ blockVisibility: updatedVisibility })
			.then(() => {
				setSaving(false);
				toastSuccessMsg(message);
			})
			.catch(() => {
				setSaving(false);
				toastErrorMsg(__('Something went wrong', 'wp-carousel-free'));
			});
	};

	return (
		<div
			className={`wpcpf-block-card${isPro ? ' wpcpf-block-card--pro' : ''}${
				comingSoon ? ' wpcpf-block-card--coming-soon' : ''
			}`}
		>
			{isPro && (
				<span className="wpcpf-block-card-pro-badge">
					<ProIcon width={12} height={12} />
					{__('PRO', 'wp-carousel-free')}
				</span>
			)}
			<div className="wpcpf-block-card-icon">{blockInfo.icon}</div>
			<div className="wpcpf-block-card-content">
				<div className="wpcpf-block-card-title-section">
					<div className="wpcpf-block-card-title-row">
						<h3 className="wpcpf-block-card-title">{blockInfo.title || item.title || item.name}</h3>
						{comingSoon && (
							<span className="wpcpf-block-card-badge wpcpf-block-card-badge--soon">
								{__('Coming Soon', 'wp-carousel-free')}
							</span>
						)}
					</div>
					<div className="wpcpf-block-card-links">
						{blockInfo.docLink && (
							<a
								href={blockInfo.docLink}
								target="_blank"
								rel="noopener noreferrer"
								className="wpcpf-block-card-link"
							>
								<DocsIcon />
								<span>{__('Docs', 'wp-carousel-free')}</span>
							</a>
						)}
						{demoHref && (
							<a href={demoHref} className="wpcpf-block-card-link">
								<DemoIcon />
								<span>{__('Demo', 'wp-carousel-free')}</span>
							</a>
						)}
					</div>
				</div>

				<label
					className={`wpcpf-block-toggle${toggleDisabled ? ' is-disabled' : ''}`}
					htmlFor={toggleInputId}
					aria-label={proOrSoonLabel(isPro, comingSoon)}
				>
					<input
						id={toggleInputId}
						type="checkbox"
						checked={!toggleDisabled && !!item.show}
						onChange={handleChange}
						disabled={saving || toggleDisabled}
					/>
					<span className="wpcpf-block-toggle-slider" />
				</label>
			</div>
		</div>
	);
}
