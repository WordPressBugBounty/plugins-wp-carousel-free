/**
 * Divi 5 saved-template module.
 *
 * Divi 5 renders its visual builder in React, so the module's preview is fetched
 * from the plugin's own REST route rather than rendered by PHP the way every
 * other builder's preview is. The frontend render still comes from
 * `src/Admin/PageBuilders/Divi5/server/index.php`.
 *
 * Divi supplies React and its own packages as globals; nothing here is bundled.
 */

import metadata from './module.json';
import { SettingsContent } from './settings-content';
import * as moduleCarouselIcon from './icons/module-carousel';

const React = window?.vendor?.React;
const { useEffect, useRef } = React || {};

const ModuleContainer = window?.divi?.module?.ModuleContainer;
const StyleContainer = window?.divi?.module?.StyleContainer;
const elementClassnames = window?.divi?.module?.elementClassnames;
const registerModule = window?.divi?.moduleLibrary?.registerModule;
const addAction = window?.vendor?.wp?.hooks?.addAction;
const addFilter = window?.vendor?.wp?.hooks?.addFilter;
const useFetch = window?.divi?.rest?.useFetch;

const NOTICE_STYLE = {
	padding: '20px',
	textAlign: 'center',
	color: '#999',
	borderRadius: '4px',
	border: '1px dotted #ddd',
};

const ModuleStyles = ({ elements, settings, mode, state, noStyleTag }) => (
	<StyleContainer mode={mode} state={state} noStyleTag={noStyleTag}>
		{elements.style({
			attrName: 'module',
			styleProps: {
				disabledOn: { disabledModuleVisibility: settings?.disabledModuleVisibility },
			},
		})}
	</StyleContainer>
);

const ModuleScriptData = ({ elements }) => <>{elements.scriptData({ attrName: 'module' })}</>;

const moduleClassnames = ({ classnamesInstance, attrs }) => {
	classnamesInstance.add(elementClassnames({ attrs: attrs?.module?.decoration ?? {} }));
};

/**
 * Append the template's stylesheet links, which the REST route returns as ready
 * markup. The builder preview lives in the same document as the editor, so the
 * links go straight into its head.
 *
 * @param {string} templateId Selected template ID.
 * @param {string} css        Link markup from the REST response.
 */
function injectTemplateCss(templateId, css) {
	const containerId = `wpcpf-divi5-css-${templateId}`;

	if (!css || document.getElementById(containerId)) {
		return;
	}

	const container = document.createElement('div');
	container.id = containerId;
	container.innerHTML = css;
	document.head.appendChild(container);
}

const EditRenderer = ({ attrs, id, name, elements }) => {
	const templateId = attrs?.templateId?.innerContent?.desktop?.value || '0';
	const { fetch, response, isLoading } = useFetch(null);
	const abortRef = useRef(null);
	const lastFetchedRef = useRef(null);

	useEffect(() => {
		if (!templateId || templateId === '0' || lastFetchedRef.current === templateId) {
			return undefined;
		}

		lastFetchedRef.current = templateId;

		if (abortRef.current) {
			abortRef.current.abort();
		}
		abortRef.current = new AbortController();

		fetch({
			method: 'GET',
			restRoute: `/wpcp/v1/carousel-html?template_id=${templateId}`,
		}).then(() => {
			// Deferred so Divi has attached the replaced markup before Swiper
			// measures it; a detached node yields a broken carousel.
			setTimeout(() => {
				if (typeof window.WPCarouselFree?.initialize === 'function') {
					window.WPCarouselFree.initialize();
				}
			}, 0);
		});

		return () => {
			if (abortRef.current) {
				abortRef.current.abort();
				abortRef.current = null;
			}
		};
		// `fetch` is intentionally omitted: Divi returns a new reference on every
		// render, so depending on it re-fires the request forever.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [templateId]);

	useEffect(() => {
		if (isLoading || !response?.success) {
			return;
		}
		injectTemplateCss(templateId, response.css);
	}, [response, isLoading, templateId]);

	let body;

	if (!templateId || templateId === '0') {
		body = <div style={NOTICE_STYLE}>Please select a saved template.</div>;
	} else if (isLoading) {
		body = <div style={NOTICE_STYLE}>Loading template…</div>;
	} else if (response?.html) {
		body = <div dangerouslySetInnerHTML={{ __html: response.html }} />;
	} else {
		body = <div style={NOTICE_STYLE}>Failed to load the template.</div>;
	}

	return (
		<ModuleContainer
			attrs={attrs}
			elements={elements}
			id={id}
			moduleClassName="wpcp_divi5_carousel"
			name={name}
			scriptDataComponent={ModuleScriptData}
			stylesComponent={ModuleStyles}
			classnamesFunction={moduleClassnames}
		>
			{elements.styleComponents({ attrName: 'module' })}
			<div
				className="et_pb_module_inner wpcp-divi5-carousel-wrapper"
				data-builder-template-id={templateId}
			>
				{body}
			</div>
		</ModuleContainer>
	);
};

export const wpcpDivi5Carousel = {
	metadata,
	renderers: { edit: EditRenderer },
	settings: { content: SettingsContent },
};

addAction('divi.moduleLibrary.registerModuleLibraryStore.after', 'wpcpf.divi5Carousel', () => {
	registerModule(wpcpDivi5Carousel.metadata, wpcpDivi5Carousel);
});

// Publish the mark under the name module.json's `moduleIcon` points at. Divi 5
// resolves module icons through this registry, not the PHP
// `et_builder_module_icons` filter. Spreading is required — returning a bare
// object wipes every other module's icon out of the library.
if (addFilter) {
	addFilter('divi.iconLibrary.icon.map', 'wpcpf.divi5Carousel', (icons) => ({
		...icons,
		[moduleCarouselIcon.name]: moduleCarouselIcon,
	}));
}
