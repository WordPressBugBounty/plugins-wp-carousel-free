import { __ } from '@wordpress/i18n';
import {
	categoryLabel as getCategoryLabel,
	CATEGORY_LABELS,
	FILTER_ALL,
	SOURCE_TYPE_SLUGS,
	sourceTypeLabel,
	TIER_ALL,
	TIER_FREE,
	TIER_PREMIUM,
	useCaseLabel as getUseCaseLabel,
} from './constants';
import { CATEGORY_ICONS } from './blockIcons';
import { CloseIcon, SearchIcon } from './icons';

/**
 * One facet row: label, optional icon, count badge, active state.
 *
 * @param {Object}        props
 * @param {string}        props.label    Row label.
 * @param {Function|null} props.icon     Optional icon component.
 * @param {number}        props.count    Item count badge.
 * @param {boolean}       props.isActive Whether this row is selected.
 * @param {Function}      props.onSelect Click handler.
 * @return {JSX.Element} Row button.
 */
function FacetRow({ label, icon: Icon, count, isActive, onSelect }) {
	return (
		<button
			type="button"
			className={`wpcp-ready-patterns-category${isActive ? ' is-active' : ''}`}
			aria-pressed={isActive}
			onClick={onSelect}
		>
			{Icon ? (
				<span className="wpcp-ready-patterns-category-icon">
					<Icon />
				</span>
			) : null}
			<span className="wpcp-ready-patterns-category-label">{label}</span>
			<span className="wpcp-ready-patterns-badge">{count ?? 0}</span>
		</button>
	);
}

/**
 * Left sidebar: tier filter, search, and the browse axes.
 *
 * The use-case axis is derived from the manifest, so on a v1 server it has no
 * terms — an axis whose only row would be "All Patterns" is not rendered at all,
 * leaving the block axis primary and the sidebar no worse than before.
 *
 * @param {Object}   props
 * @param {string}   props.tier               Active tier filter.
 * @param {Function} props.onTierChange       Tier change handler.
 * @param {string}   props.search             Search query.
 * @param {Function} props.onSearchChange     Search change handler.
 * @param {string}   props.category           Active block-axis filter.
 * @param {Function} props.onCategoryChange   Category change handler.
 * @param {string}   props.useCase            Active use-case filter.
 * @param {Function} props.onUseCaseChange    Use-case change handler.
 * @param {string}   props.sourceType         Active source-type filter.
 * @param {Function} props.onSourceTypeChange Source-type change handler.
 * @param {string[]} props.tags               Active tag filters.
 * @param {Function} props.onToggleTag        Tag toggle handler.
 * @param {string[]} props.categoryTerms      Available block-axis terms.
 * @param {string[]} props.tagTerms           Available tag terms.
 * @param {string[]} props.useCaseTerms       Available use-case terms.
 * @param {Object}   props.counts             Block-axis item counts.
 * @param {Object}   props.tierCounts         Tier item counts.
 * @param {Object}   props.useCaseCounts      Use-case item counts.
 * @param {Object}   props.sourceTypeCounts   Source-type item counts.
 * @param {Function} props.onClearFilters     Clear-all handler.
 * @return {JSX.Element} Sidebar markup.
 */
export default function Sidebar({
	tier,
	onTierChange,
	search,
	onSearchChange,
	category,
	onCategoryChange,
	useCase,
	onUseCaseChange,
	sourceType,
	onSourceTypeChange,
	tags,
	onToggleTag,
	categoryTerms,
	tagTerms,
	useCaseTerms,
	counts,
	tierCounts,
	useCaseCounts,
	sourceTypeCounts,
	onClearFilters,
}) {
	const tierOptions = [
		{ value: TIER_ALL, label: __('All', 'wp-carousel-free') },
		{ value: TIER_FREE, label: __('Free', 'wp-carousel-free') },
		{ value: TIER_PREMIUM, label: __('Pro', 'wp-carousel-free') },
	];

	const hasUseCases = Array.isArray(useCaseTerms) && useCaseTerms.length > 0;
	const activeTags = Array.isArray(tags) ? tags : [];
	const activeSelections = [
		FILTER_ALL !== useCase
			? {
					key: `useCase:${useCase}`,
					label: getUseCaseLabel(useCase),
					onRemove: () => onUseCaseChange(FILTER_ALL),
			  }
			: null,
		FILTER_ALL !== category
			? {
					key: `category:${category}`,
					label: getCategoryLabel(category),
					onRemove: () => onCategoryChange(FILTER_ALL),
			  }
			: null,
		FILTER_ALL !== sourceType
			? {
					key: `sourceType:${sourceType}`,
					label: sourceTypeLabel(sourceType),
					onRemove: () => onSourceTypeChange(FILTER_ALL),
			  }
			: null,
		...activeTags.map((tag) => ({
			key: `tag:${tag}`,
			label: `#${tag}`,
			onRemove: () => onToggleTag(tag),
		})),
	].filter(Boolean);

	return (
		<aside className="wpcp-ready-patterns-sidebar">
			<div className="wpcp-ready-patterns-tier">
				{tierOptions.map((option) => (
					<button
						key={option.value}
						type="button"
						className={`wpcp-ready-patterns-tier-btn${option.value === tier ? ' is-active' : ''}`}
						aria-pressed={option.value === tier}
						onClick={() => onTierChange(option.value)}
					>
						{option.label}
						<span className="wpcp-ready-patterns-tier-count">{tierCounts?.[option.value] ?? 0}</span>
					</button>
				))}
			</div>

			<div className="wpcp-ready-patterns-search">
				<label className="screen-reader-text" htmlFor="wpcp-ready-patterns-search-input">
					{__('Search patterns', 'wp-carousel-free')}
				</label>
				<SearchIcon />
				<input
					type="search"
					id="wpcp-ready-patterns-search-input"
					className="wpcp-ready-patterns-search-input"
					placeholder={__('Search patterns', 'wp-carousel-free')}
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
				/>
			</div>

			{activeSelections.length > 0 ? (
				<div className="wpcp-ready-patterns-active-filters">
					<h3 className="wpcp-ready-patterns-sidebar-heading">
						{__('Active Filters', 'wp-carousel-free')}
					</h3>
					<ul className="wpcp-ready-patterns-active-list">
						{activeSelections.map((selection) => (
							<li key={selection.key}>
								<button
									type="button"
									className="wpcp-ready-patterns-active-chip"
									onClick={selection.onRemove}
								>
									<span>{selection.label}</span>
									<CloseIcon size={10} />
								</button>
							</li>
						))}
					</ul>
					<button type="button" className="wpcp-ready-patterns-clear-filters" onClick={onClearFilters}>
						{__('Clear all', 'wp-carousel-free')}
					</button>
				</div>
			) : null}

			{hasUseCases ? (
				<>
					<h3 className="wpcp-ready-patterns-sidebar-heading">{__('Use Case', 'wp-carousel-free')}</h3>
					<nav
						className="wpcp-ready-patterns-categories"
						aria-label={__('Pattern use cases', 'wp-carousel-free')}
					>
						<FacetRow
							label={CATEGORY_LABELS.all}
							count={useCaseCounts?.[FILTER_ALL] ?? 0}
							isActive={FILTER_ALL === useCase}
							onSelect={() => onUseCaseChange(FILTER_ALL)}
						/>
						{useCaseTerms.map((term) => (
							<FacetRow
								key={term}
								label={getUseCaseLabel(term)}
								count={useCaseCounts?.[term] ?? 0}
								isActive={term === useCase}
								onSelect={() => onUseCaseChange(term)}
							/>
						))}
					</nav>
				</>
			) : null}

			<h3 className="wpcp-ready-patterns-sidebar-heading">{__('Block Type', 'wp-carousel-free')}</h3>
			<nav
				className="wpcp-ready-patterns-categories"
				aria-label={__('Pattern categories', 'wp-carousel-free')}
			>
				<FacetRow
					label={CATEGORY_LABELS.all}
					count={counts?.all ?? 0}
					isActive={FILTER_ALL === category}
					onSelect={() => onCategoryChange(FILTER_ALL)}
				/>
				{(categoryTerms || []).map((slug) => (
					<FacetRow
						key={slug}
						label={getCategoryLabel(slug)}
						icon={CATEGORY_ICONS[slug]}
						count={counts?.[slug] ?? 0}
						isActive={slug === category}
						onSelect={() => onCategoryChange(slug)}
					/>
				))}
			</nav>

			<h3 className="wpcp-ready-patterns-sidebar-heading">
				{__('Content Source', 'wp-carousel-free')}
			</h3>
			<nav
				className="wpcp-ready-patterns-categories"
				aria-label={__('Pattern content sources', 'wp-carousel-free')}
			>
				<FacetRow
					label={CATEGORY_LABELS.all}
					count={sourceTypeCounts?.[FILTER_ALL] ?? 0}
					isActive={FILTER_ALL === sourceType}
					onSelect={() => onSourceTypeChange(FILTER_ALL)}
				/>
				{SOURCE_TYPE_SLUGS.map((slug) => (
					<FacetRow
						key={slug}
						label={sourceTypeLabel(slug)}
						count={sourceTypeCounts?.[slug] ?? 0}
						isActive={slug === sourceType}
						onSelect={() => onSourceTypeChange(slug)}
					/>
				))}
			</nav>

			{Array.isArray(tagTerms) && tagTerms.length > 0 ? (
				<>
					<h3 className="wpcp-ready-patterns-sidebar-heading">{__('Tags', 'wp-carousel-free')}</h3>
					<div className="wpcp-ready-patterns-tag-filters">
						{tagTerms.map((tag) => (
							<button
								key={tag}
								type="button"
								className={`wpcp-ready-patterns-tag-chip${activeTags.includes(tag) ? ' is-active' : ''}`}
								aria-pressed={activeTags.includes(tag)}
								onClick={() => onToggleTag(tag)}
							>
								{`#${tag}`}
							</button>
						))}
					</div>
				</>
			) : null}
		</aside>
	);
}
