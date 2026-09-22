<?php
/**
 * Schema for the wp-carousel-pro/slider block.
 *
 * Per `BLOCK_ALLOWED_SOURCES['slider']` (image, video, post, product), this
 * subclass adds the full `videoOptions` branch back onto the intersection
 * base, plus its layout/social-share deltas.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\DeepMerge;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\PaginationNavigationDefaults;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\Util\VideoOptionsDefaults;

defined( 'ABSPATH' ) || exit;

/**
 * SliderSchema class.
 */
class SliderSchema extends CarouselBaseSchema {

	/**
	 * Slider attribute schema.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function get_attributes(): array {
		return DeepMerge::recursive(
			parent::get_attributes(),
			array(
				'blockName'             => array( 'default' => 'slider' ),
				// The slider defaults to the 'overlay' orientation (hover-capable), and
				// the "Display Content on Hover Only" toggle is intentionally hidden for
				// this block — so its content must stay always-visible rather than
				// inheriting the base hover-only default.
				'contentOptions'        => array(
					'default' => array(
						'displayOnHover' => false,
					),
				),
				'layoutOptions'         => array(
					'default' => array(
						'sliderLayout'       => 'slide',
						'contentOrientation' => 'overlay',
						'pagination'         => false,
						'sliderHeight'       => array(
							'device' => array(
								'Desktop' => 600,
								'Tablet'  => 450,
								'Mobile'  => 300,
							),
							'unit'   => array(
								'Desktop' => 'px',
								'Tablet'  => 'px',
								'Mobile'  => 'px',
							),
						),
					),
				),
				'socialShareOptions'    => array(
					'default' => array( 'enabled' => true ),
				),
				'paginationDotsOptions' => PaginationNavigationDefaults::pagination_dots(),
				'navigationOptions'     => PaginationNavigationDefaults::navigation(),
				'videoOptions'          => VideoOptionsDefaults::get(),
				// Only the keys where the slider diverges from the base
				// imageOptions default; DeepMerge fills the identical rest.
				'imageOptions'          => array(
					'type'    => 'object',
					'default' => array(
						'aspectRatio'  => 'original',
						'overlay'      => false,
						'overlayColor' => array(
							'style'    => 'solid',
							'solid'    => 'rgba(0,0,0,0.3)',
							'gradient' => '',
						),
						'opacity'      => array(
							'value' => 50,
							'unit'  => '%',
						),
					),
				),
			)
		);
	}
}
