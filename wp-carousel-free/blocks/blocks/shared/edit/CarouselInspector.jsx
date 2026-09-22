/**
 * Inspector sidebar: assembles every configuration panel in display order.
 * Panel props are sliced via `usePanelProps` (stable references so memoized
 * panels skip re-render); visibility comes from `usePanelVisibility` plus
 * block/style-specific gates computed here.
 */

import PanelWrapper from '../ui/PanelWrapper';
import { usePanelVisibility } from '../inspector/visibility';
import { usePanelProps } from '../inspector/panelProps';
import { isBlockModuleActive } from '../utils/moduleState';

import LayoutsPanel from '../inspector/panels/LayoutsPanel';
import PaginationDotsPanel from '../inspector/panels/PaginationDotsPanel';
import AjaxPaginationPanel from '../inspector/panels/AjaxPaginationPanel';
import ThumbnailsAreaPanel from '../../thumbnails-slider/inspector/ThumbnailsAreaPanel';
import ThumbnailPanel from '../../thumbnails-slider/inspector/ThumbnailPanel';
import NavigationPanel from '../inspector/panels/NavigationPanel';
import QueryBuilderPanel from '../inspector/panels/QueryBuilderPanel';
import CardContentPanel from '../inspector/panels/CardContentPanel';
import ClickActionPanel from '../inspector/panels/ClickActionPanel';
import ImagePanel from '../inspector/panels/ImagePanel';
import RatingPanel from '../inspector/panels/RatingPanel';
import TaxonomyPanel from '../inspector/panels/TaxonomyPanel';
import PostMetaPanel from '../inspector/panels/PostMetaPanel';
import SocialSharePanel from '../inspector/panels/SocialSharePanel';
import VideoPanel from '../inspector/panels/VideoPanel';
import EffectsPanel from '../inspector/panels/EffectsPanel';
import ProPanel from '../inspector/panels/ProPanel';
import AdvancedPanel from '../inspector/panels/AdvancedPanel';

/**
 * Renders the inspector sidebar with all carousel configuration panels.
 *
 * @param {Object}   props               - Component props
 * @param {Object}   props.attributes    - Block attributes
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {string}   props.layoutType    - Block layout type (carousel, slider, etc.)
 * @param {string}   props.openPanel     - Currently open panel name
 * @param {Function} props.setOpenPanel  - Function to set the open panel
 * @param {Object}   props.panelTabs     - Object mapping panel names to active tab names
 * @param {Function} props.setPanelTabs  - Function to update active tabs
 * @return {JSX.Element} Inspector panel structure
 */
export default function CarouselInspector({
	attributes,
	setAttributes,
	layoutType,
	openPanel,
	setOpenPanel,
	panelTabs,
	setPanelTabs,
}) {
	const { sourceType } = attributes;
	const { shouldShow } = usePanelVisibility(sourceType, attributes);

	// Sliced props per panel — each is referentially stable when its keys are
	// untouched, allowing React.memo on the panels to skip render.
	const layoutsProps = usePanelProps('layouts', attributes, setAttributes);
	const queryBuilderProps = usePanelProps('queryBuilder', attributes, setAttributes);
	const videoProps = usePanelProps('video', attributes, setAttributes);
	const cardContentProps = usePanelProps('cardContent', attributes, setAttributes);
	const clickActionProps = usePanelProps('clickAction', attributes, setAttributes);
	const imageProps = usePanelProps('image', attributes, setAttributes);
	const ratingProps = usePanelProps('rating', attributes, setAttributes);
	const taxonomyProps = usePanelProps('taxonomy', attributes, setAttributes);
	const postMetaProps = usePanelProps('postMeta', attributes, setAttributes);
	const socialShareProps = usePanelProps('socialShare', attributes, setAttributes);
	const effectsProps = usePanelProps('effects', attributes, setAttributes);
	const advancedProps = usePanelProps('advanced', attributes, setAttributes);
	const paginationDotsProps = usePanelProps('paginationDots', attributes, setAttributes);
	const ajaxPaginationProps = usePanelProps('ajaxPagination', attributes, setAttributes);
	const navigationProps = usePanelProps('navigation', attributes, setAttributes);
	const thumbnailsAreaProps = usePanelProps('thumbnailsArea', attributes, setAttributes);
	const thumbnailProps = usePanelProps('thumbnail', attributes, setAttributes);

	const isThumbnailsSliderBlock = layoutType === 'wp-carousel-pro/thumbnails-slider';
	const isMarqueePreview = 'wp-carousel-pro/marquee' === layoutType;
	// The ticker engine draws neither dots nor arrows.
	const showPaginationDotsPanel = shouldShow('paginationDots') && !isMarqueePreview;
	const showNavigationPanel = shouldShow('navigation') && !isMarqueePreview;
	// The Hover Animations panel mirrors its dashboard module toggle: when the
	// module is turned off, hide the panel entirely (matches Lightbox).
	const showEffectsPanel = shouldShow('effects') && isBlockModuleActive('hover');

	// Sidebar display order. `show: false` drops the panel entirely.
	const panels = [
		{
			name: 'layouts',
			show: true,
			content: <LayoutsPanel {...layoutsProps} layoutType={layoutType} />,
		},
		{
			name: 'navigation',
			show: showNavigationPanel,
			content: <NavigationPanel {...navigationProps} />,
		},
		{
			name: 'paginationDots',
			show: showPaginationDotsPanel,
			content: <PaginationDotsPanel {...paginationDotsProps} />,
		},
		{
			name: 'ajaxPagination',
			show: shouldShow('ajaxPagination'),
			content: <AjaxPaginationPanel {...ajaxPaginationProps} />,
		},
		{
			name: 'thumbnailsArea',
			show: isThumbnailsSliderBlock,
			content: <ThumbnailsAreaPanel {...thumbnailsAreaProps} />,
		},
		{
			name: 'thumbnail',
			show: isThumbnailsSliderBlock,
			content: <ThumbnailPanel {...thumbnailProps} />,
		},
		{
			name: 'queryBuilder',
			show: shouldShow('queryBuilder'),
			content: <QueryBuilderPanel {...queryBuilderProps} />,
		},
		{ name: 'video', show: shouldShow('video'), content: <VideoPanel {...videoProps} /> },
		{
			name: 'cardContent',
			show: shouldShow('cardContent'),
			content: <CardContentPanel {...cardContentProps} />,
		},
		{
			name: 'clickAction',
			show: shouldShow('clickAction'),
			content: <ClickActionPanel {...clickActionProps} />,
		},
		{ name: 'image', show: shouldShow('image'), content: <ImagePanel {...imageProps} /> },
		{ name: 'rating', show: shouldShow('rating'), content: <RatingPanel {...ratingProps} /> },
		{ name: 'taxonomy', show: shouldShow('taxonomy'), content: <TaxonomyPanel {...taxonomyProps} /> },
		{ name: 'postMeta', show: shouldShow('postMeta'), content: <PostMetaPanel {...postMetaProps} /> },
		{
			name: 'socialShare',
			show: shouldShow('socialShare'),
			content: <SocialSharePanel {...socialShareProps} />,
		},
		{ name: 'effects', show: showEffectsPanel, content: <EffectsPanel {...effectsProps} /> },
		{ name: 'scheduling', show: true, content: <ProPanel panelId="scheduling" /> },
		{ name: 'motion', show: true, content: <ProPanel panelId="motion" /> },
		{ name: 'advanced', show: true, content: <AdvancedPanel {...advancedProps} /> },
	];

	return (
		<>
			{panels.map(({ name, show, content }) =>
				show ? (
					<PanelWrapper
						key={name}
						panelName={name}
						openPanel={openPanel}
						onOpenPanelChange={setOpenPanel}
						panelTabs={panelTabs}
						onPanelTabsChange={setPanelTabs}
					>
						{content}
					</PanelWrapper>
				) : null
			)}
		</>
	);
}
