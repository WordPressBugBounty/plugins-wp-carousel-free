<?php
/**
 * Content slot HTML for carousel items (title, meta, product fields, etc.).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Item_Text;

defined( 'ABSPATH' ) || exit;

/**
 * Dispatches slot types to small renderers; uses block attributes + item data only.
 */
class SlotRenderer {

	/**
	 * Normalised block attributes.
	 *
	 * @var array
	 */
	private array $attrs;

	/**
	 * Shared social share row renderer.
	 *
	 * @var SocialShareRenderer
	 */
	private SocialShareRenderer $social_share;

	/**
	 * Constructor.
	 *
	 * @param array               $attrs        Normalised block attributes.
	 * @param SocialShareRenderer $social_share Shared instance for social slot output.
	 */
	public function __construct( array $attrs, SocialShareRenderer $social_share ) {
		$this->attrs        = $attrs;
		$this->social_share = $social_share;
	}

	/**
	 * Main entry: inner HTML for a slot (no wrapper div).
	 *
	 * @param string $slot_type Slot key.
	 * @param array  $item      Normalised item.
	 * @param array  $context   Option bags + source_type.
	 * @return string
	 */
	public function render( string $slot_type, array $item, array $context ): string {
		return $this->render_slot_by_type( $slot_type, $item, $context );
	}

	/**
	 * Whether the slot is enabled in content area visibility.
	 *
	 * @param string $slot_type Slot key.
	 * @return bool
	 */
	public function is_slot_visible( string $slot_type ): bool {
		$content_area_options = $this->attrs['contentAreaOptions'] ?? array();
		$visibility           = $content_area_options['elementVisibility'] ?? array();
		$source_type          = $this->attrs['sourceType'] ?? 'image';

		$defaults = array(
			'image'       => true,
			'title'       => true,
			'description' => true,
			'excerpt'     => false,
			'readmore'    => false,
			'meta'        => true,
			'taxonomy'    => true,
			'rating'      => true,
			'price'       => true,
			'social'      => true,
		);

		if ( 'product' === $source_type && in_array( $slot_type, array( 'taxonomy', 'excerpt', 'social' ), true ) ) {
			$defaults[ $slot_type ] = false;
		}

		if ( 'readmore' === $slot_type && 'product' === $source_type ) {
			$product_content_options = $this->attrs['productContentOptions'] ?? array();
			return $this->attr_bool( $product_content_options, 'showAddToCart', true );
		}

		if ( isset( $visibility[ $slot_type ] ) ) {
			return ! empty( $visibility[ $slot_type ] );
		}

		return $defaults[ $slot_type ] ?? true;
	}

	/**
	 * Dispatch a slot to its renderer.
	 *
	 * @param string $slot_type Slot key.
	 * @param array  $item      Normalised item.
	 * @param array  $context   Rendering context.
	 * @return string
	 */
	private function render_slot_by_type( string $slot_type, array $item, array $context ): string {
		$dispatch = array(
			'title'       => 'render_slot_title',
			'description' => 'render_slot_description',
			'excerpt'     => 'render_slot_description',
			'readmore'    => 'render_slot_readmore',
			'meta'        => 'render_slot_meta',
			'taxonomy'    => 'render_slot_taxonomy',
			'rating'      => 'render_slot_rating',
			'price'       => 'render_slot_price',
			'social'      => 'render_slot_social',
		);

		$method = $dispatch[ $slot_type ] ?? null;
		if ( ! $method || ! method_exists( $this, $method ) ) {
			return '';
		}

		return $this->$method( $item, $context );
	}

	/**
	 * Read a boolean out of the content options subtree.
	 *
	 * @param array  $content_options Options subtree.
	 * @param string $key             Attribute key.
	 * @param bool   $default_value  Default when missing.
	 * @return bool
	 */
	private function attr_bool( array $content_options, string $key, bool $default_value ): bool {
		if ( ! array_key_exists( $key, $content_options ) ) {
			return $default_value;
		}

		$raw_value = $content_options[ $key ];
		if ( is_bool( $raw_value ) ) {
			return $raw_value;
		}

		$parsed = filter_var( $raw_value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
		return null === $parsed ? $default_value : (bool) $parsed;
	}

	/**
	 * Resolve a content field from the item using the configured source key.
	 *
	 * @param array  $item         Item data.
	 * @param string $source       Source key from attributes.
	 * @param string $default_key  Fallback item key.
	 * @return string
	 */
	private function get_content_field( array $item, string $source, string $default_key ): string {
		$map = array(
			'image_title'       => 'title',
			'image_description' => 'description',
			'image_caption'     => 'caption',
			'image_alt'         => 'image_alt',
			'post_title'        => 'title',
			'post_excerpt'      => 'description',
			'post_content'      => 'description',
		);
		$key = $map[ $source ] ?? $default_key;
		return $item[ $key ] ?? $item[ $default_key ] ?? '';
	}

	/**
	 * Apply source-specific title word limit options.
	 *
	 * Title Length Limit is Pro for the post/video family, so only the
	 * product source (Free there) reads a word-limit option.
	 *
	 * @param string $title   Raw title text.
	 * @param array  $context Rendering context.
	 * @return string
	 */
	public function apply_title_word_limit( string $title, array $context ): string {
		$source_type = $context['source_type'] ?? $this->attrs['sourceType'] ?? 'image';
		$options     = array();

		if ( 'product' === $source_type ) {
			$options = $context['productContentOptions'] ?? $this->attrs['productContentOptions'] ?? array();
		}

		if ( 'limited' !== ( $options['titleLength'] ?? 'full' ) ) {
			return $title;
		}

		$word_limit = isset( $options['titleWordLimit'] ) ? absint( $options['titleWordLimit'] ) : 10;
		if ( 1 > $word_limit ) {
			return $title;
		}

		return wp_trim_words( $title, $word_limit, '' );
	}

	/**
	 * Truncate text by word or character count, appending an ellipsis when shortened.
	 *
	 * @param string $text     Raw text (may contain HTML).
	 * @param int    $limit    Maximum words or characters.
	 * @param string $unit     `word` or `char`.
	 * @param string $ellipsis Suffix when truncated.
	 * @return string
	 */
	private function truncate_limited_text( string $text, int $limit, string $unit = 'word', string $ellipsis = '...' ): string {
		if ( 1 > $limit ) {
			return $text;
		}

		$plain = wp_strip_all_tags( $text );

		if ( 'char' === $unit || 'letter' === $unit ) {
			return wp_html_excerpt( $plain, $limit, $ellipsis );
		}

		return wp_trim_words( $plain, $limit, $ellipsis );
	}

	/**
	 * Apply source-specific excerpt/description word limit options.
	 *
	 * @param string $description Raw description text.
	 * @param array  $context     Rendering context.
	 * @return string
	 */
	private function apply_description_word_limit( string $description, array $context ): string {
		$source_type = $context['source_type'] ?? $this->attrs['sourceType'] ?? 'image';
		$options     = array();

		// Description Length Limit is Pro for the post/video family, so only
		// product and image sources (Free there) read a word-limit option.
		if ( 'product' === $source_type ) {
			$options = $context['productContentOptions'] ?? $this->attrs['productContentOptions'] ?? array();
		} elseif ( 'image' === $source_type ) {
			$options = $context['contentOptions'] ?? $this->attrs['contentOptions'] ?? array();
		}

		$excerpt_length     = $options['excerptLength'] ?? '';
		$excerpt_limit      = $options['excerptLimit'] ?? '';
		$description_length = $options['descriptionLength'] ?? '';
		if ( 'limited' !== $excerpt_length && 'limited' !== $excerpt_limit && 'limited' !== $description_length ) {
			return $description;
		}

		$length_limit = isset( $options['excerptWordLimit'] )
			? absint( $options['excerptWordLimit'] )
			: ( isset( $options['descriptionWordLimit'] ) ? absint( $options['descriptionWordLimit'] ) : 10 );
		if ( 1 > $length_limit ) {
			return $description;
		}

		$length_unit = $options['excerptLengthUnit'] ?? $options['descriptionLengthUnit'] ?? 'word';
		if ( 'char' !== $length_unit && 'letter' !== $length_unit ) {
			$length_unit = 'word';
		}

		return $this->truncate_limited_text( $description, $length_limit, $length_unit, '...' );
	}

	/**
	 * Render the title slot.
	 *
	 * @param array $item    Item data.
	 * @param array $context Context with contentOptions.
	 * @return string
	 */
	private function render_slot_title( array $item, array $context ): string {
		$content_options = $context['contentOptions'] ?? array();
		$show_title      = $this->attr_bool( $content_options, 'showTitle', true );
		if ( ! $show_title ) {
			return '';
		}

		$title = $this->get_content_field( $item, $content_options['titleSource'] ?? 'image_caption', 'title' );
		if ( empty( $title ) ) {
			return '';
		}
		$title = $this->apply_title_word_limit( $title, $context );

		$tag = $content_options['titleTag'] ?? 'h4';
		$tag = in_array( $tag, array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'p' ), true ) ? $tag : 'h4';

		$title_html = sprintf(
			'<%1$s class="wpcp-item-title">%2$s</%1$s>',
			esc_html( $tag ),
			Item_Text::title( $title )
		);

		return $this->maybe_wrap_title_with_link( $title_html, $item );
	}

	/**
	 * Render the description slot.
	 *
	 * @param array $item    Item data.
	 * @param array $context Context with contentOptions.
	 * @return string
	 */
	private function render_slot_description( array $item, array $context ): string {
		$content_options = $context['contentOptions'] ?? array();
		$show_desc       = $this->attr_bool( $content_options, 'showDescription', true );
		if ( ! $show_desc ) {
			return '';
		}

		$desc = $this->get_content_field( $item, $content_options['descriptionSource'] ?? 'image_description', 'description' );
		if ( empty( $desc ) ) {
			return '';
		}
		$desc = $this->apply_description_word_limit( $desc, $context );

		// Inline tags plus links only. Block tags would be invalid inside this <p>,
		// and post excerpts / product short descriptions arrive as text already.
		$desc_html = sprintf(
			'<p class="wpcp-item-desc">%1$s</p>',
			Item_Text::description( $desc )
		);

		return $desc_html;
	}

	/**
	 * Render Readmore button.
	 *
	 * @param array $item    Item data.
	 * @param array $context Context.
	 * @return string
	 */
	private function render_slot_readmore( array $item, array $context ): string {
		$content_options         = $this->attrs['contentOptions'] ?? array();
		$post_content_options    = $this->attrs['postContentOptions'] ?? array();
		$product_content_options = $context['productContentOptions'] ?? array();
		$source_type             = $context['source_type'] ?? 'image';
		$click_action_options    = $this->attrs['clickActionOptions'] ?? array();
		$action_type             = $click_action_options['type'] ?? 'lightbox';

		$show_more = 'product' === $source_type
			? $this->attr_bool( $product_content_options, 'showAddToCart', true )
			: $this->attr_bool( $content_options, 'showReadMore', false );

		// Direct media items only show Read More when a custom URL is explicitly set.
		$read_more_url = $item['url'] ?? '';
		if ( in_array( $source_type, array( 'image', 'video' ), true ) ) {
			$read_more_url = $item['customUrl'] ?? $item['custom_url'] ?? '';
		}

		$can_show_readmore = $show_more;

		// Lightbox-only and disabled actions suppress the separate Read More URL
		// affordance for sources governed by the Click Actions panel.
		$click_action_suppresses_readmore = in_array( $action_type, array( 'lightbox', 'disable' ), true )
			&& 'image' === $source_type;

		if ( ! $can_show_readmore || empty( $read_more_url ) || $click_action_suppresses_readmore ) {
			return '';
		}

		// Stock state feeds the add-to-cart gate and the link/span decision below.
		$stock_status     = $item['extra']['stock_status'] ?? '';
		$product_no_price = true;
		if ( 'product' === $source_type ) {
			$product_no_price = empty( $item['extra']['price'] ) && empty( $item['price'] );
		}

		$readmore_options = in_array( $source_type, array( 'post', 'video' ), true )
			? $post_content_options
			: $content_options;

		$button_type = $readmore_options['buttonType'] ?? 'button';

		// Build CSS classes including icon position.
		$css_classes = array( 'wpcp-read-more', 'wpcp-btn-type-' . sanitize_html_class( (string) $button_type ) );

		// Add product-specific classes when showing Add to Cart button for products.
		// Only ajax-add products WooCommerce can add straight to the cart: a
		// variable, grouped or external product has to reach its own page first.
		$supports_ajax_cart = '1' === ( $item['extra']['supports_ajax_cart'] ?? '' );
		$is_purchasable     = '1' === ( $item['extra']['is_purchasable'] ?? '' );
		$is_add_to_cart     = 'product' === $source_type
			&& ! empty( $product_content_options['showAddToCart'] )
			&& 'outofstock' !== $stock_status
			&& 'onbackorder' !== $stock_status
			&& ! $product_no_price
			&& $is_purchasable
			&& $supports_ajax_cart;

		// WooCommerce's own button label, e.g. "Add to cart" or "Select options".
		$product_button_label = $item['extra']['add_to_cart_text'] ?? '';
		if ( 'product' === $source_type && ! empty( $product_content_options['showAddToCart'] ) && '' !== $product_button_label ) {
			$label = esc_html( $product_button_label );
		} else {
			$label = $is_add_to_cart
				? esc_html__( 'Add to cart', 'wp-carousel-free' )
				: esc_html__( 'Read More', 'wp-carousel-free' );
		}
		if ( $is_add_to_cart ) {
			$css_classes[] = 'add_to_cart_button';
			$css_classes[] = 'ajax_add_to_cart';
		}
		$show_cart_icon = $is_add_to_cart && $this->attr_bool( $product_content_options, 'showCartIcon', true );

		// Add icon position class if icon is enabled. Show Icon is Pro for the
		// post/video family, so that family never reads showIcon/showIconHover.
		$is_post_family     = in_array( $source_type, array( 'post', 'video' ), true );
		$show_btn_icon      = ! $is_post_family && $this->attr_bool( $readmore_options, 'showIcon', false );
		$show_icon_on_hover = ! $is_post_family && $this->attr_bool( $readmore_options, 'showIconHover', false );

		if ( true === $show_btn_icon && true === $show_icon_on_hover ) {
			$css_classes[] = 'wpcp-icon-on-hover';
		}

		$icon_position = '';
		if ( ( $show_btn_icon || $show_cart_icon ) && isset( $readmore_options['iconPosition'] ) ) {
			$icon_position = sanitize_html_class( $readmore_options['iconPosition'] );
			$css_classes[] = "wpcp-icon-position-{$icon_position}";
		}

		$icon_html = $show_btn_icon ? $this->build_readmore_icon_html( $readmore_options ) : '';

		$cart_icon_html = '';
		if ( $show_cart_icon ) {
			$cart_icon_html = $this->render_cart_icon();
		}

		$link_attrs = $this->build_readmore_link_attrs( $item, $source_type, $is_add_to_cart );

		// Determine if this should be a link or span.
		// Any product the cart cannot take directly always shows as a link.
		$is_product_readmore = 'product' === $source_type && ! $is_add_to_cart;
		$should_show_link    = $is_product_readmore || $this->should_apply_url_to_readmore( $read_more_url );

		// Variable/grouped/external products link to their purchase destination.
		if ( $is_product_readmore && ! empty( $item['extra']['add_to_cart_url'] ) ) {
			$read_more_url = $item['extra']['add_to_cart_url'];
		}

		if ( ! $should_show_link ) {
			return sprintf(
				'<span class="%1$s"%2$s>%3$s%4$s%5$s</span>',
				esc_attr( implode( ' ', $css_classes ) ),
				$link_attrs,
				$label,
				$cart_icon_html,
				$icon_html
			);
		}

		return sprintf(
			'<a class="%1$s" href="%2$s"%3$s>%4$s%5$s%6$s</a>',
			esc_attr( implode( ' ', $css_classes ) ),
			esc_url( $read_more_url ),
			$link_attrs,
			$label,
			$cart_icon_html,
			$icon_html
		);
	}

	/**
	 * Read More button icon markup (library SVG or custom image).
	 *
	 * @param array $readmore_options Active read-more options slice (post or content options).
	 * @return string
	 */
	private function build_readmore_icon_html( array $readmore_options ): string {
		$post_icon_source = ! empty( $readmore_options['iconSource'] ) ? $readmore_options['iconSource'] : 'library';
		$library_icon     = ! empty( $readmore_options['chooseIcon'] ) ? $readmore_options['chooseIcon'] : 'angle-right';
		$library_icon_arr = $readmore_options['currentIcon'] ?? array();
		$custom_icon      = $readmore_options['chooseImg'] ?? array();

		$icon_html = '<span class="wpcp-readmore-icon">';

		if ( 'library' === $post_icon_source && empty( $library_icon_arr ) && ! empty( $library_icon ) ) {
			$library_icon_arr = $this->social_share->get_icon_list()[ $library_icon ] ?? array();
		}

		if ( 'custom' === $post_icon_source && ! empty( $custom_icon['url'] ) ) {
			$custom_icon_url = $custom_icon['url'];
			if ( ! empty( $custom_icon['id'] ) ) {
				$attachment_url = wp_get_attachment_image_url( $custom_icon['id'] );
				if ( ! empty( $attachment_url ) ) {
					$custom_icon_url = $attachment_url;
				}
			}

			$icon_html .= sprintf(
				'<img src="%s" alt="%s" />',
				esc_url( $custom_icon_url ),
				esc_attr( $custom_icon['alt'] ?? '' )
			);
		} elseif ( 'library' === $post_icon_source && ! empty( $library_icon ) ) {
			$arrow_icon_html = $this->render_readmore_arrow_icon_svg( $library_icon );
			if ( '' !== $arrow_icon_html ) {
				$icon_html .= $arrow_icon_html;
			} else {
				$icon_html .= '<svg viewBox="' . esc_attr( $library_icon_arr['viewBox'] ?? '' ) . '" width="' . esc_attr( $library_icon_arr['width'] ?? '' ) . '" height="' . esc_attr( $library_icon_arr['height'] ?? '' ) . '" fill="currentColor"><path d="' . esc_attr( $library_icon_arr['path'] ?? '' ) . '"/></svg>';
			}
		}

		return $icon_html . '</span>';
	}

	/**
	 * Render inline SVG markup for read-more arrow icon styles.
	 *
	 * Mirrors `blocks/icons/arrowIcons.js`.
	 *
	 * @param string $icon_name Selected icon id.
	 * @return string SVG markup, or empty string when the id is not an arrow icon.
	 */
	private function render_readmore_arrow_icon_svg( string $icon_name ): string {
		$svgs = array(
			'chevron-solid'          => '<svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.49995 6.40003L1.89995 0.700024C1.49995 0.300024 0.899951 0.300024 0.499951 0.700024C0.0999514 1.10002 0.0999514 1.70002 0.499951 2.10002L5.39995 7.00003L0.499951 11.9C0.299951 12.1 0.199951 12.3 0.199951 12.6C0.199951 13.2 0.599951 13.6 1.19995 13.6C1.49995 13.6 1.69995 13.5 1.89995 13.3L7.59995 7.60003C7.89995 7.40003 7.89995 6.80002 7.49995 6.40003Z"/></svg>',
			'chevron-outline'        => '<svg width="10" height="18" viewBox="0 0 10 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1.25005 17.25C1.05823 17.25 0.866234 17.1767 0.719797 17.0302C0.426734 16.7372 0.426734 16.2626 0.719797 15.9697L7.68955 8.99998L0.719797 2.03023C0.426734 1.73716 0.426734 1.2626 0.719797 0.969727C1.01286 0.676852 1.48742 0.676664 1.7803 0.969727L9.2803 8.46973C9.57336 8.76279 9.57336 9.23735 9.2803 9.53023L1.7803 17.0302C1.63386 17.1767 1.44186 17.25 1.25005 17.25Z"/></svg>',
			'chevron-bold'           => '<svg width="10" height="15" viewBox="0 0 10 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.35391 8.29922L2.97891 14.6742C2.53828 15.1148 1.82578 15.1148 1.38984 14.6742L0.330469 13.6148C-0.110156 13.1742 -0.110156 12.4617 0.330469 12.0258L4.84922 7.50703L0.330469 2.98828C-0.110156 2.54766 -0.110156 1.83516 0.330469 1.39922L1.38516 0.330469C1.82578 -0.110156 2.53828 -0.110156 2.97422 0.330469L9.34922 6.70547C9.79453 7.14609 9.79453 7.85859 9.35391 8.29922Z"/></svg>',
			'double-chevron'         => '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6.34237 13.3157C5.97377 12.9471 5.97377 12.3607 6.34237 11.992L11.3271 7.00727L6.34237 2.0225C5.97377 1.6539 5.97377 1.06746 6.34237 0.698816C6.71097 0.330212 7.29741 0.330212 7.66605 0.698816L13.3126 6.34541C13.6813 6.71401 13.6813 7.30045 13.3126 7.66909L7.66609 13.3157C7.29749 13.676 6.71105 13.676 6.34237 13.3157Z"/><path d="M0.687342 13.3158C0.318738 12.9471 0.318738 12.3607 0.687342 11.9921L5.67211 7.0073L0.687342 2.01421C0.318738 1.64561 0.318738 1.05917 0.687342 0.690529C1.05595 0.321888 1.64238 0.321925 2.01103 0.690529L7.65765 6.33708C8.02626 6.70569 8.02626 7.29213 7.65765 7.66077L2.01103 13.3074C1.65078 13.676 1.05598 13.676 0.687342 13.3158Z"/></svg>',
			'arrow-solid'            => '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1.5387 9.5107H11.016L7.83315 12.9702C7.27005 13.5773 7.31411 14.5371 7.92618 15.1002C8.53337 15.6633 9.50048 15.6266 10.0562 15.0194L15.577 9.0212C15.8414 8.7323 15.9712 8.36993 15.9712 8.00024C15.9712 7.63055 15.839 7.26577 15.577 6.97928L10.0562 0.981084C9.49797 0.373899 8.53337 0.334726 7.92618 0.900287C7.31163 1.46339 7.2676 2.42313 7.83315 3.03032L11.016 6.48978H1.5387C0.706242 6.48978 0.0280762 7.16063 0.0280762 8.0004C0.0280762 8.84017 0.70384 9.51102 1.5387 9.51102V9.5107Z"/></svg>',
			'arrow-outline'          => '<svg width="18" height="16" viewBox="0 0 18 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.489 9.73014H2.05357C0.0195797 9.73014 0.0195797 6.28366 2.05357 6.28366H11.489L8.60752 3.40218C7.19503 1.98969 9.62451 -0.496291 11.037 0.972699L17.026 6.96166C17.6475 7.52665 17.6475 8.48715 17.026 9.10864C15.0485 11.0861 13.0145 13.0636 11.037 15.0976C9.62451 16.5101 7.13853 14.0806 8.60752 12.6116L11.489 9.73014ZM13.636 8.82614L9.22902 13.2896C8.60752 13.8546 9.79401 15.0411 10.4155 14.4196C12.393 12.4421 14.427 10.4646 16.4045 8.43065C16.6305 8.20465 16.6305 7.80915 16.4045 7.58315L10.4155 1.59419C9.85051 0.972699 8.66402 2.15919 9.22902 2.78069L13.636 7.18766H2.05357C1.20607 7.18766 1.20607 8.82614 2.05357 8.82614H13.636Z"/></svg>',
			'arrow-minimal'          => '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 21.4993C14.372 21.4993 14.244 21.4503 14.146 21.3533C13.951 21.1583 13.951 20.8412 14.146 20.6462L22.793 11.9992L14.147 3.35325C13.952 3.15825 13.952 2.84125 14.147 2.64625C14.342 2.45125 14.659 2.45125 14.854 2.64625L23.854 11.6462C24.049 11.8412 24.049 12.1582 23.854 12.3532L14.854 21.3533C14.756 21.4503 14.628 21.4993 14.5 21.4993Z"/><path d="M23.5 12.4993H0.5C0.224 12.4993 0 12.2753 0 11.9993C0 11.7233 0.224 11.4993 0.5 11.4993H23.5C23.776 11.4993 24 11.7233 24 11.9993C24 12.2753 23.776 12.4993 23.5 12.4993Z"/></svg>',
			'chevron-border-line'    => '<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.10076 6.80249L3.29436 0.996084C2.63187 0.334234 1.56115 0.334718 0.899298 0.996084C0.238376 1.65701 0.236804 2.7293 0.899771 3.39114L5.5082 7.99998L0.899367 12.6088C0.238445 13.2688 0.236873 14.3425 0.899840 15.0034C1.55931 15.6639 2.6312 15.6669 3.29446 15.0034L9.10086 9.19703C9.42123 8.87775 9.59686 8.4528 9.59686 7.99994C9.59686 7.54756 9.42124 7.12212 9.10086 6.80241L9.10076 6.80249ZM8.41654 8.51336L2.61013 14.3198C2.32662 14.6033 1.86683 14.6033 1.58332 14.3198C1.29981 14.0372 1.29981 13.5769 1.58332 13.2934L6.87683 7.99994L1.58332 2.70684C1.29981 2.42379 1.29981 1.96354 1.58332 1.68051C1.86637 1.39652 2.32755 1.39747 2.61013 1.68004L8.41654 7.48644C8.69973 7.77012 8.69973 8.22975 8.41654 8.51325V8.51336Z"/></svg>',
			'double-chevron-outline' => '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.68926 7.33426C4.95939 7.74031 4.95939 8.26528 4.68926 8.66963L0.897206 14.3696C0.747699 14.5939 0.734108 14.8793 0.861528 15.1171C0.98895 15.355 1.2353 15.5011 1.50373 15.5011L3.69877 15.5011C4.3002 15.5011 4.85745 15.2021 5.19044 14.7026L9.01647 8.95166C9.40043 8.37402 9.40043 7.62818 9.01647 7.05054L5.19045 1.2996C4.85745 0.800113 4.3002 0.501098 3.69877 0.501098L1.50373 0.501098C1.2353 0.501098 0.988951 0.648907 0.861530 0.885060C0.734109 1.12121 0.747700 1.40834 0.897208 1.6326L4.68926 7.33426ZM1.31175 1.12631C1.33044 1.09233 1.3865 1.01078 1.50543 1.01078L3.69877 1.01078C4.1286 1.01078 4.52786 1.22485 4.76571 1.58163L8.59174 7.33426C8.86187 7.74031 8.86187 8.26528 8.59174 8.66963L4.76571 14.4206C4.52785 14.779 4.1286 14.9914 3.69877 14.9914L1.50373 14.9914C1.3848 14.9914 1.32874 14.9099 1.31005 14.8759C1.29136 14.8419 1.25568 14.7502 1.32024 14.6516L5.11399 8.95166C5.49795 8.37402 5.49795 7.62818 5.11399 7.05054L1.32194 1.35057C1.25738 1.25203 1.29306 1.16199 1.31175 1.12631Z"/><path d="M10.6204 7.33426C10.8905 7.74031 10.8905 8.26528 10.6204 8.66963L6.82835 14.3696C6.67884 14.5939 6.66525 14.8793 6.79267 15.1171C6.92009 15.355 7.16644 15.5011 7.43487 15.5011L9.62991 15.5011C10.2313 15.5011 10.7886 15.2021 11.1216 14.7026L14.9459 8.95166C15.3299 8.37402 15.3299 7.62818 14.9459 7.05054L11.1199 1.2996C10.7869 0.800113 10.2296 0.501098 9.62821 0.501098L7.43317 0.501098C7.16474 0.501098 6.91839 0.648907 6.79097 0.88506C6.66355 1.12291 6.67714 1.40834 6.82665 1.6326L10.6204 7.33426ZM7.24289 1.12631C7.26158 1.09233 7.31765 1.01078 7.43657 1.01078L9.62991 1.01078C10.0597 1.01078 10.459 1.22485 10.6969 1.58163L14.5229 7.33426C14.793 7.74031 14.793 8.26528 14.5229 8.66963L10.6968 14.4206C10.459 14.779 10.0597 14.9914 9.62991 14.9914L7.43487 14.9914C7.31595 14.9914 7.25988 14.9099 7.24119 14.8759C7.22250 14.8419 7.18683 14.7502 7.25139 14.6516L11.0451 8.95166C11.4291 8.37402 11.4291 7.62818 11.0451 7.05054L7.25309 1.35057C7.18683 1.25203 7.22420 1.16199 7.24289 1.12631Z"/></svg>',
			'triangle-outline'       => '<svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.49388 5.55745L1.14605 0.340058C0.985044 0.239429 0.782513 0.233825 0.616667 0.326556C0.450567 0.418268 0.3479 0.592775 0.3479 0.782568V11.2174C0.3479 11.4071 0.450567 11.5817 0.616667 11.6739C0.695896 11.7172 0.782513 11.7391 0.86964 11.7391C0.965682 11.7391 1.06173 11.7126 1.14605 11.6599L9.49388 6.44247C9.64622 6.34694 9.73921 6.18007 9.73921 5.99996C9.73921 5.81985 9.64622 5.65298 9.49388 5.55745ZM1.39138 10.276V1.72389L8.23284 5.99996L1.39138 10.276Z"/></svg>',
		);
		$key  = sanitize_key( $icon_name );
		return $svgs[ $key ] ?? '';
	}

	/**
	 * Read More anchor attributes: target/rel plus the product data attributes
	 * and interactivity-API click handlers for Add to Cart / View Product.
	 *
	 * @param array  $item           Normalised item.
	 * @param string $source_type    Block sourceType attribute.
	 * @param bool   $is_add_to_cart Whether the button is a purchasable add-to-cart action.
	 * @return string
	 */
	private function build_readmore_link_attrs( array $item, string $source_type, bool $is_add_to_cart ): string {
		$link_attrs = ' target="_self" rel="noopener noreferrer"';

		// Add product-specific data attributes for Add to Cart or View Product button.
		if ( 'product' !== $source_type ) {
			return $link_attrs;
		}

		$product_id    = $item['id'] ?? '';
		$product_sku   = $item['extra']['product_sku'] ?? '';
		$product_title = $item['title'] ?? '';

		if ( ! empty( $product_id ) ) {
			$link_attrs .= sprintf( ' data-product_id="%d"', (int) $product_id );
		}
		if ( ! empty( $product_sku ) ) {
			$link_attrs .= sprintf( ' data-product_sku="%s"', esc_attr( $product_sku ) );
		}

		if ( $is_add_to_cart ) {
			// Add to cart action for purchasable products.
			$aria_label = sprintf(
				/* translators: %s: product title. */
				__( 'Add to cart: %s', 'wp-carousel-free' ),
				$product_title
			);
			$link_attrs .= sprintf( ' aria-label="%s"', esc_attr( $aria_label ) );
			$link_attrs .= ' data-wp-on--click="actions.addCartItem"';
		} else {
			// View product action for out-of-stock or no-price products.
			$aria_label = sprintf(
				/* translators: %s: product title. */
				__( 'View product: %s', 'wp-carousel-free' ),
				$product_title
			);
			$link_attrs .= sprintf( ' aria-label="%s"', esc_attr( $aria_label ) );
			$link_attrs .= ' data-wp-on--click="woocommerce/product-collection::actions.viewProduct"';
		}

		return $link_attrs;
	}

	/**
	 * Render product cart icon markup.
	 *
	 * @return string
	 */
	private function render_cart_icon(): string {
		return '<span class="wpcp-readmore-icon">'
			. '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="wc-block-mini-cart__icon" viewBox="0 0 32 32">'
			. '<circle cx="12.667" cy="24.667" r="2"></circle>'
			. '<circle cx="23.333" cy="24.667" r="2"></circle>'
			. '<path fill-rule="evenodd" d="M9.285 10.036a1 1 0 0 1 .776-.37h15.272a1 1 0 0 1 .99 1.142l-1.333 9.333A1 1 0 0 1 24 21H12a1 1 0 0 1-.98-.797L9.083 10.87a1 1 0 0 1 .203-.834m2.005 1.63L12.814 19h10.319l1.047-7.333z" clip-rule="evenodd"></path>'
			. '<path fill-rule="evenodd" d="M5.667 6.667a1 1 0 0 1 1-1h2.666a1 1 0 0 1 .984.82l.727 4a1 1 0 1 1-1.967.359l-.578-3.18H6.667a1 1 0 0 1-1-1" clip-rule="evenodd"></path>'
			. '</svg>'
			. '</span>';
	}

	/**
	 * Whether the title should be wrapped in the item permalink.
	 *
	 * @param array $item Normalised item data.
	 * @return bool
	 */
	private function should_apply_url_to_title( array $item ): bool {
		if ( empty( $item['url'] ) ) {
			return false;
		}

		return in_array( $this->attrs['sourceType'] ?? 'image', array( 'post', 'product' ), true );
	}

	/**
	 * Wrap title markup with a permalink when title-link policy applies.
	 *
	 * @param string $title_html Title HTML (heading element).
	 * @param array  $item       Normalised item data.
	 * @return string
	 */
	public function maybe_wrap_title_with_link( string $title_html, array $item ): string {
		if ( ! $this->should_apply_url_to_title( $item ) ) {
			return $title_html;
		}

		return $this->wrap_with_item_link( $title_html, (string) $item['url'] );
	}

	/**
	 * Whether the read-more button should link to the item.
	 *
	 * @param string $read_more_url Resolved read-more URL.
	 * @return bool
	 */
	private function should_apply_url_to_readmore( string $read_more_url ): bool {
		$source_type = $this->attrs['sourceType'] ?? 'image';

		return '' !== $read_more_url && in_array( $source_type, array( 'post', 'video', 'image' ), true );
	}

	/**
	 * Wrap markup in an anchor pointing at the item.
	 *
	 * @param string $inner_html Markup to wrap.
	 * @param string $url        Destination URL.
	 * @return string
	 */
	private function wrap_with_item_link( string $inner_html, string $url ): string {
		if ( '' === $url ) {
			return $inner_html;
		}

		return sprintf(
			'<a href="%1$s" target="_self" rel="noopener noreferrer" style="%2$s">%3$s</a>',
			esc_url( $url ),
			esc_attr( 'text-decoration:none;color:inherit;' ),
			$inner_html
		);
	}

	/**
	 * Render the post meta slot.
	 *
	 * @param array $item    Item data.
	 * @param array $context Context.
	 * @return string
	 */
	private function render_slot_meta( array $item, array $context ): string {
		$meta_options = $context['metaOptions'] ?? array();
		$source_type  = $context['source_type'] ?? 'image';

		if ( ! 'post' === $source_type ) {
			return '';
		}

		if ( isset( $meta_options['enabled'] ) && false === $meta_options['enabled'] ) {
			return '';
		}

		$show_meta = $meta_options['showMeta'] ?? array( 'date', 'author', 'category' );
		if ( ! is_array( $show_meta ) ) {
			$show_meta = array( 'date', 'author', 'category' );
		}

		$extra = isset( $item['extra'] ) && is_array( $item['extra'] ) ? $item['extra'] : array();

		// Category in the meta row is the "beside meta" representation of the
		// taxonomy slot: it appears here only when the taxonomy position is
		// `beside-meta` (otherwise the standalone taxonomy block owns it, and
		// render_slot_taxonomy suppresses itself in beside-meta mode). Mirrors the
		// editor preview gate in CarouselItem.jsx renderMeta — without it the
		// frontend printed the category both here and in the taxonomy block.
		$taxonomy_position = $context['taxonomyOptions']['position'] ?? '';
		$is_beside_meta    = 'beside-meta' === $taxonomy_position;

		$link_to_archive = 'post' === $source_type;

		$parts = array();
		foreach ( $show_meta as $key ) {
			$part_html = $this->build_meta_part_html( $key, $extra, $is_beside_meta, $link_to_archive );
			if ( '' !== $part_html ) {
				$parts[] = $part_html;
			}
		}

		if ( empty( $parts ) ) {
			return '';
		}

		$separator_key = $meta_options['separator'] ?? 'bullet';
		// Dash/Pipe/Slash/Back Slash are Pro; AllowedValues::meta_separator()
		// already snaps a saved value back to `bullet`, so only these two exist here.
		$separator_map = array(
			'bullet' => '<span class="wpcp-meta-separator"> • </span>',
			'none'   => ' ',
		);
		$separator     = $separator_map[ $separator_key ] ?? '<span class="wpcp-meta-separator"> • </span>';

		return sprintf(
			'<div class="wpcp-item-meta">%1$s</div>',
			wp_kses(
				implode( $separator, $parts ),
				array(
					'span' => array(
						'class' => array(),
					),
					'a'    => array(
						'href'  => array(),
						'class' => array(),
					),
				)
			)
		);
	}

	/**
	 * One meta element (date, author, category, …) as a linked or plain part.
	 *
	 * @param string $key              Meta key from `metaOptions.showMeta`.
	 * @param array  $extra            Item `extra` payload.
	 * @param bool   $is_beside_meta   Whether category renders inside the meta row.
	 * @param bool   $link_to_archive  Link to WordPress archives when URLs/slugs exist.
	 * @return string
	 */
	private function build_meta_part_html( string $key, array $extra, bool $is_beside_meta, bool $link_to_archive ): string {
		switch ( $key ) {
			case 'date':
				$text = isset( $extra['date'] ) ? (string) $extra['date'] : '';
				if ( '' === trim( $text ) ) {
					return '';
				}
				$inner = $this->build_meta_link_html( $text, $link_to_archive ? ( $extra['date_link'] ?? '' ) : '' );
				break;

			case 'author':
				$text = isset( $extra['author'] ) ? (string) $extra['author'] : '';
				if ( '' === trim( $text ) ) {
					return '';
				}
				$inner = $this->build_meta_link_html( $text, $link_to_archive ? ( $extra['author_url'] ?? '' ) : '' );
				break;

			case 'category':
				if ( ! $is_beside_meta ) {
					return '';
				}
				$names = isset( $extra['category'] ) ? (string) $extra['category'] : '';
				if ( '' === trim( $names ) ) {
					return '';
				}
				$inner = $link_to_archive
					? $this->build_meta_taxonomy_links( $names, (string) ( $extra['category_slugs'] ?? '' ), 'category' )
					: esc_html( $names );
				break;

			case 'tags':
				$names = isset( $extra['tag'] ) ? (string) $extra['tag'] : '';
				if ( '' === trim( $names ) ) {
					return '';
				}
				$inner = $link_to_archive
					? $this->build_meta_taxonomy_links( $names, (string) ( $extra['tag_slugs'] ?? '' ), 'post_tag' )
					: esc_html( $names );
				break;

			case 'comments':
				if ( ! isset( $extra['comment_count'] ) ) {
					return '';
				}
				$count = (int) $extra['comment_count'];
				if ( 0 === $count && empty( $extra['comments_link'] ) ) {
					return '';
				}
				$text  = (string) $count;
				$inner = $this->build_meta_link_html( $text, $link_to_archive ? ( $extra['comments_link'] ?? '' ) : '' );
				break;

			case 'views':
				$text = isset( $extra['views'] ) ? (string) $extra['views'] : '';
				if ( '' === trim( $text ) ) {
					return '';
				}
				$inner = esc_html( $text );
				break;

			default:
				return '';
		}

		return sprintf( '<span class="wpcp-item-meta__part">%s</span>', $inner );
	}

	/**
	 * Wrap meta text in an archive link when a URL is available.
	 *
	 * @param string $text Display text.
	 * @param string $url  Archive URL ('' renders plain text).
	 * @return string
	 */
	private function build_meta_link_html( string $text, string $url ): string {
		if ( '' !== $url ) {
			return sprintf(
				'<a href="%s" class="wpcp-item-meta__link">%s</a>',
				esc_url( $url ),
				esc_html( $text )
			);
		}

		return esc_html( $text );
	}

	/**
	 * Comma-separated taxonomy labels, each linked to its archive when a slug resolves.
	 *
	 * @param string $names_text Comma-separated term names.
	 * @param string $slugs_text Comma-separated term slugs.
	 * @param string $taxonomy   WordPress taxonomy slug.
	 * @return string
	 */
	private function build_meta_taxonomy_links( string $names_text, string $slugs_text, string $taxonomy ): string {
		$names = array_values( array_filter( array_map( 'trim', explode( ',', $names_text ) ) ) );
		$slugs = array_values( array_filter( array_map( 'trim', explode( ',', $slugs_text ) ) ) );

		if ( empty( $names ) ) {
			return '';
		}

		$parts = array();
		foreach ( $names as $index => $name ) {
			$slug = $slugs[ $index ] ?? '';
			if ( '' !== $slug ) {
				$term_link = get_term_link( $slug, $taxonomy );
				if ( ! is_wp_error( $term_link ) ) {
					$parts[] = sprintf(
						'<a href="%s" class="wpcp-item-meta__link">%s</a>',
						esc_url( $term_link ),
						esc_html( $name )
					);
					continue;
				}
			}
			$parts[] = esc_html( $name );
		}

		return implode( ', ', $parts );
	}

	/**
	 * Resolve the effective taxonomy display position.
	 *
	 * Product sources have no meta row, so "beside-meta" falls back to the
	 * default in-flow position. "Over The Thumb" is Pro — AllowedValues already
	 * snaps a saved value back to the default before this runs, so only ''
	 * and 'beside-meta' are possible here. Mirrors CarouselItem.jsx's
	 * `taxPosition` resolution; shared by the content-flow suppression.
	 *
	 * @param array  $taxonomy_options taxonomyOptions attribute slice.
	 * @param string $source_type      Resolved source type.
	 * @return string Effective position ('' or 'beside-meta').
	 */
	public static function resolve_taxonomy_position( array $taxonomy_options, string $source_type ): string {
		$position = (string) ( $taxonomy_options['position'] ?? '' );

		if ( 'product' === $source_type && 'beside-meta' === $position ) {
			$position = '';
		}

		return $position;
	}

	/**
	 * Render the taxonomy slot.
	 *
	 * @param array $item    Item data.
	 * @param array $context Context.
	 * @return string
	 */
	private function render_slot_taxonomy( array $item, array $context ): string {
		// Effective position folds in the product override so the beside-meta
		// gate agrees with the content-flow suppression.
		$taxonomy_options  = $context['taxonomyOptions'] ?? array();
		$source_type       = $context['source_type'] ?? 'image';
		$taxonomy_position = self::resolve_taxonomy_position( $taxonomy_options, $source_type );

		if ( ! in_array( $source_type, array( 'post', 'product' ), true ) ) {
			return '';
		}

		// Position "beside meta" moves the terms into the meta row (handled by
		// render_slot_meta); suppress the standalone block so they are not shown
		// twice. Mirrors CarouselItem.jsx renderTaxonomy.
		if ( 'beside-meta' === $taxonomy_position ) {
			return '';
		}

		if ( isset( $taxonomy_options['enabled'] ) && false === $taxonomy_options['enabled'] ) {
			return '';
		}

		$is_product       = ( 'product' === $source_type );
		$default_tax_type = $is_product ? 'product_cat' : 'category';

		$type        = $taxonomy_options['type'] ?? $default_tax_type;
		$tax_key_map = $this->taxonomy_key_map( $is_product );

		if ( ! isset( $tax_key_map[ $type ] ) ) {
			$type = $default_tax_type;
		}
		$tax_keys      = $tax_key_map[ $type ];
		$taxonomy_text = $item['extra'][ $tax_keys['name'] ] ?? '';

		if ( empty( $taxonomy_text ) ) {
			return '';
		}

		$taxonomy_names = array_filter( array_map( 'trim', explode( ',', $taxonomy_text ) ) );

		// Get slugs for link generation.
		$slug_text      = $item['extra'][ $tax_keys['slug'] ] ?? '';
		$taxonomy_slugs = array_filter( array_map( 'trim', explode( ',', $slug_text ) ) );

		// Check if linkToArchive is enabled (default true).
		$link_to_archive = isset( $taxonomy_options['linkToArchive'] )
			? (bool) $taxonomy_options['linkToArchive']
			: true;

		$taxonomy_el = '';

		foreach ( $taxonomy_names as $index => $tax_name ) {
			$slug         = ( $link_to_archive && ! empty( $taxonomy_slugs[ $index ] ) ) ? $taxonomy_slugs[ $index ] : '';
			$taxonomy_el .= $this->build_taxonomy_term_html( $tax_name, $slug, $type, $is_product );
		}

		return sprintf(
			'<div class="wpcp-taxonomy-wrapper">%1$s</div>',
			$taxonomy_el
		);
	}

	/**
	 * Block taxonomy type → item `extra` keys (display names + archive slugs).
	 *
	 * @param bool $is_product Whether this is a product source.
	 * @return array<string, array{name:string, slug:string}>
	 */
	private function taxonomy_key_map( bool $is_product ): array {
		return $is_product
			? array(
				'product_cat'   => array(
					'name' => 'category',
					'slug' => 'category_slugs',
				),
				'product_tag'   => array(
					'name' => 'tag',
					'slug' => 'tag_slugs',
				),
				'product_brand' => array(
					'name' => 'product_brand',
					'slug' => 'product_brand_slugs',
				),
			)
			: array(
				'category' => array(
					'name' => 'category',
					'slug' => 'category_slugs',
				),
				'tag'      => array(
					'name' => 'tag',
					'slug' => 'tag_slugs',
				),
			);
	}

	/**
	 * One taxonomy term: an archive link when a slug resolves, a span otherwise.
	 *
	 * @param string $tax_name   Term display name.
	 * @param string $slug       Term slug ('' disables linking).
	 * @param string $type       Block taxonomy type.
	 * @param bool   $is_product Whether this is a product source.
	 * @return string
	 */
	private function build_taxonomy_term_html( string $tax_name, string $slug, string $type, bool $is_product ): string {
		if ( '' !== $slug ) {
			// Map block taxonomy type to the WordPress taxonomy name for get_term_link.
			$wp_taxonomy = $this->map_taxonomy_type_to_wp( $type, $is_product );
			$term_link   = get_term_link( $slug, $wp_taxonomy );

			if ( ! is_wp_error( $term_link ) ) {
				return sprintf(
					'<a href="%s" class="wpcp-item-taxonomy">%s</a>',
					esc_url( $term_link ),
					esc_html( $tax_name )
				);
			}
		}

		// Fallback to plain span if no link or error.
		return sprintf(
			'<span class="wpcp-item-taxonomy">%s</span>',
			esc_html( $tax_name )
		);
	}

	/**
	 * Map block taxonomy type to WordPress taxonomy name.
	 *
	 * @param string $type      Block taxonomy type.
	 * @param bool   $is_product Whether this is a product source.
	 * @return string WordPress taxonomy name.
	 */
	private function map_taxonomy_type_to_wp( string $type, bool $is_product ): string {
		if ( $is_product ) {
			$map = array(
				'product_cat'   => 'product_cat',
				'product_tag'   => 'product_tag',
				'product_brand' => 'product_brand',
			);
			return $map[ $type ] ?? 'product_cat';
		}

		$map = array(
			'category' => 'category',
			'tag'      => 'post_tag',
		);
		return $map[ $type ] ?? 'category';
	}

	/**
	 * Render the rating slot.
	 *
	 * @param array $item    Item data.
	 * @param array $context Context.
	 * @return string
	 */
	private function render_slot_rating( array $item, array $context ): string {
		$rating_options = $context['ratingOptions'] ?? array();
		$source_type    = $context['source_type'] ?? 'image';

		if ( 'product' !== $source_type ) {
			return '';
		}

		if ( isset( $rating_options['enabled'] ) && false === $rating_options['enabled'] ) {
			return '';
		}

		$rating_raw = $item['extra']['rating'] ?? '';
		if ( '' === $rating_raw ) {
			return '';
		}

		$rating_value = (float) $rating_raw;
		if ( $rating_value <= 0 ) {
			return '';
		}

		$normalized_rating = max( 0.0, min( 5.0, $rating_value ) );

		// The icon-set picker stores a `star-set-*` key in `ratingIcon`. Each set
		// carries a matched empty (background) and active (filled) glyph; the fill
		// overlay is clipped to the rating percentage, so the two must stay paired.
		// An unset or unknown key falls back to the Unicode star so blocks that
		// never opened the picker render unchanged. Mirrors RatingStars.jsx.
		$icon_sets    = $this->rating_icon_sets();
		$rating_icon  = isset( $rating_options['ratingIcon'] ) ? (string) $rating_options['ratingIcon'] : '';
		$icon_set     = $icon_sets[ $rating_icon ] ?? null;
		$empty_icon   = null === $icon_set ? '★' : $icon_set['empty'];
		$active_icon  = null === $icon_set ? '★' : $icon_set['active'];
		$stars_markup = '';

		// Gap must exist only between sibling icon wrappers. Each wrapper keeps an
		// empty icon and a fill overlay stacked in the same coordinates so partial
		// ratings clip the fill width without separating the two halves of one icon.
		for ( $star_index = 0; $star_index < 5; $star_index++ ) {
			$fill_percentage = max( 0.0, min( 100.0, ( $normalized_rating - $star_index ) * 100 ) );
			$stars_markup   .= sprintf(
				'<span class="wpcp-rating-icon-wrap">
					<span class="wpcp-rating-empty">%1$s</span>
					<span class="wpcp-rating-fill" style="width:%2$s;">%3$s</span>
				</span>',
				$empty_icon,
				esc_attr( $fill_percentage . '%' ),
				$active_icon
			);
		}

		return sprintf(
			'<div class="wpcp-item-rating" aria-label="%1$s">%2$s</div>',
			esc_attr(
				sprintf(
					/* translators: %s: product rating value. */
					__( 'Rating %s out of 5', 'wp-carousel-free' ),
					rtrim( rtrim( number_format( $normalized_rating, 2, '.', '' ), '0' ), '.' )
				)
			),
			$stars_markup
		);
	}

	/**
	 * Rating icon-set glyphs, keyed by the picker's `star-set-*` value.
	 *
	 * Mirrors `RatingIconSetValue` in blocks/icons/iconSet.js — each set carries
	 * a matched empty (background) and active (fill) glyph, with the same baked-in
	 * active (#f5b301) / empty (#949494) colors the editor preview renders, so the
	 * frontend stays pixel-parity with the editor. The `clipPath` wrappers from the
	 * JS source are dropped on purpose: they referenced `<defs>` that were never
	 * defined, so browsers applied no clipping — omitting them is identical.
	 *
	 * @return array<string, array{active: string, empty: string}>
	 */
	private function rating_icon_sets(): array {

		$star_fill    = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m8 .5 2.53 4.884 5.47.858-3.918 3.864.87 5.394L8 13.031 3.075 15.5l.843-5.394L0 6.242l5.497-.858z" fill="currentColor"/></svg>';
		$star_stroke  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m9.998 5.66.14.27.3.047 4.293.673-3.07 3.03-.22.216.048.306.685 4.24-3.906-1.948-.269-.134-.268.135-3.883 1.946.663-4.242.048-.303-.22-.216-3.07-3.03 4.32-.673.303-.047.138-.273L8.002 1.81z" stroke="currentColor" stroke-width="1.2"/></svg>';
		$circle_fill  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 16a8 8 0 0 0 8-8 8 8 0 0 0-8-8 8 8 0 0 0-8 8 8 8 0 0 0 8 8M6.553 6.01 8 3.174l1.447 2.834 3.144.5-2.25 2.25.497 3.144L8 10.46l-2.838 1.444.497-3.144-2.25-2.25z" fill="currentColor"/></svg>';
		$circle_empty = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 .5a7.5 7.5 0 0 1 .5 14.981v-.2A7.299 7.299 0 0 0 8 .7a7.3 7.3 0 0 0-.5 14.58v.2A7.5 7.5 0 0 1 8 .5Zm.98 6.077.116.225.25.039 2.096.329-1.497 1.477-.184.182.042.254.334 2.071-1.914-.953-.224-.111-.223.112-1.903.953.325-2.074.04-.254-.183-.18L4.558 7.17l2.111-.33.252-.038.116-.227.965-1.884z" stroke="currentColor"/></svg>';
		$square_fill  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M16 16H0V0h16zM6.357 6.256l-3.607.572 2.571 2.576L4.768 13 8 11.354 11.25 13l-.571-3.596 2.571-2.576-3.589-.572L8 3z" fill="currentColor"/></svg>';
		$round_fill   = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7.115 2.227a1 1 0 0 1 1.778-.004l1.405 2.711a1 1 0 0 0 .733.528l3.01.473a1 1 0 0 1 .547 1.7l-2.14 2.11a1 1 0 0 0-.284.87l.478 2.961a1 1 0 0 1-1.433 1.055l-2.762-1.377a1 1 0 0 0-.894.001L4.811 14.63a1 1 0 0 1-1.436-1.049l.464-2.968a1 1 0 0 0-.286-.867l-2.14-2.11a1 1 0 0 1 .548-1.7l3.032-.474a1 1 0 0 0 .736-.532z" fill="currentColor"/></svg>';
		$round_empty  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7.648 2.5a.4.4 0 0 1 .712-.001L9.765 5.21c.234.452.67.766 1.172.845l3.011.472a.4.4 0 0 1 .219.681l-2.14 2.11a1.6 1.6 0 0 0-.456 1.393l.479 2.96a.4.4 0 0 1-.573.423l-2.762-1.376a1.6 1.6 0 0 0-1.43 0l-2.743 1.376a.4.4 0 0 1-.574-.42l.464-2.968a1.6 1.6 0 0 0-.457-1.387l-2.14-2.11a.4.4 0 0 1 .219-.68l3.032-.474a1.6 1.6 0 0 0 1.177-.85z" stroke="currentColor" stroke-width="1.2"/></svg>';
		$heart_fill   = '<svg width="15" height="13" viewBox="0 0 15 13" fill="none" aria-hidden="true"><path d="m6.966 1.593.434.598.434-.598A3.85 3.85 0 0 1 14.8 3.847v.076c0 3.243-4.044 7.01-6.154 8.62a2.06 2.06 0 0 1-1.246.407 2.03 2.03 0 0 1-1.246-.408C4.044 10.932 0 7.166 0 3.922v-.075a3.848 3.848 0 0 1 6.966-2.254" fill="currentColor"/></svg>';
		$heart_empty  = '<svg width="15" height="13" viewBox="0 0 15 13" fill="none" aria-hidden="true"><path d="M10.952.6A3.25 3.25 0 0 1 14.2 3.848v.075c0 1.4-.891 3.013-2.15 4.54-1.236 1.503-2.737 2.816-3.767 3.602a1.46 1.46 0 0 1-.883.285c-.331 0-.641-.099-.88-.283l-.001-.002-.408-.318C5.117 10.95 3.832 9.78 2.75 8.464 1.491 6.936.599 5.324.599 3.923v-.075A3.249 3.249 0 0 1 6.362 1.79l.12.154.433.599.486.67.486-.67.433-.599h.001A3.25 3.25 0 0 1 10.952.6Z" stroke="currentColor" stroke-width="1.2"/></svg>';

		return array(
			'star-set-1' => array(
				'active' => $star_fill,
				'empty'  => $star_stroke,
			),
			'star-set-2' => array(
				'active' => $star_fill,
				'empty'  => $star_fill,
			),
			'star-set-3' => array(
				'active' => $circle_fill,
				'empty'  => $circle_fill,
			),
			'star-set-4' => array(
				'active' => $circle_fill,
				'empty'  => $circle_empty,
			),
			'star-set-5' => array(
				'active' => $square_fill,
				'empty'  => $square_fill,
			),
			'star-set-6' => array(
				'active' => $round_fill,
				'empty'  => $round_empty,
			),
			'star-set-7' => array(
				'active' => $heart_fill,
				'empty'  => $heart_fill,
			),
			'star-set-8' => array(
				'active' => $heart_fill,
				'empty'  => $heart_empty,
			),
		);
	}

	/**
	 * Render the price slot.
	 *
	 * @param array $item    Item data.
	 * @param array $context Context.
	 * @return string
	 */
	private function render_slot_price( array $item, array $context ): string {
		$product_content_options = $context['productContentOptions'] ?? array();
		$source_type             = $context['source_type'] ?? 'image';

		if ( 'product' !== $source_type ) {
			return '';
		}

		if ( isset( $product_content_options['showPrice'] ) && false === $product_content_options['showPrice'] ) {
			return '';
		}

		$price_text = $item['extra']['price'] ?? $item['price'] ?? '';
		if ( empty( $price_text ) ) {
			return '';
		}

		$allowed_html = array(
			'del'  => array(
				'class' => true,
				'style' => true,
			),
			'ins'  => array(
				'class' => true,
				'style' => true,
			),
			'span' => array(
				'class' => true,
				'style' => true,
			),
			'bdi'  => array(
				'class' => true,
				'style' => true,
			),
		);

		return sprintf(
			'<div class="wpcp-item-price">%1$s</div>',
			wp_kses( $price_text, $allowed_html )
		);
	}

	/**
	 * Render the social share slot.
	 *
	 * @param array $item    Item data.
	 * @param array $context Context with socialShareOptions.
	 * @return string
	 */
	private function render_slot_social( array $item, array $context ): string {
		$social_share_options = $context['socialShareOptions'] ?? array();
		if ( array_key_exists( 'enabled', $social_share_options ) && false === (bool) $social_share_options['enabled'] ) {
			return '';
		}

		return $this->social_share->render( $item );
	}
}
