<?php
/**
 * AI Value Validator
 *
 * Leaf-level type/range/enum gate for AI-generated block attributes.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

use ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils\Css_Helpers;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;

defined( 'ABSPATH' ) || exit;

/**
 * AIValueValidator class.
 *
 * `AISchemaValidator` only ever filtered the AI's response by top-level key, so
 * anything below that — an out-of-range `columns`, an invented
 * `layoutOptions.cardStyle`, a `contentOrientation` the target block does not
 * have, a `gap` that arrived as the string "large" — was merged into the block's
 * saved attributes verbatim and then silently ignored by whatever consumer read
 * it. From the user's side that reads as "the AI ignored what I asked for", with
 * no way to tell a model mistake from an unsupported request.
 *
 * Two gates run here, both against the block's own schema and the same allow-lists
 * the inspector controls use:
 *
 * 1. **Shape** — a first-level key under a known attribute group must exist on
 *    that group's schema default. Deeper structure is left alone: responsive
 *    `device`/`unit` maps and the runtime background shape legitimately carry
 *    keys the schema default does not enumerate.
 * 2. **Value** — a leaf with a rule is coerced (numeric strings, boolish
 *    strings), clamped when it is a range, and dropped when it is an enum,
 *    color, or type the value cannot satisfy.
 *
 * A dropped leaf leaves the merge untouched, so the block keeps its schema
 * default (or, on a refine, the value it already had) instead of storing a value
 * nothing can render.
 */
class AIValueValidator {

	/**
	 * CSS units accepted on a responsive `unit` map.
	 *
	 * @var string[]
	 */
	const SPACING_UNITS = array( 'px', '%', 'em', 'rem' );

	/**
	 * Attributes a model response never gets to set, whatever it sends.
	 *
	 * `uniqueId` scopes every per-instance CSS selector the block emits, and
	 * `blockName` decides which renderer runs — both are assigned by the editor
	 * and the merger, and a generated value would break the block rather than
	 * restyle it. Neither is in any catalog; this is the backstop.
	 *
	 * @var string[]
	 */
	const REJECTED_KEYS = array( 'uniqueId', 'blockName' );

	/**
	 * Rules keyed by dotted attribute path. A `*` segment matches any single key.
	 *
	 * Each rule is `array( <kind>, <arg> )`:
	 *  - `int`    — `array( min, max )`, clamped.
	 *  - `number` — `array( min, max )`, clamped, floats kept.
	 *  - `bool`   — no arg.
	 *  - `enum`   — allowed values, or a `@name` resolved per block by `dynamic_enum()`.
	 *  - `color`  — any value `Css_Helpers::sanitize_color()` accepts.
	 *  - `content_color` — a color string, or the `{ color, hoverColor }` object shape.
	 *  - `shadow_preset` — one of the plugin's own `var(--wpcp-shadow-*)` tokens.
	 *
	 * @var array<string, array{0: string, 1?: mixed}>
	 */
	const RULES = array(
		'sourceType'                                       => array( 'enum', '@sources' ),

		'layoutOptions.columns'                            => array( 'int', array( 1, 12 ) ),
		'layoutOptions.columnsTablet'                      => array( 'int', array( 1, 12 ) ),
		'layoutOptions.columnsMobile'                      => array( 'int', array( 1, 12 ) ),
		'layoutOptions.gap'                                => array( 'int', array( 0, 200 ) ),
		'layoutOptions.gapTablet'                          => array( 'int', array( 0, 200 ) ),
		'layoutOptions.gapMobile'                          => array( 'int', array( 0, 200 ) ),
		'layoutOptions.gapHorizontal'                      => array( 'int', array( 0, 200 ) ),
		'layoutOptions.gapHorizontalTablet'                => array( 'int', array( 0, 200 ) ),
		'layoutOptions.gapHorizontalMobile'                => array( 'int', array( 0, 200 ) ),
		'layoutOptions.gapVertical'                        => array( 'int', array( 0, 200 ) ),
		'layoutOptions.gapVerticalTablet'                  => array( 'int', array( 0, 200 ) ),
		'layoutOptions.gapVerticalMobile'                  => array( 'int', array( 0, 200 ) ),
		'layoutOptions.navigation'                         => array( 'bool' ),
		'layoutOptions.pagination'                         => array( 'bool' ),
		'layoutOptions.randomOrder'                        => array( 'bool' ),
		'layoutOptions.contentOrientation'                 => array( 'enum', '@orientations' ),
		'layoutOptions.carouselStyle'                      => array( 'enum', '@carousel_styles' ),
		'layoutOptions.displayStyle'                       => array( 'enum', AllowedValues::DISPLAY_STYLES ),
		'layoutOptions.alignItems'                         => array( 'enum', array( 'flex-start', 'center', 'flex-end', 'stretch' ) ),
		'layoutOptions.sliderLayout'                       => array( 'enum', AllowedValues::SLIDER_LAYOUTS ),
		'layoutOptions.thumbsLayout'                       => array( 'enum', AllowedValues::THUMBS_LAYOUTS ),
		'layoutOptions.tileLayout'                         => array( 'enum', AllowedValues::TILE_LAYOUTS ),
		'layoutOptions.thumbsPerView'                      => array( 'int', array( 1, 12 ) ),
		'layoutOptions.thumbsPerViewTablet'                => array( 'int', array( 1, 12 ) ),
		'layoutOptions.thumbsPerViewMobile'                => array( 'int', array( 1, 12 ) ),

		'sliderOptions.autoplay'                           => array( 'bool' ),
		'sliderOptions.pauseOnHover'                       => array( 'bool' ),
		'sliderOptions.infiniteLoop'                       => array( 'bool' ),
		'sliderOptions.keyboardNav'                        => array( 'bool' ),
		'sliderOptions.mousewheel'                         => array( 'bool' ),
		'sliderOptions.freeScroll'                         => array( 'bool' ),
		'sliderOptions.autoplayDelay'                      => array( 'int', array( 500, 10000 ) ),
		'sliderOptions.speed'                              => array( 'int', array( 100, 5000 ) ),
		'sliderOptions.slidesToScroll'                     => array( 'int', array( 1, 10 ) ),
		'sliderOptions.effect'                             => array( 'enum', AllowedValues::EFFECTS ),
		'sliderOptions.direction'                          => array( 'enum', array( 'ltr', 'rtl' ) ),

		'imageOptions.aspectRatio'                         => array( 'enum', AllowedValues::IMAGE_ASPECT_RATIOS ),
		'imageOptions.resolution'                          => array( 'enum', array( 'full', 'large', 'medium_large', 'medium', 'thumbnail' ) ),
		'imageOptions.overlay'                             => array( 'bool' ),
		'imageOptions.lazyLoad'                            => array( 'bool' ),
		// Image filters are Pro: anything but the default is dropped.
		'imageOptions.filterNormal'                        => array( 'enum', array( 'none' ) ),
		'imageOptions.filterHover'                         => array( 'enum', array( 'none' ) ),
		'imageOptions.opacity.value'                       => array( 'int', array( 0, 100 ) ),
		'imageOptions.opacityHover.value'                  => array( 'int', array( 0, 100 ) ),
		'imageOptions.opacity.unit'                        => array( 'enum', array( '%' ) ),
		'imageOptions.opacityHover.unit'                   => array( 'enum', array( '%' ) ),
		'imageOptions.overlayColor.style'                  => array( 'enum', array( 'solid', 'gradient', 'transparent' ) ),
		'imageOptions.overlayColorHover.style'             => array( 'enum', array( 'solid', 'gradient', 'transparent' ) ),
		'imageOptions.overlayColor.solid'                  => array( 'color' ),
		'imageOptions.overlayColorHover.solid'             => array( 'color' ),

		'contentOptions.showTitle'                         => array( 'bool' ),
		'contentOptions.showDescription'                   => array( 'bool' ),
		'contentOptions.showReadMore'                      => array( 'bool' ),
		'contentOptions.displayOnHover'                    => array( 'bool' ),
		'contentOptions.titleTag'                          => array( 'enum', array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'p' ) ),
		'contentOptions.alignment'                         => array( 'enum', array( 'left', 'center', 'right' ) ),
		'contentOptions.descriptionLength'                 => array( 'enum', array( 'full', 'limited' ) ),
		'contentOptions.descriptionLengthUnit'             => array( 'enum', array( 'word', 'char', 'letter' ) ),
		'contentOptions.descriptionWordLimit'              => array( 'int', array( 1, 200 ) ),
		'contentOptions.titleColor'                        => array( 'content_color' ),
		'contentOptions.descColor'                         => array( 'content_color' ),
		'contentOptions.titleTypography.fontWeight'        => array( 'enum', array( '100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold' ) ),
		'contentOptions.descTypography.fontWeight'         => array( 'enum', array( '100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold' ) ),
		'contentOptions.titleTypography.transform'         => array( 'enum', array( 'uppercase', 'lowercase', 'capitalize' ) ),
		'contentOptions.descTypography.transform'          => array( 'enum', array( 'uppercase', 'lowercase', 'capitalize' ) ),
		'contentOptions.titleTypography.decoration'        => array( 'enum', array( 'underline', 'overline', 'line-through' ) ),
		'contentOptions.descTypography.decoration'         => array( 'enum', array( 'underline', 'overline', 'line-through' ) ),

		'contentAreaOptions.contentAreaBackground.*.style' => array( 'enum', array( 'solid', 'gradient', 'transparent', 'bgColor' ) ),
		'contentAreaOptions.contentAreaBackground.*.solid' => array( 'color' ),
		'contentAreaOptions.contentAreaBackground.*.solidColor' => array( 'color' ),
		'contentAreaOptions.contentAreaStyle.*.border.style' => array( 'enum', array( 'none', 'solid', 'dashed', 'dotted', 'double' ) ),
		'contentAreaOptions.contentAreaStyle.*.border.color' => array( 'color' ),
		'contentAreaOptions.contentAreaStyle.*.borderWidth.unit' => array( 'enum', self::SPACING_UNITS ),
		'contentAreaOptions.contentAreaStyle.*.borderWidth.value.*' => array( 'int', array( 0, 100 ) ),
		'contentAreaOptions.boxShadowNormalEnable'         => array( 'bool' ),
		'contentAreaOptions.boxShadowHoverEnable'          => array( 'bool' ),
		'contentAreaOptions.boxShadowNormal.selectDefault' => array( 'shadow_preset' ),
		'contentAreaOptions.boxShadowHover.selectDefault'  => array( 'shadow_preset' ),
		'contentAreaOptions.boxShadowNormal.color'         => array( 'color' ),
		'contentAreaOptions.boxShadowHover.color'          => array( 'color' ),
		'contentAreaOptions.thumbOverlay'                  => array( 'bool' ),
		'contentAreaOptions.thumbOverlayColor'             => array( 'color' ),
		'contentAreaOptions.thumbOverlayOpacity'           => array( 'int', array( 0, 100 ) ),

		'navigationOptions.arrowStyle'                     => array( 'enum', AllowedValues::ARROW_STYLES ),
		'navigationOptions.position'                       => array( 'enum', AllowedValues::NAV_POSITIONS ),
		'navigationOptions.colorNormal'                    => array( 'color' ),
		'navigationOptions.colorHover'                     => array( 'color' ),
		'navigationOptions.bgNormal'                       => array( 'color' ),
		'navigationOptions.bgHover'                        => array( 'color' ),

		'paginationDotsOptions.paginationStyle'            => array( 'enum', AllowedValues::PAGINATION_STYLES ),
		'paginationDotsOptions.alignment'                  => array( 'enum', array( 'left', 'center', 'right' ) ),
		'paginationDotsOptions.colorNormal'                => array( 'color' ),
		'paginationDotsOptions.colorHover'                 => array( 'color' ),
		'paginationDotsOptions.bgNormal'                   => array( 'color' ),
		'paginationDotsOptions.bgHover'                    => array( 'color' ),

		'paginationOptions.imageItemsPerPage'              => array( 'int', array( 1, 200 ) ),
	);

	/**
	 * Rules keyed by a path suffix pattern, applied when no exact `RULES` entry matches.
	 *
	 * Responsive spacing/typography objects repeat the same handful of leaves
	 * (`device.<Device>.<side>`, `unit.<Device>`, `allChange`) under a couple of
	 * dozen attribute paths; matching on the tail covers all of them without an
	 * entry per path.
	 *
	 * @var array<string, array{0: string, 1?: mixed}>
	 */
	const SUFFIX_RULES = array(
		'/\.device\.(Desktop|Tablet|Mobile)\.(top|right|bottom|left)$/' => array( 'int', array( -500, 500 ) ),
		'/\.device\.(Desktop|Tablet|Mobile)$/' => array( 'number', array( 0, 3000 ) ),
		'/\.unit\.(Desktop|Tablet|Mobile)$/'   => array( 'enum', self::SPACING_UNITS ),
		'/\.allChange$/'                       => array( 'bool' ),
	);

	/**
	 * Drop or coerce every AI-supplied value the target block cannot use.
	 *
	 * @param array  $ai_attributes Raw parsed JSON attributes from the model.
	 * @param string $block_name    Target block slug, with or without the `wp-carousel-pro/` prefix.
	 * @param array  $dropped       Out-param: dotted paths that were rejected.
	 * @return array Attributes safe to merge over the schema defaults.
	 */
	public static function validate( array $ai_attributes, string $block_name, array &$dropped = array() ): array {
		$dropped  = array();
		$slug     = AICatalogBuilder::slug( $block_name );
		$defaults = self::schema_defaults( $slug );
		$context  = array( 'slug' => $slug );

		$clean = array();
		foreach ( $ai_attributes as $key => $value ) {
			if ( ! array_key_exists( $key, $defaults ) || in_array( $key, self::REJECTED_KEYS, true ) ) {
				$dropped[] = (string) $key;
				continue;
			}

			$filtered = self::filter_node( (string) $key, $value, $defaults[ $key ], $context, $dropped, 1 );
			if ( null !== $filtered ) {
				$clean[ $key ] = $filtered;
			}
		}

		return $clean;
	}

	/**
	 * Validate one node, recursing into containers.
	 *
	 * @param string $path           Dotted attribute path.
	 * @param mixed  $value          AI-supplied value.
	 * @param mixed  $schema_default Schema default at this path, or null when unknown.
	 * @param array  $context        Block slug.
	 * @param array  $dropped        Out-param: rejected paths.
	 * @param int    $depth          1 for a top-level attribute group.
	 * @return mixed Cleaned value, or null when the node is rejected.
	 */
	private static function filter_node( string $path, $value, $schema_default, array $context, array &$dropped, int $depth ) {
		// A null is never a value the block can use, and merging it would strip
		// whatever real default sat there.
		if ( null === $value ) {
			$dropped[] = $path;
			return null;
		}

		// A suffix rule is a structural guess about a responsive leaf, so it only
		// speaks for scalars: `…borderRadius.device.Desktop` is a per-side map on
		// one attribute and a plain height on another, and only the first should
		// recurse. An exact rule is a statement about the path itself and still
		// applies to a container — a group where a scalar belongs is a mistake.
		$rule = self::exact_rule( $path );
		if ( null === $rule && ! is_array( $value ) ) {
			$rule = self::suffix_rule( $path );
		}

		if ( null !== $rule ) {
			$applied = self::apply_rule( $rule, $value, $context );
			if ( null === $applied ) {
				$dropped[] = $path;
			}
			return $applied;
		}

		if ( ! is_array( $value ) ) {
			return $value;
		}

		// Only first-level keys under a known group are checked against the schema:
		// deeper structure legitimately carries keys the default never enumerates
		// (per-device spacing entries, the runtime background shape).
		$check_keys = 1 === $depth && is_array( $schema_default ) && ! empty( $schema_default ) && self::is_assoc( $schema_default );

		$filtered = array();
		foreach ( $value as $child_key => $child_value ) {
			$child_path = $path . '.' . $child_key;
			if ( $check_keys && ! array_key_exists( $child_key, $schema_default ) ) {
				$dropped[] = $child_path;
				continue;
			}

			$child_default = is_array( $schema_default ) && array_key_exists( $child_key, $schema_default ) ? $schema_default[ $child_key ] : null;
			$child_clean   = self::filter_node( $child_path, $child_value, $child_default, $context, $dropped, $depth + 1 );
			if ( null !== $child_clean ) {
				$filtered[ $child_key ] = $child_clean;
			}
		}

		return empty( $filtered ) ? null : $filtered;
	}

	/**
	 * Resolve the rule declared for this exact path (`*` segments match any key).
	 *
	 * @param string $path Dotted attribute path.
	 * @return array|null Rule tuple, or null when the path has no declared rule.
	 */
	private static function exact_rule( string $path ) {
		if ( isset( self::RULES[ $path ] ) ) {
			return self::RULES[ $path ];
		}

		foreach ( self::RULES as $pattern => $rule ) {
			if ( false !== strpos( $pattern, '*' ) && self::wildcard_matches( $pattern, $path ) ) {
				return $rule;
			}
		}

		return null;
	}

	/**
	 * Resolve the rule for a responsive leaf by its path tail.
	 *
	 * @param string $path Dotted attribute path.
	 * @return array|null Rule tuple, or null when the tail matches nothing.
	 */
	private static function suffix_rule( string $path ) {
		foreach ( self::SUFFIX_RULES as $pattern => $rule ) {
			if ( 1 === preg_match( $pattern, $path ) ) {
				return $rule;
			}
		}

		return null;
	}

	/**
	 * Match a dotted path against a pattern whose `*` segments match any one key.
	 *
	 * @param string $pattern Rule key, e.g. `contentAreaOptions.contentAreaStyle.*.border.color`.
	 * @param string $path           Dotted attribute path.
	 * @return bool
	 */
	private static function wildcard_matches( string $pattern, string $path ): bool {
		$pattern_segments = explode( '.', $pattern );
		$path_segments    = explode( '.', $path );
		if ( count( $pattern_segments ) !== count( $path_segments ) ) {
			return false;
		}

		foreach ( $pattern_segments as $index => $segment ) {
			if ( '*' !== $segment && $segment !== $path_segments[ $index ] ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Apply one rule to one value.
	 *
	 * @param array $rule    Rule tuple.
	 * @param mixed $value   AI-supplied value.
	 * @param array $context Block slug.
	 * @return mixed Cleaned value, or null when rejected.
	 */
	private static function apply_rule( array $rule, $value, array $context ) {
		$kind = $rule[0];
		$arg  = $rule[1] ?? null;

		switch ( $kind ) {
			case 'bool':
				return self::to_bool( $value );
			case 'int':
				return self::to_clamped_number( $value, $arg[0], $arg[1], true );
			case 'number':
				return self::to_clamped_number( $value, $arg[0], $arg[1], false );
			case 'enum':
				return self::to_enum( $value, is_string( $arg ) ? self::dynamic_enum( $arg, $context ) : $arg );
			case 'color':
				$color = Css_Helpers::sanitize_color( is_string( $value ) ? $value : '' );
				return '' !== $color ? $color : null;
			case 'content_color':
				return self::to_content_color( $value );
			case 'shadow_preset':
				return is_string( $value ) && 1 === preg_match( '/^var\(--wpcp-shadow-[a-z0-9-]+\)$/', trim( $value ) )
					? trim( $value )
					: null;
		}

		return null;
	}

	/**
	 * Resolve a `@name` enum against the block being generated for.
	 *
	 * These lists are per-block (and, for orientations, per-source), so they come
	 * from the same helpers the renderer and inspector read rather than a copy.
	 *
	 * @param string $name    Dynamic enum name.
	 * @param array  $context        Block slug.
	 * @return string[]
	 */
	private static function dynamic_enum( string $name, array $context ): array {
		if ( '@sources' === $name ) {
			return AICatalogBuilder::allowed_sources();
		}

		if ( '@orientations' === $name ) {
			return AICatalogBuilder::content_orientations( $context['slug'] );
		}

		if ( '@carousel_styles' === $name ) {
			// A block without a picker accepts only the style its schema ships.
			$selectable = AICatalogBuilder::selectable_carousel_styles( $context['slug'] );
			if ( ! empty( $selectable ) ) {
				return $selectable;
			}

			$defaults = self::schema_defaults( $context['slug'] );
			$locked   = $defaults['layoutOptions']['carouselStyle'] ?? '';

			return is_string( $locked ) && '' !== $locked ? array( $locked ) : array();
		}

		return array();
	}

	/**
	 * Coerce a boolean, accepting the string/int forms a model tends to emit.
	 *
	 * @param mixed $value Raw value.
	 * @return bool|null
	 */
	private static function to_bool( $value ) {
		if ( is_bool( $value ) ) {
			return $value;
		}
		if ( is_int( $value ) && ( 0 === $value || 1 === $value ) ) {
			return 1 === $value;
		}
		if ( ! is_string( $value ) ) {
			return null;
		}

		$normalized = strtolower( trim( $value ) );
		if ( in_array( $normalized, array( 'true', 'yes', '1' ), true ) ) {
			return true;
		}
		if ( in_array( $normalized, array( 'false', 'no', '0' ), true ) ) {
			return false;
		}

		return null;
	}

	/**
	 * Coerce and clamp a number. An empty string passes through — the schema uses
	 * it for "unset" on responsive values, and clamping it to `min` would invent
	 * a size nobody asked for.
	 *
	 * @param mixed $value  Raw value.
	 * @param float $min    Lower bound.
	 * @param float $max    Upper bound.
	 * @param bool  $is_int Whether to return an int.
	 * @return int|float|string|null
	 */
	private static function to_clamped_number( $value, $min, $max, bool $is_int ) {
		// The schema uses '' for "unset" on responsive values; clamping it up to
		// `min` would invent a size nobody asked for. `null` is not that — it is a
		// model slip, and storing it would strip the real default.
		if ( '' === $value ) {
			return '';
		}
		if ( null === $value ) {
			return null;
		}
		if ( is_bool( $value ) || ! is_numeric( $value ) ) {
			return null;
		}

		$number = min( (float) $max, max( (float) $min, (float) $value ) );
		if ( $is_int ) {
			return (int) round( $number );
		}

		// A whole number stays an int so a font size lands in the saved attributes
		// as `20`, the way the control writes it, rather than `20.0`.
		return floor( $number ) === $number ? (int) $number : $number;
	}

	/**
	 * Match a value against an allow-list, tolerating case and surrounding space.
	 *
	 * @param mixed    $value   Raw value.
	 * @param string[] $allowed Allowed values.
	 * @return string|null Canonical allowed value, or null.
	 */
	private static function to_enum( $value, array $allowed ) {
		if ( is_int( $value ) || is_float( $value ) ) {
			$value = (string) $value;
		}
		if ( ! is_string( $value ) || empty( $allowed ) ) {
			return null;
		}

		$normalized = strtolower( trim( $value ) );
		foreach ( $allowed as $candidate ) {
			if ( strtolower( (string) $candidate ) === $normalized ) {
				return $candidate;
			}
		}

		return null;
	}

	/**
	 * Validate the polymorphic title/description color: a plain color string, or
	 * the `{ color, hoverColor }` object the inspector's color control writes.
	 *
	 * @param mixed $value Raw value.
	 * @return string|array|null
	 */
	private static function to_content_color( $value ) {
		if ( is_string( $value ) ) {
			$color = Css_Helpers::sanitize_color( $value );
			return '' !== $color ? $color : null;
		}
		if ( ! is_array( $value ) ) {
			return null;
		}

		$resolved = array();
		foreach ( array( 'color', 'hoverColor' ) as $key ) {
			if ( ! isset( $value[ $key ] ) || ! is_string( $value[ $key ] ) ) {
				continue;
			}
			$color = Css_Helpers::sanitize_color( $value[ $key ] );
			if ( '' !== $color ) {
				$resolved[ $key ] = $color;
			}
		}

		return empty( $resolved ) ? null : $resolved;
	}

	/**
	 * Raw default value per top-level attribute key for one block.
	 *
	 * @param string $slug Block slug, without the `wp-carousel-pro/` prefix.
	 * @return array<string, mixed>
	 */
	private static function schema_defaults( string $slug ): array {
		$schema_class = AICatalogBuilder::schema_class_for_block( $slug );
		$schema       = new $schema_class();

		$defaults = array();
		foreach ( $schema->get_attributes() as $key => $definition ) {
			if ( is_array( $definition ) && array_key_exists( 'default', $definition ) ) {
				$defaults[ $key ] = $definition['default'];
			}
		}

		return $defaults;
	}

	/**
	 * True when the array is empty or keyed by strings (associative).
	 *
	 * @param array $candidate Array to test.
	 * @return bool
	 */
	private static function is_assoc( array $candidate ): bool {
		if ( empty( $candidate ) ) {
			return true;
		}
		return array_keys( $candidate ) !== range( 0, count( $candidate ) - 1 );
	}
}
