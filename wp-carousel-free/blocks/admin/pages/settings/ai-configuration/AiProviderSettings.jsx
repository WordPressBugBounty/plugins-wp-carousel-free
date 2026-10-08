import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement, useEffect, useRef, useState } from '@wordpress/element';
import { toastErrorMsg, toastSuccessMsg } from '../../../functions';
import { ExternalArrowIcon, NoticeDismissIcon, WordPressLogoIcon } from './icons';
import {
	KEY_CHECKING,
	KEY_INVALID,
	KEY_UNKNOWN,
	KEY_UNVERIFIED,
	KEY_VALID,
} from './aiProviderConfig';

const NOTICE_DISMISSED_KEY = 'wpcpf-ai-connector-notice-dismissed';

const readNoticeDismissed = () => {
	try {
		return '1' === window.localStorage.getItem(NOTICE_DISMISSED_KEY);
	} catch (error) {
		return false;
	}
};

const writeNoticeDismissed = () => {
	try {
		window.localStorage.setItem(NOTICE_DISMISSED_KEY, '1');
	} catch (error) {
		// Storage blocked: the notice just comes back on the next visit.
	}
};

/**
 * Status pill beside a stored key.
 *
 * @param {string} state Key verdict.
 * @return {{tone: string, label: string}|null} Pill, or null for none.
 */
const describeKeyPill = (state) => {
	if (KEY_VALID === state) {
		return { tone: 'connected', label: __('Connected', 'wp-carousel-free') };
	}
	if (KEY_INVALID === state) {
		return { tone: 'invalid', label: __('Invalid key', 'wp-carousel-free') };
	}
	if (KEY_UNVERIFIED === state) {
		return { tone: 'unverified', label: __('Not verified', 'wp-carousel-free') };
	}
	if (KEY_UNKNOWN === state || KEY_CHECKING === state) {
		return { tone: 'checking', label: __('Checking key…', 'wp-carousel-free') };
	}
	return null;
};

/**
 * Connection form for the provider selected on the AI Configuration tab.
 *
 * Every save goes through `AIKeyManager::save()`: `key_provider` is this card,
 * `provider` the Primary, so a backup key never moves the Primary. The stored
 * key arrives masked and is shown read-only; Replace swaps it for an empty
 * field, Remove key deletes it at once. No model is chosen here: the Primary
 * keeps its stored model and a new Primary starts on its recommended one.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.provider    Card config from AI_PROVIDER_CONFIG.
 * @param {Object}   props.aiSettings  `getOptions.aiSettings`.
 * @param {string}   props.keyState    Verdict on the stored key.
 * @param {boolean}  props.isConnected Whether the provider can serve a request.
 * @param {boolean}  props.isPrimary   Whether generation runs on this provider.
 * @param {string}   props.primarySlug Current Primary, or "".
 * @param {Function} props.onVerify    Re-check the stored key; receives `force`.
 * @param {Function} props.saveOptions Dashboard save.
 * @return {JSX.Element} The form.
 */
export default function AiProviderSettings({
	provider,
	aiSettings,
	keyState,
	isConnected,
	isPrimary,
	primarySlug,
	onVerify,
	saveOptions,
}) {
	const { slug, name, keyUrl } = provider;
	const connector = aiSettings?.connectors?.[slug] || {};
	const connectorsUrl = aiSettings?.connectors_url || '';
	const stored = aiSettings?.keys?.[slug] || {};
	const savedKey = stored.has_key ? stored.masked_key || '' : '';

	const [apiKey, setApiKey] = useState('');
	const [isReplacing, setIsReplacing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');
	const [isNoticeDismissed, setIsNoticeDismissed] = useState(readNoticeDismissed);
	const keyInputRef = useRef(null);
	const replaceButtonRef = useRef(null);
	const isFirstRender = useRef(true);

	// A newly stored key is the source of truth again; a Primary change alone keeps what is typed.
	useEffect(() => {
		setApiKey('');
		setIsReplacing(false);
	}, [savedKey]);

	// Keep focus with the control that replaced the one just clicked.
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		if (isReplacing) {
			keyInputRef.current?.focus();
		} else {
			replaceButtonRef.current?.focus();
		}
	}, [isReplacing]);

	const isKeyLocked = '' !== savedKey && !isReplacing;
	const hasTypedKey = '' !== apiKey.trim();
	const isChanged = hasTypedKey;
	const showConnectorNotice =
		connector.registered && !connector.connected && connectorsUrl && !isNoticeDismissed;
	const keyPill =
		isConnected || KEY_INVALID === keyState || KEY_UNVERIFIED === keyState
			? describeKeyPill(keyState)
			: null;
	const canRecheck =
		'' !== savedKey && !error && (KEY_INVALID === keyState || KEY_UNVERIFIED === keyState);

	// Why the stored key is not trusted, unless a fresh submission already explains it.
	let keyMessage = '';
	if (!error && '' !== savedKey && KEY_INVALID === keyState) {
		keyMessage =
			stored.message ||
			__(
				'This API key was rejected by the provider. Replace it with a valid key.',
				'wp-carousel-free'
			);
	} else if (!error && '' !== savedKey && KEY_UNVERIFIED === keyState) {
		keyMessage =
			stored.message ||
			__('This API key could not be verified with the provider yet.', 'wp-carousel-free');
	}

	/**
	 * Save through `AIKeyManager::save()`.
	 *
	 * @param {Object} values  Overrides for the default payload.
	 * @param {string} success Toast shown when the save lands.
	 * @return {Promise<boolean>} Whether the save landed.
	 */
	const persist = async (values, success) => {
		setError('');
		setIsSaving(true);

		let result = null;
		try {
			result = await saveOptions({
				aiSettings: {
					provider: primarySlug || slug,
					key_provider: slug,
					// The server keeps it for the same Primary, and falls back to a new Primary's default.
					model: aiSettings?.model || '',
					api_key: '',
					remove_key: false,
					...values,
				},
			});
		} catch (saveError) {
			result = null;
		}
		setIsSaving(false);

		if (!result?.success) {
			setError(__('The settings could not be saved. Please try again.', 'wp-carousel-free'));
			return false;
		}

		const keyResult = result.data?.aiKeyResult;
		// No result means the server skipped the AI settings entirely.
		if (!keyResult) {
			setError(
				__('AI settings are switched off on this site, so nothing was saved.', 'wp-carousel-free')
			);
			return false;
		}

		const isRejected =
			keyResult &&
			!keyResult.stored &&
			'unchanged' !== keyResult.state &&
			'removed' !== keyResult.state;

		if (isRejected) {
			const message =
				keyResult.message ||
				__('This API key was rejected. Paste a valid key and save again.', 'wp-carousel-free');
			setError(message);
			toastErrorMsg(message);
			return false;
		}

		setApiKey('');
		setIsReplacing(false);
		toastSuccessMsg(success);
		return true;
	};

	const handleSave = () =>
		persist(
			{ api_key: hasTypedKey ? apiKey : '' },
			hasTypedKey
				? __('API key verified and saved.', 'wp-carousel-free')
				: __('Settings saved.', 'wp-carousel-free')
		);

	const handleReset = () => {
		const message = sprintf(
			/* translators: %s: AI provider name */
			__('Reset %s to its defaults? Its saved API key will be removed.', 'wp-carousel-free'),
			name
		);
		// eslint-disable-next-line no-alert -- intentional confirmation before a destructive reset
		if (!window.confirm(message)) {
			return;
		}
		persist({ remove_key: true }, __('Settings reset.', 'wp-carousel-free'));
	};

	const handleRemoveKey = () => {
		/* translators: %s: AI provider name */
		const message = sprintf(__('Remove the saved %s API key?', 'wp-carousel-free'), name);
		// eslint-disable-next-line no-alert -- intentional confirmation before deleting a credential
		if (!window.confirm(message)) {
			return;
		}
		persist({ remove_key: true }, __('API key removed.', 'wp-carousel-free'));
	};

	const handleMakePrimary = () =>
		persist(
			{ provider: slug },
			sprintf(
				/* translators: %s: AI provider name */
				__('%s is now the primary provider.', 'wp-carousel-free'),
				name
			)
		);

	const startReplacing = () => {
		setApiKey('');
		setError('');
		setIsReplacing(true);
	};

	const cancelReplacing = () => {
		setApiKey('');
		setError('');
		setIsReplacing(false);
	};

	const dismissConnectorNotice = () => {
		setIsNoticeDismissed(true);
		writeNoticeDismissed();
	};

	const makePrimaryButton = isConnected && !isPrimary && (
		<button
			type="button"
			className="wpcpf-ai-config__action"
			onClick={handleMakePrimary}
			disabled={isSaving}
		>
			{__('Make primary', 'wp-carousel-free')}
		</button>
	);

	return (
		<div className="wpcpf-ai-config__form">
			{showConnectorNotice && (
				<div className="wpcpf-ai-config__connector">
					<span className="wpcpf-ai-config__connector-icon">
						<WordPressLogoIcon />
					</span>
					<p className="wpcpf-ai-config__connector-text">
						{createInterpolateElement(
							__(
								'Already use this provider elsewhere on your site? Add its key once under WordPress <link>Settings → Connectors</link> instead of here.',
								'wp-carousel-free'
							),
							{
								// eslint-disable-next-line jsx-a11y/anchor-has-content -- content supplied by createInterpolateElement
								link: <a href={connectorsUrl} target="_blank" rel="noreferrer" />,
							}
						)}
					</p>
					<button
						type="button"
						className="wpcpf-ai-config__connector-dismiss"
						onClick={dismissConnectorNotice}
						aria-label={__('Dismiss this notice', 'wp-carousel-free')}
					>
						<NoticeDismissIcon />
					</button>
				</div>
			)}

			{connector.connected ? (
				<div className="wpcpf-ai-config__field">
					<span className="wpcpf-ai-config__label">{__('API Key', 'wp-carousel-free')}</span>
					<div className="wpcpf-ai-config__connected">
						<span className="wpcpf-ai-config__connected-badge">
							✓ {__('Connected via WordPress', 'wp-carousel-free')}
						</span>
						<p className="wpcpf-ai-config__connected-text">
							{'' !== savedKey
								? __(
										'WP Carousel uses that connection. The key saved here stays as a fallback for when the connection is unavailable.',
										'wp-carousel-free'
								  )
								: __(
										'This provider is already configured in WordPress Connectors, so there is no key to enter here.',
										'wp-carousel-free'
								  )}
						</p>
					</div>
					{error && <span className="wpcpf-ai-config__error">{error}</span>}
					<div className="wpcpf-ai-config__key-meta">
						{connectorsUrl && (
							<a
								className="wpcpf-ai-config__key-link"
								href={connectorsUrl}
								target="_blank"
								rel="noreferrer"
							>
								{__('Manage in WordPress Connectors', 'wp-carousel-free')}
								<ExternalArrowIcon />
							</a>
						)}
						<div className="wpcpf-ai-config__key-actions">
							{makePrimaryButton}
							{'' !== savedKey && (
								<button
									type="button"
									className="wpcpf-ai-config__action is-danger"
									onClick={handleRemoveKey}
									disabled={isSaving}
								>
									{__('Remove the key stored here', 'wp-carousel-free')}
								</button>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="wpcpf-ai-config__field">
					{isKeyLocked ? (
						<span className="wpcpf-ai-config__label">{__('API Key', 'wp-carousel-free')}</span>
					) : (
						<label className="wpcpf-ai-config__label" htmlFor={`wpcpf-ai-key-${slug}`}>
							{__('API Key', 'wp-carousel-free')}
						</label>
					)}
					{isKeyLocked ? (
						<div className="wpcpf-ai-config__key-locked">
							<span className="wpcpf-ai-config__key-masked" aria-hidden="true">
								{savedKey}
							</span>
							<span className="screen-reader-text">
								{__('A saved API key is hidden.', 'wp-carousel-free')}
							</span>
							{keyPill && (
								<span className={`wpcpf-ai-config__key-status is-${keyPill.tone}`}>{keyPill.label}</span>
							)}
						</div>
					) : (
						<div className="wpcpf-ai-config__key-row">
							<input
								ref={keyInputRef}
								id={`wpcpf-ai-key-${slug}`}
								className={`wpcpf-ai-config__input${error ? ' is-error' : ''}`}
								type="password"
								placeholder={sprintf(
									/* translators: %s: AI provider name */
									__('Enter your %s API key', 'wp-carousel-free'),
									name
								)}
								value={apiKey}
								onChange={(event) => {
									setApiKey(event.target.value);
									setError('');
								}}
								aria-invalid={!!error}
								autoComplete="new-password"
								spellCheck="false"
							/>
							{isReplacing && (
								<button type="button" className="wpcpf-ai-config__key-btn" onClick={cancelReplacing}>
									{__('Cancel', 'wp-carousel-free')}
								</button>
							)}
						</div>
					)}
					{error && (
						<span className="wpcpf-ai-config__error" role="alert">
							{error}
						</span>
					)}
					{keyMessage && (
						<span className={`wpcpf-ai-config__${KEY_INVALID === keyState ? 'error' : 'help'}`}>
							{keyMessage}
						</span>
					)}
					<div className="wpcpf-ai-config__key-meta">
						<a className="wpcpf-ai-config__key-link" href={keyUrl} target="_blank" rel="noreferrer">
							{sprintf(
								/* translators: %s: AI provider name */
								__('Get your %s API key', 'wp-carousel-free'),
								name
							)}
							<ExternalArrowIcon />
						</a>
						<div className="wpcpf-ai-config__key-actions">
							{makePrimaryButton}
							{canRecheck && (
								<button
									type="button"
									className="wpcpf-ai-config__action"
									onClick={() => onVerify(true)}
									disabled={isSaving || KEY_CHECKING === keyState}
								>
									{__('Check again', 'wp-carousel-free')}
								</button>
							)}
							{isKeyLocked && (
								<>
									<button
										ref={replaceButtonRef}
										type="button"
										className="wpcpf-ai-config__action"
										onClick={startReplacing}
										disabled={isSaving}
										aria-label={__('Replace API key', 'wp-carousel-free')}
									>
										{__('Replace key', 'wp-carousel-free')}
									</button>
									<button
										type="button"
										className="wpcpf-ai-config__action is-danger"
										onClick={handleRemoveKey}
										disabled={isSaving}
									>
										{__('Remove key', 'wp-carousel-free')}
									</button>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{!connector.connected && (
				<div className="wpcpf-settings-actions">
					<button
						type="button"
						className="wpcpf-save-btn"
						onClick={handleSave}
						disabled={isSaving || !isChanged}
					>
						{isSaving && hasTypedKey && __('Verifying…', 'wp-carousel-free')}
						{isSaving && !hasTypedKey && __('Saving…', 'wp-carousel-free')}
						{!isSaving && __('Save Changes', 'wp-carousel-free')}
					</button>
					<button
						type="button"
						className="wpcpf-reset-btn"
						onClick={handleReset}
						disabled={isSaving || ('' === savedKey && !isChanged)}
					>
						{__('Reset to Default', 'wp-carousel-free')}
					</button>
				</div>
			)}
		</div>
	);
}
