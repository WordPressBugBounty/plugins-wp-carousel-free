<?php
/**
 * Shared default trees for paginationDotsOptions and navigationOptions.
 *
 * These attribute objects live on each carousel-style block (carousel, slider,
 * thumbnails-slider, tiles). The defaults are identical across those schemas, so
 * they are sourced from here and applied via DeepMerge::recursive in each
 * schema's get_attributes().
 *
 * Border normal/hover rule:
 *   - borderWidth is shared across normal+hover (no borderWidthHover key).
 *   - border.style is shared across normal+hover (borderHover keeps only color).
 *   - Per-element Advanced keys (hideOnDesktop/Tablet/Mobile, cssClass, cssId)
 *     are intentionally omitted — block-wide equivalents live on AdvancedPanel.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema\Util;

defined( 'ABSPATH' ) || exit;

/**
 * PaginationNavigationDefaults helper.
 */
class PaginationNavigationDefaults {

	/**
	 * Default tree for the paginationDotsOptions attribute (slide-bullet pagination).
	 *
	 * @return array<string,mixed>
	 */
	public static function pagination_dots(): array {
		return array(
			'type'    => 'object',
			'default' => array(
				'paginationStyle'   => 'dots',
				'dims'              => array(),
				'gap'               => array(
					'device' => array(
						'Desktop' => 8,
						'Tablet'  => 8,
						'Mobile'  => 8,
					),
					'unit'   => array(
						'Desktop' => 'px',
						'Tablet'  => 'px',
						'Mobile'  => 'px',
					),
				),
				'alignment'         => 'center',
				'verticalPos'       => 'bottom',
				'verticalPosition'  => array(
					'allChange' => true,
					'unit'      => array(
						'Desktop' => 'px',
						'Tablet'  => 'px',
						'Mobile'  => 'px',
					),
					'device'    => array(
						'Desktop' => array(
							'top'    => 30,
							'right'  => 0,
							'bottom' => 0,
							'left'   => 0,
						),
						'Tablet'  => array(
							'top'    => 30,
							'right'  => 0,
							'bottom' => 0,
							'left'   => 0,
						),
						'Mobile'  => array(
							'top'    => 30,
							'right'  => 0,
							'bottom' => 0,
							'left'   => 0,
						),
					),
				),
				'colorNormal'       => '',
				'colorHover'        => '',
				'bgNormal'          => '',
				'bgHover'           => '',
				'borderNormal'      => array(
					'style' => 'none',
					'color' => '#cccccc',
				),
				'borderHover'       => array(
					'color' => '#cccccc',
				),
				'borderWidthNormal' => array(
					'unit'  => 'px',
					'value' => array(
						'top'    => 1,
						'right'  => 1,
						'bottom' => 1,
						'left'   => 1,
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
						'Tablet'  => array(
							'top'    => 0,
							'right'  => 0,
							'bottom' => 0,
							'left'   => 0,
						),
						'Mobile'  => array(
							'top'    => 0,
							'right'  => 0,
							'bottom' => 0,
							'left'   => 0,
						),
					),
				),
			),
		);
	}

	/**
	 * Default tree for the navigationOptions attribute (prev/next arrows).
	 *
	 * @return array<string,mixed>
	 */
	public static function navigation(): array {
		return array(
			'type'    => 'object',
			'default' => array(
				'arrowStyle'        => 'chevron-solid',
				'arrowSize'         => array(
					'device' => array(
						'Desktop' => 16,
						'Tablet'  => 16,
						'Mobile'  => 14,
					),
					'unit'   => array(
						'Desktop' => 'px',
						'Tablet'  => 'px',
						'Mobile'  => 'px',
					),
				),
				'position'          => 'nav-vertical-center',
				'offsetX'           => array(
					'value' => 0,
					'unit'  => 'px',
				),
				'offsetY'           => array(
					'value' => 0,
					'unit'  => 'px',
				),
				'gapBetweenArrows'  => 10,
				'colorNormal'       => '',
				'colorHover'        => '',
				'bgNormal'          => '',
				'bgHover'           => '',
				'borderNormal'      => array(
					'style' => 'solid',
					'color' => '#cccccc',
				),
				'borderHover'       => array(
					'color' => '',
				),
				'borderWidthNormal' => array(
					'unit'  => 'px',
					'value' => array(
						'top'    => 1,
						'right'  => 1,
						'bottom' => 1,
						'left'   => 1,
					),
				),
				// Box-shadow is fully independent per state (each carries its own
				// isActive toggle); shape matches the BoxShadow control + the
				// getBoxShadowValue / get_box_shadow_value CSS helpers.
				'boxShadowNormal'   => array(
					'isActive'      => false,
					'selectDefault' => 'var(--wpcp-shadow-medium-4dp)',
					'color'         => 'rgba(0, 0, 0, 0.16)',
					'unit'          => 'outset',
					'value'         => array(
						'top'    => 0,
						'right'  => 4,
						'bottom' => 6,
						'left'   => 0,
					),
				),
				'boxShadowHover'    => array(
					'isActive'      => false,
					'selectDefault' => 'var(--wpcp-shadow-medium-4dp)',
					'color'         => 'rgba(0, 0, 0, 0.16)',
					'unit'          => 'outset',
					'value'         => array(
						'top'    => 0,
						'right'  => 4,
						'bottom' => 6,
						'left'   => 0,
					),
				),
				'borderRadius'      => array(
					'allChange' => true,
					'unit'      => array(
						'Desktop' => '%',
						'Tablet'  => '%',
						'Mobile'  => '%',
					),
					'device'    => array(
						'Desktop' => array(
							'top'    => 50,
							'right'  => 50,
							'bottom' => 50,
							'left'   => 50,
						),
						'Tablet'  => array(
							'top'    => 50,
							'right'  => 50,
							'bottom' => 50,
							'left'   => 50,
						),
						'Mobile'  => array(
							'top'    => 50,
							'right'  => 50,
							'bottom' => 50,
							'left'   => 50,
						),
					),
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
							'top'    => 12,
							'right'  => 12,
							'bottom' => 12,
							'left'   => 12,
						),
						'Tablet'  => array(
							'top'    => 12,
							'right'  => 12,
							'bottom' => 12,
							'left'   => 12,
						),
						'Mobile'  => array(
							'top'    => 12,
							'right'  => 12,
							'bottom' => 12,
							'left'   => 12,
						),
					),
				),
			),
		);
	}
}
