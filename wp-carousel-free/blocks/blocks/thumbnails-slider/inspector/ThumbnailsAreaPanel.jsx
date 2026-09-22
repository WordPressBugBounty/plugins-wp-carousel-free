/**
 * Thumbnails Area panel — wrapper around the thumbnails strip.
 *
 * Renders only when the active block is `wp-carousel-pro/thumbnails-slider`,
 * gated by the orchestrator (`CarouselEdit.jsx`). Settings tab controls the
 * strip's position and the gap between thumbs. Style tab controls the
 * wrapper's background/padding/border/
 * border-radius/box-shadow. Defaults live in
 * `src/Blocks/Schema/ThumbnailsSliderSchema.php` per the PHP-managed
 * attributes contract.
 *
 * Free places the strip below the stage: Top, Left and Right are locked `(Pro)`
 * options SelectField refuses to write, and Thumb Area Width is a locked range
 * that writes nothing. With the width pinned at 100% the strip always fills its
 * row, so there is nothing left for an alignment control to move — it, the
 * side-strip width and the vertical alignment are absent rather than locked.
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import {
	Background,
	BoxShadow,
	SPRangeControl,
	SelectField,
	Spacing,
	SpProNotice,
	TabControls,
	Toggle,
	Border,
} from '@wp-carousel-pro/components';

const POSITION_OPTIONS = [
	{ label: __('Bottom', 'wp-carousel-free'), value: 'bottom' },
	{ label: __('Top', 'wp-carousel-free'), value: 'top', pro: true },
	{ label: __('Left', 'wp-carousel-free'), value: 'left', pro: true },
	{ label: __('Right', 'wp-carousel-free'), value: 'right', pro: true },
];
const SPACING_DEFAULT = {
	allChange: true,
	unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
	device: {
		Desktop: { top: 0, right: 0, bottom: 0, left: 0 },
	},
};

function normalizeSpacingAttr(value) {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	return SPACING_DEFAULT;
}

function SettingsTab({ attributes, setAttributes }) {
	const ta = attributes.thumbsArea || {};
	const set = (updates) => setAttributes({ thumbsArea: { ...ta, ...updates } });

	// Thumb Area Width is Pro, so the slider stays at its 100% default and the
	// control never writes — the value below is display-only.
	const widthValue = {
		device: { Desktop: 100, Tablet: 100, Mobile: 100 },
		unit: { Desktop: '%', Tablet: '%', Mobile: '%' },
		allChange: true,
	};

	return (
		<>
			<SelectField
				label={__('Thumbnails Position', 'wp-carousel-free')}
				attributes={ta.position ?? 'bottom'}
				attributesKey="position"
				setAttributes={set}
				items={POSITION_OPTIONS}
			/>

			<SPRangeControl
				onlyPro
				label={__('Thumb Area Width', 'wp-carousel-free')}
				attributes={widthValue}
				min={0}
				max={100}
				units={['%']}
			/>

			<SPRangeControl
				label={__('Gap Between Thumbs', 'wp-carousel-free')}
				attributes={ta.gap}
				attributesKey="gap"
				setAttributes={set}
				min={0}
				max={200}
				defaultValue={{ device: { Desktop: 24, Tablet: 24, Mobile: 24 } }}
				units={['px', '%', 'em']}
			/>

			<SpProNotice
				className="is-upsell"
				message={__(
					'Customize thumbnail position and width for more flexible, professional layout.',
					'wp-carousel-free'
				)}
				linkText={__('Upgrade to Pro!', 'wp-carousel-free')}
			/>
		</>
	);
}

function StyleTab({ attributes, setAttributes }) {
	const ta = attributes.thumbsArea || {};
	const set = (updates) => setAttributes({ thumbsArea: { ...ta, ...updates } });

	const padding = normalizeSpacingAttr(ta.padding);
	const margin = normalizeSpacingAttr(ta.margin);
	const borderRadius = normalizeSpacingAttr(ta.borderRadius);
	const boxShadow = ta.boxShadow || {};

	return (
		<>
			<Background
				label={__('Background', 'wp-carousel-free')}
				attributes={
					ta.background && typeof ta.background === 'object' && !Array.isArray(ta.background)
						? ta.background
						: { style: 'solid', solid: '', gradient: '' }
				}
				attributesKey="background"
				setAttributes={set}
				colorLabel={__('Background Color', 'wp-carousel-free')}
			/>

			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{ border: ta.border, borderWidth: ta.borderWidth }}
				attributesKey={{ border: 'border', borderWidth: 'borderWidth' }}
				setAttributes={set}
				btnType={'color'}
			/>

			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={borderRadius}
				attributesKey="borderRadius"
				setAttributes={set}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 0, right: 0, bottom: 0, left: 0 },
					device: SPACING_DEFAULT.device,
				}}
				indicator="radius"
			/>

			<Toggle
				label={__('Box Shadow', 'wp-carousel-free')}
				attributes={!!boxShadow.enable}
				attributesKey="boxShadowEnable"
				setAttributes={(u) => set({ boxShadow: { ...boxShadow, enable: u.boxShadowEnable } })}
			/>
			{boxShadow.enable && (
				<BoxShadow
					hideEnableToggle
					attributes={boxShadow}
					attributesKey="boxShadow"
					setAttributes={(u) => set({ boxShadow: { ...boxShadow, ...u.boxShadow } })}
					defaultColor="#4E4F521A"
				/>
			)}

			<Spacing
				label={__('Padding', 'wp-carousel-free')}
				attributes={padding}
				attributesKey="padding"
				setAttributes={set}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 0, right: 0, bottom: 0, left: 0 },
					device: SPACING_DEFAULT.device,
				}}
			/>
			<Spacing
				label={__('Margin', 'wp-carousel-free')}
				attributes={margin}
				attributesKey="margin"
				setAttributes={set}
				units={['px', '%', 'em']}
				defaultValue={{
					unit: 'px',
					value: { top: 0, right: 0, bottom: 0, left: 0 },
					device: SPACING_DEFAULT.device,
				}}
			/>
		</>
	);
}

function ThumbnailsAreaPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody
			title={__('Thumbnails Area', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
			<TabControls
				attributes={attributes}
				setAttributes={setAttributes}
				GeneralTab={SettingsTab}
				StyleTab={StyleTab}
				activeTab={activeTab}
				onTabChange={onTabChange}
				styleTabTitle={__('Style', 'wp-carousel-free')}
			/>
		</PanelBody>
	);
}

export default memo(ThumbnailsAreaPanel);
