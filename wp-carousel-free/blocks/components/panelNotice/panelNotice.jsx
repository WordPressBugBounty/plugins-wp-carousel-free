/**
 * Inspector notice — a small informational note shown inside inspector panels.
 *
 * Renders a self-contained box with a left accent border and tinted background.
 * This is the unified replacement for the ad-hoc `sp-panel-notice` divs/spans
 * that several panels hand-rolled: those only picked up the box styling when
 * nested inside a control's help text (`:has()`), so standalone notices rendered
 * unstyled. This component carries its own styling so it looks identical in any
 * context. Children may include links.
 */

export default function PanelNotice({ children, className = '' }) {
	return <div className={`wpcp-panel-notice${className ? ` ${className}` : ''}`}>{children}</div>;
}
