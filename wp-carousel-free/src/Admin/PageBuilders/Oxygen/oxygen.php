<?php
/**
 * Oxygen Builder saved-template element.
 *
 * Oxygen discovers elements by instantiating a global `OxyEl` subclass, so this
 * class is global. Its slug matches Pro's so a layout built in Free keeps
 * rendering after the upgrade.
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
class SPWPCarouselFreeOxygen extends OxyEl {

	/**
	 * Wrapper class the editor re-init observer watches for.
	 */
	const WRAPPER_CLASS = 'wpcp-oxygen-carousel-wrapper';

	/**
	 * Shortcode tag Oxygen generates for this element, and stores a layout as.
	 *
	 * Oxygen derives it as `'oxy-' . sanitize_title( slug() )`.
	 */
	const ELEMENT_TAG = 'oxy-sp-wp-carousel-pro';

	/**
	 * Post meta Oxygen keeps a layout's shortcodes in.
	 */
	const LAYOUT_META = 'ct_builder_shortcodes';

	/**
	 * Element name.
	 *
	 * @return string
	 */
	public function name() {
		return __( 'WP Carousel', 'wp-carousel-free' );
	}

	/**
	 * Element slug.
	 *
	 * @return string
	 */
	public function slug() {
		return 'sp-wp-carousel-pro';
	}

	/**
	 * Element icon in the Oxygen panel, which takes an image URL.
	 *
	 * @return string
	 */
	public function icon() {
		return WPCAROUSELF_URL . 'src/Admin/PageBuilders/Oxygen/icon.svg';
	}

	/**
	 * Button priority in the Oxygen panel.
	 *
	 * @return int
	 */
	public function button_priority() {
		return 9;
	}

	/**
	 * Element wrapper tag.
	 *
	 * @return string
	 */
	public function tag() {
		return 'div';
	}

	/**
	 * Let Oxygen manage the element's own CSS.
	 *
	 * @return bool
	 */
	public function enableFullCSS() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Oxygen's own API name.
		return true;
	}

	/**
	 * Hook asset loading once Oxygen has built the element.
	 */
	public function afterInit() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Oxygen's own API name.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_builder_assets' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_builder_assets' ) );

		// Well before Lightbox_Frontend localizes the Fancybox config at 100.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ), 20 );
	}

	/**
	 * Whether the page's own Oxygen layout holds this element.
	 *
	 * Matches the stored shortcode string rather than parsing it. An element
	 * placed in an Oxygen *template* instead of the page is not visible here:
	 * resolving the applied template means Oxygen's own
	 * `ct_get_posts_template()`, which runs an unbounded query on every request.
	 * Lightbox_Frontend's footer localization pass covers that case instead.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	private function layout_contains_element( $post_id ) {
		$post_id = absint( $post_id );

		if ( ! $post_id ) {
			return false;
		}

		$shortcodes = get_post_meta( $post_id, self::LAYOUT_META, true );

		if ( ! is_string( $shortcodes ) || '' === $shortcodes ) {
			return false;
		}

		return false !== strpos( $shortcodes, '[' . self::ELEMENT_TAG );
	}

	/**
	 * Load the block runtime on published Oxygen pages.
	 *
	 * Oxygen renders its layout from `ct_builder_start`, fired by its own page
	 * template well after `wp_enqueue_scripts` is done, so the shortcode's
	 * enqueue is far too late for the priority-100 lightbox config.
	 */
	public function enqueue_frontend_assets() {
		if ( is_admin() || $this->is_builder_editor() ) {
			return;
		}

		if ( ! is_singular() || ! $this->layout_contains_element( get_queried_object_id() ) ) {
			return;
		}

		Builder_Assets::enqueue_block_runtime();
	}

	/**
	 * Whether the Oxygen builder is running.
	 *
	 * @return bool
	 */
	private function is_builder_editor() {
		if ( function_exists( 'ct_get_current_screen' ) && 'oxy_settings_iframe' === ct_get_current_screen() ) {
			return true;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Reading the request context, not acting on it.
		if ( isset( $_GET['oxygen_iframe'] ) ) {
			return true;
		}

		return isset( $_GET['action'] ) && false !== strpos( sanitize_key( wp_unslash( $_GET['action'] ) ), 'oxy_render_oxy' );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Enqueue the block runtime and re-init observer inside the Oxygen builder.
	 */
	public function enqueue_builder_assets() {
		if ( ! $this->is_builder_editor() ) {
			return;
		}

		Builder_Assets::enqueue_block_runtime( true );
		Builder_Assets::add_reinit_script(
			self::WRAPPER_CLASS,
			array( 'oxygen-ajax-element-loaded' ),
			300
		);
	}

	/**
	 * Element controls.
	 */
	public function controls() {
		$this->addOptionControl( // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Oxygen's own API name.
			array(
				'type'    => 'dropdown',
				'name'    => esc_html__( 'Saved Template', 'wp-carousel-free' ),
				'slug'    => 'template_id',
				'default' => '0',
			)
		)->setValue( Builder_Templates::get_list() )->rebuildElementOnChange();
	}

	/**
	 * Render the element.
	 *
	 * @param array  $options  Element options.
	 * @param array  $defaults Default values.
	 * @param string $content  Inner content.
	 */
	public function render( $options, $defaults, $content ) {
		$template_id = isset( $options['template_id'] ) ? absint( $options['template_id'] ) : 0;

		printf(
			'<div class="%1$s" data-builder-template-id="%2$s">',
			esc_attr( self::WRAPPER_CLASS ),
			esc_attr( $template_id )
		);
		echo Builder_Templates::render( $template_id, $this->is_builder_editor() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Rendered block markup.
		echo '</div>';
	}
}

new SPWPCarouselFreeOxygen();
