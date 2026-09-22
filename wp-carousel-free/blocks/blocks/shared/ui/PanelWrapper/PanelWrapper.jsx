/**
 * PanelWrapper Component
 *
 * A wrapper component that manages panel state (open/close, active tab)
 * and passes this state to child panel components.
 *
 * Eliminates the repetitive prop-drilling pattern:
 *   panelOpen={openPanel === 'panelName'}
 *   onPanelToggle={() => handleToggle('panelName')}
 *   activeTab={panelTabs.panelName}
 *   onTabChange={(tab) => handleTabChange('panelName', tab)}
 *
 * @module shared/components/PanelWrapper
 */

import { cloneElement, Children, useCallback, useMemo } from '@wordpress/element';

/**
 * PanelWrapper - Wraps a panel component with state management props.
 *
 * @param {Object}                    props                   - Component props
 * @param {string}                    props.panelName         - Unique identifier for this panel
 * @param {*}                         props.openPanel         - Currently open panel name
 * @param {Function}                  props.onOpenPanelChange - Callback when panel open state changes
 * @param {Object}                    props.panelTabs         - All panel tab states
 * @param {Function}                  props.onPanelTabsChange - Callback when panel tab state changes
 * @param {import('react').ReactNode} props.children          - Panel component to wrap
 */
export default function PanelWrapper({
	panelName,
	openPanel,
	onOpenPanelChange,
	panelTabs,
	onPanelTabsChange,
	children,
}) {
	// Memoize derived state to prevent unnecessary recalculations
	const panelOpen = useMemo(() => openPanel === panelName, [openPanel, panelName]);
	const activeTab = useMemo(() => panelTabs?.[panelName], [panelTabs, panelName]);

	// Memoize callbacks to prevent child re-renders
	const handlePanelToggle = useCallback(() => {
		onOpenPanelChange((prev) => (prev === panelName ? null : panelName));
	}, [onOpenPanelChange, panelName]);

	const handleTabChange = useCallback(
		(tabName) => {
			onPanelTabsChange((prev) => ({ ...prev, [panelName]: tabName }));
		},
		[onPanelTabsChange, panelName]
	);

	// Memoize the injected props object to maintain reference equality
	const injectedProps = useMemo(
		() => ({
			panelOpen,
			onPanelToggle: handlePanelToggle,
			activeTab,
			onTabChange: handleTabChange,
		}),
		[panelOpen, handlePanelToggle, activeTab, handleTabChange]
	);

	// Clone the single child and inject the panel state props
	const child = Children.only(children);

	return cloneElement(child, injectedProps);
}
