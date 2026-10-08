<?php
/**
 * AI Catalog Builder
 *
 * Per-block attribute catalogs for the AI builder's fallback (attribute-generation)
 * path, plus the block-name → Schema class map both the catalog and the validator
 * rely on.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AttributeSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\CarouselSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\SliderSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\ThumbnailsSliderSchema;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\TilesSchema;

defined( 'ABSPATH' ) || exit;

/**
 * AICatalogBuilder class.
 *
 * A hand-curated, AI-facing subset of each block's schema: only the keys worth an
 * AI decision, and only the values Free renders — every enum here reads
 * `Schema\AllowedValues`, so the model is never offered a Pro value.
 */
class AICatalogBuilder {

	/**
	 * Block slug → Schema class. Only blocks with a front-end renderer: Marquee
	 * and Panorama are editor previews and render nothing.
	 *
	 * @var array<string, class-string<AttributeSchema>>
	 */
	const SCHEMA_MAP = array(
		'carousel'          => CarouselSchema::class,
		'slider'            => SliderSchema::class,
		'thumbnails-slider' => ThumbnailsSliderSchema::class,
		'tiles'             => TilesSchema::class,
	);

	/**
	 * Blocks that show one item across, whatever `columns` says.
	 *
	 * @var string[]
	 */
	const SINGLE_COLUMN_BLOCKS = array( 'slider', 'thumbnails-slider' );

	/**
	 * Blocks whose Layout panel offers a carousel style picker.
	 *
	 * @var string[]
	 */
	const STYLE_PICKER_BLOCKS = array( 'carousel' );

	/**
	 * Value shapes referenced by more than one catalog line, spelled out once.
	 */
	const SHAPES = 'Value shapes referenced below:
	- <spacing> = { "allChange": bool, "unit": { "Desktop": "px", "Tablet": "px", "Mobile": "px" }, "device": { "Desktop": { "top": int, "right": int, "bottom": int, "left": int } } }. Set "allChange": true when all four sides are equal. "Tablet"/"Mobile" entries under "device" are optional.
	- <color> = a CSS hex or rgba string, e.g. "#111827" or "rgba(17,24,39,0.85)".
	- <typography> = { "fontWeight": "300"|"400"|"500"|"600"|"700"|"800", "transform": "uppercase"|"capitalize"|"lowercase", "fontSize": { "device": { "Desktop": int, "Tablet": int, "Mobile": int }, "unit": { "Desktop": "px", "Tablet": "px", "Mobile": "px" } }, "lineHeight": { "device": { "Desktop": number } }, "fontSpacing": { "device": { "Desktop": number }, "unit": { "Desktop": "px" } } }. Never set a font family — the site theme owns that.';

	/**
	 * Attributes shared by every carousel-style block. `{orientations}`,
	 * `{effects}` and `{aspectRatios}` are filled per block from AllowedValues.
	 */
	const BASE_CATALOG = '- "layoutOptions": { "columns": 1-12, "columnsTablet": 1-12, "columnsMobile": 1-12, "gap": int (0-200), "gapTablet": int, "gapMobile": int, "navigation": bool, "pagination": bool, "contentOrientation": {orientations} }
	- "sliderOptions": { "autoplay": bool, "autoplayDelay": int (500-10000), "speed": int (100-5000), "pauseOnHover": bool, "infiniteLoop": bool, "effect": {effects} } — "flip" and "cube" render ONE slide at a time, so only choose them alongside "columns": 1
	- "imageOptions": { "aspectRatio": {aspectRatios}, "resolution": "full"|"large"|"medium_large"|"medium"|"thumbnail", "borderRadius": <spacing>, "overlay": bool (scrim drawn over the image), "overlayColor": { "style": "solid", "solid": <color> }, "opacity": { "value": 0-100, "unit": "%" } (scrim strength at rest), "overlayColorHover": { "style": "solid", "solid": <color> }, "opacityHover": { "value": 0-100, "unit": "%" } }
	- "contentOptions" (the title and description text itself): { "showTitle": bool, "showDescription": bool, "titleTag": "h2"|"h3"|"h4"|"h5"|"h6"|"p"|"span", "alignment": "left"|"center"|"right", "titleColor": <color>, "descColor": <color>, "titleTypography": <typography>, "descTypography": <typography>, "descriptionLength": "full"|"limited", "descriptionWordLimit": int (applies when descriptionLength is "limited") }
	- "contentAreaOptions" (the card box drawn around that text): { "contentAreaBackground": { "color": { "style": "solid", "solid": <color> }, "hover": { "style": "solid", "solid": <color> } }, "padding": <spacing> (padding around the whole card, image included), "contentPadding": <spacing> (padding around just the text — "image-top" only), "borderRadius": <spacing>, "contentAreaStyle": { "normal": { "border": { "style": "none"|"solid"|"dashed"|"dotted"|"double", "color": <color> }, "borderWidth": { "unit": "px", "value": { "top": int, "right": int, "bottom": int, "left": int } } }, "hover": { same shape as "normal" } }, "boxShadowNormalEnable": bool, "boxShadowNormal": { "selectDefault": "var(--wpcp-shadow-subtle-1dp)"|"var(--wpcp-shadow-light-2dp)"|"var(--wpcp-shadow-medium-4dp)"|"var(--wpcp-shadow-strong-8dp)"|"var(--wpcp-shadow-deep-12dp)"|"var(--wpcp-shadow-sharp-4dp)" }, "boxShadowHoverEnable": bool, "boxShadowHover": { same shape as "boxShadowNormal" } } — "contentAreaStyle" is the item/card border (a request to add a border "around each item" or "each card" means this, not imageOptions.borderRadius which only rounds the image itself)';

	/**
	 * Arrow and pagination-dot styling. Tiles has neither attribute.
	 */
	const NAV_PAGINATION_CATALOG = '- "navigationOptions": { "colorNormal": "hex/rgba", "colorHover": "hex/rgba", "bgNormal": "hex/rgba", "bgHover": "hex/rgba", "position": {navPositions} } — prev/next arrow styling
	- "paginationDotsOptions": { "paginationStyle": {paginationStyles}, "colorNormal": "hex/rgba", "colorHover": "hex/rgba", "bgNormal": "hex/rgba", "bgHover": "hex/rgba", "alignment": "left"|"center"|"right" } — bullet/pagination-dot styling, not layoutOptions.pagination which only toggles it on/off';

	/**
	 * Blocks whose schema includes navigationOptions/paginationDotsOptions.
	 *
	 * @var string[]
	 */
	const NAV_PAGINATION_BLOCKS = array( 'carousel', 'slider', 'thumbnails-slider' );

	/**
	 * Per-block deltas on top of BASE_CATALOG.
	 *
	 * @var array<string, string>
	 */
	const BLOCK_DELTAS = array(
		'carousel'          => '- "layoutOptions.carouselStyle": {carouselStyles} — "center" keeps the active slide centred with its neighbours peeking in',
		'tiles'             => '- "layoutOptions.carouselStyle" is always "grid" — this block is a tile/bento grid, not a slider, and has no other style
	- "layoutOptions.tileLayout": {tileLayouts} (bento span presets)
	- "paginationOptions": { "imageItemsPerPage": int } — numbered AJAX pages, not slider navigation
	- Tiles has no single "layoutOptions.gap" — ignore that BASE_CATALOG line for this block. Use split-axis "layoutOptions.gapHorizontal"/"gapHorizontalTablet"/"gapHorizontalMobile" and "layoutOptions.gapVertical"/"gapVerticalTablet"/"gapVerticalMobile" (int, 0-200) instead',
		'slider'            => '- "layoutOptions.sliderLayout": {sliderLayouts} — the slide transition; this is the Slider block\'s defining choice, so set it whenever the request describes one
	- "layoutOptions.sliderHeight": { "device": { "Desktop": int, "Tablet": int, "Mobile": int }, "unit": { "Desktop": "px", "Tablet": "px", "Mobile": "px" } }',
		'thumbnails-slider' => '- "layoutOptions.thumbsPerView": int, "thumbsPerViewTablet": int, "thumbsPerViewMobile": int (thumbnails shown in the strip below the main image)',
	);

	/**
	 * Resolve the Schema class that owns a block's attributes.
	 *
	 * @param string $block_name Block slug, with or without the `wp-carousel-pro/` prefix.
	 * @return class-string<AttributeSchema>
	 */
	public static function schema_class_for_block( string $block_name ): string {
		return self::SCHEMA_MAP[ self::slug( $block_name ) ] ?? CarouselSchema::class;
	}

	/**
	 * Strip the block namespace.
	 *
	 * @param string $block_name Block slug, with or without the `wp-carousel-pro/` prefix.
	 * @return string
	 */
	public static function slug( string $block_name ): string {
		return str_replace( 'wp-carousel-pro/', '', $block_name );
	}

	/**
	 * Build the AI-facing attribute catalog for one block.
	 *
	 * @param string $block_name Block slug, with or without the `wp-carousel-pro/` prefix.
	 * @return string Catalog lines, one attribute path per line.
	 */
	public static function get_catalog( string $block_name ): string {
		$slug = self::slug( $block_name );
		if ( ! isset( self::SCHEMA_MAP[ $slug ] ) ) {
			$slug = 'carousel';
		}

		$catalog = self::SHAPES . "\n\n" . self::source_type_line() . "\n" . self::BASE_CATALOG;

		if ( in_array( $slug, self::NAV_PAGINATION_BLOCKS, true ) ) {
			$catalog .= "\n" . self::NAV_PAGINATION_CATALOG;
		}

		if ( ! empty( self::BLOCK_DELTAS[ $slug ] ) ) {
			$catalog .= "\n" . self::BLOCK_DELTAS[ $slug ];
		}

		return self::expand_value_lists( $catalog, $slug );
	}

	/**
	 * Fill in the value lists the catalog names by token, from the same
	 * allow-lists the inspector and `AIValueValidator` read.
	 *
	 * @param string $catalog Raw catalog text.
	 * @param string $slug    Block slug.
	 * @return string Catalog with `{token}` placeholders replaced.
	 */
	private static function expand_value_lists( string $catalog, string $slug ): string {
		return strtr(
			$catalog,
			array(
				'{orientations}'     => self::quoted_list( self::content_orientations( $slug ) ),
				'{effects}'          => self::quoted_list( AllowedValues::EFFECTS ),
				'{aspectRatios}'     => self::quoted_list( AllowedValues::IMAGE_ASPECT_RATIOS ),
				'{navPositions}'     => self::quoted_list( AllowedValues::NAV_POSITIONS ),
				'{paginationStyles}' => self::quoted_list( AllowedValues::PAGINATION_STYLES ),
				'{carouselStyles}'   => self::quoted_list( self::selectable_carousel_styles( $slug ) ),
				'{tileLayouts}'      => self::quoted_list( AllowedValues::TILE_LAYOUTS ),
				'{sliderLayouts}'    => self::quoted_list( AllowedValues::SLIDER_LAYOUTS ),
			)
		);
	}

	/**
	 * Content orientations a block offers.
	 *
	 * @param string $slug Block slug.
	 * @return string[]
	 */
	public static function content_orientations( string $slug ): array {
		return AllowedValues::content_orientations_for_block( $slug );
	}

	/**
	 * Carousel styles a block's picker offers; empty for a block that pins its own.
	 *
	 * @param string $slug Block slug.
	 * @return string[]
	 */
	public static function selectable_carousel_styles( string $slug ): array {
		if ( ! in_array( $slug, self::STYLE_PICKER_BLOCKS, true ) ) {
			return array();
		}

		$pinned = array(
			AllowedValues::carousel_style_fallback( 'tiles' ),
			AllowedValues::carousel_style_fallback( 'thumbnails-slider' ),
		);

		return array_values( array_diff( AllowedValues::CAROUSEL_STYLES, $pinned ) );
	}

	/**
	 * Whether a block can show more than one item across.
	 *
	 * @param string $slug Block slug.
	 * @return bool
	 */
	public static function renders_multiple_columns( string $slug ): bool {
		return ! in_array( $slug, self::SINGLE_COLUMN_BLOCKS, true );
	}

	/**
	 * Content sources the model may pick, minus `product` without WooCommerce.
	 *
	 * @return string[]
	 */
	public static function allowed_sources(): array {
		$sources = AllowedValues::SOURCES;

		if ( ! class_exists( 'WooCommerce' ) ) {
			$sources = array_values( array_diff( $sources, array( 'product' ) ) );
		}

		return $sources;
	}

	/**
	 * Render an allow-list the way every other catalog line spells one.
	 *
	 * @param string[] $values Allowed values.
	 * @return string e.g. `"slide"|"fade"`.
	 */
	private static function quoted_list( array $values ): string {
		return '"' . implode( '"|"', $values ) . '"';
	}

	/**
	 * Top-level attribute keys a block's catalog actually names, used to trim
	 * what `AIPromptBuilder` echoes back as "current values" on a refine.
	 *
	 * @param string $block_name Block slug, with or without the `wp-carousel-pro/` prefix.
	 * @return string[] Deduplicated top-level keys, e.g. [ 'sourceType', 'layoutOptions', ... ].
	 */
	public static function catalog_relevant_keys_for_block( string $block_name ): array {
		$catalog = self::get_catalog( $block_name );

		preg_match_all( '/^[ \t]*- "([a-zA-Z0-9_]+)/m', $catalog, $matches );

		return array_values( array_unique( $matches[1] ) );
	}

	/**
	 * The `sourceType` catalog line.
	 *
	 * @return string
	 */
	private static function source_type_line(): string {
		$hint = class_exists( 'WooCommerce' )
			? 'Default "image"; "post" for blog/posts, "product" for WooCommerce, "video" for YouTube/Vimeo'
			: 'Default "image"; "post" for blog/posts, "video" for YouTube/Vimeo. WooCommerce is not active on this site, so there is no product source';

		return '- "sourceType": ' . self::quoted_list( self::allowed_sources() ) . ' (' . $hint . ')';
	}
}
