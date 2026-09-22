import { __ } from '@wordpress/i18n';
import { resolveItemTier } from './filterHelpers';
import UpgradeButton from './UpgradeButton';
import {
	DownloadIcon,
	EyeIcon,
	HeartFilledIcon,
	HeartIcon,
	LogoMarkIcon,
	RefreshIcon,
} from './icons';

/** Fallback thumbnail box size — the 3:2 aspect the thumbnail standard mandates. */
const THUMB_WIDTH = 600;
const THUMB_HEIGHT = 400;

/**
 * Single pattern card in the grid.
 *
 * @param {Object}   props
 * @param {Object}   props.pattern          Manifest item.
 * @param {Function} props.onInsert         Insert handler.
 * @param {Function} props.onPreview        Preview handler.
 * @param {*}        props.insertingId      ID of the pattern currently being inserted.
 * @param {boolean}  props.isFavorite       Whether this pattern is favorited.
 * @param {Function} props.onToggleFavorite Toggle-favorite handler.
 * @return {JSX.Element} Card markup.
 */
export default function PatternCard({
	pattern,
	onInsert,
	onPreview,
	insertingId,
	isFavorite,
	onToggleFavorite,
}) {
	const isBusy = insertingId === pattern.id;
	const thumbOneX = pattern.thumb?.['1x'] || pattern.image || '';
	const thumbTwoX = pattern.thumb?.['2x'] || '';
	const thumbWidth = pattern.thumb?.w || THUMB_WIDTH;
	const thumbHeight = pattern.thumb?.h || THUMB_HEIGHT;
	const isLocked = 'free' !== resolveItemTier(pattern);

	return (
		<article
			className={`wpcp-ready-patterns-card${pattern.dark ? ' is-dark' : ''}${
				isLocked ? ' is-locked' : ''
			}`}
			role="listitem"
		>
			<div className="wpcp-ready-patterns-card-thumb">
				{thumbOneX ? (
					<img
						src={thumbOneX}
						srcSet={thumbTwoX ? `${thumbOneX} 1x, ${thumbTwoX} 2x` : undefined}
						width={thumbWidth}
						height={thumbHeight}
						alt=""
						loading="lazy"
					/>
				) : (
					<span className="wpcp-ready-patterns-card-thumb-placeholder">
						<LogoMarkIcon />
					</span>
				)}
				<button
					type="button"
					className="wpcp-ready-patterns-preview-link"
					onClick={() => onPreview(pattern)}
				>
					<EyeIcon />
					{__('Preview', 'wp-carousel-free')}
				</button>
			</div>
			<div className="wpcp-ready-patterns-card-body">
				<h3 className="wpcp-ready-patterns-card-title">{pattern.name}</h3>
				<button
					type="button"
					className={`wpcp-ready-patterns-favorite-btn${isFavorite ? ' is-favorite' : ''}`}
					aria-label={
						isFavorite
							? __('Remove from favorites', 'wp-carousel-free')
							: __('Add to favorites', 'wp-carousel-free')
					}
					aria-pressed={isFavorite}
					onClick={() => onToggleFavorite(pattern)}
				>
					{isFavorite ? <HeartFilledIcon size={14} /> : <HeartIcon size={14} />}
				</button>
				{isLocked ? (
					<UpgradeButton />
				) : (
					<button
						type="button"
						className={`wpcp-ready-patterns-insert-btn${isBusy ? ' is-busy' : ''}`}
						onClick={() => onInsert(pattern)}
						disabled={isBusy}
					>
						{isBusy ? __('Inserting…', 'wp-carousel-free') : __('Insert', 'wp-carousel-free')}
						{isBusy ? <RefreshIcon /> : <DownloadIcon />}
					</button>
				)}
			</div>
		</article>
	);
}
