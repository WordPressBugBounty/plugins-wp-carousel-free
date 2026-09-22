<?php
/**
 * Low-level CSS string utilities for the dynamic-CSS generator (PHP side).
 *
 * Mirrors the JS editor module `blocks/blocks/shared/styles/cssUtils.js`. These
 * are value/string primitives (format-with-unit, object→string, dedupe by
 * selector, media-query wrap) shared across the per-concern CSS generators. Any
 * change here MUST land on the JS side in the same commit — the JS↔PHP parity
 * harness in `tests/css-parity/` will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Pure CSS string utilities consumed by CarouselDynamicCss and its concern traits.
 */
trait CssUtils {

	/**
	 * Check and format CSS data values with unit.
	 *
	 * Mirrors: cssUtils.js cssDataCheck()
	 *
	 * @param mixed  $value CSS value.
	 * @param string $unit  CSS unit.
	 * @return string Formatted CSS value.
	 */
	private function css_data_check( $value, $unit = '' ) {
		if ( ! isset( $value ) ) {
			return '';
		}

		$unit = Css_Helpers::sanitize_css_unit( $unit );

		if ( is_array( $value ) ) {
			$filtered = array();
			foreach ( $value as $val ) {
				if ( null !== $val && '' !== trim( (string) $val ) ) {
					$filtered[] = $val . $unit;
				}
			}

			if ( empty( $filtered ) ) {
				return '';
			}

			return implode( ' ', $filtered );
		}

		if ( '' !== trim( (string) $value ) ) {
			return $value . $unit;
		}

		return '';
	}

	/**
	 * Convert CSS array to string.
	 *
	 * Mirrors: cssUtils.js objectToCssString()
	 *
	 * @param array $css_array CSS array.
	 * @return string CSS string.
	 */
	private function object_to_css_string( $css_array ) {
		return Css_Helpers::object_to_css_string( $css_array );
	}

	/**
	 * Merge CSS rules by selector.
	 *
	 * Mirrors: cssUtils.js mergeCssRulesBySelector()
	 *
	 * @param array $css_array CSS array.
	 * @return array Merged CSS array.
	 */
	private function merge_css_rules_by_selector( $css_array ) {
		return Css_Helpers::filter_duplicate_selector( $css_array );
	}

	/**
	 * Build a [ selector => [ prop => value ] ] index from one or more merged-rule
	 * arrays. Later arrays override earlier ones per selector + property (cascade).
	 *
	 * Mirrors: cssUtils.js indexRulesBySelector().
	 *
	 * @param array ...$rule_arrays Arrays of { selector, styles } rules.
	 * @return array Selector → merged styles map.
	 */
	private function index_rules_by_selector( ...$rule_arrays ) {
		$index = array();
		foreach ( $rule_arrays as $rules ) {
			foreach ( (array) $rules as $rule ) {
				if ( empty( $rule['selector'] ) || ! isset( $rule['styles'] ) || ! is_array( $rule['styles'] ) ) {
					continue;
				}
				$selector           = $rule['selector'];
				$index[ $selector ] = isset( $index[ $selector ] )
					? array_merge( $index[ $selector ], $rule['styles'] )
					: $rule['styles'];
			}
		}
		return $index;
	}

	/**
	 * Strip declarations from a narrower breakpoint's rules when they repeat the
	 * value already in effect from the wider breakpoint(s). A media-query
	 * declaration whose value matches the cascade-inherited value is a no-op, so
	 * dropping it leaves every computed style unchanged while shrinking the CSS.
	 * Rules left with no declarations are removed entirely.
	 *
	 * Mirrors: cssUtils.js dropRulesMatchingBaseline().
	 *
	 * @param array $rules     Merged rules for the narrower breakpoint (Tablet/Mobile).
	 * @param array $baselines Wider-breakpoint merged-rule arrays, widest first.
	 * @return array Rules with redundant declarations (and emptied rules) removed.
	 */
	private function drop_rules_matching_baseline( $rules, $baselines ) {
		$baseline = $this->index_rules_by_selector( ...$baselines );
		$result   = array();
		foreach ( (array) $rules as $rule ) {
			if ( empty( $rule['selector'] ) || ! isset( $rule['styles'] ) || ! is_array( $rule['styles'] ) ) {
				continue;
			}
			$baseline_styles = $baseline[ $rule['selector'] ] ?? array();
			$styles          = array();
			foreach ( $rule['styles'] as $prop => $value ) {
				if ( ! array_key_exists( $prop, $baseline_styles ) || $baseline_styles[ $prop ] !== $value ) {
					$styles[ $prop ] = $value;
				}
			}
			if ( ! empty( $styles ) ) {
				$result[] = array(
					'selector' => $rule['selector'],
					'styles'   => $styles,
				);
			}
		}
		return $result;
	}

	/**
	 * Wrap CSS in media query.
	 *
	 * Mirrors: cssUtils.js wrapInMediaQuery() — returns an empty string for empty
	 * CSS so a fully-deduplicated breakpoint emits no `@media` block.
	 *
	 * @param string $css         CSS string.
	 * @param int    $breakpoint  Breakpoint value.
	 * @return string CSS wrapped in media query, or empty string.
	 */
	private function wrap_in_media_query( $css, $breakpoint ) {
		if ( '' === trim( (string) $css ) ) {
			return '';
		}
		return "@media only screen and (max-width: {$breakpoint}px) {\n{$css}\n}";
	}
}
