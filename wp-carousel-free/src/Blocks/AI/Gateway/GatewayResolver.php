<?php
/**
 * Gateway Resolver
 *
 * Decides how a completion request reaches its provider: through WordPress
 * Connectors when the site owner already configured one there, otherwise
 * through this plugin's own stored key.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI\Gateway;

use ShapedPlugin\WPCarouselFree\Blocks\AI\AIFeature;
use ShapedPlugin\WPCarouselFree\Blocks\AI\AIKeyManager;
use ShapedPlugin\WPCarouselFree\Blocks\AI\ConnectorBridge;

defined( 'ABSPATH' ) || exit;

/**
 * GatewayResolver class.
 */
class GatewayResolver {

	/**
	 * Pick the gateway for a provider.
	 *
	 * Connectors win whenever they can actually serve the request. A key stored
	 * by this plugin is never deleted or migrated because of that — it stays as
	 * the fallback for the day the provider plugin is deactivated, the connector
	 * key is revoked, or the site moves to a WordPress without Connectors.
	 *
	 * @param string $provider Provider slug, or empty for the configured provider.
	 * @param string $model    Model id already checked against the provider, or empty for the stored one.
	 * @return TextGateway|\WP_Error Gateway, or WP_Error when nothing can serve the request.
	 */
	public static function resolve( string $provider = '', string $model = '' ) {
		// Last line of defence: no completion leaves the site while the module is
		// off, however the caller got here.
		if ( ! AIFeature::is_available() ) {
			return AIFeature::unavailable_error();
		}

		$settings = AIKeyManager::get_settings();
		$provider = '' !== $provider ? $provider : $settings['provider'];

		// The stored model belongs to the stored provider. Resolving a different
		// provider means there is no model choice to carry over.
		if ( '' === $model && $provider === $settings['provider'] ) {
			$model = $settings['model'];
		}

		if ( ConnectorBridge::is_connected( $provider ) ) {
			return new ConnectorGateway( $provider, $model );
		}

		$api_key = AIKeyManager::get_decrypted_key( $provider );
		if ( '' === $api_key ) {
			return new \WP_Error( 'wpcp_ai_missing_key', self::missing_key_message( $provider ), array( 'status' => 400 ) );
		}

		return new RemoteHttpGateway( $provider, $model, $api_key );
	}

	/**
	 * Explain a missing credential in terms of where the user can supply one.
	 *
	 * Pointing at this plugin's settings when WordPress already offers a
	 * connector for the provider sends the user to the wrong screen, and sets
	 * up exactly the duplicate key entry the connector integration exists to
	 * avoid.
	 *
	 * @param string $provider Provider slug.
	 * @return string Message.
	 */
	private static function missing_key_message( string $provider ): string {
		if ( ConnectorBridge::is_registered( $provider ) ) {
			return __( 'This AI provider has no API key yet. Connect it under Settings > Connectors, or add a key in WP Carousel Settings.', 'wp-carousel-free' );
		}

		return __( 'AI API key is missing. Please configure your API key in WP Carousel Settings.', 'wp-carousel-free' );
	}
}
