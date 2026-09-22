<?php
/**
 * Per-item (slide) renderer.
 *
 * Extracted from BlockRenderer: builds one carousel slide's full markup —
 * media box (image / lightbox anchor), overlay icons,
 * ordered content slots and video cards. Parity-locked to the editor
 * `CarouselItem.jsx` preview.
 *
 * Owns the per-slide collaborator instances (slot / social-share / video card /
 * overlay icon) so their cross-item state persists across every slide in a
 * single render. BlockRenderer therefore memoizes ONE ItemRenderer per render()
 * via `get_item_renderer()`.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Item_Text;

defined( 'ABSPATH' ) || exit;

/**
 * ItemRenderer class.
 */
class ItemRenderer {

	/**
	 * Full block attributes.
	 *
	 * @var array
	 */
	private array $attrs;

	/**
	 * Block slug without namespace, e.g. "carousel".
	 *
	 * @var string
	 */
	private string $slug;

	/**
	 * Root element id (advanced cssId, uniqueId, or generated). Used for lightbox grouping.
	 *
	 * @var string
	 */
	private string $root_element_id;

	/**
	 * Whether variable-width Swiper slides are active for this render.
	 *
	 * @var bool
	 */
	private bool $effective_variable_width;

	/**
	 * Lazy-built social share markup helper.
	 *
	 * @var SocialShareRenderer|null
	 */
	private ?SocialShareRenderer $social_share_renderer = null;

	/**
	 * Lazy-built per-slot content renderer.
	 *
	 * @var SlotRenderer|null
	 */
	private ?SlotRenderer $slot_renderer = null;

	/**
	 * Lazy-built video card renderer (cards, embed URLs, source-type detection).
	 *
	 * @var VideoCardRenderer|null
	 */
	private ?VideoCardRenderer $video_card_renderer = null;

	/**
	 * Lazy-built overlay-icon renderer for overlay-icon click-action mode.
	 *
	 * @var OverlayIconRenderer|null
	 */
	private ?OverlayIconRenderer $overlay_icon_renderer = null;

	/**
	 * Constructor.
	 *
	 * @param array  $attrs                    Block attributes (already deep-normalised by BlockRenderer).
	 * @param string $slug                     Block slug without namespace.
	 * @param string $root_element_id          Resolved root element id for lightbox grouping.
	 * @param bool   $effective_variable_width Whether variable-width Swiper slides are active.
	 */
	public function __construct( array $attrs, string $slug, string $root_element_id, bool $effective_variable_width ) {
		$this->attrs                    = $attrs;
		$this->slug                     = $slug;
		$this->root_element_id          = $root_element_id;
		$this->effective_variable_width = $effective_variable_width;
	}

	/**
	 * Render a single carousel item (slide).
	 *
	 * @param array  $item        Normalised item.
	 * @param string $render_mode '' = Swiper slide; `grouped_slide` = item inside a grouped Swiper slide.
	 * @return string
	 */
	public function render_item( array $item, string $render_mode = '' ): string {
		$image_options   = $this->attrs['imageOptions'] ?? array();
		$content_options = $this->attrs['contentOptions'] ?? array();
		$effects_options = $this->attrs['effectsOptions'] ?? array();
		$layout_options  = $this->attrs['layoutOptions'] ?? array();
		$source_type     = $this->attrs['sourceType'] ?? 'image';

		$content_orientation = $this->resolve_content_orientation(
			$source_type,
			(string) ( $layout_options['contentOrientation'] ?? 'image-top' )
		);

		$item_classes = $this->build_item_classes( $render_mode, $effects_options );

		// "Display Content on Hover Only" — drives both the per-item reveal and
		// the Hover Animation Overlay/Content activation gate (EffectClasses).
		$display_on_hover = ! empty( $content_options['displayOnHover'] );

		$click = $this->resolve_click_action( $item, $source_type );

		// Slider: Image panel Aspect Ratio is stage-level (`.wpcp-swiper`), not
		// per-item — force outer media `original` (mirrors CarouselItem.jsx).
		// Super Flow: stage + effect CSS own media sizing; an item aspect box
		// pushes edge-crop fragments off-screen.
		// Variable width: slides measure rendered image width and collapse to 0
		// if boxed.
		$aspect_ratio     = ( 'slider' === $this->slug || DimensionHelper::needs_original_aspect_for_variable_width( $this->attrs ) )
			? 'original'
			: DimensionHelper::resolve_outer_media_aspect( $source_type, $image_options );
		$custom_dim_style = DimensionHelper::build_media_dimension_style_attr( $image_options, $aspect_ratio );

		$image_src        = $this->resolve_media_source( $item, $source_type );
		$lightbox_src     = $this->resolve_lightbox_source( $item, $source_type, $image_src );
		$focal_style_attr = $this->build_item_focal_style_attr( $item, $aspect_ratio );
		$img_tag          = $this->build_image_tag( $item, $image_src, $focal_style_attr, $image_options );

		$media_class_attr = $this->build_media_class_attr( $source_type, $image_options, $aspect_ratio );
		$media_html       = $this->build_media_html(
			$item,
			$source_type,
			$click,
			$lightbox_src,
			$img_tag,
			$media_class_attr . $custom_dim_style,
			$effects_options
		);

		// Content section with ordering support. Classic (image-top) builds its
		// body from content runs below instead.
		$item_content_renderer  = new ItemContentRenderer( $this->attrs );
		$is_classic_orientation = ( 'image-top' === $content_orientation );
		$content_html           = $is_classic_orientation
			? ''
			: $item_content_renderer->render_item_content_ordered( $item, $content_orientation );

		$inner_classes    = $this->build_inner_classes( $effects_options, $content_orientation, $display_on_hover );
		$slide_outer_attr = $this->build_slide_outer_attr( $item );

		// Wrap video card with same media classes as images. External feeds whose
		// items are videos (YouTube) use the same card, so they honour videoOptions.
		if ( 'video' === $source_type ) {
			$video_inner  = $this->get_video_card_renderer()->render_card( $img_tag, $item );
			$media_markup = '<div' . $media_class_attr . $custom_dim_style . '>' . $video_inner . '</div>';
		} else {
			$media_markup = $media_html;
		}

		$interaction_html = '';

		if ( $is_classic_orientation ) {
			// Classic honors the image position in the element order: the body is
			// a sequence of media / content "runs" (mirrors the editor's
			// splitContentRuns). The default image-first order produces exactly
			// the legacy media-then-content markup.
			$resolved_content_order = $item_content_renderer->resolve_content_order();
			$content_runs           = ContentRuns::split( $resolved_content_order, $this->is_slot_visible( 'image' ) );

			$item_body_markup = '';
			foreach ( $content_runs as $content_run ) {
				if ( 'media' === $content_run['type'] ) {
					$item_body_markup .= $media_markup;
					continue;
				}
				$item_body_markup .= $item_content_renderer->render_item_content_ordered( $item, $content_orientation, $content_run['slots'] );
			}

			if ( ContentRuns::runs_require_dom_order( $content_runs ) ) {
				$inner_classes[] = 'wpcp-content-runs';
			}
		} else {
			$item_body_markup = $media_markup . $content_html;
		}

		$item_inner_markup = sprintf(
			'<div class="%1$s">%2$s</div>',
			esc_attr( implode( ' ', $inner_classes ) ),
			$item_body_markup
		);

		return sprintf(
			'<div class="%1$s"%4$s>%2$s%3$s</div>',
			esc_attr( implode( ' ', $item_classes ) ),
			$item_inner_markup,
			$interaction_html,
			$slide_outer_attr
		);
	}

	/**
	 * Build the outer slide class list and the image-hover effect class.
	 *
	 * @param string $render_mode     Render mode (see render_item()).
	 * @param array  $effects_options effectsOptions attribute slice.
	 * @return string[]
	 */
	private function build_item_classes( string $render_mode, array $effects_options ): array {
		$item_classes = array( 'wpcp-item' );
		if ( 'grouped_slide' === $render_mode ) {
			$item_classes[] = 'wpcp-item--grouped-slide';
		} else {
			$item_classes[] = 'swiper-slide';
		}

		if ( ! empty( $effects_options['imageHover'] ) && 'none' !== $effects_options['imageHover'] ) {
			$item_classes[] = 'wpcp-hover-' . sanitize_html_class( $effects_options['imageHover'] );
		}

		return $item_classes;
	}

	/**
	 * Resolve the click action into one value object consumed by the media
	 * anchor dispatch and the overlay-icon renderer.
	 *
	 * @param array  $item           Normalised item.
	 * @param string $source_type    Block sourceType attribute.
	 * @return array{type:string, is_lightbox:bool, link_url:string, source_links_to_permalink:bool}
	 */
	private function resolve_click_action( array $item, string $source_type ): array {
		$click_action_options = $this->attrs['clickActionOptions'] ?? array();

		$action_type = $click_action_options['type'] ?? 'lightbox';
		$is_lightbox = 'lightbox' === $action_type;

		// Post and product carousels link each card to its permalink on the published
		// frontend instead of opening a lightbox. The Click Action panel is hidden for
		// these sources, so the schema default 'lightbox' would otherwise wrap the image
		// in a FancyBox anchor. Editor preview (CarouselItem.jsx) suppresses these links
		// via `sourceLinksToPermalinkOnFrontend`; this PHP path is frontend-only. Direct
		// media has no inherent permalink, so it never gets a link target.
		$source_links_to_permalink = in_array( $source_type, array( 'post', 'product' ), true );
		$link_url                  = $source_links_to_permalink ? (string) ( $item['url'] ?? '' ) : '';
		if ( $source_links_to_permalink ) {
			$is_lightbox = false;
		}

		return array(
			'type'                      => $action_type,
			'is_lightbox'               => $is_lightbox,
			'link_url'                  => $link_url,
			'source_links_to_permalink' => $source_links_to_permalink,
		);
	}

	/**
	 * Resolve the displayed image source: non-image placeholder fallback and
	 * video custom thumbnail.
	 *
	 * @param array  $item          Normalised item.
	 * @param string $source_type   Block sourceType attribute.
	 * @return string
	 */
	private function resolve_media_source( array $item, string $source_type ): string {
		$image_src = $item['image_url'] ?? '';

		if ( 'video' === $source_type ) {
			$image_src = ! empty( $item['customThumbnailUrl'] ) ? $item['customThumbnailUrl'] : ( $item['image_url'] ?? '' );
		}

		// The shipped video artwork stands in for a video whose provider gave no
		// thumbnail. Every other source falls through to the inline placeholder
		// markup the editor preview renders, so a post with no featured image
		// does not advertise itself as a video.
		if ( empty( $image_src ) && 'video' === $source_type ) {
			$image_src = WPCAROUSELF_URL . 'src/Blocks/img/video-placeholder.svg';
		}

		return $image_src;
	}

	/**
	 * Resolve the lightbox destination image.
	 *
	 * Image-source lightboxes open the original, unscaled upload rather than the
	 * resized slide image. Non-image sources fall back to the displayed media
	 * source.
	 *
	 * @param array  $item          Normalised item.
	 * @param string $source_type   Block sourceType attribute.
	 * @param string $image_src   Resolved displayed media source (lightbox fallback).
	 * @return string
	 */
	private function resolve_lightbox_source( array $item, string $source_type, string $image_src ): string {
		if ( 'image' !== $source_type ) {
			return $image_src;
		}

		$original_url = isset( $item['image_original_url'] ) ? (string) $item['image_original_url'] : '';
		if ( '' === $original_url ) {
			return $image_src;
		}

		return $original_url;
	}


	/**
	 * Build the primary `<img>` tag.
	 *
	 * @param array  $item             Normalised item.
	 * @param string $image_src        Resolved image source URL.
	 * @param string $focal_style_attr Focal/scale inline style attribute.
	 * @param array  $image_options    imageOptions attribute slice.
	 * @return string
	 */
	private function build_image_tag( array $item, string $image_src, string $focal_style_attr, array $image_options = array() ): string {
		if ( empty( $image_src ) ) {
			return $this->build_image_placeholder();
		}

		// Reserve aspect-ratio space so the box does not pop in when the image loads.
		$dimension_attr   = '';
		$intrinsic_width  = isset( $item['extra']['intrinsicWidth'] ) ? (int) $item['extra']['intrinsicWidth'] : 0;
		$intrinsic_height = isset( $item['extra']['intrinsicHeight'] ) ? (int) $item['extra']['intrinsicHeight'] : 0;
		if ( 0 < $intrinsic_width && 0 < $intrinsic_height ) {
			$dimension_attr = ' width="' . $intrinsic_width . '" height="' . $intrinsic_height . '"';
		}

		$loading_attr = ( $image_options['lazyLoad'] ?? true ) ? ' loading="lazy"' : '';

		return sprintf(
			'<img src="%1$s" alt="%2$s"%3$s%4$s class="wpcp-item-img"%5$s>',
			esc_url( $image_src ),
			esc_attr( $item['image_alt'] ?? '' ),
			$loading_attr,
			$dimension_attr,
			$focal_style_attr
		);
	}

	/**
	 * Build the missing-image placeholder used by the editor preview.
	 *
	 * @return string
	 */
	private function build_image_placeholder(): string {
		return '<div class="wpcp-item-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg></div>';
	}

	/**
	 * Media-box class attribute: aspect-ratio variants, overlay, and
	 * super-flow markers.
	 *
	 * @param string $source_type      Block sourceType attribute.
	 * @param array  $image_options    imageOptions attribute slice.
	 * @param string $aspect_ratio     Resolved aspect ratio key.
	 * @return string
	 */
	private function build_media_class_attr( string $source_type, array $image_options, string $aspect_ratio ): string {
		$img_overlay = $image_options['overlay'] ?? false;

		// Assemble media section with aspect ratio classes.
		$media_classes = array( 'wpcp-item-media' );
		if ( 'custom' === $aspect_ratio ) {
			$media_classes[] = 'wpcp-item-media--custom';
			$media_classes[] = 'wpcp-item-media--custom-rsp';
		} else {
			$media_classes[] = 'wpcp-item-media--maxw-rsp';
			if ( 'original' !== $aspect_ratio ) {
				$media_classes[] = 'wpcp-item-media--aspect-rsp';
			}
		}
		if ( 'video' === $source_type ) {
			$media_classes[] = 'wpcp-video-section';
		}
		if ( $img_overlay ) {
			$media_classes[] = 'wpcp-image-overlay';
		}
		return ' class="' . esc_attr( implode( ' ', $media_classes ) ) . '"';
	}

	/**
	 * Assemble the media box: click-action anchor dispatch around the image,
	 * overlay icons, and the hover-animation layer.
	 *
	 * @param array  $item             Normalised item.
	 * @param string $source_type      Block sourceType attribute.
	 * @param array  $click            Click-action value object (resolve_click_action()).
	 * @param string $image_src        Resolved image source URL.
	 * @param string $img_tag          Rendered primary image tag.
	 * @param string $media_box_attrs  Combined class + custom dimension attributes for the media box.
	 * @param array  $effects_options  effectsOptions attribute slice.
	 * @return string
	 */
	private function build_media_html( array $item, string $source_type, array $click, string $image_src, string $img_tag, string $media_box_attrs, array $effects_options ): string {
		$action_type               = $click['type'];
		$is_lightbox               = $click['is_lightbox'];
		$link_url                  = $click['link_url'];
		$source_links_to_permalink = $click['source_links_to_permalink'];

		// Lightbox data attribute.
		$lightbox_attr   = '';
		$has_media_image = ! empty( $image_src );
		if ( $is_lightbox && $has_media_image ) {
			// The lightbox caption mirrors the card title, so resolve it from the
			// configured title source (image title/caption/alt for images, post
			// title for posts/products) rather than always preferring the caption.
			$lightbox_caption = $this->get_content_field(
				$item,
				(string) ( $this->attrs['contentOptions']['titleSource'] ?? 'image_caption' ),
				'title'
			);
			// Fancybox writes the caption into `.f-caption` with innerHTML, so
			// `esc_attr` alone is not enough — the parser hands the raw string
			// back and any active markup in it would go live.
			$lightbox_attr = ' data-fancybox="wpcp-' . esc_attr( $this->root_element_id ) . '"'
				. ' data-src="' . esc_url( $image_src ) . '"'
				. ' data-caption="' . esc_attr( Item_Text::caption( $lightbox_caption ) ) . '"';
		}

		$media_html = '<div' . $media_box_attrs . '>';
		if ( $is_lightbox && $has_media_image ) {
			$media_html .= '<a href="' . esc_url( $image_src ) . '"' . $lightbox_attr . '>' . $img_tag . '</a>';
		} elseif ( $source_links_to_permalink && ! empty( $link_url ) ) {
			// Post/product: link the media to the permalink (matches the linked title).
			$media_html .= '<a href="' . esc_url( $link_url ) . '" target="_self" rel="noopener noreferrer">' . $img_tag . '</a>';
		} else {
			$media_html .= $img_tag;
		}

		// Render overlay icons whenever click action is enabled (any orientation), but not for external videos.
		if ( 'disable' !== $action_type ) {
			// When the media itself is already a Fancybox gallery member (the
			// lightbox case above), the overlay lightbox icon must not register a
			// second gallery slide for the same image — it becomes a click proxy
			// instead. See OverlayIconRenderer::render().
			$main_is_lightbox_member = $is_lightbox && $has_media_image;
			$media_html             .= $this->get_overlay_icon_renderer()->render( $item, $image_src, $is_lightbox, $main_is_lightbox_member );
		}

		// Hover Animation overlay layer — self-contained, animates in on hover
		// whenever an overlay effect is selected (any orientation). Emits child
		// pieces only for curtain/blind/quad/accordion effects.
		$media_html .= EffectClasses::overlay_anim_layer_html( $effects_options );

		$media_html .= '</div>';

		return $media_html;
	}

	/**
	 * Build inner wrapper classes. Hover Animation effect classes (image
	 * hover + premade + gated overlay) come from the shared EffectClasses
	 * helper so they stay identical to the editor preview.
	 *
	 * @param array  $effects_options     effectsOptions attribute slice.
	 * @param string $content_orientation Resolved content orientation.
	 * @param bool   $display_on_hover    "Display Content on Hover Only" toggle.
	 * @return string[]
	 */
	private function build_inner_classes( array $effects_options, string $content_orientation, bool $display_on_hover ): array {
		$is_overlay_style = in_array( $content_orientation, array( 'overlay', 'diagonal' ), true );

		$inner_classes   = array_merge(
			array( 'wpcp-item-inner' ),
			EffectClasses::inner_classes( $effects_options, $this->attrs['blockName'] ?? '' )
		);
		$inner_classes[] = 'wpcp-orientation-' . sanitize_html_class( $content_orientation );
		if ( $is_overlay_style ) {
			$inner_classes[] = 'wpcp-has-overlay';
		}
		// "Display Content on Hover Only" hides the overlay content until the item
		// is hovered. Mark the inner so the darkening media tint reveals with it,
		// per item. Scoped to the overlay-style orientations (overlay/diagonal) so
		// the reveal/content-animation gate is coherent (matches CarouselItem.jsx).
		if ( EffectClasses::is_content_hover_orientation( $content_orientation ) && $display_on_hover ) {
			$inner_classes[] = 'wpcp-content-hover-mode';
		}

		return $inner_classes;
	}

	/**
	 * Inline style attribute for the outer slide: variable-width intrinsic sizing.
	 *
	 * @param array $item Normalised item.
	 * @return string
	 */
	private function build_slide_outer_attr( array $item ): string {
		$slide_outer_attr = '';
		if ( $this->effective_variable_width ) {
			$intrinsic_width = isset( $item['extra']['intrinsicWidth'] ) ? (int) $item['extra']['intrinsicWidth'] : 0;
			if ( $intrinsic_width > 0 ) {
				$intrinsic_width = min( max( 1, $intrinsic_width ), 4000 );
				// Emit the intrinsic width as a custom property, not an inline `width`:
				// Swiper resets each slide's inline width to re-measure them under
				// `slidesPerView: 'auto'`, so an inline width would be wiped. The
				// stylesheet reads the property; mirrors variableWidthSlideStyle in JS.
				$intrinsic_height = isset( $item['extra']['intrinsicHeight'] ) ? (int) $item['extra']['intrinsicHeight'] : 0;
				$image_options    = $this->attrs['imageOptions'] ?? array();
				if ( DimensionHelper::has_variable_width_image_height( is_array( $image_options ) ? $image_options : array() ) && $intrinsic_height > 0 ) {
					// With the Image Height option set, the image scales to the fixed
					// height, so the slide width follows the scaled width: height × (W / H).
					// The var() fallback is the intrinsic height, which resolves the calc
					// back to the intrinsic width when no height token is emitted.
					$width_per_height = round( $intrinsic_width / $intrinsic_height, 4 );
					$height_mode      = DimensionHelper::get_variable_width_image_height_mode( is_array( $image_options ) ? $image_options : array() );
					if ( 'max-height' === $height_mode ) {
						$slide_outer_attr = ' style="--wpcp-vw-slide-width:calc(min(var(--wpcp-vw-image-max-height, ' . (string) (int) $intrinsic_height . 'px), ' . (string) (int) $intrinsic_height . 'px) * ' . (string) $width_per_height . ')"';
					} else {
						$slide_outer_attr = ' style="--wpcp-vw-slide-width:calc(var(--wpcp-vw-image-height, ' . (string) (int) $intrinsic_height . 'px) * ' . (string) $width_per_height . ')"';
					}
				} else {
					$slide_outer_attr = ' style="--wpcp-vw-slide-width:' . (string) (int) $intrinsic_width . 'px"';
				}
			}
		}

		return $slide_outer_attr;
	}

	/**
	 * Resolve stored contentOrientation against the current source (matches editor `resolveContentOrientation`).
	 *
	 * @param string $source_type         Block sourceType attribute.
	 * @param string $content_orientation Raw layoutOptions.contentOrientation.
	 * @return string
	 */
	public function resolve_content_orientation( string $source_type, string $content_orientation ): string {
		$allowed = $this->allowed_content_orientations();
		if ( in_array( $content_orientation, $allowed, true ) ) {
			return $content_orientation;
		}
		return \ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues::content_orientation_fallback(
			$this->attrs['blockName'] ?? ''
		);
	}

	/**
	 * Resolve a content field from the item using the configured source key.
	 *
	 * @param array  $item        Normalised item data.
	 * @param string $source      Configured source key.
	 * @param string $default_key Fallback item key.
	 * @return string
	 */
	public function get_content_field( array $item, string $source, string $default_key ): string {
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
	 * Whether a content slot should be visible (delegates to the shared SlotRenderer).
	 *
	 * @param string $slot Slot key.
	 * @return bool
	 */
	public function is_slot_visible( string $slot ): bool {
		return $this->get_slot_renderer()->is_slot_visible( $slot );
	}

	/**
	 * Lazy social share renderer (shared with slot renderer).
	 *
	 * @return SocialShareRenderer
	 */
	private function get_social_share_renderer(): SocialShareRenderer {
		if ( null === $this->social_share_renderer ) {
			$this->social_share_renderer = new SocialShareRenderer( $this->attrs );
		}
		return $this->social_share_renderer;
	}

	/**
	 * Lazy slot renderer (uses same SocialShareRenderer instance).
	 *
	 * @return SlotRenderer
	 */
	private function get_slot_renderer(): SlotRenderer {
		if ( null === $this->slot_renderer ) {
			$this->slot_renderer = new SlotRenderer( $this->attrs, $this->get_social_share_renderer() );
		}
		return $this->slot_renderer;
	}

	/**
	 * Lazy video card renderer. Requires root_element_id, supplied by the constructor.
	 *
	 * @return VideoCardRenderer
	 */
	private function get_video_card_renderer(): VideoCardRenderer {
		if ( null === $this->video_card_renderer ) {
			$this->video_card_renderer = new VideoCardRenderer( $this->attrs, $this->root_element_id );
		}
		return $this->video_card_renderer;
	}


	/**
	 * Lazy overlay-icon renderer. Requires root_element_id, supplied by the constructor.
	 *
	 * @return OverlayIconRenderer
	 */
	private function get_overlay_icon_renderer(): OverlayIconRenderer {
		if ( null === $this->overlay_icon_renderer ) {
			$this->overlay_icon_renderer = new OverlayIconRenderer(
				$this->attrs,
				$this->root_element_id,
				$this->get_click_action_icon_list()
			);
		}
		return $this->overlay_icon_renderer;
	}

	/**
	 * Build the inline `style` attribute fragment for `.wpcp-item-img`.
	 *
	 * Mirrors the editor `CarouselItem.jsx` behavior:
	 * - custom / fixed aspect-ratio media boxes use absolute fill.
	 * - focal point / scale may override the default object-fit.
	 *
	 * @param array  $item   Normalised item.
	 * @param string $aspect Aspect ratio mode.
	 * @return string Style fragment with leading space, or empty string.
	 */
	private function build_item_focal_style_attr( array $item, string $aspect = 'original' ): string {
		$parts = array();

		if ( 'original' !== $aspect ) {
			$parts[] = 'position:absolute';
			$parts[] = 'inset:0';
			$parts[] = 'width:100%';
			$parts[] = 'height:100%';
			$parts[] = 'object-fit:cover';
			$parts[] = 'display:block';
		}

		$scale = $item['scale'] ?? null;
		if ( is_string( $scale ) && in_array( $scale, array( 'cover', 'contain', 'fill' ), true ) ) {
			$parts[] = 'object-fit:' . $scale;
		}

		// `object-position` is inert under `object-fit: fill` (the image is
		// stretched to both edges), so skip it — mirrors getImageFocalPointStyle().
		$position = $item['position'] ?? null;
		if ( is_object( $position ) ) {
			$position = (array) $position;
		}
		if ( 'fill' !== $scale && is_array( $position ) && isset( $position['left'], $position['top'] )
			&& is_numeric( $position['left'] ) && is_numeric( $position['top'] )
		) {
			$left    = max( 0.0, min( 100.0, (float) $position['left'] ) );
			$top     = max( 0.0, min( 100.0, (float) $position['top'] ) );
			$parts[] = sprintf( 'object-position:%s%% %s%%', $this->format_focal_axis( $left ), $this->format_focal_axis( $top ) );
		}

		if ( empty( $parts ) ) {
			return '';
		}
		return ' style="' . esc_attr( implode( ';', $parts ) ) . '"';
	}

	/**
	 * Format a single focal-point axis with at most two decimals and no
	 * trailing zeros, so `50` renders as `50` (not `50.00`).
	 *
	 * @param float $value Clamped 0..100 value.
	 * @return string
	 */
	private function format_focal_axis( float $value ): string {
		$formatted = number_format( $value, 2, '.', '' );
		return rtrim( rtrim( $formatted, '0' ), '.' );
	}

	/**
	 * Allowed content orientations per block/source (matches `contentOrientations.jsx`).
	 *
	 * @return string[]
	 */
	private function allowed_content_orientations(): array {
		return \ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues::content_orientations_for_block(
			$this->attrs['blockName'] ?? ''
		);
	}

	/**
	 * Lazy-load the shared icon registry (same file used by SocialShareRenderer).
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function get_click_action_icon_list(): array {
		static $icon_list = null;
		if ( null !== $icon_list ) {
			return $icon_list;
		}
		$icon_file = WPCAROUSELF_PATH . 'src/Blocks/icons/icon-list.php';
		if ( ! file_exists( $icon_file ) ) {
			$icon_list = array();
			return $icon_list;
		}
		$loaded    = require $icon_file;
		$icon_list = is_array( $loaded ) ? $loaded : array();
		return $icon_list;
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
}
