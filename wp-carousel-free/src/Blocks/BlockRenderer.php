<?php
/**
 * BlockRenderer – converts normalised items + block attributes → HTML.
 *
 * This class orchestrates the server render. Heavier logic lives in dedicated
 * collaborators (same concern split as the block editor: layout/config vs
 * nav chrome vs per-slot content):
 *  - {@see \ShapedPlugin\WPCarouselFree\Blocks\Config\ConfigBuilder} – `data-wpcp` JSON (Swiper config).
 *  - {@see \ShapedPlugin\WPCarouselFree\Blocks\Rendering\NavigationBuilder} – arrows, pagination, scoped CSS.
 *  - {@see \ShapedPlugin\WPCarouselFree\Blocks\Rendering\ItemRenderer} – per-slide markup (media, slots, overlays, cards).
 *
 * Responsibilities here:
 *  - Wrap the carousel in the canonical `.wpcp-block` shell.
 *  - Pick the layout branch (tiles / thumbnails / Swiper) and
 *    delegate per-slide markup to {@see ItemRenderer}.
 *  - Pass attributes through the helpers above; keep editor/frontend class parity.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks;

use ShapedPlugin\WPCarouselFree\Blocks\Config\ConfigBuilder;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\ItemRenderer;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\NavigationBuilder;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\StyleHelper;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\ThumbnailsSliderRenderer;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\TilesHydration;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\TilesPaginationRenderer;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\TilesRenderer;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;
use ShapedPlugin\WPCarouselFree\Blocks\Sources\SourceRegistry;

defined( 'ABSPATH' ) || exit;

/**
 * Orchestrates the dynamic block output; delegates slot/config/nav builds to
 * `Config/` and `Rendering/` classes in this package.
 */
class BlockRenderer {

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
	 * Unique DOM ID for this block instance.
	 *
	 * @var string
	 */
	private string $block_id;

	/**
	 * Root element id (uniqueId or generated). Used for lightbox grouping.
	 *
	 * @var string
	 */
	private string $root_element_id = '';

	/**
	 * Whether variable-width Swiper slides are active for this render.
	 *
	 * @var bool
	 */
	private bool $effective_variable_width = false;

	/**
	 * Lazy-built arrows/pagination markup and CSS.
	 *
	 * @var NavigationBuilder|null
	 */
	private ?NavigationBuilder $navigation_builder = null;

	/**
	 * Lazy-built data-wpcp JSON config.
	 *
	 * @var ConfigBuilder|null
	 */
	private ?ConfigBuilder $config_builder = null;

	/**
	 * Lazy-built per-item (slide) renderer; memoized once per render so the
	 * per-slide collaborators it owns (notably the per-slide state) persist across every slide.
	 *
	 * @var ItemRenderer|null
	 */
	private ?ItemRenderer $item_renderer = null;

	/**
	 * Constructor.
	 *
	 * @param array  $attrs Block attributes.
	 * @param string $slug  Block slug without namespace.
	 */
	public function __construct( array $attrs, string $slug ) {
		// Normalise every nested attribute group: WP REST API can return stdClass.
		// The module gate runs on the normalised copy so every render path —
		// `render()`, `render_tiles_ajax_page()` and the page-builder shortcode
		// — drops the hover/entrance values of a switched-off dashboard module
		// without touching the saved post.
		// Snap every constrained nested option to a Free value before anything
		// reads it. The schema cannot enum a key inside an object attribute, so
		// this is the enforcement point for carousel style, orientation, slider
		// style and slide effect.
		$this->attrs = AllowedValues::project( $this->deep_normalise( $attrs ) );
		$this->slug  = $slug;

		$uid            = $this->get_attribute_unique_id();
		$this->block_id = '' !== $uid
			? $uid
			: 'wpcp-' . $slug . '-' . wp_rand( 1000, 9999 );
	}

	/**
	 * Editor stores `uniqueId` on attributes; some saves may nest under blockName.
	 *
	 * @return string Sanitised id token or empty string.
	 */
	private function get_attribute_unique_id(): string {
		$raw = $this->attrs['uniqueId'] ?? '';
		if ( ( '' === $raw || null === $raw ) && isset( $this->attrs['blockName'] ) && is_array( $this->attrs['blockName'] ) ) {
			$raw = $this->attrs['blockName']['uniqueId'] ?? '';
		}
		if ( ! is_string( $raw ) || '' === $raw ) {
			return '';
		}
		$clean = preg_replace( '/[^a-zA-Z0-9_-]/', '', $raw );
		return is_string( $clean ) && '' !== $clean ? $clean : '';
	}

	/**
	 * Recursively cast stdClass objects to associative arrays.
	 *
	 * @param mixed $value mixed value.
	 * @return mixed
	 */
	private function deep_normalise( $value ) {
		if ( is_object( $value ) ) {
			$value = (array) $value;
		}
		if ( is_array( $value ) ) {
			foreach ( $value as $key => $nested_value ) {
				$value[ $key ] = $this->deep_normalise( $nested_value );
			}
		}
		return $value;
	}

	/**
	 * Lazy navigation / pagination builder.
	 *
	 * @return NavigationBuilder
	 */
	private function get_navigation_builder(): NavigationBuilder {
		if ( null === $this->navigation_builder ) {
			$this->navigation_builder = new NavigationBuilder( $this->attrs );
		}
		return $this->navigation_builder;
	}

	/**
	 * Lazy JSON config builder (shares navigation builder instance).
	 *
	 * @return ConfigBuilder
	 */
	private function get_config_builder(): ConfigBuilder {
		if ( null === $this->config_builder ) {
			$this->config_builder = new ConfigBuilder( $this->attrs, $this->slug, $this->get_navigation_builder() );
		}
		return $this->config_builder;
	}

	/**
	 * Lazy per-item (slide) renderer.
	 *
	 * Memoized once per render so the per-slide collaborators it owns — notably
	 * per-slide state — persist across every slide.
	 * Reads `root_element_id` / `effective_variable_width` at first call; both are
	 * final by then (set in `render()` before the item loop runs, or defaulted in
	 * the AJAX-pagination path — matching the previously inlined `render_item`).
	 *
	 * @return ItemRenderer
	 */
	private function get_item_renderer(): ItemRenderer {
		if ( null === $this->item_renderer ) {
			$this->item_renderer = new ItemRenderer(
				$this->attrs,
				$this->slug,
				$this->root_element_id,
				$this->effective_variable_width
			);
		}
		return $this->item_renderer;
	}

	/**
	 * Whether variable-width layout applies (horizontal Swiper `slidesPerView: auto`).
	 *
	 * @param array  $layout_options  Layout options.
	 * @param string $carousel_style  Carousel style slug.
	 * @param bool   $is_tiles_layout True when tiles block or grid style.
	 */
	private function is_variable_width_effective( array $layout_options, string $carousel_style, bool $is_tiles_layout ): bool {
		if ( $is_tiles_layout ) {
			return false;
		}
		if ( empty( $layout_options['variableWidth'] ) ) {
			return false;
		}
		$excluded = array( 'grid' );
		return ! in_array( $carousel_style, $excluded, true );
	}

	/**
	 * Whether the selected Swiper effect needs card groups inside one Swiper slide.
	 *
	 * @param string $effect Slider effect slug.
	 * @return bool
	 */
	private function is_single_slide_stack_effect( string $effect ): bool {
		return in_array( $effect, array( 'flip', 'cube' ), true );
	}

	/**
	 * Column count helper for grouped single-slide effects.
	 *
	 * @param array  $layout_options Layout options.
	 * @param string $device         Desktop | Tablet | Mobile.
	 * @return int
	 */
	private function get_grouped_effect_columns( array $layout_options, string $device ): int {
		$keys = array(
			'Desktop' => 'columns',
			'Tablet'  => 'columnsTablet',
			'Mobile'  => 'columnsMobile',
		);
		$key  = $keys[ $device ] ?? 'columns';
		return max( 1, absint( $layout_options[ $key ] ?? ( 'Desktop' === $device ? 3 : 1 ) ) );
	}

	/**
	 * Gap helper for grouped single-slide effects.
	 *
	 * @param array  $layout_options Layout options.
	 * @param string $device         Desktop | Tablet | Mobile.
	 * @return int
	 */
	private function get_grouped_effect_gap( array $layout_options, string $device ): int {
		$keys = array(
			'Desktop' => 'gap',
			'Tablet'  => 'gapTablet',
			'Mobile'  => 'gapMobile',
		);
		$key  = $keys[ $device ] ?? 'gap';
		return max( 0, absint( $layout_options[ $key ] ?? ( 'Mobile' === $device ? 10 : 20 ) ) );
	}

	/**
	 * Inline CSS vars for grouped single-slide effects.
	 *
	 * @param array $layout_options Layout options.
	 * @return string
	 */
	private function get_grouped_effect_slide_style_attr( array $layout_options ): string {
		$style_parts = array(
			'--wpcp-slide-group-cols-d:' . $this->get_grouped_effect_columns( $layout_options, 'Desktop' ),
			'--wpcp-slide-group-cols-t:' . $this->get_grouped_effect_columns( $layout_options, 'Tablet' ),
			'--wpcp-slide-group-cols-m:' . $this->get_grouped_effect_columns( $layout_options, 'Mobile' ),
			'--wpcp-slide-group-gap-d:' . $this->get_grouped_effect_gap( $layout_options, 'Desktop' ) . 'px',
			'--wpcp-slide-group-gap-t:' . $this->get_grouped_effect_gap( $layout_options, 'Tablet' ) . 'px',
			'--wpcp-slide-group-gap-m:' . $this->get_grouped_effect_gap( $layout_options, 'Mobile' ) . 'px',
		);

		return ' style="' . esc_attr( implode( ';', $style_parts ) ) . '"';
	}

	/**
	 * Inline CSS vars for first-paint Swiper slide sizing before JS initializes.
	 *
	 * @param array $carousel_config Frontend config sent to data-wpcp.
	 * @return string
	 */
	private function get_initial_swiper_style_attr( array $carousel_config ): string {
		$slides_per_view = isset( $carousel_config['swiperSlidesPerView'] ) && is_array( $carousel_config['swiperSlidesPerView'] )
			? $carousel_config['swiperSlidesPerView']
			: array();
		$gap             = isset( $carousel_config['gap'] ) && is_array( $carousel_config['gap'] )
			? $carousel_config['gap']
			: array();

		$style_parts = array(
			'--wpcp-swiper-spv-d:' . $this->normalise_positive_css_number( $slides_per_view['desktop'] ?? 3, 3 ),
			'--wpcp-swiper-spv-t:' . $this->normalise_positive_css_number( $slides_per_view['tablet'] ?? 2, 2 ),
			'--wpcp-swiper-spv-m:' . $this->normalise_positive_css_number( $slides_per_view['mobile'] ?? 1, 1 ),
			'--wpcp-swiper-gap-d:' . absint( $gap['desktop'] ?? 20 ) . 'px',
			'--wpcp-swiper-gap-t:' . absint( $gap['tablet'] ?? 20 ) . 'px',
			'--wpcp-swiper-gap-m:' . absint( $gap['mobile'] ?? 10 ) . 'px',
			'--wpcp-swiper-slide-width-d:' . $this->get_initial_swiper_slide_width_css( $slides_per_view['desktop'] ?? 3, $gap['desktop'] ?? 20, 3 ),
			'--wpcp-swiper-slide-width-t:' . $this->get_initial_swiper_slide_width_css( $slides_per_view['tablet'] ?? 2, $gap['tablet'] ?? 20, 2 ),
			'--wpcp-swiper-slide-width-m:' . $this->get_initial_swiper_slide_width_css( $slides_per_view['mobile'] ?? 1, $gap['mobile'] ?? 10, 1 ),
		);

		return ' style="' . esc_attr( implode( ';', $style_parts ) ) . '"';
	}

	/**
	 * Build a first-paint slide width matching Swiper's resolved width.
	 *
	 * @param mixed $slides_per_view Raw slides-per-view value.
	 * @param mixed $gap             Raw gap value in px.
	 * @param float $fallback        Slides-per-view fallback.
	 * @return string CSS width value.
	 */
	private function get_initial_swiper_slide_width_css( $slides_per_view, $gap, float $fallback ): string {
		$slides_per_view_number = is_numeric( $slides_per_view ) ? (float) $slides_per_view : $fallback;
		$slides_per_view_number = max( 0.001, $slides_per_view_number );
		$gap_number             = max( 0, absint( $gap ) );
		$width_percentage       = 100 / $slides_per_view_number;
		$gap_offset             = $gap_number * max( 0, $slides_per_view_number - 1 ) / $slides_per_view_number;

		if ( 0 >= $gap_offset ) {
			return $this->format_css_decimal( $width_percentage ) . '%';
		}

		return 'calc(' . $this->format_css_decimal( $width_percentage ) . '% - ' . $this->format_css_decimal( $gap_offset ) . 'px)';
	}

	/**
	 * Format a positive number for CSS custom properties.
	 *
	 * @param mixed $value    Raw number.
	 * @param float $fallback Fallback when the raw value is invalid.
	 * @return string
	 */
	private function normalise_positive_css_number( $value, float $fallback ): string {
		$number = is_numeric( $value ) ? (float) $value : $fallback;
		$number = max( 0.001, $number );

		return $this->format_css_decimal( $number );
	}

	/**
	 * Trim a decimal for compact CSS output.
	 *
	 * @param float $number Number to format.
	 * @return string
	 */
	private function format_css_decimal( float $number ): string {
		return rtrim( rtrim( sprintf( '%.3F', $number ), '0' ), '.' );
	}

	/**
	 * Render card groups for Swiper effects that require one Swiper slide per transition.
	 *
	 * @param array $items          Normalised item list.
	 * @param array $layout_options Layout options.
	 * @return string
	 */
	private function render_grouped_effect_slides( array $items, array $layout_options ): string {
		$chunk_size = $this->get_grouped_effect_columns( $layout_options, 'Desktop' );
		$style_attr = $this->get_grouped_effect_slide_style_attr( $layout_options );
		$html       = '';

		foreach ( array_chunk( $items, $chunk_size ) as $group ) {
			$html .= '<div class="swiper-slide wpcp-slide-group"' . $style_attr . '>';
			foreach ( $group as $item ) {
				$html .= $this->get_item_renderer()->render_item( $item, 'grouped_slide' );
			}
			$html .= '</div>';
		}

		return $html;
	}

	/**
	 * Entry point. Accepts normalised items and returns the full HTML string.
	 *
	 * @param array $items Normalised item list from a SourceInterface.
	 * @return string
	 */
	public function render( array $items ): string {
		if ( empty( $items ) ) {
			return $this->render_empty();
		}

		$layout_options   = $this->attrs['layoutOptions'] ?? array();
		$advanced_options = $this->attrs['advancedOptions'] ?? array();
		$slider_options   = $this->attrs['sliderOptions'] ?? array();

		$carousel_style = isset( $layout_options['carouselStyle'] ) ? sanitize_html_class( (string) $layout_options['carouselStyle'] ) : 'standard';
		if ( '' === $carousel_style ) {
			$carousel_style = 'standard';
		}
		$effect = isset( $slider_options['effect'] ) ? sanitize_html_class( (string) $slider_options['effect'] ) : 'slide';
		if ( '' === $effect ) {
			$effect = 'slide';
		}
		// The Center style centers the active slide; only the default 'slide'
		// transition is supported there, so any saved effect resolves to 'slide'.
		if ( 'center' === $carousel_style ) {
			$effect = 'slide';
		}

		$group_single_effect_slides = (
			$this->is_single_slide_stack_effect( $effect )
			&& in_array( $carousel_style, array( 'standard', 'center' ), true )
		);

		$is_tiles_layout                = ( 'tiles' === $this->slug || 'grid' === $carousel_style );
		$this->effective_variable_width = $this->is_variable_width_effective( $layout_options, $carousel_style, $is_tiles_layout );

		$classes = $this->build_root_classes( $carousel_style );

		$dom_id                = $this->block_id;
		$this->root_element_id = $dom_id;
		$id_attr               = ' id="' . esc_attr( $dom_id ) . '"';
		$style_attr            = '';
		$inner_attr            = $this->build_inner_attributes( is_array( $advanced_options ) ? $advanced_options : array() );

		// Pagination / navigation: their scoped CSS is delivered through the shared
		// frontend dynamic-CSS pipeline (Block_Dynamic_Style), not inline here —
		// only markup is built.
		$nav_builder       = $this->get_navigation_builder();
		$pagination_markup = '';
		$navigation_markup = '';
		if ( ! empty( $layout_options['pagination'] ) ) {
			$pagination_markup = $nav_builder->pagination_markup();
		}
		if ( ! empty( $layout_options['navigation'] ) ) {
			$navigation_markup = $nav_builder->navigation_markup();
		}

		$config_item_count = count( $items );
		if ( $group_single_effect_slides ) {
			$config_item_count = (int) ceil( $config_item_count / $this->get_grouped_effect_columns( $layout_options, 'Desktop' ) );
		}

		$carousel_config_array = $this->get_config_builder()->build( $config_item_count );
		$swiper_style          = $this->get_initial_swiper_style_attr( $carousel_config_array );
		$carousel_config       = wp_json_encode( $carousel_config_array );

		$html = sprintf(
			'<div class="%1$s"%2$s%3$s data-wpcp=\'%4$s\'>',
			esc_attr( implode( ' ', $classes ) ),
			$id_attr,
			$style_attr,
			esc_attr( $carousel_config )
		);

		// Inner content wrapper: carries the General-tab padding and is the
		// positioning context for nav arrows / pagination dots, while the root
		// keeps background + margin. At default (zero) padding it is full-bleed
		// and `position: relative`, so the render is unchanged. Wraps all layout
		// branches (standard / tiles / thumbnails).
		$html .= '<div' . $inner_attr . '>';

		// Tiles render as a CSS grid, not a Swiper — no stage, no viewport, and
		// Ajax Pagination in place of pagination dots.
		if ( $is_tiles_layout ) {
			$tiles_source_type   = isset( $this->attrs['sourceType'] ) ? (string) $this->attrs['sourceType'] : 'image';
			$tiles_query_options = isset( $this->attrs['queryOptions'] ) && is_array( $this->attrs['queryOptions'] )
				? $this->attrs['queryOptions']
				: array();
			$pagination_enabled  = ! empty( $layout_options['pagination'] )
				&& in_array( $tiles_source_type, array( 'post', 'product', 'image', 'video' ), true );

			$pagination_state = null;
			$items_to_render  = $items;

			if ( $pagination_enabled ) {
				// Random-order tiles get a seeded Fisher-Yates here so the
				// permutation is reproducible across AJAX page changes. The
				// sources fetch a stable order for the paginated path, so this
				// seeded shuffle is the sole randomizer; the seed is generated
				// once per page-load and round-tripped through the payload.
				if ( TilesPaginationRenderer::is_seeded_random_order( $tiles_source_type, $layout_options, $tiles_query_options ) ) {
					$shuffle_seed                = random_int( 1, PHP_INT_MAX );
					$items                       = TilesPaginationRenderer::seeded_shuffle( $items, $shuffle_seed );
					$this->attrs['_shuffleSeed'] = $shuffle_seed;
				}
				$pagination_state = $this->tiles_pagination()->compute_tiles_pagination_state( $items );
				$items_to_render  = $pagination_state['items'];

				// Two-step fetch: post/product candidates are ID stubs; hydrate
				// only this first page's slice into full items before rendering.
				$tiles_hydrate = $this->build_tiles_hydrator( $tiles_source_type );
				if ( null !== $tiles_hydrate ) {
					$items_to_render = $tiles_hydrate( $items_to_render );
				}
			}

			$html .= ( new TilesRenderer( $this->attrs ) )->render_tiles_main(
				$items_to_render,
				$layout_options,
				function ( array $item ): string {
					return $this->get_item_renderer()->render_item( $item );
				}
			);

			if ( $pagination_enabled ) {
				// `excludeCurrent` resolves the current post via is_singular() /
				// get_the_ID(), neither of which is available in the REST context.
				// Capture it here and round-trip it so AJAX pages exclude the same
				// post as the initial render instead of letting it reappear.
				if ( ! empty( $tiles_query_options['excludeCurrent'] ) && is_singular() ) {
					if ( ! isset( $this->attrs['queryOptions'] ) || ! is_array( $this->attrs['queryOptions'] ) ) {
						$this->attrs['queryOptions'] = array();
					}
					$this->attrs['queryOptions']['_currentPostId'] = (int) get_the_ID();
				}

				$html .= $this->tiles_pagination()->render_tiles_pagination_markup(
					null !== $pagination_state ? (int) $pagination_state['total_pages'] : 1,
					1
				);
			}

			$html .= '</div></div>';
			return $html;
		}

		// Thumbnails-slider builds its own two-Swiper markup (stage + thumb strip).
		if ( 'thumbnails' === $carousel_style ) {
			$html .= ( new ThumbnailsSliderRenderer( $this->attrs ) )->render_thumbnails_slider_main(
				$items,
				$layout_options,
				function ( array $item ): string {
					return $this->get_item_renderer()->render_item( $item );
				},
				! empty( $layout_options['navigation'] ) ? $navigation_markup : ''
			);
			$html .= '</div></div>';
			return $html;
		}

		// Main wrapper: keep the Swiper viewport inside `.wpcp-carousel-stage`, then
		// render navigation as a sibling of the viewport (matching the editor preview).
		// Swiper applies `overflow:hidden` to its root; when arrows live inside that
		// viewport the full navigation section gets clipped on the frontend.
		// Swiper root stays LTR; slider RTL only affects autoplay/navigation flow in JS.
		$swiper_dir_attr = ' dir="ltr"';
		$html           .= '<div class="wpcp-carousel-stage">';
		$html           .= '<div class="wpcp-carousel-container wpcp-swiper swiper wpcp-effect-' . esc_attr( $effect ) . '"' . $swiper_dir_attr . $swiper_style . '>';
		$html           .= '<div class="wpcp-carousel-wrapper swiper-wrapper">';
		if ( $group_single_effect_slides ) {
			$html .= $this->render_grouped_effect_slides( $items, $layout_options );
		} else {
			foreach ( $items as $item ) {
				$html .= $this->get_item_renderer()->render_item( $item );
			}
		}
		$html .= '</div>';
		$html .= '</div>';

		if ( ! empty( $layout_options['navigation'] ) ) {
			$html .= $navigation_markup;
		}
		$html .= '</div>';

		if ( ! empty( $layout_options['pagination'] ) ) {
			$html .= $pagination_markup;
		}
		$html .= '</div></div>';
		return $html;
	}


	/**
	 * Build the page-slice hydrator for the Tiles two-step fetch, or null when
	 * the source's items are already full.
	 *
	 * Post/product candidates arrive as lightweight ID stubs (`fields => 'ids'`
	 * fetch); the returned closure turns a page slice of stubs into full items
	 * via the source's `hydrate_ids()` (single `post__in` query). Image and
	 * other item-based sources need no hydration, so this returns null.
	 *
	 * @param string $source_type Block sourceType attribute.
	 * @return callable|null
	 */
	private function build_tiles_hydrator( string $source_type ): ?callable {
		if ( ! in_array( $source_type, array( 'post', 'product' ), true ) ) {
			return null;
		}

		return function ( array $page_items ) use ( $source_type ): array {
			return TilesHydration::hydrate_page( SourceRegistry::for( $source_type ), $page_items, $this->attrs );
		};
	}


	/**
	 * Lazy Tiles pagination renderer, bound to the resolved root element id.
	 *
	 * @return TilesPaginationRenderer
	 */
	private function tiles_pagination(): TilesPaginationRenderer {
		return new TilesPaginationRenderer( $this->attrs, $this->root_element_id ? $this->root_element_id : $this->block_id );
	}

	/**
	 * Render one AJAX page of tiles for the pagination REST endpoint.
	 *
	 * @param array    $items        Normalised items from a SourceInterface.
	 * @param int      $page         1-indexed page number.
	 * @param int|null $shuffle_seed Optional positive integer; reproduces the
	 *                               permutation of the initial render.
	 * @return array{html:string,page:int,total_pages:int,has_more:bool,controlsHtml:string}
	 */
	public function render_tiles_ajax_page( array $items, int $page, ?int $shuffle_seed = null ): array {
		// The full `render()` pass sets `root_element_id` before the item loop;
		// the REST endpoint calls this directly, so resolve the same id here.
		// Otherwise the lazy item renderer is built with an empty id and the
		// per-page lightbox triggers diverge from the first render — video
		// anchors emit `data-fancybox=""` and stop matching the binder. Sharing
		// `block_id` also keeps every page in one lightbox gallery.
		if ( '' === $this->root_element_id ) {
			$this->root_element_id = $this->block_id;
		}

		$source_type = isset( $this->attrs['sourceType'] ) ? (string) $this->attrs['sourceType'] : 'image';

		return $this->tiles_pagination()->render_tiles_ajax_page(
			$items,
			$page,
			$shuffle_seed,
			function ( array $item ): string {
				return $this->get_item_renderer()->render_item( $item );
			},
			$this->build_tiles_hydrator( $source_type )
		);
	}

	/**
	 * Render just the inner control list of the pagination wrapper, so the
	 * frontend can swap in a new control set when the page count changes.
	 *
	 * @param int $total_pages  Total pages.
	 * @param int $current_page 1-indexed current page.
	 * @return string
	 */
	public function render_tiles_pagination_controls_html( int $total_pages, int $current_page = 1 ): string {
		return $this->tiles_pagination()->render_tiles_pagination_controls_html( $total_pages, $current_page );
	}


	/* ── Private helpers ──────────────────────────────────────────────────── */

	/**
	 * Render the empty state message when no items are available.
	 *
	 * @return string
	 */
	private function render_empty(): string {
		return '<div class="wpcp-block wpcp-empty-block"><p>' . esc_html__( 'No items to display. Please configure the block.', 'wp-carousel-free' ) . '</p></div>';
	}

	/**
	 * Assemble the outer `.wpcp-block` class list for the active block / style.
	 *
	 * @param string $carousel_style Resolved carousel style slug.
	 * @return string[]
	 */
	private function build_root_classes( string $carousel_style ): array {
		$layout_options   = $this->attrs['layoutOptions'] ?? array();
		$advanced_options = $this->attrs['advancedOptions'] ?? array();
		$classes          = array(
			'wpcp-block',
			'wpcp-block-' . sanitize_html_class( $this->slug ),
			'wpcp-carousel-render',
			'wpcp-carousel-render-frontend',
			'wpcp-style-' . $carousel_style,
			'wpcp-source-' . sanitize_html_class( $this->attrs['sourceType'] ?? 'image' ),
		);

		if ( ! empty( $this->attrs['align'] ) ) {
			$classes[] = 'align' . sanitize_html_class( $this->attrs['align'] );
		}
		if ( $this->effective_variable_width ) {
			$classes[] = 'wpcp-variable-width';
		}
		$navigation_position_class = $this->get_navigation_builder()->get_navigation_position_class();
		if ( '' !== $navigation_position_class ) {
			$classes[] = $navigation_position_class;
		}
		if ( 'slider' === $this->slug ) {
			$slider_layout = isset( $layout_options['sliderLayout'] ) ? sanitize_html_class( (string) $layout_options['sliderLayout'] ) : '';
			if ( '' !== $slider_layout ) {
				$classes[] = 'wpcp-slider-layout-' . $slider_layout;
			}
			$classes[] = 'wpcp-style-slider';
		}

		$content_orientation_root = $this->get_content_orientation_root_classes();
		if ( ! empty( $content_orientation_root ) ) {
			$classes = array_merge( $classes, $content_orientation_root );
		}
		// Thumbnails-slider scaffolding classes — outer-element hooks for the
		// dynamic CSS pipeline. The inner `.wpcp-thumbs-area` wrapper /
		// per-thumb markup (with `wpcp-thumb-active wpcp-active-style-{value}`)
		// lands when the main-stage / thumb-strip render branch is
		// implemented. For now the classes here give the dynamic CSS
		// selectors something to scope against.
		if ( 'thumbnails-slider' === $this->slug ) {
			$thumbs_area     = $this->attrs['thumbsArea'] ?? array();
			$thumbs_layout   = isset( $layout_options['thumbsLayout'] ) ? sanitize_html_class( (string) $layout_options['thumbsLayout'] ) : 'strip';
			$thumbs_position = isset( $thumbs_area['position'] ) ? sanitize_html_class( (string) $thumbs_area['position'] ) : 'bottom';
			$active_style    = sanitize_html_class( AllowedValues::thumbnail_active_style( $this->attrs['thumbnail']['activeStyle'] ?? 'none' ) );

			if ( '' !== $thumbs_layout ) {
				$classes[] = 'wpcp-thumbs-layout-' . $thumbs_layout;
			}
			if ( '' !== $thumbs_position ) {
				$classes[] = 'wpcp-thumbs-position-' . $thumbs_position;
			}
			if ( '' !== $active_style ) {
				$classes[] = 'wpcp-active-style-' . $active_style;
			}
		}

		// Device visibility.
		if ( empty( $advanced_options['visibilityDesktop'] ) ) {
			$classes[] = 'wpcp-hide-desktop';
		}
		if ( empty( $advanced_options['visibilityTablet'] ) ) {
			$classes[] = 'wpcp-hide-tablet';
		}
		if ( empty( $advanced_options['visibilityMobile'] ) ) {
			$classes[] = 'wpcp-hide-mobile';
		}

		return $classes;
	}

	/**
	 * Build the inner wrapper attributes from author-provided Advanced options.
	 *
	 * @param array $advanced_options Advanced option attributes.
	 * @return string Attribute string for the `.wpcp-block-inner` element.
	 */
	private function build_inner_attributes( array $advanced_options ): string {
		$classes = array( 'wpcp-block-inner' );

		if ( ! empty( $advanced_options['cssClass'] ) && is_string( $advanced_options['cssClass'] ) ) {
			$custom_classes = preg_split( '/\s+/', trim( $advanced_options['cssClass'] ) );
			if ( is_array( $custom_classes ) ) {
				foreach ( $custom_classes as $custom_class ) {
					$custom_class = sanitize_html_class( $custom_class );
					if ( '' !== $custom_class ) {
						$classes[] = $custom_class;
					}
				}
			}
		}

		$attributes = ' class="' . esc_attr( implode( ' ', array_unique( $classes ) ) ) . '"';
		if ( ! empty( $advanced_options['cssId'] ) && is_string( $advanced_options['cssId'] ) ) {
			$css_id = preg_replace( '/[^a-zA-Z0-9_-]/', '', $advanced_options['cssId'] );
			if ( is_string( $css_id ) && '' !== $css_id ) {
				$attributes .= ' id="' . esc_attr( $css_id ) . '"';
			}
		}

		return $attributes;
	}

	/**
	 * Carousel root classes for the active content orientation (editor `ORIENTATION_CLASSES` parity).
	 *
	 * @return string[]
	 */
	private function get_content_orientation_root_classes(): array {
		$source_type         = $this->attrs['sourceType'] ?? 'image';
		$layout_options      = $this->attrs['layoutOptions'] ?? array();
		$content_orientation = $this->resolve_content_orientation(
			$source_type,
			(string) ( $layout_options['contentOrientation'] ?? 'image-top' )
		);

		$map = array(
			'overlay'  => 'detail-with-overlay wpcp-orientation-overlay',
			'diagonal' => 'detail-with-overlay overlay-curved wpcp-orientation-diagonal',
		);

		if ( ! isset( $map[ $content_orientation ] ) ) {
			return array();
		}

		return array_filter( explode( ' ', $map[ $content_orientation ] ) );
	}

	/**
	 * Allowed content orientations per block/source (matches `contentOrientations.jsx`).
	 *
	 * Resolved here for the root-class list, which is assembled before the
	 * per-slide {@see ItemRenderer} is constructed; ItemRenderer carries its own
	 * copy for per-item classes.
	 *
	 * @return string[]
	 */
	private function allowed_content_orientations(): array {
		return \ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues::content_orientations_for_block(
			$this->attrs['blockName'] ?? ''
		);
	}

	/**
	 * Resolve stored contentOrientation against the current source (matches editor `resolveContentOrientation`).
	 *
	 * @param string $source_type         Block sourceType attribute.
	 * @param string $content_orientation Raw layoutOptions.contentOrientation.
	 * @return string
	 */
	private function resolve_content_orientation( string $source_type, string $content_orientation ): string {
		$allowed = $this->allowed_content_orientations();
		if ( in_array( $content_orientation, $allowed, true ) ) {
			return $content_orientation;
		}
		return \ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues::content_orientation_fallback(
			$this->attrs['blockName'] ?? ''
		);
	}
}
