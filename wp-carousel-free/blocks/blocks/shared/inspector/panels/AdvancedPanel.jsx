/**
 * Advanced Panel – General (root background + spacing), Visibility, Advanced.
 * Shown for: all sources.
 */

import { __ } from '@wordpress/i18n';
import { memo, useState, createInterpolateElement } from '@wordpress/element';
import { PanelBody, TextControl, Button, Modal, BaseControl } from '@wordpress/components';
import {
	Toggle,
	TabControls,
	Background,
	Spacing,
	SpCssCodeEditor,
} from '@wp-carousel-pro/components';
import { useOptionSetter } from '../../hooks/useOptionSetter';
import {
	CSS_CLASS_INVALID,
	CSS_ID_INVALID,
	cssClassGuidance,
	cssClassWarning,
	cssIdGuidance,
	cssIdWarning,
	cssFieldHelp,
} from '../../utils/cssIdentifierHelp';

function createSpacingDefaults(initial = 0) {
	return {
		allChange: true,
		unit: { Desktop: 'px', Tablet: 'px', Mobile: 'px' },
		device: {
			Desktop: { top: initial, right: initial, bottom: initial, left: initial },
		},
	};
}

function normalizeSpacingAttr(value, fallback = 0) {
	if (value && typeof value === 'object' && value.device && value.unit) {
		return value;
	}
	const initial = Number.isFinite(Number(value)) ? Number(value) : fallback;
	return createSpacingDefaults(initial);
}

const SPACING_DEFAULT_VALUE = {
	unit: 'px',
	value: { top: 0, right: 0, bottom: 0, left: 0 },
	device: createSpacingDefaults(0).device,
};

/**
 * Display-only placeholder when customCss is empty. Shown in the editor;
 * never written to the attribute (onChange skips when value === placeholder).
 */
const CUSTOM_CSS_PLACEHOLDER = 'selector {\n\n}';

const customCssHelp = createInterpolateElement(
	__('Use <code>selector</code> rule to change block styles.', 'wp-carousel-free'),
	{ code: <code /> }
);

const GeneralTab = ({ attributes, setAttributes }) => {
	const ao = attributes.advancedOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'advancedOptions');
	return (
		<>
			<Background
				attributes={ao.background || {}}
				attributesKey="background"
				setAttributes={set}
				items={['transparent', 'solid', 'gradient']}
			/>
			<Spacing
				label={__('Padding', 'wp-carousel-free')}
				attributes={normalizeSpacingAttr(ao.padding, 0)}
				attributesKey="padding"
				setAttributes={set}
				units={['px', '%', 'em']}
				defaultValue={SPACING_DEFAULT_VALUE}
			/>
			<Spacing
				label={__('Margin', 'wp-carousel-free')}
				attributes={normalizeSpacingAttr(ao.margin, 0)}
				attributesKey="margin"
				setAttributes={set}
				units={['px', '%', 'em']}
				defaultValue={SPACING_DEFAULT_VALUE}
			/>
		</>
	);
};

const VisibilityTab = ({ attributes, setAttributes }) => {
	const ao = attributes.advancedOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'advancedOptions');

	return (
		<>
			<Toggle
				label={__('Hide on Desktop', 'wp-carousel-free')}
				attributes={ao.visibilityDesktop === false}
				onChange={(checked) => set({ visibilityDesktop: !checked })}
			/>
			<Toggle
				label={__('Hide on Tablet', 'wp-carousel-free')}
				attributes={ao.visibilityTablet === false}
				onChange={(checked) => set({ visibilityTablet: !checked })}
			/>
			<Toggle
				label={__('Hide on Mobile', 'wp-carousel-free')}
				attributes={ao.visibilityMobile === false}
				onChange={(checked) => set({ visibilityMobile: !checked })}
			/>
		</>
	);
};
const AdvancedTab = ({ attributes, setAttributes }) => {
	const ao = attributes.advancedOptions || {};
	const set = useOptionSetter(attributes, setAttributes, 'advancedOptions');
	const cssClass = ao.cssClass ?? '';
	const cssId = ao.cssId ?? '';
	const customCss = ao.customCss ?? '';
	const [isCssModalOpen, setIsCssModalOpen] = useState(false);
	// Empty attr → show placeholder in the editor; never store the placeholder.
	const customCssEditorValue = customCss || CUSTOM_CSS_PLACEHOLDER;
	const onCustomCssChange = (next) => {
		if (CUSTOM_CSS_PLACEHOLDER !== next) {
			set({ customCss: next });
		}
	};

	return (
		<>
			<TextControl
				className="wpcp-css-class-field"
				label={__('Custom CSS Class(es)', 'wp-carousel-free')}
				value={cssClass}
				onChange={(v) => set({ cssClass: v })}
				placeholder="my-custom-class"
				__next40pxDefaultSize={true}
				help={cssFieldHelp(cssClass, CSS_CLASS_INVALID, cssClassGuidance(), cssClassWarning())}
			/>
			<TextControl
				label={__('Custom CSS ID', 'wp-carousel-free')}
				value={cssId}
				onChange={(v) => set({ cssId: v })}
				placeholder="my-custom-id"
				__next40pxDefaultSize={true}
				help={cssFieldHelp(cssId, CSS_ID_INVALID, cssIdGuidance(), cssIdWarning())}
			/>
			<div className="wpcp-advanced-custom-css">
				<BaseControl
					id="wpcp-block-custom-css"
					label={__('Custom CSS', 'wp-carousel-free')}
					help={customCssHelp}
					__nextHasNoMarginBottom
				>
					<SpCssCodeEditor value={customCssEditorValue} onChange={onCustomCssChange} height={180} />
					<Button
						icon="editor-expand"
						variant="secondary"
						onClick={() => setIsCssModalOpen(true)}
						className="wpcp-advanced-custom-css__modal-button"
					>
						{__('Edit in Modal', 'wp-carousel-free')}
					</Button>
				</BaseControl>
			</div>
			{isCssModalOpen && (
				<Modal
					title={__('Custom CSS', 'wp-carousel-free')}
					onRequestClose={() => setIsCssModalOpen(false)}
					className="wpcp-custom-css-modal"
				>
					<SpCssCodeEditor value={customCssEditorValue} onChange={onCustomCssChange} height={400} />
					<Button variant="secondary" onClick={() => setIsCssModalOpen(false)}>
						{__('Close', 'wp-carousel-free')}
					</Button>
				</Modal>
			)}
		</>
	);
};

function AdvancedPanel({
	attributes,
	setAttributes,
	panelOpen,
	onPanelToggle,
	activeTab,
	onTabChange,
}) {
	return (
		<PanelBody
			title={__('Advanced Settings', 'wp-carousel-free')}
			opened={panelOpen}
			onToggle={onPanelToggle}
		>
			<TabControls
				attributes={attributes}
				setAttributes={setAttributes}
				generalTabTitle={__('General', 'wp-carousel-free')}
				GeneralTab={GeneralTab}
				VisibilityTab={VisibilityTab}
				AdvancedTab={AdvancedTab}
				activeTab={activeTab}
				onTabChange={onTabChange}
				displayIcon={false}
			/>
		</PanelBody>
	);
}

export default memo(AdvancedPanel);
