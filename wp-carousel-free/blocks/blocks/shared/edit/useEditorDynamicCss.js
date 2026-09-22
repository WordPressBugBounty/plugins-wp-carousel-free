/**
 * Editor-preview dynamic CSS strings, scoped by `uniqueId`. Mirrors the PHP
 * generators (`CarouselDynamicCss.php`, pagination/navigation/AJAX-pagination
 * styles) so the canvas matches the frontend.
 */

import { useMemo } from '@wordpress/element';
import dynamicCss from '../styles/carouselDynamicCss';
import paginationDotsDynamicCss from '../styles/paginationDotsDynamicCss';
import navigationDynamicCss from '../styles/navigationDynamicCss';
import ajaxPaginationDynamicCss from '../styles/ajaxPaginationDynamicCss';

/**
 * @param {Object} attributes Block attributes.
 * @param {string} name       Block type name (gates the Tiles AJAX-pagination CSS).
 * @return {{dynamicCssString: string, paginationCssString: string, navigationCssString: string, tilesPaginationCssString: string}} CSS strings ('' when not applicable).
 */
export default function useEditorDynamicCss(attributes, name) {
	const { uniqueId } = attributes;
	// The ticker renders no dots and no arrows, so there is nothing to style.
	// Keyed on the style rather than the block name: no Free carousel can select
	// `ticker` (see `fragments/carouselStyles.jsx`).
	const isTicker = 'ticker' === attributes.layoutOptions?.carouselStyle;

	const dynamicCssString = useMemo(() => {
		if (!uniqueId) {
			return '';
		}
		return dynamicCss(attributes, 'editor');
	}, [attributes, uniqueId]);

	const paginationCssString = useMemo(() => {
		if (!uniqueId || isTicker) {
			return '';
		}
		return paginationDotsDynamicCss(attributes.uniqueId, attributes.paginationDotsOptions);
	}, [attributes.uniqueId, attributes.paginationDotsOptions, uniqueId, isTicker]);

	const navigationCssString = useMemo(() => {
		if (!uniqueId || isTicker) {
			return '';
		}
		return navigationDynamicCss(attributes.uniqueId, attributes.navigationOptions);
	}, [attributes.uniqueId, attributes.navigationOptions, uniqueId, isTicker]);

	const tilesPaginationCssString = useMemo(() => {
		if (!uniqueId || name !== 'wp-carousel-pro/tiles') {
			return '';
		}
		if (attributes.layoutOptions?.pagination !== true) {
			return '';
		}
		return ajaxPaginationDynamicCss(attributes);
	}, [attributes, uniqueId, name]);

	return { dynamicCssString, paginationCssString, navigationCssString, tilesPaginationCssString };
}
