export function useNavigationOptions(attributes, setAttributes) {
	const options = attributes.options ?? {};
	const setOpt = (update) => setAttributes({ options: { ...options, ...update } });
	return { options, setOpt };
}
