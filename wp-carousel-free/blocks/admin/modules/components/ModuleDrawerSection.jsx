/**
 * Figma section heading with divider.
 *
 * @param {Object}                    props
 * @param {string}                    props.title
 * @param {import('react').ReactNode} props.children
 */
export default function ModuleDrawerSection({ title, children }) {
	return (
		<section className="wpcp-module-drawer-section">
			{title && <h3 className="wpcp-module-drawer-section-title">{title}</h3>}
			<div className="wpcp-module-drawer-section-body">{children}</div>
		</section>
	);
}
