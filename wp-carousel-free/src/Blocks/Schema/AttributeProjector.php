<?php
/**
 * Projects an untrusted attribute payload onto a block's schema.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Schema;

defined( 'ABSPATH' ) || exit;

/**
 * Reproduces core's render-time attribute projection for custom REST routes.
 *
 * `WP_Block_Type::prepare_attributes_for_render()` drops undeclared keys and
 * snaps out-of-`enum` values back to their default, which is what makes
 * omitting a Pro attribute from the schema sufficient enforcement for block
 * rendering. It does not run for custom routes, so any route that accepts block
 * attributes must project the payload through here as its first act — otherwise
 * a crafted request injects Pro attributes the schema deliberately omits.
 */
class AttributeProjector {

	/**
	 * Project a payload onto a schema.
	 *
	 * @param array<string,mixed>                 $payload Untrusted attribute payload.
	 * @param AttributeSchema|array<string,mixed> $schema  Schema instance, or its attribute map.
	 * @return array<string,mixed> Only declared keys, with invalid values reset to their default.
	 */
	public static function apply( array $payload, $schema ): array {
		$attributes = $schema instanceof AttributeSchema ? $schema->get_attributes() : (array) $schema;
		$projected  = array();

		foreach ( $attributes as $name => $definition ) {
			$definition  = is_array( $definition ) ? $definition : array();
			$has_default = array_key_exists( 'default', $definition );

			if ( ! array_key_exists( $name, $payload ) ) {
				if ( $has_default ) {
					$projected[ $name ] = $definition['default'];
				}
				continue;
			}

			$value = $payload[ $name ];

			if ( ! self::is_valid( $value, $definition ) ) {
				if ( $has_default ) {
					$projected[ $name ] = $definition['default'];
				}
				continue;
			}

			$projected[ $name ] = $value;
		}

		return AllowedValues::project( $projected );
	}

	/**
	 * Whether a value satisfies its attribute definition's `type` and `enum`.
	 *
	 * Only top-level constraints are checked, mirroring core. Values nested
	 * inside an object attribute are whitelisted on read by AllowedValues.
	 *
	 * @param mixed               $value      Candidate value.
	 * @param array<string,mixed> $definition Attribute definition.
	 * @return bool
	 */
	private static function is_valid( $value, array $definition ): bool {
		if ( isset( $definition['enum'] ) && is_array( $definition['enum'] ) && ! in_array( $value, $definition['enum'], true ) ) {
			return false;
		}

		if ( ! isset( $definition['type'] ) ) {
			return true;
		}

		$types = is_array( $definition['type'] ) ? $definition['type'] : array( $definition['type'] );

		foreach ( $types as $type ) {
			if ( self::matches_type( $value, (string) $type ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Whether a value matches one JSON-schema type name.
	 *
	 * @param mixed  $value Candidate value.
	 * @param string $type  JSON-schema type name.
	 * @return bool
	 */
	private static function matches_type( $value, string $type ): bool {
		switch ( $type ) {
			case 'string':
				return is_string( $value );
			case 'number':
				return is_int( $value ) || is_float( $value );
			case 'integer':
				return is_int( $value );
			case 'boolean':
				return is_bool( $value );
			case 'null':
				return null === $value;
			case 'array':
				return is_array( $value ) && ( array() === $value || self::is_list( $value ) );
			case 'object':
				// A JSON object decodes to an associative array; an empty array
				// is ambiguous and core accepts it for either shape.
				return is_array( $value ) && ( array() === $value || ! self::is_list( $value ) );
			default:
				return true;
		}
	}

	/**
	 * Whether an array has sequential integer keys from zero. `array_is_list()`
	 * needs PHP 8.1; this plugin supports 7.4.
	 *
	 * @param array<mixed> $value Array to test.
	 * @return bool
	 */
	private static function is_list( array $value ): bool {
		return array_keys( $value ) === range( 0, count( $value ) - 1 );
	}
}
