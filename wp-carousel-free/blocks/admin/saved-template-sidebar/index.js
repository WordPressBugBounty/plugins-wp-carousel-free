import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { useSelect } from '@wordpress/data';
import { createPortal, useEffect, useState, useRef } from '@wordpress/element';
import { isBlockModuleActive } from '../../blocks/shared/utils/moduleState';
import './editor.scss';

const CopyIcon = () => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 18 18"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<path
			d="M6 6V3.75A.75.75 0 0 1 6.75 3h7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H12M3.75 6.75h7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75Z"
			stroke="currentColor"
			strokeWidth="1.2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const PORTAL_CLASSNAME = 'wpcpf-shortcode-portal';

/**
 * Safely copy text to clipboard with fallback support
 * @param {string} text - Text to copy
 * @return {Promise<boolean>} Success status
 */
const copyText = async (text) => {
	// Validate input
	if (typeof text !== 'string') {
		return false;
	}

	// First try Clipboard API
	if (navigator.clipboard && navigator.clipboard.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn('Clipboard API failed, using fallback.', e);
		}
	}

	// Fallback method: hidden textarea + execCommand
	try {
		const textarea = document.createElement('textarea');
		textarea.value = text;

		// Hide from screen
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		textarea.style.pointerEvents = 'none';

		document.body.appendChild(textarea);
		textarea.select();

		const success = document.execCommand('copy');
		document.body.removeChild(textarea);

		return success;
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Fallback copy failed:', err);
		return false;
	}
};

/**
 * Validate URL is safe and belongs to this WordPress site
 * @param {string} url - URL to validate
 * @return {string} Safe URL or empty string
 */
const getSafeUrl = (url) => {
	if (typeof url !== 'string' || url === '') {
		return '';
	}

	try {
		const urlObj = new URL(url, window.location.origin);
		// Only allow http/https protocols
		if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
			return '';
		}
		// Ensure URL is absolute
		return urlObj.href;
	} catch (e) {
		return '';
	}
};

/**
 * Sanitize shortcode output for safe rendering
 * @param {number|string} id - Template ID
 * @return {string} Escaped shortcode string
 */
const getSafeShortcode = (id) => {
	// Ensure ID is a number
	const numId = typeof id === 'number' ? id : parseInt(id, 10);
	if (isNaN(numId) || numId < 0) {
		return '[sp_wpcp_template id="0"]';
	}
	return `[sp_wpcp_template id="${numId}"]`;
};

const SavedTemplateSidebar = () => {
	const { postType, postId } = useSelect((select) => {
		try {
			const coreEditor = select('core/editor');
			if (!coreEditor) {
				return { postType: null, postId: null };
			}
			return {
				postType: coreEditor.getCurrentPostType() || null,
				postId: coreEditor.getCurrentPostId() || null,
			};
		} catch (error) {
			return { postType: null, postId: null };
		}
	}, []);

	const [copied, setCopied] = useState(false);
	const [portalTarget, setPortalTarget] = useState(null);
	const copyTimerRef = useRef(null);

	useEffect(() => {
		// Early return if not the correct post type
		if (postType !== 'sp_wpcp_template') {
			setPortalTarget(null);
			return undefined;
		}

		let container = null;

		const ensureContainer = () => {
			try {
				const fill = document.querySelector('.interface-complementary-area__fill');
				if (!fill) {
					return;
				}

				let existing = fill.querySelector(`:scope > .${PORTAL_CLASSNAME}`);
				if (!existing) {
					existing = document.createElement('div');
					existing.className = PORTAL_CLASSNAME;
					fill.insertBefore(existing, fill.firstChild);
				} else if (fill.firstElementChild !== existing) {
					fill.insertBefore(existing, fill.firstChild);
				}

				if (existing !== container) {
					container = existing;
					setPortalTarget(existing);
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error('Error ensuring container:', e);
			}
		};

		ensureContainer();

		// Only use MutationObserver if available
		if (typeof window.MutationObserver === 'function') {
			const observer = new window.MutationObserver(ensureContainer);
			observer.observe(document.body, { childList: true, subtree: true });

			return () => {
				observer.disconnect();
				if (container && container.parentNode) {
					try {
						container.parentNode.removeChild(container);
					} catch (e) {
						// eslint-disable-next-line no-console
						console.error('Error removing container:', e);
					}
				}
				setPortalTarget(null);
			};
		}

		// Cleanup function if MutationObserver not available
		return () => {
			if (container && container.parentNode) {
				try {
					container.parentNode.removeChild(container);
				} catch (e) {
					// eslint-disable-next-line no-console
					console.error('Error removing container:', e);
				}
			}
			setPortalTarget(null);
		};
	}, [postType]);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (copyTimerRef.current) {
				clearTimeout(copyTimerRef.current);
			}
		};
	}, []);

	// Early return if conditions not met
	if (postType !== 'sp_wpcp_template' || !portalTarget) {
		return null;
	}

	const idForShortcode = postId || 0;
	const shortcode = getSafeShortcode(idForShortcode);

	const handleCopy = async () => {
		const ok = await copyText(shortcode);
		if (!ok) {
			return;
		}
		setCopied(true);

		// Clear existing timer if any
		if (copyTimerRef.current) {
			clearTimeout(copyTimerRef.current);
		}

		// Set new timer
		copyTimerRef.current = window.setTimeout(() => {
			setCopied(false);
			copyTimerRef.current = null;
		}, 1500);
	};

	// Validate portalTarget is a valid DOM node
	if (!portalTarget || !portalTarget.appendChild) {
		return null;
	}

	const savedTemplatesUrl = getSafeUrl(
		(window.wpcpBlockLocalize && window.wpcpBlockLocalize.savedTemplatesUrl) || ''
	);

	return createPortal(
		<div className="wpcpf-shortcode-panel">
			<p className="wpcpf-shortcode-panel__intro">
				{__('You can use this shortcode anywhere and manage it from', 'wp-carousel-free')}{' '}
				{savedTemplatesUrl ? (
					<a className="wpcpf-shortcode-panel__link" href={savedTemplatesUrl} rel="noopener noreferrer">
						{__('Saved Templates.', 'wp-carousel-free')}
					</a>
				) : (
					<span>{__('Saved Templates.', 'wp-carousel-free')}</span>
				)}
			</p>
			<button
				type="button"
				className="wpcpf-shortcode-panel__chip"
				onClick={handleCopy}
				aria-label={
					copied ? __('Shortcode copied', 'wp-carousel-free') : __('Copy shortcode', 'wp-carousel-free')
				}
			>
				<span className="wpcpf-shortcode-panel__code">{shortcode}</span>
				<span className="wpcpf-shortcode-panel__copy">
					{copied ? <span className="wpcpf-shortcode-panel__copy-text">Copied!</span> : <CopyIcon />}
				</span>
			</button>
		</div>,
		portalTarget
	);
};

// The Saved Templates module owns this sidebar; with the module off there is
// nothing for it to link to, so it never registers.
if (isBlockModuleActive('saved-templates')) {
	registerPlugin('wpcpf-saved-template-sidebar', {
		render: SavedTemplateSidebar,
	});
}
