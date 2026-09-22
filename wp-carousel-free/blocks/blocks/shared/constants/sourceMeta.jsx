/**
 * UI metadata (labels, icons, input fields) for top-level + sub-source pickers.
 *
 * Kept in a separate file from `./allowedSources.js` because it pulls in
 * `@wordpress/i18n` and React icon components — `allowedSources.js` is
 * intentionally portable (loaded by Node CI scripts).
 *
 * Each metadata array preserves the catalogue order from `allowedSources.js`,
 * and each `_META` map keys icon/label by sub-source identifier so consumers
 * can render filtered grids via `catalogue.map((value) => META[value])`.
 */

import { __ } from '@wordpress/i18n';
import {
	IconImage,
	IconVideo,
	IconPost,
	IconProduct,
	IconAudio,
	IconExternal,
} from '@wp-carousel-pro/icons/icons';
import {
	VideoIconYouTube,
	VideoIconVimeo,
	VideoIconTikTok,
	VideoIconTwitch,
	VideoIconTED,
	VideoIconDailyMotion,
	VideoIconRumble,
	VideoIconWistia,
	VideoIconSproutVideo,
	VideoIconEmbed,
	VideoIconSelfHosted,
	VideoIconMP4URL,
} from '@wp-carousel-pro/icons/videoSourceIcons';

export const SOURCES = [
	{ value: 'image', label: __('Image', 'wp-carousel-free'), icon: <IconImage /> },
	{ value: 'video', label: __('Video', 'wp-carousel-free'), icon: <IconVideo /> },
	{ value: 'post', label: __('Post', 'wp-carousel-free'), icon: <IconPost /> },
	{ value: 'product', label: __('Product', 'wp-carousel-free'), icon: <IconProduct /> },
	{ value: 'audio', label: __('Audio', 'wp-carousel-free'), icon: <IconAudio />, pro: true },
	{
		value: 'external',
		label: __('External', 'wp-carousel-free'),
		icon: <IconExternal />,
		pro: true,
	},
];

export const VIDEO_SOURCES = [
	{ value: 'youtube', label: __('YouTube', 'wp-carousel-free'), icon: <VideoIconYouTube /> },
	{ value: 'vimeo', label: __('Vimeo', 'wp-carousel-free'), icon: <VideoIconVimeo /> },
	{ value: 'tiktok', label: __('TikTok', 'wp-carousel-free'), icon: <VideoIconTikTok />, pro: true },
	{ value: 'twitch', label: __('Twitch', 'wp-carousel-free'), icon: <VideoIconTwitch />, pro: true },
	{ value: 'ted', label: __('TED', 'wp-carousel-free'), icon: <VideoIconTED />, pro: true },
	{
		value: 'dailymotion',
		label: __('DailyMotion', 'wp-carousel-free'),
		icon: <VideoIconDailyMotion />,
		pro: true,
	},
	{ value: 'rumble', label: __('Rumble', 'wp-carousel-free'), icon: <VideoIconRumble />, pro: true },
	{ value: 'wistia', label: __('Wistia', 'wp-carousel-free'), icon: <VideoIconWistia />, pro: true },
	{
		value: 'sproutvideo',
		label: __('SproutVideo', 'wp-carousel-free'),
		icon: <VideoIconSproutVideo />,
		pro: true,
	},
	{ value: 'embed', label: __('Embed', 'wp-carousel-free'), icon: <VideoIconEmbed />, pro: true },
	{
		value: 'self_hosted',
		label: __('Self Hosted', 'wp-carousel-free'),
		icon: <VideoIconSelfHosted />,
		pro: true,
	},
	{
		value: 'mp4_url',
		label: __('MP4 URL', 'wp-carousel-free'),
		icon: <VideoIconMP4URL />,
		pro: true,
	},
];

export const VIDEO_SOURCE_LABELS = {
	youtube: __('YouTube Video URL', 'wp-carousel-free'),
	vimeo: __('Vimeo Video URL', 'wp-carousel-free'),
};

const buildMetaMap = (catalogue) =>
	catalogue.reduce((acc, entry) => {
		acc[entry.value] = entry;
		return acc;
	}, {});

export const SOURCE_META = buildMetaMap(SOURCES);
export const VIDEO_SOURCE_META = buildMetaMap(VIDEO_SOURCES);
