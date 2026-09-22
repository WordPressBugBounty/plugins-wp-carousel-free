/**
 * Read More / Add to cart button for one item — shared markup/classes across
 * post-like and media sources so editor styling stays aligned with
 * `SlotRenderer` on the PHP side.
 */

import { __ } from '@wordpress/i18n';
import useIconList from '../../../../components/iconLibrary/useIconList';
import { CartIcon } from '../../../../icons/icons';
import { ARROW_ICON_OPTIONS, getArrowIcon } from '../navigationIconHelper';
import { getResponsiveDimensionValue } from './itemStyleHelpers';
import { sanitizeItemUrl } from '../../utils/sanitizeItemText';
import classNames from 'classnames';

const ARROW_ICON_VALUES = new Set(ARROW_ICON_OPTIONS.map(({ value }) => value));

/**
 * Destination URL for the Read More button. Media sources use the item's
 * custom URL; post/external continue to use `item.url`.
 *
 * @param {Object} item
 * @param {string} sourceType
 * @return {string} URL or empty string when the button has no destination.
 */
export function getReadMoreUrl(item, sourceType) {
	return ['image', 'video'].includes(sourceType)
		? item.customUrl || item.custom_url || ''
		: item.url || '';
}

/**
 * @param {Object}  props
 * @param {Object}  props.item
 * @param {string}  props.readMoreUrl              Resolved destination (see `getReadMoreUrl`).
 * @param {string}  props.sourceType
 * @param {Object}  props.productContentOptions
 * @param {Object}  props.readMoreOptions          Button type/icon options (post panel or contentOptions).
 * @param {boolean} props.shouldApplyUrlToReadMore Render as a link when true, plain span otherwise.
 * @param {string}  props.newTab                   `_blank` / `_self` link target.
 * @param {string}  props.rel                      Link rel attribute value.
 * @param {boolean} props.isEditor
 */
export default function ReadMoreButton({
	item,
	readMoreUrl,
	sourceType,
	productContentOptions,
	readMoreOptions,
	shouldApplyUrlToReadMore,
	newTab,
	rel,
	isEditor,
}) {
	const iconList = useIconList();

	const stockStatus = item?.extra?.stock_status || '';
	const productHasPrice = Boolean(item?.extra?.price || item?.price);
	// Mirrors SlotRenderer: only products WooCommerce can add straight to the
	// cart get the cart affordance — variable/grouped/external ones link out.
	const isAddToCart =
		sourceType === 'product' &&
		productContentOptions.showAddToCart &&
		productHasPrice &&
		!['outofstock', 'onbackorder'].includes(stockStatus) &&
		item?.extra?.is_purchasable === '1' &&
		item?.extra?.supports_ajax_cart === '1';
	const productButtonLabel = item?.extra?.add_to_cart_text || '';
	let label;
	if (sourceType === 'product' && productContentOptions.showAddToCart && productButtonLabel) {
		label = productButtonLabel;
	} else {
		label = isAddToCart ? __('Add to cart', 'wp-carousel-free') : __('Read More', 'wp-carousel-free');
	}

	const btnType = readMoreOptions?.buttonType ?? 'button';
	const showBtnIcon = readMoreOptions?.showIcon ?? false;
	const showIconOnHover = readMoreOptions?.showIconHover ?? false;
	const iconSource = readMoreOptions?.iconSource ?? 'library';
	const iconPosition = readMoreOptions?.iconPosition ?? 'right';
	const libraryIcon = readMoreOptions?.chooseIcon || 'angle-right';
	const customIcon = readMoreOptions?.chooseImg;
	const iconSize = getResponsiveDimensionValue(readMoreOptions?.iconSize);
	// const iconGap = getResponsiveDimensionValue(readMoreOptions?.iconGap);
	const icon = iconList?.[libraryIcon];
	const ArrowIcon = ARROW_ICON_VALUES.has(libraryIcon) ? getArrowIcon(libraryIcon) : null;
	// const readMoreStyle = iconGap ? { gap: iconGap } : undefined;
	const readMoreIconStyle = iconSize
		? {
				fontSize: iconSize,
				width: iconSize,
				height: iconSize,
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
		  }
		: undefined;
	let libraryIconMarkup = null;
	if (ArrowIcon) {
		libraryIconMarkup = <ArrowIcon />;
	} else if (icon?.path) {
		libraryIconMarkup = (
			<svg
				viewBox={icon?.viewBox}
				width={iconSize || icon?.width || 20}
				height={iconSize || icon?.height || 20}
			>
				<path d={icon?.path} fill="currentColor" />
			</svg>
		);
	}
	const imageIconObj = {
		library: libraryIconMarkup,
		custom: customIcon?.url ? (
			<img
				src={customIcon?.url}
				alt={customIcon?.alt}
				style={iconSize ? { width: iconSize, height: iconSize } : undefined}
			/>
		) : null,
	};
	const readMoreIcon = showBtnIcon ? (
		<span className="wpcp-readmore-icon" style={readMoreIconStyle}>
			{imageIconObj[iconSource]}
		</span>
	) : null;
	const cartIcon =
		isAddToCart && productContentOptions.showCartIcon === true ? (
			<span className="wpcp-readmore-icon" style={readMoreIconStyle}>
				<CartIcon />
			</span>
		) : null;

	const className = classNames('wpcp-read-more', `wpcp-btn-type-${btnType}`, {
		[`wpcp-icon-position-${iconPosition}`]: showBtnIcon || Boolean(cartIcon),
		'wpcp-icon-on-hover': showIconOnHover && showBtnIcon,
	});

	// A product the cart cannot take directly links to its purchase destination.
	const productLinkUrl =
		sourceType === 'product' && !isAddToCart ? item?.extra?.add_to_cart_url || readMoreUrl || '' : '';
	const shouldLinkReadMore = shouldApplyUrlToReadMore || Boolean(productLinkUrl);

	if (shouldLinkReadMore) {
		// Reject javascript:/data: destinations the way PHP's esc_url does —
		// React only warns about them.
		const safeReadMoreUrl = sanitizeItemUrl(productLinkUrl || readMoreUrl || '');
		return (
			// eslint-disable-next-line
			<a
				className={className}
				href={'' !== safeReadMoreUrl ? safeReadMoreUrl : '#'}
				target={newTab}
				rel={rel}
				// style={readMoreStyle}
				onClick={
					isEditor
						? (event) => {
								event.preventDefault();
								event.stopPropagation();
						  }
						: (event) => {
								event.stopPropagation();
						  }
				}
			>
				{label}
				{cartIcon}
				{readMoreIcon}
			</a>
		);
	}

	return (
		<span
			className={className}
			// style={readMoreStyle}
		>
			{label}
			{cartIcon}
			{readMoreIcon}
		</span>
	);
}
