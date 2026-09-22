import Select from 'react-select';
import { __ } from '@wordpress/i18n';
import { Button, Popover, RangeControl, Flex, Tooltip } from '@wordpress/components';
import { useEffect, useId, useRef, useState } from '@wordpress/element';
import SPRangeControl from '../rangeControl/rangeControl.js';
import ComponentsTopSection from '../componentsTopControl/ComponentsTopSection.js';
import { EditIcon } from './svgIcon.js';
import './editor.scss';
import SelectField from '../selectField/selectField.js';
import {
	fontWeightMap,
	getFontSizePresets,
	getFontWeightList,
	textCaseOptions,
	textDecorationOptions,
} from './utility.js';
import InputControl from '../inputControl/inputControl.js';
import { useDeviceType } from '../../controls/controls.js';
import classNames from 'classnames';
import { BorderIcon } from '../../icons/icons.js';
import { useSelect } from '@wordpress/data';
import useGoogleFonts from '../../hooks/useGoogleFontApi.js';

const Typography = ({
	setAttributes,
	attributes,
	fontSizeDefault = { unit: 'px', value: 16 },
	lineDefaultValue = 1.2,
	typographyLabel = 'Typography',
	fontSizePresetType = 'body',
	onStateUpdate = false,
	onApplyToAll = false,
	applyToAllTypography = [],
}) => {
	const fontFamilies = useSelect((_select) => {
		const settings = _select('core/editor')?.getEditorSettings();
		return settings?.__experimentalFeatures?.typography?.fontFamilies || [];
	}, []);

	const [prevFont, setPrevFont] = useState(attributes?.family?.family || '');
	const [systemFonts, setSystemFonts] = useState([]);
	const [allFonts, setAllFonts] = useState([]);
	const [fontLists, setFontLists] = useState([]);
	const {
		family = {},
		familyKey,
		fontSize,
		fontSizeKey,
		lineHeight,
		lineHeightKey,
		fontSpacing,
		fontSpacingKey,
		wordSpacing,
		wordSpacingKey,
	} = attributes;
	const deviceType = useDeviceType();
	const fontSizePresets = getFontSizePresets(fontSizePresetType);

	const [isVisible, setIsVisible] = useState(false);
	const [isCustomFontSize, setIsCustomFontSize] = useState(
		(!fontSizePresets?.find((preset) => preset?.value === fontSize?.device?.[deviceType]) &&
			fontSize?.device?.[deviceType] !== '') ||
			false
	);
	const typoBtnRef = useRef(null);
	// One stable per-instance class shared by the trigger button and the
	// outside-click selector, so the selector always matches this instance.
	const reactId = useId();
	const typoBtnClass = `sp-${reactId.replace(/[^a-zA-Z0-9-]/g, '')}`;
	const toggleVisible = () => {
		setIsVisible((state) => !state);
	};
	const { googleFonts } = useGoogleFonts();
	useEffect(() => {
		if (allFonts.length === 0 && googleFonts.length > 0) {
			let wpFonts = [];
			if (fontFamilies) {
				const customFonts = fontFamilies.custom || [];
				const themeFonts = fontFamilies.theme || [];
				const _systemFonts = [...customFonts, ...themeFonts];
				wpFonts = _systemFonts?.map((f) => {
					const variants = f?.fontFace?.map((v) => v.fontWeight);
					let variantsArray = [];
					if (variants?.length > 0) {
						variantsArray = variants?.length === 1 ? variants[0]?.split(' ') : variants;
					} else {
						variantsArray = ['300', '400', '500', '600', '700', '800'];
					}
					return {
						label: f.name,
						value: f.fontFamily,
						font: {
							family: f.fontFamily,
							variants: variantsArray,
						},
					};
				});
			}

			const grouped = [
				...(wpFonts.length > 0 ? [{ label: 'System Fonts', options: wpFonts }] : []),
				{
					label: 'Google Fonts',
					options: googleFonts.filter((font, i) => i < 50 && font),
				},
			];
			setSystemFonts(wpFonts);
			setAllFonts([...wpFonts, ...googleFonts]);
			setFontLists(grouped);
		}
	}, [googleFonts, fontFamilies, allFonts]);
	const fontSearch = (inputValue) => {
		if (!inputValue) {
			setFontLists([
				...(systemFonts.length > 0
					? [
							{
								label: 'System Fonts',
								options: systemFonts,
							},
					  ]
					: []),
				{
					label: 'Google Fonts',
					options: googleFonts.filter((font, i) => i < 50 && font),
				},
			]);
			return;
		}

		const searchedFonts = allFonts
			.filter((font) => font.label.toLowerCase().includes(inputValue.toLowerCase()))
			.slice(0, 30);
		setFontLists([
			{
				label: 'Search Result',
				options: searchedFonts,
			},
		]);
	};
	useEffect(() => {
		// Bind the close-on-outside-click listener only while the popover is
		// open (previously bound on every render, for every mounted control).
		if (!isVisible) {
			return undefined;
		}
		const clickOutSite = (e) => {
			const target = e.target.closest('.wpcp-typography-fonts');
			const buttonTarget = e.target.closest(`.wpcp-typography-trigger button.${typoBtnClass}`);
			const familyTarget = e.target.closest('.wpcp-react-select');
			if (!target && !buttonTarget && !familyTarget && !typoBtnRef.current?.contains(e.target)) {
				setIsVisible(false);
			}
		};
		window.addEventListener('click', clickOutSite);

		return () => window.removeEventListener('click', clickOutSite);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isVisible, typoBtnClass]);

	// default and active family options.
	const defaultFamilyOption = {
		label: 'Default',
		value: 'Default',
		font: {
			family: 'Default',
			variants: ['300', '400', '500', '600', '700', '800'],
		},
	};

	// Ensure family has default properties
	const safeFamily = {
		family: '',
		fontWeight: '',
		style: '',
		transform: '',
		decoration: '',
		...family,
	};

	const activeFontFamily =
		!safeFamily.family || safeFamily.family === ''
			? defaultFamilyOption
			: {
					label: allFonts?.find((font) => font.value === safeFamily.family)?.label || safeFamily.family,
					value: safeFamily.family,
					font: {
						family: safeFamily.family,
						variants: ['300', '400', '500', '600', '700', '800'], // Default variants, could be improved
					},
			  };

	const allFamilyList = [defaultFamilyOption, ...fontLists];

	const isAvailableOnList = allFamilyList?.find((font) => font.value === activeFontFamily.value);

	const fontFamilySelectOptions = isAvailableOnList
		? allFamilyList
		: [defaultFamilyOption, activeFontFamily, ...fontLists];

	// font family.
	const { fontWeight, style } = safeFamily;

	const onChangeFontStyle = (fontStyle) => {
		const arrayOfStyles = fontWeightMap[fontStyle]?.split(' ');
		const _style = fontWeightMap[fontStyle]?.includes('italic') ? 'italic' : '';
		const _fontWeight = arrayOfStyles?.[arrayOfStyles?.length - 1];

		if (onStateUpdate) {
			onStateUpdate(familyKey, {
				...safeFamily,
				fontWeight: _fontWeight,
				style: _style,
			});
			return;
		}

		setAttributes({
			[familyKey]: {
				...safeFamily,
				fontWeight: _fontWeight,
				style: _style,
			},
		});
	};

	const onChangeFontSize = (newValue) => {
		setAttributes({
			[fontSizeKey]: {
				...fontSize,
				device: {
					...fontSize?.device,
					[deviceType]: newValue.value,
				},
				unit: {
					...fontSize.unit,
					[deviceType]: fontSize?.unit?.[deviceType]
						? fontSize?.unit?.[deviceType]
						: fontSizeDefault.unit,
				},
			},
		});
	};
	const onChangeTextStyles = (key, value) => {
		const newValue = safeFamily[key] === value ? '' : value;
		if (onStateUpdate) {
			onStateUpdate(familyKey, {
				...safeFamily,
				[key]: newValue,
			});
			return;
		}
		setAttributes({
			[familyKey]: {
				...safeFamily,
				[key]: newValue,
			},
		});
	};
	const onChangeLineHeight = (newValue) => {
		if (onStateUpdate) {
			onStateUpdate(lineHeightKey, {
				...lineHeight,
				value: newValue?.value,
			});
		} else {
			setAttributes({
				[lineHeightKey]: {
					...lineHeight,
					device: {
						...lineHeight.device,
						[newValue.deviceType]: newValue?.value,
					},
				},
			});
		}
	};
	const handleApplyToAll = () => {
		// Apply only the font family; each target keeps its own weight/style/transform/decoration.
		const familyUpdate = {
			[familyKey]: { family: safeFamily.family },
		};

		applyToAllTypography.forEach((applyTypography) => {
			if ('function' === typeof applyTypography) {
				applyTypography(familyUpdate);
			}
		});

		if ('function' === typeof onApplyToAll) {
			onApplyToAll(familyUpdate);
		}
		setPrevFont(safeFamily.family);
	};
	const showApplyToAll = prevFont !== safeFamily.family || safeFamily.family !== '';

	return (
		<div className="wpcp-typography wpcp-component-mb">
			<Flex justify="space-between" align="center" className="wpcp-typography-trigger">
				<p> {typographyLabel}</p>
				<Button
					ref={typoBtnRef}
					aria-label={
						isVisible
							? __('close typography popup', 'wp-carousel-free')
							: __('open typography popup', 'wp-carousel-free')
					}
					onClick={() => toggleVisible()}
					size="compact"
					className={classNames(typoBtnClass, isVisible && 'active')}
					icon={<EditIcon />}
				/>
			</Flex>

			{isVisible && (
				<Popover shift={true} focusOnMount={false}>
					<div className={`wpcp-typography-fonts`}>
						<div className="wpcp-typography-header">
							<h4>{__('Typography', 'wp-carousel-free')}</h4>
						</div>
						<div className="wpcp-typography-fields">
							<div className={`wpcp-typography-family wpcp-component-mb`}>
								<div className="wpcp-select-field">
									<div className="wpcp-header">
										<span className="wpcp-component-title">{__('Font Family', 'wp-carousel-free')}</span>
										{showApplyToAll && (
											<Button className="wpcp-typography-apply-all" onClick={handleApplyToAll} size="compact">
												{__('APPLY TO ALL', 'wp-carousel-free')}
											</Button>
										)}
									</div>

									<Select
										options={fontFamilySelectOptions}
										value={activeFontFamily}
										placeholder={activeFontFamily.label}
										className="wpcp-react-select"
										onChange={(nextFont) =>
											onStateUpdate
												? onStateUpdate(familyKey, {
														...safeFamily,
														family: 'Default' !== nextFont?.font?.family ? nextFont?.font?.family : '',
														fontWeight:
															'regular' === nextFont?.font?.variants?.[0] ? '400' : nextFont?.font?.variants?.[0],
												  })
												: setAttributes({
														[familyKey]: {
															...safeFamily,
															family: 'Default' !== nextFont?.font?.family ? nextFont?.font?.family : '',
															fontWeight:
																'regular' === nextFont?.font?.variants?.[0] ? '400' : nextFont?.font?.variants?.[0],
														},
												  })
										}
										onInputChange={(inputValue) => fontSearch(inputValue)}
									/>
								</div>
							</div>
							<SelectField
								label={__('Font Style', 'wp-carousel-free')}
								attributes={
									activeFontFamily?.font?.variants?.includes(`${fontWeight || ''}${style || ''}`)
										? `${fontWeight || ''}${style || ''}`
										: fontWeight || ''
								}
								items={getFontWeightList(activeFontFamily)}
								onChange={(newStyle) => onChangeFontStyle(newStyle)}
								__nextHasNoMarginBottom
							/>
						</div>

						<div className="wpcp-typography-multiple-button-group wpcp-component-mb">
							<ComponentsTopSection
								label={__('Font Size', 'wp-carousel-free')}
								units={['px', '%', 'Em']}
								attributes={fontSize}
								setAttributes={setAttributes}
								attributesKey={fontSizeKey}
								onReset={() =>
									!onStateUpdate &&
									setAttributes({
										[fontSizeKey]: {
											...fontSize,
											device: {
												...fontSize?.device,
												[deviceType]: fontSizeDefault.value,
											},
											unit: {
												...fontSize.unit,
												[deviceType]: fontSizeDefault.unit,
											},
										},
									})
								}
								onUnitChange={(newValue) =>
									onStateUpdate
										? onStateUpdate(fontSizeKey, {
												...fontSize,
												unit: newValue?.unit,
										  })
										: setAttributes({
												[fontSizeKey]: {
													...attributes.fontSize,
													unit: {
														...attributes.fontSize.unit,
														[newValue.deviceType]: newValue.unit,
													},
												},
										  })
								}
							/>
							<div
								className={classNames('wpcp-typography-font-size-presets', isCustomFontSize && 'active')}
							>
								{isCustomFontSize ? (
									<RangeControl
										// value={ ajax ? currentValue : value }
										value={fontSize.device?.[deviceType] || fontSize?.value}
										color="var(--wpcp-carousel-primary-2-800)"
										onChange={(newValue) =>
											onStateUpdate
												? onStateUpdate(fontSizeKey, {
														...fontSize,
														value: newValue,
												  })
												: onChangeFontSize({
														value: newValue,
												  })
										}
										min={0}
										max={200}
										step={1}
										__nextHasNoMarginBottom={true}
										__next40pxDefaultSize
									/>
								) : (
									<div className="wpcp-button-group-list">
										{fontSizePresets?.map(({ label, value }, i) => (
											<button
												key={i}
												className={`components-button ${
													[fontSize?.device?.[deviceType], fontSize?.value].includes(value) ? ' active' : ''
												}`}
												onClick={() =>
													onStateUpdate
														? onStateUpdate(fontSizeKey, {
																...fontSize,
																value,
														  })
														: onChangeFontSize({
																value,
														  })
												}
											>
												<span title={value}>{label}</span>
											</button>
										))}
									</div>
								)}

								<Button onClick={() => setIsCustomFontSize((prev) => !prev)}>
									<BorderIcon isActive={isCustomFontSize} />
								</Button>
							</div>
						</div>

						<SPRangeControl
							label={__('Line Height', 'wp-carousel-free')}
							setAttributes={setAttributes}
							attributes={lineHeight}
							attributesKey={lineHeightKey}
							step={0.1}
							max={2}
							defaultValue={{ value: lineDefaultValue }}
							onValueChange={(newValue) => onChangeLineHeight(newValue)}
							units={false}
						/>

						<div className="wpcp-typography-word-spacing-latter-spacing-wrapper sp-d-flex sp-gap-8px">
							<div className="wpcp-typography-line-height-picker">
								<ComponentsTopSection
									label={__('Letter Spacing', 'wp-carousel-free')}
									attributes={fontSpacing}
									attributesKey={fontSpacingKey}
									setAttributes={setAttributes}
									units={['px', '%', 'em']}
									onUnitChange={(newValue) =>
										onStateUpdate
											? onStateUpdate(fontSpacingKey, {
													...fontSpacing,
													unit: newValue,
											  })
											: setAttributes({
													[fontSpacingKey]: {
														...attributes.fontSpacing,
														unit: {
															...attributes.fontSpacing.unit,
															[newValue.deviceType]: newValue.unit,
														},
													},
											  })
									}
								/>
								<InputControl
									attributes={fontSpacing?.device?.[deviceType] || fontSpacing?.value}
									type="number"
									onChange={(newValue) =>
										onStateUpdate
											? onStateUpdate(fontSpacingKey, {
													...fontSpacing,
													value: newValue,
											  })
											: setAttributes({
													[fontSpacingKey]: {
														...fontSpacing,
														device: {
															...fontSpacing?.device,
															[deviceType]: newValue,
														},
													},
											  })
									}
									min={0}
								/>
							</div>
							{wordSpacing && (
								<div className="wpcp-typography-letter-spacing-picker">
									<ComponentsTopSection
										label={__('Word Spacing', 'wp-carousel-free')}
										attributes={wordSpacing}
										attributesKey={wordSpacingKey}
										setAttributes={setAttributes}
										units={['px', '%', 'em']}
										onUnitChange={(newValue) =>
											onStateUpdate
												? onStateUpdate(wordSpacingKey, {
														...wordSpacing,
														unit: newValue,
												  })
												: setAttributes({
														[wordSpacingKey]: {
															...attributes.wordSpacing,
															unit: {
																...attributes.wordSpacing.unit,
																[newValue.deviceType]: newValue.unit,
															},
														},
												  })
										}
									/>
									<InputControl
										attributes={wordSpacing?.device?.[deviceType] || wordSpacing?.value}
										type="number"
										onChange={(newValue) =>
											onStateUpdate
												? onStateUpdate(wordSpacingKey, {
														...wordSpacing,
														value: newValue,
												  })
												: setAttributes({
														[wordSpacingKey]: {
															...wordSpacing,
															device: {
																...wordSpacing?.device,
																[deviceType]: newValue,
															},
														},
												  })
										}
										min={0}
									/>
								</div>
							)}
						</div>

						<Flex align="center">
							<div className="wpcp-typography-multiple-button-group wpcp-component-mb">
								<ComponentsTopSection label={__('Decoration', 'wp-carousel-free')} />

								<div className="wpcp-button-group-list">
									{textDecorationOptions?.map(({ label, key, value }, i) => (
										<Tooltip placement="top" text={value} key={i}>
											<button
												className={`components-button${safeFamily[key] === value ? ' active' : ''}`}
												onClick={() => onChangeTextStyles(key, value)}
											>
												<span title={value}>{label}</span>
											</button>
										</Tooltip>
									))}
								</div>
							</div>
							<div className="wpcp-typography-multiple-button-group wpcp-component-mb">
								<ComponentsTopSection label={__('Case', 'wp-carousel-free')} />
								<div className="wpcp-button-group-list">
									{textCaseOptions?.map(({ label, key, value }, i) => (
										<Tooltip placement="top" text={value} key={i}>
											<button
												className={`components-button ${safeFamily[key] === value ? ' active' : ''}`}
												onClick={() => onChangeTextStyles(key, value)}
											>
												<span title={value}>{label}</span>
											</button>
										</Tooltip>
									))}
								</div>
							</div>
						</Flex>
					</div>
				</Popover>
			)}
		</div>
	);
};

export default Typography;
