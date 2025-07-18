<?php
/**
 * The image carousel template.
 *
 * This template can be overridden by copying it to yourtheme/wp-carousel-free/templates/loop/image-type.php
 *
 * @since   2.3.4
 * @package WP_Carousel_Free
 * @subpackage WP_Carousel_Free/public/templates
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}
$image_data       = get_post( $attachment );
$image_title      = WPCF_Helper::get_translated_attachment_data( $attachment, 'title' );
$image_alt_titles = WPCF_Helper::get_translated_attachment_data( $attachment, 'alt' );
$image_alt_title  = ! empty( $image_alt_titles ) ? $image_alt_titles : $image_title;
$image_url        = wp_get_attachment_image_src( $attachment, $image_sizes );
$image_url        = is_array( $image_url ) ? $image_url : array( '', '', '' );

$the_image_title_attr = ' title="' . $image_title . '"';
$image_title_attr     = 'true' === $show_image_title_attr ? $the_image_title_attr : '';

if ( ! empty( $image_url[0] ) ) {
	$image = WPCF_Helper::get_item_image( $lazy_load_image, $wpcp_layout, $image_url[0], $image_title_attr, $image_url[1], $image_url[2], $image_alt_title, $lazy_load_img );
	?>
<div class="<?php echo esc_attr( $grid_column ); ?>">
	<div class="wpcp-single-item">
		<?php
			require WPCF_Helper::wpcf_locate_template( 'loop/image-type/image.php' );
			require WPCF_Helper::wpcf_locate_template( 'loop/image-type/caption.php' );
		?>
	</div>
</div>
	<?php
}
