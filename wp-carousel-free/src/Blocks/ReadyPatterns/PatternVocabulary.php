<?php
/**
 * Canonical Ready Patterns browse vocabularies.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns;

defined( 'ABSPATH' ) || exit;

/**
 * Supplies human labels and a stable display order for pattern taxonomy terms.
 *
 * These lists label and order; they never decide which patterns are shown. A term
 * the plugin has never heard of is still listed, humanized, and filterable — the
 * category→block map became a silent gate exactly because that was left implicit.
 */
class PatternVocabulary {

	/**
	 * Canonical use-case slugs in display order.
	 *
	 * @var string[]
	 */
	public const USE_CASES = array(
		'hero',
		'features',
		'portfolio',
		'gallery',
		'testimonials',
		'team',
		'logos',
		'pricing',
		'cta',
		'faq',
		'blog',
		'shop',
		'video',
		'events',
		'listings',
		'education',
		'hospitality',
		'downloads',
		'social-feed',
		'page',
	);

	/**
	 * Canonical complexity slugs in display order.
	 *
	 * @var string[]
	 */
	public const COMPLEXITY_LEVELS = array( 'starter', 'standard', 'showcase' );

	/**
	 * Recommended layout-trait tags in display order (free-form tags are still accepted).
	 *
	 * @var string[]
	 */
	public const RECOMMENDED_TRAITS = array(
		'fullscreen',
		'boxed',
		'overlay',
		'classic',
		'bento',
		'vertical',
		'filterable',
		'autoplay',
		'webgl',
		'lightbox',
		'ajax',
		'dark',
		'light',
		'minimal',
		'bold',
	);

	/**
	 * Tag that declares a pattern was designed on a dark background.
	 */
	public const DARK_TRAIT = 'dark';

	/**
	 * Use-case slug → translated label.
	 *
	 * @return array<string, string>
	 */
	public static function use_case_labels(): array {
		return array(
			'hero'         => __( 'Hero', 'wp-carousel-free' ),
			'features'     => __( 'Features', 'wp-carousel-free' ),
			'portfolio'    => __( 'Portfolio', 'wp-carousel-free' ),
			'gallery'      => __( 'Gallery', 'wp-carousel-free' ),
			'testimonials' => __( 'Testimonials', 'wp-carousel-free' ),
			'team'         => __( 'Team', 'wp-carousel-free' ),
			'logos'        => __( 'Logos', 'wp-carousel-free' ),
			'pricing'      => __( 'Pricing', 'wp-carousel-free' ),
			'cta'          => __( 'Call to Action', 'wp-carousel-free' ),
			'faq'          => __( 'FAQ', 'wp-carousel-free' ),
			'blog'         => __( 'Blog', 'wp-carousel-free' ),
			'shop'         => __( 'Shop', 'wp-carousel-free' ),
			'video'        => __( 'Video', 'wp-carousel-free' ),
			'events'       => __( 'Events', 'wp-carousel-free' ),
			'listings'     => __( 'Listings', 'wp-carousel-free' ),
			'education'    => __( 'Education', 'wp-carousel-free' ),
			'hospitality'  => __( 'Hospitality', 'wp-carousel-free' ),
			'downloads'    => __( 'Downloads', 'wp-carousel-free' ),
			'social-feed'  => __( 'Social Feed', 'wp-carousel-free' ),
			'page'         => __( 'Full Page', 'wp-carousel-free' ),
		);
	}

	/**
	 * Complexity slug → translated label.
	 *
	 * @return array<string, string>
	 */
	public static function complexity_labels(): array {
		return array(
			'starter'  => __( 'Starter', 'wp-carousel-free' ),
			'standard' => __( 'Standard', 'wp-carousel-free' ),
			'showcase' => __( 'Showcase', 'wp-carousel-free' ),
		);
	}

	/**
	 * Label for a use-case term, humanizing terms outside the canonical list.
	 *
	 * @param string $term Use-case slug.
	 * @return string
	 */
	public static function use_case_label( string $term ): string {
		$labels = self::use_case_labels();

		return $labels[ $term ] ?? self::humanize( $term );
	}

	/**
	 * Label for a complexity term, humanizing unknown terms.
	 *
	 * @param string $term Complexity slug.
	 * @return string
	 */
	public static function complexity_label( string $term ): string {
		$labels = self::complexity_labels();

		return $labels[ $term ] ?? self::humanize( $term );
	}

	/**
	 * Order terms canonically first, then unknown terms alphabetically.
	 *
	 * @param string[] $terms     Terms present in the manifest.
	 * @param string[] $canonical Canonical order to apply first.
	 * @return string[]
	 */
	public static function order_terms( array $terms, array $canonical ): array {
		$present = array_values( array_unique( array_filter( array_map( 'strval', $terms ) ) ) );
		$known   = array_values( array_intersect( $canonical, $present ) );
		$unknown = array_values( array_diff( $present, $canonical ) );
		sort( $unknown );

		return array_merge( $known, $unknown );
	}

	/**
	 * Turn a slug into a readable label ("real-estate" → "Real Estate").
	 *
	 * @param string $term Slug.
	 * @return string
	 */
	public static function humanize( string $term ): string {
		return ucwords( str_replace( array( '-', '_' ), ' ', $term ) );
	}
}
