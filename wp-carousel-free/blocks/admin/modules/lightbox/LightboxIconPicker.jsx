import { __ } from '@wordpress/i18n';
import LightboxIconGrid from '../../../components/lightboxIconGrid/LightboxIconGrid';
import { LIGHTBOX_ICON_PRESETS } from '../../../components/lightboxIconGrid/presets';
import { DEFAULT_LIGHTBOX_ICON_NAME } from '../config/lightboxDefaults';

/**
 * Global lightbox icon source picker — preset grid + custom upload (Figma).
 * Adapts the object value shape ({ source, iconName, image }) onto the shared
 * presentational grid used across admin + block contexts.
 *
 * @param {Object}   props
 * @param {Object}   props.lightboxIcon
 * @param {Function} props.onChange
 */
export default function LightboxIconPicker({ lightboxIcon, onChange }) {
	const icon = lightboxIcon || {
		source: 'icon',
		iconName: DEFAULT_LIGHTBOX_ICON_NAME,
		image: {},
	};
	const isCustom = 'custom' === icon.source;

	return (
		<LightboxIconGrid
			presets={LIGHTBOX_ICON_PRESETS}
			activeIconKey={isCustom ? '' : icon.iconName || DEFAULT_LIGHTBOX_ICON_NAME}
			isCustom={isCustom}
			customImageUrl={icon.image?.url}
			customImageId={icon.image?.id}
			uploadLabel={__('Upload custom lightbox icon', 'wp-carousel-free')}
			onSelectIcon={(iconName) =>
				onChange({
					source: 'icon',
					iconName: iconName || DEFAULT_LIGHTBOX_ICON_NAME,
					image: {},
				})
			}
			onSelectCustom={(image) =>
				onChange({
					source: 'custom',
					iconName: icon.iconName || DEFAULT_LIGHTBOX_ICON_NAME,
					image: image || {},
				})
			}
			onRemoveCustom={() =>
				onChange({
					source: 'custom',
					iconName: icon.iconName || DEFAULT_LIGHTBOX_ICON_NAME,
					image: {},
				})
			}
		/>
	);
}
