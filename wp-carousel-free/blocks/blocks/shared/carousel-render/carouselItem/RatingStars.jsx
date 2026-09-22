/**
 * 5-icon rating row with partial fill — mirrors
 * `SlotRenderer::rating_icon_sets` (chosen rating icon set, falling back
 * to the Unicode star when no set is picked).
 */

import { RatingIconSetValue } from '../../../../icons/iconSet';

/**
 * @param {Object} props
 * @param {number} props.ratingValue   Raw rating (clamped to 0–5).
 * @param {Object} props.ratingOptions Rating panel options.
 */
export default function RatingStars({ ratingValue, ratingOptions }) {
	const normalizedRating = Math.max(0, Math.min(5, ratingValue));

	// The icon-set picker stores a `star-set-*` key in `ratingIcon`. Each set
	// carries a matched empty (background) and active (filled) glyph; the fill
	// overlay is clipped to the rating percentage, so the two must stay paired.
	// An unset or unknown key falls back to the Unicode star so blocks that
	// never opened the picker render unchanged.
	const iconSet = RatingIconSetValue[ratingOptions.ratingIcon] || null;
	const emptyIcon = iconSet ? iconSet.empty : '★';
	const activeIcon = iconSet ? iconSet.active : '★';

	// Gap must be applied on the rating row between sibling icon wrappers only.
	// Each wrapper stacks the empty icon and the fill overlay in the exact same
	// position so partial ratings can clip the fill width without introducing
	// internal spacing inside a single icon.
	return (
		<div className="wpcp-item-rating" aria-label={`Rating ${normalizedRating} out of 5`}>
			{Array.from({ length: 5 }, (_, index) => {
				const fillPercentage = Math.max(0, Math.min(100, (normalizedRating - index) * 100));
				return (
					<span key={index} className="wpcp-rating-icon-wrap">
						<span className="wpcp-rating-empty">{emptyIcon}</span>
						<span className="wpcp-rating-fill" style={{ width: `${fillPercentage}%` }}>
							{activeIcon}
						</span>
					</span>
				);
			})}
		</div>
	);
}
