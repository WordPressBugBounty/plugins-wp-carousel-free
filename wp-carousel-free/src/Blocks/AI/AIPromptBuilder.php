<?php
/**
 * AI Prompt Builder
 *
 * Constructs system and user prompts for translating natural language into WP Carousel block attributes.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

defined( 'ABSPATH' ) || exit;

/**
 * AIPromptBuilder class.
 */
class AIPromptBuilder {

	/**
	 * Largest "current values" echo sent on a refine. The schema defaults alone
	 * are about 7 KB; anything far past that is padding, not settings.
	 */
	const MAX_CURRENT_VALUES_BYTES = 24000;

	/**
	 * Get the system prompt instructing LLM to generate valid attribute JSON.
	 *
	 * The attribute catalog is block-specific: each block reads only the options
	 * that apply to it, not the full PHP schema tree (see `AICatalogBuilder`).
	 *
	 * @param string $block_name Target block slug.
	 * @return string System prompt.
	 */
	public static function get_system_prompt( string $block_name = 'wp-carousel-pro/carousel' ): string {
		$catalog  = AICatalogBuilder::get_catalog( $block_name );
		$rules    = self::design_rules();
		$examples = self::worked_examples( AICatalogBuilder::slug( $block_name ) );

		return "You are a senior web designer configuring the WP Carousel plugin inside the WordPress block editor.
Your job is to translate a user's natural language prompt into a finished, presentable configuration for the \"{$block_name}\" block — not the smallest set of settings that technically answers the words.

Output Requirements:
1. Output ONLY a valid raw JSON object containing only block attributes. Do NOT wrap in markdown or backticks (e.g. no ```json).
2. Structure your JSON response to mutate properties inside appropriate attribute objects. Attributes available for this block:
{$catalog}
3. Return only valid block attributes matching the catalog above. Do not invent keys, and never use a value the catalog does not list — an unlisted value is discarded and the setting silently stays at its default.

Design Rules:
{$rules}

Worked Examples (these show the expected shape and level of finish — adapt the values to the actual request, never copy them):
{$examples}";
	}

	/**
	 * The design rules a generated configuration is judged against.
	 *
	 * Attribute generation runs only when no Ready Pattern fits, so its output is
	 * the whole answer — and the schema defaults it starts from are deliberately
	 * plain (no card fill, no shadow, zero padding on the Classic orientation).
	 * Left to the catalog alone a model returns the two or three settings the
	 * prompt literally names and stops, which reads as unfinished next to a
	 * pattern. These are the decisions that separate the two, plus the
	 * combinations that quietly cancel each other out at render time.
	 *
	 * @return string Numbered rule list.
	 */
	private static function design_rules(): string {
		return '1. Answer the whole request, then finish the design. Every setting the prompt names is mandatory; beyond those, set the few more that make the result look deliberate (spacing, type scale, a card treatment or an image scrim) and leave everything else alone.
2. Give text room. On the "image-top" orientation the card has no padding by default, so whenever the card gets a background, a border, or a shadow, set "contentAreaOptions.contentPadding" (roughly 20-24px) or the text sits flush against the card edge. The overlay and diagonal orientations already carry their own inset.
3. Keep text readable over images. With "overlay" or "diagonal", keep "imageOptions.overlay": true and give it a dark scrim ("overlayColor" + "opacity" around 35-55) so light text stays legible on a bright photo.
4. Set the responsive trio together. Whenever you set "columns", also set "columnsTablet" and "columnsMobile" (a sensible ladder is 4/2/1, 3/2/1, or 2/1/1) — otherwise the block keeps unrelated defaults on smaller screens.
5. Respect what a value implies. "flip" and "cube" show a single slide, so pair them with "columns": 1. Autoplay is only comfortable with "pauseOnHover": true. Turning "pagination" on is worth a "paginationDotsOptions" color that contrasts with the surrounding background.
6. Choose type deliberately. A card title is usually 18-22px at weight 600-700; body text 14-16px at a 1.5-1.7 line height. Set colors as a pair — a near-black title on a light card, near-white on a dark or overlaid one — and keep enough contrast to read.
7. Match the subject. A testimonial or team layout wants a padded card with a soft shadow; a logo strip wants generous gaps, no card, no text; an editorial or hero layout wants a full-bleed image with overlaid type; a product grid wants a consistent aspect ratio and a light card fill.
8. Prefer restraint. One accent color, one shadow depth, one radius across the block. Do not set an option the request neither asks for nor needs.';
	}

	/**
	 * Two complete responses, one per common shape of request.
	 *
	 * A bare type listing tells a model what it may write but nothing about how
	 * much to write; these fix the expected level of finish. They are deliberately
	 * different from each other (Classic card vs. overlaid editorial, light vs.
	 * dark, different attribute groups) so the pair reads as a range to work
	 * within rather than a template to reproduce.
	 *
	 * The orientation and the card's padding key are resolved per block: an
	 * example is only worth showing if the block it is shown to could have
	 * produced it — the slider has no "image-top", and `contentPadding` is a
	 * Classic-only inset.
	 *
	 * @param string $slug Block slug, without the `wp-carousel-pro/` prefix.
	 * @return string Prompt/response pairs.
	 */
	private static function worked_examples( string $slug ): string {
		$orientations     = AICatalogBuilder::content_orientations( $slug );
		$card_orientation = in_array( 'image-top', $orientations, true ) ? 'image-top' : (string) reset( $orientations );
		$card_padding_key = 'image-top' === $card_orientation ? 'contentPadding' : 'padding';

		// Tiles drops the inherited single-axis `gap` for a split horizontal/vertical
		// pair, so the example has to name whichever one that block actually has.
		$card_gap = 'tiles' === $slug
			? array(
				'gapHorizontal' => 28,
				'gapVertical'   => 28,
			)
			: array( 'gap' => 28 );

		$card_example = wp_json_encode(
			array(
				'sourceType'         => 'image',
				'layoutOptions'      => array_merge(
					array(
						'columns'       => 3,
						'columnsTablet' => 2,
						'columnsMobile' => 1,
					),
					$card_gap,
					array(
						'navigation'         => true,
						'pagination'         => false,
						'contentOrientation' => $card_orientation,
					)
				),
				'imageOptions'       => array(
					'aspectRatio'  => '1:1',
					'borderRadius' => array(
						'allChange' => true,
						'unit'      => array( 'Desktop' => 'px' ),
						'device'    => array(
							'Desktop' => array(
								'top'    => 10,
								'right'  => 10,
								'bottom' => 10,
								'left'   => 10,
							),
						),
					),
				),
				'contentOptions'     => array(
					'showTitle'       => true,
					'showDescription' => true,
					'alignment'       => 'center',
					'titleTag'        => 'h4',
					'titleColor'      => '#111827',
					'descColor'       => '#4b5563',
					'titleTypography' => array(
						'fontWeight' => '600',
						'fontSize'   => array(
							'device' => array(
								'Desktop' => 20,
								'Mobile'  => 18,
							),
							'unit'   => array( 'Desktop' => 'px' ),
						),
					),
					'descTypography'  => array(
						'fontSize'   => array(
							'device' => array( 'Desktop' => 15 ),
							'unit'   => array( 'Desktop' => 'px' ),
						),
						'lineHeight' => array( 'device' => array( 'Desktop' => 1.6 ) ),
					),
				),
				'contentAreaOptions' => array(
					'contentAreaBackground' => array(
						'color' => array(
							'style' => 'solid',
							'solid' => '#ffffff',
						),
					),
					$card_padding_key       => array(
						'allChange' => true,
						'unit'      => array( 'Desktop' => 'px' ),
						'device'    => array(
							'Desktop' => array(
								'top'    => 24,
								'right'  => 24,
								'bottom' => 24,
								'left'   => 24,
							),
						),
					),
					'borderRadius'          => array(
						'allChange' => true,
						'unit'      => array( 'Desktop' => 'px' ),
						'device'    => array(
							'Desktop' => array(
								'top'    => 12,
								'right'  => 12,
								'bottom' => 12,
								'left'   => 12,
							),
						),
					),
					'boxShadowNormalEnable' => true,
					'boxShadowNormal'       => array( 'selectDefault' => 'var(--wpcp-shadow-light-2dp)' ),
				),
			)
		);

		$overlay_attributes = array(
			'layoutOptions'  => array(
				'columns'            => 1,
				'columnsTablet'      => 1,
				'columnsMobile'      => 1,
				'navigation'         => true,
				'pagination'         => true,
				'contentOrientation' => in_array( 'overlay', $orientations, true ) ? 'overlay' : (string) reset( $orientations ),
			),
			'sliderOptions'  => array(
				'autoplay'      => true,
				'autoplayDelay' => 5000,
				'speed'         => 800,
				'pauseOnHover'  => true,
				'effect'        => 'slide',
			),
			'imageOptions'   => array(
				'aspectRatio'  => '21:9',
				'overlay'      => true,
				'overlayColor' => array(
					'style' => 'solid',
					'solid' => '#0b1220',
				),
				'opacity'      => array(
					'value' => 45,
					'unit'  => '%',
				),
			),
			'contentOptions' => array(
				'showTitle'       => true,
				'showDescription' => true,
				'alignment'       => 'left',
				'titleTag'        => 'h2',
				'titleColor'      => '#ffffff',
				'descColor'       => 'rgba(255,255,255,0.85)',
				'titleTypography' => array(
					'fontWeight' => '700',
					'fontSize'   => array(
						'device' => array(
							'Desktop' => 44,
							'Tablet'  => 34,
							'Mobile'  => 26,
						),
						'unit'   => array( 'Desktop' => 'px' ),
					),
					'lineHeight' => array( 'device' => array( 'Desktop' => 1.2 ) ),
				),
			),
		);

		// Only the blocks sharing PaginationNavigationDefaults have these
		// groups at all; showing them to Tiles would demonstrate a key
		// their own catalog never lists.
		if ( in_array( $slug, AICatalogBuilder::NAV_PAGINATION_BLOCKS, true ) ) {
			$overlay_attributes['paginationDotsOptions'] = array(
				'paginationStyle' => 'dynamic',
				'colorNormal'     => 'rgba(255,255,255,0.5)',
				'colorHover'      => '#ffffff',
				'alignment'       => 'left',
			);
		}

		$overlay_example = wp_json_encode( $overlay_attributes );

		$refine_example = wp_json_encode(
			array(
				'layoutOptions' => array(
					'columns'       => 4,
					'columnsTablet' => 2,
					'columnsMobile' => 1,
				),
			)
		);

		$examples = "Request: \"a 3-column testimonial carousel with rounded cards\"\nResponse: {$card_example}\n\nRequest: \"full width hero slideshow, dark, big headline, autoplay\"\nResponse: {$overlay_example}\n\nRequest (a refinement of an existing block): \"make it 4 across\"\nResponse: {$refine_example}";

		return $examples;
	}

	/**
	 * Get the system prompt for picking a Ready Pattern from a shortlist.
	 *
	 * @return string System prompt.
	 */
	public static function get_pattern_selection_prompt(): string {
		return 'You match a WordPress user\'s request to one pre-built WP Carousel "Ready Pattern".

You are given candidate patterns as pipe-delimited lines:
slug | name | block | use-cases | tags | source | complexity | description

Output Requirements:
1. Output ONLY a raw JSON object. No markdown, no backticks, no prose.
2. Shape: {"slug": "<candidate slug or empty string>", "confidence": <number between 0 and 1>, "reason": "<max 20 words>"}
3. Pick a candidate only when it genuinely delivers what the user asked for — the same subject matter (testimonials, logos, products, gallery, hero, …) and a compatible layout or block.
4. A pattern that merely shares a block type is NOT a match. Prefer an empty slug over a loose one.
5. Set "slug" to "" when no candidate fits, when the request is only about settings (columns, speed, colors, autoplay) rather than a design, or when you are unsure.
6. Never invent a slug: it must be copied exactly from a candidate line.
7. A candidate whose block cannot deliver a structural property the request states outright — a column count, a grid, a vertical direction — is not a match however closely its wording fits. The "slider" and "thumbnails-slider" blocks always show one item across.
8. "confidence" reflects how well the chosen candidate satisfies the request; below 0.6 the pattern is discarded.';
	}

	/**
	 * Build the user message for pattern selection.
	 *
	 * @param string $prompt     Natural language user prompt.
	 * @param string $block_name Target block name.
	 * @param string $candidates Pipe-delimited candidate lines.
	 * @return string User prompt string.
	 */
	public static function build_pattern_selection_message( string $prompt, string $block_name, string $candidates ): string {
		$message  = "Requested Block: {$block_name} (a default unless the request names another block)\n";
		$message .= "User Request: \"{$prompt}\"\n\n";
		$message .= "Candidate Patterns:\n{$candidates}\n\n";
		$message .= 'Return the selection JSON:';

		return $message;
	}

	/**
	 * Build user prompt with block context.
	 *
	 * On a refine, the model only sees today's value for the options its own
	 * catalog covers — not the block's full attribute tree. Everything outside
	 * that (align, colors, typography, the raw `items` array, …) is preserved by
	 * `AISchemaValidator::sanitize_and_merge()` on the PHP side regardless of
	 * whether the model ever saw it, so showing it here would only cost tokens.
	 *
	 * @param string $prompt Natural language user prompt.
	 * @param string $block_name Target block name.
	 * @param array  $existing_attributes Existing block attributes if updating.
	 * @return string User prompt string.
	 */
	public static function build_user_message( string $prompt, string $block_name = 'wp-carousel-pro/carousel', array $existing_attributes = array() ): string {
		$message  = "Target Block: {$block_name}\n";
		$message .= "User Request: \"{$prompt}\"\n";

		$relevant_keys  = AICatalogBuilder::catalog_relevant_keys_for_block( $block_name );
		$current_values = array_intersect_key( $existing_attributes, array_flip( $relevant_keys ) );
		$encoded        = empty( $current_values ) ? '' : (string) wp_json_encode( $current_values );

		// Oversized values are dropped, not sent: the merge keeps them either way.
		if ( '' !== $encoded && self::MAX_CURRENT_VALUES_BYTES >= strlen( $encoded ) ) {
			$message .= 'Current Values (only for the options above — unlisted options already have a value, leave them alone): ' . $encoded . "\n";
		}

		$message .= 'Generate updated attribute JSON, including only the keys you are changing plus anything the catalog requires alongside them:';

		return $message;
	}
}
