import InfoIcon from '@wp-carousel-pro/components/infoIcon/infoIcon';

/**
 * Figma drawer row: label/description left, control right.
 *
 * @param {Object}                    props
 * @param {string}                    [props.title]
 * @param {string}                    [props.description]
 * @param {string}                    [props.infoTip]
 * @param {import('react').ReactNode} props.children
 * @param {string}                    [props.className]
 * @param {boolean}                   [props.controlOnly]
 */
export default function ModuleDrawerRow({
	title,
	description,
	infoTip,
	children,
	className = '',
	controlOnly = false,
}) {
	return (
		<div className={`wpcp-module-drawer-row ${className}`.trim()}>
			{!controlOnly && (title || description) && (
				<div className="wpcp-module-drawer-row-text">
					{title && (
						<h4 className="wpcp-module-drawer-row-title">
							{title}
							{infoTip && <InfoIcon tooltip={infoTip} label={infoTip} />}
						</h4>
					)}
					{description && <p className="wpcp-module-drawer-row-desc">{description}</p>}
				</div>
			)}
			<div className="wpcp-module-drawer-row-control">{children}</div>
		</div>
	);
}
