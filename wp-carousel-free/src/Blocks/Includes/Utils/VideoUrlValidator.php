<?php
/**
 * Video URL validation and sanitization for block video items.
 *
 * Mirrors `blocks/blocks/shared/utils/videoUrlValidation.js`.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * Validates and sanitizes video URLs per supported provider.
 */
class VideoUrlValidator {

	/**
	 * Whether a string looks like pasted iframe embed markup.
	 *
	 * @param string $value Raw input.
	 * @return bool
	 */
	public static function looks_like_embed_code( string $value ): bool {
		return (bool) preg_match( '/<iframe/i', $value );
	}

	/**
	 * Whether a string parses as an absolute http(s) URL.
	 *
	 * @param string $value Raw URL.
	 * @return bool
	 */
	public static function is_valid_absolute_url( string $value ): bool {
		$value = trim( $value );
		if ( '' === $value ) {
			return false;
		}

		$parts = wp_parse_url( $value );
		if ( ! is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
			return false;
		}

		return in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true );
	}

	/**
	 * Detect video provider from a URL hostname.
	 *
	 * @param string $url Video URL.
	 * @return string Provider key, or empty string for an unsupported host.
	 */
	public static function get_source_type( string $url ): string {
		if ( '' === trim( $url ) ) {
			return 'youtube';
		}

		$host = wp_parse_url( $url, PHP_URL_HOST );
		if ( ! is_string( $host ) || '' === $host ) {
			return '';
		}

		$host = strtolower( $host );

		if ( false !== strpos( $host, 'youtube.com' ) || false !== strpos( $host, 'youtu.be' ) ) {
			return 'youtube';
		}
		if ( false !== strpos( $host, 'vimeo.com' ) ) {
			return 'vimeo';
		}

		return '';
	}

	/**
	 * Provider-specific URL format checks.
	 *
	 * @param string $video_source Provider key.
	 * @param string $url          Trimmed URL.
	 * @return bool
	 */
	public static function can_embed_video_source( string $video_source, string $url ): bool {
		$url = trim( $url );
		if ( '' === $url ) {
			return false;
		}

		switch ( $video_source ) {
			case 'youtube':
				return (bool) preg_match( '/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^?&#\/]+)/i', $url );

			case 'vimeo':
				return (bool) preg_match( '/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i', $url );

			default:
				return false;
		}
	}

	/**
	 * Sanitize a URL for storage.
	 *
	 * @param string $url Raw user input.
	 * @return string Sanitized value (empty when invalid or blank).
	 */
	public static function sanitize( string $url ): string {
		$trimmed = trim( $url );

		if ( '' === $trimmed || self::looks_like_embed_code( $trimmed ) ) {
			return '';
		}

		$sanitized = esc_url_raw( $trimmed );
		if ( '' === $sanitized || ! self::is_valid_absolute_url( $sanitized ) ) {
			return '';
		}

		return $sanitized;
	}

	/**
	 * Validate a video URL for a given provider.
	 *
	 * @param string $video_source Provider key.
	 * @param string $video_url    Raw user input.
	 * @return array{valid: bool, error_code: string}
	 */
	public static function validate( string $video_source, string $video_url ): array {
		$video_source = sanitize_key( $video_source );
		$trimmed      = trim( $video_url );

		if ( '' === $trimmed ) {
			return array(
				'valid'      => true,
				'error_code' => '',
			);
		}

		if ( ! in_array( $video_source, AllowedValues::VIDEO_SOURCES, true ) ) {
			return array(
				'valid'      => false,
				'error_code' => 'unsupported_provider',
			);
		}

		if ( self::looks_like_embed_code( $trimmed ) ) {
			return array(
				'valid'      => false,
				'error_code' => 'embed_code_unsupported',
			);
		}

		if ( ! self::is_valid_absolute_url( $trimmed ) ) {
			return array(
				'valid'      => false,
				'error_code' => 'invalid_url',
			);
		}

		if ( self::get_source_type( $trimmed ) !== $video_source ) {
			return array(
				'valid'      => false,
				'error_code' => 'unsupported_provider',
			);
		}

		if ( ! self::can_embed_video_source( $video_source, $trimmed ) ) {
			return array(
				'valid'      => false,
				'error_code' => 'invalid_provider_format',
			);
		}

		return array(
			'valid'      => true,
			'error_code' => '',
		);
	}
}
