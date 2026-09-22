import { __ } from '@wordpress/i18n';
import {
	Border,
	SpColorPicker,
	Divider,
	Spacing,
	SPToggleGroupControl,
} from '@wp-carousel-pro/components';
import {
	DEFAULT_BORDER,
	DEFAULT_BORDER_WIDTH,
	DEFAULT_MARGIN_CONTROL,
	EMPTY_OBJECT,
	NOOP,
	normalizeMarginAttr,
} from './paginationDefaults';

// Border style + width are shared across Normal/Hover; only the border color
// differs per state.
// Schema:
//   - borderNormal: { style, color }    — drives Border style and Normal color
//   - borderHover:  { color }           — Hover color only
//   - borderWidthNormal: { unit, value } — shared width for both states
export default function StyleTabContent({ options, setOpt, styleScope, setStyleScope }) {
	const isNormal = styleScope === 'normal';
	const style = options.paginationStyle ?? 'dots';
	const supportsBgControl = style === 'fraction' || style === 'numbers';
	const colorKey = isNormal ? 'colorNormal' : 'colorHover';
	const bgKey = isNormal ? 'bgNormal' : 'bgHover';

	const borderNormal = options.borderNormal ?? DEFAULT_BORDER;
	const borderHover = options.borderHover ?? { color: '#cccccc' };
	const borderWidth = options.borderWidthNormal ?? DEFAULT_BORDER_WIDTH;
	const borderForControl = {
		style: borderNormal.style ?? 'none',
		color: isNormal ? borderNormal.color ?? '' : borderHover.color ?? '',
	};

	return (
		<>
			<SPToggleGroupControl
				attributes={styleScope}
				attributesKey="styleScope"
				setAttributes={NOOP}
				onClick={(v) => setStyleScope(v)}
				items={[
					{ label: __('Normal', 'wp-carousel-free'), value: 'normal' },
					{ label: __('Hover & Active', 'wp-carousel-free'), value: 'hover' },
				]}
				flexStyle={false}
			/>

			<SpColorPicker
				label={__('Color', 'wp-carousel-free')}
				value={options[colorKey] ?? ''}
				attributes={options[colorKey] ?? EMPTY_OBJECT}
				attributesKey={colorKey}
				setAttributes={setOpt}
			/>

			{supportsBgControl && (
				<SpColorPicker
					label={__('Background Color', 'wp-carousel-free')}
					value={options[bgKey] ?? ''}
					attributes={options[bgKey] ?? EMPTY_OBJECT}
					attributesKey={bgKey}
					setAttributes={setOpt}
				/>
			)}

			<Border
				label={__('Border', 'wp-carousel-free')}
				attributes={{
					border: borderForControl,
					borderWidth,
				}}
				attributesKey={{ border: 'borderNormal', borderWidth: 'borderWidthNormal' }}
				// Pagination border width is an absolute measure — px only.
				units={['px', 'em']}
				setAttributes={NOOP}
				parentState={isNormal ? 'normal' : 'hover'}
				onStateUpdate={(key, updateValue) => {
					if (key === 'borderNormal') {
						if (isNormal) {
							setOpt({
								borderNormal: {
									style: updateValue.style ?? borderNormal.style ?? 'none',
									color: updateValue.color ?? borderNormal.color ?? '',
								},
							});
						} else {
							// Style is shared — write into borderNormal even from the Hover tab.
							const nextStyle = updateValue.style ?? borderNormal.style ?? 'none';
							setOpt({
								borderNormal: {
									...borderNormal,
									style: nextStyle,
								},
								borderHover: {
									color: updateValue.color ?? borderHover.color ?? '',
								},
							});
						}
					} else if (key === 'borderWidthNormal') {
						// The shared Border control emits a responsive, device-keyed unit
						// object ({ Desktop, Tablet, Mobile }) when the unit changes. The
						// pagination border width is a flat { unit: <string>, value }
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

			<Divider />

			<Spacing
				label={__('Margin', 'wp-carousel-free')}
				attributes={normalizeMarginAttr(options.margin, 0)}
				attributesKey="margin"
				setAttributes={setOpt}
				units={['px', 'em', '%']}
				defaultValue={DEFAULT_MARGIN_CONTROL}
			/>
		</>
	);
}
