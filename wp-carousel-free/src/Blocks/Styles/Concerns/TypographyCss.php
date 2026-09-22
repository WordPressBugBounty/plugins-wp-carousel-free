<?php
/**
 * Typography CSS primitive for the dynamic-CSS generator (PHP side).
 *
 * Mirrors the getTypographyStyles() helper (and its isDefaultOrEmptyFontFamily
 * resolver) in the JS editor module `blocks/blocks/shared/styles/cssHelpers.js`.
 * Any change here MUST land on the JS side in the same commit — the JS↔PHP parity
 * harness in `tests/css-parity/` will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Typography attribute group → CSS property map.
 */
trait TypographyCss {

	/**
	 * Sanitize a font-family name for CSS emission.
	 *
	 * Font families are free-form author strings; keep the characters a family
	 * name legitimately contains (letters, digits, spaces, quotes, commas,
	 * hyphens) and drop everything else so a smuggled url()/rule payload
	 * cannot ride the value into the emitted <style>. Mirrors
	 * sanitizeFontFamily() in cssHelpers.js.
	 *
	 * @param string $family Raw family name.
	 * @return string Safe family name, or '' when rejected.
	 */
	private function sanitize_font_family( $family ) {
		if ( ! is_string( $family ) ) {
			return '';
		}
		$family = trim( $family );
		if ( 1 !== preg_match( '/^[\w\s\'",\-]{1,120}$/u', $family ) ) {
			return '';
		}
		return $family;
	}

	/**
	 * Sanitize a font-weight value (numeric or the CSS keyword set).
	 *
	 * @param mixed $weight Raw weight.
	 * @return string Safe weight, or '' when rejected.
	 */
	private function sanitize_font_weight( $weight ) {
		if ( is_numeric( $weight ) ) {
			$numeric = (float) $weight;
			return ( 1 <= $numeric && 1000 >= $numeric ) ? (string) $weight : '';
		}
		if ( ! is_string( $weight ) ) {
			return '';
		}
		$weight   = trim( $weight );
		$keywords = array( 'normal', 'bold', 'bolder', 'lighter' );
		return in_array( strtolower( $weight ), $keywords, true ) ? $weight : '';
	}

	/**
	 * Sanitize a keyword-constrained typography sub-value (style/transform/decoration).
	 *
	 * @param mixed $value     Raw value.
	 * @param array $keywords  Allowed keyword set (lowercase).
	 * @return string Safe value, or '' when rejected.
	 */
	private function sanitize_typography_keyword( $value, array $keywords ) {
		if ( ! is_string( $value ) ) {
			return '';
		}
		$value = trim( $value );
		return in_array( strtolower( $value ), $keywords, true ) ? $value : '';
	}

	/**
	 * Resolve font-family string from typography.family (string or nested object).
	 *
	 * @param mixed $family Raw family from attributes.
	 * @return string Non-empty font name or empty string.
	 */
	private function resolve_typography_font_family( $family ) {
		if ( is_string( $family ) && '' !== trim( $family ) ) {
			return trim( $family );
		}
		if ( ! is_array( $family ) ) {
			return '';
		}
		if ( isset( $family['family'] ) && is_string( $family['family'] ) && '' !== trim( $family['family'] ) ) {
			return trim( $family['family'] );
		}
		$typo   = $family['typography']['family'] ?? null;
		$google = $family['googleFont']['family'] ?? null;
		foreach ( array( $typo, $google ) as $candidate ) {
			if ( is_string( $candidate ) && '' !== trim( $candidate ) ) {
				return trim( $candidate );
			}
		}
		return '';
	}

	/**
	 * Generate typography styles.
	 *
	 * Mirrors: cssHelpers.js getTypographyStyles()
	 *
	 * @param array $args Typography arguments.
	 * @return array Typography CSS properties.
	 */
	private function get_typography_styles( $args ) {
		$typography   = $args['typography'] ?? array();
		$font_size    = $args['fontSize'] ?? null;
		$font_spacing = $args['fontSpacing'] ?? null;
		$line_height  = $args['lineHeight'] ?? null;
		$word_spacing = $args['wordSpacing'] ?? null;
		$device       = $args['device'] ?? 'Desktop';

		$styles = array();

		$family_node = $typography['family'] ?? null;
		$fam_arr     = is_array( $family_node ) ? $family_node : array();

		// Font family — mirrors cssHelpers.js getTypographyStyles (flat + nested shapes).
		$font_family = $this->sanitize_font_family( $this->resolve_typography_font_family( $family_node ) );
		if ( '' !== $font_family ) {
			$styles['font-family'] = $font_family;
		}

		$font_weight = $this->sanitize_font_weight( $fam_arr['fontWeight'] ?? $typography['fontWeight'] ?? '' );
		if ( '' !== $font_weight ) {
			$styles['font-weight'] = $font_weight;
		}

		$style_val = $this->sanitize_typography_keyword(
			$fam_arr['style'] ?? $typography['style'] ?? '',
			array( 'italic', 'oblique' )
		);
		if ( '' !== $style_val ) {
			$styles['font-style'] = $style_val;
		}

		$transform_val = $this->sanitize_typography_keyword(
			$fam_arr['transform'] ?? $typography['transform'] ?? '',
			array( 'uppercase', 'lowercase', 'capitalize', 'full-width', 'full-size-kana' )
		);
		if ( '' !== $transform_val ) {
			$styles['text-transform'] = $transform_val;
		}

		$decoration_val = $this->sanitize_typography_keyword(
			$fam_arr['decoration'] ?? $typography['decoration'] ?? '',
			array( 'underline', 'overline', 'line-through', 'underline overline' )
		);
		if ( '' !== $decoration_val ) {
			$styles['text-decoration'] = $decoration_val;
		}

		// Font size (responsive).
		if ( is_array( $font_size ) && isset( $font_size['device'][ $device ] ) && $font_size ) {
			$size_value = $font_size['device'][ $device ];
			$size_unit  = isset( $font_size['unit'][ $device ] ) ? $font_size['unit'][ $device ] : 'px';
			if ( null !== $size_value && '' !== $size_value ) {
				$styles['font-size'] = $size_value . Css_Helpers::sanitize_css_unit( $size_unit );
			}
		}

		// Line height (responsive).
		if ( is_array( $line_height ) && isset( $line_height['device'][ $device ] ) && $line_height ) {
			$line_value = $line_height['device'][ $device ];
			if ( $line_value ) {
				$styles['line-height'] = $line_value;
			}
		}

		// Letter spacing (responsive).
		if ( is_array( $font_spacing ) && isset( $font_spacing['device'][ $device ] ) && $font_spacing ) {
			$spacing_value = $font_spacing['device'][ $device ];
			$spacing_unit  = isset( $font_spacing['unit'][ $device ] ) ? $font_spacing['unit'][ $device ] : 'px';
			if ( null !== $spacing_value && '' !== $spacing_value ) {
				$styles['letter-spacing'] = $spacing_value . Css_Helpers::sanitize_css_unit( $spacing_unit );
			}
		}

		// Word spacing (responsive).
		if ( is_array( $word_spacing ) && isset( $word_spacing['device'][ $device ] ) && $word_spacing ) {
			$word_value = $word_spacing['device'][ $device ];
			$word_unit  = isset( $word_spacing['unit'][ $device ] ) ? $word_spacing['unit'][ $device ] : 'px';
			if ( null !== $word_value && '' !== $word_value ) {
				$styles['word-spacing'] = $word_value . Css_Helpers::sanitize_css_unit( $word_unit );
			}
		}

		return $styles;
	}

	/**
	 * Build responsive typography rules for title/desc/meta/taxonomy/button/price.
	 *
	 * Mirrors: typographyDynamicCss.js generateTypographyRules() + the source-gated
	 * button typography resolution.
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function typography_responsive_rules( $device_type ) {
		$rules                = array();
		$attributes           = $this->attributes;
		$content_options      = $attributes['contentOptions'] ?? array();
		$post_content_options = $attributes['postContentOptions'] ?? array();
		$product_content_opts = $attributes['productContentOptions'] ?? array();
		$taxonomy_options     = $attributes['taxonomyOptions'] ?? array();
		$meta_options_resp    = $attributes['metaOptions'] ?? array();
		$source_type          = $attributes['sourceType'] ?? 'image';

		// Typography - Title (responsive).
		if ( ! empty( $content_options['titleTypography'] ) ) {
			$title_styles = $this->get_typography_styles(
				array(
					'typography'  => $content_options['titleTypography'],
					'fontSize'    => $content_options['titleTypography']['fontSize'] ?? null,
					'fontSpacing' => $content_options['titleTypography']['fontSpacing'] ?? null,
					'lineHeight'  => $content_options['titleTypography']['lineHeight'] ?? null,
					'wordSpacing' => $content_options['titleTypography']['wordSpacing'] ?? null,
					'device'      => $device_type,
				)
			);
			if ( ! empty( $title_styles ) ) {
				$rules[] = array(
					'selector' => $this->title_selector,
					'styles'   => $title_styles,
				);
			}
		}

		// Typography - Description (responsive).
		if ( ! empty( $content_options['descTypography'] ) ) {
			$desc_styles = $this->get_typography_styles(
				array(
					'typography'  => $content_options['descTypography'],
					'fontSize'    => $content_options['descTypography']['fontSize'] ?? null,
					'fontSpacing' => $content_options['descTypography']['fontSpacing'] ?? null,
					'lineHeight'  => $content_options['descTypography']['lineHeight'] ?? null,
					'wordSpacing' => $content_options['descTypography']['wordSpacing'] ?? null,
					'device'      => $device_type,
				)
			);
			if ( ! empty( $desc_styles ) ) {
				$rules[] = array(
					'selector' => $this->desc_selector,
					'styles'   => $desc_styles,
				);
			}
		}

		$meta_typo = $meta_options_resp['typography'] ?? array();
		if ( ! empty( $meta_typo ) ) {
			$meta_styles = $this->get_typography_styles(
				array(
					'typography'  => $meta_typo,
					'fontSize'    => $meta_typo['fontSize'] ?? null,
					'fontSpacing' => $meta_typo['fontSpacing'] ?? null,
					'lineHeight'  => $meta_typo['lineHeight'] ?? null,
					'wordSpacing' => $meta_typo['wordSpacing'] ?? null,
					'device'      => $device_type,
				)
			);
			if ( ! empty( $meta_styles ) ) {
				$rules[] = array(
					'selector' => $this->meta_selector,
					'styles'   => $meta_styles,
				);
			}
		}

		$tax_typo = $taxonomy_options['typography'] ?? array();
		if ( ! empty( $tax_typo ) ) {
			$tax_styles = $this->get_typography_styles(
				array(
					'typography'  => $tax_typo,
					'fontSize'    => $tax_typo['fontSize'] ?? null,
					'fontSpacing' => $tax_typo['fontSpacing'] ?? null,
					'lineHeight'  => $tax_typo['lineHeight'] ?? null,
					'wordSpacing' => $tax_typo['wordSpacing'] ?? null,
					'device'      => $device_type,
				)
			);
			if ( ! empty( $tax_styles ) ) {
				$rules[] = array(
					'selector' => $this->taxonomy_selector,
					'styles'   => $tax_styles,
				);
			}
		}

		if ( in_array( $source_type, array( 'post', 'video' ), true ) ) {
			$button_typo = $this->get_first_non_empty_style_array(
				$post_content_options['buttonTypography'] ?? array(),
				$content_options['buttonTypography'] ?? array()
			);
		} elseif ( 'product' === $source_type ) {
			$button_typo = $this->get_first_non_empty_style_array(
				$product_content_opts['buttonTypography'] ?? array(),
				$content_options['buttonTypography'] ?? array()
			);
		} else {
			$button_typo = $this->get_first_non_empty_style_array(
				$content_options['buttonTypography'] ?? array()
			);
		}
		if ( ! empty( $button_typo ) ) {
			$btn_styles = $this->get_typography_styles(
				array(
					'typography'  => $button_typo,
					'fontSize'    => $button_typo['fontSize'] ?? null,
					'fontSpacing' => $button_typo['fontSpacing'] ?? null,
					'lineHeight'  => $button_typo['lineHeight'] ?? null,
					'wordSpacing' => $button_typo['wordSpacing'] ?? null,
					'device'      => $device_type,
				)
			);
			if ( ! empty( $btn_styles ) ) {
				$rules[] = array(
					'selector' => $this->read_more_selector,
					'styles'   => $btn_styles,
				);
			}
		}

		$price_typo = $product_content_opts['priceTypography'] ?? array();
		if ( ! empty( $price_typo ) ) {
			$price_styles = $this->get_typography_styles(
				array(
					'typography'  => $price_typo,
					'fontSize'    => $price_typo['fontSize'] ?? null,
					'fontSpacing' => $price_typo['fontSpacing'] ?? null,
					'lineHeight'  => $price_typo['lineHeight'] ?? null,
					'wordSpacing' => $price_typo['wordSpacing'] ?? null,
					'device'      => $device_type,
				)
			);
			if ( ! empty( $price_styles ) ) {
				$rules[] = array(
					'selector' => $this->price_selector,
					'styles'   => $price_styles,
				);
			}
		}

		return $rules;
	}

	/**
	 * Return the first non-empty array from a list of candidates.
	 *
	 * @param mixed ...$candidates Candidate arrays.
	 * @return array
	 */
	private function get_first_non_empty_style_array( ...$candidates ) {
		foreach ( $candidates as $candidate ) {
			if ( is_array( $candidate ) && ! empty( $candidate ) ) {
				return $candidate;
			}
		}

		return array();
	}
}
