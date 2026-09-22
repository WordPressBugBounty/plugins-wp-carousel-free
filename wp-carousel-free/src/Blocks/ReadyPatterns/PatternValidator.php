<?php
/**
 * Ready Patterns ingest validation.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\ReadyPatterns;

use ShapedPlugin\WPCarouselFree\Blocks\BlockTypesController;

defined( 'ABSPATH' ) || exit;

/**
 * The server-side trust boundary for remote pattern payloads.
 *
 * A payload is markup from the pattern server that lands in post content, so the
 * set of blocks it may contain is deny-by-default. This mirrors
 * `blocks/blocks/shared/ready-patterns/patternBlockAllowList.js` rule for rule —
 * same allow-list, same limits, same reason codes — and the editor copy is the
 * convenience check, not the enforcement: a payload the client would refuse must
 * never leave the REST route. `tests/__tests__/free-boundary/patternAllowListMirror.spec.js`
 * fails the build when the two drift.
 *
 * Validation parses only. Nothing here renders, evaluates or enqueues anything
 * the remote server sent.
 */
class PatternValidator {

	/**
	 * Core blocks a pattern may use as structure around its WPCP blocks.
	 *
	 * Mirrors PATTERN_WRAPPER_ALLOW_LIST.
	 *
	 * @var string[]
	 */
	const WRAPPER_ALLOW_LIST = array(
		'core/group',
		'core/columns',
		'core/column',
		'core/heading',
		'core/paragraph',
		'core/buttons',
		'core/button',
		'core/spacer',
		'core/separator',
		'core/image',
	);

	/**
	 * Blocks refused by name as well as by omission.
	 *
	 * Deny-by-default already covers these; naming them keeps a later widening of
	 * the allow-list from admitting arbitrary markup or a shortcode by accident.
	 * Every `core-embed/*` provider is refused by prefix.
	 *
	 * @var string[]
	 */
	const DENIED_BLOCKS = array(
		'core/html',
		'core/shortcode',
		'core/freeform',
		'core/missing',
		'core/embed',
		'core/block',
		'core/pattern',
		'core/template-part',
	);

	/**
	 * Legacy embed block prefix, refused whole.
	 */
	const DENIED_BLOCK_PREFIX = 'core-embed/';

	/**
	 * Name a parser node with no block name is reported under, matching the block
	 * type the editor's `parse()` turns raw HTML into.
	 */
	const FREEFORM_BLOCK_NAME = 'core/freeform';

	/** Structural ingest limits — mirrors MAX_PATTERN_BLOCKS / DEPTH / BYTES. */
	const MAX_BLOCKS = 30;
	const MAX_DEPTH  = 4;
	const MAX_BYTES  = PatternRepository::MAX_PAYLOAD_BYTES;

	/** Rejection reasons returned by validate(). */
	const REJECT_EMPTY              = 'empty';
	const REJECT_DISALLOWED_BLOCK   = 'disallowed-block';
	const REJECT_UNREGISTERED_BLOCK = 'unregistered-block';
	const REJECT_NO_WPCP_BLOCK      = 'no-wpcp-block';
	const REJECT_TOO_MANY_BLOCKS    = 'too-many-blocks';
	const REJECT_TOO_DEEP           = 'too-deep';
	const REJECT_TOO_LARGE          = 'too-large';

	/**
	 * Whether serialized markup is safe to hand to the editor.
	 *
	 * @param string $markup Serialized block markup.
	 * @return bool
	 */
	public static function is_valid( string $markup ): bool {
		return (bool) self::validate( $markup )['valid'];
	}

	/**
	 * Validate serialized pattern markup against the allow-list and the limits.
	 *
	 * Fails closed: anything unrecognized, unparseable or over a limit is refused.
	 *
	 * @param string $markup Serialized block markup.
	 * @return array{valid: bool, reason: string, block_name: string}
	 */
	public static function validate( string $markup ): array {
		// Size is checked before parsing so a nesting bomb never becomes a tree.
		if ( strlen( $markup ) > self::MAX_BYTES ) {
			return self::failure( self::REJECT_TOO_LARGE );
		}

		if ( '' === trim( $markup ) ) {
			return self::failure( self::REJECT_EMPTY );
		}

		$blocks = self::significant_blocks( parse_blocks( $markup ) );

		if ( empty( $blocks ) ) {
			return self::failure( self::REJECT_EMPTY );
		}

		$state = array(
			'total'    => 0,
			'has_wpcp' => false,
			'failure'  => null,
		);

		self::walk( $blocks, 1, $state );

		if ( null !== $state['failure'] ) {
			return $state['failure'];
		}

		if ( ! $state['has_wpcp'] ) {
			return self::failure( self::REJECT_NO_WPCP_BLOCK );
		}

		return array(
			'valid'      => true,
			'reason'     => '',
			'block_name' => '',
		);
	}

	/**
	 * Walk a parsed level, recording the first failure in $state.
	 *
	 * @param array<int, array<string, mixed>> $nodes Parsed blocks at this level.
	 * @param int                              $depth Current depth, 1 for the roots.
	 * @param array<string, mixed>             $state Running totals and failure slot.
	 * @return void
	 */
	private static function walk( array $nodes, int $depth, array &$state ): void {
		if ( null !== $state['failure'] ) {
			return;
		}

		if ( $depth > self::MAX_DEPTH ) {
			$state['failure'] = self::failure( self::REJECT_TOO_DEEP );
			return;
		}

		foreach ( $nodes as $node ) {
			if ( null !== $state['failure'] ) {
				return;
			}

			$name = self::block_name( $node );
			++$state['total'];

			if ( $state['total'] > self::MAX_BLOCKS ) {
				$state['failure'] = self::failure( self::REJECT_TOO_MANY_BLOCKS );
				return;
			}

			if ( self::is_wpcp_block_name( $name ) ) {
				if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( $name ) ) {
					$state['failure'] = self::failure( self::REJECT_UNREGISTERED_BLOCK, $name );
					return;
				}
				$state['has_wpcp'] = true;
			} elseif ( self::is_denied_block_name( $name ) || ! in_array( $name, self::WRAPPER_ALLOW_LIST, true ) ) {
				$state['failure'] = self::failure( self::REJECT_DISALLOWED_BLOCK, $name );
				return;
			}

			$inner = isset( $node['innerBlocks'] ) && is_array( $node['innerBlocks'] )
				? self::significant_blocks( $node['innerBlocks'] )
				: array();

			if ( ! empty( $inner ) ) {
				self::walk( $inner, $depth + 1, $state );
			}
		}
	}

	/**
	 * Drop the whitespace-only nodes `parse_blocks()` emits between siblings.
	 *
	 * The editor's `parse()` discards them, so counting them here would reject a
	 * pattern for the blank lines its own serializer wrote. A node with no block
	 * name and actual content is real freeform HTML and stays, to be refused.
	 *
	 * @param array<int, array<string, mixed>> $nodes Parsed blocks.
	 * @return array<int, array<string, mixed>>
	 */
	private static function significant_blocks( array $nodes ): array {
		$significant = array();

		foreach ( $nodes as $node ) {
			if ( ! is_array( $node ) ) {
				continue;
			}

			$name = isset( $node['blockName'] ) ? $node['blockName'] : null;

			if ( ( null === $name || '' === $name ) && '' === trim( (string) ( $node['innerHTML'] ?? '' ) ) ) {
				continue;
			}

			$significant[] = $node;
		}

		return $significant;
	}

	/**
	 * Block name for a parsed node, naming raw HTML as freeform.
	 *
	 * @param array<string, mixed> $node Parsed block.
	 * @return string
	 */
	private static function block_name( array $node ): string {
		$name = isset( $node['blockName'] ) && is_string( $node['blockName'] ) ? $node['blockName'] : '';

		return '' === $name ? self::FREEFORM_BLOCK_NAME : $name;
	}

	/**
	 * Whether a block name belongs to this plugin.
	 *
	 * @param string $name Block name.
	 * @return bool
	 */
	private static function is_wpcp_block_name( string $name ): bool {
		return 0 === strpos( $name, BlockTypesController::NAMESPACE_PREFIX . '/' );
	}

	/**
	 * Whether a block name is refused by name.
	 *
	 * @param string $name Block name.
	 * @return bool
	 */
	private static function is_denied_block_name( string $name ): bool {
		return in_array( $name, self::DENIED_BLOCKS, true )
			|| 0 === strpos( $name, self::DENIED_BLOCK_PREFIX );
	}

	/**
	 * Build a rejection result.
	 *
	 * @param string $reason     Reason code.
	 * @param string $block_name Offending block name, when there is one.
	 * @return array{valid: bool, reason: string, block_name: string}
	 */
	private static function failure( string $reason, string $block_name = '' ): array {
		return array(
			'valid'      => false,
			'reason'     => $reason,
			'block_name' => $block_name,
		);
	}
}
