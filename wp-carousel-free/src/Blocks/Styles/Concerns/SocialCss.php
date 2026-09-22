<?php
/**
 * Social-share dynamic-CSS generators (PHP side).
 *
 * Mirrors the social branch of the JS editor module
 * `blocks/blocks/shared/styles/socialDynamicCss.js`. Layer-5 rule-string
 * builders: icon fill/background colors (gated on `customStyling`) and the
 * per-device size/area/gap/radius/margin. Any change here MUST land on the JS
 * side in the same commit — the css-parity harness catches a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Social custom colors base rules + responsive icon/area/gap/radius/margin.
 */
trait SocialCss {

	/**
	 * Build base CSS rules for social custom-styling colors (normal + hover).
	 *
	 * Mirrors: socialDynamicCss.js generateSocialBaseStyles().
	 *
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function social_base_styles() {
		$base_styles          = array();
		$social_share_options = $this->attributes['socialShareOptions'] ?? array();

		// Social Share - Custom Styling Colors (Normal).
		if ( ! empty( $social_share_options['customStyling'] ) ) {
			// Framed view keeps the background transparent (static CSS) and colors the
			// outline instead, so iconBg/iconHoverBg drive border-color there.
			$icon_view     = $social_share_options['iconView'] ?? 'stacked';
			$fill_property = 'framed' === $icon_view ? 'border-color' : 'background-color';

			if ( ! empty( $social_share_options['iconColor'] ) ) {
				$base_styles[] = array(
					'selector' => $this->social_selector . ' .wpcp-social-share-link svg',
					'styles'   => array( 'fill' => $social_share_options['iconColor'] ),
				);
			}
			if ( ! empty( $social_share_options['iconBg'] ) ) {
				$base_styles[] = array(
					'selector' => $this->social_selector . ' .wpcp-social-share-link',
					'styles'   => array( $fill_property => $social_share_options['iconBg'] ),
				);
			}
			// Hover colors.
			if ( ! empty( $social_share_options['iconHoverColor'] ) ) {
				$base_styles[] = array(
					'selector' => $this->social_selector . ' .wpcp-social-share-link:hover svg',
					'styles'   => array( 'fill' => $social_share_options['iconHoverColor'] ),
				);
			}
			if ( ! empty( $social_share_options['iconHoverBg'] ) ) {
				$base_styles[] = array(
					'selector' => $this->social_selector . ' .wpcp-social-share-link:hover',
					'styles'   => array( $fill_property => $social_share_options['iconHoverBg'] ),
				);
			}
		}

		return $base_styles;
	}

	/**
	 * Build responsive CSS rules for social icon/area/gap/radius/margin.
	 *
	 * Mirrors: socialDynamicCss.js generateSocialResponsiveRules().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function social_responsive_rules( $device_type ) {
		$rules                = array();
		$social_share_options = $this->attributes['socialShareOptions'] ?? array();

		// Social Share - Responsive Icon Size / Area / Gap (SPRangeControl: device + unit maps).
		$social_defaults = array(
			'Desktop' => array(
				'icon' => 20,
				'area' => 40,
				'gap'  => 10,
			),
			'Tablet'  => array(
				'icon' => 18,
				'area' => 36,
				'gap'  => 8,
			),
			'Mobile'  => array(
				'icon' => 16,
				'area' => 32,
				'gap'  => 6,
			),
		);
		$sdef            = $social_defaults[ $device_type ] ?? $social_defaults['Desktop'];

		$icon_dim = $this->social_ranger_dimension( $social_share_options['iconSize'] ?? null, $device_type );
		if ( $icon_dim ) {
			$css_icon         = $icon_dim[0] . $icon_dim[1];
			$default_icon_css = $sdef['icon'] . 'px';
			if ( $css_icon !== $default_icon_css ) {
				$rules[] = array(
					'selector' => $this->social_selector . ' svg',
					'styles'   => array(
						'width'  => $css_icon,
						'height' => $css_icon,
					),
				);
			}
		}

		$area_dim  = $this->social_ranger_dimension( $social_share_options['iconAreaSize'] ?? null, $device_type );
		$icon_view = $social_share_options['iconView'] ?? 'stacked';
		if ( 'normal' !== $icon_view && $area_dim ) {
			$css_area         = $area_dim[0] . $area_dim[1];
			$default_area_css = $sdef['area'] . 'px';
			if ( $css_area !== $default_area_css ) {
				$rules[] = array(
					'selector' => $this->social_selector . ' .wpcp-social-share-link',
					'styles'   => array(
						'width'  => $css_area,
						'height' => $css_area,
					),
				);
			}
		}

		$gap_dim = $this->social_ranger_dimension( $social_share_options['gap'] ?? null, $device_type );
		if ( $gap_dim ) {
			$css_gap         = $gap_dim[0] . $gap_dim[1];
			$default_gap_css = $sdef['gap'] . 'px';
			if ( $css_gap !== $default_gap_css ) {
				$rules[] = array(
					'selector' => $this->social_selector,
					'styles'   => array( 'gap' => $css_gap ),
				);
			}
		}

		// Social Share - Border Radius (responsive) on share links, not the list.
		if ( ! empty( $social_share_options['borderRadius'] ) && $this->has_spacing_changed( $social_share_options['borderRadius'] ) ) {
			$border_radius = $this->spacing_generate( $social_share_options['borderRadius'], $device_type );
			if ( $border_radius ) {
				$rules[] = array(
					'selector' => $this->social_selector . ' .wpcp-social-share-link',
					'styles'   => array( 'border-radius' => $border_radius ),
				);
			}
		}

		// Social Share - Margin (responsive).
		if ( ! empty( $social_share_options['margin'] ) && $this->has_spacing_changed( $social_share_options['margin'] ) ) {
			$margin = $this->spacing_generate( $social_share_options['margin'], $device_type );
			if ( $margin && ! $this->is_zero_spacing_value( $margin ) ) {
				$rules[] = array(
					'selector' => $this->social_selector,
					'styles'   => array( 'margin' => $margin ),
				);
			}
		}

		return $rules;
	}
}
