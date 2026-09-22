<?php
/**
 * Global Lightbox extension settings – defaults and sanitization.
 *
 * @package WP_Carousel_Free
 */

namespace ShapedPlugin\WPCarouselFree\Admin\Dashboard\Modules;

use ShapedPlugin\WPCarouselFree\Includes\Utils\Array_Merge;

defined( 'ABSPATH' ) || exit;

/**
 * Lightbox_Settings class.
 */
class Lightbox_Settings {

	const MODULE = 'lightbox';

	/**
	 * Allowed lightbox providers.
	 */
	const PROVIDERS = array(
		'fancybox',
		'lightbox',
	);

	/**
	 * Allowed icon display positions (dashboard global lightbox).
	 */
	const ICON_POSITIONS = array(
		'top-left',
		'top-right',
		'center',
		'bottom-left',
		'bottom-right',
	);

	/**
	 * Allowed icon style presets.
	 */
	const ICON_STYLES = array(
		'default',
		'filled',
		'outlined',
		'minimal',
	);

	/**
	 * Allowed lightbox themes.
	 */
	const THEMES = array(
		'light',
		'dark',
		'auto',
		'custom',
	);

	/**
	 * Allowed main transition effects.
	 */
	const TRANSITION_EFFECTS = array(
		'zoom',
		'fade',
		'slide',
		'circular',
		'tube',
		'zoom-in-out',
		'rotate',
		'none',
	);

	/**
	 * Allowed thumbnail display styles.
	 */
	const THUMBNAIL_STYLES = array(
		'modern',
		'classic',
		'scrollable',
		'none',
	);

	/**
	 * Allowed border types for icon styling.
	 */
	const BORDER_TYPES = array(
		'none',
		'solid',
		'dashed',
		'dotted',
		'double',
	);

	/**
	 * Default settings for the Lightbox extension drawer.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_defaults() {
		return array(
			'lightboxProvider'       => 'fancybox',
			'wpImagesEnable'         => true,
			'lightboxIcon'           => array(
				'source'   => 'icon',
				'iconName' => 'search',
				'image'    => array(),
			),
			'lightboxIconStyle'      => 'default',
			'iconDisplayPosition'    => 'top-right',
			'iconVisible'            => 'hover',
			'iconOffset'             => array(
				'value' => 12,
				'unit'  => 'px',
			),
			'lightboxTheme'          => 'dark',
			'closeOnClickOutside'    => true,
			'navigationArrow'        => true,
			'transitionEffect'       => 'zoom',
			'itemCounter'            => true,
			'thumbnailsDisplayStyle' => 'classic',
			'iconStyle'              => array(
				'size'         => self::default_responsive_range( 20 ),
				'borderRadius' => self::default_spacing( '0' ),
				'padding'      => self::default_spacing( '11' ),
				'normal'       => self::default_icon_state_style(),
				'hover'        => self::default_icon_state_style(),
			),
		);
	}

	/**
	 * Default icon style state (normal / hover).
	 *
	 * @return array<string, mixed>
	 */
	private static function default_icon_state_style() {
		return array(
			'iconColor'       => '',
			'backgroundColor' => '',
			'border'          => array(
				'style' => 'none',
				'color' => '',
			),
			'borderWidth'     => self::default_spacing( '0' ),
		);
	}

	/**
	 * Default spacing attribute (block inspector shape).
	 *
	 * @param string $value Side value.
	 * @return array<string, mixed>
	 */
	private static function default_spacing( $value = '0' ) {
		$side = (string) $value;
		return array(
			'allChange' => true,
			'unit'      => array(
				'Desktop' => 'px',
				'Tablet'  => 'px',
				'Mobile'  => 'px',
			),
			'device'    => array(
				'Desktop' => array(
					'top'    => $side,
					'right'  => $side,
					'bottom' => $side,
					'left'   => $side,
				),
			),
		);
	}

	/**
	 * Default responsive range attribute (block inspector shape).
	 *
	 * @param int    $desktop_value Desktop numeric value.
	 * @param string $unit          Default unit.
	 * @return array<string, mixed>
	 */
	private static function default_responsive_range( $desktop_value, $unit = 'px' ) {
		$value = (int) $desktop_value;
		return array(
			'device' => array(
				'Desktop' => $value,
				'Tablet'  => $value,
				'Mobile'  => $value,
			),
			'unit'   => array(
				'Desktop' => $unit,
				'Tablet'  => $unit,
				'Mobile'  => $unit,
			),
		);
	}

	/**
	 * Merged settings for runtime / JS.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_settings() {
		$all = Module_Settings_Helper::get_all_settings();
		$raw = isset( $all[ self::MODULE ] ) && is_array( $all[ self::MODULE ] )
			? $all[ self::MODULE ]
			: array();

		$merged = Array_Merge::deep( self::get_defaults(), $raw );

		if ( isset( $merged['iconStyle'] ) && is_array( $merged['iconStyle'] ) ) {
			$merged['iconStyle']['size'] = self::migrate_legacy_icon_size(
				$merged['iconStyle']['size'] ?? null
			);
		}

		return $merged;
	}

	/**
	 * Sanitize block-level lightbox icon style config (same shape as extension iconStyle).
	 *
	 * @param mixed $incoming Raw icon style config from block attributes.
	 * @return array<string, mixed>
	 */
	public static function sanitize_block_icon_style_config( $incoming ) {
		if ( ! is_array( $incoming ) ) {
			return array();
		}

		return self::sanitize_icon_style( $incoming );
	}

	/**
	 * Sanitize incoming lightbox settings.
	 *
	 * @param array<string, mixed> $incoming Raw payload.
	 * @return array<string, mixed>
	 */
	public static function sanitize( array $incoming ) {
		$defaults = self::get_defaults();

		$icon_style_in = isset( $incoming['iconStyle'] ) && is_array( $incoming['iconStyle'] )
			? $incoming['iconStyle']
			: array();

		return array(
			'lightboxProvider'       => self::sanitize_enum(
				$incoming['lightboxProvider'] ?? '',
				self::PROVIDERS,
				$defaults['lightboxProvider']
			),
			'wpImagesEnable'         => self::sanitize_bool( $incoming, 'wpImagesEnable', $defaults['wpImagesEnable'] ),
			'lightboxIcon'           => self::sanitize_icon( $incoming['lightboxIcon'] ?? null ),
			'lightboxIconStyle'      => self::sanitize_enum(
				$incoming['lightboxIconStyle'] ?? '',
				self::ICON_STYLES,
				$defaults['lightboxIconStyle']
			),
			'iconDisplayPosition'    => self::sanitize_enum(
				$incoming['iconDisplayPosition'] ?? '',
				self::ICON_POSITIONS,
				$defaults['iconDisplayPosition']
			),
			'iconOffset'             => self::sanitize_offset( $incoming['iconOffset'] ?? $defaults['iconOffset'] ),
			'iconVisible'            => self::sanitize_icon_visible( $incoming['iconVisible'] ?? $defaults['iconVisible'] ),
			'lightboxTheme'          => self::sanitize_enum(
				$incoming['lightboxTheme'] ?? '',
				self::THEMES,
				$defaults['lightboxTheme']
			),
			'closeOnClickOutside'    => self::sanitize_bool( $incoming, 'closeOnClickOutside', $defaults['closeOnClickOutside'] ),
			'navigationArrow'        => self::sanitize_bool( $incoming, 'navigationArrow', $defaults['navigationArrow'] ),
			'transitionEffect'       => self::sanitize_enum(
				$incoming['transitionEffect'] ?? '',
				self::TRANSITION_EFFECTS,
				$defaults['transitionEffect']
			),
			'itemCounter'            => self::sanitize_bool( $incoming, 'itemCounter', $defaults['itemCounter'] ),
			'thumbnailsDisplayStyle' => self::sanitize_enum(
				$incoming['thumbnailsDisplayStyle'] ?? '',
				self::THUMBNAIL_STYLES,
				$defaults['thumbnailsDisplayStyle']
			),
			'iconStyle'              => self::sanitize_icon_style( $icon_style_in ),
		);
	}

	/**
	 * Sanitize featured-icon structure.
	 *
	 * @param mixed $icon Raw icon.
	 * @return array<string, mixed>
	 */
	private static function sanitize_icon( $icon ) {
		$default = self::get_defaults()['lightboxIcon'];

		if ( ! is_array( $icon ) ) {
			return $default;
		}

		$source = ( isset( $icon['source'] ) && 'custom' === $icon['source'] ) ? 'custom' : 'icon';
		$image  = array();

		if ( isset( $icon['image'] ) && is_array( $icon['image'] ) ) {
			$image = array(
				'id'  => isset( $icon['image']['id'] ) ? \absint( $icon['image']['id'] ) : 0,
				'url' => isset( $icon['image']['url'] ) ? \esc_url_raw( (string) $icon['image']['url'] ) : '',
				'alt' => isset( $icon['image']['alt'] ) ? \sanitize_text_field( (string) $icon['image']['alt'] ) : '',
			);
		}

		$icon_name = ! empty( $icon['iconName'] ) ? \sanitize_key( (string) $icon['iconName'] ) : $default['iconName'];

		return array(
			'source'   => $source,
			'iconName' => $icon_name,
			'image'    => $image,
		);
	}

	/**
	 * Sanitize icon style panel (size + normal/hover states).
	 *
	 * @param array<string, mixed> $incoming Raw icon style.
	 * @return array<string, mixed>
	 */
	private static function sanitize_icon_style( array $incoming ) {
		$defaults = self::get_defaults()['iconStyle'];

		$size_default  = $defaults['size'];
		$size_fallback = 20;
		if ( is_array( $size_default ) ) {
			if ( isset( $size_default['device']['Desktop'] ) ) {
				$size_fallback = (int) $size_default['device']['Desktop'];
			} elseif ( isset( $size_default['value'] ) ) {
				$size_fallback = (int) $size_default['value'];
			}
		}

		$normal_in = isset( $incoming['normal'] ) && is_array( $incoming['normal'] ) ? $incoming['normal'] : array();
		$hover_in  = isset( $incoming['hover'] ) && is_array( $incoming['hover'] ) ? $incoming['hover'] : array();

		$radius_raw  = $incoming['borderRadius'] ?? ( $normal_in['borderRadius'] ?? ( $hover_in['borderRadius'] ?? null ) );
		$padding_raw = $incoming['padding'] ?? ( $normal_in['padding'] ?? ( $hover_in['padding'] ?? null ) );
		$size_raw    = self::migrate_legacy_icon_size( $incoming['size'] ?? null );

		return array(
			'size'         => self::sanitize_range_attr( $size_raw, 1, 200, $size_fallback, 'px' ),
			'borderRadius' => self::sanitize_spacing_attr(
				$radius_raw,
				$defaults['borderRadius'],
				0,
				200
			),
			'padding'      => self::sanitize_spacing_attr(
				$padding_raw,
				$defaults['padding'],
				0,
				200
			),
			'normal'       => self::sanitize_icon_state( empty( $normal_in ) ? null : $normal_in, $defaults['normal'] ),
			'hover'        => self::sanitize_icon_state( empty( $hover_in ) ? null : $hover_in, $defaults['hover'] ),
		);
	}

	/**
	 * Coerce the pre-Figma baked icon size default (75px) to the current 20px default.
	 *
	 * Saved module settings from before the Figma alignment still store 75 across
	 * breakpoints; deep-merge would otherwise keep that stale value forever.
	 *
	 * @param mixed $size Raw size attribute.
	 * @return mixed Migrated size attribute, or the original value.
	 */
	private static function migrate_legacy_icon_size( $size ) {
		$legacy  = 75;
		$current = 20;

		if ( is_numeric( $size ) && $legacy === (int) $size ) {
			return self::default_responsive_range( $current );
		}

		if ( ! is_array( $size ) ) {
			return $size;
		}

		if ( isset( $size['value'] ) && is_numeric( $size['value'] ) && $legacy === (int) $size['value'] ) {
			return self::default_responsive_range( $current );
		}

		if ( isset( $size['device'] ) && is_array( $size['device'] ) ) {
			$values = array();
			foreach ( array( 'Desktop', 'Tablet', 'Mobile' ) as $device ) {
				if ( ! array_key_exists( $device, $size['device'] ) ) {
					continue;
				}
				$raw = $size['device'][ $device ];
				if ( '' === $raw || null === $raw ) {
					continue;
				}
				$values[] = (int) $raw;
			}

			if ( ! empty( $values ) && 1 === count( array_unique( $values ) ) && $legacy === $values[0] ) {
				return self::default_responsive_range( $current );
			}
		}

		return $size;
	}

	/**
	 * Sanitize one icon style state.
	 *
	 * @param mixed                $state    Raw state.
	 * @param array<string, mixed> $fallback Fallback values.
	 * @return array<string, mixed>
	 */
	private static function sanitize_icon_state( $state, array $fallback ) {
		if ( ! is_array( $state ) ) {
			return $fallback;
		}

		$border_in = isset( $state['border'] ) && is_array( $state['border'] )
			? $state['border']
			: array();
		if ( empty( $border_in ) && isset( $state['borderType'] ) ) {
			$border_in = array( 'style' => $state['borderType'] );
		}

		$border_fallback = $fallback['border'] ?? array(
			'style' => 'none',
			'color' => '',
		);

		return array(
			'iconColor'       => self::sanitize_color( $state['iconColor'] ?? '' ),
			'backgroundColor' => self::sanitize_color( $state['backgroundColor'] ?? '' ),
			'border'          => self::sanitize_border_attr( $border_in, $border_fallback ),
			'borderWidth'     => self::sanitize_spacing_attr(
				$state['borderWidth'] ?? null,
				$fallback['borderWidth'] ?? self::default_spacing( '0' ),
				0,
				50
			),
		);
	}

	/**
	 * Sanitize border object (style + color).
	 *
	 * @param array<string, mixed> $incoming  Raw border.
	 * @param array<string, mixed> $fallback  Fallback border.
	 * @return array<string, mixed>
	 */
	private static function sanitize_border_attr( array $incoming, array $fallback ) {
		$style = self::sanitize_enum(
			$incoming['style'] ?? ( $incoming['hoverStyle'] ?? '' ),
			self::BORDER_TYPES,
			$fallback['style'] ?? 'none'
		);

		return array(
			'style' => $style,
			'color' => self::sanitize_color( $incoming['color'] ?? ( $fallback['color'] ?? '' ) ),
		);
	}

	/**
	 * Sanitize spacing attribute (unit + value sides). Accepts legacy numeric (all sides).
	 *
	 * @param mixed                $raw       Raw spacing.
	 * @param array<string, mixed> $fallback  Fallback spacing.
	 * @param int                  $min       Min per side.
	 * @param int                  $max       Max per side.
	 * @return array<string, mixed>
	 */
	private static function sanitize_spacing_attr( $raw, array $fallback, $min, $max ) {
		if ( is_numeric( $raw ) ) {
			return self::default_spacing( (string) $raw );
		}

		if ( ! is_array( $raw ) ) {
			return $fallback;
		}

		if ( isset( $raw['device'] ) && is_array( $raw['device'] ) ) {
			$devices         = array( 'Desktop', 'Tablet', 'Mobile' );
			$device_out      = array();
			$unit_out        = array();
			$fallback_device = isset( $fallback['device']['Desktop'] ) && is_array( $fallback['device']['Desktop'] )
				? $fallback['device']['Desktop']
				: array(
					'top'    => '0',
					'right'  => '0',
					'bottom' => '0',
					'left'   => '0',
				);
			$fallback_units  = isset( $fallback['unit'] ) && is_array( $fallback['unit'] )
				? $fallback['unit']
				: array(
					'Desktop' => 'px',
					'Tablet'  => 'px',
					'Mobile'  => 'px',
				);

			foreach ( $devices as $device ) {
				$raw_unit            = $raw['unit'][ $device ] ?? ( $fallback_units[ $device ] ?? 'px' );
				$unit_out[ $device ] = in_array( $raw_unit, array( 'px', '%', 'em' ), true ) ? $raw_unit : 'px';

				$value_in = isset( $raw['device'][ $device ] ) && is_array( $raw['device'][ $device ] )
					? $raw['device'][ $device ]
					: $fallback_device;

				$sides        = array( 'top', 'right', 'bottom', 'left' );
				$device_value = array();
				foreach ( $sides as $side ) {
					$side_raw              = $value_in[ $side ] ?? ( $fallback_device[ $side ] ?? '0' );
					$device_value[ $side ] = (string) self::sanitize_dimension( $side_raw, $min, $max, (int) ( $fallback_device[ $side ] ?? 0 ) );
				}
				$device_out[ $device ] = $device_value;
			}

			return array(
				'allChange' => ! empty( $raw['allChange'] ),
				'unit'      => $unit_out,
				'device'    => $device_out,
			);
		}

		$unit = isset( $raw['unit'] ) ? \sanitize_text_field( (string) $raw['unit'] ) : 'px';
		if ( ! in_array( $unit, array( 'px', '%', 'em' ), true ) ) {
			$unit = 'px';
		}

		$value_in = array();
		if ( isset( $raw['value'] ) && is_array( $raw['value'] ) ) {
			$value_in = $raw['value'];
		}

		$fallback_value = isset( $fallback['device']['Desktop'] ) && is_array( $fallback['device']['Desktop'] )
			? $fallback['device']['Desktop']
			: array(
				'top'    => '0',
				'right'  => '0',
				'bottom' => '0',
				'left'   => '0',
			);

		$sides = array( 'top', 'right', 'bottom', 'left' );
		$value = array();
		foreach ( $sides as $side ) {
			$side_raw       = $value_in[ $side ] ?? ( $fallback_value[ $side ] ?? '0' );
			$value[ $side ] = (string) self::sanitize_dimension( $side_raw, $min, $max, (int) ( $fallback_value[ $side ] ?? 0 ) );
		}

		return array(
			'allChange' => ! empty( $raw['allChange'] ),
			'unit'      => array(
				'Desktop' => $unit,
				'Tablet'  => $unit,
				'Mobile'  => $unit,
			),
			'device'    => array(
				'Desktop' => $value,
			),
		);
	}

	/**
	 * Sanitize range attribute { value, unit } or legacy number.
	 *
	 * @param mixed  $raw       Raw range.
	 * @param int    $min       Minimum value.
	 * @param int    $max       Maximum value.
	 * @param int    $fallback  Fallback numeric value.
	 * @param string $unit      Default unit.
	 * @return array<string, mixed>
	 */
	private static function sanitize_range_attr( $raw, $min, $max, $fallback, $unit = 'px' ) {
		if ( is_numeric( $raw ) ) {
			return self::default_responsive_range( self::sanitize_dimension( $raw, $min, $max, $fallback ), $unit );
		}

		if ( ! is_array( $raw ) ) {
			return self::default_responsive_range( $fallback, $unit );
		}

		if ( isset( $raw['device'] ) && is_array( $raw['device'] ) ) {
			$devices        = array( 'Desktop', 'Tablet', 'Mobile' );
			$device_out     = array();
			$unit_out       = array();
			$fallback_units = isset( $raw['unit'] ) && is_array( $raw['unit'] )
				? $raw['unit']
				: array(
					'Desktop' => $unit,
					'Tablet'  => $unit,
					'Mobile'  => $unit,
				);

			foreach ( $devices as $device ) {
				$device_fallback       = (int) $fallback;
				$device_out[ $device ] = self::sanitize_dimension(
					$raw['device'][ $device ] ?? $device_fallback,
					$min,
					$max,
					$device_fallback
				);
				$raw_unit              = $raw['unit'][ $device ] ?? ( $fallback_units[ $device ] ?? $unit );
				$unit_out[ $device ]   = in_array( $raw_unit, array( 'px', '%', 'em', 'sec', 's' ), true ) ? $raw_unit : $unit;
			}

			return array(
				'device' => $device_out,
				'unit'   => $unit_out,
			);
		}

		$value     = self::sanitize_dimension( $raw['value'] ?? $fallback, $min, $max, $fallback );
		$raw_unit  = isset( $raw['unit'] ) ? \sanitize_text_field( (string) $raw['unit'] ) : $unit;
		$safe_unit = in_array( $raw_unit, array( 'px', '%', 'em', 'sec', 's' ), true ) ? $raw_unit : $unit;

		return self::default_responsive_range( $value, $safe_unit );
	}

	/**
	 * Sanitize hex/rgba color or empty string.
	 *
	 * @param mixed $raw Raw color.
	 * @return string
	 */
	private static function sanitize_color( $raw ) {
		$color = \sanitize_text_field( (string) $raw );
		if ( '' === $color ) {
			return '';
		}

		if ( preg_match( '/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/', $color ) ) {
			return strtolower( $color );
		}

		if ( preg_match( '/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^var\(--[a-zA-Z0-9-_]+\)$/', $color ) ) {
			return $color;
		}

		return '';
	}

	/**
	 * Sanitize global icon visibility (always / hover).
	 *
	 * @param mixed $raw Raw value.
	 * @return string
	 */
	private static function sanitize_icon_visible( $raw ) {
		$allowed = array( 'always', 'hover' );
		$vis     = sanitize_key( (string) $raw );
		return in_array( $vis, $allowed, true ) ? $vis : self::get_defaults()['iconVisible'];
	}

	/**
	 * Sanitize icon offset (px).
	 *
	 * @param mixed $raw Raw offset.
	 * @return int
	 */
	private static function sanitize_offset( $raw ) {
		$default_value = 12;
		$default_unit  = 'px';
		$value         = $default_value;
		$unit          = $default_unit;

		if ( is_numeric( $raw ) ) {
			$value = $raw;
		} elseif ( is_array( $raw ) ) {
			if ( isset( $raw['value'] ) ) {
				$value = $raw['value'];
				if ( isset( $raw['unit'] ) && is_string( $raw['unit'] ) ) {
					$unit = $raw['unit'];
				}
			} elseif ( isset( $raw['device']['Desktop'] ) ) {
				$value = $raw['device']['Desktop'];
				if ( isset( $raw['unit']['Desktop'] ) ) {
					$unit = (string) $raw['unit']['Desktop'];
				}
			}
		}

		return array(
			'value' => self::sanitize_dimension( $value, 0, 200, $default_value ),
			'unit'  => in_array( $unit, array( 'px', '%', 'em' ), true ) ? $unit : $default_unit,
		);
	}

	/**
	 * Sanitize numeric dimension within bounds.
	 *
	 * @param mixed $raw      Raw value.
	 * @param int   $min      Minimum.
	 * @param int   $max      Maximum.
	 * @param int   $fallback Fallback.
	 * @return int
	 */
	private static function sanitize_dimension( $raw, $min, $max, $fallback ) {
		if ( ! is_numeric( $raw ) ) {
			return $fallback;
		}

		$value = (int) round( (float) $raw );
		return max( $min, min( $max, $value ) );
	}

	/**
	 * Sanitize a boolean toggle, falling back to its default when the key is absent.
	 *
	 * A present value is cast with empty() semantics; a missing key resolves to the
	 * schema default. This mirrors the enum/offset fallbacks — without it, true-by-
	 * default toggles would be silently reset to false on any partial payload.
	 *
	 * @param array<string, mixed> $source   Incoming (sub-)array.
	 * @param string               $key      Option key.
	 * @param bool                 $fallback Default used when the key is absent.
	 * @return bool
	 */
	private static function sanitize_bool( array $source, $key, $fallback ) {
		if ( ! array_key_exists( $key, $source ) ) {
			return (bool) $fallback;
		}
		return ! empty( $source[ $key ] );
	}

	/**
	 * Sanitize value against allowed list.
	 *
	 * @param string   $raw      Raw value.
	 * @param string[] $allowed  Allowed values.
	 * @param string   $fallback Fallback.
	 * @return string
	 */
	private static function sanitize_enum( $raw, array $allowed, $fallback ) {
		$value = \sanitize_key( (string) $raw );
		return in_array( $value, $allowed, true ) ? $value : $fallback;
	}
}
