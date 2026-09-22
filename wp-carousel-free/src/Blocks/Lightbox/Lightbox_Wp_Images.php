<?php
/**
 * Apply global lightbox to WordPress core Image and Gallery blocks.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Lightbox;

defined( 'ABSPATH' ) || exit;

/**
 * Lightbox_Wp_Images class.
 */
class Lightbox_Wp_Images {


	/**
	 * Lazily loaded global lightbox settings.
	 *
	 * @var array<string, mixed>|null
	 */
	private $settings = null;

	/**
	 * Register render_block filters.
	 *
	 * @return void
	 */
	public function register() {
		add_filter( 'render_block', array( $this, 'filter_render_block' ), 12, 3 );
	}

	/**
	 * Enhance core image / gallery markup when WP images lightbox is enabled.
	 *
	 * @param string         $content  Block HTML.
	 * @param array          $block    Block data.
	 * @param \WP_Block|null $instance Block instance (context for inner gallery images).
	 * @return string
	 */
	public function filter_render_block( $content, $block, $instance = null ) {
		if ( ! is_string( $content ) || '' === $content ) {
			return $content;
		}

		if ( ! Lightbox_Frontend::is_lightbox_active() || ! $this->wp_images_enabled() ) {
			return $content;
		}

		$name = isset( $block['blockName'] ) ? (string) $block['blockName'] : '';

		if ( 'core/gallery' === $name ) {
			if ( false !== strpos( $content, 'wpcp-wp-lightbox-host--gallery' ) ) {
				return $content;
			}

			return $this->enhance_core_gallery( $content, $block );
		}

		if ( 'core/image' === $name ) {
			if ( $this->is_gallery_inner_image( $instance ) ) {
				return $content;
			}

			if ( false !== strpos( $content, 'wpcp-lightbox-trigger' ) ) {
				return $content;
			}

			return $this->enhance_core_image( $content, $block );
		}

		return $content;
	}

	/**
	 * Images inside core/gallery are enhanced once on the gallery block (shared Fancybox group + thumbs).
	 *
	 * @param \WP_Block|null $instance Block instance.
	 * @return bool
	 */
	private function is_gallery_inner_image( $instance ) {
		return $instance instanceof \WP_Block && ! empty( $instance->context['galleryId'] );
	}

	/**
	 * Whether the global lightbox applies to core image blocks.
	 *
	 * @return bool
	 */
	private function wp_images_enabled() {
		$settings = $this->get_settings();
		return ! empty( $settings['wpImagesEnable'] );
	}

	/**
	 * Read the saved global lightbox settings once per request.
	 *
	 * @return array<string, mixed>
	 */
	private function get_settings() {
		if ( null === $this->settings ) {
			$this->settings = \ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules\Lightbox_Settings::get_settings();
		}
		return $this->settings;
	}

	/**
	 * Enhance single core/image block.
	 *
	 * @param string $content HTML.
	 * @param array  $block   Block.
	 * @return string
	 */
	private function enhance_core_image( $content, $block ) {
		$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();

		if ( ! $this->should_enhance_core_image( $attrs ) ) {
			return $content;
		}

		$image_id = isset( $attrs['id'] ) ? absint( $attrs['id'] ) : 0;
		$data     = $this->extract_image_data_from_fragment( $content, $image_id );
		if ( '' === $data['url'] ) {
			return $content;
		}

		$group    = $this->get_fancybox_group( $block );
		$settings = $this->get_settings();
		Lightbox_Icon_Helper::ensure_global_icon_css_queued( $settings );
		$resolved = Lightbox_Icon_Helper::resolve_global_icon( $settings );

		$icon = Lightbox_Icon_Helper::render_icon_trigger(
			$data['url'],
			$group,
			$resolved,
			'',
			array(
				'thumbSrc'     => $data['thumb'],
				'wpcpLbSingle' => true,
			)
		);

		$host = $this->wrap_host( $content );
		$host = $this->apply_lightbox_to_fragment( $host, $group, $data['url'], '' === $icon, $data['thumb'] );

		return $this->inject_icon_into_host( $host, $icon );
	}

	/**
	 * Enhance core/gallery block (each image in the gallery).
	 *
	 * @param string $content HTML.
	 * @param array  $block   Block.
	 * @return string
	 */
	private function enhance_core_gallery( $content, $block ) {
		$group    = $this->get_fancybox_group( $block );
		$settings = $this->get_settings();
		Lightbox_Icon_Helper::ensure_global_icon_css_queued( $settings );
		$resolved = Lightbox_Icon_Helper::resolve_global_icon( $settings );

		// Match each image cell only — not the outer <figure class="wp-block-gallery"> wrapper.
		$patterns = array(
			'/<figure\b[^>]*\bwp-block-image\b[^>]*>[\s\S]*?<\/figure>/i',
			'/<li\b[^>]*\bblocks-gallery-item\b[^>]*>[\s\S]*?<\/li>/i',
			'/<figure\b[^>]*\bblocks-gallery-item\b[^>]*>[\s\S]*?<\/figure>/i',
		);

		foreach ( $patterns as $pattern ) {
			$result = preg_replace_callback(
				$pattern,
				function ( $matches ) use ( $group, $resolved ) {
					return $this->enhance_gallery_item_fragment( $matches[0], $group, $resolved );
				},
				$content
			);

			if ( is_string( $result ) && $result !== $content ) {
				$content = $result;
			}
		}

		return $content;
	}

	/**
	 * Wrap a single gallery figure or list item with lightbox host + icon.
	 *
	 * @param string               $fragment HTML fragment.
	 * @param string               $group    Fancybox group.
	 * @param array<string, mixed> $resolved Icon settings.
	 * @return string
	 */
	private function enhance_gallery_item_fragment( $fragment, $group, array $resolved ) {
		if ( false !== strpos( $fragment, 'wpcp-wp-lightbox-host--gallery' ) ) {
			return $fragment;
		}

		// Re-group legacy enhancement (per-image Fancybox groups from an earlier core/image pass).
		if ( false !== strpos( $fragment, 'wpcp-lightbox-trigger' ) ) {
			$fragment = $this->strip_wpcp_lightbox_from_fragment( $fragment );
		}

		$data = $this->extract_image_data_from_fragment( $fragment, 0 );
		if ( '' === $data['url'] ) {
			return $fragment;
		}

		$icon  = Lightbox_Icon_Helper::render_icon_trigger(
			$data['url'],
			$group,
			$resolved,
			'',
			array( 'thumbSrc' => $data['thumb'] )
		);
		$inner = $this->apply_lightbox_to_fragment( $fragment, $group, $data['url'], '' === $icon, $data['thumb'] );

		$host_class = Lightbox_Icon_Helper::get_wp_host_class_attr( $this->get_settings(), 'wpcp-wp-lightbox-host--gallery' );
		$host_open  = '<div class="' . esc_attr( $host_class ) . '">';

		if ( preg_match( '/^<(figure|li)\b([^>]*)>(.*)<\/\1>$/is', $inner, $tag_match ) ) {
			$tag   = $tag_match[1];
			$attrs = $tag_match[2];
			$body  = $tag_match[3];

			if ( false === stripos( $attrs, 'class=' ) ) {
				$attrs .= ' class="wpcp-wp-lightbox-figure"';
			} elseif ( ! preg_match( '/wpcp-wp-lightbox-figure/i', $attrs ) ) {
				$attrs = preg_replace(
					'/class=(["\'])([^"\']*)\1/i',
					'class=$1$2 wpcp-wp-lightbox-figure$1',
					$attrs,
					1
				);
			}

			return '<' . $tag . $attrs . '>' . $host_open . $body . $icon . '</div></' . $tag . '>';
		}

		return $host_open . $inner . $icon . '</div>';
	}

	/**
	 * Resolve full-size and thumbnail URLs from gallery/image HTML.
	 *
	 * @param string $fragment HTML containing an image.
	 * @param int    $image_id Attachment ID when known.
	 * @return array{url: string, thumb: string}
	 */
	private function extract_image_data_from_fragment( $fragment, $image_id = 0 ) {
		$url   = '';
		$thumb = '';

		if ( $image_id ) {
			$full = wp_get_attachment_image_url( $image_id, 'full' );
			if ( is_string( $full ) && '' !== $full ) {
				$url = $full;
			}
			$medium = wp_get_attachment_image_url( $image_id, 'medium' );
			if ( is_string( $medium ) && '' !== $medium ) {
				$thumb = $medium;
			}
		}

		if ( preg_match( '/<a\s[^>]*href=["\']([^"\']+)["\']/i', $fragment, $link_match ) ) {
			$url = esc_url_raw( $link_match[1] );
		}

		if ( '' === $url && preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/i', $fragment, $img_match ) ) {
			$url = esc_url_raw( $img_match[1] );
		}

		if ( ! $image_id && preg_match( '/\bwp-image-(\d+)\b/i', $fragment, $id_match ) ) {
			$attachment_id = absint( $id_match[1] );
			$full          = wp_get_attachment_image_url( $attachment_id, 'full' );
			if ( is_string( $full ) && '' !== $full ) {
				$url = $full;
			}
			$medium = wp_get_attachment_image_url( $attachment_id, 'medium' );
			if ( is_string( $medium ) && '' !== $medium ) {
				$thumb = $medium;
			}
		}

		if ( '' === $thumb && '' !== $url ) {
			$thumb = $url;
		}

		return array(
			'url'   => is_string( $url ) ? $url : '',
			'thumb' => is_string( $thumb ) ? $thumb : '',
		);
	}

	/**
	 * Whether a core Image block should get the lightbox trigger.
	 *
	 * @param array<string, mixed> $attrs Block attrs.
	 * @return bool
	 */
	private function should_enhance_core_image( array $attrs ) {
		$link_dest = isset( $attrs['linkDestination'] ) ? (string) $attrs['linkDestination'] : 'none';
		if ( 'custom' === $link_dest ) {
			return false;
		}
		return true;
	}

	/**
	 * Resolve the Fancybox gallery group a block belongs to.
	 *
	 * @param array $block Block.
	 * @return string
	 */
	private function get_fancybox_group( array $block ) {
		$name = isset( $block['blockName'] ) ? (string) $block['blockName'] : '';

		if ( 'core/gallery' === $name ) {
			$key = isset( $block['attrs']['anchor'] ) ? sanitize_title( (string) $block['attrs']['anchor'] ) : '';
			if ( '' === $key ) {
				$key = 'gallery-' . ( function_exists( 'wp_unique_id' ) ? wp_unique_id() : uniqid() );
			}
			return 'wpcp-wp-' . $key;
		}

		$key = isset( $block['attrs']['anchor'] ) ? sanitize_title( (string) $block['attrs']['anchor'] ) : '';
		if ( '' === $key && ! empty( $block['attrs']['id'] ) ) {
			$key = 'img-' . absint( $block['attrs']['id'] );
		}
		if ( '' === $key ) {
			$key = function_exists( 'wp_unique_id' ) ? wp_unique_id( 'wpcp-wp-' ) : uniqid( 'wpcp-wp-' );
		}
		return 'wpcp-wp-' . $key;
	}

	/**
	 * Wrap bare image markup in a host element the icon can anchor to.
	 *
	 * @param string $content HTML.
	 * @return string
	 */
	private function wrap_host( $content ) {
		if ( false !== strpos( $content, 'wpcp-wp-lightbox-host' ) ) {
			return $content;
		}

		$host_class = Lightbox_Icon_Helper::get_wp_host_class_attr( $this->get_settings() );
		$host_open  = '<div class="' . esc_attr( $host_class ) . '">';

		$wrapped = preg_replace(
			'/(<figure[^>]*class="[^"]*wp-block-image[^"]*"[^>]*>)/i',
			'$1' . $host_open,
			$content,
			1
		);

		if ( null === $wrapped || $wrapped === $content ) {
			$wrapped = $host_open . $content;
			return $wrapped . '</div>';
		}

		$closed = preg_replace( '/<\/figure>/i', '</div></figure>', $wrapped, 1 );

		return empty( $closed ) ? $content : $closed;
	}

	/**
	 * Remove per-image lightbox markup so the gallery pass can apply one shared Fancybox group.
	 *
	 * @param string $fragment HTML fragment.
	 * @return string
	 */
	private function strip_wpcp_lightbox_from_fragment( $fragment ) {
		$fragment = preg_replace(
			'/<a\s[^>]*class="[^"]*wpcp-advanced-image-lightbox-icon[^"]*"[^>]*>[\s\S]*?<\/a>/i',
			'',
			$fragment
		);

		$fragment = preg_replace( '/<div class="[^"]*wpcp-wp-lightbox-host[^"]*">\s*/i', '', $fragment, 1 );
		$fragment = preg_replace( '/\s*<\/div>(?=\s*<\/figure>|\s*<\/li>)/i', '', $fragment, 1 );

		$fragment = preg_replace( '/\s*class="[^"]*wpcp-lightbox-trigger[^"]*"/i', '', $fragment );
		$fragment = preg_replace( '/\s*class="[^"]*wpcp-wp-lightbox-image-link[^"]*"/i', '', $fragment );
		$fragment = preg_replace( '/\s*data-fancybox="[^"]*"/i', '', $fragment );
		$fragment = preg_replace( '/\s*data-wpcp-lb-single="[^"]*"/i', '', $fragment );
		$fragment = preg_replace( '/\s*data-thumb-src="[^"]*"/i', '', $fragment );
		$fragment = preg_replace( '/\s*data-wpcp-wp-lb-image="[^"]*"/i', '', $fragment );

		return is_string( $fragment ) ? $fragment : '';
	}

	/**
	 * Add fancybox attrs to first image link or wrap image.
	 *
	 * @param string $fragment HTML fragment.
	 * @param string $group    Group id.
	 * @param string $full_url Full size URL.
	 * @param bool   $bind_fancybox True = image link is Fancybox trigger; false = icon-only (gallery/image).
	 * @param string $thumb_url     Thumb URL for Fancybox strip.
	 * @return string
	 */
	private function apply_lightbox_to_fragment( $fragment, $group, $full_url, $bind_fancybox = true, $thumb_url = '' ) {
		$thumb_attr = '';
		if ( '' !== $thumb_url ) {
			$thumb_attr = sprintf( ' data-thumb-src="%s"', esc_attr( $thumb_url ) );
		}

		if ( $bind_fancybox ) {
			if ( preg_match( '/<a\s[^>]*href=["\'][^"\']+["\'][^>]*>/i', $fragment ) ) {
				$fragment = preg_replace(
					'/<a\s/i',
					'<a class="wpcp-lightbox-trigger" data-fancybox="' . esc_attr( $group ) . '"' . $thumb_attr . ' ',
					$fragment,
					1
				);
				$fragment = preg_replace(
					'/(<a\s[^>]*class="[^"]*wpcp-lightbox-trigger[^"]*"[^>]*href=["\'])([^"\']+)(["\'])/i',
					'$1' . esc_url( $full_url ) . '$3',
					$fragment,
					1
				);
				return is_string( $fragment ) ? $fragment : '';
			}

			if ( preg_match( '/<img[^>]+>/i', $fragment, $img_match ) ) {
				$img_tag = $img_match[0];
				$wrapped = sprintf(
					'<a class="wpcp-lightbox-trigger" href="%1$s" data-fancybox="%2$s"%3$s>%4$s</a>',
					esc_url( $full_url ),
					esc_attr( $group ),
					$thumb_attr,
					$img_tag
				);
				return str_replace( $img_tag, $wrapped, $fragment );
			}

			return $fragment;
		}

		if ( preg_match( '/<a\s[^>]*href=["\'][^"\']+["\'][^>]*>/i', $fragment ) ) {
			$fragment = preg_replace(
				'/<a\s/i',
				'<a class="wpcp-wp-lightbox-image-link" data-wpcp-wp-lb-image="1" ',
				$fragment,
				1
			);
			$fragment = preg_replace(
				'/(<a\s[^>]*class="[^"]*wpcp-wp-lightbox-image-link[^"]*"[^>]*href=["\'])([^"\']+)(["\'])/i',
				'$1' . esc_url( $full_url ) . '$3',
				$fragment,
				1
			);
			return is_string( $fragment ) ? $fragment : '';
		}

		if ( preg_match( '/<img[^>]+>/i', $fragment, $img_match ) ) {
			$img_tag = $img_match[0];
			$wrapped = sprintf(
				'<a class="wpcp-wp-lightbox-image-link" href="%1$s" data-wpcp-wp-lb-image="1">%2$s</a>',
				esc_url( $full_url ),
				$img_tag
			);
			return str_replace( $img_tag, $wrapped, $fragment );
		}

		return $fragment;
	}

	/**
	 * Insert the trigger icon anchor into the host element.
	 *
	 * @param string $host HTML.
	 * @param string $icon Icon anchor HTML.
	 * @return string
	 */
	private function inject_icon_into_host( $host, $icon ) {
		if ( '' === $icon || false !== strpos( $host, 'wpcp-global-lightbox-icon' ) ) {
			return $host;
		}

		if ( false !== strpos( $host, 'wpcp-wp-lightbox-host' ) ) {
			$injected = preg_replace( '/<\/div>\s*<\/figure>/i', $icon . '</div></figure>', $host, 1 );
			if ( ! empty( $injected ) ) {
				return $injected;
			}

			return preg_replace( '/(<div class="[^"]*wpcp-wp-lightbox-host[^"]*">)/i', '$1', $host ) . $icon . '</div>';
		}

		$host_class = Lightbox_Icon_Helper::get_wp_host_class_attr( $this->get_settings() );
		return '<div class="' . esc_attr( $host_class ) . '">' . $host . $icon . '</div>';
	}
}
