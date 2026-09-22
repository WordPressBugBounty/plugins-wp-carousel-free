import { __ } from '@wordpress/i18n';
import {
	SPToggleGroupControl,
	SpColorPicker,
	Divider,
	Spacing,
	Border,
	BoxShadow,
} from '@wp-carousel-pro/components';
import {
	DEFAULT_BORDER_WIDTH,
	DEFAULT_BORDER_RADIUS_CONTROL,
	DEFAULT_PADDING_CONTROL,
	DEFAULT_BOX_SHADOW,
	EMPTY_OBJECT,
	NOOP,
	normalizeSpacingAttr,
} from './navigationDefaults';

// Border style + width are shared across Normal/Hover; only the border color
// differs per state.
// Schema:
//   - borderNormal: { style, color }     — drives Border style and Normal color
//   - borderHover:  { color }            — Hover color only
//   - borderWidthNormal: { unit, value } — shared width for both states
export default function StyleTabContent({ options, setOpt, styleScope, setStyleScope }) {
	const isNormal = styleScope === 'normal';
	const colorKey = isNormal ? 'colorNormal' : 'colorHover';
	const bgKey = isNormal ? 'bgNormal' : 'bgHover';

	const borderNormal = options.borderNormal ?? { style: 'solid', color: '#cccccc' };
	const borderHover = options.borderHover ?? { color: '#cccccc' };
	const borderWidth = options.borderWidthNormal ?? DEFAULT_BORDER_WIDTH;
	const borderForControl = {
		style: borderNormal.style ?? 'solid',
		color: isNormal ? borderNormal.color ?? '' : borderHover.color ?? '',
	};

	// Box-shadow is independent per state (each carries its own isActive toggle).
	// `key` on the control forces a fresh mount on tab switch so its preset/custom
	// UI state reflects the active state's saved shadow instead of leaking across.
	const boxShadowAttr = isNormal
		? options.boxShadowNormal ?? DEFAULT_BOX_SHADOW
		: options.boxShadowHover ?? DEFAULT_BOX_SHADOW;
	const boxShadowKey = isNormal ? 'boxShadowNormal' : 'boxShadowHover';

	const borderRadiusAttributes = normalizeSpacingAttr(options.borderRadius, 50, '%');
	const paddingAttributes = normalizeSpacingAttr(options.padding, 12);

	return (
		<>
			<SPToggleGroupControl
				attributes={styleScope}
				attributesKey="styleScope"
				setAttributes={NOOP}
				onClick={(v) => setStyleScope(v)}
				items={[
					{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
					{ label: __('Hover', 'wp-carousel-free'), value: 'hover' },
				]}
				flexStyle={false}
			/>

			<SpColorPicker
				label={__('Color', 'wp-carousel-free')}
				colorType={false}
				value={options[colorKey] ?? ''}
				attributes={EMPTY_OBJECT}
				attributesKey={colorKey}
				setAttributes={setOpt}
			/>

			<SpColorPicker
				label={__('Background Color', 'wp-carousel-free')}
				colorType={false}
				value={options[bgKey] ?? ''}
				attributes={EMPTY_OBJECT}
				attributesKey={bgKey}
				setAttributes={setOpt}
			/>
			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{ border: borderForControl, borderWidth }}
				attributesKey={{ border: 'borderNormal', borderWidth: 'borderWidthNormal' }}
				// Border width is an absolute measure — exclude '%' (no meaningful value here).
				units={['px', 'em']}
				setAttributes={NOOP}
				parentState={isNormal ? 'normal' : 'hover'}
				onStateUpdate={(key, updateValue) => {
					if (key === 'borderNormal') {
						if (isNormal) {
							setOpt({
								borderNormal: {
									style: updateValue.style ?? borderNormal.style ?? 'solid',
									color: updateValue.color ?? borderNormal.color ?? '',
								},
							});
						} else {
							const nextStyle = updateValue.style ?? borderNormal.style ?? 'solid';
							setOpt({
								borderNormal: { ...borderNormal, style: nextStyle },
								borderHover: { color: updateValue.color ?? borderHover.color ?? '' },
							});
						}
					} else if (key === 'borderWidthNormal') {
						// The shared Border control emits a responsive, device-keyed unit
						// object ({ Desktop, Tablet, Mobile }) when the unit changes. The
						// navigation border width is a flat { unit: <string>, value }
						// shape (non-responsive), so collapse any object unit back to the
						// plain string both CSS emitters (and the PHP schema) expect.
						let borderWidthNormal = updateValue;
						if (updateValue && typeof updateValue.unit === 'object') {
							borderWidthNormal = {
								...updateValue,
								unit: updateValue.unit.Desktop ?? 'px',
							};
						}
						setOpt({ borderWidthNormal });
					}
				}}
			/>

			<BoxShadow
				key={boxShadowKey}
				label={__('Box Shadow', 'wp-carousel-free')}
				attributes={boxShadowAttr}
				attributesKey={boxShadowKey}
				setAttributes={setOpt}
			/>

			<Divider />

			<Spacing
				label={__('Border Radius', 'wp-carousel-free')}
				attributes={borderRadiusAttributes}
				attributesKey="borderRadius"
				setAttributes={setOpt}
				units={['px', 'em', '%']}
				defaultValue={DEFAULT_BORDER_RADIUS_CONTROL}
			/>

			<Spacing
				label={__('Padding', 'wp-carousel-free')}
				attributes={paddingAttributes}
				attributesKey="padding"
				setAttributes={setOpt}
				units={['px', 'em', '%']}
				defaultValue={DEFAULT_PADDING_CONTROL}
			/>
		</>
	);
}
