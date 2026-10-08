<?php
/**
 * AI Pattern Matcher
 *
 * Shortlists Ready Patterns for a natural language prompt and resolves the model's pick.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Dashboard;
use ShapedPlugin\WPCarouselFree\Blocks\BlockVisibility;
use ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns\PatternRepository;

defined( 'ABSPATH' ) || exit;

/**
 * AIPatternMatcher class.
 *
 * The AI builder is pattern-first: a prompt that a published Ready Pattern already
 * answers is served by inserting that pattern's markup, so the model never has to
 * invent attribute JSON for a layout somebody already designed. Attribute
 * generation is the fallback for prompts no pattern covers.
 *
 * Only a shortlist reaches the model. The catalog runs to hundreds of patterns and
 * sending all of them would cost more tokens than the attribute path it replaces,
 * so a local lexical pass narrows the field and the model only judges relevance.
 */
class AIPatternMatcher {

	/**
	 * Maximum candidates handed to the model.
	 */
	const MAX_CANDIDATES = 24;

	/**
	 * Minimum confidence the model must report before a pattern is inserted.
	 */
	const MIN_CONFIDENCE = 0.6;

	/**
	 * Confidence assumed when the model picks a pattern but reports no number.
	 */
	const ASSUMED_CONFIDENCE = 0.75;

	/**
	 * Characters kept from a pattern description in the candidate list.
	 */
	const DESCRIPTION_LIMIT = 120;

	/**
	 * Weight applied to terms the prompt implies rather than states.
	 */
	const SYNONYM_WEIGHT = 0.8;

	/**
	 * Weight applied to a word that names the container rather than the subject.
	 */
	const GENERIC_WEIGHT = 0.35;

	/**
	 * Score a pattern must reach before it is worth a slot in the shortlist.
	 *
	 * A prompt that only names a block ("make the slider faster") lands under this
	 * on every item, so a settings request costs no model round-trip at all.
	 */
	const MIN_SCORE = 4.0;

	/**
	 * Prompt words that carry no matching signal.
	 *
	 * Two groups: conversational filler, and the settings vocabulary ("columns",
	 * "speed", "color") that describes a knob rather than a design.
	 *
	 * @var string[]
	 */
	private const STOP_WORDS = array(
		'the',
		'and',
		'with',
		'for',
		'from',
		'that',
		'this',
		'have',
		'has',
		'want',
		'wants',
		'need',
		'needs',
		'make',
		'made',
		'create',
		'creates',
		'build',
		'builds',
		'please',
		'show',
		'using',
		'use',
		'uses',
		'add',
		'into',
		'some',
		'more',
		'like',
		'give',
		'set',
		'put',
		'can',
		'you',
		'not',
		'but',
		'are',
		'its',
		'each',
		'per',
		'all',
		'new',
		'our',
		'ours',
		'your',
		'yours',
		'their',
		'them',
		'they',
		'who',
		'what',
		'when',
		'where',
		'how',
		'why',
		'about',
		'here',
		'there',
		'these',
		'those',
		'will',
		'would',
		'could',
		'should',
		'get',
		'got',
		'let',
		'see',
		'look',
		'looks',
		'looking',
		'nice',
		'nicer',
		'good',
		'better',
		'really',
		'very',
		'change',
		'update',
		'turn',
		'increase',
		'decrease',
		'design',
		'designs',
		'layout',
		'layouts',
		'style',
		'styles',
		'thing',
		'things',
		'stuff',
		'color',
		'colors',
		'colour',
		'colours',
		'speed',
		'column',
		'columns',
		'size',
		'width',
		'height',
		'margin',
		'padding',
		'font',
		'gap',
		'spacing',
		'delay',
		'duration',
		'arrow',
		'arrows',
		'dots',
		'loop',
	);

	/**
	 * Words that name the container, not the subject.
	 *
	 * "Carousel" and "slider" appear in almost every prompt and describe what the
	 * block already is, so they steer without outvoting the thing being built.
	 *
	 * @var string[]
	 */
	private const GENERIC_TERMS = array( 'carousel', 'slider', 'slideshow', 'slide', 'slides', 'block', 'widget' );

	/**
	 * Short prompt words that still carry meaning; every other one is dropped.
	 *
	 * @var string[]
	 */
	private const SHORT_TERMS = array( '3d' );

	/**
	 * Canonical taxonomy term → the everyday words that imply it.
	 *
	 * Patterns are tagged with the vocabularies in `PatternVocabulary` and
	 * `CategoryMap` plus hand-written keywords; visitors type something else.
	 * This table is the bridge, and it is keyed by the canonical term so a new
	 * phrasing is one word added to an existing row.
	 *
	 * A multi-word alias is matched against consecutive prompt words, so "add to
	 * cart" reaches `shop` without "cart" and "add" having to carry it alone.
	 *
	 * @var array<string, string[]>
	 */
	private const TERM_ALIASES = array(
		// Use cases (PatternVocabulary::USE_CASES).
		'hero'              => array( 'hero', 'banner', 'masthead', 'splash', 'above the fold', 'front banner', 'big picture', 'header image' ),
		'features'          => array( 'feature', 'features', 'service', 'services', 'benefit', 'benefits', 'solution', 'solutions', 'what we do', 'what we offer' ),
		'portfolio'         => array( 'portfolio', 'project', 'projects', 'case study', 'case studies', 'agency', 'studio', 'creative', 'our work', 'built for' ),
		'gallery'           => array( 'gallery', 'galleries', 'photo', 'photos', 'photograph', 'photographs', 'photography', 'photographer', 'picture', 'pictures', 'image', 'images', 'album', 'albums', 'collage', 'moodboard', 'mosaic', 'shots' ),
		'testimonials'      => array( 'testimonial', 'testimonials', 'review', 'reviews', 'quote', 'quotes', 'feedback', 'customer', 'customers', 'client', 'clients', 'praise', 'endorsement', 'social proof', 'what people say', 'what our customers say', 'happy customers' ),
		'team'              => array( 'team', 'staff', 'member', 'members', 'employee', 'employees', 'crew', 'founder', 'founders', 'leadership', 'colleagues', 'doctors', 'who works here', 'meet the team' ),
		'logos'             => array( 'logo', 'logos', 'brand', 'brands', 'partner', 'partners', 'sponsor', 'sponsors', 'supplier', 'suppliers', 'certification', 'certifications', 'badge', 'badges', 'award', 'awards', 'integration', 'integrations', 'companies', 'trusted by', 'companies we work with' ),
		'pricing'           => array( 'pricing', 'price', 'prices', 'plan', 'plans', 'package', 'packages', 'tier', 'tiers', 'subscription' ),
		'cta'               => array( 'cta', 'call to action', 'newsletter', 'subscribe', 'signup', 'sign up', 'opt in', 'promo', 'promotion' ),
		'faq'               => array( 'faq', 'faqs', 'question', 'questions', 'answers', 'accordion' ),
		'blog'              => array( 'blog', 'post', 'posts', 'article', 'articles', 'news', 'editorial', 'magazine', 'newspaper', 'headline', 'headlines', 'story', 'stories', 'writing', 'journal', 'press', 'recent posts', 'latest posts' ),
		'shop'              => array( 'shop', 'store', 'storefront', 'product', 'products', 'ecommerce', 'woocommerce', 'woo', 'cart', 'add to cart', 'buy', 'sell', 'selling', 'sale', 'sales', 'discount', 'discounts', 'catalog', 'catalogue', 'merchandise', 'checkout', 'arrivals', 'bestseller', 'bestsellers', 'best sellers', 'lookbook', 'boutique', 'things we sell', 'online store', 'online shop' ),
		'video'             => array( 'video', 'videos', 'youtube', 'vimeo', 'movie', 'movies', 'film', 'clip', 'clips', 'reel', 'reels', 'shorts', 'showreel', 'streaming', 'watch' ),
		'audio'             => array( 'audio', 'music', 'song', 'songs', 'podcast', 'podcasts', 'episode', 'episodes', 'track', 'tracks', 'playlist', 'soundcloud', 'spotify', 'audiobook', 'radio', 'listen', 'listening' ),
		'events'            => array( 'event', 'events', 'conference', 'schedule', 'agenda', 'speaker', 'speakers', 'session', 'sessions', 'workshop', 'meetup', 'webinar', 'talks' ),
		'listings'          => array( 'listing', 'listings', 'property', 'properties', 'real estate', 'apartment', 'apartments', 'rental', 'rentals', 'vehicle', 'vehicles', 'car', 'cars', 'dealership', 'inventory', 'directory', 'for rent', 'for sale' ),
		'education'         => array( 'course', 'courses', 'lesson', 'lessons', 'class', 'classes', 'curriculum', 'student', 'students', 'school', 'university', 'academy', 'training', 'tutorial', 'tutorials', 'elearning' ),
		'hospitality'       => array( 'hotel', 'hotels', 'resort', 'restaurant', 'cafe', 'menu', 'dish', 'dishes', 'food', 'recipe', 'recipes', 'booking', 'reservation', 'room', 'rooms', 'suite', 'suites', 'spa', 'salon', 'travel', 'trip', 'tour', 'tours', 'destination', 'destinations', 'holiday', 'vacation' ),
		'downloads'         => array( 'download', 'downloads', 'pdf', 'document', 'documents', 'brochure', 'datasheet' ),
		'social-feed'       => array( 'instagram', 'facebook', 'twitter', 'tiktok', 'rss', 'feed', 'feeds', 'social', 'timeline' ),
		'page'              => array( 'page', 'homepage', 'home page', 'landing', 'landing page', 'front page', 'website', 'site', 'template', 'one pager', 'full page', 'whole page', 'complete page', 'web page' ),

		// Layout traits (PatternVocabulary::RECOMMENDED_TRAITS).
		'fullscreen'        => array( 'fullscreen', 'full screen', 'full width', 'fullwidth', 'edge to edge', 'immersive' ),
		'overlay'           => array( 'overlay', 'caption', 'captions', 'text on image', 'text over' ),
		'bento'             => array( 'bento', 'masonry', 'mosaic', 'collage', 'asymmetric' ),
		'vertical'          => array( 'vertical', 'sidebar', 'up and down', 'stacked' ),
		'filterable'        => array( 'filter', 'filters', 'filterable', 'filtering', 'sortable', 'tabs', 'dropdown', 'category', 'categories' ),
		'autoplay'          => array( 'autoplay', 'auto play', 'auto rotate', 'plays itself' ),
		'webgl'             => array( 'webgl', 'shader', 'shaders', 'distortion', 'morph', 'ripple', 'wave', 'waves', 'pixel', 'pixels', 'pixelate', 'glitch', 'liquid' ),
		'lightbox'          => array( 'lightbox', 'popup', 'pop up', 'modal', 'enlarge' ),
		'ajax'              => array( 'ajax', 'load more', 'loadmore', 'pagination', 'paginated', 'infinite scroll', 'lazy load', 'page numbers' ),
		'dark'              => array( 'dark', 'night', 'black background' ),
		'light'             => array( 'light', 'bright', 'white background' ),
		'minimal'           => array( 'minimal', 'clean', 'simple', 'subtle', 'understated', 'plain' ),
		'bold'              => array( 'bold', 'striking', 'dramatic', 'punchy', 'loud' ),

		// Blocks and engines (CategoryMap::BLOCK_MAP).
		'tiles'             => array( 'tiles', 'tile', 'grid', 'wall', 'masonry' ),
		'thumbnails-slider' => array( 'thumbnail', 'thumbnails', 'thumb', 'thumbs', 'film strip' ),

		// Recurring catalog keywords that no taxonomy term covers.
		'coverflow'         => array( 'coverflow', 'cover flow', '3d' ),
		'rating'            => array( 'rating', 'ratings', 'star', 'stars', 'rated', 'score' ),
		'rounded'           => array( 'rounded', 'round', 'soft corners' ),
		'grayscale'         => array( 'grayscale', 'greyscale', 'monochrome', 'black and white' ),
		'hover'             => array( 'hover', 'mouse over', 'on hover' ),
		'wall'              => array( 'wall', 'mosaic' ),
		'stage'             => array( 'stage', 'main image', 'big image' ),
	);

	/**
	 * Alias table indexed for lookup, built once per request.
	 *
	 * @var array{words: array<string, string[]>, phrases: array<string, string[]>, maxPhraseWords: int}|null
	 */
	private static $alias_map = null;

	/**
	 * Shortlist the patterns worth showing the model for a prompt.
	 *
	 * @param string $prompt     Natural language prompt.
	 * @param string $block_name Block the request is aimed at.
	 * @return array<int, array<string, mixed>> Manifest items, most relevant first.
	 */
	public static function shortlist( string $prompt, string $block_name = '' ): array {
		/**
		 * Filter whether the AI builder may answer a prompt with a Ready Pattern.
		 *
		 * Returning false sends every prompt down the attribute-generation path.
		 *
		 * @param bool $enabled Default enabled state.
		 */
		if ( ! PatternRepository::is_enabled() || ! apply_filters( 'wpcp_ai_pattern_first_enabled', true ) ) {
			return array();
		}

		$repository = new PatternRepository();

		return self::rank( $repository->get_manifest(), $prompt, $block_name );
	}

	/**
	 * Rank a manifest against a prompt and cut it down to the shortlist.
	 *
	 * @param array<int, array<string, mixed>> $items      Normalized manifest items.
	 * @param string                           $prompt     Natural language prompt.
	 * @param string                           $block_name Block the request is aimed at.
	 * @return array<int, array<string, mixed>> Manifest items, most relevant first.
	 */
	public static function rank( array $items, string $prompt, string $block_name = '' ): array {
		if ( empty( $items ) ) {
			return array();
		}

		$matchers = self::token_matchers( self::weighted_tokens( $prompt ) );
		if ( empty( $matchers ) ) {
			return array();
		}

		// A column count typed into the prompt is a hard requirement, and a pattern
		// on a single-slide block can never meet it — so those are cut before the
		// model sees them rather than left to win on wording. "Coverflow lookbook
		// stage — the active frame reads first, neighbours tilt away" outranked
		// every carousel candidate for a prompt that quoted almost that sentence
		// back and asked for 4 columns; it is a Slider pattern, so the request was
		// answered with one slide across and no sign anything had been dropped.
		$requested_columns = self::requested_column_count( $prompt );

		$scored = array();
		foreach ( $items as $index => $item ) {
			if ( ! is_array( $item ) || empty( $item['slug'] ) || empty( $item['blockName'] ) ) {
				continue;
			}

			// Free inserts only free-tier patterns; `insertPattern()` refuses the rest.
			if ( ! PatternRepository::is_free_item( $item ) ) {
				continue;
			}

			// A pattern this site cannot satisfy is never offered: the builder would
			// hand the editor a preflight dialog instead of the carousel it asked for.
			if ( ! self::requirements_met( $item['requires'] ?? array() ) ) {
				continue;
			}

			// Only a block with a front-end renderer that this site has switched on.
			$pattern_block_slug = AICatalogBuilder::slug( (string) $item['blockName'] );
			if ( ! isset( AICatalogBuilder::SCHEMA_MAP[ $pattern_block_slug ] ) || ! BlockVisibility::is_enabled( $pattern_block_slug ) ) {
				continue;
			}

			if ( null !== $requested_columns && ! AICatalogBuilder::renders_multiple_columns( $pattern_block_slug ) ) {
				continue;
			}

			$score = self::score_item( $item, $matchers, $block_name );
			if ( self::MIN_SCORE > $score ) {
				continue;
			}

			$scored[] = array(
				'score' => $score,
				'hit'   => isset( $item['hit'] ) ? (int) $item['hit'] : 0,
				'index' => $index,
				'item'  => $item,
			);
		}

		usort(
			$scored,
			static function ( $left, $right ) {
				// Rounded: two patterns that score within a hundredth of each other are
				// equally relevant, and popularity is the better answer than manifest order.
				$left_score  = round( $left['score'], 2 );
				$right_score = round( $right['score'], 2 );
				if ( $left_score !== $right_score ) {
					return $left_score < $right_score ? 1 : -1;
				}

				if ( $left['hit'] !== $right['hit'] ) {
					return $left['hit'] < $right['hit'] ? 1 : -1;
				}

				return $left['index'] <=> $right['index'];
			}
		);

		$candidates = array();
		foreach ( array_slice( $scored, 0, self::MAX_CANDIDATES ) as $entry ) {
			$candidates[] = $entry['item'];
		}

		return $candidates;
	}

	/**
	 * The weighted vocabulary a prompt resolves to, alias expansion included.
	 *
	 * The same read of the prompt that ranks patterns also answers "which block
	 * is this person describing?": `TERM_ALIASES` already carries block-slug rows
	 * (`carousel-panorama`, `marquee`, `tiles`, …), so a prompt saying "panoramic"
	 * or "ticker" comes back carrying that slug as a term. Exposing the tokenizer
	 * rather than copying it keeps `AIBlockRouter` on one vocabulary with the
	 * pattern shortlist — a phrasing added to an alias row reaches both.
	 *
	 * @param string $prompt Natural language prompt.
	 * @return array<string, float> Term => weight; `GENERIC_WEIGHT` marks a term
	 *                              that only names the container ("carousel").
	 */
	public static function prompt_terms( string $prompt ): array {
		return self::weighted_tokens( $prompt );
	}

	/**
	 * Weight below which a term is only naming the container, not choosing one.
	 *
	 * @return float
	 */
	public static function generic_term_weight(): float {
		return self::GENERIC_WEIGHT;
	}

	/**
	 * Read a column count the prompt states outright ("5-column", "5 columns").
	 *
	 * PHP twin of `extractColumnCount()` in the editor's `columnOverride.js`,
	 * which enforces the same number onto whatever the AI produces. Both clamp to
	 * the 1-12 range of the real control. A count of 1 is not a multi-column
	 * requirement, so it reads as none here.
	 *
	 * @param string $prompt Natural language prompt.
	 * @return int|null Requested count above 1, or null when the prompt names none.
	 */
	public static function requested_column_count( string $prompt ): ?int {
		if ( 1 !== preg_match( '/(\d+)\s*[- ]?\s*columns?\b/i', $prompt, $matches ) ) {
			return null;
		}

		$columns = min( 12, (int) $matches[1] );

		return 1 < $columns ? $columns : null;
	}

	/**
	 * Render candidates as compact pipe-delimited lines for the model.
	 *
	 * @param array<int, array<string, mixed>> $candidates Shortlisted manifest items.
	 * @return string
	 */
	public static function to_prompt_payload( array $candidates ): string {
		$lines = array();

		foreach ( $candidates as $item ) {
			$description = isset( $item['description'] ) ? (string) $item['description'] : '';
			if ( mb_strlen( $description ) > self::DESCRIPTION_LIMIT ) {
				$description = mb_substr( $description, 0, self::DESCRIPTION_LIMIT ) . '…';
			}

			$lines[] = implode(
				' | ',
				array(
					(string) $item['slug'],
					isset( $item['name'] ) ? (string) $item['name'] : '',
					str_replace( 'wp-carousel-pro/', '', (string) $item['blockName'] ),
					implode( ',', isset( $item['useCases'] ) && is_array( $item['useCases'] ) ? $item['useCases'] : array() ),
					implode( ',', isset( $item['tags'] ) && is_array( $item['tags'] ) ? $item['tags'] : array() ),
					isset( $item['sourceType'] ) ? (string) $item['sourceType'] : '',
					isset( $item['complexity'] ) ? (string) $item['complexity'] : '',
					str_replace( array( "\r", "\n", '|' ), ' ', $description ),
				)
			);
		}

		return implode( "\n", $lines );
	}

	/**
	 * Resolve the model's selection against the shortlist it was given.
	 *
	 * A slug outside the shortlist is a hallucination, not a pick, so it resolves
	 * to no match and the builder falls through to attribute generation.
	 *
	 * @param array<string, mixed>             $selection  Parsed model response.
	 * @param array<int, array<string, mixed>> $candidates Shortlist handed to the model.
	 * @return array{pattern: array<string, mixed>, confidence: float, reason: string}|null
	 */
	public static function resolve_selection( array $selection, array $candidates ): ?array {
		$slug = '';
		foreach ( array( 'slug', 'patternSlug', 'pattern_slug' ) as $key ) {
			if ( ! empty( $selection[ $key ] ) && is_scalar( $selection[ $key ] ) ) {
				$slug = sanitize_title( (string) $selection[ $key ] );
				break;
			}
		}

		if ( '' === $slug ) {
			return null;
		}

		$confidence = self::ASSUMED_CONFIDENCE;
		if ( isset( $selection['confidence'] ) && is_numeric( $selection['confidence'] ) ) {
			$confidence = (float) $selection['confidence'];
		}

		if ( $confidence < self::MIN_CONFIDENCE ) {
			return null;
		}

		foreach ( $candidates as $item ) {
			if ( ! isset( $item['slug'] ) || $slug !== (string) $item['slug'] ) {
				continue;
			}

			return array(
				'pattern'    => $item,
				'confidence' => $confidence,
				'reason'     => isset( $selection['reason'] ) && is_scalar( $selection['reason'] )
					? sanitize_text_field( (string) $selection['reason'] )
					: '',
			);
		}

		return null;
	}

	/**
	 * Whether a pattern may replace what the target block already holds.
	 *
	 * A pattern insert brings its own content, so it is offered only while the block
	 * is still unconfigured — a prompt aimed at a block that already carries the
	 * user's images or query is a refinement request, and refinements go through
	 * attribute generation. Mirrors `needsSetup()` in the editor's CarouselEdit.
	 *
	 * @param array<string, mixed> $attributes Existing block attributes.
	 * @return bool
	 */
	public static function allows_pattern_insert( array $attributes ): bool {
		if ( empty( $attributes ) ) {
			return true;
		}

		// Demo items are scaffolding a previous AI or pattern insert added, not content.
		if ( ! empty( $attributes['patternDemo'] ) ) {
			return true;
		}

		$source_type = isset( $attributes['sourceType'] ) ? (string) $attributes['sourceType'] : '';
		if ( '' === $source_type ) {
			return true;
		}

		if ( in_array( $source_type, array( 'post', 'product' ), true ) ) {
			return false;
		}

		$items = isset( $attributes['items'] ) && is_array( $attributes['items'] ) ? $attributes['items'] : array();

		return empty( $items );
	}

	/**
	 * Whether this site satisfies a pattern's declared requirements.
	 *
	 * Mirrors the editor's `describeRequirements()`: an unknown plugin or module
	 * slug counts as met, so a server-side addition cannot silently hide the whole
	 * catalog from the builder.
	 *
	 * @param mixed $requires Normalized `requires` block.
	 * @return bool
	 */
	public static function requirements_met( $requires ): bool {
		if ( ! is_array( $requires ) ) {
			return true;
		}

		$plugins = isset( $requires['plugins'] ) && is_array( $requires['plugins'] ) ? $requires['plugins'] : array();
		foreach ( $plugins as $plugin_slug ) {
			if ( ! self::is_plugin_active( (string) $plugin_slug ) ) {
				return false;
			}
		}

		$modules = isset( $requires['modules'] ) && is_array( $requires['modules'] ) ? $requires['modules'] : array();
		foreach ( $modules as $module_slug ) {
			if ( ! Dashboard::is_module_active( (string) $module_slug ) ) {
				return false;
			}
		}

		$sources = isset( $requires['sources'] ) && is_array( $requires['sources'] ) ? $requires['sources'] : array();
		foreach ( $sources as $source_slug ) {
			if ( 'product' === $source_slug && ! self::is_plugin_active( 'woocommerce' ) ) {
				return false;
			}
		}

		$min_version = isset( $requires['minPluginVersion'] ) ? (string) $requires['minPluginVersion'] : '';
		if ( '' !== $min_version && version_compare( WPCAROUSELF_VERSION, $min_version, '<' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Whether a required companion plugin is active.
	 *
	 * @param string $slug Plugin slug.
	 * @return bool
	 */
	private static function is_plugin_active( string $slug ): bool {
		if ( 'woocommerce' === $slug ) {
			return class_exists( 'WooCommerce' );
		}

		return true;
	}

	/**
	 * Relevance score for one manifest item.
	 *
	 * @param array<string, mixed>                               $item       Manifest item.
	 * @param array<string, array{weight: float, regex: string}> $matchers   Prompt token matchers.
	 * @param string                                             $block_name Block the request is aimed at.
	 * @return float
	 */
	private static function score_item( array $item, array $matchers, string $block_name ): float {
		$name        = isset( $item['name'] ) ? strtolower( (string) $item['name'] ) : '';
		$description = isset( $item['description'] ) ? strtolower( (string) $item['description'] ) : '';
		$terms       = self::item_terms( $item );
		$terms_blob  = implode( ' ', $terms );
		$haystack    = $name . ' ' . $description . ' ' . $terms_blob;
		$score       = 0.0;

		foreach ( $matchers as $key => $matcher ) {
			$token = (string) $key;

			// Cheap gate: a token absent from every field cannot score, and skipping
			// it here keeps the regex passes off the great majority of the catalog.
			if ( false === strpos( $haystack, $token ) ) {
				continue;
			}

			$weight = $matcher['weight'];

			if ( in_array( $token, $terms, true ) ) {
				$score += 4 * $weight;
			} elseif ( 1 === preg_match( $matcher['regex'], $terms_blob ) ) {
				$score += 2 * $weight;
			}

			if ( '' !== $name && 1 === preg_match( $matcher['regex'], $name ) ) {
				$score += 5 * $weight;
			}

			if ( '' !== $description && 1 === preg_match( $matcher['regex'], $description ) ) {
				$score += 1.5 * $weight;
			}
		}

		// A nudge, not a filter: the request's block is a default as often as it is a
		// choice, and a prompt that names another block should still reach it.
		if ( '' !== $block_name && isset( $item['blockName'] ) && $block_name === $item['blockName'] ) {
			$score += 2;
		}

		return $score;
	}

	/**
	 * Compile one whole-word matcher per prompt token.
	 *
	 * Whole words only: substring matching let "car" score every pattern with
	 * "cards" in it. The optional plural suffix keeps "photo" reaching "photos"
	 * without reopening that door.
	 *
	 * @param array<string, float> $weighted_tokens Token => weight.
	 * @return array<string, array{weight: float, regex: string}>
	 */
	private static function token_matchers( array $weighted_tokens ): array {
		$matchers = array();

		foreach ( $weighted_tokens as $token => $weight ) {
			$matchers[ (string) $token ] = array(
				'weight' => $weight,
				'regex'  => '/\b' . preg_quote( (string) $token, '/' ) . '(?:s|es)?\b/',
			);
		}

		return $matchers;
	}

	/**
	 * Collect a manifest item's searchable slugs.
	 *
	 * @param array<string, mixed> $item Manifest item.
	 * @return string[]
	 */
	private static function item_terms( array $item ): array {
		$terms = array();

		foreach ( array( 'useCases', 'tags', 'keywords', 'blocks' ) as $key ) {
			if ( empty( $item[ $key ] ) || ! is_array( $item[ $key ] ) ) {
				continue;
			}

			foreach ( $item[ $key ] as $value ) {
				if ( ! is_scalar( $value ) ) {
					continue;
				}

				$terms = array_merge( $terms, self::split_terms( (string) $value ) );
			}
		}

		foreach ( array( 'category', 'sourceType', 'complexity', 'family', 'type', 'blockName' ) as $key ) {
			if ( empty( $item[ $key ] ) || ! is_scalar( $item[ $key ] ) ) {
				continue;
			}

			$terms = array_merge( $terms, self::split_terms( (string) $item[ $key ] ) );
		}

		return array_values( array_unique( $terms ) );
	}

	/**
	 * Split a slug or phrase into lowercase terms, keeping the whole slug too.
	 *
	 * @param string $value Raw value.
	 * @return string[]
	 */
	private static function split_terms( string $value ): array {
		$value = strtolower( trim( $value ) );
		if ( '' === $value ) {
			return array();
		}

		$value = str_replace( 'wp-carousel-pro/', '', $value );
		$parts = preg_split( '/[^a-z0-9]+/', $value );
		$terms = array( $value );

		if ( ! is_array( $parts ) ) {
			return $terms;
		}

		foreach ( $parts as $part ) {
			if ( '' !== $part ) {
				$terms[] = $part;
			}
		}

		return $terms;
	}

	/**
	 * Tokenize a prompt into scored terms, expanding implied vocabulary.
	 *
	 * @param string $prompt Natural language prompt.
	 * @return array<string, float> Token => weight.
	 */
	private static function weighted_tokens( string $prompt ): array {
		$normalized = strtolower( wp_strip_all_tags( $prompt ) );
		$words      = preg_split( '/[^a-z0-9]+/', $normalized, -1, PREG_SPLIT_NO_EMPTY );
		$tokens     = array();

		if ( ! is_array( $words ) || empty( $words ) ) {
			return $tokens;
		}

		foreach ( $words as $word ) {
			if ( ! self::is_matchable_word( $word ) ) {
				continue;
			}

			$tokens[ $word ] = self::base_weight( $word );
		}

		// A plural in the prompt ("ratings") must still reach a candidate whose tags
		// or description only carry the singular ("rating") — patterns are hand-written
		// prose, not guaranteed to mirror the user's grammar.
		foreach ( array_keys( $tokens ) as $token ) {
			$stem = self::stem( (string) $token );
			if ( $stem !== $token && ! isset( $tokens[ $stem ] ) ) {
				$tokens[ $stem ] = self::SYNONYM_WEIGHT;
			}
		}

		$aliases = self::alias_map();

		foreach ( array_keys( $tokens ) as $token ) {
			self::add_implied_terms( $tokens, $aliases['words'][ $token ] ?? array() );
		}

		// Phrases run over the raw words, not the filtered tokens: "add to cart" and
		// "call to action" are carried by words that are stop words on their own.
		foreach ( self::phrases( $words, $aliases['maxPhraseWords'] ) as $phrase ) {
			self::add_implied_terms( $tokens, $aliases['phrases'][ $phrase ] ?? array() );
		}

		return $tokens;
	}

	/**
	 * Whether a prompt word is worth scoring.
	 *
	 * @param string $word Lowercase prompt word.
	 * @return bool
	 */
	private static function is_matchable_word( string $word ): bool {
		if ( in_array( $word, self::STOP_WORDS, true ) ) {
			return false;
		}

		// A bare number ("3 columns") describes a setting, not a pattern's subject.
		if ( 1 === preg_match( '/^\d+$/', $word ) ) {
			return false;
		}

		if ( 3 > strlen( $word ) ) {
			return in_array( $word, self::SHORT_TERMS, true );
		}

		return true;
	}

	/**
	 * Starting weight for a prompt word.
	 *
	 * @param string $word Lowercase prompt word.
	 * @return float
	 */
	private static function base_weight( string $word ): float {
		return in_array( $word, self::GENERIC_TERMS, true ) ? self::GENERIC_WEIGHT : 1.0;
	}

	/**
	 * Add the taxonomy terms a prompt word or phrase implies.
	 *
	 * Implied terms never outrank what the user actually typed, and never lift a
	 * weight already assigned.
	 *
	 * @param array<string, float> $tokens         Token => weight, by reference.
	 * @param string[]             $implied_terms  Canonical terms the prompt implies.
	 * @return void
	 */
	private static function add_implied_terms( array &$tokens, array $implied_terms ): void {
		foreach ( $implied_terms as $implied ) {
			foreach ( self::split_terms( $implied ) as $term ) {
				if ( isset( $tokens[ $term ] ) ) {
					continue;
				}

				$tokens[ $term ] = in_array( $term, self::GENERIC_TERMS, true )
					? self::GENERIC_WEIGHT
					: self::SYNONYM_WEIGHT;
			}
		}
	}

	/**
	 * Every consecutive word run in a prompt, longest first.
	 *
	 * @param string[] $words     Prompt words in order.
	 * @param int      $max_words Longest alias phrase in the table.
	 * @return string[]
	 */
	private static function phrases( array $words, int $max_words ): array {
		$phrases = array();
		$count   = count( $words );

		for ( $length = $max_words; 2 <= $length; $length-- ) {
			for ( $start = 0; $count >= $start + $length; $start++ ) {
				$phrases[] = implode( ' ', array_slice( $words, $start, $length ) );
			}
		}

		return $phrases;
	}

	/**
	 * Alias table indexed for lookup: single words, phrases, longest phrase length.
	 *
	 * @return array{words: array<string, string[]>, phrases: array<string, string[]>, maxPhraseWords: int}
	 */
	private static function alias_map(): array {
		if ( null !== self::$alias_map ) {
			return self::$alias_map;
		}

		$words            = array();
		$phrases          = array();
		$max_phrase_words = 2;

		foreach ( self::TERM_ALIASES as $canonical => $aliases ) {
			foreach ( $aliases as $alias ) {
				$parts = preg_split( '/\s+/', trim( (string) $alias ), -1, PREG_SPLIT_NO_EMPTY );
				if ( ! is_array( $parts ) || empty( $parts ) ) {
					continue;
				}

				$alias_key = implode( ' ', $parts );

				if ( 1 === count( $parts ) ) {
					$words[ $alias_key ][] = (string) $canonical;
					continue;
				}

				$phrases[ $alias_key ][] = (string) $canonical;
				$max_phrase_words        = max( $max_phrase_words, count( $parts ) );
			}
		}

		self::$alias_map = array(
			'words'          => $words,
			'phrases'        => $phrases,
			'maxPhraseWords' => $max_phrase_words,
		);

		return self::$alias_map;
	}

	/**
	 * Strip a naive trailing plural so "ratings" also reaches "rating".
	 *
	 * Not a real stemmer — just enough to cover simple plurals without mangling
	 * words that already end in a double "s" ("boxes" → keep, not "boxe").
	 *
	 * @param string $token Lowercase token.
	 * @return string Singular form, or the token unchanged when stemming is unsafe.
	 */
	private static function stem( string $token ): string {
		if ( strlen( $token ) < 4 || 's' !== substr( $token, -1 ) || 'ss' === substr( $token, -2 ) ) {
			return $token;
		}

		return substr( $token, 0, -1 );
	}
}
