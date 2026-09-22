<?php
/**
 * Taxonomy dynamic-CSS generators (PHP side).
 *
 * Mirrors the taxonomy branch of the JS editor module
 * `blocks/blocks/shared/styles/taxonomyDynamicCss.js`. Text/background colors
 * (normal + hover) + box-shadow are token-driven from static SCSS; the
 * rule-string builders here are the Layer-5 remainder — border, gap (with the
 * legacy stale-default literals), border-radius, padding. Any change here
 * MUST land on the JS side in the same commit — the css-parity harness
 * catches a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

defined( 'ABSPATH' ) || exit;

/**
 * Taxonomy border/gap base rules + responsive padding/gap/radius.
 */
trait TaxonomyCss {

	/**
	 * Build base CSS rules for taxonomy border + gap.
	 *
	 * Mirrors: taxonomyDynamicCss.js generateTaxonomyBaseStyles().
	 *
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function taxonomy_base_styles() {
		$base_styles      = array();
		$taxonomy_options = $this->attributes['taxonomyOptions'] ?? array();

		// Taxonomy - Border (style/color/width shared across normal/hover; only color differs).
		$cate_border       = $taxonomy_options['cateBorder'] ?? array();
		$cate_border_style = $cate_border['style'] ?? '';
		if ( $cate_border_style && 'none' !== $cate_border_style ) {
			$cate_width_css = $this->spacing_generate( $taxonomy_options['cateBorderWidth'] ?? array(), 'Desktop' );
			if ( $cate_width_css ) {
				$base_styles[] = array(
					'selector' => $this->taxonomy_selector,
					'styles'   => array(
						'border-style' => $cate_border_style,
						'border-color' => $cate_border['color'] ?? '',
						'border-width' => $cate_width_css,
					),
				);
			}
			if ( ! empty( $cate_border['hoverColor'] ) ) {
				$base_styles[] = array(
					'selector' => $this->taxonomy_selector_hover,
					'styles'   => array( 'border-color' => $cate_border['hoverColor'] ),
				);
			}
		}

		// Taxonomy - Gap between items (flex parent is `.wpcp-taxonomy-wrapper`; legacy scalar `gap` is px).
		if ( ! empty( $taxonomy_options['gap'] ) && 8 !== $taxonomy_options['gap'] ) {
			$base_styles[] = array(
				'selector' => $this->taxonomy_wrapper_selector,
				'styles'   => array( 'gap' => $taxonomy_options['gap'] . 'px' ),
			);
		}

		return $base_styles;
	}

	/**
	 * Build responsive CSS rules for taxonomy padding/gap/radius.
	 *
	 * Mirrors: taxonomyDynamicCss.js generateTaxonomyResponsiveRules().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function taxonomy_responsive_rules( $device_type ) {
		$rules            = array();
		$taxonomy_options = $this->attributes['taxonomyOptions'] ?? array();

		if ( ! empty( $taxonomy_options['padding'] ) && $this->has_spacing_changed( $taxonomy_options['padding'] ) ) {
			$tax_pad = $this->spacing_generate( $taxonomy_options['padding'], $device_type );
			if ( $tax_pad ) {
				$rules[] = array(
					'selector' => $this->taxonomy_selector,
					'styles'   => array( 'padding' => $tax_pad ),
				);
			}
		}

		$tax_gap_src = $taxonomy_options['taxGap'] ?? $taxonomy_options['gap'] ?? null;
		if ( is_array( $tax_gap_src ) && isset( $tax_gap_src['device'][ $device_type ] ) ) {
			$tg_val = $tax_gap_src['device'][ $device_type ];
			$tg_un  = isset( $tax_gap_src['unit'][ $device_type ] ) && is_string( $tax_gap_src['unit'][ $device_type ] )
				? $tax_gap_src['unit'][ $device_type ]
				: 'px';
			if ( '' !== $tg_val && null !== $tg_val ) {
				$rules[] = array(
					'selector' => $this->taxonomy_wrapper_selector,
					'styles'   => array( 'gap' => $tg_val . $tg_un ),
				);
			}
		}

		// Taxonomy - Border Radius (supports scalar and responsive formats).
		$taxonomy_border_radius = $taxonomy_options['borderRadius'] ?? null;
		if ( is_array( $taxonomy_border_radius ) ) {
			$taxonomy_border_radius = $this->spacing_generate( $taxonomy_border_radius, $device_type, false );
		} elseif ( '' !== $taxonomy_border_radius && null !== $taxonomy_border_radius ) {
			$taxonomy_border_radius = $taxonomy_border_radius . 'px';
		}
		if ( ! empty( $taxonomy_border_radius ) && '4px' !== $taxonomy_border_radius ) {
			$rules[] = array(
				'selector' => $this->taxonomy_selector,
				'styles'   => array( 'border-radius' => $taxonomy_border_radius ),
			);
		}

		return $rules;
	}
}
