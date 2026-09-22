/**
 * Query Builder Panel – post/product query options.
 * Shown for: post, product.
 */

import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { memo, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Toggle,
	SPRangeControl,
	SelectField,
	MultiSelectDndKit,
	SpProNotice,
	getPricingUrl,
} from '@wp-carousel-pro/components';
import { PRO_QUERY_BUILDER_POST, PRO_QUERY_BUILDER_PRODUCT } from '../../constants/proFeatures';

const ExcludePostArrowIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} aria-hidden="true">
		<path d="M17.5 11.6 12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z" />
	</svg>
);

const ORDER_BY = [
	{ label: __('Date', 'wp-carousel-free'), value: 'date' },
	{ label: __('Title', 'wp-carousel-free'), value: 'title' },
	{ label: __('Modified', 'wp-carousel-free'), value: 'modified' },
	{ label: __('Menu Order', 'wp-carousel-free'), value: 'menu_order' },
	{ label: __('Random', 'wp-carousel-free'), value: 'rand' },
	{ label: __('Comment Count', 'wp-carousel-free'), value: 'comment_count' },
];

const ORDER = [
	{ label: __('Descending', 'wp-carousel-free'), value: 'DESC' },
	{ label: __('Ascending', 'wp-carousel-free'), value: 'ASC' },
];

// Latest is the only Free filter. The rest stay listed — matching Pro's
// dropdown — as disabled `(Pro)` options; SelectField refuses the write.
const POST_FILTER_OPTIONS = [
	{ label: __('Latest', 'wp-carousel-free'), value: 'latest' },
	{ label: __('Filter by Taxonomy', 'wp-carousel-free'), value: 'taxonomy', pro: true },
	{ label: __('Featured', 'wp-carousel-free'), value: 'featured', pro: true },
	{ label: __('Popular', 'wp-carousel-free'), value: 'popular', pro: true },
	{ label: __('Filter by Date Range', 'wp-carousel-free'), value: 'date_range', pro: true },
	{ label: __('Filter by Author', 'wp-carousel-free'), value: 'author', pro: true },
	{ label: __('Specific Posts', 'wp-carousel-free'), value: 'specific', pro: true },
];

const PRODUCT_FILTER_OPTIONS = [
	{ label: __('Latest', 'wp-carousel-free'), value: 'latest' },
	{ label: __('Filter by Taxonomy', 'wp-carousel-free'), value: 'taxonomy', pro: true },
	{ label: __('Featured', 'wp-carousel-free'), value: 'featured', pro: true },
	{ label: __('Best Selling', 'wp-carousel-free'), value: 'best_selling', pro: true },
	{ label: __('Top Rated', 'wp-carousel-free'), value: 'top_rated', pro: true },
	{ label: __('On Sale', 'wp-carousel-free'), value: 'on_sale', pro: true },
	{ label: __('Filter by Date Range', 'wp-carousel-free'), value: 'date_range', pro: true },
	{ label: __('Specific Products', 'wp-carousel-free'), value: 'specific', pro: true },
];

const EMPTY_ARRAY = Object.freeze([]);

function QueryBuilderPanel({ attributes, setAttributes, panelOpen, onPanelToggle }) {
	const sourceType = attributes.sourceType ?? 'post';
	const queryOptions = attributes.queryOptions || {};
	const filterValue = queryOptions.filter ?? 'latest';
	const setQueryOptions = (updates) =>
		setAttributes({ queryOptions: { ...queryOptions, ...updates } });
	const [postTypes, setPostTypes] = useState(EMPTY_ARRAY);

	// Populate the dropdown from the plugin endpoint so it mirrors the classic
	// shortcode gate (show_in_nav_menus) and includes post types that
	// /wp/v2/types omits when they are registered without REST support.
	useEffect(() => {
		apiFetch({ path: '/wpcp/v2/post-types' })
			.then((types) => setPostTypes(Array.isArray(types) ? types : EMPTY_ARRAY))
			.catch(() => setPostTypes(EMPTY_ARRAY));
	}, []);

	const filterOptions = sourceType === 'product' ? PRODUCT_FILTER_OPTIONS : POST_FILTER_OPTIONS;
	const isProductSource = sourceType === 'product';
	const proQueryBuilder = isProductSource ? PRO_QUERY_BUILDER_PRODUCT : PRO_QUERY_BUILDER_POST;

	const excludeItemsLabel = isProductSource
		? __('Exclude Products', 'wp-carousel-free')
		: __('Exclude Post', 'wp-carousel-free');
	const excludeItemsPlaceholder = isProductSource
		? __('Select Product', 'wp-carousel-free')
		: __('Select Post', 'wp-carousel-free');
	const excludeWithoutThumbLabel = isProductSource
		? __('Exclude Product Without Thumb', 'wp-carousel-free')
		: __('Exclude Post Without Thumb', 'wp-carousel-free');
	const filterLabel = isProductSource
		? __('Filter Products', 'wp-carousel-free')
		: __('Filter Posts', 'wp-carousel-free');
	const isTilesAjaxPaginated =
		attributes.blockName === 'tiles' &&
		attributes.layoutOptions?.pagination === true &&
		(sourceType === 'post' || sourceType === 'product');
	let limitLabel = __('Limit', 'wp-carousel-free');
	if (isTilesAjaxPaginated) {
		limitLabel =
			sourceType === 'product'
				? __('Products Per Page', 'wp-carousel-free')
				: __('Posts Per Page', 'wp-carousel-free');
	}

	return (
		<PanelBody
			title={__('Query Builder', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
			{sourceType !== 'product' && (
				<MultiSelectDndKit
					label={__('Post Types', 'wp-carousel-free')}
					attributes={queryOptions.postTypes ?? ['post']}
					attributesKey="postTypes"
					setAttributes={setQueryOptions}
					options={postTypes}
				/>
			)}
			<SelectField
				label={filterLabel}
				attributes={filterValue}
				attributesKey="filter"
				setAttributes={setQueryOptions}
				items={filterOptions}
				flexStyle={false}
			/>
			<div className="wpcp-select-field wpcp-component-mb">
				<div className="wpcp-header wpcp-header-left">
					<span className="wpcp-component-title wpcp-pro-inline-title">{excludeItemsLabel}</span>
					<a
						className="wpcp-pro-inline-tag"
						href={getPricingUrl()}
						target="_blank"
						rel="noopener noreferrer"
					>
						{__('(Pro)', 'wp-carousel-free')}
					</a>
				</div>
				<div className="shaped-plugin-multiple-select wpcp-pro-locked-row">
					<div className="sp-multiple-select-dnd-container">
						<div className="sp-select-header">
							<div className="sp-selected-options">
								<span className="sp-select-placeholder">{excludeItemsPlaceholder}</span>
							</div>
							<span className="custom-select-arrow">
								<ExcludePostArrowIcon />
							</span>
						</div>
					</div>
				</div>
			</div>
			{!isProductSource && (
				<Toggle label={__('Exclude Current Post', 'wp-carousel-free')} attributes={false} onlyPro />
			)}
			<Toggle label={excludeWithoutThumbLabel} attributes={false} onlyPro />
			{!isProductSource && (
				<Toggle label={__('Ignore Sticky Posts', 'wp-carousel-free')} attributes={false} onlyPro />
			)}
			<SelectField
				label={__('Order By', 'wp-carousel-free')}
				attributes={queryOptions.orderBy ?? 'date'}
				attributesKey="orderBy"
				setAttributes={setQueryOptions}
				items={ORDER_BY}
				flexStyle={false}
			/>
			<SelectField
				label={__('Order', 'wp-carousel-free')}
				attributes={queryOptions.order ?? 'DESC'}
				attributesKey="order"
				setAttributes={setQueryOptions}
				items={ORDER}
				flexStyle={false}
			/>
			<SPRangeControl
				label={__('Offset', 'wp-carousel-free')}
				attributes={queryOptions.offset ?? 0}
				attributesKey="offset"
				setAttributes={() => {}}
				onValueChange={({ value }) => setQueryOptions({ offset: value })}
				min={0}
				max={50}
				defaultValue={0}
				units={false}
			/>
			<SPRangeControl
				label={limitLabel}
				attributes={queryOptions.limit ?? 10}
				attributesKey="limit"
				setAttributes={() => {}}
				onValueChange={({ value }) => setQueryOptions({ limit: value })}
				min={1}
				max={100}
				defaultValue={10}
				units={false}
			/>
			<SpProNotice
				className="is-upsell"
				title={proQueryBuilder.title}
				subtitle={proQueryBuilder.subtitle}
				features={proQueryBuilder.features}
				linkText={proQueryBuilder.linkText}
				icon={false}
				linkButton
			/>
		</PanelBody>
	);
}

export default memo(QueryBuilderPanel);
