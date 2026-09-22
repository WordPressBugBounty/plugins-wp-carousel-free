import { useEffect, useRef, useState } from '@wordpress/element';
import { Button, Popover } from '@wordpress/components';
import './editor.scss';
import { BorderIcon } from '../../icons/icons';
import { getEditorDocuments, jsonParse } from '../../blocks/shared/utils/dom';

const SelectField = ({ popupRef, childElement, onClose, anchor = '', divClassName = '' }) => {
	return (
		<>
			<Popover
				ref={popupRef}
				shift={true}
				className={`sp-border-popover wpcp-tab-panel ${divClassName}`}
				anchor={anchor}
				// position={ 'bottom left' }
				offset={10}
				// placement="right"
				focusOnMount={false}
			>
				<div className="wpcp-popup-content">
					<div className="wpcp-popup-wrapper">
						<div className="wpcp-popup-content-area">
							{React?.cloneElement(childElement, { onClose })}
						</div>
					</div>
				</div>
			</Popover>
		</>
	);
};

const Popup = (props) => {
	const {
		label,
		children,
		toggleButton,
		type = '',
		activeLabel = '',
		divClassName = '',
		popupClose = true,
		setPopupClose = () => {},
	} = props;
	const [isContentsVisible, setIsContentsVisible] = useState(false);
	const [popoverAnchor, setPopoverAnchor] = useState(null);
	const popupRef = useRef(null);
	const buttonRef = useRef(null);

	const handleButtonClick = () => {
		setIsContentsVisible((prev) => !prev); // Toggle content visibility
		setPopupClose((prev) => !prev);
	};

	// Close the dropdown when clicking outside of it — including clicks on the
	// iframed editor canvas, which never reach the top-level document.
	useEffect(() => {
		const isOpen = type === 'select' ? popupClose : isContentsVisible;
		if (!isOpen) {
			return undefined;
		}

		const handleClickOutside = (event) => {
			const target = event.target;
			if (typeof target?.closest !== 'function') {
				return;
			}

			const typographyElement = target.closest('.wpcp-typography-fonts');
			const popupElement = target.closest('.wpcp-popup-content');
			const colorPopupElement = target.closest('.wpcp-picker-pallet-wrapper');
			const drawerColorPopover = target.closest('.wpcp-drawer-wp-color-popover');

			if (
				popupRef.current &&
				!popupRef.current.contains(target) &&
				!buttonRef.current?.contains(target) &&
				!typographyElement &&
				!popupElement &&
				!colorPopupElement &&
				!drawerColorPopover
			) {
				setIsContentsVisible(false);
				setPopupClose(false);
			}
		};

		const listeningDocuments = getEditorDocuments();
		listeningDocuments.forEach((doc) => doc.addEventListener('mousedown', handleClickOutside));
		return () => {
			listeningDocuments.forEach((doc) => doc.removeEventListener('mousedown', handleClickOutside));
		};
	}, [isContentsVisible, popupClose, type, setPopupClose]);

	const value = toggleButton?.props?.attributes || null;
	const isActivePopUpButton = value ? jsonParse(value) : true;

	return (
		<>
			<div className="wpcp-button wpcp-component-mb">
				{type !== 'select' && (
					<>
						<div className={`wpcp-header-left ${toggleButton && 'wide-area'}`}>
							{label && <span className="wpcp-component-title">{label}</span>}
							{toggleButton && toggleButton}
						</div>
						<div className="wpcp-header-right" ref={setPopoverAnchor}>
							<Button
								aria-disabled={!isActivePopUpButton}
								className={`wpcp-border-icon-button ${isActivePopUpButton ? 'active' : ''} ${
									isContentsVisible ? 'button-clicked' : ''
								}`}
								icon={<BorderIcon isActive={isContentsVisible} />}
								ref={buttonRef}
								onClick={isActivePopUpButton ? handleButtonClick : undefined}
							/>
						</div>
					</>
				)}
				{type === 'select' && (
					<>
						<div
							ref={buttonRef}
							className={`wpcp-dropdown-select ${divClassName}`}
							onClick={handleButtonClick}
						>
							{activeLabel?.replaceAll('-', ' ')}
							{isContentsVisible && isActivePopUpButton ? (
								<i className="sp-icon-angle-up" />
							) : (
								<i className="sp-icon-angle-down" />
							)}
						</div>
					</>
				)}
			</div>
			{type !== 'select' && isContentsVisible && isActivePopUpButton && (
				<SelectField
					popupRef={popupRef}
					childElement={children}
					anchor={popoverAnchor}
					divClassName={divClassName}
					onClose={() => {
						setIsContentsVisible(false);
						setPopupClose(false);
					}}
				/>
			)}
			{type === 'select' && popupClose && (
				<SelectField
					popupRef={popupRef}
					childElement={children}
					divClassName={divClassName}
					// onClose={() => {
					// 	setIsContentsVisible(false);
					// 	setPopupClose(false);
					// }}
				/>
			)}
		</>
	);
};

export default Popup;
