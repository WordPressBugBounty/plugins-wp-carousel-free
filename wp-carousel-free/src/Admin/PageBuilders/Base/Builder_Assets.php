<?php
/**
 * Shared helpers for the page builder integrations.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base;

use ShapedPlugin\WPCarouselFree\Blocks\AssetManager;
use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Block_Dynamic_Style;

defined( 'ABSPATH' ) || exit;

/**
 * Every builder needs the same four things: the block runtime enqueued, the
 * selected template's dynamic stylesheet printed inline, a re-init hook for
 * markup the builder swaps in over AJAX, and a placeholder box. They live here
 * once rather than once per builder.
 */
class Builder_Assets {

	/**
	 * Enqueue the block frontend runtime.
	 *
	 * Handles are registered by AssetManager on `init`; this only flips the ones
	 * a saved template can need to enqueued, so a page that never renders a
	 * builder element pulls neither Swiper nor the frontend bundle.
	 *
	 * @param bool $all_style_chunks Whether to add every conditional style chunk.
	 */
	public static function enqueue_block_runtime( $all_style_chunks = false ) {
		$scripts = array(
			AssetManager::SWIPER,
			AssetManager::FRONTEND,
			AssetManager::FANCYBOX,
			AssetManager::LIGHTBOX_GLOBAL,
		);

		foreach ( $scripts as $handle ) {
			if ( wp_script_is( $handle, 'registered' ) ) {
				wp_enqueue_script( $handle );
			}
		}

		$styles = array(
			AssetManager::SWIPER_STYLE,
			AssetManager::BASE_STYLE,
			AssetManager::FANCYBOX_STYLE,
			AssetManager::LIGHTBOX_EXTENSION,
		);

		foreach ( $styles as $handle ) {
			if ( wp_style_is( $handle, 'registered' ) ) {
				wp_enqueue_style( $handle );
			}
		}

		// A builder editor can swap in any saved template at runtime, so the
		// per-block chunk enqueue the render normally does never gets the chance
		// to run. Load them all, as the block editor does.
		if ( $all_style_chunks ) {
			AssetManager::instance()->enqueue_all_block_style_chunks();
		}
	}

	/**
	 * Re-initialise carousels whenever the builder inserts or replaces markup.
	 *
	 * A builder renders its preview from AJAX responses that carry HTML alone, so
	 * the markup lands after the frontend bundle has booted and nothing triggers
	 * its boot-time init. The initialiser is idempotent, so repeat calls are safe.
	 *
	 * @param string $wrapper_class Wrapper class the observer watches for.
	 * @param array  $events        jQuery document events that also trigger a re-init.
	 * @param int    $delay         Milliseconds to wait before initialising.
	 */
	public static function add_reinit_script( $wrapper_class, array $events = array(), $delay = 0 ) {
		if ( ! wp_script_is( AssetManager::FRONTEND, 'registered' ) ) {
			return;
		}

		$bindings = '';
		foreach ( $events as $event ) {
			$bindings .= '$(document).on(' . wp_json_encode( $event ) . ', reinitWpcpCarousels);';
		}

		$selector = '.' . $wrapper_class;

		wp_add_inline_script(
			AssetManager::FRONTEND,
			'jQuery(function($) {
				function reinitWpcpCarousels() {
					setTimeout(function() {
						if (window.WPCarouselFree && typeof window.WPCarouselFree.initialize === "function") {
							window.WPCarouselFree.initialize();
						}
					}, ' . absint( $delay ) . ');
				}

				' . $bindings . '

				if (typeof MutationObserver === "undefined" || ! document.body) {
					return;
				}

				new MutationObserver(function(mutations) {
					for (var i = 0; i < mutations.length; i++) {
						var added = mutations[i].addedNodes;
						for (var j = 0; j < added.length; j++) {
							var node = added[j];
							if (node.nodeType !== 1) {
								continue;
							}
							if (node.matches(' . wp_json_encode( $selector ) . ') || node.querySelector(' . wp_json_encode( $selector ) . ')) {
								reinitWpcpCarousels();
								return;
							}
						}
					}
				}).observe(document.body, { childList: true, subtree: true });
			});'
		);
	}

	/**
	 * The selected template's stylesheet and web fonts as inline `<link>` markup.
	 *
	 * The shortcode enqueues both, but an enqueue only survives a full page load.
	 * Every settings change re-renders the element through the builder's own AJAX
	 * action, whose response carries element HTML alone — so printing the links
	 * inline is the only way the newly selected template arrives styled.
	 *
	 * @param int $template_id Template post ID.
	 * @return string Link markup, or '' when the stylesheet does not exist yet.
	 */
	public static function template_css_links( $template_id ) {
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet -- Printed inline on purpose: an enqueue does not survive a builder's AJAX re-render.
		// One set of links per template per request; a page may hold several elements.
		static $printed = array();

		$template_id = absint( $template_id );
		if ( ! $template_id || isset( $printed[ $template_id ] ) ) {
			return '';
		}
		$printed[ $template_id ] = true;

		$block_style = Block_Dynamic_Style::instance();
		if ( ! $block_style->css_file_exists( $template_id ) ) {
			return '';
		}

		// Bust on the template's own revision stamp, not the plugin version: the
		// file is rewritten whenever the template is saved, so a plugin-version
		// buster would serve the pre-edit stylesheet for the rest of the release.
		$version = get_post_meta( $template_id, '_sp_wpcp_unique_version', true );
		$version = ! empty( $version ) ? $version : WPCAROUSELF_VERSION;

		$links = sprintf(
			'<link rel="stylesheet" id="wpcpf-template-css-%1$s" href="%2$s" media="all">',
			esc_attr( $template_id ),
			esc_url( $block_style->css_url . 'sp-wpcp-style-' . $template_id . '.css?v=' . $version )
		);

		$fonts = get_post_meta( $template_id, 'sp_wpcp_dynamic_fonts', true );
		if ( empty( $fonts ) || ! is_array( $fonts ) ) {
			return $links;
		}

		foreach ( array_unique( $fonts ) as $font ) {
			if ( ! empty( $font ) ) {
				$links .= sprintf(
					'<link rel="stylesheet" href="%s">',
					esc_url( 'https://fonts.googleapis.com/css?family=' . rawurlencode( $font ) )
				);
			}
		}

		// phpcs:enable WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet
		return $links;
	}

	/**
	 * Placeholder box shown in place of a carousel the builder cannot render.
	 *
	 * @param string $message Already-translated message.
	 * @return string
	 */
	public static function notice( $message ) {
		return sprintf(
			'<div class="wpcpf-builder-notice" style="text-align:center;padding:20px;border:2px dashed #ccc;color:#999;font-size:14px;">%s</div>',
			esc_html( $message )
		);
	}
}
