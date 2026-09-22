<?php
/**
 * Schema for the wp-carousel-pro/tiles block.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\DeepMerge;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\VideoOptionsDefaults;

defined( 'ABSPATH' ) || exit;

/**
 * TilesSchema class.
 */
class TilesSchema extends CarouselBaseSchema {

	/**
	 * Tiles attribute schema.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		$attributes = DeepMerge::recursive(
			parent::get_attributes(),
			array(
				'blockName'          => array( 'default' => 'tiles' ),
				'layoutOptions'      => array(
					'default' => array(
						'carouselStyle'           => 'grid',
						'navigation'              => false,
						'tileLayout'              => 'one',
						'gapHorizontal'           => 20,
						'gapHorizontalTablet'     => 20,
						'gapHorizontalMobile'     => 20,
						'gapVertical'             => 20,
						'gapVerticalTablet'       => 20,
						'gapVerticalMobile'       => 20,
						'gapHorizontalUnit'       => 'px',
						'gapHorizontalTabletUnit' => 'px',
						'gapHorizontalMobileUnit' => 'px',
						'gapVerticalUnit'         => 'px',
						'gapVerticalTabletUnit'   => 'px',
						'gapVerticalMobileUnit'   => 'px',
						'tileRowHeight'           => 220,
						'tileRowHeightTablet'     => 220,
						'tileRowHeightMobile'     => 220,
						'tileRowHeightUnit'       => 'px',
						'tileRowHeightTabletUnit' => 'px',
						'tileRowHeightMobileUnit' => 'px',
					),
				),
				'socialShareOptions' => array(
					'default' => array( 'enabled' => true ),
				),
				'videoOptions'       => VideoOptionsDefaults::get(),
				'paginationOptions'  => array(
					'type'    => 'object',
					'default' => array(
						'imageItemsPerPage'    => 10,
						'type'                 => 'number',
						'numberDisplayStyle'   => 'number',
						'showEllipsis'         => true,
						'justifyContent'       => 'center',
						'justifyContentTablet' => 'flex-start',
						'justifyContentMobile' => 'flex-start',
						'gap'                  => array(
							'device' => array(
								'Desktop' => 10,
								'Tablet'  => 10,
								'Mobile'  => 10,
							),
							'unit'   => array(
								'Desktop' => 'px',
								'Tablet'  => 'px',
								'Mobile'  => 'px',
							),
						),
						'scrollToTop'          => false,
						'scrollOffset'         => 0,
						'scrollOffsetUnit'     => 'px',
						'typography'           => array(),
						'color'                => '#2C2D2F',
						'colorHover'           => '#FFFFFF',
						'backgroundType'       => 'color',
						'backgroundColor'      => '#FFFFFF',
						'backgroundColorHover' => '#19949E',
						'borderStyle'          => 'solid',
						'borderWidth'          => array(
							'allChange' => true,
							'unit'      => 'px',
							'value'     => array(
								'top'    => 1,
								'right'  => 1,
								'bottom' => 1,
								'left'   => 1,
							),
						),
						'borderColor'          => '#DDDDDD',
						'borderColorHover'     => '#19949E',
						'borderRadius'         => array(
							'allChange' => true,
							'unit'      => array(
								'Desktop' => 'px',
								'Tablet'  => 'px',
								'Mobile'  => 'px',
							),
							'device'    => array(
								'Desktop' => array(
									'top'    => 3,
									'right'  => 3,
									'bottom' => 3,
									'left'   => 3,
								),
							),
						),
						'boxShadow'            => array(),
						'boxShadowHover'       => array(),
						'padding'              => array(
							'allChange' => true,
							'unit'      => array(
								'Desktop' => 'px',
								'Tablet'  => 'px',
								'Mobile'  => 'px',
							),
							'device'    => array(
								'Desktop' => array(
									'top'    => 15,
									'right'  => 0,
									'bottom' => 15,
									'left'   => 0,
								),
							),
						),
						'margin'               => array(
							'allChange' => true,
							'unit'      => array(
								'Desktop' => 'px',
								'Tablet'  => 'px',
								'Mobile'  => 'px',
							),
							'device'    => array(
								'Desktop' => array(
									'top'    => 48,
									'right'  => 0,
									'bottom' => 0,
									'left'   => 0,
								),
							),
						),
					),
				),
			)
		);

		// `DeepMerge` has no deletion primitive, so remove the inherited
		// single-axis gap keys here. Tiles stores split-axis gaps only.
		unset(
			$attributes['layoutOptions']['default']['gap'],
			$attributes['layoutOptions']['default']['gapTablet'],
			$attributes['layoutOptions']['default']['gapMobile'],
			$attributes['layoutOptions']['default']['gapUnit'],
			$attributes['layoutOptions']['default']['gapTabletUnit'],
			$attributes['layoutOptions']['default']['gapMobileUnit']
		);

		return $attributes;
	}
}
