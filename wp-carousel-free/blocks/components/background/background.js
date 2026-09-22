import { __ } from '@wordpress/i18n';
import { Button, GradientPicker } from '@wordpress/components';
import './editor.scss';
import SpColorPicker from '../color/color';
import SPRangeControl from '../rangeControl/rangeControl';
import MediaPicker from '../mediaUpload/image';
import { BgIcon, GradientIcon, Image, TransparentIcon, Video } from './svgIcon';

// Default gradients - no global settings needed
const DEFAULT_GRADIENTS = [
	{
		name: 'Ocean Breeze',
		gradient: 'linear-gradient(46deg,rgb(0,97,255) 4%,rgb(96,239,255) 93%)',
		slug: 'ocean_breeze',
	},
	{
		name: 'Cosmic Fusion',
		gradient: 'linear-gradient(46deg,rgb(232,28,255) 4%,rgb(64,201,255) 93%)',
		slug: 'cosmic_fusion',
	},
	{
		name: 'Sunset Blaze',
		gradient: 'linear-gradient(46deg,rgb(255,15,123) 4%,rgb(248,155,41) 93%)',
		slug: 'sunset_blaze',
	},
	{
		name: 'Dreamy Violet',
		gradient: 'linear-gradient(46deg,rgb(211,151,250) 4%,rgb(131,100,232) 93%)',
		slug: 'dreamy_violet',
	},
	{
		name: 'Peach Bloom',
		gradient: 'linear-gradient(46deg,rgb(246,213,247) 4%,rgb(251,233,215) 93%)',
		slug: 'peach_bloom',
	},
	{
		name: 'Aqua Depths',
		gradient: 'linear-gradient(46deg,rgb(0,173,181) 4%,rgb(9,95,92) 93%)',
		slug: 'aqua_depths',
	},
	{
		name: 'Midnight Steel',
		gradient: 'linear-gradient(46deg,rgb(36,55,72) 4%,rgb(75,116,159) 93%)',
		slug: 'midnight_steel',
	},
];

const BGTypeIcons = {
	transparent: <TransparentIcon />,
	solid: <BgIcon />,
	gradient: <GradientIcon />,
	image: <Image />,
	video: <Video />,
};

// Human-readable labels for the type buttons; the raw item keys are English
// slugs that would otherwise ship untranslated.
const BG_TYPE_LABELS = {
	transparent: __('Transparent', 'wp-carousel-free'),
	solid: __('Solid', 'wp-carousel-free'),
	gradient: __('Gradient', 'wp-carousel-free'),
	image: __('Image', 'wp-carousel-free'),
	video: __('Video', 'wp-carousel-free'),
};

const Background = ({
	attributes,
	attributesKey,
	setAttributes,
	label = __('Background Type', 'wp-carousel-free'),
	items = ['transparent', 'solid', 'gradient'],
	transition,
	colorLabel = __('Background Color', 'wp-carousel-free'),
	defaultColor,
	styleState = false,
	imageKey,
	image,
	videoObj = {},
}) => {
	const defaultGradients = DEFAULT_GRADIENTS;
	const customGradients = [];
	const bgType = styleState === false ? attributes?.style : attributes[styleState]?.style;
	const solidValue = styleState === false ? attributes?.solid : attributes[styleState].solid;
	const gradientValue =
		styleState === false ? attributes?.gradient : attributes[styleState]?.gradient;

	// Set background type
	const setBgType = (newValue) => {
		if (styleState === false) {
			setAttributes({
				[attributesKey]: {
					...attributes,
					style: newValue,
				},
			});
		} else {
			setAttributes({
				[attributesKey]: {
					...attributes,
					[styleState]: {
						...attributes[styleState],
						style: newValue,
					},
				},
			});
		}
	};

	const onChangeColorValue = (newColor) => {
		if (styleState === false) {
			setAttributes({
				[attributesKey]: {
					...attributes,
					[bgType]: newColor,
				},
			});
		} else {
			setAttributes({
				[attributesKey]: {
					...attributes,
					[styleState]: {
						...attributes[styleState],
						[bgType]: newColor,
					},
				},
			});
		}
	};

	return (
		<>
			<div className="wpcp-background wpcp-component-mb">
				{/* Background type */}
				<div className={`wpcp-background-control wpcp-d-flex wpcp-component-mb`}>
					<span className="wpcp-component-title">{label}</span>
					<div className={`wpcp-background-left`}>
						{items?.map((item, i) => (
							<Button className={bgType === item ? 'active' : ''} key={i} onClick={() => setBgType(item)}>
								<span>{BGTypeIcons[item]}</span>
								{<p>{BG_TYPE_LABELS[item] || item}</p>}
							</Button>
						))}
					</div>
				</div>
				<>
					{'solid' === bgType && (
						<>
							<SpColorPicker
								label={colorLabel}
								value={solidValue}
								onChange={onChangeColorValue}
								defaultColor={defaultColor}
							/>
							{'hover' === styleState && transition && (
								<SPRangeControl
									label={__('Transition', 'wp-carousel-free')}
									setAttributes={setAttributes}
									attributes={transition.value}
									units={false}
									step={0.1}
									min={0}
									max={30}
									defaultValue={{ unit: 'px', value: 0.3 }}
									attributesKey={transition.key}
								/>
							)}
						</>
					)}
					{'gradient' === bgType && (
						<GradientPicker
							value={
								gradientValue ||
								'linear-gradient(90deg, rgba(0, 0, 0, 0.68) 0.09%, rgba(0, 0, 0, 0.07) 99.95%)'
							}
							gradients={[...defaultGradients, ...customGradients]}
							onChange={onChangeColorValue}
						/>
					)}
					{'image' === bgType && (
						<MediaPicker
							label={__('Background Image', 'wp-carousel-free')}
							enableImageSize={false}
							backgroundImage={image}
							imageKey={imageKey}
							setAttributes={setAttributes}
						/>
					)}
					{'video' === bgType && (
						<MediaPicker
							label={__('Video', 'wp-carousel-free')}
							imageKey={videoObj.imageKey}
							mediaType="video"
							slug="video"
							enableImageSize={false}
							setAttributes={setAttributes}
							backgroundImage={videoObj.backgroundImage}
						/>
					)}
				</>
			</div>
		</>
	);
};

export default Background;
