<?php
/**
 * Beaver Builder module output.
 *
 * Beaver loads this file itself when rendering the module and supplies
 * `$module`, `$id` and `$settings`.
 *
 * @package WP_Carousel_Free
 *
 * @var SP_WPCP_Beaver_Carousel_Module $module   Module instance.
 * @var string                         $id       Module node ID.
 * @var object                         $settings Saved module settings.
 */

use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Builder_Templates;

defined( 'ABSPATH' ) || exit;

$wpcpf_template_id = isset( $settings->template_id ) ? absint( $settings->template_id ) : 0;
$wpcpf_is_editor   = class_exists( 'FLBuilderModel' ) && FLBuilderModel::is_builder_active();

printf(
	'<div class="%1$s" data-builder-template-id="%2$s">',
	esc_attr( SP_WPCP_Beaver_Carousel_Module::WRAPPER_CLASS ),
	esc_attr( $wpcpf_template_id )
);
echo Builder_Templates::render( $wpcpf_template_id, $wpcpf_is_editor ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Rendered block markup.
echo '</div>';
