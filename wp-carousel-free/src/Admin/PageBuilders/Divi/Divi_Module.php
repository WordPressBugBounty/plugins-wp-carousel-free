<?php
/**
 * Divi 4 saved-template module.
 *
 * Loaded only from within `register_module()`, once Divi's module base class
 * exists. The class name is global and matches Pro's so a layout built in Free
 * keeps rendering after the upgrade.
 *
 * @package WP_Carousel_Free
 */

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Templates;

use function ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Divi\render_module;

defined( 'ABSPATH' ) || exit;

// The class name is fixed by the builder's API and kept identical to Pro's so a
// saved layout survives the upgrade, so it cannot carry the plugin prefix.
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedClassFound

/**
 * Picks a saved template and replays it.
 */
class ET_Builder_Module_Wp_Carousel_Pro extends ET_Builder_Module {

	/**
	 * Module slug.
	 *
	 * @var string
	 */
	public $slug = 'et_pb_wp_carousel_pro';

	/**
	 * Visual Builder support level.
	 *
	 * @var string
	 */
	public $vb_support = 'partial';

	/**
	 * Icon file Divi reads for the Add Module list.
	 *
	 * Declared here because Divi's base class does not, and an undeclared
	 * property is a deprecation on PHP 8.2.
	 *
	 * @var string
	 */
	public $icon_path;

	/**
	 * Module credits.
	 *
	 * @var array
	 */
	protected $module_credits = array(
		'module_uri' => 'https://wpcarousel.io',
		'author'     => 'ShapedPlugin',
	);

	/**
	 * Name the module and give it the plugin's mark in the Add Module list.
	 *
	 * Divi reads the file itself and sizes it from its own CSS, so the shipped
	 * SVG carries a `viewBox` and no `width`/`height` — with them the glyph keeps
	 * its intrinsic height and renders far outside the icon slot.
	 */
	public function init() {
		$this->name      = esc_html__( 'WP Carousel', 'wp-carousel-free' );
		$this->icon_path = __DIR__ . '/icon.svg';
	}

	/**
	 * Module fields.
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'template_id' => array(
				'label'           => esc_html__( 'Saved Template', 'wp-carousel-free' ),
				'type'            => 'select',
				'option_category' => 'basic_option',
				'options'         => Builder_Templates::get_list( 'none' ),
				'default'         => 'none',
				'description'     => esc_html__( 'Select a saved carousel template.', 'wp-carousel-free' ),
				'toggle_slug'     => 'main_content',
			),
		);
	}

	/**
	 * Render the module.
	 *
	 * @param array  $attrs       Module attributes.
	 * @param string $content     Module content.
	 * @param string $render_slug Module render slug.
	 * @return string
	 */
	public function render( $attrs, $content = null, $render_slug = '' ) {
		$template_id = isset( $attrs['template_id'] ) ? $attrs['template_id'] : '';

		if ( empty( $template_id ) && isset( $this->props['template_id'] ) ) {
			$template_id = $this->props['template_id'];
		}

		if ( 'none' === $template_id ) {
			$template_id = 0;
		}

		return render_module( $template_id );
	}
}
