import { PanelBody } from '@wordpress/components';
import './editor.scss';

const ChildPanelBody = ({
	title,
	children,
	initialOpen = false,
	opened = null,
	resetIcon = false,
	resetButtonAction,
	onToggle = () => {},
}) => {
	const ResetButton = ({ onClick }) => {
		const resetAction = (e) => {
			e.stopPropagation();
			const confirmText = 'Are you sure you want to delete?';
			// eslint-disable-next-line no-alert -- intentional confirmation before reset
			if (!window.confirm(confirmText)) {
			} else {
				onClick();
			}
		};

		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width={16}
				height={16}
				fill="none"
				onClick={resetAction} // Directly pass the event object here
				className="child-panel-body-reset-icon"
			>
				<path
					fill="#2F2F2F"
					d="M11.96 5.168 9.126 8l2.832 2.832-1.128 1.128L8 9.136 5.175 11.96 4.04 10.824 6.863 8 4.04 5.176 5.175 4.04 8 6.864l2.832-2.824 1.128 1.128Z"
				/>
			</svg>
		);
	};

	return (
		<PanelBody
			className="wpcp-child-panel-body"
			title={title}
			initialOpen={initialOpen}
			opened={opened}
			onToggle={onToggle}
			icon={resetIcon && <ResetButton onClick={resetButtonAction} />}
		>
			{children}
		</PanelBody>
	);
};

export default ChildPanelBody;
