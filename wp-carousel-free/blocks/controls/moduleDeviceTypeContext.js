import { createContext, useContext, useMemo, useState } from '@wordpress/element';

const ModuleDeviceTypeContext = createContext(null);

/**
 * Local responsive device state for module dashboard drawers (outside the block editor).
 *
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.children
 */
export function ModuleDeviceTypeProvider({ children }) {
	const [deviceType, setDeviceType] = useState('Desktop');
	const value = useMemo(
		() => ({
			deviceType,
			setDeviceType,
		}),
		[deviceType]
	);

	return (
		<ModuleDeviceTypeContext.Provider value={value}>{children}</ModuleDeviceTypeContext.Provider>
	);
}

/**
 * @return {{ deviceType: string, setDeviceType: (device: string) => void } | null} Module device context, or null outside a provider.
 */
export function useModuleDeviceTypeContext() {
	return useContext(ModuleDeviceTypeContext);
}
