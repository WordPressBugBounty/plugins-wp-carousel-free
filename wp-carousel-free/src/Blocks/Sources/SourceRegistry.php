<?php
/**
 * Registry of content-source providers keyed by `sourceType`.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Sources;

defined( 'ABSPATH' ) || exit;

/**
 * SourceRegistry — single dispatch table for `AbstractBlock` and AJAX pagination.
 */
class SourceRegistry {

	/**
	 * Top-level source ids (mirrors `TOP_LEVEL_SOURCES` in allowedSources.js).
	 *
	 * @var string[]
	 */
	private const SOURCE_IDS = array(
		'image',
		'video',
		'post',
		'product',
	);

	/**
	 * Map source id → provider class.
	 *
	 * @var array<string, class-string<SourceInterface>>
	 */
	private const SOURCE_MAP = array(
		'image'   => ImageSource::class,
		'video'   => VideoSource::class,
		'post'    => PostSource::class,
		'product' => ProductSource::class,
	);

	/**
	 * All registered top-level source ids.
	 *
	 * @return string[]
	 */
	public static function ids(): array {
		return self::SOURCE_IDS;
	}

	/**
	 * Resolve a source provider for the given type.
	 *
	 * Unknown types fall back to `image` to match legacy `get_source_items()` behavior.
	 *
	 * @param string $source_type Source id.
	 * @return SourceInterface
	 */
	public static function for( string $source_type ): SourceInterface {
		$class = self::SOURCE_MAP[ $source_type ] ?? ImageSource::class;
		return new $class();
	}
}
