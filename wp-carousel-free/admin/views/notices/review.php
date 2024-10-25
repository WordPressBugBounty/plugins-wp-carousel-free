<?php
/**
 * The admin review notice.
 *
 * @since        2.1.5
 * @version      2.1.5
 *
 * @package    WP_Carousel_Free
 * @subpackage WP_Carousel_Free/admin/views/notices
 * @author     ShapedPlugin<support@shapedplugin.com>
 */
class WP_Carousel_Free_Review {

	/**
	 * Display admin notice.
	 *
	 * @return void
	 */
	public function display_admin_notice() {
		// Show only to Admins.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Variable default value.
		$review = get_option( 'sp_wp_carousel_free_review_notice_dismiss' );
		$time   = time();
		$load   = false;

		if ( ! $review ) {
			$review = array(
				'time'      => $time,
				'dismissed' => false,
			);
			add_option( 'sp_wp_carousel_free_review_notice_dismiss', $review );
		} else {
			// Check if it has been dismissed or not.
			if ( ( isset( $review['dismissed'] ) && ! $review['dismissed'] ) && ( isset( $review['time'] ) && ( ( $review['time'] + ( DAY_IN_SECONDS * 3 ) ) <= $time ) ) ) {
				$load = true;
			}
		}

		// If we cannot load, return early.
		if ( ! $load ) {
			return;
		}
		?>
		<div id="sp-wpcfree-review-notice" class="sp-wpcfree-review-notice">
			<div class="sp-wpcfree-plugin-icon">
				<img src="<?php echo esc_url( WPCAROUSELF_URL ) . 'admin/img/wp-carousel-pro.svg'; ?>" alt="WP Carousel">
			</div>
			<div class="sp-wpcfree-notice-text">
				<h3>Enjoying <strong>WP Carousel</strong>?</h3>
				<p>We hope you had a wonderful experience using <strong>WP Carousel</strong>. Please take a moment to leave a review on <a href="https://wordpress.org/support/plugin/wp-carousel-free/reviews/?filter=5#new-post" target="_blank"><strong>WordPress.org</strong></a>.
				Your positive review will help us improve. Thank you! 😊</p>

				<p class="sp-wpcfree-review-actions">
					<a href="https://wordpress.org/support/plugin/wp-carousel-free/reviews/?filter=5#new-post" target="_blank" class="button button-primary notice-dismissed rate-wp-carousel">Ok, you deserve ★★★★★</a>
					<a href="#" class="notice-dismissed remind-me-later"><span class="dashicons dashicons-clock"></span>Nope, maybe later
</a>
					<a href="#" class="notice-dismissed never-show-again"><span class="dashicons dashicons-dismiss"></span>Never show again</a>
				</p>
			</div>
		</div>

		<script type='text/javascript'>

			jQuery(document).ready( function($) {
				$(document).on('click', '#sp-wpcfree-review-notice.sp-wpcfree-review-notice .notice-dismissed', function( event ) {
					if ( $(this).hasClass('rate-wp-carousel') ) {
						var notice_dismissed_value = "1";
					}
					if ( $(this).hasClass('remind-me-later') ) {
						var notice_dismissed_value =  "2";
						event.preventDefault();
					}
					if ( $(this).hasClass('never-show-again') ) {
						var notice_dismissed_value =  "3";
						event.preventDefault();
					}

					$.post( ajaxurl, {
						action: 'sp-wpcfree-never-show-review-notice',
						notice_dismissed_data : notice_dismissed_value,
						nonce: "<?php echo esc_html( wp_create_nonce( 'wpcfree-review-notice' ) ); ?>",
					});

					$('#sp-wpcfree-review-notice.sp-wpcfree-review-notice').hide();
				});
			});

		</script>
		<?php
	}

	/**
	 * Dismiss review notice
	 *
	 * @since  2.1.5
	 *
	 * @return void
	 **/
	public function dismiss_review_notice() {
		$review = array();
		$nonce  = ( ! empty( $_POST['nonce'] ) ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : '';
		if ( current_user_can( 'manage_options' ) && wp_verify_nonce( $nonce, 'wpcfree-review-notice' ) ) {
			$notice_dismissed = ( ! empty( $_POST['notice_dismissed_data'] ) ) ? sanitize_text_field( wp_unslash( $_POST['notice_dismissed_data'] ) ) : '';

			switch ( $notice_dismissed ) {
				case '1':
					$review['time']      = time();
					$review['dismissed'] = true;
					break;
				case '2':
					$review['time']      = time();
					$review['dismissed'] = false;
					break;
				case '3':
					$review['time']      = time();
					$review['dismissed'] = true;
					break;
			}
			update_option( 'sp_wp_carousel_free_review_notice_dismiss', $review );
			die;
		}
	}
}
