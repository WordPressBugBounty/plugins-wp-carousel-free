<?php
/**
 * Moves the classic Tools page (carousel import/export) into the classic
 * settings page, the way Pro ships it.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\Dashboard;

defined( 'ABSPATH' ) || exit;

/**
 * The classic options framework builds its pages from filterable section
 * arrays, so the Tools fields can be relocated without editing a single
 * classic file: the section is spliced into the settings page ahead of Custom
 * CSS, and the standalone Tools submenu is dropped from the menu.
 */
class Classic_Tools {

	const SETTINGS_PREFIX = 'sp_wpcp_settings';
	const TOOLS_PAGE_SLUG = 'wpcf_tools';
	const MENU_PARENT     = 'edit.php?post_type=sp_wp_carousel';

	/**
	 * Wire up. Called from src/Admin/Dashboard/bootstrap.php, early enough that
	 * the sections filter is in place before the framework builds its pages on
	 * `after_setup_theme`.
	 */
	public static function init() {
		$instance = new self();

		add_filter( 'wpcf_' . self::SETTINGS_PREFIX . '_sections', array( $instance, 'add_tools_section' ) );

		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_init', array( $instance, 'redirect_tools_page' ) );
		// Before Dashboard::reorder_menu() at 999, which rebuilds the submenu.
		add_action( 'admin_menu', array( $instance, 'remove_tools_menu' ), 998 );
		add_action( 'wpcf_options_before', array( $instance, 'print_tools_nonce' ) );
	}

	/**
	 * Insert the Tools section into the settings page, immediately before the
	 * Custom CSS section.
	 *
	 * @param array $sections Settings page sections.
	 * @return array
	 */
	public function add_tools_section( $sections ) {
		if ( ! is_array( $sections ) ) {
			return $sections;
		}

		$tools    = $this->get_tools_section();
		$position = count( $sections );

		foreach ( $sections as $index => $section ) {
			if ( isset( $section['id'] ) && 'custom_css_section' === $section['id'] ) {
				$position = $index;
				break;
			}
		}

		array_splice( $sections, $position, 0, array( $tools ) );

		return $sections;
	}

	/**
	 * The relocated Tools fields. Field classes are kept exactly as the classic
	 * Tools page had them because the framework's own script binds the export
	 * and import handlers to those classes.
	 *
	 * @return array
	 */
	private function get_tools_section() {
		return array(
			'id'     => 'tools_section',
			'title'  => __( 'Tools', 'wp-carousel-free' ),
			'icon'   => 'fa fa-wrench',
			'fields' => array(
				array(
					'id'       => 'wpcp_what_export',
					'type'     => 'radio',
					'class'    => 'wpcp_what_export',
					'title'    => __( 'Choose What To Export', 'wp-carousel-free' ),
					'multiple' => false,
					'options'  => array(
						'all_shortcodes'      => __( 'All Carousels (Shortcodes)', 'wp-carousel-free' ),
						'selected_shortcodes' => __( 'Selected Carousels (Shortcodes)', 'wp-carousel-free' ),
					),
					'default'  => 'all_shortcodes',
				),
				array(
					'id'          => 'wpcp_post',
					'class'       => 'wpcp_post_ids',
					'type'        => 'select',
					'title'       => ' ',
					'options'     => 'sp_wp_carousel',
					'chosen'      => true,
					'sortable'    => false,
					'multiple'    => true,
					'placeholder' => __( 'Choose carousel(s)', 'wp-carousel-free' ),
					'query_args'  => array(
						'posts_per_page' => -1,
					),
					'dependency'  => array( 'wpcp_what_export', '==', 'selected_shortcodes', true ),
				),
				array(
					'id'       => 'export',
					'class'    => 'wpcp_export',
					'type'     => 'button_set',
					'sanitize' => 'sanitize_text_field',
					'title'    => ' ',
					'options'  => array(
						'' => __( 'Export', 'wp-carousel-free' ),
					),
				),
				array(
					'class' => 'wpcp_import',
					'type'  => 'custom_import',
					'title' => __( 'Import JSON File To Upload', 'wp-carousel-free' ),
				),
			),
		);
	}

	/**
	 * Hide the standalone Tools submenu. The page itself stays registered by
	 * the framework — `redirect_tools_page()` sends anyone who still has its
	 * URL to the settings page instead.
	 */
	public function remove_tools_menu() {
		remove_submenu_page( self::MENU_PARENT, self::TOOLS_PAGE_SLUG );
	}

	/**
	 * Send the old Tools URL to the Tools section of the settings page.
	 */
	public function redirect_tools_page() {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the current screen, not acting on it.

		if ( self::TOOLS_PAGE_SLUG !== $page ) {
			return;
		}

		wp_safe_redirect( admin_url( self::MENU_PARENT . '&page=wpcp_settings#tab=tools' ) );
		exit;
	}

	/**
	 * The framework's export/import script reads its nonce from the Tools
	 * page's own nonce field, so mirror that field on the settings page. It is
	 * printed outside the options form and carries no name, so it is never
	 * submitted — it only feeds the two AJAX requests.
	 */
	public function print_tools_nonce() {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the current screen, not acting on it.

		if ( 'wpcp_settings' !== $page ) {
			return;
		}

		printf(
			'<input type="hidden" id="wpcf_options_noncesp_wpcf_tools" value="%s">',
			esc_attr( wp_create_nonce( 'wpcf_options_nonce' ) )
		);
	}
}
