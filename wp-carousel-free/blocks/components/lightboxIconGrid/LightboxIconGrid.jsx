/**
 * Inline icon-grid picker shared by the global Lightbox module settings and the
 * block Click Action panel (lightbox icon + URL/link icon). Presentational: the
 * caller maps its own value shape onto the icon-key / custom-image callbacks.
 *
 * Figma: 5552-65071 (lightbox grid) / 5552-65192 (link grid).
 */

import { __ } from '@wordpress/i18n';
import { BaseControl } from '@wordpress/components';
import { MediaUpload } from '@wordpress/media-utils';
import useIconList from '../iconLibrary/useIconList';
import { iconPathList } from '../iconLibrary/iconPaths';
import './editor.scss';

/**
 * Render a preset's SVG body (supports single `path`, multi `paths`, evenodd).
 *
 * @param {string} iconKey  Icon slug.
 * @param {Object} iconList REST icon list keyed by slug.
 * @return {import('react').ReactNode|null} React node or null.
 */
function renderPresetIconSvg(iconKey, iconList) {
	const libraryIcon = iconList?.[iconKey];
	if (!libraryIcon?.path && !libraryIcon?.paths) {
		return null;
	}

	if ('stroke' === libraryIcon.render) {
		return (
			<svg
				viewBox={libraryIcon.viewBox || '0 0 24 24'}
				width="20"
				height="20"
				fill="none"
				stroke="currentColor"
				strokeWidth={libraryIcon.stroke_width || 1.75}
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d={libraryIcon.path} />
			</svg>
		);
	}

	return (
		<svg
			viewBox={libraryIcon.viewBox || '0 0 24 24'}
			width="20"
			height="20"
			fill="currentColor"
			aria-hidden="true"
		>
			{iconPathList(libraryIcon).map((part, index) => (
				<path key={index} d={part.d} fillRule={part.fillRule} />
			))}
		</svg>
	);
}

/**
 * @param {Object}   props
 * @param {string[]} props.presets          Ordered icon-key list to render.
 * @param {string}   props.activeIconKey    Selected library icon key.
 * @param {boolean}  props.isCustom         Whether the custom-upload cell is active.
 * @param {string}   [props.customImageUrl]
 * @param {number}   [props.customImageId]
 * @param {Function} props.onSelectIcon     (iconKey) => void
 * @param {Function} props.onSelectCustom   (image) => void
 * @param {Function} props.onRemoveCustom   () => void
 * @param {string}   [props.label]          Control label rendered above the grid.
 * @param {string}   [props.uploadLabel]    Accessible label for the upload cell.
 */
export default function LightboxIconGrid({
	presets,
	activeIconKey,
	isCustom,
	customImageUrl,
	customImageId,
	onSelectIcon,
	onSelectCustom,
	onRemoveCustom,
	label,
	uploadLabel,
}) {
	const iconList = useIconList();
	const uploadText = uploadLabel || __('Custom icon', 'wp-carousel-free');

	// Human-readable accessible name for a preset: prefer the icon library's own
	// label, else title-case the slug ("zoom-in" → "Zoom In") so screen readers
	// announce a real word instead of the raw key.
	const presetLabel = (iconKey) =>
		iconList?.[iconKey]?.label ||
		iconKey.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

	const grid = (
		<div className="wpcp-lightbox-icon-picker">
			<div className="wpcp-lightbox-icon-picker__presets">
				{presets.map((presetKey) => {
					const isActive = !isCustom && activeIconKey === presetKey;
					return (
						<button
							key={presetKey}
							type="button"
							className={`wpcp-lightbox-icon-preset${isActive ? ' is-active' : ''}`}
							data-icon={presetKey}
							aria-label={presetLabel(presetKey)}
							aria-pressed={isActive}
							title={presetLabel(presetKey)}
							onClick={() => onSelectIcon(presetKey)}
						>
							{renderPresetIconSvg(presetKey, iconList)}
						</button>
					);
				})}
				<div className={`wpcp-lightbox-icon-picker__upload${isCustom ? ' is-active' : ''}`}>
					<MediaUpload
						title={uploadText}
						onSelect={onSelectCustom}
						allowedTypes={['image']}
						value={customImageId || undefined}
						render={({ open }) => (
							<button
								type="button"
								className="wpcp-lightbox-icon-picker__upload-button"
								onClick={open}
								style={customImageUrl ? { backgroundImage: `url("${customImageUrl}")` } : undefined}
								aria-label={uploadText}
							>
								{!customImageUrl && (
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M12 15V4M12 4 8 8M12 4l4 4" />
										<path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
									</svg>
								)}
							</button>
						)}
					/>
					{customImageUrl && (
						<button
							type="button"
							className="wpcp-lightbox-icon-picker__remove"
							onClick={onRemoveCustom}
							aria-label={__('Remove custom icon', 'wp-carousel-free')}
						>
							<span aria-hidden="true">×</span>
						</button>
					)}
				</div>
			</div>
		</div>
	);

	if (!label) {
		return grid;
	}

	return (
		<BaseControl className="wpcp-lightbox-icon-grid-control" __nextHasNoMarginBottom>
			<BaseControl.VisualLabel>{label}</BaseControl.VisualLabel>
			{grid}
		</BaseControl>
	);
}
