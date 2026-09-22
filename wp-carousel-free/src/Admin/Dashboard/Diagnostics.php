<?php
/**
 * Opt-in diagnostic data collection.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\Dashboard;

defined( 'ABSPATH' ) || exit;

/**
 * Collects non-sensitive environment data once a week, but only after the site
 * owner has explicitly consented. Free has no license, so the consent notice is
 * gated on the plugin actually being used rather than on a license status.
 */
class Diagnostics {

	/**
	 * Consent flag. Standalone rather than a key inside `sp_wpcp_settings`:
	 * Classic's options framework rebuilds that option from its own declared
	 * fields on every save, so a foreign key there would not survive.
	 */
	const OPTION_CONSENT = 'wpcp_allow_diagnostic_data';

	const OPTION_NOTICE_IGNORED = 'wpcp_ignored_consent_notice';
	const OPTION_NOTICE_STARTED = 'wpcp_consent_notice_started';

	const CRON_EVENT    = 'wpcpf_weekly_scheduled_events';
	const CRON_INTERVAL = 'wpcpf_weekly';

	/**
	 * Days the notice waits after the site owner first qualifies for it.
	 * Matches Pro.
	 */
	const NOTICE_DELAY_DAYS = 7;

	/**
	 * Collector route for WP Carousel Free. The route and key this reports to
	 * are the ones disclosed in readme.txt.
	 */

	const ENDPOINT = 'https://api.shapedplugin.com/wp-json/spda/v1/wp-carousel-free-collect';

	/**
	 * Collector API key for the WP Carousel product family. send() bails while
	 * this is empty.
	 */



	const SDR_KEY = 'e64a4455eaf32b3f545dabc400de8f08b622339b';

	const NOTICE_ACTION = 'wpcpf_diagnostic_consent';

	/**
	 * Wire up. Called from src/Admin/Dashboard/bootstrap.php.
	 */
	public static function init() {
		$instance = new self();

		// Before any is_admin() guard: WP-Cron requests are not admin requests.
		add_filter( 'cron_schedules', array( $instance, 'register_schedule' ) ); // phpcs:ignore WordPress.WP.CronInterval.ChangeDetected -- Weekly, far above the sniff's threshold.
		add_action( self::CRON_EVENT, array( $instance, 'maybe_send' ) );

		// Both contexts, so a site nobody logs into still gets scheduled.
		add_action( 'wp', array( $instance, 'maybe_schedule' ) );
		add_action( 'admin_init', array( $instance, 'maybe_schedule' ) );

		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_init', array( $instance, 'handle_notice_submit' ) );
		add_action( 'admin_notices', array( $instance, 'maybe_show_notice' ) );
	}

	/**
	 * Own weekly interval rather than the bare `weekly` other plugins define,
	 * so this neither depends on nor collides with theirs.
	 *
	 * @param array $schedules Registered cron schedules.
	 * @return array
	 */
	public function register_schedule( $schedules ) {
		if ( ! isset( $schedules[ self::CRON_INTERVAL ] ) ) {
			$schedules[ self::CRON_INTERVAL ] = array(
				'interval' => WEEK_IN_SECONDS,
				'display'  => __( 'Once Weekly', 'wp-carousel-free' ),
			);
		}

		return $schedules;
	}

	/**
	 * Schedule the weekly event lazily — the activation hook lives in Classic's
	 * bootstrap, which stays untouched.
	 */
	public function maybe_schedule() {
		if ( ! wp_next_scheduled( self::CRON_EVENT ) ) {
			wp_schedule_event( time(), self::CRON_INTERVAL, self::CRON_EVENT );
		}
	}

	/**
	 * Whether the site owner has consented.
	 *
	 * @return bool
	 */
	public static function has_consent() {
		return (bool) get_option( self::OPTION_CONSENT, false );
	}

	/**
	 * Store the consent choice. The single write path, shared by the admin
	 * notice and the Setup Wizard's Finish step. Sends on every save that grants consent,
	 * matching Pro — a transition-only send makes the obvious re-tick gesture
	 * do nothing.
	 *
	 * @param bool $consent Whether diagnostic data may be collected.
	 */
	public static function set_consent( $consent ) {
		$consent = (bool) $consent;

		update_option( self::OPTION_CONSENT, $consent );

		if ( $consent ) {
			$instance = new self();
			$instance->send();
		}
	}

	/**
	 * Cron callback.
	 */
	public function maybe_send() {
		if ( self::has_consent() ) {
			$this->send();
		}
	}

	/**
	 * Show the consent notice once the site owner qualifies for it.
	 */
	public function maybe_show_notice() {
		if ( ! current_user_can( apply_filters( 'wpcpf_ui_permission', 'manage_options' ) ) ) {
			return;
		}

		if ( self::has_consent() || get_option( self::OPTION_NOTICE_IGNORED, false ) ) {
			return;
		}

		// Free has no license to check, so ask only people who use the plugin.
		if ( ! $this->has_published_content() ) {
			return;
		}

		$started = (int) get_option( self::OPTION_NOTICE_STARTED, 0 );
		if ( ! $started ) {
			update_option( self::OPTION_NOTICE_STARTED, time() );
			return;
		}

		if ( ( time() - $started ) < ( DAY_IN_SECONDS * self::NOTICE_DELAY_DAYS ) ) {
			return;
		}

		$this->render_notice();
	}

	/**
	 * Whether the site has at least one published carousel or saved template.
	 *
	 * @return bool
	 */
	private function has_published_content() {
		$carousels = wp_count_posts( 'sp_wp_carousel' );
		$templates = wp_count_posts( Saved_Templates::POST_TYPE );

		$published  = isset( $carousels->publish ) ? (int) $carousels->publish : 0;
		$published += isset( $templates->publish ) ? (int) $templates->publish : 0;

		return $published > 0;
	}

	/**
	 * Store the notice choice. Runs on admin_init, so redirecting is safe.
	 */
	public function handle_notice_submit() {
		if ( ! isset( $_POST['wpcpf_diagnostic_action'] ) ) {
			return;
		}

		if ( ! current_user_can( apply_filters( 'wpcpf_ui_permission', 'manage_options' ) ) ) {
			return;
		}

		check_admin_referer( self::NOTICE_ACTION, 'wpcpf_diagnostic_nonce' );

		$action = sanitize_text_field( wp_unslash( $_POST['wpcpf_diagnostic_action'] ) );

		if ( 'allow' === $action ) {
			self::set_consent( true );
		} elseif ( 'deny' === $action ) {
			update_option( self::OPTION_NOTICE_IGNORED, true );
		}

		// Back to where the notice was shown, so a refresh cannot resubmit.
		$redirect = wp_get_referer();
		wp_safe_redirect( $redirect ? $redirect : admin_url() );
		exit;
	}

	/**
	 * Render the consent notice.
	 */
	private function render_notice() {
		$logo_url = WPCAROUSELF_URL . 'src/Admin/img/wpcp-icon-256.png';
		?>
		<style>
			.wpcpf-diagnostic-notice {
				background-color: #ffffff;
				border: 1px solid rgba( 204, 204, 204, 1 );
				border-left: 4px solid #2271b1;
				border-radius: 4px;
				box-shadow: 0 16px 32px -4px rgba( 12, 12, 13, 0.05 ), 0 4px 4px -4px rgba( 12, 12, 13, 0.02 );
				margin-bottom: 20px;
				padding: 14px;
				position: relative;
			}
			.wpcpf-diagnostic-notice form {
				align-items: flex-start;
				display: flex;
				gap: 16px;
			}
			.wpcpf-diagnostic-notice img {
				border-radius: 4px;
				flex-shrink: 0;
				height: auto;
				width: 52px;
			}
			.wpcpf-diagnostic-notice h3 {
				color: #2c2d2f;
				font-size: 18px;
				font-weight: 600;
				margin: 0 0 8px 0;
			}
			.wpcpf-diagnostic-notice p,
			.wpcpf-diagnostic-notice a {
				color: #6e6f72;
				font-size: 14px;
				margin: 0 0 2px 0;
			}
			.wpcpf-diagnostic-notice a {
				text-decoration: underline;
			}
			.wpcpf-diagnostic-notice .button {
				background-color: rgba( 30, 30, 30, 1 );
				border-radius: 4px;
				color: #ffffff;
				font-size: 13px;
				font-weight: 500;
				line-height: 14px;
				margin-top: 8px;
			}
			.wpcpf-diagnostic-notice .button:hover,
			.wpcpf-diagnostic-notice .button:focus {
				background-color: rgb( 46, 46, 46 );
				border: none;
				box-shadow: none;
				color: #ffffff;
			}
			.wpcpf-diagnostic-notice button.wpcpf-diagnostic-dismiss {
				background: transparent;
				border: none;
				color: #b6b6b6;
				cursor: pointer;
				font-size: 16px;
				position: absolute;
				right: 7px;
				top: 0;
			}
		</style>
		<div class="notice notice-info wpcpf-diagnostic-notice">
			<form method="post">
				<?php wp_nonce_field( self::NOTICE_ACTION, 'wpcpf_diagnostic_nonce' ); ?>
				<img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php esc_attr_e( 'WP Carousel', 'wp-carousel-free' ); ?>"/>
				<div>
					<h3><?php esc_html_e( 'Help us make WP Carousel even more awesome?', 'wp-carousel-free' ); ?></h3>
					<p>
						<?php esc_html_e( 'Allow us to collect non-sensitive diagnostic data to resolve problems faster and improve performance.', 'wp-carousel-free' ); ?>
						<a href="https://wpcarousel.io/privacy-policy/" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Learn More', 'wp-carousel-free' ); ?></a>
					</p>
					<button type="submit" class="button" name="wpcpf_diagnostic_action" value="allow"><?php esc_html_e( 'Accept & Close', 'wp-carousel-free' ); ?></button>
				</div>
				<button type="submit" class="wpcpf-diagnostic-dismiss dashicons dashicons-dismiss" name="wpcpf_diagnostic_action" value="deny" aria-label="<?php esc_attr_e( 'Dismiss', 'wp-carousel-free' ); ?>"></button>
			</form>
		</div>
		<?php
	}

	/**
	 * Collect and post the payload. Local and private-network hosts are skipped
	 * so development sites never report.
	 */
	private function send() {
		if ( '' === self::SDR_KEY ) {
			return;
		}

		$host = wp_parse_url( home_url(), PHP_URL_HOST );

		if ( 'localhost' === $host || '127.0.0.1' === $host || '::1' === $host
			|| 1 === preg_match( '/\.(local|test|dev)$/i', (string) $host )
			|| 1 === preg_match( '/^192\.168\./', (string) $host )
			|| 1 === preg_match( '/^10\./', (string) $host )
			|| 1 === preg_match( '/^172\.(1[6-9]|2[0-9]|3[0-1])\./', (string) $host ) ) {
			return;
		}

		$theme = wp_get_theme();

		$data = array(
			'user_email'     => get_option( 'admin_email' ),
			'site_url'       => get_option( 'siteurl' ),
			'site_language'  => get_locale(),
			'theme_name'     => $theme->get( 'Name' ),
			'plugin_version' => WPCAROUSELF_VERSION,
			'wp_version'     => get_bloginfo( 'version' ),
			'php_version'    => phpversion(),
			'db_version'     => get_option( 'wp_carousel_free_db_version' ),
			'active_plugins' => $this->get_active_plugins(),
			'used_blocks'    => $this->get_used_blocks(),
		);

		wp_remote_post(
			self::ENDPOINT,
			array(
				'blocking' => false,
				'timeout'  => 5,
				'headers'  => array(
					'Content-Type' => 'application/json',
					'x-api-key'    => self::SDR_KEY,
					'User-Agent'   => 'wp-carousel-free-collect/' . home_url(),
				),
				'body'     => wp_json_encode( $data ),
			)
		);
	}

	/**
	 * Active plugins as name and version pairs.
	 *
	 * @return array
	 */
	private function get_active_plugins() {
		// get_plugins() is admin-only, and cron requests are not admin requests.
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		$installed = get_plugins();
		$active    = array();

		foreach ( (array) get_option( 'active_plugins', array() ) as $plugin_path ) {
			if ( isset( $installed[ $plugin_path ] ) ) {
				$active[] = array(
					'name'    => $installed[ $plugin_path ]['Name'],
					'version' => $installed[ $plugin_path ]['Version'],
				);
			}
		}

		return $active;
	}

	/**
	 * Which of our blocks the site actually uses. Free registers its blocks
	 * under the `wp-carousel-pro/` namespace, so that is the prefix to match.
	 *
	 * @return array
	 */
	private function get_used_blocks() {
		global $wpdb;

		$used = array();

		// Bounded on purpose: a large site should not pay for an unlimited scan.
		$contents = $wpdb->get_col( $wpdb->prepare( "SELECT post_content FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_content LIKE %s LIMIT 500", '%<!-- wp:wp-carousel-pro/%' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- No caching wanted for a weekly one-off report.

		$widgets = get_option( 'widget_block' );
		if ( is_array( $widgets ) ) {
			foreach ( $widgets as $widget ) {
				if ( is_array( $widget ) && isset( $widget['content'] ) ) {
					$contents[] = $widget['content'];
				}
			}
		}

		foreach ( $contents as $content ) {
			if ( has_blocks( $content ) ) {
				$this->collect_block_names( parse_blocks( $content ), $used );
			}
		}

		return array_keys( $used );
	}

	/**
	 * Walk parsed blocks, keying by name so repeats collapse.
	 *
	 * @param array $blocks Parsed blocks.
	 * @param array $used   Accumulator, keyed by block name.
	 */
	private function collect_block_names( $blocks, &$used ) {
		foreach ( $blocks as $block ) {
			if ( ! empty( $block['blockName'] ) && 0 === strpos( $block['blockName'], 'wp-carousel-pro/' ) ) {
				$used[ $block['blockName'] ] = true;
			}
			if ( ! empty( $block['innerBlocks'] ) ) {
				$this->collect_block_names( $block['innerBlocks'], $used );
			}
		}
	}
}
