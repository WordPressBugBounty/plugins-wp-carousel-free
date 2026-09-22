import { getEditorVideoSrc, getVideoEmbedUrl, getVideoSourceType } from '../../utils';
import {
	PlayIconOne,
	PlayIconTwo,
	PlayIconThree,
	PlayIconFour,
	PlayIconFive,
	PlayIconSix,
	VideoIconYouTube,
	VimeoPalyIcon,
} from '@wp-carousel-pro/icons/videoSourceIcons';
import classNames from 'classnames';

const sourcePlayIcon = {
	youtube: <VideoIconYouTube />,
	vimeo: <VimeoPalyIcon />,
};

const videoPlayIcons = {
	playIconOne: PlayIconOne,
	playIconTwo: PlayIconTwo,
	playIconThree: PlayIconThree,
	playIconFour: PlayIconFour,
	playIconFive: PlayIconFive,
	playIconSix: PlayIconSix,
};

export const VideoItemContent = ({ videoPlay, videoAttr, img, item }) => {
	// Fallbacks mirror VideoCardRenderer::render_card — a block whose author has
	// never opened the Video panel carries a partial videoOptions bag.
	const {
		iconView = 'stacked',
		showOnHover,
		animation = 'none',
		aspectRatio = '16:9',
		thumbnailSize = 'cover',
		overlayEnable,
		videoIcon,
		useSourceIcon,
	} = videoAttr || {};

	const videoSource =
		item?.video_source ||
		item?.extra?.videoSource ||
		getVideoSourceType(item?.extra?.videoUrl || item?.video_url || '');
	const videoUrl = item?.extra?.videoUrl || item?.video_url || '';
	const embedUrl = getVideoEmbedUrl(videoSource, videoUrl);
	// In the editor the player iframe is routed through a same-origin proxy so cross-origin
	// providers still receive a valid Referer.
	const videoSrcAttr = videoPlay === true ? { src: getEditorVideoSrc(videoSource, embedUrl) } : {};

	// Build data attributes for fancybox
	const dataAttrs = {
		'data-fancybox': '',
		'data-src': embedUrl,
		'data-type': videoSource,
		'data-width': '100vw',
		'data-height': 'calc(100vh - 88px)',
		'data-unique-id': item?.id || '',
	};
	const iframeAttrs =
		videoPlay === true
			? {
					allow:
						'autoplay; encrypted-media; fullscreen; picture-in-picture; web-share; accelerometer; gyroscope',
					allowFullScreen: true,
					playsInline: true,
			  }
			: {};

	const isSourcePlayIcon = !!useSourceIcon;

	const PlayIconComponent = videoPlayIcons[videoIcon] || PlayIconOne;
	let iconContent = <PlayIconComponent />;

	if (isSourcePlayIcon && sourcePlayIcon[videoSource]) {
		iconContent = sourcePlayIcon[videoSource];
	}

	const resolvedIconView = isSourcePlayIcon ? 'normal' : iconView;
	const aspectRatioClass = aspectRatio.replace(':', '-');

	return (
		<div className="wpcp-video-thumbnail-wrapper">
			{overlayEnable && <div className="wpcp-video-thumbnail-overlay"></div>}
			<div
				className={classNames(
					'wpcp-video-thumbnail',
					`wpcp-thumb-size-${thumbnailSize}`,
					`wpcp-aspect-ratio-${aspectRatioClass}`
				)}
			>
				{img}
			</div>
			{!videoPlay && (
				<span
					className={classNames(
						'wpcp-video-item-play',
						`wpcp-icon-view-${resolvedIconView}`,
						showOnHover && 'wpcp-icon-on-hover'
					)}
				>
					{/*
						Editor preview only — the play icon is decorative. Clicking it must
						not swap in the video iframe mid-edit (loads a player, fights block
						selection/drag). Real playback happens on the frontend via the
						videoPlay runtime, which binds its own click handler to this button.
					*/}
					<button
						type="button"
						className={classNames(
							'wpcp-video-play-icon',
							`wpcp-icon-animation-${animation}`,
							isSourcePlayIcon && 'wpcp-source-icon'
						)}
					>
						{iconContent}
					</button>
				</span>
			)}
			<div
				className={`wpcp-video-iframe-wrapper wpcp-inline-video-${videoSource}`}
				{...videoSrcAttr}
				{...dataAttrs}
				{...iframeAttrs}
			></div>
		</div>
	);
};
