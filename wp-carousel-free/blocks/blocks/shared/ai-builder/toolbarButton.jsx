/**
 * Editor-level AI Carousel Builder host + header launcher.
 */

import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { subscribe } from '@wordpress/data';
import AIBuilderModal from './AIBuilderModal';
import { AI_BUILDER_QUERY_ARG, isAIBuilderEnabled } from './constants';
import { setAIBuilderOpener, openAIBuilder } from './openerRegistry';

const TOOLBAR_SELECTORS = ['.edit-post-header-toolbar', '.editor-header__toolbar'];
const AUTO_OPEN_POLL_INTERVAL_MS = 200;
const AUTO_OPEN_MAX_ATTEMPTS = 50;
const SLOT_CLASS = 'wpcp-ai-builder-launcher-slot';
const BUTTON_CLASS = 'wpcp-ai-builder-launcher';

// Same brand mark as AIBuilderModal.jsx's BrandMarkIcon, injected via
// innerHTML (this button is a plain DOM node, not JSX) — gradient ids are
// namespaced "Toolbar" so they can't collide with the modal's own copy when
// both are in the document at once.
const SPARKLES_SVG =
	'<svg viewBox="0 0 150 150" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M83.439 33.972a7.347 7.347 0 0 0-7.347-7.347H7.124c-1.477 0-2.685 1.2-2.685 2.667v90.666c0 1.467 1.208 2.667 2.685 2.667h123.543c1.477 0 2.686-1.2 2.686-2.667V86.625a8 8 0 0 0-8-8h-.168a8 8 0 0 0-8 8v18.64c0 1.467-1.209 2.667-2.686 2.667H23.292c-1.477 0-2.685-1.2-2.685-2.667v-61.28c0-1.467 1.208-2.667 2.685-2.667h52.8a7.347 7.347 0 0 0 7.347-7.346" fill="url(#wpcpAiBuilderToolbarA)"/><path d="m105.85 75.425-4.997 6.2-6.417 7.96a1.337 1.337 0 0 1-1.88.214l-5.774-4.614c-.564-.453-.672-1.306-.215-1.866l1.37-1.694 4.968-6.146c.403-.48.403-1.174 0-1.68l-6.392-7.894c-.456-.586-.376-1.413.215-1.866l5.775-4.614c.59-.453 1.423-.373 1.88.214l10.635 13.173.806.96c.429.453.429 1.147.026 1.653" fill="url(#wpcpAiBuilderToolbarB)"/><path d="m44.858 75.479 6.339 7.84c.456.587.376 1.413-.215 1.867l-5.748 4.586c-.59.454-1.423.374-1.88-.213l-11.44-14.133c-.404-.48-.404-1.174 0-1.68l.214-.267 11.307-13.867a1.34 1.34 0 0 1 1.88-.213l5.774 4.613c.59.454.672 1.307.215 1.867l-6.446 7.947c-.376.48-.402 1.173 0 1.653" fill="url(#wpcpAiBuilderToolbarC)"/><path d="M93.181 40.162c-1.013.345-1.013 2.081 0 2.426 15.763 5.366 21.243 18.55 23.1 25.803.117.455 1.716.455 1.833 0 1.857-7.254 7.337-20.437 23.1-25.803 1.013-.345 1.013-2.081 0-2.426-15.763-5.366-21.243-18.55-23.1-25.803-.117-.455-1.716-.455-1.833 0-1.857 7.254-7.337 20.437-23.1 25.803" fill="url(#wpcpAiBuilderToolbarD)"/><defs><linearGradient id="wpcpAiBuilderToolbarA" x1="13.463" y1="26.625" x2="92.686" y2="146.16" gradientUnits="userSpaceOnUse"><stop stop-color="#157592"/><stop offset="1" stop-color="#00b4c4"/></linearGradient><linearGradient id="wpcpAiBuilderToolbarB" x1="13.463" y1="26.625" x2="92.686" y2="146.16" gradientUnits="userSpaceOnUse"><stop stop-color="#157592"/><stop offset="1" stop-color="#00b4c4"/></linearGradient><linearGradient id="wpcpAiBuilderToolbarC" x1="13.463" y1="26.625" x2="92.686" y2="146.16" gradientUnits="userSpaceOnUse"><stop stop-color="#157592"/><stop offset="1" stop-color="#00b4c4"/></linearGradient><linearGradient id="wpcpAiBuilderToolbarD" x1="92.805" y1="9.375" x2="150.152" y2="66.487" gradientUnits="userSpaceOnUse"><stop stop-color="#157592"/><stop offset="1" stop-color="#00b4c4"/></linearGradient></defs></svg>';

let openModal = () => {};

function buildButton() {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = BUTTON_CLASS;
	button.style.cssText =
		'display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; margin-inline-start: 6px; background: #f0fdfa; border: 1px solid #19949e; border-radius: 4px; color: #0f766e; font-size: 13px; font-weight: 500; cursor: pointer; height: 36px; transition: all 0.2s ease; white-space: nowrap;margin-inline-end: 8px;';
	button.innerHTML = SPARKLES_SVG;
	button.appendChild(document.createTextNode(__('Build with AI', 'wp-carousel-free')));
	button.addEventListener('click', () => openModal());
	return button;
}

function ensureToolbarButton() {
	const toolbar = TOOLBAR_SELECTORS.map((selector) => document.querySelector(selector)).find(
		Boolean
	);
	if (!toolbar || toolbar.querySelector(`.${SLOT_CLASS}`)) {
		return;
	}

	const wrapper = document.createElement('div');
	wrapper.className = SLOT_CLASS;
	wrapper.style.display = 'inline-flex';
	wrapper.style.alignItems = 'center';
	wrapper.appendChild(buildButton());
	toolbar.appendChild(wrapper);
}

function AIBuilderHost() {
	const [isOpen, setIsOpen] = useState(false);
	const [targetClientId, setTargetClientId] = useState(null);
	const [requestedBlockName, setRequestedBlockName] = useState(null);
	const [isRefining, setIsRefining] = useState(false);

	useEffect(() => {
		const handler = ({ clientId = null, blockName = null, isRefining: refining = false } = {}) => {
			setTargetClientId(clientId || null);
			setRequestedBlockName(blockName || null);
			setIsRefining(refining);
			setIsOpen(true);
		};
		const unsubscribe = setAIBuilderOpener(handler);
		openModal = () => openAIBuilder({});
		return () => {
			unsubscribe();
			openModal = () => {};
		};
	}, []);

	return (
		<AIBuilderModal
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
			targetClientId={targetClientId}
			requestedBlockName={requestedBlockName}
			isRefining={isRefining}
		/>
	);
}

/**
 * Open the modal once when the editor was reached from the dashboard
 * "Build with AI" button; retried until the host has mounted its opener.
 */
function maybeAutoOpen() {
	const url = new URL(window.location.href);
	if ('true' !== url.searchParams.get(AI_BUILDER_QUERY_ARG)) {
		return;
	}
	url.searchParams.delete(AI_BUILDER_QUERY_ARG);
	window.history.replaceState(null, '', url.toString());

	let attempts = 0;
	const timer = setInterval(() => {
		attempts++;
		if (openAIBuilder({}) || attempts >= AUTO_OPEN_MAX_ATTEMPTS) {
			clearInterval(timer);
		}
	}, AUTO_OPEN_POLL_INTERVAL_MS);
}

export function registerAIBuilderLauncher() {
	// A switched-off module gets no launcher, no modal host, and therefore no
	// registered opener — which is what makes `openAIBuilder()` inert for every
	// other entry point too.
	if (!isAIBuilderEnabled()) {
		return;
	}
	subscribe(ensureToolbarButton);
	ensureToolbarButton();
	registerPlugin('wpcp-ai-builder-launcher', {
		render: AIBuilderHost,
	});
	maybeAutoOpen();
}
