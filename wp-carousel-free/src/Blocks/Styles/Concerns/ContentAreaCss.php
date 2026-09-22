<?php
/**
 * Content Area panel dynamic-CSS generators (PHP side).
 *
 * Mirrors the content-area branch of the JS editor module
 * `blocks/blocks/shared/styles/contentAreaDynamicCss.js`. Any change here MUST
 * land on the JS side in the same commit — the JS↔PHP parity harness in
 * `tests/css-parity/` will catch a one-sided edit.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Styles\Concerns;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * Content Area style tab base/responsive rules and selector helpers.
 */
trait ContentAreaCss {

	/**
	 * Base content-area background/border/shadow + title/desc/rating colors.
	 *
	 * Mirrors: carouselDynamicCss.js generateContentAreaAndColors().
	 *
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function content_area_base_styles() {
		$rules                             = array();
		$attributes                        = $this->attributes;
		$content_area_options              = $attributes['contentAreaOptions'] ?? array();
		$content_options                   = $attributes['contentOptions'] ?? array();
		$rating_options                    = $attributes['ratingOptions'] ?? array();
		$image_options                     = $attributes['imageOptions'] ?? array();
		$taxonomy_options                  = $attributes['taxonomyOptions'] ?? array();
		$social_share_options              = $attributes['socialShareOptions'] ?? array();
		$meta_options                      = $attributes['metaOptions'] ?? array();
		$layout_options                    = $attributes['layoutOptions'] ?? array();
		$post_content_options              = $attributes['postContentOptions'] ?? array();
		$product_content_opts              = $attributes['productContentOptions'] ?? array();
		$source_type                       = $attributes['sourceType'] ?? 'image';
		$content_orientation               = $this->get_resolved_content_orientation();
		$content_area_style_selector       = $this->get_content_area_style_selector();
		$content_area_style_hover_selector = $this->get_content_area_style_hover_selector();

		// Layer-5 remainder: card background (NOT tokenized). It fails the D7
		// "set <property> to <value>" test, so it stays a paired rule-string
		// builder gated by CSS-string css-parity (it emits no --wpcp-*):
		// get_bg_value resolves a polymorphic value by background.style
		// (transparent / solid / gradient / url() image) — no single static
		// fallback fits — and is orientation-routed. See Styles/README.md
		// (Layer-5 catalogue). Classic targets `.wpcp-item`; other orientations
		// target `.wpcp-item-content`.
		// Card Element background defaults are shared by Image/Post/Product sources:
		// an empty solid color means "no authored background rule." Source-specific
		// defaults should be normalized before this generator receives attributes,
		// and explicit user-selected colors/gradients/images take precedence because
		// only non-empty resolved values are emitted below.
		if ( ! empty( $content_area_options['contentAreaBackground']['color'] ) ) {
			$normal_bg = $this->get_bg_value( $content_area_options['contentAreaBackground']['color'] );
			if ( $normal_bg && 'transparent' !== $normal_bg ) {
				$rules[] = array(
					'selector' => $content_area_style_selector,
					'styles'   => array( 'background' => $normal_bg ),
				);
			}
		}

		if ( ! empty( $content_area_options['contentAreaBackground']['hover'] ) ) {
			$hover_bg = $this->get_bg_value( $content_area_options['contentAreaBackground']['hover'] );
			if ( $hover_bg && 'transparent' !== $hover_bg ) {
				$rules[] = array(
					'selector' => $content_area_style_hover_selector,
					'styles'   => array( 'background' => $hover_bg ),
				);
			}
		}
		if ( 'overlay' === $content_orientation ) {
			$source_specific_content_colors = array();
			if ( 'post' === $source_type ) {
				$source_specific_content_colors = array(
					'title' => $post_content_options['titleColor'] ?? '',
					'desc'  => $post_content_options['excerptColor'] ?? '',
				);
			} elseif ( 'product' === $source_type ) {
				$source_specific_content_colors = array(
					'title' => $product_content_opts['titleColor'] ?? '',
					'desc'  => $product_content_opts['descColor'] ?? '',
				);
			}

			$source_specific_title_color = Css_Helpers::sanitize_color( (string) ( $source_specific_content_colors['title'] ?? '' ) );
			$source_specific_desc_color  = Css_Helpers::sanitize_color( (string) ( $source_specific_content_colors['desc'] ?? '' ) );

			// Overlay and Content Box intentionally follow Diagonal: their default
			// title/description color is the static stylesheet's white fallback. Do
			// not seed Classic dark defaults here; only emit legacy source-specific
			// custom colors so older Post/Product saves still override the shared
			// white default. New saves mirror those controls into contentOptions,
			// and the config-driven token bag emitted later wins over this bridge.
			if ( '' !== $source_specific_title_color || '' !== $source_specific_desc_color ) {
				$styles = array();
				if ( '' !== $source_specific_title_color ) {
					$styles['--wpcp-content-title-color'] = $source_specific_title_color;
				}
				if ( '' !== $source_specific_desc_color ) {
					$styles['--wpcp-content-desc-color'] = $source_specific_desc_color;
				}
				$rules[] = array(
					'selector' => $this->unique_id,
					'styles'   => $styles,
				);
			}
		}

		// Card border + box-shadow are emitted as --wpcp-content-border-* /
		// --wpcp-content-shadow{,-hover} tokens via the style config; the static
		// stylesheet consumes them, orientation-routed (image-top → .wpcp-item,
		// generic overlay → .wpcp-item-content) to match the legacy
		// contentAreaStyleSelector.
		// See StyleConfig and the content-area card rules in style.scss. The shared
		// border_css / get_box_shadow_value traits stay (taxonomy + thumbnails use them).

		// Typography - Normal title/desc color → --wpcp-content-title-color /
		// -desc-color tokens. Defaults render from static SCSS: Classic stays dark,
		// while Overlay and Diagonal share the white fallback unless
		// the user has selected a custom normal color. See StyleConfig. Title hover
		// stays a paired rule-string because it is still emitted dynamically.
		// (`titleColor`/`descColor` are polymorphic — a string or `array( 'color',
		// 'hoverColor' )`; the previous code emitted the raw array as `color: Array`
		// for the object shape, now fixed via the token + this hover resolver).
		$title_hover_color = Css_Helpers::sanitize_color(
			$this->resolve_title_hover_color( $attributes, $content_options )
		);
		if ( '' !== $title_hover_color ) {
			$rules[] = array(
				'selector' => $this->unique_id . ' .wpcp-item-title:hover',
				'styles'   => array( 'color' => $title_hover_color ),
			);
		}

		$desc_hover_color = Css_Helpers::sanitize_color(
			$this->resolve_content_hover_color( $content_options['descColor'] ?? null )
		);
		if ( '' !== $desc_hover_color ) {
			$rules[] = array(
				'selector' => $this->unique_id . ' .wpcp-item:hover .wpcp-item-desc',
				'styles'   => array( 'color' => $desc_hover_color ),
			);
		}

		// Card text alignment: `.wpcp-content-align--*` on `.wpcp-item-content` (block stylesheet).

		// Rating fill/empty colors are emitted as --wpcp-content-rating-fill/-empty
		// tokens via the style config; the static stylesheet consumes them (defaults
		// #FFD700 / #E0E0E0 render from static SCSS). See StyleConfig.
		return $rules;
	}

	/**
	 * Resolve the hover color from a polymorphic title/desc color attribute.
	 *
	 * Mirrors resolveContentHoverColorValue() in contentAreaDynamicCss.js: an
	 * `array( 'color', 'hoverColor' )` object yields its `hoverColor`; a plain
	 * string (or anything else) yields `''` (no hover override).
	 *
	 * @param mixed $value Raw color attribute.
	 * @return string Hover color, or '' when none.
	 */
	private function resolve_content_hover_color( $value ) {
		if ( is_array( $value ) ) {
			return $value['hoverColor'] ?? '';
		}
		return '';
	}

	/**
	 * Resolve the title hover color, which is stored per source.
	 *
	 * Sources route differently: post/video read postContentOptions.titleHoverColor,
	 * product reads productContentOptions.titleHoverColor (both flat strings); image
	 * fall back to the polymorphic contentOptions.titleColor.hoverColor. Without this
	 * routing the post/product "Title Hover Color" control writes an attribute no
	 * CSS reads. Mirrors resolveTitleHoverColor() in contentAreaDynamicCss.js.
	 *
	 * @param array $attributes      Full block attribute tree.
	 * @param array $content_options contentOptions group.
	 * @return string Hover color, or '' when none.
	 */
	private function resolve_title_hover_color( $attributes, $content_options ) {
		$source_type = $attributes['sourceType'] ?? 'image';
		if ( 'post' === $source_type || 'video' === $source_type ) {
			return (string) ( $attributes['postContentOptions']['titleHoverColor'] ?? '' );
		}
		if ( 'product' === $source_type ) {
			return (string) ( $attributes['productContentOptions']['titleHoverColor'] ?? '' );
		}
		return $this->resolve_content_hover_color( $content_options['titleColor'] ?? null );
	}

	/*
	 * Title/desc/price margins are emitted via the config-driven
	 * `--wpcp-content-*-margin` tokens (StyleConfig, `spacingFill` transform) and
	 * consumed by the static stylesheet in place. The source-gating fallback chain
	 * lives in the style-config rows; the transform docblock documents the
	 * fill / zero-fill policy that preserves the legacy clobber behavior.
	 */

	/**
	 * Responsive card/content padding rules (Layer-5 remainder).
	 *
	 * Padding stays a paired rule-string builder (gated by the css-parity per-side
	 * baseline, not the value-map) rather than a config-row token, because it can't
	 * be reproduced static-first without changing behavior:
	 *  - Load-bearing `#uid` specificity + orientation routing: the emitted padding
	 *    selector must preserve legacy clobber behavior while targeting different
	 *    surfaces (`.wpcp-item`, `.wpcp-item-content`, or diagonal's
	 *    `.wpcp-diagonal-caption`).
	 *  - Per-device zero-fill: the editor writes only the active device and
	 *    spacing_generate() zero-fills the rest once customized — the inverse of a
	 *    static `var(…, default)` fallback.
	 *  - Conditional rule presence + 3-way selector routing + separate contentPadding.
	 *
	 * Mirrors: carouselDynamicCss.js generateCardResponsiveRules().
	 *
	 * @param string $device_type Device type ('Desktop', 'Tablet', 'Mobile').
	 * @return array CSS rules in the {selector, styles} shape.
	 */
	private function content_area_card_responsive_rules( $device_type ) {
		$rules                         = array();
		$content_area_options          = $this->attributes['contentAreaOptions'] ?? array();
		$content_area_padding_selector = $this->get_content_area_padding_selector();
		$is_classic_orientation        = 'image-top' === $this->get_resolved_content_orientation();

		// Content Area (Style tab) - Card padding on `.wpcp-item`.
		if ( ! empty( $content_area_options['cardPadding'] ) && $this->has_spacing_changed( $content_area_options['cardPadding'] ) ) {
			$padding = $this->spacing_generate( $content_area_options['cardPadding'], $device_type );
			if ( $padding && ! $this->is_zero_spacing_value( $padding ) ) {
				$rules[] = array(
					'selector' => $content_area_padding_selector,
					'styles'   => array( 'padding' => $padding ),
				);
			}
		}

		// Content Area (Style tab) - Padding uses an orientation fallback until the user customizes it.
		$effective_content_area_padding = $this->get_effective_content_area_padding( $content_area_options, $device_type );
		if ( ! empty( $effective_content_area_padding ) ) {
			$padding = $this->spacing_generate( $effective_content_area_padding, $device_type );
			if ( $padding ) {
				$rules[] = array(
					'selector' => $content_area_padding_selector,
					'styles'   => array( 'padding' => $padding ),
				);
			}
		}

		// Content Area (Style tab) - Classic content padding applies only to `.wpcp-item-content`.
		if ( $is_classic_orientation && ! empty( $content_area_options['contentPadding'] ) && $this->has_explicit_spacing( $content_area_options['contentPadding'], $content_area_options['contentPaddingCustomized'] ?? false ) ) {
			$content_padding = $this->spacing_generate( $content_area_options['contentPadding'], $device_type );
			if ( $content_padding ) {
				$rules[] = array(
					'selector' => $this->unique_id . ' .wpcp-item-content',
					'styles'   => array( 'padding' => $content_padding ),
				);
			}
		}

		// Content Area (Style tab) - Card margin wraps the same surface as padding (image-top → .wpcp-item, others → .wpcp-item-content). Static-first: the all-zero schema default emits nothing, so only an authored margin produces a rule.
		if ( ! empty( $content_area_options['cardMargin'] ) && $this->has_spacing_changed( $content_area_options['cardMargin'] ) ) {
			$margin = $this->spacing_generate( $content_area_options['cardMargin'], $device_type );
			if ( $margin && ! $this->is_zero_spacing_value( $margin ) ) {
				$rules[] = array(
					'selector' => $content_area_padding_selector,
					'styles'   => array( 'margin' => $margin ),
				);
			}
		}

		// Content Area (Style tab) - Classic targets `.wpcp-item`; other orientations target `.wpcp-item-content`.
		// Card border-radius is emitted as the --wpcp-content-radius token (responsive,
		// single) via the style config; the static stylesheet consumes it, orientation-
		// routed like the border/shadow. See StyleConfig and style.scss.

		return $rules;
	}

	/**
	 * Check whether a spacing value has a non-zero side.
	 *
	 * Used to distinguish untouched zero defaults from user-customized content padding.
	 *
	 * @param array $attr Spacing attribute.
	 * @return bool True when at least one side is non-zero.
	 */
	private function has_non_zero_spacing( $attr ) {
		if ( ! $attr || ! isset( $attr['device'] ) || ! is_array( $attr['device'] ) ) {
			return false;
		}

		foreach ( $attr['device'] as $device_spacing ) {
			if ( ! $device_spacing || ! is_array( $device_spacing ) ) {
				continue;
			}
			foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
				$value = $device_spacing[ $side ] ?? null;
				// Cast before compare: `0 !== (float) 0` is true in PHP (int vs float).
				if ( null !== $value && '' !== $value && 0.0 !== (float) $value ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Check whether a spacing value should be treated as explicitly customized.
	 *
	 * Explicit markers preserve valid zero values, while legacy non-zero spacing
	 * still counts as customized for backward compatibility.
	 *
	 * @param array $attr       Spacing attribute.
	 * @param bool  $customized Explicit customization marker.
	 * @return bool True when spacing should override orientation defaults.
	 */
	private function has_explicit_spacing( $attr, $customized = false ) {
		if ( true === $customized ) {
			return true;
		}
		return $this->has_non_zero_spacing( $attr );
	}

	/**
	 * Get default content area padding for the current orientation.
	 *
	 * @param string $device_type Device type.
	 * @return array|null Spacing attribute or null for no default rule.
	 */
	private function get_default_content_area_padding( $device_type ) {
		$content_orientation = $this->get_resolved_content_orientation();
		// Scalars fan out to all four sides. Diagonal needs a taller top inset
		// than the other three sides, so it carries a per-side map; the return
		// then emits with allChange:false so spacing_generate writes every side.
		$defaults      = array(
			'image-top' => 0,
			'overlay'   => 15,
			'diagonal'  => array(
				'top'    => 24,
				'right'  => 15,
				'bottom' => 15,
				'left'   => 15,
			),
		);
		$padding_value = $defaults[ $content_orientation ] ?? 15;

		if ( ! $padding_value ) {
			return null;
		}

		// A per-side map (diagonal) emits every side explicitly (allChange:false);
		// a scalar fans out to all four sides as a single value (allChange:true).
		$is_per_side = is_array( $padding_value );
		$sides       = $is_per_side
			? $padding_value
			: array(
				'top'    => $padding_value,
				'right'  => $padding_value,
				'bottom' => $padding_value,
				'left'   => $padding_value,
			);

		return array(
			'allChange' => ! $is_per_side,
			'unit'      => array(
				$device_type => 'px',
			),
			'device'    => array(
				$device_type => $sides,
			),
		);
	}

	/**
	 * Get customized content padding or the orientation fallback.
	 *
	 * @param array  $content_area_options Content area options.
	 * @param string $device_type          Device type.
	 * @return array|null Spacing attribute or null.
	 */
	private function get_effective_content_area_padding( $content_area_options, $device_type ) {
		$padding = $content_area_options['padding'] ?? null;
		if ( $this->has_explicit_spacing( $padding, $content_area_options['paddingCustomized'] ?? false ) ) {
			return $padding;
		}

		return $this->get_default_content_area_padding( $device_type );
	}

	/**
	 * Resolve the current content orientation.
	 *
	 * @return string
	 */
	private function get_resolved_content_orientation() {
		$content_orientation = $this->attributes['layoutOptions']['contentOrientation'] ?? '';

		$allowed = $this->get_allowed_content_orientations();
		if ( is_string( $content_orientation ) && in_array( $content_orientation, $allowed, true ) ) {
			return $content_orientation;
		}

		return \ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues::content_orientation_fallback(
			$this->attributes['blockName'] ?? ''
		);
	}

	/**
	 * Get content orientations supported by the current block.
	 *
	 * Mirrors `getContentOrientationItems()` in
	 * `blocks/blocks/shared/inspector/fragments/contentOrientations.jsx`, and is
	 * a subset of `AllowedValues::CONTENT_ORIENTATIONS` — the Slider and
	 * Thumbnails Slider have no stacked layout, so `image-top` is not offered.
	 *
	 * @return string[]
	 */
	private function get_allowed_content_orientations() {
		return AllowedValues::content_orientations_for_block( $this->attributes['blockName'] ?? '' );
	}

	/**
	 * Resolve selector that should receive content area padding.
	 *
	 * @return string
	 */
	private function get_content_area_padding_selector() {
		$content_orientation = $this->get_resolved_content_orientation();

		if ( 'diagonal' === $content_orientation ) {
			return $this->diagonal_caption_selector;
		}

		return 'image-top' === $content_orientation
			? $this->content_area_item
			: $this->unique_id . ' .wpcp-item-content';
	}

	/**
	 * Get selector for content area background/border/shadow.
	 *
	 * @return string CSS selector.
	 */
	private function get_content_area_style_selector() {
		$content_orientation = $this->get_resolved_content_orientation();

		if ( 'diagonal' === $content_orientation ) {
			return $this->diagonal_caption_selector;
		}

		return 'image-top' === $this->get_resolved_content_orientation()
			? $this->content_area_item
			: $this->unique_id . ' .wpcp-item-content';
	}

	/**
	 * Get hover selector for content area background/border/shadow.
	 *
	 * @return string CSS selector.
	 */
	private function get_content_area_style_hover_selector() {
		$content_orientation = $this->get_resolved_content_orientation();

		if ( 'diagonal' === $content_orientation ) {
			return $this->unique_id . ' .wpcp-item:hover .wpcp-diagonal-caption';
		}

		return 'image-top' === $this->get_resolved_content_orientation()
			? $this->content_area_item_hover
			: $this->unique_id . ' .wpcp-item:hover .wpcp-item-content';
	}
}
