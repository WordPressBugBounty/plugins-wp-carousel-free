<?php
/**
 * The admin-specific of the plugin.
 *
 * @link https://shapedplugin.com
 * @since 2.0.0
 *
 * @package WP_Carousel_Free
 * @subpackage WP_Carousel_Free/admin
 */

/**
 * The class for the admin-specific functionality of the plugin.
 */
class WP_Carousel_Free_Admin {
	/**
	 * Script and style suffix
	 *
	 * @since 2.0.0
	 * @access protected
	 * @var string
	 */
	protected $suffix;

	/**
	 * The ID of the plugin.
	 *
	 * @since 2.0.0
	 * @access protected
	 * @var string      $plugin_name The ID of this plugin
	 */
	protected $plugin_name;

	/**
	 * The version of the plugin
	 *
	 * @since 2.0.0
	 * @access protected
	 * @var string      $version The current version fo the plugin.
	 */
	protected $version;


	/**
	 * Initialize the class sets its properties.
	 *
	 * @since 2.0.0
	 * @param string $plugin_name The name of the plugin.
	 * @param string $version The version of the plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->suffix      = defined( 'WP_DEBUG' ) && WP_DEBUG ? '' : '.min';
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
		// add_action( 'wp_ajax_create_image_meta', array( $this, 'create_image_meta' ) );
		add_action( 'wp_ajax_wpcf_image_save_meta', array( $this, 'save_meta' ) );
		add_action( 'wp_ajax_wpcf_image_get_attachment_links', array( $this, 'get_attachment_links' ) );
	}

	/**
	 * Returns the media link (direct image URL) for the given attachment ID
	 *
	 * @since
	 */
	public function get_attachment_links() {
		// Check nonce.
		check_admin_referer( 'wpcf_image-save-meta', 'nonce' );

		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'You are not allowed to edit sliders.', 'wp-carousel-free' ) ) );
		}

		// Get required inputs.
		$attachment_id = isset( $_POST['attachment_id'] ) ? absint( wp_unslash( $_POST['attachment_id'] ) ) : false;

		// Return the attachment's links.
		wp_send_json_success(
			array(
				'media_link'      => wp_get_attachment_url( $attachment_id ),
				'attachment_page' => get_attachment_link( $attachment_id ),
				'wpcplink'        => get_post_meta( $attachment_id, 'wpcplinking', true ),
				'crop_position'   => get_post_meta( $attachment_id, 'crop_position', true ),
				'link_target'     => get_post_meta( $attachment_id, 'wpcplinktarget', true ),
			)
		);
	}
	/**
	 * Saves the metadata for an image in a slider.
	 *
	 * @since 1.0.0
	 */
	public function save_meta() {
		// Run a security check first.
		check_ajax_referer( 'wpcf_image-save-meta', 'nonce' );

		$post_id = isset( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : null;

		if ( null === $post_id ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Invalid Post ID.', 'wp-carousel-free' ) ) );
		}

		if ( ! current_user_can( 'edit_posts', $post_id ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'You are not allowed to edit sliders.', 'wp-carousel-free' ) ) );
		}

		// Prepare variables.
		$attach_id = isset( $_POST['attach_id'] ) ? intval( wp_unslash( $_POST['attach_id'] ) ) : false;
		$meta      = isset( $_POST['meta'] ) ? wp_unslash( $_POST['meta'] ) : array(); //@codingStandardsIgnoreLine
		// Update attachment post data.
		$update_attachment_data = array(
			'ID'           => $attach_id,
			'post_title'   => isset( $meta['title'] ) ? trim( esc_html( $meta['title'] ) ) : '',
			'post_content' => isset( $meta['description'] ) ? wp_kses_post( trim( $meta['description'] ) ) : '',
			'post_excerpt' => isset( $meta['caption'] ) ? wp_kses_post( trim( $meta['caption'] ) ) : '', // Caption is stored as post excerpt.
		);

		// Update attachment meta.
		$new_alt_text = trim( esc_html( $meta['alt'] ) );
		update_post_meta( $attach_id, '_wp_attachment_image_alt', $new_alt_text );
		// Update the post.
		wp_update_post( $update_attachment_data );

		wp_send_json_success();
	}
	/**
	 * Getting image metadata.
	 *
	 * @param  int $image_id id.
	 * @return array
	 */
	private function getting_image_metadata( $image_id ) {
		$image_metadata_array                          = array();
		$image_linking_meta                            = wp_get_attachment_metadata( $image_id );
		$image_linking_urls                            = isset( $image_linking_meta['image_meta'] ) ? $image_linking_meta['image_meta'] : '';
		$image_linking_url                             = ! empty( $image_linking_urls['wpcplinking'] ) ? $image_linking_urls['wpcplinking'] : '';
		$image_metadata_array['status']                = 'active';
		$image_metadata_array['id']                    = $image_id;
		$image_metadata_array['src']                   = esc_url( wp_get_attachment_url( $image_id ) );
		$image_metadata_array['height']                = $image_linking_meta['height'] ?? '';
		$image_metadata_array['width']                 = $image_linking_meta['width'] ?? '';
		$image_metadata_array['alt']                   = trim( esc_html( get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ) ) ?? '';
		$image_metadata_array['caption']               = trim( esc_html( get_post_field( 'post_excerpt', $image_id ) ) ) ?? '';
		$image_metadata_array['title']                 = trim( esc_html( get_post_field( 'post_title', $image_id ) ) ) ?? '';
		$image_metadata_array['description']           = trim( get_post_field( 'post_content', $image_id ) ) ?? '';
		$image_metadata_array['filename']              = trim( esc_html( get_post_field( 'post_name', $image_id ) ) ) ?? '';
		$image_metadata_array['wpcplink']              = esc_url( $image_linking_url );
		$image_metadata_array['link_target']           = get_post_meta( $image_id, 'wpcplinktarget', true );
		$image_metadata_array['crop_position']         = trim( esc_html( get_post_meta( $image_id, 'crop_position', true ) ) ) ?? 'center_center';
		$image_metadata_array['editLink']              = get_edit_post_link( $image_id, 'display' );
		$image_metadata_array['type']                  = 'image';
		$image_metadata_array['mime']                  = $image_linking_meta['sizes']['thumbnail']['mime-type'] ?? '';
		$image_metadata_array['filesizeHumanReadable'] = isset( $image_linking_meta['filesize'] ) ? round( $image_linking_meta['filesize'] / 1024 ) : '';
		if ( array_key_exists( 'sizes', $image_linking_meta ) ) {
			unset( $image_linking_meta['sizes'] );
		}
		if ( array_key_exists( 'image_meta', $image_linking_meta ) ) {
			unset( $image_linking_meta['image_meta'] );
		}
		return array_merge( $image_linking_meta, $image_metadata_array );
	}

	/**
	 * Returns the media link (direct image URL) for the given attachment ID
	 *
	 * @since
	 */
	public function create_image_meta() {
		// Check nonce.
		check_admin_referer( 'wpcf_image-save-meta', 'nonce' );

		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'You are not allowed to edit sliders.', 'wp-carousel-free' ) ) );
		}
		// Get required inputs.
		$attachment_id = isset( $_POST['attach_id'] ) ? absint( wp_unslash( $_POST['attach_id'] ) ) : false;
		if ( ! $attachment_id ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Invalid Attachment ID.', 'wp-carousel-free' ) ) );
		}
		$image_meta = $this->getting_image_metadata( $attachment_id );
		$json       = wp_json_encode( $image_meta );
		// Return the attachment's links.
		wp_send_json_success(
			array(
				'edit_text'  => __( 'Edit Image on Media Library', 'wp-carousel-free' ),
				'image_meta' => $json,
			)
		);
	}
	/**
	 * Register the stylesheets for the admin area of the plugin.
	 *
	 * @since  3.0.0
	 * @return void
	 */
	public function enqueue_admin_styles() {
		$current_screen        = get_current_screen();
		$the_current_post_type = $current_screen->post_type;
		if ( 'sp_wp_carousel' === $the_current_post_type ) {
			wp_enqueue_style( 'font-awesome', WPCAROUSELF_URL . 'public/css/font-awesome.min.css', array(), $this->version, 'all' );
		}
		wp_enqueue_style( $this->plugin_name . 'admin', WPCAROUSELF_URL . 'admin/css/wp-carousel-free-admin' . $this->suffix . '.css', array(), $this->version, 'all' );
		wp_enqueue_style( 'sp_wp_carousel_tabbed_icons', WPCAROUSELF_URL . 'admin/css/fontello.css', array(), $this->version, 'all' );

		// Scripts.
		wp_enqueue_script( $this->plugin_name . 'admin', WPCAROUSELF_URL . 'admin/js/wp-carousel-free-admin' . $this->suffix . '.js', array( 'jquery' ), $this->version, true );
	}

	/**
	 * Change Carousel updated messages.
	 *
	 * @since 2.0.0
	 * @param string $messages The Update messages.
	 * @return statement
	 */
	public function wpcp_carousel_updated_messages( $messages ) {
		global $post, $post_ID;
		$messages['sp_wp_carousel'] = array(
			0  => '', // Unused. Messages start at index 1.
			1  => sprintf( __( 'Carousel updated.', 'wp-carousel-free' ) ),
			2  => '',
			3  => '',
			4  => __( 'Carousel updated.', 'wp-carousel-free' ),
			5  => isset( $_GET['revision'] ) ? sprintf( 'Carousel restored to revision from %s', wp_post_revision_title( (int) $_GET['revision'], false ) ) : false, // phpcs:disable WordPress.Security.NonceVerification.Recommended
			6  => sprintf( __( 'Carousel published.', 'wp-carousel-free' ) ),
			7  => __( 'Carousel saved.', 'wp-carousel-free' ),
			8  => sprintf( __( 'Carousel submitted.', 'wp-carousel-free' ) ),
			9  => sprintf( 'Carousel scheduled for: <strong>%1$s</strong>', date_i18n( __( 'M j, Y @ G:i', 'wp-carousel-free' ), strtotime( $post->post_date ) ) ),
			10 => sprintf( __( 'Carousel draft updated.', 'wp-carousel-free' ) ),
		);
		return $messages;
	}

	/**
	 * Add carousel admin columns.
	 *
	 * @return statement
	 */
	public function filter_carousel_admin_column() {
		$admin_columns['cb']            = '<input type="checkbox" />';
		$admin_columns['title']         = __( 'Title', 'wp-carousel-free' );
		$admin_columns['shortcode']     = __( 'Shortcode', 'wp-carousel-free' );
		$admin_columns['carousel_type'] = __( 'Source Type', 'wp-carousel-free' );
		$admin_columns['date']          = __( 'Date', 'wp-carousel-free' );

		return $admin_columns;
	}

	/**
	 * Display admin columns for the carousels.
	 *
	 * @since 2.0.0
	 * @param mix    $column The columns.
	 * @param string $post_id The post ID.
	 * @return void
	 */
	public function display_carousel_admin_fields( $column, $post_id ) {
		$upload_data     = get_post_meta( $post_id, 'sp_wpcp_upload_options', true );
		$carousels_types = isset( $upload_data['wpcp_carousel_type'] ) ? $upload_data['wpcp_carousel_type'] : '';
		switch ( $column ) {
			case 'shortcode':
				$column_field = '<input style="max-width:100%;width: 270px; padding: 6px;cursor:pointer;" type="text" onClick="this.select();" readonly="readonly" value="[sp_wpcarousel id=&quot;' . esc_attr( $post_id ) . '&quot;]"/><div class="spwpc-after-copy-text"><i class="fa fa-check-circle"></i> Shortcode Copied to Clipboard! </div>';
				echo $column_field; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				break;
			case 'carousel_type':
				echo ucwords( str_replace( '-', ' ', $carousels_types ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		} // end switch.
	}

	/**
	 * Add plugin action menu
	 *
	 * Fired by `plugin_action_links` filter.
	 *
	 * @param array  $links The action link.
	 * @param string $plugin_file The file.
	 * @since 2.0.0
	 * @return array
	 */
	public function add_plugin_action_links( $links, $plugin_file ) {

		if ( WPCAROUSELF_BASENAME === $plugin_file ) {
			$ui_links = sprintf( '<a href="%s">%s</a>', admin_url( 'post-new.php?post_type=sp_wp_carousel' ), __( 'Add New', 'wp-carousel-free' ) );

			array_unshift( $links, $ui_links );

			$links['go_pro'] = sprintf( '<a target="_blank" href="%1$s" style="color: #35b747; font-weight: 700;">Go Pro!</a>', 'https://wpcarousel.io/pricing/?ref=1' );
		}

		return $links;
	}

	/**
	 * Plugin row meta.
	 *
	 * Adds row meta links to the plugin list table
	 *
	 * Fired by `plugin_row_meta` filter.
	 *
	 * @since  2.0.0
	 * @access public
	 *
	 * @param array  $plugin_meta An array of the plugin's metadata, including
	 *                            the version, author, author URI, and plugin URI.
	 * @param string $plugin_file Path to the plugin file, relative to the plugins
	 *                            directory.
	 *
	 * @return array An array of plugin row meta links.
	 */
	public function plugin_row_meta( $plugin_meta, $plugin_file ) {
		if ( WPCAROUSELF_BASENAME === $plugin_file ) {
			$row_meta = array(
				'docs' => '<a href="https://wpcarousel.io/wp-carousel-free-demo/" aria-label="' . esc_attr( __( 'Live Demo', 'wp-carousel-free' ) ) . '" target="_blank">' . __( 'Live Demo', 'wp-carousel-free' ) . '</a>',
				'ideo' => '<a href="https://docs.shapedplugin.com/docs/wordpress-carousel/introduction/" aria-label="' . esc_attr( __( 'View WP Carousel Video Tutorials', 'wp-carousel-free' ) ) . '" target="_blank">' . __( 'Docs & Video Tutorials', 'wp-carousel-free' ) . '</a>',
			);

			$plugin_meta = array_merge( $plugin_meta, $row_meta );
		}

		return $plugin_meta;
	}

	/**
	 * Bottom review notice.
	 *
	 * @since 2.0.0
	 * @param string $text The review notice.
	 * @return string
	 */
	public function sp_wpcp_review_text( $text ) {
		$screen = get_current_screen();
		if ( 'sp_wp_carousel' === $screen->post_type ) {
			$url  = 'https://wordpress.org/support/plugin/wp-carousel-free/reviews/?filter=5#new-post';
			$text = sprintf( 'Enjoying <strong>WP Carousel?</strong> Please rate us <span class="spwpcp-footer-text-star">★★★★★</span> <a href="%s" target="_blank">WordPress.org</a>. Your positive feedback will help us grow more. Thank you! 😊', $url );
		}

		return $text;
	}

	/**
	 * Bottom review notice.
	 *
	 * @since 2.0.0
	 * @param string $text The review notice.
	 * @return string
	 */
	public function sp_wpcp_version_text( $text ) {
		$screen = get_current_screen();
		if ( 'sp_wp_carousel' === $screen->post_type ) {
			$text = 'WP Carousel ' . $this->version;
		}

		return $text;
	}

	/**
	 * Declare the compatibility of WooCommerce High-Performance Order Storage (HPOS) feature.
	 *
	 * @since 2.5.7
	 *
	 * @return void
	 */
	public function declare_compatibility_with_woo_hpos_feature() {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', 'wp-carousel-free/wp-carousel-free.php', true );
		}
	}
}
