<?php
/**
 * Block module bootstrapper.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

defined( 'ABSPATH' ) || exit;

/**
 * Wires up the block module.
 */
final class BlocksInit {

	/**
	 * Singleton instance.
	 *
	 * @var BlocksInit|null
	 */
	private static $instance = null;

	/**
	 * Retrieve the singleton.
	 *
	 * @return BlocksInit
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->init();
	}

	/**
	 * Register categories, assets and block types.
	 *
	 * @return void
	 */
	private function init() {
		BlockCategories::init();
		Cache::init();

		$assets = AssetManager::instance();
		add_action( 'init', array( $assets, 'register_editor_assets' ), 10 );
		add_action( 'init', array( $assets, 'register_frontend_assets' ), 10 );
		add_action( 'init', array( Lightbox\Lightbox_Frontend::class, 'init' ), 10 );

		$controller = new BlockTypesController();
		$controller->init();

		new Rest\PreviewController();
		new Rest\AjaxPaginationController();
		new ReadyPatterns\Controller();

		add_action( 'enqueue_block_editor_assets', array( $assets, 'enqueue_editor_assets' ) );

		// Also on enqueue_block_assets: this is what reaches the iframed editor canvas.
		add_action( 'enqueue_block_assets', array( $assets, 'enqueue_editor_assets' ) );

		// Server-side per-block dynamic CSS. Without this nothing emits the
		// scoped rules that position navigation arrows, pagination and the rest,
		// so every block falls back to the static defaults.
		if ( ! is_admin() ) {
			Includes\Utils\Block_Dynamic_Style::instance();
		}
	}
}
