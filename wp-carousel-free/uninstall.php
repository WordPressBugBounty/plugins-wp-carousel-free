<?php
/**
 * Uninstall.php for cleaning plugin database.
 *
 * Trigger the file when plugin is deleted.
 *
 * @see delete_option(), delete_post_meta_key()
 * @since 3.1.0
 * @package WP Carousel
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Whether WP Carousel Pro is still present on disk.
 *
 * Presence, not activation. WordPress deactivates a plugin before it uninstalls it,
 * and delete_plugins() removes each plugin's directory immediately after running its
 * uninstall.php — so an is_plugin_active() test would report a sibling the user still
 * has as "gone" and take the shared carousels with it. Folder-name independent for
 * the same reason the bootstrap's check is: a branch ZIP installs as
 * wp-carousel-pro-<branch>/.
 *
 * Every helper in this file is prefixed sp_wpcf_ and must never share a name with one
 * in WP Carousel Pro's uninstall.php. A bulk delete includes BOTH files in one process
 * at global scope, and a shared name is a fatal mid-deletion. A function_exists() guard
 * is not a fix here: it would bind the sibling's implementation and silently delete the
 * wrong data.
 *
 * @since 2.8.0
 * @return bool
 */
function sp_wpcf_pro_is_installed() {
	if ( file_exists( WP_PLUGIN_DIR . '/wp-carousel-pro/wp-carousel-pro.php' ) ) {
		return true;
	}

	$pro_main_files = glob( WP_PLUGIN_DIR . '/*/wp-carousel-pro.php' );

	return ! empty( $pro_main_files );
}

/**
 * Delete plugin data function.
 *
 * @return void
 */
function sp_wpcf_delete_plugin_data() {
	// Cached WordPress.org changelog feed. This build's own, so it goes either way.
	delete_transient( 'wpcpf_changelogs' );

	/*
	 * Everything below is SHARED with WP Carousel Pro. The carousels, the settings
	 * option, the per-post meta and the offer-banner flags are one data set that
	 * either build reads and writes — Pro registers the same sp_wp_carousel post type
	 * and saves into the same sp_wpcp_settings row. Pro still being on disk means the
	 * site is keeping that data, so none of it goes.
	 *
	 * Pro's uninstall.php makes the mirror-image check, which is what stops either
	 * order of deletion from being lossy: delete_plugins() removes each directory
	 * before running the next uninstall.php, so whichever runs second sees the other
	 * gone and clears the shared data exactly once.
	 *
	 * That mirror has to cover the FILESYSTEM as well as the database, which it did
	 * not until 2026-09-22. The shared `uploads/wp-carousel/` folder — generated block
	 * CSS from both editions, and the one Ready Patterns manifest cache they share —
	 * was only ever deleted by Pro. Deleting Free second, or last of the two, left it
	 * on disk however the clean-up toggle was set, because this file touched no files
	 * at all. Nothing was lost by that, but the checkbox promises a clean-up it was
	 * not delivering, so the folder is removed below.
	 */
	if ( sp_wpcf_pro_is_installed() ) {
		return;
	}

	// Delete plugin option settings.
	$option_name = 'sp_wpcp_settings';
	delete_option( $option_name );
	delete_site_option( $option_name ); // For site options in Multisite.

	// Delete carousel post type.
	$carousel_posts = get_posts(
		array(
			'numberposts' => -1,
			'post_type'   => 'sp_wp_carousel',
			'post_status' => 'any',
		)
	);
	foreach ( $carousel_posts as $post ) {
		wp_delete_post( $post->ID, true );
	}

	// Delete Carousel post meta.
	delete_post_meta_by_key( 'sp_wpcp_upload_options' );
	delete_post_meta_by_key( 'sp_wpcp_shortcode_options' );

	delete_option( 'wpcp_page_data' );

	// Delete offer banner related option keys.
	delete_option( 'shapedplugin_offer_banner_dismissed_black_friday_2025' );
	delete_option( 'shapedplugin_offer_banner_dismissed_new_year_2026' );

	// Generated block CSS and the shared Ready Patterns manifest cache. Reached only
	// past the sp_wpcf_pro_is_installed() guard above, so Pro is gone and nothing is
	// left that reads this folder.
	sp_wpcf_delete_upload_folder( 'wp-carousel' );
}

/**
 * Recursively remove one folder under wp-content/uploads.
 *
 * The sp_wpcf_ prefix is not decoration: a bulk delete of both plugins loads this file
 * and Pro's in one process at global scope, and Pro declares a function of the same
 * shape. A shared name would be a fatal mid-deletion, so the two must never collide.
 *
 * @since 2.8.0
 * @param string $folder_name Folder name directly under the uploads base directory.
 * @return void
 */
function sp_wpcf_delete_upload_folder( $folder_name ) {
	$upload_dir = wp_upload_dir();
	$folder     = trailingslashit( $upload_dir['basedir'] ) . $folder_name;

	if ( ! is_dir( $folder ) ) {
		return;
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';

	global $wp_filesystem;
	if ( ! function_exists( 'WP_Filesystem' ) || ! WP_Filesystem() || ! $wp_filesystem ) {
		return;
	}

	$wp_filesystem->delete( $folder, true );
}

// Load WPCP file. A no-op whenever Pro is active — the bootstrap returns before it
// defines anything — which is correct: nothing below uses WPCAROUSELF_* or the class.
require plugin_dir_path( __FILE__ ) . '/wp-carousel-free.php';
$option_settings  = get_option( 'sp_wpcp_settings' );
$wpcf_plugin_data = isset( $option_settings['wpcf_delete_all_data'] ) ? $option_settings['wpcf_delete_all_data'] : false;

// Bookkeeping, not user content, so it goes regardless of the clean-up toggle.
delete_option( 'sp_wp_carousel_free_review_notice_dismiss' );
delete_site_option( 'sp_wp_carousel_free_review_notice_dismiss' );

// Diagnostics consent and its weekly reporting event.
wp_clear_scheduled_hook( 'wpcpf_weekly_scheduled_events' );
foreach ( array( 'wpcp_allow_diagnostic_data', 'wpcp_ignored_consent_notice', 'wpcp_consent_notice_started' ) as $wpcpf_diagnostic_option ) {
	delete_option( $wpcpf_diagnostic_option );
	delete_site_option( $wpcpf_diagnostic_option );
}

if ( $wpcf_plugin_data ) {
	sp_wpcf_delete_plugin_data();
}
