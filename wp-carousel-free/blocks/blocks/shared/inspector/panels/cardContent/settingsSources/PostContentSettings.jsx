/**
 * Settings-tab content controls for the post family (post / external / video).
 * Lifted verbatim from the former `PostContentPanel` General tab — title tag,
 * title/excerpt length, read-more button type. Title/Description Length Limit
 * and the read-more Show Icon are Pro; their controls stay visible but locked.
 * Writes `postContentOptions` (mirroring show* flags into `contentOptions`).
 */

import { __ } from '@wordpress/i18n';
import { Toggle } from '@wp-carousel-pro/components';
import { useCallback, useMemo } from '@wordpress/element';
import { isSlotVisible } from '../../../visibility';
import ToggleGroupControl from '@wp-carousel-pro/components/toggleGroupControl/toggleGroupControl';

const TITLE_TAGS = [
	{ label: 'H1', value: 'h1' },
	{ label: 'H2', value: 'h2' },
	{ label: 'H3', value: 'h3' },
	{ label: 'H4', value: 'h4' },
	{ label: 'H5', value: 'h5' },
	{ label: 'H6', value: 'h6' },
	{ label: 'Span', value: 'span' },
];

// Limited is Pro — Title/Description Length Limit are Pro features for the
// post/video family. Free always renders the full text.
const TITLE_LENGTH_OPTIONS = [
	{ label: __('Full', 'wp-carousel-free'), value: 'full' },
	{ label: __('Limited', 'wp-carousel-free'), value: 'limited', pro: true },
];

const EXCERPT_LENGTH_OPTIONS = [
	{ label: __('Full', 'wp-carousel-free'), value: 'full' },
	{ label: __('Limited', 'wp-carousel-free'), value: 'limited', pro: true },
];

const BUTTON_TYPES = [
	{ label: __('Button', 'wp-carousel-free'), value: 'button' },
	{ label: __('Text Link', 'wp-carousel-free'), value: 'link' },
];

export default function PostContentSettings({ attributes, setAttributes }) {
	const pco = useMemo(() => attributes.postContentOptions || {}, [attributes.postContentOptions]);
	const co = useMemo(() => attributes.contentOptions || {}, [attributes.contentOptions]);
	const set = useCallback(
		(updates) => {
			const merged = { ...pco, ...updates };
			const contentSync = {};
			if (Object.prototype.hasOwnProperty.call(updates, 'showTitle')) {
				contentSync.showTitle = merged.showTitle;
				contentSync.titleSource = 'post_title';
			}
			if (Object.prototype.hasOwnProperty.call(updates, 'titleTag')) {
				contentSync.titleTag = merged.titleTag;
			}
			if (Object.prototype.hasOwnProperty.call(updates, 'showExcerpt')) {
				contentSync.showDescription = merged.showExcerpt;
				contentSync.descriptionSource = 'post_excerpt';
			}
			if (Object.prototype.hasOwnProperty.call(updates, 'showReadMore')) {
				contentSync.showReadMore = merged.showReadMore;
			}
			setAttributes({
				postContentOptions: merged,
				contentOptions: {
					...co,
					...contentSync,
				},
			});
		},
		[pco, co, setAttributes]
	);

	const vis = (id) => isSlotVisible(attributes, id);
	const isVideoSource = attributes?.sourceType === 'video';
	const showDescriptionLength = isVideoSource ? vis('description') : vis('excerpt');

	return (
		<>
			{/* Title Section */}
			{vis('title') && (
				<>
					<ToggleGroupControl
						label={__('Title HTML Tag', 'wp-carousel-free')}
						attributes={pco.titleTag ?? 'h4'}
						attributesKey="titleTag"
						setAttributes={set}
						items={TITLE_TAGS}
					/>
					{attributes?.sourceType !== 'video' && (
						<>
							<ToggleGroupControl
								label={__('Title Length', 'wp-carousel-free')}
								attributes={pco.titleLength ?? 'full'}
								attributesKey="titleLength"
								setAttributes={set}
								items={TITLE_LENGTH_OPTIONS}
							/>
						</>
					)}
				</>
			)}

			{/* Description / Excerpt Section */}
			{showDescriptionLength && (
				<ToggleGroupControl
					label={__('Description Length', 'wp-carousel-free')}
					attributes={pco.excerptLength ?? 'full'}
					attributesKey="excerptLength"
					setAttributes={set}
					items={EXCERPT_LENGTH_OPTIONS}
				/>
			)}

			{/* Read More Section */}
			{vis('readmore') && (
				<>
					<ToggleGroupControl
						label={__('Button Type', 'wp-carousel-free')}
						attributes={pco.buttonType ?? 'button'}
						attributesKey="buttonType"
						setAttributes={set}
						items={BUTTON_TYPES}
					/>
					{/* Show Icon is Pro for the post/video family. */}
					<Toggle label={__('Show Icon', 'wp-carousel-free')} attributes={false} onlyPro />
				</>
			)}
		</>
	);
}
