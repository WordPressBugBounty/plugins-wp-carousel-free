/**
 * Thin React wrapper over WP core CodeMirror (wp.codeEditor).
 *
 * Zero bundle cost — assets come from wp_enqueue_code_editor(). Falls back to a
 * plain textarea when the user has disabled the code editor in their profile.
 *
 * Pass `settings` — the array wp_enqueue_code_editor() returns, localized to the
 * page — to get that language's full core configuration: mode, linting, bracket
 * matching and the Ctrl-Space autocomplete binding. Without it the editor starts
 * from wp.codeEditor.defaultSettings with `mode` applied and linting off, which
 * is all the block editor's per-block Custom CSS field needs.
 *
 * When the attribute is empty, the parent may pass a display-only placeholder
 * (e.g. `value={attr || 'selector {\\n\\n}'}`) and must skip persisting that
 * placeholder so it is never stored.
 */

import { useEffect, useRef } from '@wordpress/element';
import './editor.scss';

/**
 * @param {Object}   props
 * @param {string}   props.value             Current code string (may be a display placeholder).
 * @param {Function} props.onChange          Called with the new code string.
 * @param {number}   [props.height=180]      Editor height in px.
 * @param {string}   [props.className]       Extra class on the wrapper.
 * @param {string}   [props.mode='text/css'] CodeMirror mode used when no `settings` are supplied.
 * @param {Object}   [props.settings]        Full wp.codeEditor settings from wp_enqueue_code_editor().
 */
const SpCssCodeEditor = ({
	value = '',
	onChange,
	height = 180,
	className = '',
	mode = 'text/css',
	settings = null,
}) => {
	const textareaRef = useRef(null);
	const editorRef = useRef(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) {
			return undefined;
		}

		const codeEditorApi = window.wp?.codeEditor;
		if (!codeEditorApi?.initialize) {
			const handleInput = () => {
				if (onChangeRef.current) {
					onChangeRef.current(textarea.value);
				}
			};
			textarea.addEventListener('input', handleInput);
			return () => {
				textarea.removeEventListener('input', handleInput);
			};
		}

		const defaults = codeEditorApi.defaultSettings || {};
		// Without page-supplied settings, do not force lint: WP core ships CSS mode
		// with lint:false and does not enqueue csslint for it — enabling lint without
		// window.CSSLint throws "window.CSSLint not defined, CodeMirror CSS linting
		// cannot run." A caller that wants linting passes the settings that
		// wp_enqueue_code_editor() returned, which arrive with the linters loaded.
		const instanceSettings = settings || {
			...defaults,
			codemirror: {
				...(defaults.codemirror || {}),
				mode,
				lineNumbers: true,
				lint: false,
			},
		};
		const instance = codeEditorApi.initialize(textarea, instanceSettings);

		const codeMirror = instance.codemirror;
		editorRef.current = codeMirror;

		const handleChange = (editor) => {
			if (onChangeRef.current) {
				onChangeRef.current(editor.getValue());
			}
		};
		codeMirror.on('change', handleChange);
		codeMirror.setSize(null, height);

		return () => {
			codeMirror.off('change', handleChange);
			codeMirror.toTextArea();
			editorRef.current = null;
		};
		// Init once per mount; height/onChange synced via refs / separate effect.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Sync external value (inline editor ↔ modal sharing the same attribute).
	useEffect(() => {
		const codeMirror = editorRef.current;
		const next = value || '';
		if (codeMirror) {
			if (next !== codeMirror.getValue()) {
				const cursor = codeMirror.getCursor();
				codeMirror.setValue(next);
				codeMirror.setCursor(cursor);
			}
			return;
		}
		const textarea = textareaRef.current;
		if (textarea && textarea.value !== next) {
			textarea.value = next;
		}
	}, [value]);

	useEffect(() => {
		const codeMirror = editorRef.current;
		if (codeMirror) {
			codeMirror.setSize(null, height);
		}
	}, [height]);

	return (
		<div className={`wpcp-css-code-editor ${className}`.trim()}>
			<textarea
				ref={textareaRef}
				defaultValue={value || ''}
				className="wpcp-css-code-editor__textarea"
				style={{ height: `${height}px`, width: '100%' }}
				spellCheck={false}
			/>
		</div>
	);
};

export default SpCssCodeEditor;
