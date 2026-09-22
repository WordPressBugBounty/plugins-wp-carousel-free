import toast from 'react-hot-toast';

export const toastSuccessMsg = (message) => {
	return toast.success(message, {
		style: {
			marginTop: '28px',
			fontSize: '15px',
			padding: '10px 18px',
		},
	});
};

export const toastErrorMsg = (message) => {
	return toast.error(message, {
		style: {
			marginTop: '28px',
			fontSize: '15px',
			padding: '10px 18px',
		},
	});
};

/**
 * Copy text to the clipboard, falling back to a hidden textarea where the
 * Clipboard API is unavailable (older browsers, or a non-secure context).
 *
 * @param {string} text Text to copy.
 * @return {boolean} Whether the copy is believed to have succeeded.
 */
export const copyText = (text) => {
	if (navigator.clipboard?.writeText) {
		navigator.clipboard.writeText(text);
		return true;
	}

	try {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		textarea.style.pointerEvents = 'none';

		document.body.appendChild(textarea);
		textarea.select();
		const success = document.execCommand('copy');
		document.body.removeChild(textarea);

		return success;
	} catch (error) {
		return false;
	}
};
