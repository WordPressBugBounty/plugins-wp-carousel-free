/**
 * Watermark is Pro. This panel is a picture of Pro's settings, not a copy of them —
 * no state, no handlers, no option key, no save path. The drawer renders it inside an
 * `inert` wrapper, so the no-op callbacks below are never reached.
 */
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import SelectField from '@wp-carousel-pro/components/selectField/selectField';
import Units from '../../../components/rangeControl/units';
import { IconImage } from '../../../icons/icons';
import ModuleDrawerSection from '../components/ModuleDrawerSection';
import ModuleDrawerRow from '../components/ModuleDrawerRow';
import {
	DrawerNumberField,
	DrawerToggleGroupField,
	DrawerToggleSwitch,
} from '../components/DrawerWpControlFields';

const noop = () => {};

const AXIS_UNITS = ['px', '%'];

const CloseSmallIcon = () => (
	<svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
		<path
			d="M10 10.7778L12.7222 13.5L13.5 12.7222L10.7778 10L13.5 7.27778L12.7222 6.50001L10 9.22223L7.27778 6.5L6.5 7.27778L9.22223 10L6.50001 12.7222L7.27778 13.5L10 10.7778Z"
			fill="currentColor"
		/>
	</svg>
);

const ChevronIcon = ({ up = false }) => (
	<svg
		width={20}
		height={20}
		viewBox="0 0 20 20"
		fill="none"
		aria-hidden="true"
		className={up ? 'is-flipped' : ''}
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M15.0037 8.79579L10 13.3447L4.99625 8.7958L5.83709 7.87087L10 11.6553L14.1629 7.87087L15.0037 8.79579Z"
			fill="currentColor"
		/>
	</svg>
);

const UploadIcon = () => (
	<svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path
			d="M8 10.5V2.5M8 2.5L5 5.5M8 2.5L11 5.5M2.5 10v2A1.5 1.5 0 0 0 4 13.5h8a1.5 1.5 0 0 0 1.5-1.5v-2"
			stroke="currentColor"
			strokeWidth={1.25}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * One axis of a width/height or offset pair: label and unit chip above, value below.
 *
 * @param {Object}        props
 * @param {string}        props.label
 * @param {number|string} [props.value] Omit for an "Auto" axis.
 * @param {string}        [props.unit]
 */
const ShowcaseAxisField = ({ label, value = '', unit = 'px' }) => (
	<div className="wpcp-watermark-showcase-axis">
		<div className="wpcp-watermark-showcase-axis__head">
			<span className="wpcp-watermark-showcase-axis__label">{label}</span>
			<Units attributes={{ unit }} units={AXIS_UNITS} onUnitChange={noop} />
		</div>
		<NumberControl
			className="wpcp-watermark-showcase-axis__input"
			value={value}
			placeholder={__('Auto', 'wp-carousel-free')}
			spinControls="native"
			onChange={noop}
			__next40pxDefaultSize
		/>
	</div>
);

/**
 * @param {Object}  props
 * @param {string}  props.label
 * @param {boolean} [props.expanded]
 */
const ShowcaseStyleHeader = ({ label, expanded = false }) => (
	<div className={`wpcp-watermark-showcase-style__header${expanded ? ' is-expanded' : ''}`}>
		<span className="wpcp-watermark-showcase-style__title">{label}</span>
		<span className="wpcp-watermark-showcase-style__actions">
			<CloseSmallIcon />
			<span className="wpcp-watermark-showcase-style__divider" />
			<ChevronIcon up={expanded} />
		</span>
	</div>
);

export default function WatermarkShowcasePanel() {
	return (
		<div className="wpcp-watermark-showcase-panel">
			<ModuleDrawerSection title={__('Configure Watermarks', 'wp-carousel-free')}>
				<div className="wpcp-watermark-showcase-accordion">
					<div className="wpcp-watermark-showcase-style is-expanded">
						<ShowcaseStyleHeader label={__('Style One', 'wp-carousel-free')} expanded />
						<div className="wpcp-watermark-showcase-style__body">
							<ModuleDrawerRow title={__('Watermark Type', 'wp-carousel-free')}>
								<DrawerToggleGroupField
									value="image"
									items={[
										{ value: 'image', label: __('Image', 'wp-carousel-free') },
										{ value: 'text', label: __('Text', 'wp-carousel-free') },
									]}
									onChange={noop}
								/>
							</ModuleDrawerRow>

							<ModuleDrawerRow title={__('Watermark Image', 'wp-carousel-free')}>
								<div className="wpcp-watermark-showcase-media">
									<div className="wpcp-watermark-showcase-media__preview">
										<span className="wpcp-watermark-showcase-media__thumb">
											<IconImage />
										</span>
										<span className="wpcp-watermark-showcase-media__name">wpc-watermark-placeholder.png</span>
									</div>
									<span className="wpcp-watermark-showcase-media__upload">
										<UploadIcon />
									</span>
								</div>
							</ModuleDrawerRow>

							<ModuleDrawerRow title={__('Display Style', 'wp-carousel-free')}>
								<SelectField
									attributes="default"
									attributesKey="displayStyle"
									setAttributes={noop}
									label=""
									flexStyle
									extraClassName="wpcp-module-drawer-select"
									items={[
										{ label: __('Default', 'wp-carousel-free'), value: 'default' },
										{ label: __('Style One', 'wp-carousel-free'), value: 'style-one' },
										{ label: __('Style Two', 'wp-carousel-free'), value: 'style-two' },
									]}
								/>
							</ModuleDrawerRow>

							<ModuleDrawerRow
								title={__('Image Size', 'wp-carousel-free')}
								className="wpcp-watermark-showcase-row--wide"
							>
								<div className="wpcp-watermark-showcase-pair">
									<ShowcaseAxisField label={__('Width', 'wp-carousel-free')} value={28} />
									<ShowcaseAxisField label={__('Height', 'wp-carousel-free')} />
								</div>
							</ModuleDrawerRow>

							<ModuleDrawerRow title={__('Image Quality', 'wp-carousel-free')}>
								<DrawerNumberField
									value={80}
									unit="%"
									units={['%']}
									defaultValue={100}
									defaultUnit="%"
									min={1}
									onChange={noop}
									onUnitChange={noop}
								/>
							</ModuleDrawerRow>

							<ModuleDrawerRow title={__('Repeat Watermark', 'wp-carousel-free')}>
								<DrawerToggleSwitch
									label={__('Repeat Watermark', 'wp-carousel-free')}
									checked={false}
									onChange={noop}
								/>
							</ModuleDrawerRow>

							<ModuleDrawerRow title={__('Watermark Position', 'wp-carousel-free')}>
								<SelectField
									attributes="bottom-right"
									attributesKey="position"
									setAttributes={noop}
									label=""
									flexStyle
									extraClassName="wpcp-module-drawer-select"
									items={[
										{ label: __('Top Left', 'wp-carousel-free'), value: 'top-left' },
										{ label: __('Top Center', 'wp-carousel-free'), value: 'top-center' },
										{ label: __('Top Right', 'wp-carousel-free'), value: 'top-right' },
										{ label: __('Center Left', 'wp-carousel-free'), value: 'center-left' },
										{ label: __('Center', 'wp-carousel-free'), value: 'center' },
										{ label: __('Center Right', 'wp-carousel-free'), value: 'center-right' },
										{ label: __('Bottom Left', 'wp-carousel-free'), value: 'bottom-left' },
										{ label: __('Bottom Center', 'wp-carousel-free'), value: 'bottom-center' },
										{ label: __('Bottom Right', 'wp-carousel-free'), value: 'bottom-right' },
									]}
								/>
							</ModuleDrawerRow>

							<ModuleDrawerRow
								title={__('Offset Watermark', 'wp-carousel-free')}
								className="wpcp-watermark-showcase-row--wide"
							>
								<div className="wpcp-watermark-showcase-pair">
									<ShowcaseAxisField label={__('Offset X', 'wp-carousel-free')} value={28} />
									<ShowcaseAxisField label={__('Offset Y', 'wp-carousel-free')} />
								</div>
							</ModuleDrawerRow>

							<ModuleDrawerRow title={__('Watermark Transparency', 'wp-carousel-free')}>
								<DrawerNumberField
									value={80}
									unit="%"
									units={['%']}
									defaultValue={50}
									defaultUnit="%"
									onChange={noop}
									onUnitChange={noop}
								/>
							</ModuleDrawerRow>
						</div>
					</div>

					<div className="wpcp-watermark-showcase-style">
						<ShowcaseStyleHeader label={__('Style Two', 'wp-carousel-free')} />
					</div>
				</div>

				<span className="wpcp-watermark-showcase-add">
					{__('Add New Watermark', 'wp-carousel-free')}
				</span>
			</ModuleDrawerSection>

			<ModuleDrawerSection>
				<ModuleDrawerRow
					title={__('Purge Watermark Cache', 'wp-carousel-free')}
					infoTip={__(
						'Purging cached watermarked images ensures recent configuration changes appear on the frontend.',
						'wp-carousel-free'
					)}
				>
					<span className="wpcp-watermark-showcase-purge">{__('Purge Cache', 'wp-carousel-free')}</span>
				</ModuleDrawerRow>
			</ModuleDrawerSection>
		</div>
	);
}
