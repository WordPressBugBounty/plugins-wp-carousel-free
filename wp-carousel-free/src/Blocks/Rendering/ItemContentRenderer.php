<?php
/**
 * Item content renderer.
 *
 * Extracted from BlockRenderer: builds the per-item content area with full slot
 * ordering (`render_item_content_ordered`), dispatches individual slots through
 * SlotRenderer (`render_content_slot`), and resolves the content-wrapper
 * position / dimension classes and inline styles. Parity-locked to the editor
 * content-area rendering.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

defined( 'ABSPATH' ) || exit;

/**
 * ItemContentRenderer class.
 */
class ItemContentRenderer {

	/**
	 * Block attributes.
	 *
	 * @var array
	 */
	private $attrs;

	/**
	 * Memoized slot renderer.
	 *
	 * @var SlotRenderer|null
	 */
	private $slot_renderer = null;

	/**
	 * Constructor.
	 *
	 * @param array $attrs Block attributes.
	 */
	public function __construct( array $attrs ) {
		$this->attrs = $attrs;
	}

	/**
	 * Lazily build the slot renderer (with its social-share collaborator).
	 *
	 * @return SlotRenderer
	 */
	private function get_slot_renderer(): SlotRenderer {
		if ( null === $this->slot_renderer ) {
			$this->slot_renderer = new SlotRenderer( $this->attrs, new SocialShareRenderer( $this->attrs ) );
		}
		return $this->slot_renderer;
	}

	/**
	 * Resolve the effective content slot order: saved `contentAreaOptions.order`
	 * or the per-source default, plus the video Read More append. The
	 * saved order is used as-is (missing slots are not appended — matching the
	 * frontend behavior the editor's `resolveContentOrder` mirrors for `image`
	 * via the ContentRuns image-first fallback).
	 *
	 * @return array Ordered slot ids.
	 */
	public function resolve_content_order(): array {
		$content_area_options = $this->attrs['contentAreaOptions'] ?? array();
		$source_type          = $this->attrs['sourceType'] ?? 'image';

		$default_order = array(
			'image'   => array( 'image', 'title', 'description', 'readmore', 'social' ),
			'post'    => array( 'image', 'meta', 'title', 'taxonomy', 'excerpt', 'readmore', 'social' ),
			'product' => array( 'image', 'title', 'rating', 'taxonomy', 'price', 'excerpt', 'readmore', 'social' ),
			'video'   => array( 'image', 'title', 'description', 'social', 'readmore' ),
		);

		$content_order = $content_area_options['order'] ?? $default_order[ $source_type ] ?? $default_order['image'];
		if ( ! is_array( $content_order ) || empty( $content_order ) ) {
			$content_order = $default_order[ $source_type ] ?? $default_order['image'];
		}
		if ( 'video' === $source_type && $this->get_slot_renderer()->is_slot_visible( 'readmore' ) && ! in_array( 'readmore', $content_order, true ) ) {
			$content_order[] = 'readmore';
		}

		return $content_order;
	}

	/**
	 * Render item content with full slot ordering support (matches editor behavior).
	 *
	 * @param array      $item               Normalised slide item.
	 * @param string     $content_orientation Content orientation type.
	 * @param array|null $slot_subset        Pre-resolved slot ids to render into one
	 *                                       wrapper (a Classic content "run"); null
	 *                                       renders the full resolved order.
	 * @return string
	 */
	public function render_item_content_ordered( array $item, string $content_orientation, ?array $slot_subset = null ): string {
		$content_options         = $this->attrs['contentOptions'] ?? array();
		$taxonomy_options        = $this->attrs['taxonomyOptions'] ?? array();
		$meta_options            = $this->attrs['metaOptions'] ?? array();
		$rating_options          = $this->attrs['ratingOptions'] ?? array();
		$social_share_options    = $this->attrs['socialShareOptions'] ?? array();
		$product_content_options = $this->attrs['productContentOptions'] ?? array();
		$source_type             = $this->attrs['sourceType'] ?? 'image';

		$content_order = null === $slot_subset ? $this->resolve_content_order() : $slot_subset;

		// Build content slots.
		$slots = array();
		foreach ( $content_order as $part ) {
			$slot_html = $this->render_content_slot( $part, $item, $content_options, $taxonomy_options, $meta_options, $rating_options, $social_share_options, $product_content_options, $source_type, $content_orientation );
			if ( '' !== $slot_html ) {
				$slots[] = $slot_html;
			}
		}

		if ( empty( $slots ) ) {
			return '';
		}

		$align = $content_options['alignment'] ?? 'left';
		if ( ! in_array( $align, array( 'left', 'center', 'right' ), true ) ) {
			$align = 'left';
		}

		$display_on_hover = $this->attr_bool( $content_options, 'displayOnHover', false );
		// "Display Content on Hover Only" hides the overlay text until hover — only
		// for overlay-style orientations (overlay/diagonal). Classic and the other
		// flow/static orientations keep their content always visible, matching the
		// editor preview's `onHover` gate.
		$reveal_on_hover  = $display_on_hover && EffectClasses::is_content_hover_orientation( $content_orientation );
		$hover            = $reveal_on_hover ? ' wpcp-content-hover' : '';
		$is_overlay_style = in_array( $content_orientation, array( 'overlay', 'diagonal' ), true );
		$overlay_class    = $is_overlay_style ? ' wpcp-content-overlay' : '';
		// Hover Animation content effect class (Custom mode, gated to non-Classic
		// + Display-on-Hover). Mirrors the editor preview's `.wpcp-item-content`.
		$content_anim                = EffectClasses::content_class(
			$this->attrs['effectsOptions'] ?? array(),
			$content_orientation,
			$display_on_hover
		);
		$content_anim_class          = '' !== $content_anim ? ' ' . $content_anim : '';
		$content_flow_position_class = $this->get_content_flow_position_class(
			$content_orientation,
			$content_options['position'] ?? 'bottom'
		);
		// Only true "Overlay" exposes the 9-point Content Position control.
		$content_position_class         = ( 'overlay' === $content_orientation )
			? $this->get_content_position_class( $content_options['contentPosition'] ?? '' )
			: '';
		$overlay_content_dimension_attr = ( 'overlay' === $content_orientation )
			? $this->get_overlay_content_dimension_attr( $content_options )
			: '';
		$content_style_attr             = $overlay_content_dimension_attr;
		$diagonal_style                 = ( 'right' === ( $this->attrs['layoutOptions']['diagonalStyle'] ?? 'left' ) ) ? 'right' : 'left';
		// The Diagonal orientation exposes only a Height control (see the editor's
		// ImageContentSettings); size the `.wpcp-diagonal-caption` box. Empty value
		// emits nothing, mirroring the editor's getContentDimensionStyle path.
		$diagonal_caption_height     = ( 'diagonal' === $content_orientation )
			? $this->get_responsive_content_dimension_style( $content_options['contentHeight'] ?? array(), 'height' )
			: '';
		$diagonal_caption_style_attr = '' !== $diagonal_caption_height
			? ' style="' . esc_attr( $diagonal_caption_height ) . '"'
			: '';
		$content_markup              = 'diagonal' === $content_orientation
			? sprintf( '<div class="wpcp-diagonal-caption wpcp-diagonal-%1$s"%3$s>%2$s</div>', $diagonal_style, implode( '', $slots ), $diagonal_caption_style_attr )
			: implode( '', $slots );

		$html = sprintf(
			'<div class="wpcp-item-content%1$s%2$s%3$s%4$s%8$s wpcp-content-align wpcp-content-align--%5$s"%6$s>%7$s</div>',
			$content_flow_position_class,
			$content_position_class,
			$hover,
			$overlay_class,
			sanitize_html_class( $align ),
			$content_style_attr,
			$content_markup,
			$content_anim_class
		);

		return $html;
	}

	/**
	 * Render a single content slot.
	 *
	 * Uses SlotRenderer to dispatch to the appropriate slot implementation.
	 *
	 * @param string $slot_type              Slot type identifier.
	 * @param array  $item                   Normalised slide item.
	 * @param array  $content_options         Content options.
	 * @param array  $taxonomy_options        Taxonomy options.
	 * @param array  $meta_options            Meta options.
	 * @param array  $rating_options          Rating options.
	 * @param array  $social_share_options    Social share options.
	 * @param array  $product_content_options Product content options.
	 * @param string $source_type             Source type.
	 * @param string $content_orientation     Resolved content orientation.
	 * @return string
	 */
	private function render_content_slot( string $slot_type, array $item, array $content_options, array $taxonomy_options, array $meta_options, array $rating_options, array $social_share_options, array $product_content_options, string $source_type, string $content_orientation ): string {
		$slots = $this->get_slot_renderer();
		// Check if slot is visible.
		if ( ! $slots->is_slot_visible( $slot_type ) ) {
			return '';
		}

		// Image slot is handled separately in render_item().
		if ( 'image' === $slot_type ) {
			return '';
		}

		// Build context for slot renderer methods.
		$context = array(
			'contentOptions'        => $content_options,
			'postContentOptions'    => $this->attrs['postContentOptions'] ?? array(),
			'taxonomyOptions'       => $taxonomy_options,
			'metaOptions'           => $meta_options,
			'ratingOptions'         => $rating_options,
			'socialShareOptions'    => $social_share_options,
			'productContentOptions' => $product_content_options,
			'source_type'           => $source_type,
			'content_orientation'   => $content_orientation,
		);

		$content = $slots->render( $slot_type, $item, $context );

		if ( '' === $content ) {
			return '';
		}

		return sprintf(
			'<div class="wpcp-content-slot wpcp-content-slot--%1$s">%2$s</div>',
			sanitize_html_class( $slot_type ),
			$content
		);
	}

	/**
	 * Check if a content slot should be visible.
	 *
	 * @param array  $content_options Content options array.
	 * @param string $key            Option key to check.
	 * @param bool   $default_value  Default value if key not found.
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
	 * Resolve the optional content flow position class (image-top only).
	 *
	 * @param string $content_orientation Resolved content orientation.
	 * @param mixed  $raw_position        Raw contentOptions.position.
	 * @return string Leading-space class fragment or empty string.
	 */
	private function get_content_flow_position_class( string $content_orientation, $raw_position ): string {
		if ( 'image-top' !== $content_orientation ) {
			return '';
		}

		$position = is_string( $raw_position ) ? strtolower( trim( $raw_position ) ) : 'bottom';
		if ( ! in_array( $position, array( 'top', 'center', 'bottom' ), true ) ) {
			$position = 'bottom';
		}

		return ' wpcp-content-' . sanitize_html_class( $position );
	}

	/**
	 * Resolve the optional 9-point content wrapper position class.
	 *
	 * Empty values intentionally return no class so existing saved blocks keep
	 * their pre-existing overlay layout until the control is explicitly changed.
	 *
	 * @param mixed $raw_position Raw contentPosition attribute.
	 * @return string Leading-space class fragment or empty string.
	 */
	private function get_content_position_class( $raw_position ): string {
		if ( ! is_string( $raw_position ) || '' === trim( $raw_position ) ) {
			return '';
		}

		$slug = strtolower( preg_replace( '/\s+/', '-', trim( $raw_position ) ) );
		if ( 'center' === $slug ) {
			$slug = 'center-center';
		}

		$allowed_positions = array(
			'top-left',
			'top-center',
			'top-right',
			'center-left',
			'center-center',
			'center-right',
			'bottom-left',
			'bottom-center',
			'bottom-right',
		);

		if ( ! in_array( $slug, $allowed_positions, true ) ) {
			return '';
		}

		return ' wpcp-content-position--' . sanitize_html_class( $slug );
	}

	/**
	 * Resolve optional inline width/height styles for overlay content wrapper.
	 *
	 * @param mixed $content_options contentOptions attribute.
	 * @return string Leading-space style attribute or empty string.
	 */
	private function get_overlay_content_dimension_attr( $content_options ): string {
		if ( ! is_array( $content_options ) ) {
			return '';
		}

		$styles = array();

		$content_width_style = $this->get_responsive_content_dimension_style(
			$content_options['contentWidth'] ?? array(),
			'width'
		);
		if ( '' !== $content_width_style ) {
			$styles[] = $content_width_style;
		}

		$content_height_style = $this->get_responsive_content_dimension_style(
			$content_options['contentHeight'] ?? array(),
			'height'
		);
		if ( '' !== $content_height_style ) {
			$styles[] = $content_height_style;
		}

		$block_name = $this->attrs['blockName'] ?? '';
		if ( empty( $styles ) && 'thumbnails-slider' !== $block_name ) {
			return ' style="width: -webkit-fill-available"';
		}

		return ' style="' . esc_attr( implode( '', $styles ) ) . '"';
	}

	/**
	 * Resolve a single responsive Desktop dimension declaration.
	 *
	 * @param mixed  $dimension_attr Responsive dimension attribute.
	 * @param string $property_name  CSS property name.
	 * @return string CSS declaration or empty string.
	 */
	private function get_responsive_content_dimension_style( $dimension_attr, string $property_name ): string {
		if ( ! is_array( $dimension_attr ) ) {
			return '';
		}

		$value = $dimension_attr['device']['Desktop'] ?? '';
		if ( '' === trim( (string) $value ) ) {
			return '';
		}

		if ( ! is_numeric( $value ) || (float) $value < 0 ) {
			return '';
		}

		$dimension_value = (float) $value;
		$unit            = $dimension_attr['unit']['Desktop'] ?? 'px';
		$allowed_units   = array( 'px', '%', 'em' );
		if ( ! in_array( $unit, $allowed_units, true ) ) {
			$unit = 'px';
		}

		return $property_name . ':' . (string) $dimension_value . $unit . ';';
	}
}
