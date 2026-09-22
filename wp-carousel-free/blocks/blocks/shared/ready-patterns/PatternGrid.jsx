import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PatternCard from './PatternCard';
import { isPatternFavorite } from './filterHelpers';

function SkeletonCard() {
	return (
		<article className="wpcp-ready-patterns-card is-skeleton" aria-hidden="true">
			<div className="wpcp-ready-patterns-card-thumb" />
			<div className="wpcp-ready-patterns-card-body">
				<div className="wpcp-ready-patterns-skeleton-line" />
				<div className="wpcp-ready-patterns-skeleton-btn" />
			</div>
		</article>
	);
}

// Scrollable pattern card grid with loading, empty, and error states.
export default function PatternGrid({
	loading,
	error,
	onRetry,
	items,
	gridDensity,
	onInsert,
	onPreview,
	insertingId,
	favorites,
	onToggleFavorite,
}) {
	if (error) {
		return (
			<div className="wpcp-ready-patterns-state wpcp-ready-patterns-state--error">
				<p>{__('Unable to load patterns. Please try again.', 'wp-carousel-free')}</p>
				<Button variant="secondary" onClick={onRetry}>
					{__('Retry', 'wp-carousel-free')}
				</Button>
			</div>
		);
	}

	if (loading && 0 === items.length) {
		return (
			<div className={`wpcp-ready-patterns-grid cols-${gridDensity}`}>
				{Array.from({ length: 6 }).map((_unused, index) => (
					<SkeletonCard key={`skeleton-${index}`} />
				))}
			</div>
		);
	}

	if (!loading && 0 === items.length) {
		return (
			<div className="wpcp-ready-patterns-state wpcp-ready-patterns-state--empty">
				<p>{__('No patterns match your filters.', 'wp-carousel-free')}</p>
			</div>
		);
	}

	return (
		<div
			className={`wpcp-ready-patterns-grid cols-${gridDensity}`}
			role="list"
			aria-label={__('Ready Patterns', 'wp-carousel-free')}
		>
			{items.map((pattern) => (
				<PatternCard
					key={pattern.id}
					pattern={pattern}
					onInsert={onInsert}
					onPreview={onPreview}
					insertingId={insertingId}
					isFavorite={isPatternFavorite(favorites, pattern)}
					onToggleFavorite={onToggleFavorite}
				/>
			))}
		</div>
	);
}
