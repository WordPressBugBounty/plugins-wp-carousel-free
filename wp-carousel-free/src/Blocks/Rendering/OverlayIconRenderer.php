<?php
/**
 * Overlay lightbox icon for click-action mode.
 *
 * Frontend counterpart to `CarouselItem.jsx`'s overlay icon component. Builds the
 * `<div class="wpcp-overlay-icons">` wrapper with the lightbox anchor that sits
 * on top of the media area when the lightbox click action is enabled.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Item_Text;
use ShapedPlugin\WPCarouselFree\Blocks\Lightbox\Lightbox_Icon_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Builds click-action overlay icon markup for a single item using block attributes and the
 * shared click-action icon registry.
 */
class OverlayIconRenderer {

	/**
	 * The 9 anchor slugs accepted by the static `.wpcp-overlay-pos-*` rules in
	 * `blocks/blocks/style.scss`. Mirrors `OVERLAY_POSITION_SLUGS` in
	 * `CarouselItem.jsx`.
	 */
	public const POSITION_SLUGS = array(
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

	/**
	 * Default overlay-icon anchor when the attribute is unset / unrecognised.
	 * Mirrors `OVERLAY_POSITION_DEFAULT_SLUG` in `CarouselItem.jsx`.
	 */
	public const POSITION_DEFAULT_SLUG = 'top-right';

	/**
	 * Normalised block attributes (same shape as BlockRenderer).
	 *
	 * @var array
	 */
	private array $attrs;

	/**
	 * Root DOM id of the parent block — used as the FancyBox group identifier
	 * so the overlay-icon lightbox stays in the same gallery as the main media
	 * anchor.
	 *
	 * @var string
	 */
	private string $root_element_id;

	/**
	 * Shared icon registry (key → ['width' => int, 'height' => int, 'viewBox' => string, 'path' => string]).
	 * Loaded once by BlockRenderer and passed in so this class doesn't re-hit disk.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private array $icon_list;

	/**
	 * Constructor.
	 *
	 * @param array  $attrs           Normalised block attributes.
	 * @param string $root_element_id DOM id of the block root.
	 * @param array  $icon_list       Shared icon registry from BlockRenderer.
	 */
	public function __construct( array $attrs, string $root_element_id, array $icon_list ) {
		$this->attrs           = $attrs;
		$this->root_element_id = $root_element_id;
		$this->icon_list       = $icon_list;
	}

	/**
	 * Render the click-action overlay icon.
	 *
	 * @param array  $item                    Normalised slide item.
	 * @param string $image_src               Image source URL.
	 * @param bool   $is_lightbox             Whether lightbox is enabled.
	 * @param bool   $main_is_lightbox_member Whether the slide media is already a Fancybox gallery member.
	 * @return string
	 */
	public function render( array $item, string $image_src, bool $is_lightbox, bool $main_is_lightbox_member = false ): string {
		if ( ! $is_lightbox || empty( $image_src ) ) {
			return '';
		}

		$click_options = $this->attrs['clickActionOptions'] ?? array();

		// When the Lightbox module is active the overlay icon mirrors the global
		// Lightbox Settings (glyph, position, visibility); otherwise the block's
		// own clickActionOptions drive it. Mirrors OverlayIcons.jsx.
		$resolved   = Lightbox_Icon_Helper::resolve_overlay_lightbox_icon( $click_options );
		$use_global = 'global' === $resolved['source'];

		// Queue the scoped CSS that feeds the global icon size / colors / offset
		// into the overlay's `--wpcp-*` variables. Once per block scope.
		if ( $use_global ) {
			Lightbox_Icon_Helper::render_overlay_global_icon_style_markup( $this->root_element_id );
		}

		// Position class — static CSS handles each anchor (mirrors CarouselItem.jsx).
		// `AlignmentMatrixControl` emits the centre cell as the single token
		// `'center'`, and an unset value can arrive as `''` from older saved
		// posts. Both cases used to produce an orphan / trailing-dash class
		// name that no `.wpcp-overlay-pos-*` rule matches, so the icon fell to
		// the parent's 0,0. Normalise to one of the 9 known anchors below. The
		// global resolver already returns a normalised overlay slug.
		$position_slug = $use_global
			? $resolved['position']
			: self::resolve_position_slug(
				$click_options['lightboxIconPosition'] ?? $this->get_default_position_raw()
			);

		$wrapper_classes = array_filter(
			array(
				'wpcp-overlay-icons',
				'wpcp-overlay-pos-' . $position_slug,
				$use_global ? Lightbox_Icon_Helper::overlay_icons_visibility_class( $resolved['visibility'] ) : '',
			)
		);

		$lightbox_default_svg = '<svg viewBox="0 0 15 15" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round"><path d="M0.666748 4.83317V1.74984C0.666748 1.15153 1.15177 0.666504 1.75008 0.666504H4.83341M14.0001 4.83317V1.74984C14.0001 1.15153 13.5151 0.666504 12.9167 0.666504H9.83341M14.0001 9.83317V12.9165C14.0001 13.5148 13.5151 13.9998 12.9167 13.9998H9.83341M0.666748 9.83317V12.9165C0.666748 13.5148 1.15177 13.9998 1.75008 13.9998H4.83341" /></svg>';

		$lightbox_icon_html = $this->render_click_action_icon(
			array(
				'lightboxIconType'   => $resolved['icon_type'],
				'lightboxIcon'       => $resolved['icon_name'],
				'lightboxCustomIcon' => $resolved['custom_icon'],
			),
			$lightbox_default_svg
		);

		// Filtered to inline tags because Fancybox injects the caption with
		// innerHTML; `esc_attr` protects the attribute, not the sink.
		$caption = Item_Text::caption( $item['caption'] ?? $item['title'] ?? '' );
		// When the slide media is already a Fancybox gallery member, this icon
		// must not register a duplicate slide for the same image. Drop its
		// `data-fancybox` and mark it as a proxy — `initBlockLightbox()`
		// forwards its click to the media anchor. Otherwise it stays the real
		// trigger and keeps the group consistent with the media anchor
		// (`wpcp-{$root_element_id}`).
		$group        = 'wpcp-' . $this->root_element_id;
		$trigger_attr = $main_is_lightbox_member
			? ' data-wpcp-lb-proxy="1"'
			: ' data-fancybox="' . esc_attr( $group ) . '"';

		return sprintf(
			'<div class="%1$s"><a href="%2$s" class="wpcp-overlay-icon wpcp-lightbox-icon"%3$s data-caption="%4$s" aria-label="Open lightbox">%5$s</a></div>',
			esc_attr( implode( ' ', $wrapper_classes ) ),
			esc_url( $image_src ),
			$trigger_attr,
			esc_attr( $caption ),
			$lightbox_icon_html
		);
	}

	/**
	 * Canonicalise a `lightboxIconPosition` attribute value into one of the 9
	 * anchor slugs that the static `.wpcp-overlay-pos-*` CSS rules support.
	 *
	 * Handles three real inputs that used to break the rendered position:
	 *  - `null` / non-string / empty string → default anchor.
	 *  - `'center'` (single token emitted by `AlignmentMatrixControl` for the
	 *    centre cell) → expand to `'center-center'` so the CSS rule matches.
	 *  - Unknown / typo values → default anchor. Without this, an unrecognised
	 *    value produced an orphan class (`wpcp-overlay-pos-foo`) and the icon
	 *    fell to the parent's 0,0 because no rule set top/left/right/bottom.
	 *
	 * Mirrors `resolveOverlayPositionSlug()` in `CarouselItem.jsx`.
	 *
	 * @param mixed $raw Raw attribute value (typically string|null).
	 * @return string One of the 9 entries in {@see self::POSITION_SLUGS}.
	 */
	public static function resolve_position_slug( $raw ): string {
		if ( ! is_string( $raw ) || '' === trim( $raw ) ) {
			return self::POSITION_DEFAULT_SLUG;
		}
		$slug = strtolower( preg_replace( '/\s+/', '-', trim( $raw ) ) );
		if ( 'center' === $slug ) {
			return 'center-center';
		}
		return in_array( $slug, self::POSITION_SLUGS, true )
			? $slug
			: self::POSITION_DEFAULT_SLUG;
	}

	/**
	 * Default click-action icon position when the attribute is unset.
	 *
	 * @return string
	 */
	private function get_default_position_raw(): string {
		return 'top right';
	}

	/**
	 * Resolve the inner SVG/IMG markup for the lightbox icon based on user picks.
	 *
	 * @param array  $opts     clickActionOptions slice.
	 * @param string $fallback Hardcoded SVG used when neither a custom URL nor a library icon resolves.
	 * @return string Safe inner HTML.
	 */
	private function render_click_action_icon( array $opts, string $fallback ): string {
		$icon_type   = $opts['lightboxIconType'] ?? 'library';
		$custom_icon = $opts['lightboxCustomIcon'] ?? array();
		$custom_url  = is_array( $custom_icon ) ? ( $custom_icon['url'] ?? '' ) : '';

		if ( 'custom' === $icon_type && '' !== $custom_url ) {
			return '<img src="' . esc_url( $custom_url ) . '" alt="" class="wpcp-overlay-icon-img" />';
		}

		$icon_name = $opts['lightboxIcon'] ?? 'search';
		if ( 'lightbox-corners' === $icon_name ) {
			return '<svg viewBox="0 0 15 15" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round"><path d="M0.666748 4.83317V1.74984C0.666748 1.15153 1.15177 0.666504 1.75008 0.666504H4.83341M14.0001 4.83317V1.74984C14.0001 1.15153 13.5151 0.666504 12.9167 0.666504H9.83341M14.0001 9.83317V12.9165C14.0001 13.5148 13.5151 13.9998 12.9167 13.9998H9.83341M0.666748 9.83317V12.9165C0.666748 13.5148 1.15177 13.9998 1.75008 13.9998H4.83341" /></svg>';
		}

		$icon = $this->icon_list[ $icon_name ] ?? null;
		if ( ! is_array( $icon ) || ( empty( $icon['path'] ) && empty( $icon['paths'] ) ) ) {
			return $fallback;
		}

		$view_box = sanitize_text_field( $icon['viewBox'] ?? '0 0 24 24' );

		// Stroke-rendered icons (search, eye, …) draw an outline glyph. Emitting
		// `fill="currentColor"` collapsed the magnifier ring into a solid disc and
		// dropped its handle on the frontend. Mirror the editor's stroke branch in
		// OverlayIcons.jsx so editor and frontend render the same outline.
		if ( isset( $icon['render'] ) && 'stroke' === $icon['render'] ) {
			$stroke_width = isset( $icon['stroke_width'] ) ? (float) $icon['stroke_width'] : 1.75;
			return sprintf(
				'<svg viewBox="%1$s" fill="none" stroke="currentColor" stroke-width="%2$s" stroke-linecap="round" stroke-linejoin="round"><path d="%3$s" /></svg>',
				esc_attr( $view_box ),
				esc_attr( (string) $stroke_width ),
				esc_attr( (string) $icon['path'] )
			);
		}

		$width  = (int) ( $icon['width'] ?? 24 );
		$height = (int) ( $icon['height'] ?? 24 );
		return sprintf(
			'<svg viewBox="%1$s" width="%2$d" height="%3$d" fill="currentColor">%4$s</svg>',
			esc_attr( $view_box ),
			$width,
			$height,
			self::build_icon_paths_html( $icon )
		);
	}

	/**
	 * Build the inner `<path>` markup for an icon-list entry.
	 *
	 * Handles both the single `path` string and the multi-path `paths` array,
	 * plus `fill_rule` at either level — multi-path glyphs need it for evenodd
	 * holes. Mirrors `buildIconPathsHtml()` in the editor's OverlayIcons.jsx.
	 *
	 * @param array<string,mixed> $icon_data Icon-list entry.
	 * @return string Concatenated `<path>` elements.
	 */
	private static function build_icon_paths_html( array $icon_data ): string {
		$icon_fill_rule = isset( $icon_data['fill_rule'] ) ? (string) $icon_data['fill_rule'] : '';

		$paths = array();
		if ( ! empty( $icon_data['paths'] ) && is_array( $icon_data['paths'] ) ) {
			$paths = $icon_data['paths'];
		} elseif ( ! empty( $icon_data['path'] ) ) {
			$paths = array(
				array(
					'd'         => (string) $icon_data['path'],
					'fill_rule' => $icon_fill_rule,
				),
			);
		}

		$html = '';
		foreach ( $paths as $part ) {
			if ( ! is_array( $part ) || empty( $part['d'] ) ) {
				continue;
			}
			$path_fill_rule = isset( $part['fill_rule'] ) && '' !== $part['fill_rule']
				? (string) $part['fill_rule']
				: $icon_fill_rule;
			$fill_rule_attr = '' !== $path_fill_rule
				? sprintf( ' fill-rule="%s"', esc_attr( $path_fill_rule ) )
				: '';
			$html          .= sprintf( '<path d="%1$s"%2$s />', esc_attr( (string) $part['d'] ), $fill_rule_attr );
		}

		return $html;
	}
}
