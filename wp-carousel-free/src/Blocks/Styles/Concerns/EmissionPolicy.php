<?php
/**
 * Shared emission policy (PHP side) — the single contract that decides whether an
 * attribute value becomes dynamic CSS.
 *
 * Mirrors the JS editor module `blocks/blocks/shared/styles/cssRuleHelpers.js`
 * (`shouldEmit` / `hasResolvedOptionValue`) decision-for-decision. The css-parity
 * value-map gate and the EmissionPolicy fixtures
 * (`tests/css-parity/fixtures/emission-policy.json`, run by both a JS and a PHP
 * runner) assert both sides decide identically for the same inputs. Any change
 * here MUST land on the JS side in the same commit.
 *
 * Decision table — should_emit( $value, $schema_default ):
 *   null / '' (and JS undefined)                  → no   (unset)
 *   NaN, or a string built from an absent number
 *     such as "undefinedpx" / "NaN%"              → no   (invalid; browsers drop it)
 *   $value === $schema_default                     → no   (covers 0 when default 0)
 *   0 with a non-zero default, or with no default  → yes
 *   any other present value (incl. false)          → yes
 *
 * Editor-only chrome is excluded at the call site /
 * corpus, not here.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Pure emit/suppress decisions consumed by the token emitter and the per-concern
 * CSS generators. Stateless — every method depends only on its arguments.
 */
trait EmissionPolicy {

	/**
	 * Whether a composed value string interpolated an absent number — e.g.
	 * "{$undefined}px" → "undefinedpx", "{$nan}%" → "NaN%". No legitimate CSS
	 * value starts this way. Mirrors cssRuleHelpers.js isComposedInvalidValue().
	 *
	 * @param mixed $value Candidate value.
	 * @return bool True when the string is an absent-number artifact.
	 */
	private function is_composed_invalid_value( $value ) {
		return is_string( $value ) && 1 === preg_match( '/^(?:undefined|NaN)/', $value );
	}

	/**
	 * Whether a control value is present: not null, not empty string, not NaN.
	 * Allows 0 and false. Mirrors cssRuleHelpers.js hasResolvedOptionValue().
	 *
	 * @param mixed $value Candidate value.
	 * @return bool True when the value is a resolved, present value.
	 */
	private function has_resolved_option_value( $value ) {
		if ( null === $value || '' === $value ) {
			return false;
		}
		if ( is_float( $value ) && is_nan( $value ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Canonical emission policy on a raw attribute value (the shared JS↔PHP
	 * contract). Mirrors cssRuleHelpers.js shouldEmit().
	 *
	 * @param mixed $value          Candidate value.
	 * @param mixed $schema_default Schema default; a value equal to it is suppressed.
	 *                              Defaults to null (compare on presence only).
	 * @return bool True when the value should produce dynamic CSS.
	 */
	private function should_emit( $value, $schema_default = null ) {
		return $this->has_resolved_option_value( $value )
			&& ! $this->is_composed_invalid_value( $value )
			&& $value !== $schema_default;
	}
}
