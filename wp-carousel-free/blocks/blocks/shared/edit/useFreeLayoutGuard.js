/**
 * Mount-time guard for a block saved while Pro was active.
 *
 * Pro and Free share block names and option keys, so a post authored in Pro
 * opens unchanged in Free — including a carousel style, block layout, slide
 * transition, arrow style, arrow position, pagination style, Ajax pagination
 * type, click action, aspect ratio, taxonomy type or position, meta separator,
 * query filter or hover effect that only Pro can render.
 *
 * `AllowedValues::project()` already snaps every one of those on read, so the
 * frontend is correct either way; this rewrites the attribute so the inspector
 * selection, the editor preview and the saved markup agree with it instead of
 * showing a locked option as the active choice. Every correction builder here
 * mirrors one branch of that PHP projection.
 */

import { useEffect } from '@wordpress/element';
import {
	getFreeLayoutCorrections,
	getFreeNavigationCorrections,
	getFreePaginationCorrections,
	getFreeClickActionCorrections,
	getFreeSliderCorrections,
	getFreePostContentCorrections,
	getFreeProductContentCorrections,
	getFreeContentAreaCorrections,
	getFreeThumbsAreaCorrections,
	getFreeThumbnailCorrections,
	getFreeEffectsCorrections,
	getFreeQueryCorrections,
	getFreeTaxonomyCorrections,
	getFreeMetaCorrections,
	getFreeImageCorrections,
	getFreeAjaxPaginationCorrections,
	getFreeVideoCorrections,
} from '../constants/freeValues';
import { isEditorPreviewBlock } from '../constants/editorPreviewBlocks';

/**
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Block attribute updater.
 * @param {string}   [blockName]   Block type name; skips the guard for a Pro preview.
 */
export default function useFreeLayoutGuard(attributes, setAttributes, blockName = '') {
	useEffect(() => {
		// A Pro editor preview renders nothing on the front end, so Free's value
		// ceiling does not apply — the preview has to be able to draw the Pro
		// choice. The marquee needs both halves of that: `displayStyle` would be
		// rewritten back to `horizontal`, and `carouselStyle` off the `ticker`
		// engine the preview is built on.
		if (isEditorPreviewBlock(blockName)) {
			return;
		}

		const layoutOptions = attributes.layoutOptions || {};
		const navigationOptions = attributes.navigationOptions || {};
		const paginationDotsOptions = attributes.paginationDotsOptions || {};
		const clickActionOptions = attributes.clickActionOptions || {};
		const sliderOptions = attributes.sliderOptions || {};
		const postContentOptions = attributes.postContentOptions || {};
		const productContentOptions = attributes.productContentOptions || {};
		const contentAreaOptions = attributes.contentAreaOptions || {};
		const thumbsArea = attributes.thumbsArea || {};
		const thumbnail = attributes.thumbnail || {};
		const effectsOptions = attributes.effectsOptions || {};
		const queryOptions = attributes.queryOptions || {};
		const taxonomyOptions = attributes.taxonomyOptions || {};
		const metaOptions = attributes.metaOptions || {};
		const imageOptions = attributes.imageOptions || {};
		const paginationOptions = attributes.paginationOptions || {};
		const videoOptions = attributes.videoOptions || {};

		const layout = getFreeLayoutCorrections(layoutOptions, attributes.blockName);
		const navigation = getFreeNavigationCorrections(navigationOptions, attributes.blockName);
		const pagination = getFreePaginationCorrections(paginationDotsOptions);
		const clickAction = getFreeClickActionCorrections(clickActionOptions);
		const slider = getFreeSliderCorrections(sliderOptions);
		const postContent = getFreePostContentCorrections(postContentOptions);
		const productContent = getFreeProductContentCorrections(productContentOptions);
		const contentArea = getFreeContentAreaCorrections(contentAreaOptions);
		const thumbs = getFreeThumbsAreaCorrections(thumbsArea);
		const thumb = getFreeThumbnailCorrections(thumbnail);
		const effects = getFreeEffectsCorrections(effectsOptions);
		const query = getFreeQueryCorrections(queryOptions);
		const taxonomy = getFreeTaxonomyCorrections(taxonomyOptions, attributes.sourceType);
		const meta = getFreeMetaCorrections(metaOptions);
		const image = getFreeImageCorrections(imageOptions, attributes.blockName);
		const ajaxPagination = getFreeAjaxPaginationCorrections(paginationOptions);
		const video = getFreeVideoCorrections(videoOptions);

		const next = {
			...(Object.keys(layout).length ? { layoutOptions: { ...layoutOptions, ...layout } } : {}),
			...(Object.keys(navigation).length
				? { navigationOptions: { ...navigationOptions, ...navigation } }
				: {}),
			...(Object.keys(pagination).length
				? { paginationDotsOptions: { ...paginationDotsOptions, ...pagination } }
				: {}),
			...(Object.keys(clickAction).length
				? { clickActionOptions: { ...clickActionOptions, ...clickAction } }
				: {}),
			...(Object.keys(slider).length ? { sliderOptions: { ...sliderOptions, ...slider } } : {}),
			...(Object.keys(postContent).length
				? { postContentOptions: { ...postContentOptions, ...postContent } }
				: {}),
			...(Object.keys(productContent).length
				? { productContentOptions: { ...productContentOptions, ...productContent } }
				: {}),
			...(Object.keys(contentArea).length
				? { contentAreaOptions: { ...contentAreaOptions, ...contentArea } }
				: {}),
			...(Object.keys(thumbs).length ? { thumbsArea: { ...thumbsArea, ...thumbs } } : {}),
			...(Object.keys(thumb).length ? { thumbnail: { ...thumbnail, ...thumb } } : {}),
			...(Object.keys(effects).length ? { effectsOptions: { ...effectsOptions, ...effects } } : {}),
			...(Object.keys(query).length ? { queryOptions: { ...queryOptions, ...query } } : {}),
			...(Object.keys(taxonomy).length
				? { taxonomyOptions: { ...taxonomyOptions, ...taxonomy } }
				: {}),
			...(Object.keys(meta).length ? { metaOptions: { ...metaOptions, ...meta } } : {}),
			...(Object.keys(image).length ? { imageOptions: { ...imageOptions, ...image } } : {}),
			...(Object.keys(ajaxPagination).length
				? { paginationOptions: { ...paginationOptions, ...ajaxPagination } }
				: {}),
			...(Object.keys(video).length ? { videoOptions: { ...videoOptions, ...video } } : {}),
		};

		if (!Object.keys(next).length) {
			return;
		}
		setAttributes(next);
		// Why: deps intentionally empty — fires once on mount, the same shape as
		// useProgrammaticSourceGuard. Re-firing would fight the picker.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
