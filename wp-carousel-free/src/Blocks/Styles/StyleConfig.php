<?php
/**
 * Style config (frontend side) — the attribute→token rows consumed by EmitTokens.
 *
 * GENERATED FILE — do not edit. Regenerate with `npm run sync:style-config`
 * (source: blocks/blocks/shared/styles/config/style-config.js). CI fails on a stale copy.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles;

defined( 'ABSPATH' ) || exit;

/**
 * Codegen'd attribute→token config rows (mirror of style-config.js). A plain data
 * array; both emitters walk it. PSR-4 autoloaded — zero runtime file I/O.
 */
final class StyleConfig {

	/**
	 * The authored style-config rows.
	 *
	 * @return array Config rows: { id, attr, var, transform, device, scope, when, default }.
	 */
	public static function all(): array {
		return array(
			array(
				'id'        => 'img-border-style',
				'attr'      => 'imageOptions.imageBorderNormal.style',
				'var'       => '--wpcp-img-border-style',
				'transform' => 'raw',
				'default'   => 'none',
			),
			array(
				'id'        => 'img-border-color',
				'attr'      => 'imageOptions.imageBorderNormal.color',
				'var'       => '--wpcp-img-border-color',
				'transform' => 'color',
				'when'      => array(
					'attr'  => 'imageOptions.imageBorderNormal.style',
					'op'    => 'neq',
					'value' => 'none',
				),
			),
			array(
				'id'        => 'img-border-width',
				'attr'      => 'imageOptions.imageBorderWidthNormal',
				'var'       => '--wpcp-img-border-width',
				'transform' => 'spacing',
				'when'      => array(
					'attr'  => 'imageOptions.imageBorderNormal.style',
					'op'    => 'neq',
					'value' => 'none',
				),
			),
			array(
				'id'        => 'img-border-color-hover',
				'attr'      => 'imageOptions.imageBorderHover.color',
				'var'       => '--wpcp-img-border-color-hover',
				'transform' => 'color',
				'when'      => array(
					'attr'  => 'imageOptions.imageBorderHover.style',
					'op'    => 'neq',
					'value' => 'none',
				),
			),
			array(
				'id'        => 'vw-image-height',
				'attr'      => 'imageOptions.variableWidthImageHeight',
				'var'       => '--wpcp-vw-image-height',
				'transform' => 'dimension',
				'device'    => true,
				'whenAll'   => array(
					array(
						'attr' => 'layoutOptions.variableWidth',
						'op'   => 'truthy',
					),
					array(
						'attr'  => 'sliderOptions.effect',
						'op'    => 'neq',
						'value' => 'flip',
					),
					array(
						'attr'  => 'sliderOptions.effect',
						'op'    => 'neq',
						'value' => 'cube',
					),
					array(
						'attr'  => 'imageOptions.variableWidthImageHeightMode',
						'op'    => 'neq',
						'value' => 'max-height',
					),
				),
			),
			array(
				'id'        => 'vw-image-max-height',
				'attr'      => 'imageOptions.variableWidthImageHeight',
				'var'       => '--wpcp-vw-image-max-height',
				'transform' => 'dimension',
				'device'    => true,
				'whenAll'   => array(
					array(
						'attr' => 'layoutOptions.variableWidth',
						'op'   => 'truthy',
					),
					array(
						'attr'  => 'sliderOptions.effect',
						'op'    => 'neq',
						'value' => 'flip',
					),
					array(
						'attr'  => 'sliderOptions.effect',
						'op'    => 'neq',
						'value' => 'cube',
					),
					array(
						'attr'  => 'imageOptions.variableWidthImageHeightMode',
						'op'    => 'eq',
						'value' => 'max-height',
					),
				),
			),
			array(
				'id'        => 'video-icon-color',
				'attr'      => 'videoOptions.iconColor',
				'var'       => '--wpcp-video-icon-color',
				'transform' => 'color',
				'when'      => array(
					'attr'  => 'videoOptions.useSourceIcon',
					'op'    => 'neq',
					'value' => true,
				),
			),
			array(
				'id'        => 'video-icon-bg',
				'attr'      => 'videoOptions.iconBg',
				'var'       => '--wpcp-video-icon-bg',
				'transform' => 'color',
				'whenAll'   => array(
					array(
						'attr'  => 'videoOptions.useSourceIcon',
						'op'    => 'neq',
						'value' => true,
					),
					array(
						'attr'  => 'videoOptions.iconView',
						'op'    => 'neq',
						'value' => 'normal',
					),
				),
			),
			array(
				'id'        => 'video-icon-color-hover',
				'attr'      => 'videoOptions.iconHoverColor',
				'var'       => '--wpcp-video-icon-color-hover',
				'transform' => 'color',
				'when'      => array(
					'attr'  => 'videoOptions.useSourceIcon',
					'op'    => 'neq',
					'value' => true,
				),
			),
			array(
				'id'        => 'video-icon-bg-hover',
				'attr'      => 'videoOptions.iconHoverBg',
				'var'       => '--wpcp-video-icon-bg-hover',
				'transform' => 'color',
				'whenAll'   => array(
					array(
						'attr'  => 'videoOptions.useSourceIcon',
						'op'    => 'neq',
						'value' => true,
					),
					array(
						'attr'  => 'videoOptions.iconView',
						'op'    => 'neq',
						'value' => 'normal',
					),
				),
			),
			array(
				'id'        => 'video-border-style',
				'attr'      => 'videoOptions.videoBorder.style',
				'var'       => '--wpcp-video-border-style',
				'transform' => 'raw',
				'default'   => 'none',
			),
			array(
				'id'        => 'video-border-color',
				'attr'      => 'videoOptions.videoBorder.color',
				'var'       => '--wpcp-video-border-color',
				'transform' => 'color',
				'when'      => array(
					'attr'  => 'videoOptions.videoBorder.style',
					'op'    => 'neq',
					'value' => 'none',
				),
			),
			array(
				'id'        => 'video-icon-size',
				'attr'      => 'videoOptions.iconSize',
				'var'       => '--wpcp-video-icon-size',
				'transform' => 'dimension',
				'device'    => true,
			),
			array(
				'id'        => 'video-icon-area',
				'attr'      => 'videoOptions.iconAreaSize',
				'var'       => '--wpcp-video-icon-area',
				'transform' => 'dimension',
				'device'    => true,
				'whenAll'   => array(
					array(
						'attr'  => 'videoOptions.useSourceIcon',
						'op'    => 'neq',
						'value' => true,
					),
					array(
						'attr'  => 'videoOptions.iconView',
						'op'    => 'neq',
						'value' => 'normal',
					),
				),
			),
			array(
				'id'        => 'video-icon-radius',
				'attr'      => 'videoOptions.iconBorderRadius',
				'var'       => '--wpcp-video-icon-radius',
				'transform' => 'spacingBox',
				'device'    => true,
				'single'    => true,
				'whenAll'   => array(
					array(
						'attr'  => 'videoOptions.useSourceIcon',
						'op'    => 'neq',
						'value' => true,
					),
					array(
						'attr'  => 'videoOptions.iconView',
						'op'    => 'neq',
						'value' => 'normal',
					),
				),
			),
			array(
				'id'        => 'video-border-width',
				'attr'      => 'videoOptions.videoBorderWidth',
				'var'       => '--wpcp-video-border-width',
				'transform' => 'spacingBox',
				'device'    => true,
				'when'      => array(
					'attr'  => 'videoOptions.videoBorder.style',
					'op'    => 'neq',
					'value' => 'none',
				),
			),
			array(
				'id'        => 'video-border-radius',
				'attr'      => 'videoOptions.videoBorderRadius',
				'var'       => '--wpcp-video-border-radius',
				'transform' => 'spacingBox',
				'device'    => true,
				'single'    => true,
			),
			array(
				'id'        => 'content-title-color',
				'attr'      => 'contentOptions.titleColor',
				'var'       => '--wpcp-content-title-color',
				'transform' => 'contentColor',
				'default'   => '#2f2f2f',
			),
			array(
				'id'        => 'content-desc-color',
				'attr'      => 'contentOptions.descColor',
				'var'       => '--wpcp-content-desc-color',
				'transform' => 'contentColor',
				'default'   => '#757575',
			),
			array(
				'id'        => 'content-price-color',
				'attr'      => 'productContentOptions.priceColor',
				'var'       => '--wpcp-content-price-color',
				'transform' => 'color',
				'when'      => array(
					'attr'  => 'sourceType',
					'op'    => 'eq',
					'value' => 'product',
				),
			),
			array(
				'id'        => 'content-sale-price-color',
				'attr'      => 'productContentOptions.salePriceColor',
				'var'       => '--wpcp-content-sale-price-color',
				'transform' => 'color',
				'when'      => array(
					'attr'  => 'sourceType',
					'op'    => 'eq',
					'value' => 'product',
				),
			),
			array(
				'id'        => 'content-title-margin',
				'attr'      => 'contentOptions.titleMargin',
				'var'       => '--wpcp-content-title-margin',
				'transform' => 'spacingFill',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
			),
			array(
				'id'        => 'content-title-margin-post',
				'attr'      => 'postContentOptions.titleMargin',
				'var'       => '--wpcp-content-title-margin',
				'transform' => 'spacingFill',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'sourceType',
					'op'    => 'in',
					'value' => array( 'post', 'video' ),
				),
			),
			array(
				'id'        => 'content-title-margin-product',
				'attr'      => 'productContentOptions.titleMargin',
				'var'       => '--wpcp-content-title-margin',
				'transform' => 'spacingFill',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'sourceType',
					'op'    => 'eq',
					'value' => 'product',
				),
			),
			array(
				'id'        => 'content-desc-margin',
				'attr'      => 'contentOptions.descMargin',
				'var'       => '--wpcp-content-desc-margin',
				'transform' => 'spacingFill',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
			),
			array(
				'id'        => 'content-desc-margin-post',
				'attr'      => 'postContentOptions.excerptMargin',
				'var'       => '--wpcp-content-desc-margin',
				'transform' => 'spacingFill',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'sourceType',
					'op'    => 'in',
					'value' => array( 'post', 'video' ),
				),
			),
			array(
				'id'        => 'content-desc-margin-product-legacy',
				'attr'      => 'productContentOptions.desMargin',
				'var'       => '--wpcp-content-desc-margin',
				'transform' => 'spacingFill',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'sourceType',
					'op'    => 'eq',
					'value' => 'product',
				),
			),
			array(
				'id'        => 'content-desc-margin-product',
				'attr'      => 'productContentOptions.descMargin',
				'var'       => '--wpcp-content-desc-margin',
				'transform' => 'spacingFill',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'sourceType',
					'op'    => 'eq',
					'value' => 'product',
				),
			),
			array(
				'id'        => 'content-price-margin',
				'attr'      => 'productContentOptions.priceMargin',
				'var'       => '--wpcp-content-price-margin',
				'transform' => 'spacingFill',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'sourceType',
					'op'    => 'eq',
					'value' => 'product',
				),
			),
			array(
				'id'        => 'content-rating-fill',
				'attr'      => 'ratingOptions.fillColor',
				'var'       => '--wpcp-content-rating-fill',
				'transform' => 'color',
				'default'   => '#FFD700',
			),
			array(
				'id'        => 'content-rating-fill-hover',
				'attr'      => 'ratingOptions.fillHoverColor',
				'var'       => '--wpcp-content-rating-fill-hover',
				'transform' => 'color',
			),
			array(
				'id'        => 'content-rating-empty',
				'attr'      => 'ratingOptions.emptyColor',
				'var'       => '--wpcp-content-rating-empty',
				'transform' => 'color',
				'default'   => '#E0E0E0',
			),
			array(
				'id'        => 'content-border-style',
				'attr'      => 'contentAreaOptions.contentAreaStyle.normal.border.style',
				'var'       => '--wpcp-content-border-style',
				'transform' => 'raw',
				'default'   => 'none',
			),
			array(
				'id'        => 'content-border-color',
				'attr'      => 'contentAreaOptions.contentAreaStyle.normal.border.color',
				'var'       => '--wpcp-content-border-color',
				'transform' => 'color',
				'when'      => array(
					'attr'  => 'contentAreaOptions.contentAreaStyle.normal.border.style',
					'op'    => 'neq',
					'value' => 'none',
				),
			),
			array(
				'id'        => 'content-border-width',
				'attr'      => 'contentAreaOptions.contentAreaStyle.normal.borderWidth',
				'var'       => '--wpcp-content-border-width',
				'transform' => 'spacing',
				'when'      => array(
					'attr'  => 'contentAreaOptions.contentAreaStyle.normal.border.style',
					'op'    => 'neq',
					'value' => 'none',
				),
			),
			array(
				'id'        => 'content-shadow',
				'attr'      => 'contentAreaOptions.boxShadowNormal',
				'var'       => '--wpcp-content-shadow',
				'transform' => 'shadow',
				'when'      => array(
					'attr' => 'contentAreaOptions.boxShadowNormalEnable',
					'op'   => 'truthy',
				),
			),
			array(
				'id'        => 'content-shadow-hover',
				'attr'      => 'contentAreaOptions.boxShadowHover',
				'var'       => '--wpcp-content-shadow-hover',
				'transform' => 'shadow',
				'when'      => array(
					'attr' => 'contentAreaOptions.boxShadowHoverEnable',
					'op'   => 'truthy',
				),
			),
			array(
				'id'        => 'content-radius',
				'attr'      => 'contentAreaOptions.borderRadius',
				'var'       => '--wpcp-content-radius',
				'transform' => 'spacingBox',
				'device'    => true,
			),
			array(
				'id'        => 'meta-color',
				'attr'      => 'metaOptions.color',
				'var'       => '--wpcp-meta-color',
				'transform' => 'color',
			),
			array(
				'id'        => 'meta-separator-color',
				'attr'      => 'metaOptions.separatorColor',
				'var'       => '--wpcp-meta-separator-color',
				'transform' => 'color',
			),
			array(
				'id'        => 'meta-hover-color',
				'attr'      => 'metaOptions.hoverColor',
				'var'       => '--wpcp-meta-hover-color',
				'transform' => 'color',
			),
			array(
				'id'        => 'meta-gap',
				'attr'      => 'metaOptions.spacing',
				'var'       => '--wpcp-meta-gap',
				'transform' => 'metaGap',
				'device'    => true,
			),
			array(
				'id'        => 'rating-size',
				'attr'      => 'ratingOptions.iconSize',
				'var'       => '--wpcp-rating-size',
				'transform' => 'dimension',
				'device'    => true,
			),
			array(
				'id'        => 'rating-gap',
				'attr'      => 'ratingOptions.iconGap',
				'var'       => '--wpcp-rating-gap',
				'transform' => 'dimension',
				'device'    => true,
			),
			array(
				'id'        => 'tax-color',
				'attr'      => 'taxonomyOptions.textColor',
				'var'       => '--wpcp-tax-color',
				'transform' => 'color',
			),
			array(
				'id'        => 'tax-hover-color',
				'attr'      => 'taxonomyOptions.textHoverColor',
				'var'       => '--wpcp-tax-hover-color',
				'transform' => 'color',
			),
			array(
				'id'        => 'tax-bg',
				'attr'      => 'taxonomyOptions.backgroundColor',
				'var'       => '--wpcp-tax-bg',
				'transform' => 'color',
			),
			array(
				'id'        => 'tax-bg-hover',
				'attr'      => 'taxonomyOptions.backgroundHoverColor',
				'var'       => '--wpcp-tax-bg-hover',
				'transform' => 'color',
			),
			array(
				'id'        => 'tax-shadow',
				'attr'      => 'taxonomyOptions.boxShadow',
				'var'       => '--wpcp-tax-shadow',
				'transform' => 'shadow',
				'when'      => array(
					'attr' => 'taxonomyOptions.boxShadowEnable',
					'op'   => 'truthy',
				),
			),
			array(
				'id'        => 'tax-shadow-hover',
				'attr'      => 'taxonomyOptions.boxShadowHover',
				'var'       => '--wpcp-tax-shadow-hover',
				'transform' => 'shadow',
				'when'      => array(
					'attr' => 'taxonomyOptions.shadowEnableHover',
					'op'   => 'truthy',
				),
			),
			array(
				'id'        => 'tile-column-gap',
				'attr'      => 'layoutOptions',
				'var'       => '--wpcp-tile-column-gap',
				'transform' => 'tileGridDim',
				'base'      => 'gapHorizontal',
				'fallback'  => 20,
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'blockName',
					'op'    => 'in',
					'value' => array(
						'tiles',
						'wp-carousel-pro/tiles',
					),
				),
			),
			array(
				'id'        => 'tile-row-gap',
				'attr'      => 'layoutOptions',
				'var'       => '--wpcp-tile-row-gap',
				'transform' => 'tileGridDim',
				'base'      => 'gapVertical',
				'fallback'  => 20,
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'blockName',
					'op'    => 'in',
					'value' => array(
						'tiles',
						'wp-carousel-pro/tiles',
					),
				),
			),
			array(
				'id'        => 'tile-row-height',
				'attr'      => 'layoutOptions',
				'var'       => '--wpcp-tile-row-height',
				'transform' => 'tileGridDim',
				'base'      => 'tileRowHeight',
				'fallback'  => 220,
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'whenAll'   => array(
					array(
						'attr'  => 'blockName',
						'op'    => 'in',
						'value' => array(
							'tiles',
							'wp-carousel-pro/tiles',
						),
					),
					array(
						'attr' => 'layoutOptions.tileLayout',
						'op'   => 'truthy',
					),
					array(
						'attr'  => 'layoutOptions.tileLayout',
						'op'    => 'neq',
						'value' => 'one',
					),
					array(
						'attr'  => 'layoutOptions.tileLayout',
						'op'    => 'neq',
						'value' => 'three',
					),
				),
			),
			array(
				'id'        => 'thumbs-area-border-style',
				'attr'      => 'thumbsArea.border.style',
				'var'       => '--wpcp-thumbs-area-border-style',
				'transform' => 'raw',
				'default'   => 'none',
				'when'      => array(
					'attr'  => 'blockName',
					'op'    => 'in',
					'value' => array(
						'thumbnails-slider',
						'wp-carousel-pro/thumbnails-slider',
					),
				),
			),
			array(
				'id'        => 'thumbs-area-border-color',
				'attr'      => 'thumbsArea.border.color',
				'var'       => '--wpcp-thumbs-area-border-color',
				'transform' => 'color',
				'whenAll'   => array(
					array(
						'attr'  => 'blockName',
						'op'    => 'in',
						'value' => array(
							'thumbnails-slider',
							'wp-carousel-pro/thumbnails-slider',
						),
					),
					array(
						'attr'  => 'thumbsArea.border.style',
						'op'    => 'neq',
						'value' => 'none',
					),
				),
			),
			array(
				'id'        => 'thumbs-area-border-width',
				'attr'      => 'thumbsArea.borderWidth',
				'var'       => '--wpcp-thumbs-area-border-width',
				'transform' => 'spacingBox',
				'device'    => true,
				'whenAll'   => array(
					array(
						'attr'  => 'blockName',
						'op'    => 'in',
						'value' => array(
							'thumbnails-slider',
							'wp-carousel-pro/thumbnails-slider',
						),
					),
					array(
						'attr'  => 'thumbsArea.border.style',
						'op'    => 'neq',
						'value' => 'none',
					),
				),
			),
			array(
				'id'        => 'thumbs-area-radius',
				'attr'      => 'thumbsArea.borderRadius',
				'var'       => '--wpcp-thumbs-area-radius',
				'transform' => 'spacingBox',
				'device'    => true,
				'when'      => array(
					'attr'  => 'blockName',
					'op'    => 'in',
					'value' => array(
						'thumbnails-slider',
						'wp-carousel-pro/thumbnails-slider',
					),
				),
			),
			array(
				'id'        => 'thumbs-area-shadow',
				'attr'      => 'thumbsArea.boxShadow',
				'var'       => '--wpcp-thumbs-area-shadow',
				'transform' => 'shadow',
				'whenAll'   => array(
					array(
						'attr'  => 'blockName',
						'op'    => 'in',
						'value' => array(
							'thumbnails-slider',
							'wp-carousel-pro/thumbnails-slider',
						),
					),
					array(
						'attr' => 'thumbsArea.boxShadow.enable',
						'op'   => 'truthy',
					),
				),
			),
			array(
				'id'        => 'thumb-opacity',
				'attr'      => 'thumbnail.opacity',
				'var'       => '--wpcp-thumb-opacity',
				'transform' => 'raw',
				'default'   => 1,
				'when'      => array(
					'attr'  => 'blockName',
					'op'    => 'in',
					'value' => array(
						'thumbnails-slider',
						'wp-carousel-pro/thumbnails-slider',
					),
				),
			),
			array(
				'id'        => 'thumb-border-style',
				'attr'      => 'thumbnail.border.style',
				'var'       => '--wpcp-thumb-border-style',
				'transform' => 'raw',
				'default'   => 'none',
				'when'      => array(
					'attr'  => 'blockName',
					'op'    => 'in',
					'value' => array(
						'thumbnails-slider',
						'wp-carousel-pro/thumbnails-slider',
					),
				),
			),
			array(
				'id'        => 'thumb-border-color',
				'attr'      => 'thumbnail.border.color',
				'var'       => '--wpcp-thumb-border-color',
				'transform' => 'color',
				'whenAll'   => array(
					array(
						'attr'  => 'blockName',
						'op'    => 'in',
						'value' => array(
							'thumbnails-slider',
							'wp-carousel-pro/thumbnails-slider',
						),
					),
					array(
						'attr'  => 'thumbnail.border.style',
						'op'    => 'neq',
						'value' => 'none',
					),
				),
			),
			array(
				'id'        => 'thumb-border-width',
				'attr'      => 'thumbnail.borderWidth',
				'var'       => '--wpcp-thumb-border-width',
				'transform' => 'spacingBox',
				'device'    => true,
				'whenAll'   => array(
					array(
						'attr'  => 'blockName',
						'op'    => 'in',
						'value' => array(
							'thumbnails-slider',
							'wp-carousel-pro/thumbnails-slider',
						),
					),
					array(
						'attr'  => 'thumbnail.border.style',
						'op'    => 'neq',
						'value' => 'none',
					),
				),
			),
			array(
				'id'        => 'thumb-border-color-hover',
				'attr'      => 'thumbnail.border.hoverColor',
				'var'       => '--wpcp-thumb-border-color-hover',
				'transform' => 'color',
				'whenAll'   => array(
					array(
						'attr'  => 'blockName',
						'op'    => 'in',
						'value' => array(
							'thumbnails-slider',
							'wp-carousel-pro/thumbnails-slider',
						),
					),
					array(
						'attr'  => 'thumbnail.border.style',
						'op'    => 'neq',
						'value' => 'none',
					),
				),
			),
			array(
				'id'        => 'thumb-border-color-active',
				'attr'      => 'thumbnail.border.activeColor',
				'var'       => '--wpcp-thumb-border-color-active',
				'transform' => 'color',
				'whenAll'   => array(
					array(
						'attr'  => 'blockName',
						'op'    => 'in',
						'value' => array(
							'thumbnails-slider',
							'wp-carousel-pro/thumbnails-slider',
						),
					),
					array(
						'attr'  => 'thumbnail.border.style',
						'op'    => 'neq',
						'value' => 'none',
					),
				),
			),
			array(
				'id'        => 'pag-gap',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-gap',
				'transform' => 'paginationGap',
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
			),
			array(
				'id'        => 'pag-item-w-dots',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-item-w',
				'transform' => 'paginationDim',
				'dimField'  => 'width',
				'rangesKey' => 'item',
				'fallback'  => 12,
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'paginationDotsOptions.paginationStyle',
					'op'    => 'in',
					'value' => array( 'dots', 'dynamic' ),
				),
			),
			array(
				'id'        => 'pag-item-h-dots',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-item-h',
				'transform' => 'paginationDim',
				'dimField'  => 'height',
				'rangesKey' => 'item',
				'fallback'  => 12,
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'paginationDotsOptions.paginationStyle',
					'op'    => 'in',
					'value' => array( 'dots', 'dynamic' ),
				),
			),
			array(
				'id'        => 'pag-stepper-w',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-stepper-w',
				'transform' => 'paginationDim',
				'dimField'  => 'width',
				'rangesKey' => 'step',
				'fallback'  => 14,
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'paginationDotsOptions.paginationStyle',
					'op'    => 'eq',
					'value' => 'stepper',
				),
			),
			array(
				'id'        => 'pag-stepper-h',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-stepper-h',
				'transform' => 'paginationDim',
				'dimField'  => 'height',
				'rangesKey' => 'step',
				'fallback'  => 5,
				'device'    => true,
				'always'    => true,
				'wholeAttr' => true,
				'when'      => array(
					'attr'  => 'paginationDotsOptions.paginationStyle',
					'op'    => 'eq',
					'value' => 'stepper',
				),
			),
			array(
				'id'        => 'pag-color',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-color',
				'transform' => 'pagColor',
				'wholeAttr' => true,
			),
			array(
				'id'        => 'pag-text-color',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-text-color',
				'transform' => 'pagTextColor',
			),
			array(
				'id'        => 'pag-active-color',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-active-color',
				'transform' => 'pagActiveColor',
			),
			array(
				'id'        => 'pag-active-text-color',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-active-text-color',
				'transform' => 'pagActiveTextColor',
			),
			array(
				'id'        => 'pag-bg',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-bg',
				'transform' => 'pagBg',
			),
			array(
				'id'        => 'pag-active-bg',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-active-bg',
				'transform' => 'pagActiveBg',
			),
			array(
				'id'        => 'pag-border-style',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-border-style',
				'transform' => 'pagBorderStyle',
			),
			array(
				'id'        => 'pag-active-border-style',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-active-border-style',
				'transform' => 'pagActiveBorderStyle',
			),
			array(
				'id'        => 'pag-border-color',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-border-color',
				'transform' => 'pagBorderColor',
			),
			array(
				'id'        => 'pag-active-border-color',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-active-border-color',
				'transform' => 'pagActiveBorderColor',
			),
			array(
				'id'        => 'pag-border-width',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-border-width',
				'transform' => 'pagBorderWidth',
			),
			array(
				'id'        => 'pag-active-border-width',
				'attr'      => 'paginationDotsOptions',
				'var'       => '--wpcp-pag-active-border-width',
				'transform' => 'pagActiveBorderWidth',
			),
		);
	}
}
