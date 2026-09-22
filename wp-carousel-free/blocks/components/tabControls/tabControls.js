import { TabPanel } from '@wordpress/components';
import { memo, useCallback, useMemo } from '@wordpress/element';
import { GeneralIcon, StyleIcon, AdvancedIcon, SliderIcon } from './icon';
import './editor.scss';

const TabControls = ({
	attributes,
	setAttributes,
	GeneralTab = null,
	StyleTab = null,
	AdvancedTab = null,
	VisibilityTab = null,
	SliderTab = null,
	displayIcon = true,
	props = '',
	verticalPosition = true,
	Preset = null,
	LayoutTab = null,
	CarouselTab = null,
	initialTab = 'general',
	generalTabTitle = null,
	styleTabTitle = null,
	advancedTabTitle = null,
	sliderTabTitle = null,
	activeTab = null,
	onTabChange = null,
	layoutType = null,
}) => {
	const currentTab = activeTab !== null ? activeTab : initialTab;
	const tabs = useMemo(() => {
		const nextTabs = [];

		if (LayoutTab) {
			nextTabs.push({
				name: `layout`,
				title: <span className="wpcp-tab-panel-title">{displayIcon && <GeneralIcon />} Layouts</span>,
				className: 'wpcp-general-tab',
			});
		}

		if (CarouselTab) {
			nextTabs.push({
				name: `carousel`,
				title: <span className="wpcp-tab-panel-title">{displayIcon && <StyleIcon />} Carousel</span>,
				className: 'wpcp-general-tab',
			});
		}

		if (GeneralTab) {
			nextTabs.push({
				name: `general`,
				title: (
					<span className="wpcp-tab-panel-title">
						{displayIcon && <GeneralIcon />} {generalTabTitle || 'Settings'}
					</span>
				),
				className: 'wpcp-general-tab',
			});
		}
		if (Preset) {
			nextTabs.push({
				name: 'preset',
				title: <span className="wpcp-tab-panel-title">{displayIcon && <GeneralIcon />} Preset</span>,
				className: 'wpcp-preset-tab',
			});
		}
		if (StyleTab) {
			nextTabs.push({
				name: `style`,
				title: (
					<span className="wpcp-tab-panel-title">
						{displayIcon && <StyleIcon />} {styleTabTitle || 'Style'}
					</span>
				),
				className: 'wpcp-style-tab',
			});
		}

		if (VisibilityTab) {
			nextTabs.push({
				name: 'visibility',
				title: <span className="wpcp-tab-panel-title">Visibility</span>,
				className: 'wpcp-visibility-tab',
			});
		}

		if (AdvancedTab) {
			nextTabs.push({
				name: 'advanced',
				title: (
					<span className="wpcp-tab-panel-title">
						{displayIcon && <AdvancedIcon />} {advancedTabTitle || 'Advanced'}
					</span>
				),
				className: 'wpcp-advanced-tab',
			});
		}

		if (SliderTab) {
			nextTabs.push({
				name: 'slider',
				title: (
					<span className="wpcp-tab-panel-title">
						{displayIcon && <SliderIcon />} {sliderTabTitle || 'Slider'}
					</span>
				),
				className: 'wpcp-advanced-tab',
			});
		}

		return nextTabs;
	}, [
		LayoutTab,
		CarouselTab,
		GeneralTab,
		Preset,
		StyleTab,
		VisibilityTab,
		AdvancedTab,
		SliderTab,
		displayIcon,
		generalTabTitle,
		styleTabTitle,
		advancedTabTitle,
		sliderTabTitle,
	]);

	const handleSelect = useCallback((newVal) => onTabChange && onTabChange(newVal), [onTabChange]);

	return (
		<TabPanel
			className="wpcp-tab-panel"
			activeClass="active-tab"
			initialTabName={currentTab}
			onSelect={handleSelect}
			tabs={tabs}
		>
			{(tab) => {
				return (
					<>
						{tab.name === 'layout' && LayoutTab && (
							<LayoutTab
								attributes={attributes}
								verticalPosition={verticalPosition}
								setAttributes={setAttributes}
								props={props}
							/>
						)}
						{tab.name === 'carousel' && CarouselTab && (
							<CarouselTab
								attributes={attributes}
								verticalPosition={verticalPosition}
								setAttributes={setAttributes}
								props={props}
							/>
						)}
						{tab.name === 'general' && GeneralTab && (
							<GeneralTab
								attributes={attributes}
								verticalPosition={verticalPosition}
								setAttributes={setAttributes}
								props={props}
								layoutType={layoutType}
							/>
						)}
						{tab.name === 'style' && StyleTab && (
							<StyleTab attributes={attributes} setAttributes={setAttributes} props={props} />
						)}
						{tab.name === 'visibility' && VisibilityTab && (
							<VisibilityTab attributes={attributes} setAttributes={setAttributes} props={props} />
						)}

						{tab.name === 'preset' && Preset && (
							<Preset attributes={attributes} setAttributes={setAttributes} props={props} />
						)}
						{tab.name === 'advanced' && AdvancedTab && (
							<AdvancedTab attributes={attributes} setAttributes={setAttributes} props={props} />
						)}
						{tab.name === 'slider' && SliderTab && (
							<SliderTab
								attributes={attributes}
								setAttributes={setAttributes}
								props={props}
								layoutType={layoutType}
							/>
						)}
					</>
				);
			}}
		</TabPanel>
	);
};

export default memo(TabControls);
