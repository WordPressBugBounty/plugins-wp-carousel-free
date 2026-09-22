/**
 * Label-left / editor-right row for the Custom CSS & JS settings tab.
 * Reuses the block editor's existing wp.codeEditor wrapper rather than
 * writing a second one.
 */

import SpCssCodeEditor from '../../../components/cssCodeEditor/index.js';

/**
 * @param {Object}   props
 * @param {string}   props.label      Field label.
 * @param {string}   props.value      Current code string.
 * @param {Function} props.onChange   Called with the new code string.
 * @param {string}   props.mode       CodeMirror mode used when `settings` is unavailable.
 * @param {Object}   [props.settings] wp.codeEditor settings localized for this language.
 */
const CodeSettingField = ({ label, value, onChange, mode, settings }) => (
	<div className="wpcpf-code-editor-field">
		<div className="wpcpf-code-editor-label">
			<p className="wpcpf-component-title">{label}</p>
		</div>
		<SpCssCodeEditor value={value} onChange={onChange} height={180} mode={mode} settings={settings} />
	</div>
);

export default CodeSettingField;
