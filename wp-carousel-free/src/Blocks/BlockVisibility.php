<?php
/**
 * Block visibility enforcement.
 *
 * Reads the per-block on/off map saved by the dashboard "Blocks" page (option
 * `wpcp_block_visibility`, shape `array<slug, bool>`) and enforces it: a
 * disabled block is gone from the editor inserter and renders nothing on the
 * frontend. Without this the dashboard toggles save but do nothing.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

defined( 'ABSPATH' ) || exit;

/**
 * BlockVisibility class.
 */
class BlockVisibility {

	/**
	 * Option holding the visibility map. Mirrors Dashboard::OPTION_BLOCK_VISIBILITY
	 * and is deliberately the same key Pro uses, so the setting survives an upgrade.
	 *
	 * @var string
	 */
	const OPTION = 'wpcp_block_visibility';

	/**
	 * Saved visibility map.
	 *
	 * @return array<string, bool> Slug to enabled.
	 */
	private static function get_map() {
		$map = get_option( self::OPTION, array() );
		return is_array( $map ) ? $map : array();
	}

	/**
	 * Whether a block slug is enabled. An absent slug defaults to enabled.
	 *
	 * @param string $slug Block slug without namespace, e.g. "carousel".
	 * @return bool
	 */
	public static function is_enabled( $slug ) {
		$map = self::get_map();

		if ( ! array_key_exists( $slug, $map ) ) {
			return true;
		}

		return ! empty( $map[ $slug ] );
	}

	/**
	 * Disabled blocks as fully-qualified block names.
	 *
	 * @return string[] e.g. array( 'wp-carousel-pro/carousel' ).
	 */
	public static function get_disabled_block_names() {
		$disabled = array();

		foreach ( self::get_map() as $slug => $enabled ) {
			if ( ! empty( $enabled ) ) {
				continue;
			}
			$disabled[] = BlockTypesController::NAMESPACE_PREFIX . '/' . sanitize_key( $slug );
		}

		return $disabled;
	}

	/**
	 * Filter callback for `allowed_block_types_all` — drops disabled blocks from
	 * a curated allow-list without ever expanding the "allow all" default.
	 *
	 * When the incoming value is `true` (WordPress default: every block allowed)
	 * it is returned untouched. Expanding `true` into an explicit array would
	 * freeze the global allow-list and clobber any other plugin that also filters
	 * this hook, since its own `if ( true === $allowed )` branch would never run.
	 * Our disabled blocks are hidden from the inserter client-side instead, via
	 * `unregisterBlockType` in blocks/blocks/index.js, which touches only our
	 * own namespace.
	 *
	 * @param bool|string[]            $allowed_block_types Allowed block types, or true for all.
	 * @param \WP_Block_Editor_Context $editor_context      Editor context. Unused.
	 * @return bool|string[]
	 */
	public static function filter_allowed_block_types( $allowed_block_types, $editor_context = null ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Signature fixed by the allowed_block_types_all filter.
		if ( ! is_array( $allowed_block_types ) ) {
			return $allowed_block_types;
		}

		$disabled = self::get_disabled_block_names();
		if ( empty( $disabled ) ) {
			return $allowed_block_types;
		}

		return array_values( array_diff( $allowed_block_types, $disabled ) );
	}
}
