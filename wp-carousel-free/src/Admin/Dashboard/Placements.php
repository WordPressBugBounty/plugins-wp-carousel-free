<?php
/**
 * The Dashboard's "Carousel Placements" table.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\Dashboard;

defined( 'ABSPATH' ) || exit;

/**
 * Every place that shows a WP Carousel block, shortcode or saved template, plus
 * the shortcodes and saved templates placed nowhere yet. Ported from Logo
 * Carousel Pro's BlockUsage by way of Smart Team Free.
 */
class Placements {

	/**
	 * The legacy block that embeds a shortcode by id.
	 */
	const SHORTCODE_BLOCK = 'sp-wp-carousel-pro/shortcode';

	/**
	 * Comment marker shared by every layout block.
	 */
	const BLOCK_PREFIX = 'wp-carousel-pro/';

	/**
	 * Shortcode tags that embed something, what they embed, and the attribute
	 * holding its id. WPBakery's and Divi's elements embed a saved template.
	 *
	 * @var array<string, array{0: string, 1: string}>
	 */
	const SHORTCODE_TAGS = array(
		'sp_wpcarousel'         => array( 'shortcode', 'id' ),
		'sp_wpcp_template'      => array( 'template', 'id' ),
		'vc_wp_carousel_pro'    => array( 'template', 'template_id' ),
		'et_pb_wp_carousel_pro' => array( 'template', 'template_id' ),
	);

	/**
	 * Shortcode post type.
	 */
	const SHORTCODE_POST_TYPE = 'sp_wp_carousel';

	/**
	 * Divi 5's module, stored as a block in post content.
	 */
	const DIVI5_BLOCK = 'wpcp/divi5-carousel';

	/**
	 * Post meta where page builders keep their layouts, and the builder each belongs to.
	 *
	 * @var array<string, string>
	 */
	const BUILDER_META = array(
		'_elementor_data'        => 'elementor',
		'_bricks_page_content_2' => 'bricks',
		'_bricks_page_header_2'  => 'bricks',
		'_bricks_page_footer_2'  => 'bricks',
		'_ct_builder_json'       => 'oxygen',
		'_ct_builder_shortcodes' => 'oxygen',
		'_fl_builder_data'       => 'beaver',
	);

	/**
	 * Meta that says whether a builder's layout, not the post content, is what the post shows.
	 *
	 * @var array<string, array{0: string, 1: string}> Builder → meta key, value that means "on".
	 */
	const BUILDER_MODE_META = array(
		'elementor' => array( '_elementor_edit_mode', 'builder' ),
		'bricks'    => array( '_bricks_editor_mode', 'bricks' ),
		'beaver'    => array( '_fl_builder_enabled', '1' ),
	);

	/**
	 * Builder elements that embed something, what they embed, and the setting holding its id.
	 *
	 * @var array<string, array{0: string, 1: string}>
	 */
	const BUILDER_ELEMENTS = array(
		'wp_carousel_pro_saved_template' => array( 'template', 'wpcp_saved_template' ),
		'sp_wp_carousel_shortcode'       => array( 'shortcode', 'sp_wp_carousel_pro_shortcode' ),
		'wpcp-bricks-carousel'           => array( 'template', 'template_id' ),
		'oxy-sp-wp-carousel-pro'         => array( 'template', 'oxy-sp-wp-carousel-pro_template_id' ),
		'wp-carousel-beaver-module'      => array( 'template', 'template_id' ),
	);

	/**
	 * A shortcode's layout and source meta, read only, to label its row.
	 */
	const SHORTCODE_LAYOUT_META = 'sp_wpcp_shortcode_options'; // isolation-ignore — read-only label for the Classic shortcode row.
	const SHORTCODE_SOURCE_META = 'sp_wpcp_upload_options'; // isolation-ignore — read-only label for the Classic shortcode row.

	/**
	 * Option holding when widgets were last saved; widget options carry no date.
	 */
	const WIDGETS_MODIFIED_OPTION = 'wpcp_placements_widgets_modified';

	/**
	 * Widget options whose save counts as "widgets updated".
	 *
	 * @var string[]
	 */
	const WIDGET_OPTIONS = array( 'widget_block', 'widget_text', 'sidebars_widgets' );

	/**
	 * Most posts one scan reads; the report says when it was capped.
	 */
	const MAX_POSTS = 500;

	/**
	 * Option holding the last scan. Not a transient: nothing may expire it before a Sync.
	 */
	const CACHE_OPTION = 'wpcp_placements_report';

	/**
	 * Shape version of the stored report; an older shape is scanned again.
	 */
	const CACHE_VERSION = 1;

	/**
	 * Statuses a placement is listed under.
	 *
	 * @var string[]
	 */
	const STATUSES = array( 'publish', 'future', 'draft', 'pending', 'private' );

	/**
	 * Post types that are never a placement: WordPress internals and the plugin's own content.
	 *
	 * @var string[]
	 */
	const EXCLUDED_TYPES = array(
		'revision',
		'nav_menu_item',
		'customize_changeset',
		'oembed_cache',
		'user_request',
		'wp_global_styles',
		'wp_font_family',
		'wp_font_face',
		'attachment',
		self::SHORTCODE_POST_TYPE,
		Saved_Templates::POST_TYPE,
	);

	/**
	 * Display names of the layout blocks.
	 *
	 * @return array<string, string> Block name → title.
	 */
	public static function layout_block_titles() {
		return array(
			'wp-carousel-pro/carousel'          => __( 'Carousel', 'wp-carousel-free' ),
			'wp-carousel-pro/slider'            => __( 'Slider', 'wp-carousel-free' ),
			'wp-carousel-pro/thumbnails-slider' => __( 'Thumbnails Slider', 'wp-carousel-free' ),
			'wp-carousel-pro/tiles'             => __( 'Tiles', 'wp-carousel-free' ),
			'wp-carousel-pro/marquee'           => __( 'Marquee', 'wp-carousel-free' ),
			'wp-carousel-pro/carousel-panorama' => __( 'Panorama Carousel', 'wp-carousel-free' ),
		);
	}

	/**
	 * Count layout blocks in parsed blocks, nested ones included.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array<string, int> Block name → count.
	 */
	public static function count_blocks( array $blocks ) {
		$layouts = self::layout_block_titles();
		$counts  = array();

		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}

			$name = isset( $block['blockName'] ) ? (string) $block['blockName'] : '';
			if ( isset( $layouts[ $name ] ) ) {
				$counts[ $name ] = ( isset( $counts[ $name ] ) ? $counts[ $name ] : 0 ) + 1;
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				foreach ( self::count_blocks( $block['innerBlocks'] ) as $inner => $count ) {
					$counts[ $inner ] = ( isset( $counts[ $inner ] ) ? $counts[ $inner ] : 0 ) + $count;
				}
			}
		}

		return $counts;
	}

	/**
	 * Shortcode ids embedded through the legacy shortcode block.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return int[] Shortcode ids, in page order, repeats kept.
	 */
	public static function find_block_shortcode_ids( array $blocks ) {
		$ids = array();

		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}

			$name = isset( $block['blockName'] ) ? (string) $block['blockName'] : '';
			if ( self::SHORTCODE_BLOCK === $name && ! empty( $block['attrs']['shortcode'] ) ) {
				$id = absint( $block['attrs']['shortcode'] );
				if ( $id ) {
					$ids[] = $id;
				}
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				$ids = array_merge( $ids, self::find_block_shortcode_ids( $block['innerBlocks'] ) );
			}
		}

		return $ids;
	}

	/**
	 * Saved template ids embedded through Divi 5's module.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return int[] Template ids, in page order, repeats kept.
	 */
	public static function find_block_template_ids( array $blocks ) {
		$ids = array();

		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}

			$name = isset( $block['blockName'] ) ? (string) $block['blockName'] : '';
			if ( self::DIVI5_BLOCK === $name && isset( $block['attrs']['templateId']['innerContent']['desktop']['value'] ) ) {
				$id = absint( $block['attrs']['templateId']['innerContent']['desktop']['value'] );
				if ( $id ) {
					$ids[] = $id;
				}
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				$ids = array_merge( $ids, self::find_block_template_ids( $block['innerBlocks'] ) );
			}
		}

		return $ids;
	}

	/**
	 * Shortcodes and saved templates a post's page-builder layouts embed: the
	 * plugin's own builder elements, and any shortcode typed into a text or
	 * shortcode element. A builder switched off for the post is skipped.
	 *
	 * @param array<string, string> $meta Meta key → raw stored value, for the
	 *                                    BUILDER_META and BUILDER_MODE_META keys.
	 * @return array{shortcode: array<string, int[]>, template: array<string, int[]>} Ids per builder.
	 */
	public static function find_builder_ids( array $meta ) {
		$found = array(
			'shortcode' => array(),
			'template'  => array(),
		);

		foreach ( self::BUILDER_META as $key => $builder ) {
			if ( empty( $meta[ $key ] ) ) {
				continue;
			}

			if ( isset( self::BUILDER_MODE_META[ $builder ] ) ) {
				list( $mode_key, $on ) = self::BUILDER_MODE_META[ $builder ];
				if ( ! isset( $meta[ $mode_key ] ) || $on !== (string) $meta[ $mode_key ] ) {
					continue;
				}
			}

			// Oxygen keeps the same tree twice; the JSON copy is the one to read.
			if ( '_ct_builder_shortcodes' === $key && ! empty( $meta['_ct_builder_json'] ) ) {
				continue;
			}

			$raw  = (string) $meta[ $key ];
			$tree = '_elementor_data' === $key || '_ct_builder_json' === $key ? json_decode( $raw, true ) : maybe_unserialize( $raw );
			$ids  = array(
				'shortcodes' => array(),
				'templates'  => array(),
			);
			$text = '';

			if ( is_array( $tree ) || is_object( $tree ) ) {
				self::walk_builder_tree( $tree, $ids, $text );
			} elseif ( '_ct_builder_shortcodes' === $key && preg_match_all( '/"oxy-sp-wp-carousel-pro_template_id"\s*:\s*"?(\d+)/', $raw, $matches ) ) {
				// Oxygen's older copy: elements as shortcodes, settings as JSON inside them.
				$ids['templates'] = array_map( 'absint', $matches[1] );
			}

			$typed = self::find_shortcode_ids( $text );
			foreach ( array(
				'shortcode' => array_merge( $ids['shortcodes'], $typed['shortcode'] ),
				'template'  => array_merge( $ids['templates'], $typed['template'] ),
			) as $source => $list ) {
				$list = array_filter( $list );
				if ( ! empty( $list ) ) {
					$known                        = isset( $found[ $source ][ $builder ] ) ? $found[ $source ][ $builder ] : array();
					$found[ $source ][ $builder ] = array_values( array_unique( array_merge( $known, $list ) ) );
				}
			}
		}

		return $found;
	}

	/**
	 * Walk a builder's element tree, collecting the plugin's elements and any text
	 * that may hold a shortcode. Elementor, Bricks, Oxygen and Beaver all nest
	 * elements as arrays (Beaver as objects), so one walk reads them all.
	 *
	 * @param array|object $node  Element, list of elements or settings.
	 * @param array        $found Collected ids, by reference.
	 * @param string       $text  Collected text, by reference.
	 * @return void
	 */
	private static function walk_builder_tree( $node, array &$found, &$text ) {
		$node = is_object( $node ) ? get_object_vars( $node ) : $node;
		if ( ! is_array( $node ) ) {
			return;
		}

		$settings = isset( $node['settings'] ) ? $node['settings'] : ( isset( $node['options']['original'] ) ? $node['options']['original'] : array() );
		$settings = is_object( $settings ) ? get_object_vars( $settings ) : (array) $settings;
		$name     = '';
		if ( isset( $node['widgetType'] ) ) {
			$name = (string) $node['widgetType'];
		} elseif ( isset( $node['type'], $settings['type'] ) && 'module' === $node['type'] ) {
			$name = (string) $settings['type'];
		} elseif ( isset( $node['name'] ) && is_string( $node['name'] ) ) {
			$name = $node['name'];
		}

		if ( isset( self::BUILDER_ELEMENTS[ $name ] ) ) {
			list( $source, $setting ) = self::BUILDER_ELEMENTS[ $name ];
			if ( isset( $settings[ $setting ] ) && is_scalar( $settings[ $setting ] ) ) {
				$found[ 'shortcode' === $source ? 'shortcodes' : 'templates' ][] = absint( $settings[ $setting ] );
			}
		}

		foreach ( $node as $value ) {
			if ( is_string( $value ) ) {
				if ( false !== strpos( $value, '[' ) ) {
					$text .= "\n" . $value;
				}
			} elseif ( is_array( $value ) || is_object( $value ) ) {
				self::walk_builder_tree( $value, $found, $text );
			}
		}
	}

	/**
	 * Shortcode and saved template ids a piece of content embeds. As in core,
	 * tags are case-sensitive and only `[[…]]` escapes a shortcode.
	 *
	 * @param string $content Raw content.
	 * @return array{shortcode: int[], template: int[]} Unique ids per source.
	 */
	public static function find_shortcode_ids( $content ) {
		$found = array(
			'shortcode' => array(),
			'template'  => array(),
		);

		$content = (string) $content;
		if ( false === strpos( $content, '[' ) ) {
			return $found;
		}

		$tags = implode( '|', array_map( 'preg_quote', array_keys( self::SHORTCODE_TAGS ) ) );

		if ( ! preg_match_all( '/(\[?)\[(' . $tags . ')(?=[\s\]\/])([^\]]*)\](\]?)/', $content, $matches, PREG_SET_ORDER ) ) {
			return $found;
		}

		foreach ( $matches as $match ) {
			if ( '[' === $match[1] && ']' === $match[4] ) {
				continue;
			}

			list( $source, $attribute ) = self::SHORTCODE_TAGS[ $match[2] ];

			if ( preg_match( '/(?:^|\s)' . $attribute . '\s*=\s*(["\']?)(\d+)\1/', $match[3], $id_match ) ) {
				$id = absint( $id_match[2] );
				if ( $id && ! in_array( $id, $found[ $source ], true ) ) {
					$found[ $source ][] = $id;
				}
			}
		}

		return $found;
	}

	/**
	 * Display name of a shortcode's layout and source, e.g. "Carousel · Image".
	 * Read-only: a Pro value is named as Pro's shortcode editor names it.
	 *
	 * @param mixed $shortcode_options The shortcode's layout meta.
	 * @param mixed $upload_options    The shortcode's source meta.
	 * @return string Label.
	 */
	public static function shortcode_layout_label( $shortcode_options, $upload_options ) {
		$shortcode_options = is_array( $shortcode_options ) ? $shortcode_options : array();
		$upload_options    = is_array( $upload_options ) ? $upload_options : array();
		$layout            = ! empty( $shortcode_options['wpcp_layout'] ) ? (string) $shortcode_options['wpcp_layout'] : 'carousel';
		$source            = ! empty( $upload_options['wpcp_carousel_type'] ) ? (string) $upload_options['wpcp_carousel_type'] : 'image-carousel';

		// The names the shortcode editor's Layout Preset and Source Type fields show.
		$layouts = array(
			'carousel'          => __( 'Carousel', 'wp-carousel-free' ),
			'slider'            => __( 'Slider', 'wp-carousel-free' ),
			'grid'              => __( 'Grid', 'wp-carousel-free' ),
			'thumbnails-slider' => __( 'Thumbs Slider', 'wp-carousel-free' ),
			'tiles'             => __( 'Tiles', 'wp-carousel-free' ),
			'masonry'           => __( 'Masonry', 'wp-carousel-free' ),
			'justified'         => __( 'Justified', 'wp-carousel-free' ),
		);
		$sources = array(
			'image-carousel'    => __( 'Image', 'wp-carousel-free' ),
			'post-carousel'     => __( 'Post', 'wp-carousel-free' ),
			'product-carousel'  => __( 'Product', 'wp-carousel-free' ),
			'video-carousel'    => __( 'Video', 'wp-carousel-free' ),
			'audio-carousel'    => __( 'Audio', 'wp-carousel-free' ),
			'content-carousel'  => __( 'Content', 'wp-carousel-free' ),
			'mix-content'       => __( 'Mix-Content', 'wp-carousel-free' ),
			'external-carousel' => __( 'External', 'wp-carousel-free' ),
		);

		return sprintf(
			/* translators: 1: layout name, e.g. "Carousel", 2: source type, e.g. "Image" */
			__( '%1$s · %2$s', 'wp-carousel-free' ),
			isset( $layouts[ $layout ] ) ? $layouts[ $layout ] : self::humanize( $layout ),
			isset( $sources[ $source ] ) ? $sources[ $source ] : self::humanize( str_replace( '-carousel', '', $source ) )
		);
	}

	/**
	 * Display names of counted blocks, most used first.
	 *
	 * @param array<string, int> $blocks Block name → count.
	 * @return string[] Names.
	 */
	public static function block_layouts( array $blocks ) {
		arsort( $blocks );

		$labels  = self::layout_block_titles();
		$layouts = array();
		foreach ( array_keys( $blocks ) as $name ) {
			$layouts[] = isset( $labels[ $name ] ) ? $labels[ $name ] : self::humanize( str_replace( self::BLOCK_PREFIX, '', (string) $name ) );
		}

		return $layouts;
	}

	/**
	 * Turn scanned locations and sources into table rows: one row per kind of
	 * placement a location holds, one per source placed nowhere, newest first.
	 *
	 * @param array $locations  Locations: key, title, type, status, statusLabel,
	 *                          editUrl, viewUrl, modified, blocks (name → count),
	 *                          shortcodes (ids), templates (ids), builders
	 *                          (source → builder → ids, see find_builder_ids()).
	 * @param array $shortcodes Shortcode id → title, layouts, editUrl, modified.
	 * @param array $templates  Template id → title, layouts, shortcodes (ids), editUrl, modified.
	 * @return array<int, array<string, mixed>> Rows.
	 */
	public static function build_rows( array $locations, array $shortcodes, array $templates ) {
		$rows    = array();
		$sources = array(
			'shortcode' => $shortcodes,
			'template'  => $templates,
		);
		$placed  = array(
			'shortcode' => array(),
			'template'  => array(),
		);

		foreach ( $locations as $location ) {
			$place    = array(
				'title'       => isset( $location['title'] ) ? (string) $location['title'] : '',
				'type'        => isset( $location['type'] ) ? (string) $location['type'] : '',
				'status'      => isset( $location['status'] ) ? (string) $location['status'] : 'publish',
				'statusLabel' => isset( $location['statusLabel'] ) ? (string) $location['statusLabel'] : '',
				'editUrl'     => isset( $location['editUrl'] ) ? (string) $location['editUrl'] : '',
				'viewUrl'     => isset( $location['viewUrl'] ) ? (string) $location['viewUrl'] : '',
			);
			$key      = isset( $location['key'] ) ? (string) $location['key'] : '';
			$modified = isset( $location['modified'] ) ? (int) $location['modified'] : 0;

			// A shortcode inside a placed template shows wherever the template does.
			$location['shortcodes'] = isset( $location['shortcodes'] ) && is_array( $location['shortcodes'] ) ? $location['shortcodes'] : array();
			foreach ( isset( $location['templates'] ) && is_array( $location['templates'] ) ? $location['templates'] : array() as $template_id ) {
				if ( ! empty( $templates[ (int) $template_id ]['shortcodes'] ) ) {
					$location['shortcodes'] = array_merge( $location['shortcodes'], (array) $templates[ (int) $template_id ]['shortcodes'] );
				}
			}

			$blocks = isset( $location['blocks'] ) && is_array( $location['blocks'] ) ? $location['blocks'] : array();
			if ( ! empty( $blocks ) ) {
				$rows[] = array(
					'key'      => $key . ':block',
					'source'   => 'block',
					'location' => $place,
					'layouts'  => self::block_layouts( $blocks ),
					'names'    => array(),
					'modified' => $modified,
					'editUrl'  => $place['editUrl'],
				);
			}

			foreach ( array(
				'shortcode' => 'shortcodes',
				'template'  => 'templates',
			) as $source => $field ) {
				$ids         = isset( $location[ $field ] ) && is_array( $location[ $field ] ) ? $location[ $field ] : array();
				$layouts     = array();
				$names       = array();
				$placed_here = array();

				foreach ( array_unique( array_map( 'intval', $ids ) ) as $id ) {
					if ( ! isset( $sources[ $source ][ $id ] ) ) {
						continue;
					}

					$item                     = $sources[ $source ][ $id ];
					$placed[ $source ][ $id ] = true;
					$placed_here[ $id ]       = true;
					$names[]                  = isset( $item['title'] ) ? (string) $item['title'] : '';
					$layouts                  = array_merge( $layouts, isset( $item['layouts'] ) ? (array) $item['layouts'] : array() );
				}

				if ( empty( $names ) ) {
					continue;
				}

				// Name the page builders that placed one of these, e.g. "Page · Elementor".
				$row_place = $place;
				$via       = isset( $location['builders'][ $source ] ) && is_array( $location['builders'][ $source ] ) ? $location['builders'][ $source ] : array();
				foreach ( $via as $builder => $builder_ids ) {
					if ( array_intersect( array_map( 'intval', (array) $builder_ids ), array_keys( $placed_here ) ) ) {
						$row_place['type'] = self::location_type( $row_place['type'], (string) $builder );
					}
				}

				$rows[] = array(
					'key'      => $key . ':' . $source,
					'source'   => $source,
					'location' => $row_place,
					'layouts'  => array_values( array_unique( $layouts ) ),
					'names'    => $names,
					'modified' => $modified,
					'editUrl'  => $place['editUrl'],
				);
			}
		}

		foreach ( $sources as $source => $items ) {
			foreach ( $items as $id => $item ) {
				if ( isset( $placed[ $source ][ $id ] ) ) {
					continue;
				}

				$rows[] = array(
					'key'      => $source . '-' . $id . ':unused',
					'source'   => $source,
					'location' => null,
					'layouts'  => array_values( array_unique( isset( $item['layouts'] ) ? (array) $item['layouts'] : array() ) ),
					'names'    => array( isset( $item['title'] ) ? (string) $item['title'] : '' ),
					'modified' => isset( $item['modified'] ) ? (int) $item['modified'] : 0,
					'editUrl'  => isset( $item['editUrl'] ) ? (string) $item['editUrl'] : '',
				);
			}
		}

		// Stable newest-first: equal dates keep scan order.
		$order = array_keys( $rows );
		array_multisort( array_column( $rows, 'modified' ), SORT_DESC, $order, SORT_ASC, $rows );

		return $rows;
	}

	/**
	 * Stamp widget saves from any screen; the block widget editor saves over REST.
	 *
	 * @return void
	 */
	public static function register_hooks() {
		foreach ( self::WIDGET_OPTIONS as $option ) {
			add_action( 'add_option_' . $option, array( __CLASS__, 'touch_widgets' ) );
			add_action( 'update_option_' . $option, array( __CLASS__, 'touch_widgets' ) );
		}
	}

	/**
	 * Record that widgets were updated now.
	 *
	 * @return void
	 */
	public static function touch_widgets() {
		update_option( self::WIDGETS_MODIFIED_OPTION, time(), false );
	}

	/**
	 * The placements report: the stored one, or a fresh scan on the first visit or when forced.
	 *
	 * @param bool $force Scan the site again and replace the stored report.
	 * @return array<string, mixed> Report: rows, capped, scannedAt.
	 */
	public static function report( $force = false ) {
		$cached = get_option( self::CACHE_OPTION );

		if ( ! $force && self::is_current_cache( $cached ) ) {
			return $cached['report'];
		}

		$report = self::scan();
		update_option(
			self::CACHE_OPTION,
			array(
				'version' => self::CACHE_VERSION,
				'report'  => $report,
			),
			false
		);

		return $report;
	}

	/**
	 * Whether a stored value is a report this version can serve.
	 *
	 * @param mixed $cached What the cache option holds.
	 * @return bool
	 */
	public static function is_current_cache( $cached ) {
		return is_array( $cached )
			&& isset( $cached['version'], $cached['report'] )
			&& self::CACHE_VERSION === $cached['version']
			&& is_array( $cached['report'] )
			&& isset( $cached['report']['rows'] )
			&& is_array( $cached['report']['rows'] );
	}

	/**
	 * Whether the stored report lists at least one placement, without scanning.
	 *
	 * @return bool|null Null when no report has been stored yet.
	 */
	public static function stored_has_placements() {
		return self::cache_has_rows( get_option( self::CACHE_OPTION ) );
	}

	/**
	 * Whether a stored value is a current report with at least one row.
	 *
	 * @param mixed $cached What the cache option holds.
	 * @return bool|null Null when the value is not a report this version can serve.
	 */
	public static function cache_has_rows( $cached ) {
		if ( ! self::is_current_cache( $cached ) ) {
			return null;
		}

		return count( $cached['report']['rows'] ) > 0;
	}

	/**
	 * Read every place that shows a carousel, and what it shows.
	 *
	 * @return array<string, mixed>
	 */
	private static function scan() {
		global $wpdb;

		$types = array_values( array_diff( get_post_types( array(), 'names' ), self::EXCLUDED_TYPES ) );

		if ( empty( $types ) ) {
			return self::empty_report();
		}

		// The LIKE only narrows the read; parse_blocks() and the shortcode matcher decide.
		$markers = array( '<!-- wp:' . self::BLOCK_PREFIX, '<!-- wp:' . self::SHORTCODE_BLOCK, '<!-- wp:' . self::DIVI5_BLOCK );
		foreach ( array_keys( self::SHORTCODE_TAGS ) as $tag ) {
			$markers[] = '[' . $tag;
		}

		$likes = array();
		foreach ( $markers as $marker ) {
			$likes[] = '%' . $wpdb->esc_like( $marker ) . '%';
		}

		$type_placeholders   = implode( ', ', array_fill( 0, count( $types ), '%s' ) );
		$status_placeholders = implode( ', ', array_fill( 0, count( self::STATUSES ), '%s' ) );
		$like_clauses        = implode( ' OR ', array_fill( 0, count( $likes ), 'post_content LIKE %s' ) );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- one bounded read, cached in an option; placeholders are built from counted arrays.
		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} WHERE post_type IN ( {$type_placeholders} ) AND post_status IN ( {$status_placeholders} ) AND ( {$like_clauses} ) ORDER BY post_modified_gmt DESC LIMIT %d",
				array_merge( $types, self::STATUSES, $likes, array( self::MAX_POSTS + 1 ) )
			)
		);

		// Page builders keep their layouts in post meta, not post content.
		$builder_markers = array_keys( self::BUILDER_ELEMENTS );
		foreach ( array_keys( self::SHORTCODE_TAGS ) as $tag ) {
			$builder_markers[] = '[' . $tag;
		}
		$builder_likes = array();
		foreach ( $builder_markers as $marker ) {
			$builder_likes[] = '%' . $wpdb->esc_like( $marker ) . '%';
		}
		$meta_keys         = array_keys( self::BUILDER_META );
		$key_placeholders  = implode( ', ', array_fill( 0, count( $meta_keys ), '%s' ) );
		$meta_like_clauses = implode( ' OR ', array_fill( 0, count( $builder_likes ), 'pm.meta_value LIKE %s' ) );

		$builder_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT DISTINCT p.ID, p.post_modified_gmt FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE pm.meta_key IN ( {$key_placeholders} ) AND p.post_type IN ( {$type_placeholders} ) AND p.post_status IN ( {$status_placeholders} ) AND ( {$meta_like_clauses} ) ORDER BY p.post_modified_gmt DESC LIMIT %d",
				array_merge( $meta_keys, $types, self::STATUSES, $builder_likes, array( self::MAX_POSTS + 1 ) )
			)
		);
		// phpcs:enable

		$capped      = count( $ids ) > self::MAX_POSTS || count( $builder_ids ) > self::MAX_POSTS;
		$builder_ids = array_map( 'absint', (array) $builder_ids );
		$ids         = array_values( array_unique( array_merge( array_map( 'absint', (array) $ids ), $builder_ids ) ) );
		$locations   = array();

		// One batched read for every post and its terms (for permalinks).
		_prime_post_caches( $ids, true, false );

		// Both lists are newest first; merged, they are re-sorted before the cap.
		$posts = array_filter( array_map( 'get_post', $ids ) );
		usort(
			$posts,
			static function ( $first, $second ) {
				return strcmp( $second->post_modified_gmt, $first->post_modified_gmt );
			}
		);
		$posts        = array_slice( $posts, 0, self::MAX_POSTS );
		$builder_meta = self::builder_meta( array_intersect( $builder_ids, wp_list_pluck( $posts, 'ID' ) ) );

		foreach ( $posts as $post ) {
			$location = self::post_location( $post, isset( $builder_meta[ $post->ID ] ) ? $builder_meta[ $post->ID ] : array() );
			if ( $location ) {
				$locations[] = $location;
			}
		}

		$widgets = self::widget_location();
		if ( $widgets ) {
			$locations[] = $widgets;
		}

		$shortcodes = self::sources( self::SHORTCODE_POST_TYPE );
		$templates  = self::sources( Saved_Templates::POST_TYPE );
		$capped     = $capped || count( $shortcodes ) >= self::MAX_POSTS || count( $templates ) >= self::MAX_POSTS;

		return array(
			'rows'      => self::build_rows( $locations, $shortcodes, $templates ),
			'capped'    => $capped,
			'scannedAt' => time(),
		);
	}

	/**
	 * The builder meta of the given posts, in one read.
	 *
	 * @param int[] $ids Post ids.
	 * @return array<int, array<string, string>> Post id → meta key → raw value.
	 */
	private static function builder_meta( array $ids ) {
		global $wpdb;

		$ids = array_values( array_filter( array_map( 'absint', $ids ) ) );
		if ( empty( $ids ) ) {
			return array();
		}

		$keys = array_keys( self::BUILDER_META );
		foreach ( self::BUILDER_MODE_META as $mode ) {
			$keys[] = $mode[0];
		}

		$id_placeholders  = implode( ', ', array_fill( 0, count( $ids ), '%d' ) );
		$key_placeholders = implode( ', ', array_fill( 0, count( $keys ), '%s' ) );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- bounded by the scan's own post list; placeholders are built from counted arrays.
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT post_id, meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id IN ( {$id_placeholders} ) AND meta_key IN ( {$key_placeholders} )",
				array_merge( $ids, $keys )
			)
		);
		// phpcs:enable

		$meta = array();
		foreach ( (array) $rows as $row ) {
			$meta[ (int) $row->post_id ][ (string) $row->meta_key ] = (string) $row->meta_value;
		}

		return $meta;
	}

	/**
	 * What one post shows, or null when it shows nothing.
	 *
	 * @param \WP_Post              $post Post.
	 * @param array<string, string> $meta The post's builder meta (see builder_meta()).
	 * @return array<string, mixed>|null
	 */
	private static function post_location( \WP_Post $post, array $meta = array() ) {
		$found    = self::analyze_content( $post->post_content );
		$builders = self::find_builder_ids( $meta );

		if ( ! empty( $builders['shortcode'] ) || ! empty( $builders['template'] ) ) {
			$found = $found ? $found : array(
				'blocks'     => array(),
				'shortcodes' => array(),
				'templates'  => array(),
			);
			foreach ( array(
				'shortcode' => 'shortcodes',
				'template'  => 'templates',
			) as $source => $field ) {
				foreach ( $builders[ $source ] as $ids ) {
					$found[ $field ] = array_values( array_unique( array_merge( $found[ $field ], $ids ) ) );
				}
			}
		}

		if ( ! $found ) {
			return null;
		}

		$type_object = get_post_type_object( $post->post_type );
		$is_public   = $type_object && ( $type_object->public || $type_object->publicly_queryable );
		$status      = get_post_status_object( $post->post_status );
		$view_url    = '';

		if ( $is_public ) {
			$view_url = in_array( $post->post_status, array( 'publish', 'private' ), true )
				? (string) get_permalink( $post )
				: (string) get_preview_post_link( $post );
		}

		return array(
			'key'         => 'post-' . $post->ID,
			'title'       => self::title( $post ),
			'type'        => $type_object ? $type_object->labels->singular_name : $post->post_type,
			'status'      => $post->post_status,
			'statusLabel' => 'publish' === $post->post_status ? '' : ( $status ? $status->label : $post->post_status ),
			'editUrl'     => self::edit_url( $post ),
			'viewUrl'     => esc_url_raw( $view_url ),
			'modified'    => self::modified_time( $post ),
			'builders'    => $builders,
		) + $found;
	}

	/**
	 * The active widget areas as one location, or null when no active Block or
	 * Text widget shows anything. "Inactive widgets" are not on the site.
	 *
	 * @return array<string, mixed>|null
	 */
	private static function widget_location() {
		$sidebars = get_option( 'sidebars_widgets' );
		if ( ! is_array( $sidebars ) ) {
			return null;
		}

		$active = array();
		foreach ( $sidebars as $sidebar => $widget_ids ) {
			if ( 'wp_inactive_widgets' === $sidebar || ! is_array( $widget_ids ) ) {
				continue;
			}
			foreach ( $widget_ids as $widget_id ) {
				$active[ (string) $widget_id ] = true;
			}
		}

		$content = '';
		foreach ( array(
			'block' => 'content',
			'text'  => 'text',
		) as $base => $field ) {
			$instances = get_option( 'widget_' . $base );
			if ( ! is_array( $instances ) ) {
				continue;
			}
			foreach ( $instances as $number => $instance ) {
				if ( isset( $active[ $base . '-' . $number ] ) && is_array( $instance ) && ! empty( $instance[ $field ] ) ) {
					$content .= "\n" . (string) $instance[ $field ];
				}
			}
		}

		if ( '' === $content ) {
			return null;
		}

		$found = self::analyze_content( $content );
		if ( ! $found ) {
			return null;
		}

		return array(
			'key'         => 'widgets',
			'title'       => __( 'Widgets', 'wp-carousel-free' ),
			'type'        => __( 'Widget', 'wp-carousel-free' ),
			'status'      => 'publish',
			'statusLabel' => '',
			'editUrl'     => current_user_can( 'edit_theme_options' ) ? esc_url_raw( admin_url( 'widgets.php' ) ) : '',
			'viewUrl'     => esc_url_raw( home_url( '/' ) ),
			// 0 (shown as a dash) until widgets are next saved.
			'modified'    => absint( get_option( self::WIDGETS_MODIFIED_OPTION, 0 ) ),
		) + $found;
	}

	/**
	 * Shortcodes or saved templates, keyed by id.
	 *
	 * @param string $post_type Source post type.
	 * @return array<int, array<string, mixed>>
	 */
	private static function sources( $post_type ) {
		$is_shortcode = self::SHORTCODE_POST_TYPE === $post_type;
		$posts        = get_posts(
			array(
				'post_type'              => $post_type,
				'post_status'            => self::STATUSES,
				'numberposts'            => self::MAX_POSTS,
				'orderby'                => 'modified',
				'order'                  => 'DESC',
				'suppress_filters'       => true,
				'update_post_term_cache' => false,
				// Only shortcodes read meta (their layout and source).
				'update_post_meta_cache' => $is_shortcode,
			)
		);

		$sources = array();

		foreach ( $posts as $post ) {
			if ( $is_shortcode ) {
				$layouts = array(
					self::shortcode_layout_label(
						get_post_meta( $post->ID, self::SHORTCODE_LAYOUT_META, true ),
						get_post_meta( $post->ID, self::SHORTCODE_SOURCE_META, true )
					),
				);
				$inner   = array();
			} else {
				$found   = self::analyze_content( $post->post_content );
				$layouts = $found ? self::block_layouts( $found['blocks'] ) : array();
				$inner   = $found ? $found['shortcodes'] : array();
			}

			$sources[ (int) $post->ID ] = array(
				'title'      => self::title( $post ),
				'layouts'    => $layouts,
				'shortcodes' => $inner,
				'editUrl'    => self::edit_url( $post ),
				'modified'   => self::modified_time( $post ),
			);
		}

		return $sources;
	}

	/**
	 * Layout blocks, shortcode ids and template ids in a piece of content, or
	 * null when it shows no carousel.
	 *
	 * @param string $content Raw content.
	 * @return array{blocks: array<string, int>, shortcodes: int[], templates: int[]}|null
	 */
	private static function analyze_content( $content ) {
		$parsed = parse_blocks( (string) $content );
		$found  = self::find_shortcode_ids( $content );
		$result = array(
			'blocks'     => self::count_blocks( $parsed ),
			'shortcodes' => array_values( array_unique( array_merge( self::find_block_shortcode_ids( $parsed ), $found['shortcode'] ) ) ),
			'templates'  => array_values( array_unique( array_merge( $found['template'], self::find_block_template_ids( $parsed ) ) ) ),
		);

		return empty( $result['blocks'] ) && empty( $result['shortcodes'] ) && empty( $result['templates'] ) ? null : $result;
	}

	/**
	 * A location's type line with the page builder that placed the row, e.g. "Page · Elementor".
	 *
	 * @param string $type    Post type name, e.g. "Page".
	 * @param string $builder Builder key from BUILDER_META.
	 * @return string
	 */
	public static function location_type( $type, $builder ) {
		$names = array(
			'elementor' => 'Elementor',
			'bricks'    => 'Bricks',
			'oxygen'    => 'Oxygen',
			'beaver'    => 'Beaver Builder',
		);

		return sprintf(
			/* translators: 1: post type, e.g. "Page", 2: page builder, e.g. "Elementor" */
			__( '%1$s · %2$s', 'wp-carousel-free' ),
			$type,
			isset( $names[ $builder ] ) ? $names[ $builder ] : $builder
		);
	}

	/**
	 * Where the current user edits a post, or '' when they may not.
	 *
	 * @param \WP_Post $post Post.
	 * @return string
	 */
	private static function edit_url( \WP_Post $post ) {
		return current_user_can( 'edit_post', $post->ID ) ? esc_url_raw( (string) get_edit_post_link( $post->ID, 'raw' ) ) : '';
	}

	/**
	 * When a post was last modified. A never-saved draft has no GMT date, which
	 * get_post_timestamp() covers from the local one.
	 *
	 * @param \WP_Post $post Post.
	 * @return int Unix seconds, 0 when unknown.
	 */
	private static function modified_time( \WP_Post $post ) {
		$time = function_exists( 'get_post_timestamp' ) ? get_post_timestamp( $post, 'modified' ) : get_post_modified_time( 'U', true, $post );

		return max( 0, (int) $time );
	}

	/**
	 * A post's title as plain text, or a placeholder for an untitled one.
	 *
	 * @param \WP_Post $post Post.
	 * @return string
	 */
	private static function title( \WP_Post $post ) {
		$title = get_the_title( $post );

		return '' !== trim( $title ) ? wp_strip_all_tags( html_entity_decode( $title, ENT_QUOTES, 'UTF-8' ) ) : __( '(no title)', 'wp-carousel-free' );
	}

	/**
	 * A slug as words, for a value with no known label.
	 *
	 * @param string $slug Slug.
	 * @return string
	 */
	private static function humanize( $slug ) {
		return ucwords( str_replace( array( '-', '_' ), ' ', (string) $slug ) );
	}

	/**
	 * A report for a site with nothing to scan.
	 *
	 * @return array<string, mixed>
	 */
	private static function empty_report() {
		return array(
			'rows'      => array(),
			'capped'    => false,
			'scannedAt' => time(),
		);
	}
}
