/**
 * Lightbox overlay icon on the item media — mirrors the markup the PHP
 * renderer emits for the Click Action panel's icon overlay.
 */

import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import useIconList from '../../../../components/iconLibrary/useIconList';
import { iconPathList } from '../../../../components/iconLibrary/iconPaths';
import {
	overlayIconsVisibilityClass,
	resolveOverlayLightboxIcon,
} from '../../lightbox/lightboxIconResolve';
import { getDefaultOverlayPositionRaw, resolveOverlayPositionSlug } from './itemStyleHelpers';
import { sanitizeItemCaption } from '../../utils/sanitizeItemText';

function LightboxCornersIcon() {
	return (
		<svg
			viewBox="0 0 15 15"
			width="15"
			height="15"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.33333"
			strokeLinecap="round"
		>
			<path d="M0.666748 4.83317V1.74984C0.666748 1.15153 1.15177 0.666504 1.75008 0.666504H4.83341M14.0001 4.83317V1.74984C14.0001 1.15153 13.5151 0.666504 12.9167 0.666504H9.83341M14.0001 9.83317V12.9165C14.0001 13.5148 13.5151 13.9998 12.9167 13.9998H9.83341M0.666748 9.83317V12.9165C0.666748 13.5148 1.15177 13.9998 1.75008 13.9998H4.83341" />
		</svg>
	);
}

/**
 * @param {Object}  props
 * @param {Object}  props.item
 * @param {number}  props.itemIndex
 * @param {Object}  props.clickActionOptions
 * @param {boolean} props.hasImage
 * @param {boolean} props.isReflection
 * @param {string}  props.sourceType
 * @param {boolean} props.isExternalVideo
 * @param {boolean} props.sourceLinksToPermalink Post/product permalink sources never show overlay icons.
 * @param {string}  props.fancyboxGroup
 */
export default function OverlayIcons({
	item,
	itemIndex,
	clickActionOptions,
	hasImage,
	isReflection,
	sourceType,
	isExternalVideo,
	sourceLinksToPermalink,
	fancyboxGroup,
}) {
	const iconList = useIconList();
	const actionType = clickActionOptions.type || 'lightbox';

	if (isReflection) {
		return null;
	}

	if (sourceType === 'video' || isExternalVideo || sourceLinksToPermalink) {
		return null;
	}

	if (!hasImage || 'lightbox' !== actionType) {
		return null;
	}

	// When the Lightbox module is active the overlay icon mirrors the global
	// Lightbox Settings (glyph, position, and — via overlayGlobalIconCss —
	// size/colors); otherwise the block's own clickActionOptions drive it. Keeps
	// the editor preview in parity with OverlayIconRenderer.php on the frontend.
	const lightboxResolved = resolveOverlayLightboxIcon(clickActionOptions);
	const useGlobalLightbox = lightboxResolved.source === 'global';

	// Position is expressed as a class so static CSS handles each anchor:
	// 'top right' → 'wpcp-overlay-pos-top-right', 'center center' → 'wpcp-overlay-pos-center-center'.
	// `AlignmentMatrixControl` emits the centre anchor as the single token `'center'`
	// (not `'center center'`), and an unset value can arrive as `''` from older saved
	// posts — both cases used to produce class names that no `.wpcp-overlay-pos-*`
	// rule matches, so the icon fell back to absolute 0,0 in the parent. Normalise
	// to one of the 9 known anchors and default to `'top right'` otherwise. The
	// global resolver already returns a normalised overlay slug.
	const positionSlug = useGlobalLightbox
		? lightboxResolved.position
		: resolveOverlayPositionSlug(
				clickActionOptions.lightboxIconPosition ?? getDefaultOverlayPositionRaw()
		  );
	const positionClass = `wpcp-overlay-pos-${positionSlug}`;
	const visibilityClass = useGlobalLightbox
		? overlayIconsVisibilityClass(lightboxResolved.visibility)
		: '';

	const lightboxIconType = useGlobalLightbox
		? lightboxResolved.iconType
		: clickActionOptions.lightboxIconType || 'library';
	const lightboxIconKey = useGlobalLightbox
		? lightboxResolved.iconName
		: clickActionOptions.lightboxIcon || 'search';
	const lightboxCustomIcon = useGlobalLightbox
		? lightboxResolved.customIcon
		: clickActionOptions.lightboxCustomIcon;
	const renderLibraryIconSvg = (iconKey) => {
		if (iconKey === 'lightbox-corners') {
			return <LightboxCornersIcon />;
		}

		const lib = iconList?.[iconKey];
		if (lib?.path || lib?.paths) {
			if (lib.render === 'stroke') {
				return (
					<svg
						viewBox={lib.viewBox || '0 0 24 24'}
						fill="none"
						stroke="currentColor"
						strokeWidth={lib.stroke_width || 1.75}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d={lib.path} />
					</svg>
				);
			}

			return (
				<svg
					viewBox={lib.viewBox || '0 0 24 24'}
					width={lib.width || 24}
					height={lib.height || 24}
					fill="currentColor"
				>
					{iconPathList(lib).map((part, index) => (
						<path key={index} d={part.d} fillRule={part.fillRule} />
					))}
				</svg>
			);
		}
		return null;
	};

	const lightboxIconNode =
		lightboxIconType === 'custom' && lightboxCustomIcon?.url ? (
			<img src={lightboxCustomIcon.url} alt="" className="wpcp-overlay-icon-img" />
		) : (
			renderLibraryIconSvg(lightboxIconKey) || <LightboxCornersIcon />
		);

	// Fancybox injects the caption into `.f-caption` with innerHTML, so React's
	// attribute escaping is not the protection that matters here — the value has
	// to be filtered to the same allow-list OverlayIconRenderer.php applies.
	const lightboxCaption = sanitizeItemCaption(item.caption || item.title || '');

	return (
		<div className={classNames('wpcp-overlay-icons', positionClass, visibilityClass)}>
			<a
				href={item.image_url}
				className="wpcp-overlay-icon wpcp-lightbox-icon"
				data-fancybox={fancyboxGroup ? `wpcp-${fancyboxGroup}` : 'wpcp-gallery'}
				data-wpcp-item-index={itemIndex}
				data-caption={lightboxCaption}
				aria-label={__('Open lightbox', 'wp-carousel-free')}
			>
				{lightboxIconNode}
			</a>
		</div>
	);
}
