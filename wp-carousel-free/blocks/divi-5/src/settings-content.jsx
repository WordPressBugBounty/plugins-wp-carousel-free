/**
 * Divi 5 module settings panel.
 *
 * The saved-template list is a runtime lookup, so the dropdown's options are
 * patched into the group configuration once the REST call resolves rather than
 * declared in module.json.
 */

const { useState, useEffect } = window?.vendor?.wp?.element || {};
const { set } = window?.lodash || {};
const loggedFetch = window?.divi?.rest?.loggedFetch;
const ModuleGroups = window?.divi?.module?.ModuleGroups;

const PLACEHOLDER = { 0: { label: '- Select Template -' } };

const SettingsContent = ({ groupConfiguration }) => {
	const [templates, setTemplates] = useState(PLACEHOLDER);

	useEffect(() => {
		let cancelled = false;

		loggedFetch({ method: 'GET', restRoute: '/wpcp/v2/saved-templates' })
			.then((result) => {
				if (cancelled || !result || typeof result !== 'object') {
					return;
				}
				const options = {};
				Object.entries(result).forEach(([id, label]) => {
					options[id] = { label };
				});
				setTemplates(options);
			})
			.catch(() => {
				// Leave the placeholder in place; the module still renders.
			});

		return () => {
			cancelled = true;
		};
	}, []);

	if (groupConfiguration?.mainContent?.component) {
		set(
			groupConfiguration,
			[
				'mainContent',
				'component',
				'props',
				'fields',
				'templateIdInnerContent',
				'component',
				'props',
				'options',
			],
			templates
		);
	}

	return <ModuleGroups groups={groupConfiguration} />;
};

export { SettingsContent };
