<?php
/**
 * Layout / visibility dynamic-CSS generators (PHP side).
 *
 * Mirrors the layout + visibility branch of the JS editor module
 * `blocks/blocks/shared/styles/layoutDynamicCss.js`. Layer-5 builders: the
 * Swiper flex wrapper + align-items, and the per-device visibility
 * `display:none`. Any change here MUST land on the JS side in the same commit —
 * the css-parity harness catches a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Swiper-wrapper flex base rule + per-device visibility rule.
 */
trait LayoutCss {

	/**
	 * Build the Swiper flex-wrapper base rule.
	 *
	 * Mirrors: layoutDynamicCss.js generateLayoutStyles().
	 *
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function layout_base_styles() {
		$attributes      = $this->attributes;
		$layout_options  = $attributes['layoutOptions'] ?? array();
		$slider_options  = $attributes['sliderOptions'] ?? array();
		$adaptive_height = ! empty( $slider_options['adaptiveHeight'] );
		$align_items     = isset( $layout_options['alignItems'] ) && is_string( $layout_options['alignItems'] )
			? $layout_options['alignItems']
			: 'center';

		$wrapper_flex_styles = array( 'display' => 'flex' );
		// Adaptive height: Swiper applies align-items on .swiper-autoheight .swiper-wrapper — avoid overriding.
		if ( ! $adaptive_height ) {
			$wrapper_flex_styles['align-items'] = $align_items;
		}

		return array(
			array(
				'selector' => $this->unique_id . ' .swiper-wrapper',
				'styles'   => $wrapper_flex_styles,
			),
		);
	}

	/**
	 * Build the per-device visibility rule (display:none when hidden on device).
	 *
	 * Mirrors: layoutDynamicCss.js generateVisibilityRules().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function layout_responsive_rules( $device_type ) {
		$advanced_options = $this->attributes['advancedOptions'] ?? array();

		$hide_on_device = array(
			'Desktop' => isset( $advanced_options['visibilityDesktop'] ) && false === $advanced_options['visibilityDesktop'],
			'Tablet'  => isset( $advanced_options['visibilityTablet'] ) && false === $advanced_options['visibilityTablet'],
			'Mobile'  => isset( $advanced_options['visibilityMobile'] ) && false === $advanced_options['visibilityMobile'],
		);
		$show_on_device = array(
			'Desktop' => false,
			'Tablet'  => ! $hide_on_device['Tablet'] && $hide_on_device['Desktop'],
			'Mobile'  => ! $hide_on_device['Mobile'] && ( $hide_on_device['Desktop'] || $hide_on_device['Tablet'] ),
		);

		if ( $hide_on_device[ $device_type ] ?? false ) {
			return array(
				array(
					'selector' => $this->unique_id,
					'styles'   => array( 'display' => 'none' ),
				),
			);
		}

		if ( $show_on_device[ $device_type ] ?? false ) {
			return array(
				array(
					'selector' => $this->unique_id,
					'styles'   => array( 'display' => 'block' ),
				),
			);
		}

		return array();
	}


	/**
	 * Advanced General-tab background on the block root wrapper.
	 *
	 * Static-first: emits nothing for the default (transparent) or an empty
	 * value. Mirrors: layoutDynamicCss.js generateAdvancedBackgroundRules().
	 *
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function advanced_background_rules() {
		$advanced_options    = $this->attributes['advancedOptions'] ?? array();
		$advanced_background = $advanced_options['background'] ?? array();
		$style               = $advanced_background['style'] ?? '';

		if ( '' === $style || 'transparent' === $style ) {
			return array();
		}

		$value = $this->get_bg_value( $advanced_background );
		if ( '' === $value ) {
			return array();
		}

		return array(
			array(
				'selector' => $this->unique_id,
				'styles'   => array( 'background' => $value ),
			),
		);
	}

	/**
	 * Advanced General-tab responsive spacing: margin on the root wrapper,
	 * padding on the inner content wrapper. Reuses the shared spacing pipeline
	 * (skip when empty / all-zero).
	 *
	 * Mirrors: layoutDynamicCss.js generateAdvancedSpacingRules().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function advanced_spacing_rules( $device_type ) {
		$rules            = array();
		$advanced_options = $this->attributes['advancedOptions'] ?? array();
		$advanced_margin  = $advanced_options['margin'] ?? array();
		$advanced_padding = $advanced_options['padding'] ?? array();

		if ( ! empty( $advanced_margin ) && $this->has_spacing_changed( $advanced_margin ) ) {
			$margin = $this->spacing_generate( $advanced_margin, $device_type );
			if ( $margin && ! $this->is_zero_spacing_value( $margin ) ) {
				$rules[] = array(
					'selector' => $this->unique_id,
					'styles'   => array( 'margin' => $margin ),
				);
			}
		}

		if ( ! empty( $advanced_padding ) && $this->has_spacing_changed( $advanced_padding ) ) {
			$padding = $this->spacing_generate( $advanced_padding, $device_type );
			if ( $padding && ! $this->is_zero_spacing_value( $padding ) ) {
				$rules[] = array(
					'selector' => $this->unique_id . ' > .wpcp-block-inner',
					'styles'   => array( 'padding' => $padding ),
				);
			}
		}

		return $rules;
	}
}
