<?php
/**
 * Schema for the wp-carousel-pro/thumbnails-slider block.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\DeepMerge;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\PaginationNavigationDefaults;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\VideoOptionsDefaults;

defined( 'ABSPATH' ) || exit;

/**
 * ThumbnailsSliderSchema class.
 */
class ThumbnailsSliderSchema extends CarouselBaseSchema {

	/**
	 * Thumbnails Slider attribute schema.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		$image_filter_default = array(
			'blur'       => 0,
			'brightness' => 1,
			'contrast'   => 1,
			'saturation' => 0,
			'hue'        => 1,
		);

		return DeepMerge::recursive(
			parent::get_attributes(),
			array(
				'blockName'             => array( 'default' => 'thumbnails-slider' ),
				// One slide is visible at a time, so the "Display Content on Hover
				// Only" toggle is hidden for this block — the caption must stay
				// always-visible rather than inheriting the base hover-only default.
				'contentOptions'        => array(
					'default' => array(
						'displayOnHover' => false,
					),
				),
				'layoutOptions'         => array(
					'default' => array(
						'carouselStyle'       => 'thumbnails',
						'contentOrientation'  => 'overlay',
						'thumbsLayout'        => 'strip',
						'thumbsPerView'       => 5,
						'thumbsPerViewTablet' => 4,
						'thumbsPerViewMobile' => 3,
						'pagination'          => false,
						'columns'             => 1,
						'navigation'          => false,
					),
				),
				'socialShareOptions'    => array(
					'default' => array( 'enabled' => true ),
				),
				// White caption text sits directly on the stage image here (no card
				// background), so a fully transparent Normal overlay leaves it with no
				// guaranteed contrast. Darken slightly by default; Hover stays at the
				// shared 60% default.
				'imageOptions'          => array(
					'default' => array(
						'opacity' => array(
							'value' => 20,
							'unit'  => '%',
						),
					),
				),
				'paginationDotsOptions' => PaginationNavigationDefaults::pagination_dots(),
				// The main stage shows a single slide, so the arrows default to
				// "Sides Inner" — inside the stage edges — instead of the shared
				// "Sides Center" straddle.
				'navigationOptions'     => DeepMerge::recursive(
					PaginationNavigationDefaults::navigation(),
					array(
						'default' => array(
							'position' => 'nav-vertical-center-inner',
						),
					)
				),
				'videoOptions'          => VideoOptionsDefaults::get(),
				'thumbsArea'            => array(
					'type'    => 'object',
					'default' => array(
						'position'     => 'bottom',
						'gap'          => array(
							'device' => array(
								'Desktop' => 24,
								'Tablet'  => 20,
								'Mobile'  => 16,
							),
							'unit'   => array(
								'Desktop' => 'px',
								'Tablet'  => 'px',
								'Mobile'  => 'px',
							),
						),
						'background'   => array(),
						'padding'      => array(),
						'margin'       => array(),
						'border'       => array(
							'style' => 'none',
							'color' => '',
						),
						'borderWidth'  => array(
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
						'borderRadius' => array(),
						'boxShadow'    => array(),
					),
				),
				'thumbnail'             => array(
					'type'    => 'object',
					'default' => array(
						'showImage'              => true,
						'imageSize'              => 'thumbnail',
						'dimensions'             => array(
							'unit'   => array(
								'Desktop' => array(
									'width'  => 'px',
									'height' => 'px',
								),
								'Tablet'  => array(
									'width'  => 'px',
									'height' => 'px',
								),
								'Mobile'  => array(
									'width'  => 'px',
									'height' => 'px',
								),
							),
							'device' => array(
								'Desktop' => array(
									'width'  => 'auto',
									'height' => 'auto',
								),
							),
						),
						'opacity'                => 1,
						'activeStyle'            => 'none',

						// Image filter for the inactive thumbs.
						'imageFilter'            => array( 'normal' => $image_filter_default ),
						'activeThumbBorder'      => array(
							'style' => 'solid',
							'color' => 'var(--wpcp-carousel-primary-2-800, #19949e)',
						),
						'activeThumbBorderWidth' => array(
							'allChange' => true,
							'unit'      => array(
								'Desktop' => 'px',
								'Tablet'  => 'px',
								'Mobile'  => 'px',
							),
							'device'    => array(
								'Desktop' => array(
									'top'    => 2,
									'right'  => 2,
									'bottom' => 2,
									'left'   => 2,
								),
							),
						),

						/*
						* Per-state border — style + width shared across states
						* per the Border Normal/Hover rule; color differs per
						* state via {color, hoverColor, activeColor}.
						*/
						'border'                 => array(
							'style' => 'none',
							'color' => '',
						),
						'borderWidth'            => array(
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
						'borderRadius'           => array(
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

					),
				),
			),
		);
	}
}
