<?php
/**
 * Social share markup for carousel items (frontend block render).
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Rendering;

defined( 'ABSPATH' ) || exit;

/**
 * Builds the social share list markup for a normalised item using block attributes.
 */
class SocialShareRenderer {

	/**
	 * Library icon slugs for every social network the share row can show.
	 *
	 * Mirrors the values of `SOCIAL_ICON_KEYS` in the editor
	 * (`carousel-render/constants.js`); used to slice the small social subset
	 * out of the full icon library so the editor can render it synchronously.
	 *
	 * @var string[]
	 */
	private const SOCIAL_ICON_SLUGS = array(
		'facebook-f',
		'x-twitter',
		'linkedin-in',
		'pinterest',
		'e-mail',
		'instagram',
		'vk',
		'digg',
		'tumblr',
		'reddit',
		'whatsapp',
		'get-pocket',
		'xing',
		'clone',
	);

	/**
	 * Normalised block attributes.
	 *
	 * @var array
	 */
	private array $attrs;

	/**
	 * Constructor.
	 *
	 * @param array $attrs Normalised block attributes (same shape as BlockRenderer).
	 */
	public function __construct( array $attrs ) {
		$this->attrs = $attrs;
	}

	/**
	 * Render social share icons for an item.
	 *
	 * @param array $item Normalised item.
	 * @return string
	 */
	public function render( array $item ): string {
		$social_share_options = $this->attrs['socialShareOptions'] ?? array();
		if ( empty( $social_share_options['enabled'] ) ) {
			return '';
		}

		// Every item shares the block-level network list — the per-item override
		// is Pro, and no item-edit popup in Free has a control that sets it.
		$block_networks = $social_share_options['networks'] ?? array( 'facebook-f', 'x', 'linkedin-in' );
		$networks       = $this->canonicalize_networks( $block_networks );
		$url            = rawurlencode( $item['url'] ?? '' );

		$share_urls = array(
			'facebook'    => "https://www.facebook.com/sharer/sharer.php?u={$url}",
			'facebook-f'  => "https://www.facebook.com/sharer/sharer.php?u={$url}",
			'x'           => "https://twitter.com/intent/tweet?url={$url}",
			'linkedin-in' => "https://www.linkedin.com/sharing/share-offsite/?url={$url}",
			'pinterest'   => "https://pinterest.com/pin/create/button/?url={$url}",
			'mail'        => "mailto:?subject=&body={$url}",
			'instagram'   => "https://www.instagram.com/?url={$url}",
			'vkontakte'   => "https://vk.com/share.php?url={$url}",
			'digg'        => "http://digg.com/submit?url={$url}",
			'tumblr'      => "https://www.tumblr.com/widgets/share/tool?canonicalUrl={$url}",
			'reddit'      => "https://www.reddit.com/submit?url={$url}",
			'whatsapp'    => "https://api.whatsapp.com/send?text={$url}",
			'pocket'      => "https://getpocket.com/save?url={$url}",
			'xing'        => "https://www.xing.com/spi/shares/new?url={$url}",
			'clone'       => '#',
		);
		$icon_keys  = array(
			'facebook'    => 'facebook-f',
			'facebook-f'  => 'facebook-f',
			'x'           => 'x-twitter',
			'linkedin-in' => 'linkedin-in',
			'pinterest'   => 'pinterest',
			'mail'        => 'e-mail',
			'instagram'   => 'instagram',
			'vkontakte'   => 'vk',
			'digg'        => 'digg',
			'tumblr'      => 'tumblr',
			'reddit'      => 'reddit',
			'whatsapp'    => 'whatsapp',
			'pocket'      => 'get-pocket',
			'xing'        => 'xing',
			'clone'       => 'clone',
		);
		$icon_list  = $this->get_icon_list();
		$icon_view  = $social_share_options['iconView'] ?? 'stacked';
		$is_custom  = ! empty( $social_share_options['customStyling'] );
		$classes    = array( 'wpcp-item-social', 'wpcp-social-share' );
		if ( 'normal' === $icon_view ) {
			$classes[] = 'icon-only';
		} elseif ( 'stacked' === $icon_view || 'round' === $icon_view ) {
			$classes[] = 'icon-round';
		} elseif ( 'square' === $icon_view ) {
			$classes[] = 'icon-square';
		} elseif ( 'framed' === $icon_view ) {
			$classes[] = 'icon-framed';
		}
		if ( ! $is_custom ) {
			$classes[] = 'original-css';
		}

		$html = '<ul class="' . esc_attr( implode( ' ', $classes ) ) . '" data-component="social_share">';
		foreach ( $networks as $network ) {
			if ( ! isset( $share_urls[ $network ] ) ) {
				continue;
			}
			$platform  = sanitize_html_class( strtolower( (string) $network ) );
			$label     = ( 'clone' === $platform ) ? __( 'Copy post URL', 'wp-carousel-free' ) : ucfirst( $platform );
			$icon      = $icon_list[ $icon_keys[ $platform ] ] ?? array();
			$view_box  = sanitize_text_field( $icon['viewBox'] ?? '0 0 24 24' );
			$path_data = sanitize_text_field( $icon['path'] ?? '' );
			$width     = (int) ( $icon['width'] ?? 20 );
			$height    = (int) ( $icon['height'] ?? 20 );
			$icon_html = $path_data
				? '<svg viewBox="' . esc_attr( $view_box ) . '" width="' . (int) $width . '" height="' . (int) $height . '"><path d="' . esc_attr( $path_data ) . '"/></svg>'
				: '<span>' . esc_html( strtoupper( substr( $label, 0, 1 ) ) ) . '</span>';
			$html     .= '<li class="wpcp-social-share-icon">';
			if ( 'clone' === $platform ) {
				$html .= sprintf(
					'<span class="wpcp-copy-url-area"><a href="#" title="%1$s" class="wpcp-social-share-link wpcp-copy-btn wpcp-share-btn wpcp-share-clone" data-url="%2$s" data-action="copy">%4$s<div class="wpcp-post-url-copy-popup wpcp-d-hidden">%3$s</div></a></span>',
					esc_attr__( 'Copy post URL', 'wp-carousel-free' ),
					esc_url( $item['url'] ?? '' ),
					esc_html__( 'Copied!', 'wp-carousel-free' ),
					$icon_html
				);
			} else {
				$html .= sprintf(
					'<a href="%1$s" target="_blank" rel="noopener noreferrer" class="wpcp-social-share-link wpcp-share-btn wpcp-share-%4$s" title="%2$s" data-action="share">%3$s</a>',
					esc_url( $share_urls[ $platform ] ),
					esc_attr( $label ),
					$icon_html,
					esc_attr( $platform )
				);
			}
			$html .= '</li>';
		}
		$html .= '</ul>';

		return $html;
	}

	/**
	 * Normalise a raw network list (block-level OR per-item) to the canonical
	 * identifiers used by the share-URL / icon maps.
	 *
	 * @param mixed $raw Raw input (expects array of strings).
	 * @return string[] Deduplicated, alias-resolved network ids.
	 */
	private function canonicalize_networks( $raw ): array {
		$aliases = array(
			'twitter'    => 'x',
			'email'      => 'mail',
			'copy'       => 'clone',
			'facebook-f' => 'facebook',
			'linkedin'   => 'linkedin-in',
		);

		$networks = array_map(
			static function ( $network ) use ( $aliases ) {
				return $aliases[ $network ] ?? $network;
			},
			is_array( $raw ) ? $raw : array()
		);

		return array_values( array_unique( $networks ) );
	}

	/**
	 * Shared SVG icon registry (icon name => { viewBox, width, height, path, … }).
	 *
	 * Public so sibling renderers (e.g. SlotRenderer for the rating icon) can
	 * resolve a library icon key without reloading the file.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function get_icon_list(): array {
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
	 * Social-network icon subset, keyed by library slug.
	 *
	 * Returns only the icons the share row can use, trimmed to the fields the
	 * editor needs (`viewBox`/`width`/`height`/`path`). Localised into the
	 * editor so `SocialShareList` paints synchronously instead of waiting on
	 * the full icon-library REST fetch — keeping `icon-list.php` the single
	 * source of truth shared with the frontend renderer above.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function get_social_icons(): array {
		$icon_file = WPCAROUSELF_PATH . 'src/Blocks/icons/icon-list.php';
		if ( ! file_exists( $icon_file ) ) {
			return array();
		}
		$loaded = require $icon_file;
		if ( ! is_array( $loaded ) ) {
			return array();
		}

		$social_icons = array();
		foreach ( self::SOCIAL_ICON_SLUGS as $slug ) {
			if ( empty( $loaded[ $slug ] ) || ! is_array( $loaded[ $slug ] ) ) {
				continue;
			}
			$icon                  = $loaded[ $slug ];
			$social_icons[ $slug ] = array(
				'viewBox' => $icon['viewBox'] ?? '0 0 24 24',
				'width'   => $icon['width'] ?? 20,
				'height'  => $icon['height'] ?? 20,
				'path'    => $icon['path'] ?? '',
			);
		}

		return $social_icons;
	}
}
