<?php
/**
 * AI Demo Image Library
 *
 * Topic-matched placeholder images for the AI builder's attribute-generation
 * fallback. Without this, every image-source block with no items ends up
 * showing the exact same five photos regardless of what the prompt asked
 * for — a "team" prompt and a "product" prompt both getting landscape shots
 * reads as broken, not just generic.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\AI;

defined( 'ABSPATH' ) || exit;

/**
 * AIDemoImageLibrary class.
 */
class AIDemoImageLibrary {

	/**
	 * Prompt keyword => bucket name. First match wins, checked in declaration order.
	 *
	 * @var array<string, string[]>
	 */
	const KEYWORD_BUCKETS = array(
		'team'         => array( 'team', 'staff', 'employee', 'member', 'people' ),
		'testimonials' => array( 'testimonial', 'review', 'quote', 'customer', 'client' ),
		'product'      => array( 'product', 'shop', 'store', 'ecommerce', 'e-commerce', 'cart', 'price' ),
		'food'         => array( 'food', 'restaurant', 'menu', 'recipe', 'dish', 'cafe', 'bakery' ),
		'portfolio'    => array( 'portfolio', 'project', 'architecture', 'property', 'real estate', 'interior', 'building' ),
		'tech'         => array( 'tech', 'software', 'code', 'developer', 'saas', 'startup', 'app' ),
	);

	/**
	 * Photo id + copy per bucket. IDs are Unsplash CDN photo ids
	 * (images.unsplash.com/photo-<id>), each verified to resolve before landing here.
	 *
	 * @var array<string, array<int, array<string, string>>>
	 */
	const PHOTOS = array(
		'default'      => array(
			array(
				'id'      => '1506744038136-46273834b3fb',
				'title'   => 'Carousel Item 1',
				'caption' => 'Beautiful Landscape',
			),
			array(
				'id'      => '1511884642898-4c92249e20b6',
				'title'   => 'Carousel Item 2',
				'caption' => 'Mountain View',
			),
			array(
				'id'      => '1470071459604-3b5ec3a7fe05',
				'title'   => 'Carousel Item 3',
				'caption' => 'Foggy Forest',
			),
			array(
				'id'      => '1447752875215-b2761acb3c5d',
				'title'   => 'Carousel Item 4',
				'caption' => 'Autumn Trees',
			),
			array(
				'id'      => '1426604966848-d7adac402bff',
				'title'   => 'Carousel Item 5',
				'caption' => 'Sunset Valley',
			),
		),
		'team'         => array(
			array(
				'id'      => '1500648767791-00dcc994a43e',
				'title'   => 'Team Member',
				'caption' => 'Product Design',
			),
			array(
				'id'      => '1519085360753-af0119f7cbe7',
				'title'   => 'Team Member',
				'caption' => 'Engineering',
			),
			array(
				'id'      => '1522075469751-3a6694fb2f61',
				'title'   => 'Team Member',
				'caption' => 'Marketing',
			),
			array(
				'id'      => '1531123897727-8f129e1688ce',
				'title'   => 'Team Member',
				'caption' => 'Customer Success',
			),
			array(
				'id'      => '1544005313-94ddf0286df2',
				'title'   => 'Team Member',
				'caption' => 'Operations',
			),
		),
		'testimonials' => array(
			array(
				'id'      => '1438761681033-6461ffad8d80',
				'title'   => 'Happy Customer',
				'caption' => 'Verified Buyer',
			),
			array(
				'id'      => '1472099645785-5658abf4ff4e',
				'title'   => 'Happy Customer',
				'caption' => '5-Star Review',
			),
			array(
				'id'      => '1544723795-3fb6469f5b39',
				'title'   => 'Happy Customer',
				'caption' => 'Long-Time Client',
			),
			array(
				'id'      => '1560250097-0b93528c311a',
				'title'   => 'Happy Customer',
				'caption' => 'Repeat Customer',
			),
			array(
				'id'      => '1500917293891-ef795e70e1f6',
				'title'   => 'Happy Customer',
				'caption' => 'Verified Buyer',
			),
		),
		'product'      => array(
			array(
				'id'      => '1523275335684-37898b6baf30',
				'title'   => 'Product One',
				'caption' => 'Best Seller',
			),
			array(
				'id'      => '1542291026-7eec264c27ff',
				'title'   => 'Product Two',
				'caption' => 'New Arrival',
			),
			array(
				'id'      => '1560343090-f0409e92791a',
				'title'   => 'Product Three',
				'caption' => 'Limited Edition',
			),
			array(
				'id'      => '1505740420928-5e560c06d30e',
				'title'   => 'Product Four',
				'caption' => 'Staff Pick',
			),
			array(
				'id'      => '1526170375885-4d8ecf77b99f',
				'title'   => 'Product Five',
				'caption' => 'On Sale',
			),
		),
		'food'         => array(
			array(
				'id'      => '1504674900247-0877df9cc836',
				'title'   => 'Signature Dish',
				'caption' => "Chef's Special",
			),
			array(
				'id'      => '1546069901-ba9599a7e63c',
				'title'   => 'House Burger',
				'caption' => 'Customer Favorite',
			),
			array(
				'id'      => '1567620905732-2d1ec7ab7445',
				'title'   => 'Wood-Fired Pizza',
				'caption' => 'Made Fresh Daily',
			),
			array(
				'id'      => '1512621776951-a57141f2eefd',
				'title'   => 'Weekend Special',
				'caption' => 'Limited Time',
			),
			array(
				'id'      => '1467003909585-2f8a72700288',
				'title'   => 'Morning Menu',
				'caption' => 'Brunch Favorite',
			),
		),
		'portfolio'    => array(
			array(
				'id'      => '1487958449943-2429e8be8625',
				'title'   => 'Project One',
				'caption' => 'Commercial',
			),
			array(
				'id'      => '1449844908441-8829872d2607',
				'title'   => 'Project Two',
				'caption' => 'Residential',
			),
			array(
				'id'      => '1493809842364-78817add7ffb',
				'title'   => 'Project Three',
				'caption' => 'Renovation',
			),
			array(
				'id'      => '1449034446853-66c86144b0ad',
				'title'   => 'Project Four',
				'caption' => 'Interior Design',
			),
			array(
				'id'      => '1507089947368-19c1da9775ae',
				'title'   => 'Project Five',
				'caption' => 'New Build',
			),
		),
		'tech'         => array(
			array(
				'id'      => '1518770660439-4636190af475',
				'title'   => 'Feature One',
				'caption' => 'Built for Scale',
			),
			array(
				'id'      => '1550751827-4bd374c3f58b',
				'title'   => 'Feature Two',
				'caption' => 'Developer First',
			),
			array(
				'id'      => '1487058792275-0ad4aaf24ca7',
				'title'   => 'Feature Three',
				'caption' => 'Open API',
			),
			array(
				'id'      => '1461749280684-dccba630e2f6',
				'title'   => 'Feature Four',
				'caption' => 'Secure by Default',
			),
			array(
				'id'      => '1498050108023-c5249f4df085',
				'title'   => 'Feature Five',
				'caption' => 'Fast Integration',
			),
		),
	);

	/**
	 * Pick the demo image set matching a prompt's subject.
	 *
	 * @param string $prompt User prompt.
	 * @return array<int, array<string, string>> Five demo item arrays.
	 */
	public static function get_items( string $prompt ): array {
		$normalized = strtolower( $prompt );

		foreach ( self::KEYWORD_BUCKETS as $bucket => $keywords ) {
			foreach ( $keywords as $keyword ) {
				if ( false !== strpos( $normalized, $keyword ) ) {
					return self::bucket( $bucket );
				}
			}
		}

		return self::bucket( 'default' );
	}

	/**
	 * Build the item array for one bucket.
	 *
	 * @param string $bucket Bucket name.
	 * @return array<int, array<string, string>>
	 */
	private static function bucket( string $bucket ): array {
		$photos = self::PHOTOS[ $bucket ] ?? self::PHOTOS['default'];

		$items = array();
		foreach ( $photos as $index => $photo ) {
			// Demo copy is a placeholder the user replaces with their own content, not
			// UI chrome, so it is not run through __() — translator functions require a
			// literal string argument, not one picked out of a data array at runtime.
			$url     = 'https://images.unsplash.com/photo-' . $photo['id'] . '?w=800&auto=format&fit=crop&q=80';
			$items[] = array(
				'id'          => 'wpcp-demo-image-' . ( $index + 1 ),
				'url'         => $url,
				'image_url'   => $url,
				'title'       => $photo['title'],
				'caption'     => $photo['caption'],
				'description' => __( 'Sample description for demonstration purposes.', 'wp-carousel-free' ),
				'alt'         => $photo['title'],
			);
		}

		return $items;
	}
}
