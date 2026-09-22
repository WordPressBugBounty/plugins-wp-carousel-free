<?php
/**
 * WP Carousel Pro - Server-Side Dynamic CSS Composer
 *
 * Thin composer mirroring the JS composer carouselDynamicCss.js: it walks the
 * style config for `--wpcp-*` token bags (the static-first path) and assembles
 * the per-feature Layer-5 rule builders, each of which lives in its own
 * `Concerns/*Css.php` trait (mirrored by a `*DynamicCss.js` module on the JS
 * side). Any change to a builder MUST land on both sides in the same commit; the
 * css-parity harness in `tests/css-parity/` catches a one-sided edit.
 *
 * Architecture:
 * - Single unified class (not split into 6 block classes)
 * - Per-concern traits under Concerns/ mirror the JS concern modules
 * - Handles all 6 block types: carousel, slider, thumbnails-slider,
 *   tiles
 *
 * @since 4.2.4
 * @version 1.0.0
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles;

use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\BackgroundCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\BorderCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\ButtonCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\CssUtils;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\ImageCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\LayoutCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\RangerCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\SelectorsCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\ShadowCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\SliderCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\SocialCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\SpacingCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\TaxonomyCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\ThumbnailsSliderCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\TilesCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\ContentAreaCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\TypographyCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns\VideoCss;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\Tokens\EmitTokens;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	die;
}

/**
 * Class CarouselDynamicCss
 *
 * Unified dynamic CSS composer for all carousel block types.
 * Mirrors the JavaScript carouselDynamicCss.js implementation.
 */
class CarouselDynamicCss {

	use BackgroundCss;
	use BorderCss;
	use ButtonCss;
	use CssUtils;
	use ImageCss;
	use LayoutCss;
	use RangerCss;
	use SelectorsCss;
	use ShadowCss;
	use SliderCss;
	use SocialCss;
	use SpacingCss;
	use TaxonomyCss;
	use ThumbnailsSliderCss;
	use TilesCss;
	use ContentAreaCss;
	use TypographyCss;
	use VideoCss;

	/**
	 * Breakpoint constants — backwards-compatibility aliases.
	 *
	 * Canonical values live in {@see Breakpoints} and are mirrored on the JS
	 * side at `blocks/blocks/shared/styles/constants.js`.
	 */
	const TABLET_BREAKPOINT = Breakpoints::TABLET;
	const MOBILE_BREAKPOINT = Breakpoints::MOBILE;

	/**
	 * Tiles-grid collapse breakpoint aliases.
	 *
	 * Canonical values live in {@see Breakpoints} and are mirrored on the JS
	 * side at `blocks/blocks/shared/styles/constants.js`.
	 */
	const TILES_COLLAPSE_TABLET_BREAKPOINT = Breakpoints::TILES_COLLAPSE_TABLET;
	const TILES_COLLAPSE_MOBILE_BREAKPOINT = Breakpoints::TILES_COLLAPSE_MOBILE;

	/**
	 * Block attributes.
	 *
	 * @var array
	 */
	private $attributes;

	/**
	 * Constructor.
	 *
	 * @param array $attributes Block attributes.
	 */
	public function __construct( $attributes ) {
		$this->attributes = $attributes;
		$this->create_selectors();
	}

	/**
	 * Generate complete CSS string (desktop + tablet + mobile).
	 *
	 * Mirrors: carouselDynamicCss.js main function
	 *
	 * @return string Complete CSS string.
	 */
	public function generate() {
		$uid   = isset( $this->attributes['uniqueId'] ) ? (string) $this->attributes['uniqueId'] : '';
		$clean = preg_replace( '/[^a-zA-Z0-9_-]/', '', $uid );
		if ( ! is_string( $clean ) || '' === $clean ) {
			return '';
		}

		// Config-driven token bags (carousel feature rows only — pagination is scoped
		// separately via NavigationBuilder::render_pagination_dynamic_css()).
		$carousel_config = array_values(
			array_filter(
				StyleConfig::all(),
				static function ( $row ) {
					return is_array( $row ) && isset( $row['id'] ) && 0 !== strpos( (string) $row['id'], 'pag-' );
				}
			)
		);
		$token_bags      = ( new EmitTokens() )->emit( $carousel_config, $this->attributes );

		// Desktop CSS - combine base styles with device-specific styles.
		$desktop_merged     = $this->merge_css_rules_by_selector(
			array_merge(
				$this->base_styles(),
				$this->responsive_css( 'Desktop' ),
				$this->token_bag_rules( $token_bags, 'Desktop' )
			)
		);
		$desktop_css_string = $this->object_to_css_string( $desktop_merged );

		// Tablet CSS - only the declarations that differ from Desktop.
		$tablet_merged     = $this->merge_css_rules_by_selector(
			array_merge(
				$this->responsive_css( 'Tablet' ),
				$this->token_bag_rules( $token_bags, 'Tablet' )
			)
		);
		$tablet_deduped    = $this->drop_rules_matching_baseline( $tablet_merged, array( $desktop_merged ) );
		$tablet_css_string = $this->wrap_in_media_query(
			$this->object_to_css_string( $tablet_deduped ),
			self::TABLET_BREAKPOINT
		);

		// Mobile CSS - only the declarations that differ from the Tablet/Desktop cascade.
		$mobile_merged     = $this->merge_css_rules_by_selector(
			array_merge(
				$this->responsive_css( 'Mobile' ),
				$this->token_bag_rules( $token_bags, 'Mobile' )
			)
		);
		$mobile_deduped    = $this->drop_rules_matching_baseline( $mobile_merged, array( $desktop_merged, $tablet_merged ) );
		$mobile_css_string = $this->wrap_in_media_query(
			$this->object_to_css_string( $mobile_deduped ),
			self::MOBILE_BREAKPOINT
		);

		return trim(
			$desktop_css_string . ' ' . $tablet_css_string . ' ' . $mobile_css_string . ' ' . $this->tiles_collapse_css() . ' ' . $this->custom_css( $this->unique_id )
		);
	}

	/**
	 * Per-instance custom CSS with the `selector` keyword swapped for the wrapper.
	 *
	 * Mirrors: applyCustomCss.js — keep the replace rule byte-identical.
	 *
	 * @param string $wrapper Instance root selector (#{uniqueId}).
	 * @return string Ready-to-emit CSS, or '' when empty.
	 */
	private function custom_css( $wrapper ) {
		$advanced = $this->attributes['advancedOptions'] ?? array();
		$css      = is_array( $advanced ) && isset( $advanced['customCss'] ) ? $advanced['customCss'] : '';
		if ( ! is_string( $css ) ) {
			return '';
		}

		$trimmed = trim( $css );
		if ( '' === $trimmed ) {
			return '';
		}

		// Defense-in-depth: strip </style so a payload cannot break out of <style>.
		$stripped = preg_replace( '/<\/style/i', '', $trimmed );
		if ( ! is_string( $stripped ) ) {
			return '';
		}

		// Plain global swap of every `selector` occurrence — mirrors applyCustomCss.js
		// (str_replace ↔ String.split/join, both literal; not CSS-aware).
		return str_replace( 'selector', (string) $wrapper, $stripped );
	}

	/**
	 * Wrap one device's config-driven `--wpcp-*` token bag as scoped static-consumer rules.
	 *
	 * Mirrors: carouselDynamicCss.js tokenBagRules().
	 *
	 * @param array  $token_bags Per-device token bags from EmitTokens::emit().
	 * @param string $device     Device key ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules for the wrapper and any token-specific closer selectors.
	 */
	private function token_bag_rules( $token_bags, $device ) {
		$bag = $token_bags[ $device ] ?? array();
		if ( empty( $bag ) ) {
			return array();
		}

		$rules             = array();
		$wrapper_bag       = $bag;
		$overlay_offset    = $wrapper_bag['--wpcp-overlay-offset'] ?? null;
		$overlay_icon_bag  = array();
		$click_action_wrap = $this->unique_id . ' .wpcp-overlay-icons';
		$click_action_icon = $this->unique_id . ' .wpcp-overlay-icon.wpcp-lightbox-icon, ' . $this->unique_id . ' .wpcp-overlay-icon.wpcp-link-icon';

		foreach ( $wrapper_bag as $token => $value ) {
			if ( 0 === strpos( (string) $token, '--wpcp-click-' ) ) {
				$overlay_icon_bag[ $token ] = $value;
			}
		}

		if ( isset( $wrapper_bag['--wpcp-icon-size'] ) ) {
			$overlay_icon_bag['--wpcp-icon-size'] = $wrapper_bag['--wpcp-icon-size'];
		}

		unset( $wrapper_bag['--wpcp-overlay-offset'] );
		foreach ( array_keys( $overlay_icon_bag ) as $token ) {
			unset( $wrapper_bag[ $token ] );
		}

		if ( ! empty( $wrapper_bag ) ) {
			$rules[] = array(
				'selector' => $this->unique_id,
				'styles'   => $wrapper_bag,
			);
		}
		if ( null !== $overlay_offset ) {
			$rules[] = array(
				'selector' => $click_action_wrap,
				'styles'   => array(
					'--wpcp-overlay-offset' => $overlay_offset,
				),
			);
		}
		if ( ! empty( $overlay_icon_bag ) ) {
			$rules[] = array(
				'selector' => $click_action_icon,
				'styles'   => $overlay_icon_bag,
			);
		}

		return $rules;
	}

	/**
	 * Generate base styles (non-device-specific).
	 *
	 * Mirrors: carouselDynamicCss.js getCarouselStyleRules('base', attributes).
	 * Thin orchestrator — each feature's rules come from its Concerns trait.
	 *
	 * @return array Base CSS rules.
	 */
	private function base_styles() {
		$base_styles = $this->advanced_background_rules();
		$base_styles = array_merge( $base_styles, $this->content_area_base_styles() );
		$base_styles = array_merge( $base_styles, $this->image_base_styles() );
		$base_styles = array_merge( $base_styles, $this->button_base_styles() );
		$base_styles = array_merge( $base_styles, $this->taxonomy_base_styles() );
		$base_styles = array_merge( $base_styles, $this->social_base_styles() );
		$base_styles = array_merge( $base_styles, $this->layout_base_styles() );

		$video_options = $this->attributes['videoOptions'] ?? array();
		$base_styles   = array_merge( $base_styles, $this->video_base_styles( $video_options ) );

		if ( $this->is_tiles_block() ) {
			$base_styles = array_merge( $base_styles, $this->tiles_base_styles() );
		}
		if ( $this->is_thumbnails_slider_block() ) {
			$base_styles = array_merge( $base_styles, $this->thumbnails_slider_base_styles() );
		}
		if ( $this->is_slider_block() ) {
			$base_styles = array_merge(
				$base_styles,
				$this->slider_base_styles(),
				$this->slider_aspect_ratio_styles()
			);
		}

		return $base_styles;
	}

	/**
	 * Generate device-specific CSS rules.
	 *
	 * Mirrors: carouselDynamicCss.js getCarouselStyleRules(deviceType, attributes).
	 * Thin orchestrator — each feature's rules come from its Concerns trait.
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules for the device.
	 */
	private function responsive_css( $device_type ) {
		$rules = $this->typography_responsive_rules( $device_type );
		$rules = array_merge( $rules, $this->button_responsive_rules( $device_type ) );
		$rules = array_merge( $rules, $this->taxonomy_responsive_rules( $device_type ) );
		$rules = array_merge( $rules, $this->content_area_card_responsive_rules( $device_type ) );
		$rules = array_merge( $rules, $this->image_responsive_rules( $device_type ) );
		$rules = array_merge( $rules, $this->social_responsive_rules( $device_type ) );
		$rules = array_merge( $rules, $this->layout_responsive_rules( $device_type ) );
		$rules = array_merge( $rules, $this->advanced_spacing_rules( $device_type ) );

		$video_options = $this->attributes['videoOptions'] ?? array();
		$rules         = array_merge( $rules, $this->video_responsive_rules( $video_options, $device_type ) );

		if ( $this->is_tiles_block() ) {
			$rules = array_merge( $rules, $this->tiles_responsive_rules( $device_type ) );
		}
		if ( $this->is_thumbnails_slider_block() ) {
			$rules = array_merge( $rules, $this->thumbnails_slider_responsive_rules( $device_type ) );
		}
		if ( $this->is_slider_block() ) {
			$rules = array_merge( $rules, $this->slider_responsive_rules( $device_type ) );
		}

		return $rules;
	}
}
