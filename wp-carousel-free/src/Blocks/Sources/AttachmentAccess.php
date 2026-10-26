<?php
/**
 * Access checks shared by media sources before reading attachment metadata.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Blocks\Sources;

defined( 'ABSPATH' ) || exit;

/**
 * Resolves media IDs without exposing unrelated or inaccessible posts.
 */
class AttachmentAccess {

	/**
	 * Get an attachment whose metadata the current visitor may read.
	 *
	 * @param int $attachment_id Requested media ID.
	 * @return \WP_Post|null Readable attachment, otherwise null.
	 */
	public static function get_readable( int $attachment_id ): ?\WP_Post {
		if ( 0 >= $attachment_id ) {
			return null;
		}

		$attachment = get_post( $attachment_id );
		if ( ! $attachment instanceof \WP_Post || 'attachment' !== $attachment->post_type ) {
			return null;
		}

		// Attachments inherit visibility from their parent, including its password.
		$parent = 0 < $attachment->post_parent ? get_post( $attachment->post_parent ) : null;
		if ( post_password_required( $attachment ) || ( $parent && post_password_required( $parent ) ) ) {
			return null;
		}

		$status = get_post_status_object( get_post_status( $attachment ) );
		if ( ( $status && $status->public ) || current_user_can( 'read_post', $attachment_id ) ) {
			return $attachment;
		}

		return null;
	}
}
