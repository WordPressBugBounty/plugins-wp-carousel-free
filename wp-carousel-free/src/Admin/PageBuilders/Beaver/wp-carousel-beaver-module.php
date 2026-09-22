<?php
/**
 * Beaver Builder saved-template module.
 *
 * Beaver requires this file directly and expects a global `FLBuilderModule`
 * subclass, so the class is global. Its name matches Pro's so a layout built in
 * Free keeps rendering after the upgrade.
 *
 * @package WP_Carousel_Free
 */

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Assets;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Templates;

defined( 'ABSPATH' ) || exit;

// The class name is fixed by the builder's API and kept identical to Pro's so a
// saved layout survives the upgrade, so it cannot carry the plugin prefix.
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedClassFound

// Beaver requires this one file and expects both the module class and its
// registration call in it.
// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed

/**
 * Picks a saved template and replays it.
 */
class SP_WPCP_Beaver_Carousel_Module extends FLBuilderModule {

	/**
	 * Wrapper class the editor re-init observer watches for.
	 */
	const WRAPPER_CLASS = 'wpcp-beaver-carousel-wrapper';

	/**
	 * Describe the module to Beaver.
	 */
	public function __construct() {
		parent::__construct(
			array(
				'name'            => __( 'WP Carousel', 'wp-carousel-free' ),
				'description'     => __( 'Display a WP Carousel saved template.', 'wp-carousel-free' ),
				'category'        => __( 'SP Plugins', 'wp-carousel-free' ),
				'dir'             => plugin_dir_path( __FILE__ ),
				'url'             => plugin_dir_url( __FILE__ ),
				'icon'            => 'slides.svg',
				'editor_export'   => true,
				'enabled'         => true,
				'partial_refresh' => true,
			)
		);
	}

	/**
	 * Enqueue the block runtime, in the builder and on the published page.
	 *
	 * Beaver calls this itself: for every registered module while the builder UI
	 * loads, and only for the modules a layout actually holds when that layout
	 * renders on the front end. Both of its call sites run on
	 * `wp_enqueue_scripts` at priority 10 or 11, so the runtime is enqueued in
	 * time for the lightbox config `Lightbox_Frontend` localizes at 100 — which
	 * the module's own render, happening inside `the_content`, is far too late
	 * for.
	 */
	public function enqueue_scripts() {
		if ( class_exists( 'FLBuilderModel' ) && FLBuilderModel::is_builder_active() ) {
			// The builder can swap in any saved template without a page load, so
			// the editor needs every style chunk and a re-init on each re-render.
			Builder_Assets::enqueue_block_runtime( true );
			Builder_Assets::add_reinit_script(
				self::WRAPPER_CLASS,
				array( 'fl-builder-preview-render', 'fl-builder-layout-rendered' ),
				300
			);

			return;
		}

		Builder_Assets::enqueue_block_runtime();
	}
}

/**
 * Register the module and its settings form.
 *
 * Registration must happen inside a function so FLBuilder is guaranteed to be
 * loaded, and the template list is only queried at that point.
 */
function wpcpf_beaver_register_module() {
	if ( ! class_exists( 'FLBuilder' ) ) {
		return;
	}

	FLBuilder::register_module(
		'SP_WPCP_Beaver_Carousel_Module',
		array(
			'general' => array(
				'title'    => __( 'General', 'wp-carousel-free' ),
				'sections' => array(
					'content' => array(
						'title'  => __( 'WP Carousel', 'wp-carousel-free' ),
						'fields' => array(
							'template_id' => array(
								'type'    => 'select',
								'label'   => __( 'Saved Template', 'wp-carousel-free' ),
								'default' => '0',
								'options' => Builder_Templates::get_list(),
							),
						),
					),
				),
			),
		)
	);
}

add_action( 'init', 'wpcpf_beaver_register_module' );
