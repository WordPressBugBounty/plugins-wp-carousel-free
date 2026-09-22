/**
 * String/DOM helpers — class names, color resolution, JSON parsing, value extraction.
 */

const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production';

export const convertToClassName = (value) => {
	if (value === null || value === undefined) {
		return '';
	}
	let newValue = String(value);

	if (newValue.startsWith('#')) {
		newValue = newValue.slice(1);
	}
	newValue = newValue.replace(/\s+/g, '-');
	newValue = newValue.replace(/%/g, 'pct');
	newValue = newValue.replace(/\./g, '-');

	return newValue;
};

export const colorControls = (colorType, normalColor, gradientColor, bgImgObject = {}) => {
	if (!colorType) {
		return '';
	}

	const imageUrl = bgImgObject?.url;
	const backgroundMap = {
		transparent: 'transparent',
		bgColor: normalColor,
		gradient: gradientColor,
		image: imageUrl ? `url(${imageUrl})` : 'none',
	};

	return backgroundMap[colorType] ?? normalColor;
};

export const getObjectValuesToJsArray = (object) => {
	return Object.values(object ?? {});
};

export const jsonParse = (data) => {
	if (typeof data !== 'string') {
		return undefined;
	}
	try {
		return JSON.parse(data);
	} catch (e) {
		if (isDev) {
			// eslint-disable-next-line no-console
			console.error('JSON parse error:', e);
		}
		return undefined;
	}
};

/**
 * Every document a pointer event can land in while the editor is open.
 *
 * The post/site editor renders the canvas in its own iframe, so a click on a
 * slide or on the empty canvas area dispatches only inside that iframe's
 * document — a listener bound to the top-level document never sees it. Sidebar
 * UI that dismisses itself on outside clicks has to listen on both.
 *
 * @return {Document[]} The top-level document plus any reachable canvas document.
 */
export const getEditorDocuments = () => {
	const documents = [document];
	const canvasFrames = document.querySelectorAll(
		'iframe[name="editor-canvas"], iframe.edit-site-visual-editor__editor-canvas'
	);

	canvasFrames.forEach((frame) => {
		let frameDocument = null;
		try {
			frameDocument = frame.contentDocument || frame.contentWindow?.document || null;
		} catch (e) {
			frameDocument = null;
		}
		if (frameDocument && !documents.includes(frameDocument)) {
			documents.push(frameDocument);
		}
	});

	return documents;
};
