<?php
/**
 * Hover Animations — shared effect-class + gating logic (PHP side).
 *
 * 1:1 mirror of `blocks/blocks/shared/utils/effectClasses.js` so the PHP
 * frontend renderer and the React editor preview emit identical effect classes
 * and overlay/child DOM. Camel-case effect values (`slideInFromLeft`,
 * `fadeInUp`) are kept by `sanitize_html_class()`. See
 * `docs/hover-animations-implementation.md`.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

defined( 'ABSPATH' ) || exit;

/**
 * EffectClasses class.
 */
class EffectClasses {

	/**
	 * Orientations where the text content overlays the media and is sensibly
	 * hidden until hover. Single source of truth for "Display Content on Hover
	 * Only" and the Content-axis hover reveal; 1:1 mirror of
	 * `CONTENT_HOVER_ORIENTATIONS` in `effectClasses.js`. Classic (below-image
	 * flow) is intentionally excluded.
	 *
	 * @var string[]
	 */
	const CONTENT_HOVER_ORIENTATIONS = array( 'overlay', 'diagonal' );

	/**
	 * Whether an orientation supports the hover-reveal content behavior.
	 *
	 * @param string $content_orientation Resolved content orientation.
	 * @return bool
	 */
	public static function is_content_hover_orientation( string $content_orientation ): bool {
		return in_array( $content_orientation, self::CONTENT_HOVER_ORIENTATIONS, true );
	}

	/**
	 * Whether an effect value is a real (non-empty, non-"none") selection.
	 *
	 * @param mixed $value Stored effect value.
	 * @return bool
	 */
	private static function is_active_effect( $value ): bool {
		return is_string( $value ) && '' !== $value && 'none' !== $value;
	}

	/**
	 * Whether the Custom (three-axis) mode is active.
	 *
	 * @param array $effects_options effectsOptions attribute branch.
	 * @return bool
	 */
	private static function is_custom( array $effects_options ): bool {
		return isset( $effects_options['effectType'] ) && 'custom' === $effects_options['effectType'];
	}

	/**
	 * The Content axis animates the overlay TEXT reveal, so it applies only to the
	 * overlay-style orientations (overlay/diagonal) AND when the content is
	 * revealed on hover. Image Hover, Premade, and Overlay are exempt — the Overlay
	 * axis is a self-contained layer that animates in on hover (matching the source
	 * "Image Overlay Hover Effects"), independent of the content reveal.
	 *
	 * @param string $content_orientation Resolved content orientation.
	 * @param bool   $display_on_hover    contentOptions.displayOnHover.
	 * @return bool
	 */
	public static function is_overlay_content_gate_open( string $content_orientation, bool $display_on_hover ): bool {
		return self::is_content_hover_orientation( $content_orientation ) && true === $display_on_hover;
	}

	/**
	 * Normalize a stored or registered block name to the short slug.
	 *
	 * @param string $block_name Block name or `wp-carousel-pro/{slug}`.
	 * @return string Short block slug.
	 */
	private static function normalize_block_name( string $block_name ): string {
		return (string) preg_replace( '/^wp-carousel-pro\//', '', $block_name );
	}

	/**
	 * Blocks that show one active slide at a time (Slider / Thumbnails-Slider).
	 * Their Effects panel is hidden, so per-item hover effects are suppressed and
	 * content animates on slide activation instead. Mirrors `isOneSlideBlock()`
	 * in effectClasses.js.
	 *
	 * @param string $block_name Block name.
	 * @return bool Whether the block is a one-slide-at-a-time slider.
	 */
	private static function is_one_slide_block( string $block_name ): bool {
		$name = self::normalize_block_name( $block_name );
		return 'slider' === $name || 'thumbnails-slider' === $name;
	}

	/**
	 * Effect classes for `.wpcp-item-inner` (image hover + premade + overlay). The
	 * Overlay axis is self-contained — it renders an overlay layer that animates in
	 * on hover in any orientation, so it is NOT subject to the content-reveal gate.
	 *
	 * @param array  $effects_options effectsOptions attribute branch.
	 * @param string $block_name      Block name — suppresses the image-hover axis
	 *                                for the one-slide slider blocks (their Effects
	 *                                panel is hidden, so the default zoom would be
	 *                                uncontrollable).
	 * @return string[]
	 */
	public static function inner_classes( array $effects_options, string $block_name = '' ): array {
		$classes        = array();
		$premade_active = ! self::is_custom( $effects_options )
			&& self::is_active_effect( $effects_options['animationEffect'] ?? '' );

		// Image hover is scoped to Custom mode only. Keep stored values intact when
		// the user switches to Premade so returning to Custom restores the choice.
		if ( self::is_custom( $effects_options ) && ! self::is_one_slide_block( $block_name ) ) {
			$image_hover = ( isset( $effects_options['imageHover'] ) && '' !== $effects_options['imageHover'] )
				? $effects_options['imageHover']
				: 'zoom';
			$classes[]   = 'wpcp-hover-' . sanitize_html_class( $image_hover );
		}

		// Premade composite — its own mode, ungated.
		if ( $premade_active ) {
			$classes[] = 'wpcp-anim-' . sanitize_html_class( $effects_options['animationEffect'] );
		}

		// Overlay — Custom mode, self-contained (animates an overlay layer in on
		// hover, like the source artifact); works in any orientation, ungated.
		if ( self::is_custom( $effects_options ) && self::is_active_effect( $effects_options['overlayEffect'] ?? '' ) ) {
			$classes[] = 'wpcp-has-overlay-anim';
			$classes[] = 'wpcp-overlay-anim-' . sanitize_html_class( $effects_options['overlayEffect'] );
		}

		return $classes;
	}

	/**
	 * Content-animation class for `.wpcp-item-content` (Custom mode, gated).
	 *
	 * @param array  $effects_options     effectsOptions attribute branch.
	 * @param string $content_orientation Resolved content orientation.
	 * @param bool   $display_on_hover    contentOptions.displayOnHover.
	 * @return string Content class, or '' when inactive/gated.
	 */
	public static function content_class( array $effects_options, string $content_orientation, bool $display_on_hover ): string {
		if ( self::is_custom( $effects_options )
			&& self::is_active_effect( $effects_options['contentAnimation'] ?? '' )
			&& self::is_overlay_content_gate_open( $content_orientation, $display_on_hover ) ) {
			return 'wpcp-content-anim-' . sanitize_html_class( $effects_options['contentAnimation'] );
		}
		return '';
	}

	/**
	 * Whether an animated overlay layer should render — true whenever a
	 * Custom-mode overlay effect is selected (self-contained, ungated).
	 *
	 * @param array $effects_options effectsOptions attribute branch.
	 * @return bool
	 */
	public static function has_overlay_anim_layer( array $effects_options ): bool {
		return self::is_custom( $effects_options )
			&& self::is_active_effect( $effects_options['overlayEffect'] ?? '' );
	}

	/**
	 * Build the `.wpcp-overlay-anim-layer` markup for the active overlay effect,
	 * or '' when no layer is needed. Mirrors the editor preview's overlay-layer
	 * node.
	 *
	 * @param array $effects_options effectsOptions attribute branch.
	 * @return string
	 */
	public static function overlay_anim_layer_html( array $effects_options ): string {
		if ( ! self::has_overlay_anim_layer( $effects_options ) ) {
			return '';
		}
		return '<div class="wpcp-overlay-anim-layer" aria-hidden="true"></div>';
	}
}
