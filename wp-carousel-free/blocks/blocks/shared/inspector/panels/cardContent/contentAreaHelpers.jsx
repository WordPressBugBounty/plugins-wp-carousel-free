/**
 * Card-area (former "Card Elements") helpers shared by the Card Content panel's
 * Settings tab and its Content Area Style popover. Lifted verbatim from the
 * former `ContentAreaPanel` — sortable element list, orientation predicates,
 * content-position matrix parsing, and the background/border/box-shadow
 * resolvers that back `contentAreaOptions`.
 */

import { __, sprintf } from '@wordpress/i18n';
import { memo, useCallback, useMemo } from '@wordpress/element';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
	arrayMove,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Toggle } from '@wp-carousel-pro/components';
import {
	AlignLeftIcon,
	AlignCenterIcon,
	AlignRightIcon,
	PositionCenterIcon,
	PositionRightIcon,
	PositionLeftIcon,
} from '@wp-carousel-pro/icons/icons';
import { isSlotVisible, isReadMoreSuppressedByClickAction } from '../../visibility';
import { getImageRowLockState } from './imageRowLockState';
import { createSpacingDefaults } from './sourceAccessors/spacing';

export const ALIGNMENTS = [
	{ label: <AlignLeftIcon />, value: 'left' },
	{ label: <AlignCenterIcon />, value: 'center' },
	{ label: <AlignRightIcon />, value: 'right' },
];
export const POSITIONS = [
	{ label: <PositionLeftIcon />, value: 'left' },
	{ label: <PositionCenterIcon />, value: 'center' },
	{ label: <PositionRightIcon />, value: 'right' },
];

const CONTENT_OVERLAY_OPTION_ORIENTATIONS = ['overlay'];
const CONTENT_ALIGNMENT_ORIENTATIONS = ['image-top', 'overlay', 'diagonal'];
const CONTENT_POSITION_VERTICALS = ['top', 'center', 'bottom'];
const CONTENT_POSITION_HORIZONTALS = ['left', 'center', 'right'];

export function isContentOverlayOptionsOrientation(contentOrientation) {
	return CONTENT_OVERLAY_OPTION_ORIENTATIONS.includes(contentOrientation);
}

export function isContentAlignmentOrientation(contentOrientation) {
	return CONTENT_ALIGNMENT_ORIENTATIONS.includes(contentOrientation);
}

/**
 * Generic AlignmentMatrixControl value resolver: maps a stored position string
 * ("bottom left", "center", "") to the matrix control's `vertical horizontal` /
 * `center` value. Shared by the Content Position and Taxonomy Position matrices.
 *
 * @param {string} rawPosition - Stored position string.
 * @return {string} Matrix control value.
 */
export function getPositionMatrixValue(rawPosition = '') {
	const trimmed = typeof rawPosition === 'string' ? rawPosition.trim() : '';

	if ('center' === trimmed) {
		return 'center';
	}

	const [rawVertical, rawHorizontal] = trimmed.split(/\s+/);
	const vertical = CONTENT_POSITION_VERTICALS.includes(rawVertical) ? rawVertical : 'bottom';
	const horizontal = CONTENT_POSITION_HORIZONTALS.includes(rawHorizontal) ? rawHorizontal : 'left';

	return 'center' === vertical && 'center' === horizontal ? 'center' : `${vertical} ${horizontal}`;
}

/**
 * Generic AlignmentMatrixControl change handler: maps a matrix value back to a
 * stored position string keyed under `key`. An empty/cleared matrix resets it.
 *
 * @param {string} value - Matrix control value.
 * @param {string} key   - Attribute key to store the parsed position under.
 * @return {Object} `{ [key]: position }`.
 */
export function parsePositionMatrixValue(value, key) {
	if ('string' !== typeof value || '' === value.trim()) {
		return { [key]: '' };
	}

	if ('center' === value.trim()) {
		return { [key]: 'center center' };
	}

	const [rawVertical, rawHorizontal] = value.trim().split(/\s+/);
	const vertical = CONTENT_POSITION_VERTICALS.includes(rawVertical) ? rawVertical : 'bottom';
	const horizontal = CONTENT_POSITION_HORIZONTALS.includes(rawHorizontal) ? rawHorizontal : 'left';

	return { [key]: `${vertical} ${horizontal}` };
}

// Content Position call site aliases — behavior identical to the generic pair.
export const getContentPositionMatrixValue = getPositionMatrixValue;
export function parseContentPositionMatrixValue(value) {
	return parsePositionMatrixValue(value, 'contentPosition');
}

export const SORT_ITEMS_BY_SOURCE = {
	post: [
		{ id: 'image', label: __('Image', 'wp-carousel-free') },
		{ id: 'meta', label: __('Meta Data', 'wp-carousel-free') },
		{ id: 'title', label: __('Post Title', 'wp-carousel-free') },
		{ id: 'taxonomy', label: __('Taxonomy', 'wp-carousel-free') },
		{ id: 'excerpt', label: __('Excerpt', 'wp-carousel-free') },
		{ id: 'readmore', label: __('Read More', 'wp-carousel-free') },
		{ id: 'social', label: __('Social Share', 'wp-carousel-free') },
	],
	product: [
		{ id: 'image', label: __('Image', 'wp-carousel-free') },
		{ id: 'title', label: __('Product Title', 'wp-carousel-free') },
		{ id: 'rating', label: __('Rating', 'wp-carousel-free') },
		{ id: 'taxonomy', label: __('Taxonomy', 'wp-carousel-free') },
		{ id: 'price', label: __('Price', 'wp-carousel-free') },
		{ id: 'excerpt', label: __('Short Description', 'wp-carousel-free') },
		{ id: 'readmore', label: __('Add to Cart', 'wp-carousel-free') },
		{ id: 'social', label: __('Social Share', 'wp-carousel-free') },
	],
	image: [
		{ id: 'image', label: __('Image', 'wp-carousel-free') },
		{ id: 'title', label: __('Title', 'wp-carousel-free') },
		{ id: 'description', label: __('Description', 'wp-carousel-free') },
		{ id: 'readmore', label: __('Read More', 'wp-carousel-free') },
		{ id: 'social', label: __('Social Share', 'wp-carousel-free') },
	],
	video: [
		{ id: 'title', label: __('Title', 'wp-carousel-free') },
		{ id: 'description', label: __('Description', 'wp-carousel-free') },
		{ id: 'social', label: __('Social Share', 'wp-carousel-free') },
		{ id: 'readmore', label: __('Read More', 'wp-carousel-free') },
	],
	audio: [
		{ id: 'image', label: __('Image', 'wp-carousel-free') },
		{ id: 'title', label: __('Title', 'wp-carousel-free') },
		{ id: 'description', label: __('Description', 'wp-carousel-free') },
		{ id: 'readmore', label: __('Read More', 'wp-carousel-free') },
		{ id: 'social', label: __('Social Share', 'wp-carousel-free') },
	],
	document: [
		{ id: 'image', label: __('Image', 'wp-carousel-free') },
		{ id: 'title', label: __('Title', 'wp-carousel-free') },
		{ id: 'description', label: __('Description', 'wp-carousel-free') },
		{ id: 'social', label: __('Social Share', 'wp-carousel-free') },
	],
	external: [
		{ id: 'image', label: __('Image', 'wp-carousel-free') },
		{ id: 'meta', label: __('Meta Data', 'wp-carousel-free') },
		{ id: 'title', label: __('Title', 'wp-carousel-free') },
		{ id: 'excerpt', label: __('Excerpt', 'wp-carousel-free') },
		{ id: 'social', label: __('Social Share', 'wp-carousel-free') },
	],
	externalPost: [
		{ id: 'image', label: __('Image', 'wp-carousel-free') },
		{ id: 'meta', label: __('Meta Data', 'wp-carousel-free') },
		{ id: 'title', label: __('Title', 'wp-carousel-free') },
		{ id: 'excerpt', label: __('Excerpt', 'wp-carousel-free') },
		{ id: 'taxonomy', label: __('Taxonomy', 'wp-carousel-free') },
		{ id: 'social', label: __('Social Share', 'wp-carousel-free') },
		{ id: 'readmore', label: __('Read More', 'wp-carousel-free') },
	],
};

const DEFAULT_BORDER = { style: 'none', color: '#cccccc' };
const DEFAULT_BORDER_WIDTH = {
	unit: 'px',
	value: { top: 0, right: 0, bottom: 0, left: 0 },
};

export { DEFAULT_BORDER, DEFAULT_BORDER_WIDTH };

function defaultStyleSlice() {
	return {
		border: { ...DEFAULT_BORDER },
		borderWidth: { ...DEFAULT_BORDER_WIDTH },
	};
}

export function updateResponsiveSpacingUnit(value, deviceType, unit) {
	return {
		...(value && typeof value === 'object' ? value : createSpacingDefaults(0)),
		unit: {
			...(value && typeof value === 'object' && value.unit ? value.unit : {}),
			[deviceType]: unit,
		},
	};
}

// Card Element background defaults are intentionally shared across Image, Post,
// and Product sources. The runtime card selector changes by orientation
// (`.wpcp-item` for Classic, `.wpcp-item-content` for overlay), but
// the default visual contract does not: no source receives an implicit fill.
// Add source-specific entries only for intentional product/design exceptions;
// user-saved `contentAreaBackground` values always merge over this baseline.
const CARD_ELEMENT_BACKGROUND_DEFAULT = {
	style: 'solid',
	solid: '',
	gradient: '',
};
const CARD_ELEMENT_BACKGROUND_SOURCE_OVERRIDES = {};

export function getCardElementBackgroundDefault(sourceType) {
	return {
		...CARD_ELEMENT_BACKGROUND_DEFAULT,
		...(CARD_ELEMENT_BACKGROUND_SOURCE_OVERRIDES[sourceType] || {}),
	};
}

function defaultContentAreaBackground(sourceType) {
	const sourceDefault = getCardElementBackgroundDefault(sourceType);
	return {
		color: { ...sourceDefault },
		hover: {
			style: sourceDefault.style,
			solid: '',
			gradient: '',
		},
	};
}

/**
 * Background state for `Background` (`color` / `hover` slices).
 * Prefers saved `contentAreaBackground`; migrates legacy `contentAreaStyle`
 * solid/gradient fields. The shared default remains source-agnostic so Image,
 * Post, and Product reset to the same transparent/no-fill behavior, while custom
 * saved colors/gradients keep taking precedence.
 *
 * @param {Object} cao        contentAreaOptions
 * @param {string} sourceType Active source type.
 * @return {{ color: object, hover: object }} Normal and hover background state.
 */
export function resolveContentAreaBackground(cao, sourceType = 'image') {
	const base = defaultContentAreaBackground(sourceType);
	const stored = cao.contentAreaBackground;
	if (stored && typeof stored === 'object') {
		const migrateStyle = (slice) => ({
			...slice,
			style: slice.style === 'bgColor' ? 'solid' : slice.style || 'solid',
			...(slice.solidColor ? { solid: slice.solidColor } : {}),
		});
		return {
			color: migrateStyle({ ...base.color, ...(stored.color || {}) }),
			hover: migrateStyle({ ...base.hover, ...(stored.hover || {}) }),
		};
	}
	const areaStyle = resolveContentAreaStyle(cao);
	const fromSlice = (slice, fallbackGradient) => {
		const isGrad = slice.backgroundType === 'gradient';
		return {
			style: isGrad ? 'gradient' : 'solid',
			solid: slice.backgroundColor || '',
			gradient: slice.backgroundGradient || fallbackGradient,
		};
	};
	return {
		color: fromSlice(areaStyle.normal, base.color.gradient),
		hover: fromSlice(areaStyle.hover, base.hover.gradient),
	};
}

// Mirrors navigation's `DEFAULT_BOX_SHADOW` (navigationDefaults.js) — same
// Medium (4dp) preset, so an unset shadow here is the same real default `BoxShadow`
// shows pre-selected, not an empty `{}` that silently renders no shadow at all.
const DEFAULT_BOX_SHADOW = {
	selectDefault: 'var(--wpcp-shadow-medium-4dp)',
	color: 'rgba(0, 0, 0, 0.16)',
	unit: 'outset',
	value: { top: 0, right: 0, bottom: 0, left: 0 },
};

/**
 * Box shadow enable + payload for `BoxShadow` (per Normal / Hover tab).
 *
 * @param {Object}           cao        contentAreaOptions
 * @param {'normal'|'hover'} styleState
 */
export function resolveBoxShadowState(cao, styleState) {
	const enableKey = styleState === 'normal' ? 'boxShadowNormalEnable' : 'boxShadowHoverEnable';
	const dataKey = styleState === 'normal' ? 'boxShadowNormal' : 'boxShadowHover';
	let enable = cao[enableKey];
	const raw = cao[dataKey];
	const data =
		raw && typeof raw === 'object' ? { ...DEFAULT_BOX_SHADOW, ...raw } : { ...DEFAULT_BOX_SHADOW };
	if (enable === undefined) {
		const areaStyle = resolveContentAreaStyle(cao);
		const slice = styleState === 'normal' ? areaStyle.normal : areaStyle.hover;
		enable = !!slice.boxShadow;
	}
	return { enable: !!enable, data, enableKey, dataKey };
}

/**
 * Merge saved `contentAreaStyle` with defaults; migrate legacy `backgroundColor`.
 *
 * @param {Object} cao contentAreaOptions
 * @return {{ normal: object, hover: object }} object normal and hover.
 *
 * The `hover` slice no longer backs the card border (that is a single always-on
 * color now) but is still read by the background / box-shadow legacy-migration
 * paths below, so it is retained here.
 */
export function resolveContentAreaStyle(cao) {
	const base = {
		normal: { ...defaultStyleSlice() },
		hover: { ...defaultStyleSlice() },
	};
	const stored = cao.contentAreaStyle;
	if (stored && typeof stored === 'object') {
		if (stored.normal && typeof stored.normal === 'object') {
			base.normal = {
				...base.normal,
				...stored.normal,
				border: { ...DEFAULT_BORDER, ...(stored.normal.border || {}) },
				borderWidth: stored.normal.borderWidth
					? { ...stored.normal.borderWidth }
					: { ...DEFAULT_BORDER_WIDTH },
			};
		}
		if (stored.hover && typeof stored.hover === 'object') {
			base.hover = {
				...base.hover,
				...stored.hover,
				border: { ...DEFAULT_BORDER, ...(stored.hover.border || {}) },
				borderWidth: stored.hover.borderWidth
					? { ...stored.hover.borderWidth }
					: { ...DEFAULT_BORDER_WIDTH },
			};
		}
	}
	if (
		cao.backgroundColor &&
		!(base.normal.backgroundColor && String(base.normal.backgroundColor).length)
	) {
		base.normal.backgroundColor = cao.backgroundColor;
	}
	return base;
}

export const CONTENT_AREA_BG_ITEMS = ['solid', 'gradient'];
const GripIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
		<path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
	</svg>
);

// Pinned, non-sortable element row (the Image element outside the Classic
// orientation: it is the card backdrop there, so it stays at the top and its
// visibility toggle is locked on). Kept out of the DnD `SortableContext` so it
// can never be displaced.
function LockedRow({ id, label, enabled, onEnabledChange }) {
	return (
		<div className="wpcp-content-area-sort-item">
			<span
				className="wpcp-content-area-sort-handle"
				style={{ opacity: 0.35, cursor: 'default' }}
				aria-hidden="true"
			>
				<GripIcon />
			</span>
			<span className="wpcp-content-area-sort-label">{label}</span>
			<div
				className="wpcp-content-area-sort-toggle"
				onPointerDown={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<span className="screen-reader-text">
					{sprintf(
						/* translators: %s: content slot label (e.g. Title). */
						__('Show %s', 'wp-carousel-free'),
						label
					)}
				</span>
				<Toggle
					label=""
					attributes={enabled}
					attributesKey={id}
					setAttributes={(patch) => onEnabledChange(id, patch[id])}
				/>
			</div>
		</div>
	);
}

const SortableRow = memo(function SortableRow({
	id,
	label,
	enabled,
	onEnabledChange,
	toggleDisabled = false,
}) {
	// Drag-to-reorder is Pro; `useSortable` still positions the row inside the
	// list, but `listeners` is withheld so the handle can never start a drag.
	const { setNodeRef, transform, transition, isDragging } = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div ref={setNodeRef} style={style} className="wpcp-content-area-sort-item">
			<span
				className="wpcp-content-area-sort-handle"
				style={{ opacity: 0.35, cursor: 'default' }}
				aria-hidden="true"
			>
				<GripIcon />
			</span>
			<span className="wpcp-content-area-sort-label">{label}</span>
			<div
				className="wpcp-content-area-sort-toggle"
				onPointerDown={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<span className="screen-reader-text">
					{sprintf(
						/* translators: %s: content slot label (e.g. Title). */
						__('Show %s', 'wp-carousel-free'),
						label
					)}
				</span>
				<Toggle
					label=""
					attributes={enabled}
					attributesKey={id}
					setAttributes={
						toggleDisabled
							? // Structurally suppressed slot (e.g. the image backdrop on
							  // image sources): keep the control a no-op rather than
							  // writing an attribute the renderer would ignore.
							  () => {}
							: (patch) => onEnabledChange(id, patch[id])
					}
				/>
			</div>
		</div>
	);
});

export function SortableList({
	sourceType,
	order,
	attributes,
	contentOrientation = '',
	onReorder,
	onToggleVisibility,
	excludeSlots = [],
}) {
	const sourceItems = SORT_ITEMS_BY_SOURCE[sourceType] || SORT_ITEMS_BY_SOURCE.image;
	// Slots that cannot render are removed from the element list entirely.
	const excludeKey = excludeSlots.join(',');
	const defaultItems = useMemo(
		() => sourceItems.filter((item) => !excludeSlots.includes(item.id)),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[sourceItems, excludeKey]
	);
	const { isImageLocked, isImageToggleLocked } = getImageRowLockState(
		contentOrientation,
		sourceType
	);
	const clickActionSuppressesReadmore = isReadMoreSuppressedByClickAction(attributes);

	const orderedItems = useMemo(() => {
		if (order.length === 0) {
			return defaultItems;
		}
		return [
			...order.map((id) => defaultItems.find((item) => item.id === id)).filter(Boolean),
			...defaultItems.filter((item) => !order.includes(item.id)),
		];
	}, [defaultItems, order]);

	const lockedItem = useMemo(
		() => (isImageLocked ? orderedItems.find((item) => item.id === 'image') : null),
		[isImageLocked, orderedItems]
	);
	const sortableItems = useMemo(
		() => (isImageLocked ? orderedItems.filter((item) => item.id !== 'image') : orderedItems),
		[isImageLocked, orderedItems]
	);
	const sortableIds = useMemo(() => sortableItems.map((item) => item.id), [sortableItems]);

	const isSlotEnabled = useCallback(
		(slotId) => {
			if (slotId === 'readmore' && clickActionSuppressesReadmore) {
				return false;
			}
			return isSlotVisible(attributes, slotId);
		},
		[attributes, clickActionSuppressesReadmore]
	);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		})
	);

	const handleDragEnd = useCallback(
		(event) => {
			const { active, over } = event;
			if (active && over && active.id !== over.id) {
				const oldIndex = sortableItems.findIndex((item) => item.id === active.id);
				const newIndex = sortableItems.findIndex((item) => item.id === over.id);
				const reordered = arrayMove(sortableItems, oldIndex, newIndex).map((item) => item.id);
				// Persist the Image element first so the locked top row stays consistent
				// with the rendered order (editor preview + PHP both read this order).
				// Sources without an Image row (video) must not gain one here.
				onReorder(isImageLocked && lockedItem ? ['image', ...reordered] : reordered);
			}
		},
		[isImageLocked, lockedItem, onReorder, sortableItems]
	);

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
			<div className="wpcp-content-area-sort-list wpcp-component-mb">
				{lockedItem && (
					<LockedRow
						id={lockedItem.id}
						label={lockedItem.label}
						enabled={isSlotEnabled(lockedItem.id)}
						onEnabledChange={onToggleVisibility}
					/>
				)}
				<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
					{sortableItems.map((item) => (
						<SortableRow
							key={item.id}
							id={item.id}
							label={item.label}
							enabled={isSlotEnabled(item.id)}
							onEnabledChange={onToggleVisibility}
							toggleDisabled={
								(item.id === 'image' && isImageToggleLocked) ||
								(item.id === 'readmore' && clickActionSuppressesReadmore)
							}
						/>
					))}
				</SortableContext>
			</div>
		</DndContext>
	);
}
