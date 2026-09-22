<?php
/**
 * Sanitizers for author-supplied item text (title, caption, description, alt, custom URL).
 *
 * Item text arrives from the block's `items` attribute, which is stored in post
 * content and therefore untrusted: it can be hand-edited, pasted in from a
 * pattern, or POSTed to the nonce-only AJAX pagination route. These helpers are
 * the single place that decides which markup survives, so every sink — card
 * slots, thumbnail rail, and the lightbox `data-caption` that Fancybox injects
 * with `innerHTML` — agrees on one answer.
 *
 * Mirrors blocks/blocks/shared/utils/sanitizeItemText.js.
 *
 * @since 4.2.6
 * @version 1.0.0
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * Class Item_Text
 *
 * Field-specific allow-lists for per-item author text.
 */
class Item_Text {

	/**
	 * Protocols an item link may use.
	 *
	 * Deliberately narrower than `wp_allowed_protocols()`, which permits
	 * feed/irc/svn and friends that have no place in a carousel link.
	 *
	 * @var string[]
	 */
	const ALLOWED_PROTOCOLS = array( 'http', 'https', 'mailto', 'tel' );

	/**
	 * Elements whose text content must go too, rather than being unwrapped.
	 *
	 * `wp_kses()` drops the tags but keeps what is between them, so a
	 * `<script>alert(1)</script>` would otherwise survive as the visible text
	 * `alert(1)`. Mirrors DROP_ENTIRELY in sanitizeItemText.js.
	 *
	 * @var string[]
	 */
	const DROP_ENTIRELY = array( 'script', 'style', 'template', 'noscript', 'iframe', 'object', 'embed' );

	/**
	 * Inline formatting tags allowed in a title or caption.
	 *
	 * Titles carry things like chemical formulae and product model names, so
	 * sub/sup and basic emphasis earn their place. Links are excluded: a title
	 * often sits inside a card that is itself a link, and the same string is
	 * reused in attribute contexts (alt, aria-label, data-caption) where an
	 * anchor is meaningless.
	 *
	 * @param string $field Field the list is for, passed to the filter for context.
	 * @return array<string, array<string, bool>>
	 */
	public static function allowed_inline_tags( string $field = 'title' ): array {
		$allowed = array(
			'b'      => array(),
			'br'     => array(),
			'code'   => array(),
			'em'     => array(),
			'i'      => array(),
			'mark'   => array(),
			'small'  => array(),
			'span'   => array( 'class' => true ),
			'strong' => array(),
			'sub'    => array(),
			'sup'    => array(),
			's'      => array(),
			'u'      => array(),
		);

		return (array) apply_filters( 'wpcp_allowed_inline_tags', $allowed, $field );
	}

	/**
	 * Inline formatting tags plus links, allowed in a description.
	 *
	 * Block-level tags (p, ul, ol, li, blockquote) are intentionally absent —
	 * a description renders inside a `<p>`, so block tags there produce invalid
	 * markup. Their text content survives; only the tags are dropped.
	 *
	 * @param string $field Field the list is for, passed to the filter for context.
	 * @return array<string, array<string, bool>>
	 */
	public static function allowed_rich_tags( string $field = 'description' ): array {
		$allowed = self::allowed_inline_tags( $field );

		$allowed['a'] = array(
			'href'   => true,
			'title'  => true,
			'target' => true,
			'rel'    => true,
		);

		return (array) apply_filters( 'wpcp_allowed_rich_tags', $allowed, $field );
	}

	/**
	 * Sanitize a title for output as HTML.
	 *
	 * @param mixed $value Raw title.
	 * @return string
	 */
	public static function title( $value ): string {
		return self::kses( $value, self::allowed_inline_tags( 'title' ) );
	}

	/**
	 * Sanitize a description for output as HTML.
	 *
	 * @param mixed $value Raw description.
	 * @return string
	 */
	public static function description( $value ): string {
		return self::kses( $value, self::allowed_rich_tags( 'description' ) );
	}

	/**
	 * Sanitize a caption for output as HTML.
	 *
	 * Captions reach the Fancybox `.f-caption` element via `data-caption`, which
	 * Fancybox writes with `innerHTML`. Filtering to the inline list keeps
	 * emphasis working there while making `<img onerror>` and friends impossible.
	 *
	 * @param mixed $value Raw caption.
	 * @return string
	 */
	public static function caption( $value ): string {
		return self::kses( $value, self::allowed_inline_tags( 'caption' ) );
	}

	/**
	 * Reduce a value to plain text.
	 *
	 * For attribute-only sinks such as `alt`, where markup can never render and
	 * would only leak tag names into assistive technology.
	 *
	 * @param mixed $value Raw text.
	 * @return string
	 */
	public static function plain( $value ): string {
		if ( ! is_scalar( $value ) ) {
			return '';
		}

		return trim( wp_strip_all_tags( (string) $value ) );
	}

	/**
	 * Sanitize an author-supplied item URL.
	 *
	 * Returns an empty string for anything outside the protocol allow-list, so a
	 * `javascript:` or `data:` link becomes no link rather than a live one.
	 *
	 * @param mixed $value Raw URL.
	 * @return string
	 */
	public static function url( $value ): string {
		if ( ! is_scalar( $value ) ) {
			return '';
		}

		$value = trim( (string) $value );
		if ( '' === $value ) {
			return '';
		}

		// Browsers discard control characters inside a URL, so `java<TAB>script:`
		// is `javascript:` by the time it runs. Drop them before anything else.
		$value = (string) preg_replace( '/[\x00-\x1F\x7F]/', '', $value );
		if ( '' === $value ) {
			return '';
		}

		/*
		 * The HTML parser decodes entities before the URL is used, so the scheme
		 * has to be read from the decoded form — `javascript&colon;alert(1)` and
		 * `javascript:alert(1)` are the same link. Only the probe is decoded; the
		 * value returned keeps its original encoding.
		 */
		$probe = html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' );

		if ( preg_match( '#^[a-z][a-z0-9+.\-]*:#i', $probe ) ) {
			$scheme = strtolower( (string) strstr( $probe, ':', true ) );
			if ( ! in_array( $scheme, self::ALLOWED_PROTOCOLS, true ) ) {
				return '';
			}

			return esc_url_raw( $value, self::ALLOWED_PROTOCOLS );
		}

		// No recognisable scheme: a relative, protocol-relative, fragment or
		// query-only link, none of which can execute script. Consumers escape it
		// for their own context (`esc_url` / `esc_attr`).
		return $value;
	}

	/**
	 * Run kses over a value, tolerating non-string input.
	 *
	 * @param mixed $value   Raw value.
	 * @param array $allowed Allow-list in kses shape.
	 * @return string
	 */
	private static function kses( $value, array $allowed ): string {
		if ( ! is_scalar( $value ) ) {
			return '';
		}

		$value = self::drop_unsafe_elements( (string) $value );
		$value = self::drop_unsafe_hrefs( $value );

		return trim( wp_kses( $value, $allowed, self::ALLOWED_PROTOCOLS ) );
	}

	/**
	 * Remove elements whose content must not survive as text.
	 *
	 * @param string $value Raw value.
	 * @return string
	 */
	private static function drop_unsafe_elements( string $value ): string {
		$tags = implode( '|', self::DROP_ENTIRELY );

		// Paired form first, then any stray opening/self-closing tag left over.
		$value = (string) preg_replace( '@<(' . $tags . ')\b[^>]*?>.*?</\1\s*>@si', '', $value );

		return (string) preg_replace( '@</?(' . $tags . ')\b[^>]*>@i', '', $value );
	}

	/**
	 * Strip `href` attributes whose target is not an allowed protocol.
	 *
	 * `wp_kses()` removes the offending scheme but keeps the remainder, turning
	 * `href="javascript:alert(1)"` into the relative link `href="alert(1)"`.
	 * Dropping the attribute outright is both safer and what the JS mirror does.
	 *
	 * @param string $value Raw value.
	 * @return string
	 */
	private static function drop_unsafe_hrefs( string $value ): string {
		return (string) preg_replace_callback(
			'#\shref\s*=\s*(["\'])(.*?)\1#is',
			static function ( array $matches ): string {
				$url = self::url( html_entity_decode( $matches[2], ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );

				return '' === $url ? '' : ' href="' . esc_attr( $url ) . '"';
			},
			$value
		);
	}
}
