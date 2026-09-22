<?php
/**
 * Strict-intersection base schema for modern carousel-style blocks.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

defined( 'ABSPATH' ) || exit;

/**
 * CarouselBaseSchema class.
 */
class CarouselBaseSchema implements AttributeSchema {

	/**
	 * Comprehensive carousel attribute defaults.
	 *
	 * Snapshot of legacy carousel's full attribute tree. Subclasses extend
	 * and declare deltas via `DeepMerge::recursive()`.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		return array(
			'uniqueId'              => array(
				'type'    => 'string',
				'default' => '',
			),
			'blockName'             => array(
				'type'    => 'string',
				'default' => 'carousel',
				'enum'    => AllowedValues::BLOCK_NAMES,
			),
			'align'                 => array(
				'type'    => 'string',
				// Empty = theme content width. Non-empty defaults break toolbar "None"
				// (clearing align falls back to the default on the frontend).
				'default' => '',
			),
			'sourceType'            => array(
				'type'    => 'string',
				'default' => 'image',
				'enum'    => AllowedValues::SOURCES,
			),
			'patternDemo'           => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'items'                 => array(
				'type'    => 'array',
				'default' => array(),
				'items'   => array( 'type' => 'object' ),
			),
			'layoutOptions'         => array(
				'type'    => 'object',
				'default' => array(
					'carouselStyle'       => 'standard',
					'displayStyle'        => 'horizontal',
					'columns'             => 3,
					'columnsTablet'       => 2,
					'columnsMobile'       => 1,
					'gap'                 => 20,
					'gapTablet'           => 20,
					'gapMobile'           => 10,
					'gapUnit'             => 'px',
					'gapTabletUnit'       => 'px',
					'gapMobileUnit'       => 'px',
					'alignItems'          => 'flex-start',
					'contentOrientation'  => 'image-top',
					'diagonalStyle'       => 'left',
					'randomOrder'         => false,
					'navigation'          => true,
					'pagination'          => false,
					'showThumbBackground' => false,
				),
			),
			'sliderOptions'         => array(
				'type'    => 'object',
				'default' => array(
					'autoplay'             => false,
					'autoplayDelay'        => 3000,
					'speed'                => 500,
					'pauseOnHover'         => true,
					'infiniteLoop'         => true,
					'slidesToScroll'       => 1,
					'slidesToScrollTablet' => 1,
					'slidesToScrollMobile' => 1,
					'direction'            => 'ltr',
					'adaptiveHeight'       => false,
					'keyboardNav'          => true,
					'mousewheel'           => false,
					'freeScroll'           => false,
					'effect'               => 'slide',
				),
			),
			'queryOptions'          => array(
				'type'    => 'object',
				// Filter by Taxonomy is Pro, so its slug/terms/operator keys are absent.
				'default' => array(
					'postTypes' => array( 'post' ),
					'filter'    => 'latest',
					'offset'    => 0,
					'limit'     => 10,
					'orderBy'   => 'date',
					'order'     => 'DESC',
				),
			),
			'imageOptions'          => array(
				'type'    => 'object',
				'default' => array(
					'resolution'                   => 'large',
					'aspectRatio'                  => '4:3',
					'lazyLoad'                     => true,
					'imageMaxWidth'                => array(
						'value' => 100,
						'unit'  => '%',
					),
					'customImageWidth'             => array(
						'device' => array( 'Desktop' => '' ),
						'unit'   => array( 'Desktop' => 'px' ),
					),
					'customImageHeight'            => array(
						'device' => array( 'Desktop' => '' ),
						'unit'   => array( 'Desktop' => 'px' ),
					),
					'variableWidthImageHeight'     => array(
						'device' => array( 'Desktop' => '' ),
						'unit'   => array( 'Desktop' => 'px' ),
					),
					'variableWidthImageHeightMode' => 'height',
					'filterNormal'                 => 'none',
					'filterHover'                  => 'none',
					'imageBorderNormal'            => array(
						'style' => 'none',
						'color' => '#cccccc',
					),
					'imageBorderWidthNormal'       => array(
						'unit'  => 'px',
						'value' => array(
							'top'    => 0,
							'right'  => 0,
							'bottom' => 0,
							'left'   => 0,
						),
					),
					'imageBorderHover'             => array(
						'style' => 'none',
						'color' => '#cccccc',
					),
					'overlay'                      => true,
					'overlayColor'                 => array(
						'style'    => 'solid',
						'solid'    => '#000000',
						'gradient' => '',
					),
					'opacity'                      => array(
						'value' => 0,
						'unit'  => '%',
					),
					'overlayColorHover'            => array(
						'style'    => 'solid',
						'solid'    => '#000000',
						'gradient' => '',
					),
					'opacityHover'                 => array(
						'value' => 60,
						'unit'  => '%',
					),
					'borderRadius'                 => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'padding'                      => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'innerPadding'                 => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'margin'                       => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
				),
			),
			'clickActionOptions'    => array(
				'type'    => 'object',
				'default' => array(
					'type' => 'lightbox',
				),
			),
			'lightboxOptions'       => array(
				'type'    => 'object',
				'default' => array(
					'showCaption'    => true,
					'showThumbnails' => false,
					'overlayColor'   => 'rgba(0,0,0,0.8)',
				),
			),
			'contentOptions'        => array(
				'type'    => 'object',
				'default' => array(
					'showTitle'             => true,
					'titleSource'           => 'image_caption',
					'titleTag'              => 'h4',
					'showDescription'       => true,
					'descriptionSource'     => 'image_description',
					'descriptionLength'     => 'full',
					'descriptionLengthUnit' => 'word',
					'descriptionWordLimit'  => 20,
					'showReadMore'          => false,
					'buttonType'            => 'button',
					'showIcon'              => false,
					'showIconHover'         => false,
					'iconSource'            => 'library',
					'chooseIcon'            => '',
					'currentIcon'           => array(),
					'chooseImg'             => array(),
					'iconSize'              => array(
						'device' => array( 'Desktop' => 16 ),
						'unit'   => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
					),
					'iconPosition'          => 'right',
					'iconGap'               => array(
						'device' => array( 'Desktop' => '' ),
						'unit'   => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
					),
					'alignment'             => 'left',
					'position'              => 'bottom',
					'contentPosition'       => '',
					'contentWidth'          => array(
						'device' => array( 'Desktop' => '' ),
						'unit'   => array( 'Desktop' => '%' ),
					),
					'contentHeight'         => array(
						'device' => array( 'Desktop' => '' ),
						'unit'   => array( 'Desktop' => 'px' ),
					),
					'displayOnHover'        => true,
					'titleTypography'       => array(),
					'titleColor'            => array(),
					'titleMargin'           => array(
						'allChange' => false,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 8,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'descTypography'        => array(),
					'descColor'             => '',
					'descMargin'            => array(
						'allChange' => false,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 8,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
				),
			),
			'contentAreaOptions'    => array(
				'type'    => 'object',
				'default' => array(
					'order'                  => array(),
					'zigZag'                 => false,
					// Card Element background defaults are shared across Image,
					// Post, and Product sources. Empty values intentionally render
					// no background rule; source-specific overrides must be added
					// explicitly, and saved user values still win after defaults merge.
					'contentAreaBackground'  => array(
						'color' => array(
							'style'      => 'bgColor',
							'solidColor' => '',
							'gradient'   => '',
						),
						'hover' => array(
							'style'      => 'bgColor',
							'solidColor' => '',
							'gradient'   => '',
						),
					),
					'boxShadowNormalEnable'  => false,
					'boxShadowHoverEnable'   => false,
					'boxShadowNormal'        => array(),
					'boxShadowHover'         => array(),
					'contentAreaStyle'       => array(
						'normal' => array(
							'border'      => array(
								'style' => 'none',
								'color' => '#cccccc',
							),
							'borderWidth' => array(
								'unit'  => 'px',
								'value' => array(
									'top'    => 0,
									'right'  => 0,
									'bottom' => 0,
									'left'   => 0,
								),
							),
						),
						'hover'  => array(
							'border'      => array(
								'style' => 'none',
								'color' => '#cccccc',
							),
							'borderWidth' => array(
								'unit'  => 'px',
								'value' => array(
									'top'    => 0,
									'right'  => 0,
									'bottom' => 0,
									'left'   => 0,
								),
							),
						),
					),
					'borderRadius'           => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'borderRadiusCustomized' => false,
					'padding'                => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'contentPadding'         => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => '',
								'right'  => '',
								'bottom' => '',
								'left'   => '',
							),
						),
					),
					'thumbOverlay'           => true,
					'thumbOverlayColor'      => '#112231',
					'thumbOverlayOpacity'    => 58,
					'cardPadding'            => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'elementVisibility'      => array(
						'excerpt'  => false,
						'readmore' => false,
					),
					'cardMargin'             => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
				),
			),
			'ratingOptions'         => array(
				'type'    => 'object',
				'default' => array(
					'enabled'        => true,
					'iconSource'     => 'library',
					'customIcon'     => '',
					'ratingIcon'     => 'star-set-1',
					'iconSize'       => array(),
					'iconGap'        => array(),
					'fillColor'      => '#FFD700',
					'fillHoverColor' => '',
					'emptyColor'     => '#E0E0E0',
				),
			),
			// Over The Thumb is Pro, so `taxonomyPosition` and `taxOffset` are absent.
			'taxonomyOptions'       => array(
				'type'    => 'object',
				'default' => array(
					'enabled'              => true,
					'type'                 => '',
					'position'             => 'beside-meta',
					'separator'            => 'comma',
					'taxGap'               => array(),
					'linkToArchive'        => true,
					'textColor'            => '',
					'textHoverColor'       => '',
					'backgroundColor'      => '',
					'backgroundHoverColor' => '',
				),
			),
			'postContentOptions'    => array(
				'type'    => 'object',
				'default' => array(
					'showTitle'            => true,
					'titleTag'             => 'h4',
					'titleLength'          => 'full',
					'titleWordLimit'       => 10,
					'showExcerpt'          => true,
					'excerptLength'        => 'full',
					'excerptLengthUnit'    => 'word',
					'excerptWordLimit'     => 20,
					'showReadMore'         => true,
					'buttonType'           => 'button',
					'showIcon'             => false,
					'showIconHover'        => false,
					'iconSource'           => 'library',
					'chooseIcon'           => '',
					'currentIcon'          => array(),
					'chooseImg'            => array(),
					'iconSize'             => array(
						'device' => array( 'Desktop' => 16 ),
						'unit'   => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
					),
					'iconPosition'         => 'right',
					'iconGap'              => array(
						'device' => array( 'Desktop' => '' ),
						'unit'   => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
					),
					'titleColor'           => '',
					'titleHoverColor'      => '',
					'excerptColor'         => '',
					'buttonColor'          => '',
					'buttonHoverColor'     => '',
					'buttonBg'             => '',
					'buttonHoverBg'        => '',
					'titleTypography'      => array(),
					'excerptTypography'    => array(),
					'buttonTypography'     => array(),
					'buttonBorder'         => array(
						'style'      => 'solid',
						'color'      => '',
						'hoverColor' => '',
					),
					'btnBorderWidth'       => array(
						'device'    => array(
							'Desktop' => array(
								'top'    => 1,
								'right'  => 1,
								'bottom' => 1,
								'left'   => 1,
							),
						),
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'allChange' => true,
					),
					'btnBoxShadowEnable'   => false,
					'btnBoxShadow'         => array(),
					'btnShadowHoverEnable' => false,
					'btnShadowHover'       => array(),
					'btnMargin'            => array(
						'allChange' => false,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 8,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
				),
			),
			'productContentOptions' => array(
				'type'    => 'object',
				'default' => array(
					'showTitle'          => true,
					'titleTag'           => 'h4',
					'titleLength'        => 'full',
					'titleWordLimit'     => 10,
					'showPrice'          => true,
					'showDescription'    => true,
					'excerptLimit'       => 'full',
					'excerptLengthUnit'  => 'word',
					'excerptWordLimit'   => 15,
					'showAddToCart'      => true,
					'showCartIcon'       => false,
					'titleColor'         => '',
					'titleHoverColor'    => '',
					'priceColor'         => '',
					'salePriceColor'     => '',
					'priceMargin'        => array(
						'allChange' => false,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 8,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'descColor'          => '',
					'buttonColor'        => '',
					'buttonHoverColor'   => '',
					'buttonBg'           => '',
					'buttonHoverBg'      => '',
					'buttonBorderRadius' => 4,
				),
			),
			'metaOptions'           => array(
				'type'    => 'object',
				'default' => array(
					'enabled'   => true,
					'showMeta'  => array( 'date', 'author', 'category' ),
					'position'  => 'below-title',
					'separator' => 'bullet',
				),
			),
			'socialShareOptions'    => array(
				'type'    => 'object',
				'default' => array(
					'enabled'        => false,
					'networks'       => array( 'facebook-f', 'x', 'linkedin-in' ),
					'iconView'       => 'stacked',
					'iconSize'       => array(
						'device' => array(
							'Desktop' => 20,
							'Tablet'  => 18,
							'Mobile'  => 16,
						),
						'unit'   => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
					),
					'iconAreaSize'   => array(
						'device' => array(
							'Desktop' => 40,
							'Tablet'  => 36,
							'Mobile'  => 32,
						),
						'unit'   => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
					),
					'gap'            => array(
						'device' => array(
							'Desktop' => 10,
							'Tablet'  => 8,
							'Mobile'  => 6,
						),
						'unit'   => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
					),
					'customStyling'  => false,
					'iconColor'      => '',
					'iconBg'         => '',
					'iconHoverColor' => '',
					'iconHoverBg'    => '',
					'borderRadius'   => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'margin'         => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
				),
			),
			'effectsOptions'        => array(
				'type'    => 'object',
				// Scale and Animation Duration are Pro on every axis, so no
				// duration or scale key ships here.
				'default' => array(
					'effectType'       => 'premade',
					'animationEffect'  => 'none',
					'imageHover'       => 'zoom',
					'overlayEffect'    => 'none',
					'contentAnimation' => 'zoomIn',
				),
			),
			'advancedOptions'       => array(
				'type'    => 'object',
				'default' => array(
					'cssClass'          => '',
					'cssId'             => '',
					'customCss'         => '',
					'visibilityDesktop' => true,
					'visibilityTablet'  => true,
					'visibilityMobile'  => true,
					// General tab: block-root background + responsive spacing.
					'background'        => array(
						'style'    => 'transparent',
						'solid'    => '',
						'gradient' => '',
					),
					'padding'           => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
					'margin'            => array(
						'allChange' => true,
						'unit'      => array(
							'Desktop' => 'px',
							'Tablet'  => 'px',
							'Mobile'  => 'px',
						),
						'device'    => array(
							'Desktop' => array(
								'top'    => 0,
								'right'  => 0,
								'bottom' => 0,
								'left'   => 0,
							),
						),
					),
				),
			),
		);
	}
}
