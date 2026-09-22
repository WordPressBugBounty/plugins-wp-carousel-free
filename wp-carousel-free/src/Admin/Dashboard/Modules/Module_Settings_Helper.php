<?php
/**
 * Global extension settings storage — defaults, sanitization, read API.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules;

use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Dashboard;
use ShapedPlugin\WPCarouselFree\Includes\Utils\Array_Merge;

defined( 'ABSPATH' ) || exit;

/**
 * Module_Settings_Helper class.
 */
class Module_Settings_Helper {

	const OPTION = Dashboard::OPTION_EXTENSION_SETTINGS;

	/**
	 * Module slugs that support a settings drawer.
	 *
	 * @return string[]
	 */
	public static function get_registered_modules() {
		$modules = array(
			Lightbox_Settings::MODULE,
		);

		/**
		 * Filter registered extension settings modules.
		 *
		 * @param string[] $modules Module slugs.
		 */
		return apply_filters( 'wpcp_extension_settings_modules', $modules );
	}

	/**
	 * All extension settings for the React dashboard.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_all_for_js() {
		$payload = array(
			Lightbox_Settings::MODULE => Lightbox_Settings::get_settings(),
		);

		/**
		 * Filter extension settings passed to the dashboard script.
		 *
		 * @param array<string, mixed> $payload Settings by module slug.
		 */
		return apply_filters( 'wpcp_extension_settings_for_js', $payload );
	}

	/**
	 * Raw saved settings merged with module defaults.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_all_settings() {
		$saved = get_option( self::OPTION, array() );
		if ( ! is_array( $saved ) ) {
			$saved = array();
		}

		$merged = array();
		foreach ( self::get_registered_modules() as $module ) {
			$module_saved      = isset( $saved[ $module ] ) && is_array( $saved[ $module ] )
				? $saved[ $module ]
				: array();
			$merged[ $module ] = self::merge_module_defaults( $module, $module_saved );
		}

		return $merged;
	}

	/**
	 * Settings for a single extension module.
	 *
	 * @param string $module_name Module slug.
	 * @return array<string, mixed>
	 */
	public static function get_module_settings( $module_name ) {
		$module_name = sanitize_key( $module_name );

		if ( Lightbox_Settings::MODULE === $module_name ) {
			return Lightbox_Settings::get_settings();
		}

		return array();
	}

	/**
	 * Sanitize partial extension settings and persist.
	 *
	 * @param array<string, mixed> $incoming Settings keyed by module slug.
	 * @return array<string, mixed> Saved settings for JS.
	 */
	public static function sanitize_and_save( array $incoming ) {
		$current = get_option( self::OPTION, array() );
		if ( ! is_array( $current ) ) {
			$current = array();
		}

		$allowed = self::get_registered_modules();

		foreach ( $incoming as $module => $settings ) {
			$module = sanitize_key( (string) $module );
			if ( ! in_array( $module, $allowed, true ) || ! is_array( $settings ) ) {
				continue;
			}

			if ( Lightbox_Settings::MODULE === $module ) {
				$current[ $module ] = Lightbox_Settings::sanitize( $settings );
			}
		}

		update_option( self::OPTION, $current, false );

		return self::get_all_for_js();
	}

	/**
	 * Merge saved module data with defaults.
	 *
	 * @param string               $module Module slug.
	 * @param array<string, mixed> $saved  Saved values.
	 * @return array<string, mixed>
	 */
	private static function merge_module_defaults( $module, array $saved ) {
		if ( Lightbox_Settings::MODULE === $module ) {
			return Array_Merge::deep( Lightbox_Settings::get_defaults(), $saved );
		}

		return $saved;
	}
}
