<?php
/**
 * Token emitter (frontend side) — a mechanical walk over the style config that
 * produces the per-device `--wpcp-*` token bags for one block instance.
 *
 * Mirrors `blocks/blocks/shared/styles/tokens/emitTokens.js` step-for-step; the
 * css-parity value-map gate asserts both sides produce the same bags from the
 * same attributes. Returns `array( 'Desktop' => …, 'Tablet' => …, 'Mobile' => … )`,
 * each a token map. The caller renders the Desktop bag at base and wraps
 * Tablet/Mobile in their fixed-breakpoint `@media` blocks.
 *
 * Import invariant: depends on the shared policy (EmissionPolicy) + primitives
 * only — never the composer (CarouselDynamicCss). Autoloads via PSR-4.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Tokens;

use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\EmissionPolicy;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Tokens\Primitives\Primitives;

defined( 'ABSPATH' ) || exit;

/**
 * Config-driven token emitter.
 */
final class EmitTokens {

	use EmissionPolicy;

	private const DEVICES = array( 'Desktop', 'Tablet', 'Mobile' );

	/**
	 * Walk the config rows and build the per-device token bags.
	 *
	 * @param array $config     Style-config rows (the StyleConfig::all() array).
	 * @param array $attributes Block attribute tree.
	 * @return array{Desktop: array, Tablet: array, Mobile: array} Per-device token bags.
	 */
	public function emit( array $config, array $attributes ): array {
		$bags = array(
			'Desktop' => array(),
			'Tablet'  => array(),
			'Mobile'  => array(),
		);

		foreach ( $config as $row ) {
			if ( ! $this->passes_row_gates( $row, $attributes ) ) {
				continue;
			}
			$transform   = $row['transform'] ?? 'raw';
			$attr_value  = $this->read_path( $attributes, $row['attr'] ?? '' );
			$row_default = $row['default'] ?? null;
			$token       = $row['var'] ?? '';

			if ( ! empty( $row['device'] ) ) {
				foreach ( self::DEVICES as $device ) {
					$extracted = ! empty( $row['wholeAttr'] ) ? $attr_value : $this->read_device_value( $attr_value, $device );
					if ( empty( $row['always'] ) && ! $this->should_emit( $this->gate_value_of( $extracted ), $row_default ) ) {
						continue;
					}
					$out = Primitives::apply( $transform, $extracted, $row, $device );
					if ( null !== $out && '' !== $out ) {
						$bags[ $device ][ $token ] = $out;
					}
				}
				continue;
			}

			if ( empty( $row['always'] ) && ! $this->should_emit( $attr_value, $row_default ) ) {
				continue;
			}
			$out = Primitives::apply( $transform, $attr_value, $row );
			if ( null !== $out && '' !== $out ) {
				$bags['Desktop'][ $token ] = $out;
			}
		}

		return $bags;
	}

	/**
	 * Read a dot-path off the attribute tree, or null.
	 *
	 * @param mixed  $root Attribute tree.
	 * @param string $path Dot-path.
	 * @return mixed Value, or null when any segment is missing.
	 */
	private function read_path( $root, $path ) {
		$node = $root;
		foreach ( explode( '.', (string) $path ) as $key ) {
			if ( is_array( $node ) && array_key_exists( $key, $node ) ) {
				$node = $node[ $key ];
			} else {
				return null;
			}
		}
		return $node;
	}

	/**
	 * Evaluate optional whenAll / whenAny / when gate arrays on a config row.
	 *
	 * @param array $row        Config row.
	 * @param array $attributes Block attribute tree.
	 * @return bool True when all gates pass.
	 */
	private function passes_row_gates( array $row, array $attributes ) {
		if ( ! empty( $row['whenAll'] ) && is_array( $row['whenAll'] ) ) {
			foreach ( $row['whenAll'] as $gate ) {
				if ( ! $this->passes_when( $gate, $attributes ) ) {
					return false;
				}
			}
		}
		if ( ! empty( $row['whenAny'] ) && is_array( $row['whenAny'] ) ) {
			$any = false;
			foreach ( $row['whenAny'] as $gate ) {
				if ( $this->passes_when( $gate, $attributes ) ) {
					$any = true;
					break;
				}
			}
			if ( ! $any ) {
				return false;
			}
		}
		if ( ! empty( $row['when'] ) && ! $this->passes_when( $row['when'], $attributes ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Evaluate a declarative `when` gate against the attributes.
	 *
	 * @param mixed $when       Gate `array( 'attr' => …, 'op' => …, 'value' => … )` or null.
	 * @param array $attributes Block attribute tree.
	 * @return bool True when the gate passes (or there is no gate).
	 */
	private function passes_when( $when, $attributes ) {
		if ( empty( $when ) ) {
			return true;
		}
		$actual = $this->read_path( $attributes, $when['attr'] ?? '' );
		$value  = $when['value'] ?? null;
		switch ( $when['op'] ?? '' ) {
			case 'eq':
				return $actual === $value;
			case 'neq':
				return $actual !== $value;
			case 'truthy':
				return (bool) $actual;
			case 'in':
				return is_array( $value ) && in_array( $actual, $value, true );
			default:
				return true;
		}
	}

	/**
	 * Extract one device's value from a responsive attribute.
	 *
	 * @param mixed  $attr_value Attribute value.
	 * @param string $device     Device key.
	 * @return mixed Extracted value (scalar or `array( 'value', 'unit' )`).
	 */
	private function read_device_value( $attr_value, $device ) {
		if ( is_array( $attr_value ) ) {
			if ( isset( $attr_value['device'] ) && is_array( $attr_value['device'] ) ) {
				if ( isset( $attr_value['unit'] ) && is_array( $attr_value['unit'] ) ) {
					$device_unit = $attr_value['unit'][ $device ] ?? null;
					$unit        = $device_unit ? $device_unit : ( $attr_value['unit']['Desktop'] ?? null );
				} else {
					$unit = $attr_value['unit'] ?? null;
				}
				return array(
					'value' => $attr_value['device'][ $device ] ?? null,
					'unit'  => $unit,
				);
			}
			if (
				array_key_exists( 'Desktop', $attr_value ) ||
				array_key_exists( 'Tablet', $attr_value ) ||
				array_key_exists( 'Mobile', $attr_value )
			) {
				return $attr_value[ $device ] ?? null;
			}
		}
		return $attr_value;
	}

	/**
	 * The value the EmissionPolicy gates on (unwrap a `array( 'value' )` pair).
	 *
	 * @param mixed $extracted Extracted device value.
	 * @return mixed Gate value.
	 */
	private function gate_value_of( $extracted ) {
		if ( is_array( $extracted ) && array_key_exists( 'value', $extracted ) ) {
			return $extracted['value'];
		}
		return $extracted;
	}
}
