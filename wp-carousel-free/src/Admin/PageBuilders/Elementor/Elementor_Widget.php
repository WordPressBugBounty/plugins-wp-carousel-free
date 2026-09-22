<?php
/**
 * Elementor saved-template widget.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Elementor;

use Elementor\Controls_Manager;
use Elementor\Widget_Base;
use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Dashboard;
use ShapedPlugin\WPCarouselFree\Admin\Dashboard\Saved_Templates;
use ShapedPlugin\WPCarouselFree\Admin\PageBuilders\Base\Base_Page_Builder;
use ShapedPlugin\WPCarouselFree\Blocks\AssetManager;
use ShapedPlugin\WPCarouselFree\Blocks\Lightbox\Lightbox_Icon_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Picks a saved template and replays it.
 */
class Elementor_Widget extends Widget_Base {

	use Base_Page_Builder;

	/**
	 * Widget name.
	 *
	 * @return string
	 */
	public function get_name() {
		return Elementor_Builder::WIDGET_NAME;
	}

	/**
	 * Widget title.
	 *
	 * @return string
	 */
	public function get_title() {
		return __( 'WP Carousel Saved Template', 'wp-carousel-free' );
	}

	/**
	 * Widget icon.
	 *
	 * @return string
	 */
	public function get_icon() {
		return Elementor_Builder::ICON_CLASS;
	}

	/**
	 * Widget categories.
	 *
	 * @return array
	 */
	public function get_categories() {
		return array( 'basic' );
	}

	/**
	 * Scripts the preview needs.
	 *
	 * @return array
	 */
	public function get_script_depends() {
		return array( AssetManager::SWIPER, AssetManager::FRONTEND );
	}

	/**
	 * Styles the preview needs.
	 *
	 * @return array
	 */
	public function get_style_depends() {
		return array( AssetManager::SWIPER_STYLE, AssetManager::BASE_STYLE );
	}

	/**
	 * Widget controls.
	 */
	protected function register_controls() {
		$this->start_controls_section(
			'content_section',
			array(
				'label' => __( 'Settings', 'wp-carousel-free' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'wpcp_saved_template',
			array(
				'label'       => __( 'Saved Template', 'wp-carousel-free' ),
				'type'        => Controls_Manager::SELECT2,
				'label_block' => true,
				'default'     => '0',
				'options'     => $this->get_saved_templates_list(),
			)
		);

		$this->add_control(
			'wpcp_edit_template',
			array(
				'type'            => Controls_Manager::RAW_HTML,
				'raw'             => $this->get_template_links(),
				'content_classes' => 'wpcp-elementor-template-actions',
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Render the selected template.
	 */
	protected function render() {
		$settings    = $this->get_settings_for_display();
		$template_id = isset( $settings['wpcp_saved_template'] ) ? absint( $settings['wpcp_saved_template'] ) : 0;
		$is_editor   = \Elementor\Plugin::$instance->editor->is_edit_mode();

		if ( ! $is_editor ) {
			echo $this->render_template( $template_id ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Rendered block markup.
			return;
		}

		// Elementor builds the preview from `render_widget` AJAX responses, which
		// carry HTML only — so the stylesheet the per-block lightbox icon CSS would
		// normally ride on never reaches the page. Capture and print it inline.
		Lightbox_Icon_Helper::capture_icon_css();

		$markup   = $this->render_template( $template_id, true );
		$icon_css = Lightbox_Icon_Helper::flush_captured_icon_css();

		echo $icon_css; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized style element from Lightbox_Icon_Helper.

		printf(
			'<div class="%1$s" data-builder-template-id="%2$s">',
			esc_attr( Elementor_Builder::WRAPPER_CLASS ),
			esc_attr( $template_id )
		);
		echo $markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Rendered block markup.
		echo '</div>';
	}

	/**
	 * Dashboard buttons shown under the template picker.
	 *
	 * Styled inline because Elementor's RAW_HTML control renders inside the
	 * panel frame, which loads no stylesheet of ours.
	 *
	 * @return string
	 */
	protected function get_template_links() {
		$manage_url = admin_url(
			'edit.php?post_type=sp_wp_carousel&page=' . Dashboard::PAGE_SLUG_GETTING_STARTED . '#saved_templates'
		);
		$new_url    = admin_url( 'post-new.php?post_type=' . Saved_Templates::POST_TYPE . '&wpcpblock_inserter=true' );

		ob_start();
		?>
		<div class="wpcp-elementor-template-buttons">
			<a class="wpcp-edit-template-btn" href="<?php echo esc_url( $manage_url ); ?>" style="color:#fff; background-color:#3e3e40; padding:12px 24px; border-radius:4px; display:inline-block; font-size: 14px" onmouseover="this.style.backgroundColor='#4b4b4d'" onmouseout="this.style.backgroundColor='#3e3e40'">
				<span style="display:inline-block; transform: rotate(70deg); margin-right: 4px">&#9998;</span>
				<span><?php echo esc_html__( 'Edit This Template', 'wp-carousel-free' ); ?></span>
			</a>
			<a class="wpcp-add-template-btn" href="<?php echo esc_url( $new_url ); ?>" style="color:#fff; background-color:#19949e; padding: 10px 23px; border-radius:4px; display:inline-block; margin-top: 15px; font-size: 14px" onmouseover="this.style.backgroundColor='#157a82'" onmouseout="this.style.backgroundColor='#19949e'">
				<span style="display:inline-block; font-size: 18px; margin-right: 4px;">+</span>
				<span><?php echo esc_html__( 'Add New Template', 'wp-carousel-free' ); ?></span>
			</a>
		</div>
		<?php
		return ob_get_clean();
	}
}
