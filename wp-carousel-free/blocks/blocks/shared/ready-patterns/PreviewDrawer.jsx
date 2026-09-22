import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useLayoutEffect, useRef, useState } from '@wordpress/element';
import { PREVIEW_DEVICES } from './constants';
import { resolveItemTier } from './filterHelpers';
import UpgradeButton from './UpgradeButton';
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	CloseIcon,
	DesktopIcon,
	DownloadIcon,
	ExternalLinkIcon,
	MobileIcon,
	RefreshIcon,
	TabletIcon,
} from './icons';

/**
 * Height the frame falls back to before the stage has been measured.
 */
const FALLBACK_STAGE_HEIGHT = 560;

/** How long the preloader waits on a frame that may never fire `load`. */
const FRAME_LOAD_TIMEOUT_MS = 15000;

const DEVICE_ICONS = {
	desktop: DesktopIcon,
	tablet: TabletIcon,
	mobile: MobileIcon,
};

/**
 * Translated label for a device key.
 *
 * @param {string} key Device key.
 * @return {string} Label.
 */
function deviceLabel(key) {
	if ('tablet' === key) {
		return __('Tablet', 'wp-carousel-free');
	}
	if ('mobile' === key) {
		return __('Mobile', 'wp-carousel-free');
	}

	return __('Desktop', 'wp-carousel-free');
}

/**
 * In-modal preview drawer: live iframe when the pattern has a preview URL,
 * full-size thumbnail otherwise. The header carries the title, width switcher,
 * the Insert or upgrade action and close; a footer under the stage steps
 * through the filtered list, so the stage between them gets the drawer's
 * full width.
 *
 * A Pro pattern previews the same way a Free one does — only the action
 * changes, so the library sells the upgrade instead of hiding it.
 *
 * The iframe is sandboxed without `allow-same-origin`, and deliberately keeps the
 * default referrer policy — third-party players embedded inside a previewed
 * pattern reject refererless requests.
 *
 * @param {Object}   props
 * @param {Object}   props.pattern     Manifest item being previewed.
 * @param {Function} props.onClose     Close handler.
 * @param {Function} props.onInsert    Insert handler.
 * @param {boolean}  props.isInserting Whether this pattern's insert is in flight.
 * @param {number}   props.index       Zero-based position in the filtered list, or -1 when absent.
 * @param {number}   props.total       How many patterns the filtered list holds.
 * @param {Function} props.onPrevious  Step to the previous pattern.
 * @param {Function} props.onNext      Step to the next pattern.
 * @return {JSX.Element} Drawer markup.
 */
export default function PreviewDrawer({
	pattern,
	onClose,
	onInsert,
	isInserting,
	index = -1,
	total = 0,
	onPrevious,
	onNext,
}) {
	const [device, setDevice] = useState(PREVIEW_DEVICES[0].key);
	const [isFrameLoading, setIsFrameLoading] = useState(true);
	// Measured content box of the stage — the frame is scaled to fit it, so the
	// preview stays fitted at any drawer width and through window resizes.
	const [stage, setStage] = useState({ width: 0, height: 0 });
	const closeRef = useRef(null);
	const stageRef = useRef(null);
	const drawerRef = useRef(null);

	useEffect(() => {
		closeRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if ('Escape' === event.key) {
				event.preventDefault();
				event.stopPropagation();
				onClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown, true);
		return () => document.removeEventListener('keydown', handleKeyDown, true);
	}, [onClose]);

	// Observed from a layout effect so the first observation is delivered before
	// paint — from a passive effect the stage is unmeasured for a frame, and a
	// desktop-width frame draws at 1:1 inside the clipped stage until it lands.
	useLayoutEffect(() => {
		const node = stageRef.current;
		if (!node || 'undefined' === typeof ResizeObserver) {
			return undefined;
		}

		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setStage({ width: Math.round(width), height: Math.round(height) });
		});
		observer.observe(node);

		return () => observer.disconnect();
	}, []);

	// Mouse-down rather than click, so releasing a text selection that started
	// inside the drawer never counts as clicking the dimmed area.
	const handleBackdropMouseDown = (event) => {
		if (drawerRef.current && !drawerRef.current.contains(event.target)) {
			onClose();
		}
	};

	const activeDevice = PREVIEW_DEVICES.find((entry) => entry.key === device) || PREVIEW_DEVICES[0];
	const scale = stage.width ? Math.min(1, stage.width / activeDevice.width) : 1;
	const frameHeight = Math.round((stage.height || FALLBACK_STAGE_HEIGHT) / scale);
	const previewUrl = pattern?.previewUrl || '';
	const isLocked = 'free' !== resolveItemTier(pattern);
	const thumb = pattern?.thumb?.['2x'] || pattern?.thumb?.['1x'] || pattern?.image || '';
	// The footer's count only means anything while the previewed pattern is still
	// part of the filtered list — changing a filter underneath the drawer drops it out.
	const isListed = index >= 0;
	const canPrevious = index > 0;
	const canNext = isListed && index < total - 1;

	// A new pattern swaps the iframe src — show the preloader again until it lands.
	// Device switching only resizes the frame, so it must not reset this.
	//
	// A cross-origin frame that never loads fires no event at all: an offline site
	// or a blocked pattern host would otherwise leave the preloader spinning for
	// good, so it gives up and shows whatever the frame managed to render.
	useEffect(() => {
		if (!previewUrl) {
			return undefined;
		}

		setIsFrameLoading(true);
		const timer = setTimeout(() => setIsFrameLoading(false), FRAME_LOAD_TIMEOUT_MS);

		return () => clearTimeout(timer);
	}, [previewUrl]);

	return (
		<div className="wpcp-ready-patterns-drawer-backdrop" onMouseDown={handleBackdropMouseDown}>
			<section
				className="wpcp-ready-patterns-drawer"
				ref={drawerRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="wpcp-ready-patterns-drawer-title"
			>
				<header className="wpcp-ready-patterns-drawer-header">
					{/* Stepping swaps this text without moving focus, so it announces
					    itself rather than the step passing silently. */}
					<h2
						className="wpcp-ready-patterns-drawer-title"
						id="wpcp-ready-patterns-drawer-title"
						aria-live="polite"
					>
						{pattern?.name}
					</h2>

					<div
						className="wpcp-ready-patterns-drawer-devices"
						role="group"
						aria-label={__('Preview width', 'wp-carousel-free')}
					>
						{PREVIEW_DEVICES.map((entry) => {
							const Icon = DEVICE_ICONS[entry.key] || DesktopIcon;
							return (
								<button
									key={entry.key}
									type="button"
									className={`wpcp-ready-patterns-drawer-device${entry.key === device ? ' is-active' : ''}`}
									aria-pressed={entry.key === device}
									aria-label={deviceLabel(entry.key)}
									title={deviceLabel(entry.key)}
									onClick={() => setDevice(entry.key)}
								>
									<Icon />
								</button>
							);
						})}
					</div>

					<div className="wpcp-ready-patterns-drawer-header-right">
						{/* The pattern host may refuse to be framed, so the preview is
						    always reachable outside the drawer as well. */}
						{previewUrl && (
							<a
								className="wpcp-ready-patterns-drawer-external"
								href={previewUrl}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={__('Open preview in a new tab', 'wp-carousel-free')}
								title={__('Open preview in a new tab', 'wp-carousel-free')}
							>
								<ExternalLinkIcon />
							</a>
						)}
						{isLocked ? (
							<UpgradeButton label={__('Upgrade to Pro', 'wp-carousel-free')} />
						) : (
							<button
								type="button"
								className={`wpcp-ready-patterns-insert-btn${isInserting ? ' is-busy' : ''}`}
								onClick={() => onInsert(pattern)}
								disabled={isInserting}
							>
								{isInserting ? __('Inserting…', 'wp-carousel-free') : __('Insert', 'wp-carousel-free')}
								{isInserting ? <RefreshIcon /> : <DownloadIcon />}
							</button>
						)}
						<button
							type="button"
							className="wpcp-ready-patterns-drawer-close"
							aria-label={__('Close preview', 'wp-carousel-free')}
							onClick={onClose}
							ref={closeRef}
						>
							<CloseIcon size={24} />
						</button>
					</div>
				</header>

				<div className="wpcp-ready-patterns-drawer-body">
					<div className="wpcp-ready-patterns-drawer-stage" ref={stageRef}>
						{previewUrl ? (
							<iframe
								className={`wpcp-ready-patterns-drawer-frame${isFrameLoading ? ' is-loading' : ''}`}
								title={sprintf(
									/* translators: %s: pattern name */
									__('Preview of %s', 'wp-carousel-free'),
									pattern?.name || ''
								)}
								src={previewUrl}
								sandbox="allow-scripts allow-forms allow-popups"
								onLoad={() => setIsFrameLoading(false)}
								onError={() => setIsFrameLoading(false)}
								style={{
									width: `${activeDevice.width}px`,
									height: `${frameHeight}px`,
									transform: `scale(${scale})`,
								}}
							/>
						) : (
							<div className="wpcp-ready-patterns-drawer-thumb">
								{thumb ? (
									<img src={thumb} alt="" />
								) : (
									<p>{__('No preview available for this pattern.', 'wp-carousel-free')}</p>
								)}
							</div>
						)}

						{previewUrl && isFrameLoading ? (
							<div className="wpcp-ready-patterns-drawer-loader" aria-hidden="true">
								<span className="wpcp-ready-patterns-drawer-loader-spinner" />
								<span className="wpcp-ready-patterns-drawer-loader-text">
									{__('Loading preview…', 'wp-carousel-free')}
								</span>
							</div>
						) : null}
					</div>
				</div>

				{isListed ? (
					<footer className="wpcp-ready-patterns-drawer-footer">
						<span className="wpcp-ready-patterns-drawer-footer-count">
							{sprintf(
								/* translators: 1: current pattern number, 2: total patterns */
								__('Patterns %1$d of %2$d', 'wp-carousel-free'),
								index + 1,
								total
							)}
						</span>

						<div
							className="wpcp-ready-patterns-drawer-footer-nav"
							role="group"
							aria-label={__('Browse patterns', 'wp-carousel-free')}
						>
							<button
								type="button"
								className="wpcp-ready-patterns-drawer-page"
								aria-label={__('Previous pattern', 'wp-carousel-free')}
								onClick={onPrevious}
								disabled={!canPrevious}
							>
								<ChevronLeftIcon />
								{__('Prev', 'wp-carousel-free')}
							</button>
							<button
								type="button"
								className="wpcp-ready-patterns-drawer-page"
								aria-label={__('Next pattern', 'wp-carousel-free')}
								onClick={onNext}
								disabled={!canNext}
							>
								{__('Next', 'wp-carousel-free')}
								<ChevronRightIcon />
							</button>
						</div>
					</footer>
				) : null}
			</section>
		</div>
	);
}
