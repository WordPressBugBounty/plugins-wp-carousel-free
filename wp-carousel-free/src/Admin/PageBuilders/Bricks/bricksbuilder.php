<?php
/**
 * Bricks Builder saved-template element.
 *
 * Registered through `\Bricks\Elements::register_element()`, which requires the
 * file directly, so the class is global. Its name matches Pro's so a layout
 * built in Free keeps rendering after the upgrade.
 *
 * @package WP_Carousel_Free
 */

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Assets;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Templates;

defined( 'ABSPATH' ) || exit;

// The class name is fixed by the builder's API and kept identical to Pro's so a
// saved layout survives the upgrade, so it cannot carry the plugin prefix.
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedClassFound

/**
 * Picks a saved template and replays it.
 */
class SP_WPCP_Bricks_Carousel_Element extends \Bricks\Element {

	/**
	 * Wrapper class the editor re-init observer watches for.
	 */
	const WRAPPER_CLASS = 'wpcp-bricks-carousel-wrapper';

	/**
	 * Builder panel category.
	 *
	 * @var string
	 */
	public $category = 'basic';

	/**
	 * Element name.
	 *
	 * @var string
	 */
	public $name = 'wpcp-bricks-carousel';

	/**
	 * Element icon.
	 *
	 * @var string
	 */
	public $icon = 'ti-layout-slider';

	/**
	 * Styling target.
	 *
	 * @var string
	 */
	public $css_selector = '.wpcp-bricks-carousel-wrapper';

	/**
	 * Element label.
	 *
	 * @return string
	 */
	public function get_label() {
		return esc_html__( 'WP Carousel', 'wp-carousel-free' );
	}

	/**
	 * Element controls.
	 */
	public function set_controls() {
		$this->controls['template_id'] = array(
			'type'      => 'select',
			'label'     => esc_html__( 'Saved Template', 'wp-carousel-free' ),
			'options'   => Builder_Templates::get_list(),
			'clearable' => false,
			'default'   => '0',
			'inline'    => true,
		);
	}

	/**
	 * Enqueue the block runtime and re-init observer inside the Bricks editor.
	 */
	public function enqueue_scripts() {
		if ( ! $this->is_builder_editor() ) {
			return;
		}

		Builder_Assets::enqueue_block_runtime( true );
		Builder_Assets::add_reinit_script(
			self::WRAPPER_CLASS,
			array(
				'bricksElementsReady',
				'bricks/setup_frontend',
				'bricks/pages/render',
				'bricks/element/after_render',
				'bricksAjaxRender',
			)
		);
	}

	/**
	 * Whether the Bricks builder is running.
	 *
	 * @return bool
	 */
	private function is_builder_editor() {
		if ( isset( $_GET['bricks'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the request context, not acting on it.
			return true;
		}

		if ( function_exists( 'bricks_is_builder_main' ) && bricks_is_builder_main() ) {
			return true;
		}

		return function_exists( 'bricks_is_builder_call' ) && bricks_is_builder_call();
	}

	/**
	 * Render the element.
	 */
	public function render() {
		$template_id = isset( $this->settings['template_id'] ) ? absint( $this->settings['template_id'] ) : 0;
		$markup      = Builder_Templates::render( $template_id, $this->is_builder_editor() );

		echo '<div ' . $this->render_attributes( '_root' ) . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside render_attributes().
		printf(
			'<div class="%1$s" data-builder-template-id="%2$s">',
			esc_attr( self::WRAPPER_CLASS ),
			esc_attr( $template_id )
		);
		echo $markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Rendered block markup.
		echo '</div></div>';
	}
}
