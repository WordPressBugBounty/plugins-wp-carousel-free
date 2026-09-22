<?php
/**
 * Divi 5 saved-template module, server side.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Divi5;

use ET\Builder\Framework\DependencyManagement\Interfaces\DependencyInterface;
use ET\Builder\Packages\Module\Layout\Components\ModuleElements\ModuleElements;
use ET\Builder\Packages\Module\Module;
use ET\Builder\Packages\ModuleLibrary\ModuleRegistration;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Templates;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the module against Divi 5's dependency tree and renders it.
 */
class D5_Carousel_Module implements DependencyInterface {

	/**
	 * Singleton instance.
	 *
	 * @var D5_Carousel_Module|null
	 */
	private static $instance = null;

	/**
	 * Singleton accessor.
	 *
	 * @return D5_Carousel_Module
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Register the module. Called by Divi 5's dependency tree.
	 */
	public function load() {
		// The built module directory, not the JS source: `blocks/` is excluded
		// from the release zip, so the shipped module.json rides beside the bundle.
		ModuleRegistration::register_module(
			WPCAROUSELF_PATH . 'assets/wpcp-divi5-carousel',
			array( 'render_callback' => array( __CLASS__, 'render_callback' ) )
		);
	}

	/**
	 * Render the module.
	 *
	 * @param array          $attrs    Module attributes.
	 * @param string         $content  Module content.
	 * @param \WP_Block      $block    Block object.
	 * @param ModuleElements $elements ModuleElements instance.
	 * @return string
	 */
	public static function render_callback( $attrs, $content, $block, $elements ) {
		$template_id = isset( $attrs['templateId']['innerContent']['desktop']['value'] )
			? absint( $attrs['templateId']['innerContent']['desktop']['value'] )
			: 0;

		$is_editor = self::is_builder_editor();
		$markup    = Builder_Templates::render( $template_id, $is_editor );

		$inner = sprintf(
			'<div class="et_pb_module_inner %1$s" data-builder-template-id="%2$s">%3$s</div>',
			esc_attr( Divi5_Builder::WRAPPER_CLASS ),
			esc_attr( $template_id ),
			$markup
		);

		return Module::render(
			array(
				'orderIndex'         => $block->parsed_block['orderIndex'] ?? 0,
				'storeInstance'      => $block->parsed_block['storeInstance'] ?? '',
				'attrs'              => $attrs,
				'elements'           => $elements,
				'id'                 => $block->parsed_block['id'] ?? '',
				'moduleClassName'    => 'wpcp_divi5_carousel',
				'name'               => $block->block_type->name ?? 'wpcp/divi5-carousel',
				'classnamesFunction' => array( __CLASS__, 'module_classnames' ),
				'moduleCategory'     => $block->block_type->category ?? 'module',
				'children'           => $inner,
			)
		);
	}

	/**
	 * Add the module's own class to the wrapper.
	 *
	 * @param array $args Callback arguments.
	 */
	public static function module_classnames( $args ) {
		$instance = $args['classnamesInstance'] ?? null;

		if ( $instance && method_exists( $instance, 'add' ) ) {
			$instance->add( 'wpcp_divi5_carousel' );
		}
	}

	/**
	 * Whether Divi 5's builder is running.
	 *
	 * @return bool
	 */
	private static function is_builder_editor() {
		if ( isset( $_GET['et_fb'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the request context, not acting on it.
			return true;
		}

		if ( function_exists( 'et_core_is_fb_enabled' ) && et_core_is_fb_enabled() ) {
			return true;
		}

		return wp_doing_ajax()
			&& isset( $_REQUEST['action'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the request context, not acting on it.
			&& 0 === strpos( sanitize_key( wp_unslash( $_REQUEST['action'] ) ), 'et_' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the request context, not acting on it.
	}
}

D5_Carousel_Module::get_instance()->load();
