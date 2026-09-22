<?php
/**
 * WP Carousel Pro - Block Dynamic CSS Orchestrator
 *
 * Discovers carousel blocks in posts, templates, widgets, and reusables.
 * Generates and caches server-side CSS matching carouselDynamicCss.js output.
 *
 * @since 4.2.4
 * @version 1.0.0
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Includes\Utils;

use ShapedPlugin\WPCarouselFree\Blocks\Styles\AjaxPaginationStyle;
use ShapedPlugin\WPCarouselFree\Blocks\Styles\CarouselDynamicCss;
use ShapedPlugin\WPCarouselFree\Blocks\Schema\AllowedValues;
use ShapedPlugin\WPCarouselFree\Blocks\Rendering\NavigationBuilder;
use ShapedPlugin\WPCarouselFree\Blocks\AssetManager;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Block_Dynamic_Style
 *
 * Orchestrates discovery, generation, and caching of dynamic CSS for carousel blocks.
 */
class Block_Dynamic_Style {

	/**
	 * Uploads sub-directory holding every generated stylesheet.
	 *
	 * The single source of truth for that location: both the property and the URL
	 * built in the constructor derive from it, so the folder is named once and the
	 * path and URL halves cannot drift apart. Mirrors the constant of the same name
	 * in WP Carousel Pro, which writes into this same folder.
	 */
	const ASSETS_SUBDIR = 'wp-carousel/assets';

	/**
	 * Our carousel block names.
	 *
	 * @var array
	 */
	public $our_blocks = array();

	/**
	 * Style-chunk keys needed by the current request (unioned across the post,
	 * its reusable blocks, and the block-theme template).
	 *
	 * @var array<string, bool>
	 */
	private $style_chunks_needed = array();

	/**
	 * Assets folder directory.
	 *
	 * Deliberately shared with Pro (`wp-content/uploads/wp-carousel/assets/`),
	 * matching the content contract in the root CLAUDE.md: same block names, same
	 * option keys, same CPT, so a Free → Pro upgrade needs no migration.
	 *
	 * The folder is named for the product, not for one edition. It used to be
	 * `wp-carousel-pro/assets/` even though Free wrote here too — a directory owned
	 * by two plugins carrying the name of one is how it ends up deleted by the
	 * other's cleanup.
	 *
	 * Pro requires Free (`wp-carousel-pro.php` lists it as a dependency), so the two
	 * do run together and both write `sp-wpcp-style-{id}.css`. That is safe because
	 * the name is derived from the post id and the contents are regenerated from the
	 * same block attributes: whichever edition writes last writes the same bytes.
	 * Neither side deletes the other's files on deactivation, so a Free → Pro
	 * upgrade can leave stale stylesheets behind. They are harmless — Pro regenerates
	 * on the next cache miss and `delete_css_file_by_id()` only ever targets the
	 * current post's own file — but they are dead weight. No cleanup job exists; if
	 * one is ever added it belongs in Pro's activation path, not here.
	 *
	 * @var string
	 */
	public $wpcp_assets_folder_dir = '/' . self::ASSETS_SUBDIR . '/';

	/**
	 * CSS URL base.
	 *
	 * @var string
	 */
	public $css_url = '';

	/**
	 * Holds widget CSS option name.
	 *
	 * @var string
	 */
	public $widget_css_option_name = 'wpcpf_blocks_widget_css_files';

	/**
	 * Holds class instance (Singleton).
	 *
	 * @var Block_Dynamic_Style|null
	 */
	private static $instance;

	/**
	 * Cache for filesystem initialization status.
	 *
	 * @var bool|null
	 */
	private $filesystem_initialized = null;

	/**
	 * Cache for current theme stylesheet.
	 *
	 * @var string|null
	 */
	private $cached_theme_stylesheet = null;

	/**
	 * Classic block-widget instances whose dynamic CSS was already attached this request.
	 *
	 * @var array<int, true>
	 */
	private $emitted_widget_css_instances = array();

	/**
	 * Whether aggregated classic-widget dynamic CSS was already printed/attached.
	 *
	 * @var bool
	 */
	private $widget_css_output_done = false;

	/**
	 * Returns Singleton instance.
	 *
	 * @return Block_Dynamic_Style
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
			self::$instance->init();
		}
		return self::$instance;
	}

	/**
	 * Constructor function.
	 *
	 * @param array $block_names Block names (optional).
	 */
	public function __construct( $block_names = array() ) {
		// Every block with a PHP render path. Marquee and Panorama are editor
		// previews only, and leaving them out is what keeps a page holding one
		// free of generated CSS, base styles, style chunks and dynamic fonts.
		$wpcp_blocks = array(
			'wp-carousel-pro/carousel',
			'wp-carousel-pro/slider',
			'wp-carousel-pro/thumbnails-slider',
			'wp-carousel-pro/tiles',
		);

		$this->our_blocks = $block_names ? $block_names : $wpcp_blocks;

		// Get upload dir for CSS storage.
		$upload_dir    = wp_upload_dir();
		$this->css_url = trailingslashit( $upload_dir['baseurl'] ) . self::ASSETS_SUBDIR . '/';

		// Register main hook for collecting and generating CSS.
		add_action( 'wp_enqueue_scripts', array( $this, 'collect_blocks_and_generate_css' ) );
		add_action( 'dynamic_sidebar_after', array( $this, 'generate_widget_dynamic_css' ) );
		add_filter(
			'dynamic_sidebar_params',
			function ( $params ) {
				global $wpcpf_current_page_widgets;
				if ( ! is_array( $wpcpf_current_page_widgets ) ) {
					$wpcpf_current_page_widgets = array();
				}

				$widget_id = $params[0]['widget_id'] ?? '';
				if ( strpos( (string) $widget_id, 'block-' ) === 0 ) {
					$wpcpf_current_page_widgets[] = array(
						'sidebar_id'  => $params[0]['id'] ?? '',
						'widget_id'   => $widget_id,
						'widget_name' => $params[0]['widget_name'] ?? '',
					);
				}
				return $params;
			}
		);
	}

	/**
	 * Initializes all hooks for CSS generation and enqueueing.
	 *
	 * @return void
	 */
	public function init() {
		// Post save/delete hooks.
		add_action( 'save_post', array( $this, 'delete_css_file_by_id' ), 10, 2 );
		add_action( 'before_delete_post', array( $this, 'delete_css_file_by_id' ) );
		add_action( 'wp_trash_post', array( $this, 'delete_css_file_by_id' ) );

		// FSE template hooks.
		add_action( 'wp_after_insert_post', array( $this, 'handle_fse_template_delete' ), 10, 2 );

		// Widget update hooks.
		add_action( 'update_option_widget_block', array( $this, 'generate_widget_css' ), 10, 2 );
	}

	/**
	 * Main method to collect blocks from all sources and generate CSS files.
	 *
	 * @return void
	 */
	public function collect_blocks_and_generate_css() {
		global $_wp_current_template_content;

		$inline_style                = '';
		$google_fonts_list           = array();
		$needs_block_frontend_assets = false;
		$current_post                = $this->get_current_frontend_post();

		// Collect blocks from current post.
		if ( ! empty( $current_post ) ) {
			$blocks = parse_blocks( $current_post->post_content ?? '' );
			$this->collect_style_chunk_flags( $blocks );
			if ( $this->has_shared_runtime_blocks( $blocks ) ) {
				$needs_block_frontend_assets = true;
			}

			if ( $this->css_file_exists( $current_post->ID ) ) {
				$sp_rand = get_post_meta( $current_post->ID, '_wpcpf_blocks_unique_version', true );
				$sp_rand = ! empty( $sp_rand ) ? $sp_rand : wp_rand( 1000, 9999 );
				wp_enqueue_style(
					'sp-wpcp-css-' . $current_post->ID,
					$this->css_url . 'sp-wpcp-style-' . $current_post->ID . '.css',
					array( 'wpcpf-blocks-base-style' ),
					'sp-wpcp-' . $sp_rand
				);
				$font_lists = get_post_meta( $current_post->ID, 'wpcpf_blocks_dynamic_fonts', true );
				// A cache hit means the CSS file is already built. Only re-derive the
				// font list when it was never stored (e.g. a file cached by an older
				// version) — and derive it cheaply from the block typography instead of
				// regenerating the whole CSS file, which would defeat the cache on every
				// request. An empty array is a valid value (system-font-only block).
				if ( ! is_array( $font_lists ) ) {
					$font_lists = $this->derive_font_lists_for_post( $current_post->ID, $current_post );
					update_post_meta( $current_post->ID, 'wpcpf_blocks_dynamic_fonts', $font_lists );
				}
			} else {
				$dynamic_assets = $this->generate_post_css_file( $current_post->ID, $current_post );
				if ( false !== $dynamic_assets && is_array( $dynamic_assets ) ) {
					$font_lists    = $dynamic_assets[1] ?? array();
					$inline_style .= $dynamic_assets[0] ?? '';
					$unique_id     = wp_rand( 1000, 9999 );
					update_post_meta( $current_post->ID, '_wpcpf_blocks_unique_version', $unique_id );
				} else {
					$font_lists = array();
				}
			}

			if ( $font_lists && is_array( $font_lists ) ) {
				$google_fonts_list = array_merge( $google_fonts_list, $font_lists );
			}

			// Handle reusable blocks in post content.
			if ( isset( $current_post->post_content ) ) {
				$reusable_ids = $this->get_reusable_ids( $current_post->post_content );
				if ( ! empty( $reusable_ids ) ) {
					// Always walk the reusables (not only when the shared bundle is
					// still undecided): the walk also unions style-chunk flags.
					if ( $this->reusables_have_shared_runtime_blocks( $reusable_ids ) && ! $needs_block_frontend_assets ) {
						$needs_block_frontend_assets = true;
					}

					foreach ( $reusable_ids as $reusable_id ) {
						if ( $this->css_file_exists( $reusable_id ) ) {
							$sp_rand = get_post_meta( $reusable_id, '_wpcpf_blocks_unique_version', true );
							$sp_rand = ! empty( $sp_rand ) ? $sp_rand : wp_rand( 1000, 9999 );
							wp_enqueue_style(
								'sp-wpcp-css-' . $reusable_id,
								$this->css_url . 'sp-wpcp-style-' . $reusable_id . '.css',
								array( 'wpcpf-blocks-base-style' ),
								'sp-wpcp-' . $sp_rand
							);
							$font_lists = get_post_meta( $reusable_id, 'wpcpf_blocks_dynamic_fonts', true );
							// Cache hit: re-derive a never-stored font list cheaply instead of
							// regenerating the reusable block's whole CSS file. An empty array
							// is a valid value and is trusted.
							if ( ! is_array( $font_lists ) ) {
								$font_lists = $this->derive_font_lists_for_post( $reusable_id );
								update_post_meta( $reusable_id, 'wpcpf_blocks_dynamic_fonts', $font_lists );
							}
						} else {
							$dynamic_assets = $this->generate_post_css_file( $reusable_id );
							if ( false !== $dynamic_assets && is_array( $dynamic_assets ) ) {
								$font_lists    = $dynamic_assets[1] ?? array();
								$inline_style .= $dynamic_assets[0] ?? '';
								$unique_id     = wp_rand( 1000, 9999 );
								update_post_meta( $reusable_id, '_wpcpf_blocks_unique_version', $unique_id );
							} else {
								$font_lists = array();
							}
						}
						if ( $font_lists && is_array( $font_lists ) ) {
							$google_fonts_list = array_merge( $google_fonts_list, $font_lists );
						}
					}
				}
			}
		}

		// Collect blocks from current template content. Block themes populate this
		// global with the whole resolved template on every front-end request, so
		// gate the expensive parse behind a cheap substring scan — the parse only
		// pays off when the template directly holds one of our blocks or wraps one
		// inside a synced pattern.
		if ( ! empty( $_wp_current_template_content )
			&& $this->content_may_contain_our_blocks( $_wp_current_template_content ) ) {
			$blocks = parse_blocks( $_wp_current_template_content );
			$this->collect_style_chunk_flags( $blocks );
			if ( $this->has_shared_runtime_blocks( $blocks ) ) {
				$needs_block_frontend_assets = true;
			}

			// Cache theme name to avoid repeated calls.
			if ( null === $this->cached_theme_stylesheet ) {
				$this->cached_theme_stylesheet = wp_get_theme()->get_stylesheet();
			}
			$theme = $this->cached_theme_stylesheet;

			// Check if main template has our blocks and generate CSS.
			if ( $this->has_our_blocks( $blocks ) ) {
				global $_wp_current_template_id;
				$template_id = ! empty( $_wp_current_template_id ) ? $_wp_current_template_id : 'current-template';

				// Extract only the last part if template_id contains /.
				if ( strpos( $template_id, '/' ) !== false || strpos( $template_id, '//' ) !== false ) {
					$parts       = preg_split( '#//?#', $template_id );
					$template_id = end( $parts );
				}

				$sanitized_theme       = sanitize_key( $theme );
				$sanitized_template_id = sanitize_key( $template_id );
				$dynamic_css           = get_option( 'wpcpf_blocks_dynamic_css_' . $sanitized_theme . $sanitized_template_id );
				$font_lists            = get_option( 'wpcpf_blocks_dynamic_fonts_' . $sanitized_theme . $sanitized_template_id );

				if ( empty( $dynamic_css ) ) {
					$dynamic_assets = $this->generate_and_save_css_file( $template_id, $blocks, $theme, true );
					if ( false !== $dynamic_assets && is_array( $dynamic_assets ) ) {
						$font_lists  = $dynamic_assets[1] ?? array();
						$dynamic_css = $dynamic_assets[0] ?? '';
					} else {
						$dynamic_css = '';
						$font_lists  = array();
					}
				}

				$inline_style .= $dynamic_css;
				if ( is_array( $font_lists ) && ! empty( $font_lists ) ) {
					$google_fonts_list = array_merge( $google_fonts_list, $font_lists );
				}
			}

			// Handle reusable blocks in template.
			$reusable_ids = $this->get_reusable_ids_from_parsed_blocks( $blocks );
			if ( ! empty( $reusable_ids ) ) {
				if ( ! $needs_block_frontend_assets && $this->reusables_have_shared_runtime_blocks( $reusable_ids ) ) {
					$needs_block_frontend_assets = true;
				}

				foreach ( $reusable_ids as $reusable_id ) {
					if ( $this->css_file_exists( $reusable_id ) ) {
						$sp_rand = get_post_meta( $reusable_id, '_wpcpf_blocks_unique_version', true );
						$sp_rand = ! empty( $sp_rand ) ? $sp_rand : wp_rand( 1000, 9999 );
						wp_enqueue_style(
							'sp-wpcp-css-' . $reusable_id,
							$this->css_url . 'sp-wpcp-style-' . $reusable_id . '.css',
							array( 'wpcpf-blocks-base-style' ),
							'sp-wpcp-' . $sp_rand
						);
						$font_lists = get_post_meta( $reusable_id, 'wpcpf_blocks_dynamic_fonts', true );
					} else {
						$dynamic_assets = $this->generate_post_css_file( $reusable_id );
						if ( false !== $dynamic_assets && is_array( $dynamic_assets ) ) {
							$font_lists    = $dynamic_assets[1] ?? array();
							$inline_style .= $dynamic_assets[0] ?? '';
							$unique_id     = wp_rand( 1000, 9999 );
							update_post_meta( $reusable_id, '_wpcpf_blocks_unique_version', $unique_id );
						} else {
							$font_lists = array();
						}
					}
					if ( is_array( $font_lists ) && ! empty( $font_lists ) ) {
						$google_fonts_list = array_merge( $google_fonts_list, $font_lists );
					}
				}
			}
		}

		// Classic themes: attach active sidebar block-widget CSS here (before wp_head).
		// `dynamic_sidebar_after` is too late once `wpcp-blocks-base-style` has printed.
		$this->collect_classic_widget_dynamic_css( $inline_style, $google_fonts_list, $needs_block_frontend_assets );

		if ( $needs_block_frontend_assets ) {
			AssetManager::instance()->enqueue_block_frontend_assets();
			// Re-assert the base/Swiper style enqueue at this hook: the call above
			// may no-op if its one-time guard was latched by an earlier render, and
			// on the inline path nothing else pulls the base stylesheet in.
			AssetManager::instance()->ensure_block_base_styles_enqueued();
		}

		// Style chunks are independent of the shared-bundle gate above. Enqueued
		// after the base handles so print order holds.
		if ( ! empty( $this->style_chunks_needed ) ) {
			AssetManager::instance()->enqueue_block_style_chunks( array_keys( $this->style_chunks_needed ) );
		}

		// Output inline CSS if any. Ensure base handle is enqueued so inline CSS prints (may run before block render).
		if ( ! empty( $inline_style ) ) {
			AssetManager::instance()->ensure_block_base_styles_enqueued();
			$sanitized_css = wp_strip_all_tags( $inline_style );
			if ( wp_style_is( 'wpcpf-blocks-base-style', 'registered' ) ) {
				wp_add_inline_style( 'wpcpf-blocks-base-style', $sanitized_css );
				// Early classic-widget CSS was merged into this same inline blob.
				if ( ! empty( $this->emitted_widget_css_instances ) ) {
					$this->widget_css_output_done = true;
				}
			}
		}

		// Enqueue Google Fonts if any.
		if ( ! empty( $google_fonts_list ) ) {
			$google_fonts_list = array_unique( $google_fonts_list );
			wp_enqueue_style(
				'sp-wpcp-google-fonts',
				'https://fonts.googleapis.com/css?family=' . implode( '|', $google_fonts_list ) . '&display=swap',
				array(),
				WPCAROUSELF_VERSION,
				'all'
			);
		}
	}

	/**
	 * Get All Reusable IDs from content.
	 *
	 * @param string $ea_post_content Post content.
	 * @return array Reusable block IDs.
	 */
	public function get_reusable_ids( $ea_post_content ) {
		$reusable_id = array();
		if ( ! empty( $ea_post_content ) ) {
			if ( has_blocks( $ea_post_content ) && false !== strpos( $ea_post_content, 'wp:block' ) && false !== strpos( $ea_post_content, '"ref"' ) ) {
				$blocks = parse_blocks( $ea_post_content );
				foreach ( $blocks as $key => $value ) {
					// `ref` is author-controlled block-comment JSON and ends up in a CSS
					// filename, so it has to be an integer before it reaches the filesystem.
					$ref = isset( $value['attrs']['ref'] ) && is_scalar( $value['attrs']['ref'] ) ? absint( $value['attrs']['ref'] ) : 0;
					if ( $ref ) {
						$reusable_id[] = $ref;
					}
					// Recursively check inner blocks.
					if ( ! empty( $value['innerBlocks'] ) ) {
						$inner_reusable_ids = $this->get_reusable_ids_from_blocks( $value['innerBlocks'] );
						$reusable_id        = array_merge( $reusable_id, $inner_reusable_ids );
					}
				}
			}
		}
		return array_unique( $reusable_id );
	}

	/**
	 * Get reusable IDs from already parsed blocks.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array Reusable block IDs.
	 */
	private function get_reusable_ids_from_parsed_blocks( $blocks ) {
		$reusable_id = array();
		if ( ! empty( $blocks ) ) {
			foreach ( $blocks as $key => $value ) {
				// See get_reusable_ids(): author-controlled, so cast before use.
				$ref = isset( $value['attrs']['ref'] ) && is_scalar( $value['attrs']['ref'] ) ? absint( $value['attrs']['ref'] ) : 0;
				if ( $ref ) {
					$reusable_id[] = $ref;
				}
				// Recursively check inner blocks.
				if ( ! empty( $value['innerBlocks'] ) ) {
					$inner_reusable_ids = $this->get_reusable_ids_from_blocks( $value['innerBlocks'] );
					$reusable_id        = array_merge( $reusable_id, $inner_reusable_ids );
				}
			}
		}
		return array_unique( $reusable_id );
	}

	/**
	 * Get reusable IDs from blocks recursively.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array Reusable block IDs.
	 */
	private function get_reusable_ids_from_blocks( $blocks ) {
		$reusable_ids = array();
		foreach ( $blocks as $block ) {
			// See get_reusable_ids(): author-controlled, so cast before use.
			$ref = isset( $block['attrs']['ref'] ) && is_scalar( $block['attrs']['ref'] ) ? absint( $block['attrs']['ref'] ) : 0;
			if ( $ref && 'core/block' === $block['blockName'] ) {
				$reusable_ids[] = $ref;
			}
			if ( ! empty( $block['innerBlocks'] ) ) {
				$inner_ids    = $this->get_reusable_ids_from_blocks( $block['innerBlocks'] );
				$reusable_ids = array_merge( $reusable_ids, $inner_ids );
			}
		}
		return $reusable_ids;
	}

	/**
	 * Generate and save CSS file for a post.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object (optional).
	 * @return string|false CSS string or false.
	 */
	public function generate_post_css_file( $post_id, $post = null ) {
		if ( null === $post ) {
			$post = get_post( $post_id );
		}

		if ( ! $post ) {
			return false;
		}

		$content = isset( $post->post_content ) ? $post->post_content : '';
		if ( empty( $content ) ) {
			$this->delete_css_file( $post_id );
			return false;
		}

		$blocks = parse_blocks( $content );
		if ( ! $this->has_our_blocks( $blocks ) ) {
			$this->delete_css_file( $post_id );
			return false;
		}

		return $this->generate_and_save_css_file( $post_id, $blocks );
	}

	/**
	 * Cheap pre-parse gate for raw block markup (e.g. an FSE template).
	 *
	 * Returns true only when the string plausibly contains, or wraps, one of our
	 * blocks — avoiding a full parse_blocks() walk on every block-theme front-end
	 * request when no carousel is present. A synced pattern stores only its
	 * reference comment in the template, so its inner markup is not visible here;
	 * the ref signal (mirroring {@see get_reusable_ids()}) keeps that case parsing.
	 *
	 * @param string $content Raw block markup.
	 * @return bool True when a parse is warranted.
	 */
	private function content_may_contain_our_blocks( $content ) {
		if ( ! is_string( $content ) || '' === $content ) {
			return false;
		}

		// Direct carousel / inner-toolbar block (every name shares this prefix).
		if ( false !== strpos( $content, 'wp-carousel-pro/' ) ) {
			return true;
		}

		// A synced pattern (reusable) ref may wrap one of our blocks.
		return false !== strpos( $content, 'wp:block' ) && false !== strpos( $content, '"ref"' );
	}

	/**
	 * Check if blocks contain our plugin blocks.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return bool True if our blocks found.
	 */
	private function has_our_blocks( $blocks ) {
		foreach ( $blocks as $block ) {
			if ( ! empty( $block['blockName'] ) && in_array( $block['blockName'], $this->our_blocks, true ) ) {
				return true;
			}

			if ( ! empty( $block['innerBlocks'] ) && $this->has_our_blocks( $block['innerBlocks'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Resolve the current queried post for front-end CSS discovery.
	 *
	 * `wp_enqueue_scripts` does not guarantee `global $post` is hydrated on every
	 * singular request, especially on classic themes and some custom templates.
	 * Fall back to the main queried object so first-load asset discovery does not
	 * depend on a later render-time enqueue.
	 *
	 * @return \WP_Post|null
	 */
	private function get_current_frontend_post() {
		global $post;

		if ( $post instanceof \WP_Post ) {
			return $post;
		}

		$queried_object_id = get_queried_object_id();
		if ( empty( $queried_object_id ) ) {
			return null;
		}

		$queried_post = get_post( $queried_object_id );
		return $queried_post instanceof \WP_Post ? $queried_post : null;
	}

	/**
	 * Check whether parsed blocks include a shared-runtime block.
	 *
	 * Lets us enqueue the shared block frontend pipeline during
	 * `wp_enqueue_scripts` rather than at render time, where a scheduled or
	 * hidden first block may enqueue too late for first paint.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return bool True when one of our blocks is present.
	 */
	private function has_shared_runtime_blocks( $blocks ) {
		foreach ( $blocks as $block ) {
			$block_name = $block['blockName'] ?? '';
			if ( '' !== $block_name && in_array( $block_name, $this->our_blocks, true ) ) {
				return true;
			}

			if ( ! empty( $block['innerBlocks'] ) && $this->has_shared_runtime_blocks( $block['innerBlocks'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check whether synced reusable blocks contain a shared-runtime block.
	 *
	 * A first-load request can discover carousel CSS from a reusable block and
	 * still miss the shared frontend bundle if the outer page/template contains
	 * only `core/block` references. Scan the referenced content too so
	 * scheduled/hidden reusable blocks do not fall back to late render-time
	 * enqueue on the first request.
	 *
	 * @param array<int, int|string> $reusable_ids Reusable post IDs.
	 * @return bool True when any reusable contains one of our blocks.
	 */
	private function reusables_have_shared_runtime_blocks( array $reusable_ids ) {
		$found = false;
		foreach ( $reusable_ids as $reusable_id ) {
			$reusable_post = get_post( $reusable_id );
			if ( ! $reusable_post || empty( $reusable_post->post_content ) ) {
				continue;
			}

			$reusable_blocks = parse_blocks( $reusable_post->post_content );
			// Union style-chunk flags from every reusable — no early return, or a
			// later reusable's thumbnails/entrance chunk would be missed.
			$this->collect_style_chunk_flags( $reusable_blocks );
			if ( ! $found && $this->has_shared_runtime_blocks( $reusable_blocks ) ) {
				$found = true;
			}
		}

		return $found;
	}

	/**
	 * Union the style-chunk keys needed by the given parsed blocks into
	 * `$this->style_chunks_needed`.
	 *
	 * @param array $blocks Parsed blocks.
	 */
	private function collect_style_chunk_flags( $blocks ) {
		foreach ( $blocks as $block ) {
			$block_name = $block['blockName'] ?? '';
			if ( '' !== $block_name && in_array( $block_name, $this->our_blocks, true ) ) {
				$attributes = $this->merge_block_defaults( $block );
				foreach ( AssetManager::style_chunks_for_block( $block_name, $attributes ) as $chunk_key ) {
					$this->style_chunks_needed[ $chunk_key ] = true;
				}
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				$this->collect_style_chunk_flags( $block['innerBlocks'] );
			}
		}
	}

	/**
	 * Extract CSS from blocks recursively.
	 *
	 * @param array  $blocks         Parsed blocks.
	 * @param string $post_id        Post ID for context.
	 * @return array CSS string and fonts array.
	 */
	private function extract_css_from_blocks( $blocks, $post_id = '' ) {
		$style      = '';
		$custom_css = '';
		$fonts      = array();

		foreach ( $blocks as $block ) {
			$block_name = $block['blockName'] ?? '';

			if ( '' !== $block_name && in_array( $block_name, $this->our_blocks, true ) ) {
				$generated_asset = $this->generate_css_from_attributes( $block );
				$generated_css   = $generated_asset[0] ?? '';
				$generated_fonts = $generated_asset[1] ?? array();

				if ( is_array( $generated_fonts ) ) {
					$fonts = array_merge( $fonts, $generated_fonts );
				}
				if ( ! empty( $generated_css ) ) {
					$style .= $generated_css;
				}

				if ( ! empty( $block['innerBlocks'] ) ) {
					$generated_asset = $this->extract_css_from_blocks( $block['innerBlocks'], $post_id );
					$generated_css   = $generated_asset[0] ?? '';
					$generated_fonts = $generated_asset[1] ?? array();

					if ( is_array( $generated_fonts ) ) {
						$fonts = array_merge( $fonts, $generated_fonts );
					}
					if ( ! empty( $generated_css ) ) {
						$style .= $generated_css;
					}
				}
				continue;
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				$generated_asset = $this->extract_css_from_blocks( $block['innerBlocks'], $post_id );
				$generated_css   = $generated_asset[0] ?? '';
				$generated_fonts = $generated_asset[1] ?? array();

				if ( is_array( $generated_fonts ) ) {
					$fonts = array_merge( $fonts, $generated_fonts );
				}
				if ( ! empty( $generated_css ) ) {
					$style .= $generated_css;
				}
			}
		}

		$dynamic_css = $style;
		return array( $dynamic_css, $fonts );
	}

	/**
	 * Generate CSS from block attributes using CarouselDynamicCss.
	 *
	 * @param array $block Block data.
	 * @return array CSS string and fonts array.
	 */
	private function generate_css_from_attributes( $block ) {
		$block_name = $block['blockName'] ?? '';
		if ( empty( $block_name ) ) {
			return array( '', array() );
		}

		// Extract block name without namespace.
		$block_name_parts = explode( '/', $block_name );
		$block_name_short = end( $block_name_parts );

		// Merge saved attributes over the registered schema defaults.
		$attributes = $this->merge_block_defaults( $block );

		// MUST run before overwriting blockName with a string — saved JSON may store
		// uniqueId inside the blockName object (legacy / malformed block.json shape).
		$attributes = $this->normalize_block_attributes_unique_id( $attributes );
		if ( '' === ( $attributes['uniqueId'] ?? '' ) ) {
			return array( '', array() );
		}

		// Short slug for generator (after uniqueId extraction from blockName array).
		$attributes['blockName'] = $block_name_short;

		// Generate CSS using CarouselDynamicCss.
		$css_generator = new CarouselDynamicCss( $attributes );
		$font_lists    = $this->parse_font_lists_attribute( $attributes );
		$css           = $css_generator->generate();

		// Fold navigation + pagination CSS into the same delivered/cached string so
		// the carousel chrome rides the shared pipeline instead of inline <style>
		// tags in the block markup. Scoped to the same DOM id BlockRenderer uses.
		$dom_id = $this->resolve_block_dom_id( $attributes );
		if ( '' !== $dom_id ) {
			$nav_builder = new NavigationBuilder( $attributes );
			$css        .= $nav_builder->pagination_css( $dom_id );
			$css        .= $nav_builder->navigation_css( $dom_id );
		}

		if ( 'tiles' === $block_name_short ) {
			$layout_options = isset( $attributes['layoutOptions'] ) && is_array( $attributes['layoutOptions'] )
				? $attributes['layoutOptions']
				: array();
			$source_type    = isset( $attributes['sourceType'] ) ? (string) $attributes['sourceType'] : 'image';
			$pagination_on  = ! empty( $layout_options['pagination'] )
				&& in_array( $source_type, array( 'post', 'product', 'image', 'video' ), true );
			if ( $pagination_on ) {
				$css .= AjaxPaginationStyle::generate( $attributes );
			}
		}

		return array( $css, is_array( $font_lists ) ? $font_lists : array() );
	}

	/**
	 * Merge a parsed block's saved attributes over its registered schema defaults.
	 *
	 * The module gate is applied to the merged result so the generated CSS file
	 * carries no custom properties for a switched-off module, matching the
	 * markup {@see \ShapedPlugin\WPCarouselFree\Blocks\BlockRenderer} emits.
	 *
	 * @param array $block Parsed block (expects 'blockName' and 'attrs').
	 * @return array Merged attributes.
	 */
	private function merge_block_defaults( array $block ): array {
		$block_name  = $block['blockName'] ?? '';
		$saved_attrs = $block['attrs'] ?? array();
		if ( '' === $block_name ) {
			return AllowedValues::project( $saved_attrs );
		}

		$block_type = \WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
		$defaults   = array();
		if ( $block_type ) {
			foreach ( $block_type->get_attributes() as $key => $attr ) {
				if ( isset( $attr['default'] ) ) {
					$defaults[ $key ] = $attr['default'];
				}
			}
		}

		return AllowedValues::project( wp_parse_args( $saved_attrs, $defaults ) );
	}

	/**
	 * Derive the Google-font list for a post without regenerating its CSS file.
	 *
	 * Mirrors the font derivation in {@see generate_css_from_attributes()} but
	 * skips CSS generation, so a cache hit can recover a missing
	 * `wpcpf_blocks_dynamic_fonts` meta cheaply.
	 *
	 * @param int           $post_id Post ID.
	 * @param \WP_Post|null $post    Post object (optional).
	 * @return array Unique Google-font list.
	 */
	private function derive_font_lists_for_post( $post_id, $post = null ) {
		if ( null === $post ) {
			$post = get_post( $post_id );
		}
		if ( ! $post || empty( $post->post_content ) ) {
			return array();
		}
		return $this->collect_font_lists_from_blocks( parse_blocks( $post->post_content ) );
	}

	/**
	 * Collect the Google-font list from parsed blocks recursively.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array Unique Google-font list.
	 */
	private function collect_font_lists_from_blocks( $blocks ) {
		$fonts = array();
		foreach ( $blocks as $block ) {
			$block_name = $block['blockName'] ?? '';
			if ( '' !== $block_name && in_array( $block_name, $this->our_blocks, true ) ) {
				$attributes = $this->merge_block_defaults( $block );
				$fonts      = array_merge( $fonts, $this->parse_font_lists_attribute( $attributes ) );
			}
			if ( ! empty( $block['innerBlocks'] ) ) {
				$fonts = array_merge( $fonts, $this->collect_font_lists_from_blocks( $block['innerBlocks'] ) );
			}
		}
		return array_values( array_unique( $fonts ) );
	}

	/**
	 * Resolve the block's root DOM id the same way {@see \ShapedPlugin\WPCarouselFree\Blocks\BlockRenderer::render()}
	 * does. Advanced `cssId` is rendered on `.wpcp-block-inner`, so root-scoped
	 * dynamic selectors continue using the internal `uniqueId`.
	 *
	 * @param array $attributes Merged block attributes (uniqueId already normalized).
	 * @return string Sanitized DOM id, or '' when none is available.
	 */
	private function resolve_block_dom_id( array $attributes ): string {
		$raw   = (string) ( $attributes['uniqueId'] ?? '' );
		$clean = preg_replace( '/[^a-zA-Z0-9_-]/', '', $raw );
		return is_string( $clean ) ? $clean : '';
	}

	/**
	 * Generate and save CSS file.
	 *
	 * @param int|string $file_id      Post ID, widget ID, template ID, or template part ID.
	 * @param array      $blocks       Parsed blocks.
	 * @param string     $theme        Theme name (for FSE templates).
	 * @param bool       $is_fse_template Whether this is an FSE template.
	 * @return string|false CSS string or false.
	 */
	private function generate_and_save_css_file( $file_id, $blocks, $theme = '', $is_fse_template = false ) {
		// Extract CSS from blocks.
		$dynamic_assets = $this->extract_css_from_blocks( $blocks, $file_id );
		$css            = $dynamic_assets[0] ?? '';
		$font_lists     = $dynamic_assets[1] ?? array();

		if ( empty( $css ) ) {
			return false;
		}

		// Minify CSS.
		$css = $this->minify_css( $css );

		if ( $is_fse_template ) {
			$sanitized_theme   = sanitize_key( $theme );
			$sanitized_file_id = sanitize_key( $file_id );
			update_option( 'wpcpf_blocks_dynamic_css_' . $sanitized_theme . $sanitized_file_id, $css );
			update_option( 'wpcpf_blocks_dynamic_fonts_' . $sanitized_theme . $sanitized_file_id, $font_lists );
			return array( $css, $font_lists );
		}

		global $wp_filesystem;

		if ( ! $this->init_filesystem() ) {
			return false;
		}

		// Create CSS folder.
		$this->create_css_folder();

		// Get file path.
		$css_folder = $this->get_css_folder();
		$file_name  = $this->get_css_file_name( $file_id );
		$file_path  = $css_folder . $file_name;

		// Save file. Strip any markup defensively, mirroring the inline-style path
		// above — the cached stylesheet is author-controlled CSS and must never be
		// able to carry a `<script>`/`</style>` payload into the served file.
		$written = $wp_filesystem->put_contents( $file_path, wp_strip_all_tags( $css ) );
		if ( false === $written ) {
			return false;
		}
		update_post_meta( $file_id, 'wpcpf_blocks_dynamic_fonts', $font_lists );
		return array( $css, $font_lists );
	}

	/**
	 * Initialize WordPress filesystem.
	 *
	 * @return bool Success status.
	 */
	private function init_filesystem() {
		// Return cached result if already initialized.
		if ( null !== $this->filesystem_initialized ) {
			return $this->filesystem_initialized;
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';

		global $wp_filesystem;

		if ( ! function_exists( 'WP_Filesystem' ) ) {
			$this->filesystem_initialized = false;
			return false;
		}

		WP_Filesystem();

		$this->filesystem_initialized = ! empty( $wp_filesystem );
		return $this->filesystem_initialized;
	}

	/**
	 * Create CSS folder if it doesn't exist.
	 *
	 * @return void
	 */
	private function create_css_folder() {
		$folder = $this->get_css_folder();

		if ( ! file_exists( $folder ) ) {
			wp_mkdir_p( $folder );
		}
	}

	/**
	 * Get CSS folder path.
	 *
	 * @return string CSS folder path.
	 */
	private function get_css_folder() {
		$upload_dir = wp_upload_dir();
		return $upload_dir['basedir'] . $this->wpcp_assets_folder_dir;
	}

	/**
	 * Get CSS file name.
	 *
	 * @param int|string $id Post ID, widget ID, template ID, or template part ID.
	 * @return string CSS file name.
	 */
	private function get_css_file_name( $id ) {
		return "sp-wpcp-style-{$id}.css";
	}

	/**
	 * Minify CSS.
	 *
	 * @param string $css CSS content.
	 * @return string Minified CSS.
	 */
	private function minify_css( $css ) {
		$css = preg_replace( '!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css );
		$css = str_replace( array( "\r\n", "\n", "\t", '  ', '    ' ), '', $css );
		$css = str_replace( array( ' {', '{ ' ), '{', $css );
		$css = str_replace( array( ' }', '} ' ), '}', $css );
		$css = str_replace( array( ' ;', '; ' ), ';', $css );
		$css = str_replace( array( '@media only screen and (max-width: 599px){}', '@media only screen and (min-width: 600px) and (max-width: 1023px){}' ), '', $css );
		return trim( $css );
	}

	/**
	 * Check if CSS file exists by file ID.
	 *
	 * @param int|string $file_id Post ID, widget ID, template ID, or template part ID.
	 * @return bool True if file exists.
	 */
	public function css_file_exists( $file_id ) {
		$file_name = $this->get_css_file_name( $file_id );
		return $this->css_file_exists_by_name( $file_name );
	}

	/**
	 * Check if CSS file exists by file name.
	 *
	 * @param string $file_name CSS file name.
	 * @return bool True if file exists.
	 */
	public function css_file_exists_by_name( $file_name ) {
		global $wp_filesystem;

		if ( ! $this->init_filesystem() || ! $wp_filesystem ) {
			return false;
		}

		$folder    = $this->get_css_folder();
		$file_path = $folder . $file_name;

		return $wp_filesystem->exists( $file_path );
	}

	/**
	 * Drop every generated stylesheet so the next request rebuilds it.
	 *
	 * A dashboard module toggle changes what the generator emits for posts that
	 * were already cached, and nothing else invalidates those files short of
	 * re-saving each post.
	 *
	 * @return void
	 */
	public function purge_all_generated_css() {
		global $wp_filesystem, $wpdb;

		if ( $this->init_filesystem() ) {
			$folder = $this->get_css_folder();
			$files  = $wp_filesystem->dirlist( $folder );
			if ( is_array( $files ) ) {
				foreach ( $files as $file ) {
					$file_name = $file['name'] ?? '';
					if ( 0 === strpos( $file_name, 'sp-wpcp-style-' ) ) {
						$wp_filesystem->delete( $folder . $file_name );
					}
				}
			}
		}

		// FSE templates and widgets keep their CSS in options instead of files.
		// Deleted one by one so the object cache is invalidated with them.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Options have no lookup API for a prefix, and caching the result of a one-shot purge would be pointless.
		$option_names = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( 'wpcpf_blocks_dynamic_css_' ) . '%',
				$wpdb->esc_like( 'wpcpf_blocks_dynamic_fonts_' ) . '%'
			)
		);
		foreach ( (array) $option_names as $option_name ) {
			delete_option( $option_name );
		}
	}

	/**
	 * Delete CSS file.
	 *
	 * @param int|string $file_id Post ID, widget ID, template ID, or template part ID.
	 * @return void
	 */
	public function delete_css_file( $file_id ) {
		global $wp_filesystem;

		if ( ! $this->init_filesystem() ) {
			return;
		}

		$folder    = $this->get_css_folder();
		$file_path = $folder . $this->get_css_file_name( $file_id );

		if ( $wp_filesystem->exists( $file_path ) ) {
			$wp_filesystem->delete( $file_path );
		}
	}

	/**
	 * Deletes CSS file associated with a post.
	 *
	 * @param int|string $css_file_id Post ID.
	 * @return void|boolean False on failure.
	 */
	public function delete_css_file_by_id( $css_file_id ) {
		global $wp_filesystem;

		if ( ! $this->init_filesystem() ) {
			return false;
		}

		$folder    = $this->get_css_folder();
		$file_path = $folder . $this->get_css_file_name( $css_file_id );

		if ( $wp_filesystem->exists( $file_path ) ) {
			$wp_filesystem->delete( $file_path );
			delete_post_meta( $css_file_id, 'wpcpf_blocks_dynamic_fonts' );
			delete_post_meta( $css_file_id, '_wpcpf_blocks_unique_version' );
		}
	}

	/**
	 * Handles CSS deletion when FSE templates or parts are saved.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 * @return void
	 */
	public function handle_fse_template_delete( $post_id, $post ) {
		if ( ! $post instanceof \WP_Post ) {
			return;
		}
		if ( ! in_array( $post->post_type, array( 'wp_template', 'wp_template_part' ), true ) ) {
			return;
		}
		$field_id = get_post_field( 'post_name', $post_id );

		// Cache theme name to avoid repeated calls.
		if ( null === $this->cached_theme_stylesheet ) {
			$this->cached_theme_stylesheet = wp_get_theme()->get_stylesheet();
		}
		$theme              = $this->cached_theme_stylesheet;
		$sanitized_theme    = sanitize_key( $theme );
		$sanitized_field_id = sanitize_key( $field_id );

		delete_option( 'wpcpf_blocks_dynamic_css_' . $sanitized_theme . $sanitized_field_id );
		delete_option( 'wpcpf_blocks_dynamic_fonts_' . $sanitized_theme . $sanitized_field_id );
	}

	/**
	 * Generates CSS when a widget block is updated.
	 *
	 * @param mixed $old_value Old widget data.
	 * @param mixed $new_value New widget data.
	 * @return void
	 */
	public function generate_widget_css( $old_value, $new_value ) {
		if ( ! is_array( $new_value ) ) {
			return;
		}
		foreach ( $new_value as $widget_id => $widget_data ) {
			if ( empty( $widget_data['content'] ) ) {
				continue;
			}

			$blocks              = parse_blocks( $widget_data['content'] );
			$sanitized_widget_id = sanitize_key( $widget_id );
			delete_option( 'wpcpf_blocks_dynamic_css_' . $sanitized_widget_id );
			delete_option( 'wpcpf_blocks_dynamic_fonts_' . $sanitized_widget_id );
		}
	}

	/**
	 * Collect classic-theme block-widget CSS during `wp_enqueue_scripts`.
	 *
	 * Attaching here keeps widget rules in `<head>` with the post/template CSS.
	 * Waiting until `dynamic_sidebar_after` fails when the page content already
	 * printed `wpcp-blocks-base-style` — `wp_add_inline_style()` becomes a no-op.
	 *
	 * @param string             $inline_style                Accumulated inline CSS (by ref).
	 * @param array<int, string> $google_fonts_list           Accumulated font families (by ref).
	 * @param bool               $needs_block_frontend_assets Whether shared frontend assets are needed (by ref).
	 * @return void
	 */
	private function collect_classic_widget_dynamic_css( &$inline_style, &$google_fonts_list, &$needs_block_frontend_assets ) {
		if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {
			return;
		}

		$sidebars_widgets = wp_get_sidebars_widgets();
		if ( empty( $sidebars_widgets ) || ! is_array( $sidebars_widgets ) ) {
			return;
		}

		foreach ( $sidebars_widgets as $sidebar_id => $widget_ids ) {
			if ( 'wp_inactive_widgets' === $sidebar_id || ! is_array( $widget_ids ) ) {
				continue;
			}

			foreach ( $widget_ids as $widget_id ) {
				if ( ! is_string( $widget_id ) || 0 !== strpos( $widget_id, 'block-' ) ) {
					continue;
				}
				if ( ! preg_match( '/-(\d+)$/', $widget_id, $matches ) ) {
					continue;
				}

				$instance = (int) $matches[1];
				$assets   = $this->get_widget_instance_dynamic_assets( $instance );
				if ( null === $assets ) {
					continue;
				}

				$needs_block_frontend_assets = true;
				$inline_style               .= $assets[0];
				if ( ! empty( $assets[1] ) ) {
					$google_fonts_list = array_merge( $google_fonts_list, $assets[1] );
				}
			}
		}
	}

	/**
	 * Resolve (and cache) dynamic CSS + fonts for one classic block-widget instance.
	 *
	 * @param int $instance Widget block instance number from `widget_block`.
	 * @return array{0:string,1:array<int,string>}|null Null when this instance has no WPCP CSS.
	 */
	private function get_widget_instance_dynamic_assets( $instance ) {
		$instance = (int) $instance;
		if ( 1 > $instance || isset( $this->emitted_widget_css_instances[ $instance ] ) ) {
			return null;
		}

		$widget_blocks = get_option( 'widget_block', array() );
		if ( empty( $widget_blocks[ $instance ]['content'] ) || ! is_string( $widget_blocks[ $instance ]['content'] ) ) {
			return null;
		}

		$blocks = parse_blocks( $widget_blocks[ $instance ]['content'] );
		if ( empty( $blocks ) || ! $this->has_our_blocks( $blocks ) ) {
			return null;
		}

		$this->collect_style_chunk_flags( $blocks );

		$cache_id            = sanitize_key( (string) $instance );
		$widget_dynamic_css  = get_option( 'wpcpf_blocks_dynamic_css_' . $cache_id, '' );
		$widget_dynamic_font = get_option( 'wpcpf_blocks_dynamic_fonts_' . $cache_id, array() );

		if ( '' === $widget_dynamic_css ) {
			$dynamic_assets = $this->generate_and_save_css_file( $instance, $blocks, '', true );
			if ( false === $dynamic_assets || ! is_array( $dynamic_assets ) ) {
				return null;
			}
			$widget_dynamic_css  = $dynamic_assets[0] ?? '';
			$widget_dynamic_font = $dynamic_assets[1] ?? array();
		}

		if ( '' === $widget_dynamic_css ) {
			return null;
		}

		$this->emitted_widget_css_instances[ $instance ] = true;

		return array(
			$widget_dynamic_css,
			is_array( $widget_dynamic_font ) ? $widget_dynamic_font : array(),
		);
	}

	/**
	 * Print or attach widget CSS after the base stylesheet may already be done.
	 *
	 * @param string             $css               Aggregated widget CSS.
	 * @param array<int, string> $google_fonts_list Font families.
	 * @return void
	 */
	private function output_widget_dynamic_css( $css, $google_fonts_list ) {
		if ( '' === $css || $this->widget_css_output_done ) {
			return;
		}

		AssetManager::instance()->enqueue_block_frontend_assets();
		AssetManager::instance()->ensure_block_base_styles_enqueued();
		$sanitized_css = wp_strip_all_tags( $css );

		// Late sidebar render: the handle was already printed in <head>.
		if ( wp_style_is( 'wpcpf-blocks-base-style', 'done' ) ) {
			printf(
				'<style id="sp-wpcp-widget-dynamic-css" type="text/css">%s</style>',
				$sanitized_css // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- stripped via wp_strip_all_tags().
			);
			$this->widget_css_output_done = true;
		} elseif ( wp_style_is( 'wpcpf-blocks-base-style', 'registered' ) ) {
			wp_add_inline_style( 'wpcpf-blocks-base-style', $sanitized_css );
			$this->widget_css_output_done = true;
		}

		if ( ! empty( $google_fonts_list ) ) {
			$google_fonts_list = array_unique( $google_fonts_list );
			wp_enqueue_style(
				'sp-wpcp-widget-google-fonts',
				'https://fonts.googleapis.com/css?family=' . implode( '|', $google_fonts_list ) . '&display=swap',
				array(),
				WPCAROUSELF_VERSION,
				'all'
			);
		}
	}

	/**
	 * Generates dynamic CSS for widget blocks in classic themes.
	 *
	 * Fallback for widgets discovered only while a sidebar renders. Prefer
	 * {@see collect_classic_widget_dynamic_css()} so CSS lands in `<head>`.
	 *
	 * @return void
	 */
	public function generate_widget_dynamic_css() {
		if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {
			return;
		}

		if ( $this->widget_css_output_done ) {
			return;
		}

		global $wpcpf_current_page_widgets, $wp_registered_sidebars;
		if ( empty( $wp_registered_sidebars ) || empty( $wpcpf_current_page_widgets ) || ! is_array( $wpcpf_current_page_widgets ) ) {
			return;
		}

		$inline_style      = '';
		$google_fonts_list = array();

		foreach ( $wpcpf_current_page_widgets as $widget ) {
			$widget_id = $widget['widget_id'] ?? '';
			if ( '' === $widget_id || 0 !== strpos( $widget_id, 'block-' ) ) {
				continue;
			}

			if ( ! preg_match( '/-(\d+)$/', $widget_id, $matches ) ) {
				continue;
			}

			$assets = $this->get_widget_instance_dynamic_assets( (int) $matches[1] );
			if ( null === $assets ) {
				continue;
			}

			$inline_style .= $assets[0];
			if ( ! empty( $assets[1] ) ) {
				$google_fonts_list = array_merge( $google_fonts_list, $assets[1] );
			}
		}

		$this->output_widget_dynamic_css( $inline_style, $google_fonts_list );
	}

	/**
	 * Normalize uniqueId on attributes (matches BlockRenderer / editor).
	 *
	 * @param array $attributes Merged block attributes.
	 * @return array Attributes with top-level uniqueId set or cleared.
	 */
	private function normalize_block_attributes_unique_id( array $attributes ): array {
		$raw = $attributes['uniqueId'] ?? '';
		if ( is_numeric( $raw ) ) {
			$raw = (string) $raw;
		}
		if ( ( '' === $raw || null === $raw ) && isset( $attributes['blockName'] ) && is_array( $attributes['blockName'] ) ) {
			$nested = $attributes['blockName']['uniqueId'] ?? '';
			$raw    = is_numeric( $nested ) ? (string) $nested : $nested;
		}
		if ( ! is_string( $raw ) || '' === $raw ) {
			$attributes['uniqueId'] = '';
			return $attributes;
		}
		$clean                  = preg_replace( '/[^a-zA-Z0-9_-]/', '', $raw );
		$attributes['uniqueId'] = is_string( $clean ) && '' !== $clean ? $clean : '';
		return $attributes;
	}

	/**
	 * Whether a font-family value is a requestable Google web font.
	 *
	 * Google fonts are stored as a bare name ("Freehand"); system/theme fonts
	 * are stored as a full CSS fallback stack ("Manrope, sans-serif"). Only bare
	 * names belong in the Google Fonts URL — a fallback stack or CSS keyword
	 * would produce a malformed request, so such values are excluded. The family
	 * still applies via the emitted `font-family` CSS rule. Mirrors the editor's
	 * `isGoogleWebFont` so the frontend import stays parity-locked.
	 *
	 * @param mixed $family Font-family value from a typography node.
	 * @return bool
	 */
	private function is_google_web_font( $family ) {
		if ( ! is_string( $family ) ) {
			return false;
		}

		$trimmed = trim( $family );
		if ( '' === $trimmed ) {
			return false;
		}

		// A comma signals a multi-family fallback stack = a system/theme font.
		if ( false !== strpos( $trimmed, ',' ) ) {
			return false;
		}

		$bare = strtolower( trim( str_replace( array( '"', "'" ), '', $trimmed ) ) );
		if ( in_array(
			$bare,
			array(
				'serif',
				'sans-serif',
				'monospace',
				'cursive',
				'fantasy',
				'system-ui',
				'ui-serif',
				'ui-sans-serif',
				'ui-monospace',
				'ui-rounded',
				'math',
				'emoji',
				'fangsong',
				'inherit',
				'initial',
				'revert',
				'revert-layer',
				'unset',
			),
			true
		) ) {
			return false;
		}

		return true;
	}

	/**
	 * Parse fontLists from attributes (string JSON or array).
	 *
	 * @param array $attributes Block attributes.
	 * @return array
	 */
	private function parse_font_lists_attribute( array $attributes ) {
		// Back-compat: if older block saves still have `fontLists`, honor it.
		if ( isset( $attributes['fontLists'] ) ) {
			$fl = $attributes['fontLists'];
			if ( is_string( $fl ) && '' !== $fl ) {
				$decoded = json_decode( $fl, true );
				if ( is_array( $decoded ) ) {
					return $decoded;
				}
			}
			if ( is_array( $fl ) ) {
				return $fl;
			}
		}

		// Derive the needed Google Fonts list directly from typography settings.
		// This keeps frontend/editor preview in sync even when `fontLists` isn't present.
		$google_fonts_list = array();

		$add_typography_node       = function ( $typo_node ) use ( &$google_fonts_list ) {
			if ( ! is_array( $typo_node ) ) {
				if ( is_object( $typo_node ) ) {
					$typo_node = (array) $typo_node;
				} else {
					return;
				}
			}

			$family = $typo_node['family'] ?? null;

			// Typography settings may store the google font under nested structures
			// (e.g. { typography: { family }, googleFont: { family } }).
			if ( is_array( $family ) ) {
				// Newer/expected shape: { family: 'Roboto', fontWeight: '700' }.
				$family_direct  = $family['family'] ?? null;
				$font_weight_in = $family['fontWeight'] ?? $family['font-weight'] ?? null;

				$typo_family    = $family['typography']['family'] ?? null;
				$google_family  = $family['googleFont']['family'] ?? null;
				$family_choices = array( $family_direct, $google_family, $typo_family );
				$family         = '';
				foreach ( $family_choices as $candidate ) {
					if ( is_string( $candidate ) && '' !== trim( $candidate ) ) {
						$family = $candidate;
						break;
					}
				}

				// Prefer font weight from nested object if provided.
				if ( null !== $font_weight_in && '' !== trim( (string) $font_weight_in ) ) {
					$typo_node['fontWeight'] = $font_weight_in;
				}
			}

			if ( ! is_string( $family ) ) {
				return;
			}

			$family = trim( $family );
			if ( '' === $family || preg_match( '/^default$/i', $family ) ) {
				return;
			}

			// System/theme fonts are CSS fallback stacks (e.g. "Manrope,
			// sans-serif") or generic keywords — never a Google font. Skip so
			// they don't corrupt the Google Fonts URL; they still apply via
			// the emitted `font-family` CSS rule.
			if ( ! $this->is_google_web_font( $family ) ) {
				return;
			}

			$font_weight = $typo_node['fontWeight'] ?? $typo_node['font-weight'] ?? '';
			if ( ! is_string( $font_weight ) ) {
				$font_weight = '' . $font_weight;
			}
			$font_weight = trim( $font_weight );
			if ( '' === $font_weight ) {
				$font_weight = '400';
			}

			// Google Fonts family param expects spaces as '+', matching the rest of this plugin.
			$family_plus         = preg_replace( '/\s+/', '+', $family );
			$google_fonts_list[] = $family_plus . ':' . $font_weight;
		};
		$get_first_font_typography = function ( ...$candidates ) {
			foreach ( $candidates as $candidate ) {
				if ( is_object( $candidate ) ) {
					$candidate = (array) $candidate;
				}
				if ( ! is_array( $candidate ) ) {
					continue;
				}

				$family = $candidate['family'] ?? null;
				if ( is_array( $family ) ) {
					$family_choices = array(
						$family['family'] ?? null,
						$family['googleFont']['family'] ?? null,
						$family['typography']['family'] ?? null,
					);
					foreach ( $family_choices as $family_choice ) {
						if ( is_string( $family_choice ) && '' !== trim( $family_choice ) ) {
							return $candidate;
						}
					}
					continue;
				}

				if ( is_string( $family ) && '' !== trim( $family ) && ! preg_match( '/^default$/i', trim( $family ) ) ) {
					return $candidate;
				}
			}

			return null;
		};

		$content_options      = $attributes['contentOptions'] ?? array();
		$meta_options         = $attributes['metaOptions'] ?? array();
		$taxonomy_options     = $attributes['taxonomyOptions'] ?? array();
		$post_content_options = $attributes['postContentOptions'] ?? array();
		$product_content_opts = $attributes['productContentOptions'] ?? array();
		$pagination_options   = $attributes['paginationOptions'] ?? array();
		$source_type          = $attributes['sourceType'] ?? 'image';

		$add_typography_node( $content_options['titleTypography'] ?? null );
		$add_typography_node( $content_options['descTypography'] ?? null );
		$add_typography_node( $meta_options['typography'] ?? null );
		$add_typography_node( $taxonomy_options['typography'] ?? null );

		if ( in_array( $source_type, array( 'post', 'video' ), true ) ) {
			$button_typography = $get_first_font_typography(
				$post_content_options['buttonTypography'] ?? null,
				$content_options['buttonTypography'] ?? null
			);
		} elseif ( 'product' === $source_type ) {
			$button_typography = $get_first_font_typography(
				$product_content_opts['buttonTypography'] ?? null,
				$content_options['buttonTypography'] ?? null
			);
		} else {
			$button_typography = $content_options['buttonTypography'] ?? null;
		}
		$add_typography_node( $button_typography );

		$price_typography = $product_content_opts['priceTypography'] ?? null;
		$add_typography_node( $price_typography );
		$add_typography_node( $pagination_options['typography'] ?? null );

		$google_fonts_list = array_values( array_unique( $google_fonts_list ) );
		return $google_fonts_list;
	}
}
