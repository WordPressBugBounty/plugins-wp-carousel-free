<?php
/**
 * Ready Patterns dependency metadata normalization.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns;

defined( 'ABSPATH' ) || exit;

/**
 * Normalizes a pattern's `requires` block to a fixed shape.
 *
 * Every key is always present so the editor can read the shape without guards,
 * and unknown keys are dropped so a server-side addition cannot reach the modal
 * unreviewed.
 */
class Requirements {

	/**
	 * Maximum entries kept per requirement list.
	 */
	private const MAX_ENTRIES = 10;

	/**
	 * Normalize raw `requires` data.
	 *
	 * @param mixed $raw Raw requirement data from the source item.
	 * @return array{plugins: string[], modules: string[], minPluginVersion: string, sources: string[]}
	 */
	public static function normalize( $raw ): array {
		$requirements = array(
			'plugins'          => array(),
			'modules'          => array(),
			'minPluginVersion' => '',
			'sources'          => array(),
		);

		if ( ! is_array( $raw ) ) {
			return $requirements;
		}

		$requirements['plugins'] = self::normalize_slug_list( $raw['plugins'] ?? array() );
		$requirements['modules'] = self::normalize_slug_list( $raw['modules'] ?? array() );
		$requirements['sources'] = self::normalize_slug_list( $raw['sources'] ?? array() );

		if ( isset( $raw['minPluginVersion'] ) && is_scalar( $raw['minPluginVersion'] ) ) {
			$requirements['minPluginVersion'] = self::normalize_version( (string) $raw['minPluginVersion'] );
		}

		return $requirements;
	}

	/**
	 * Whether a normalized requirement set declares nothing.
	 *
	 * @param array<string, mixed> $requirements Normalized requirements.
	 * @return bool
	 */
	public static function is_empty( array $requirements ): bool {
		return empty( $requirements['plugins'] )
			&& empty( $requirements['modules'] )
			&& empty( $requirements['sources'] )
			&& '' === ( $requirements['minPluginVersion'] ?? '' );
	}

	/**
	 * Sanitize a list of slugs.
	 *
	 * @param mixed $values Raw list.
	 * @return string[]
	 */
	private static function normalize_slug_list( $values ): array {
		if ( ! is_array( $values ) ) {
			return array();
		}

		$slugs = array();
		foreach ( $values as $entry ) {
			if ( ! is_scalar( $entry ) ) {
				continue;
			}

			$slug = sanitize_key( (string) $entry );
			if ( '' !== $slug && ! in_array( $slug, $slugs, true ) ) {
				$slugs[] = $slug;
			}
		}

		return array_slice( $slugs, 0, self::MAX_ENTRIES );
	}

	/**
	 * Constrain a version to its leading dotted-numeric run.
	 *
	 * Taking the prefix rather than deleting stray characters matters: stripping
	 * non-digits from "4.2.0-beta1" would yield "4.2.01", a version that never
	 * existed. Anything that does not start with a number resolves to no minimum,
	 * so an unreadable value cannot invent a requirement.
	 *
	 * @param string $version Raw version string.
	 * @return string
	 */
	private static function normalize_version( string $version ): string {
		if ( 1 !== preg_match( '/^\d+(?:\.\d+)*/', trim( $version ), $matches ) ) {
			return '';
		}

		return $matches[0];
	}
}
