import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import AiProviderSettings from './AiProviderSettings';
import {
	AI_PROVIDER_CONFIG,
	KEY_CHECKING,
	KEY_INVALID,
	KEY_UNKNOWN,
	KEY_UNVERIFIED,
	KEY_VALID,
	getKeyState,
	isConnectorConnected,
	isProviderConnected,
	resolvePrimaryProvider,
} from './aiProviderConfig';
import './ai-configuration.scss';

const getWpcpfDashboard = () => (typeof window !== 'undefined' ? window.wpcpfDashboard || {} : {});

// A stable fallback, so the live-state effect below does not refire every render.
const NO_SETTINGS = {};

/**
 * POST a dashboard admin-ajax action with the dashboard nonce.
 *
 * @param {string} action Action name.
 * @param {Object} fields Extra form fields.
 * @return {Promise<Object|null>} Decoded JSON, or null when the request failed.
 */
const postDashboardAction = async (action, fields = {}) => {
	const dashboard = getWpcpfDashboard();
	if (!dashboard.ajaxUrl || !dashboard.nonce) {
		return null;
	}

	const form = new FormData();
	form.append('action', action);
	form.append('nonce', dashboard.nonce);
	Object.entries(fields).forEach(([key, value]) => form.append(key, value));

	try {
		const response = await fetch(dashboard.ajaxUrl, {
			method: 'POST',
			body: form,
			credentials: 'same-origin',
		});
		return await response.json();
	} catch (error) {
		return null;
	}
};

/**
 * Card status line for a provider.
 *
 * @param {boolean} viaConnector Served by WordPress Connectors.
 * @param {string}  state        Key verdict.
 * @return {{tone: string, label: string}} Status.
 */
const describeStatus = (viaConnector, state) => {
	if (viaConnector || KEY_VALID === state) {
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
	return { tone: 'none', label: __('Not set up', 'wp-carousel-free') };
};

/**
 * Settings → AI Configuration: one card per AI provider and the selected
 * provider's connection form. The Primary is the provider generation runs on.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.aiSettings  `getOptions.aiSettings` from the server, without live connector state.
 * @param {Function} props.saveOptions Dashboard save, resolves to the AJAX JSON.
 * @return {JSX.Element} The tab.
 */
export default function AiConfiguration({ aiSettings: savedSettings = NO_SETTINGS, saveOptions }) {
	// Verdicts from checks run on this screen, until the next server payload.
	const [overrides, setOverrides] = useState({});
	const [checkingSlug, setCheckingSlug] = useState('');
	// Live connector state costs a provider round trip, so only this tab asks.
	const [liveSettings, setLiveSettings] = useState(null);
	const attempted = useRef(new Set());
	const liveRequest = useRef(0);
	const aiSettings = liveSettings || savedSettings;

	useEffect(() => {
		setOverrides({});
		setLiveSettings(null);
		attempted.current = new Set();

		const request = ++liveRequest.current;
		postDashboardAction('wpcpf_ai_settings').then((result) => {
			if (request === liveRequest.current && result?.success && result.data?.aiSettings) {
				setLiveSettings(result.data.aiSettings);
			}
		});
	}, [savedSettings]);

	const stateOf = (slug) =>
		slug === checkingSlug ? KEY_CHECKING : getKeyState(aiSettings, overrides, slug);
	const primarySlug = resolvePrimaryProvider(aiSettings, overrides);
	const connectedCount = AI_PROVIDER_CONFIG.filter(({ slug }) =>
		isProviderConnected(aiSettings, overrides, slug)
	).length;

	const [activeSlug, setActiveSlug] = useState(() => primarySlug || AI_PROVIDER_CONFIG[0].slug);
	const activeProvider =
		AI_PROVIDER_CONFIG.find(({ slug }) => slug === activeSlug) || AI_PROVIDER_CONFIG[0];

	const verifyKey = useCallback(async (slug, force = false) => {
		setCheckingSlug(slug);
		const result = await postDashboardAction('wpcpf_ai_verify_key', {
			provider: slug,
			...(force ? { force: 'true' } : {}),
		});
		const verdict = result?.data?.status?.state;

		// "Unknown" or a failed check resolves nothing about the key; "not verified" ends the loop.
		setOverrides((prev) => ({
			...prev,
			[slug]: verdict && KEY_UNKNOWN !== verdict ? verdict : KEY_UNVERIFIED,
		}));
		setCheckingSlug('');
	}, []);

	// Stored keys with no fresh verdict are checked one at a time.
	useEffect(() => {
		if (checkingSlug) {
			return;
		}
		const pending = AI_PROVIDER_CONFIG.find(
			({ slug }) =>
				!attempted.current.has(slug) &&
				!isConnectorConnected(aiSettings, slug) &&
				KEY_UNKNOWN === getKeyState(aiSettings, overrides, slug)
		);
		if (pending) {
			attempted.current.add(pending.slug);
			verifyKey(pending.slug);
		}
	}, [aiSettings, overrides, checkingSlug, verifyKey]);

	return (
		<div className="wpcpf-ai-config">
			{false === aiSettings.ai_enabled && (
				<div className="wpcpf-ai-config__notice is-warning">
					{__(
						'AI features are disabled on this site, so carousel generation will not run. Re-enable AI support in WordPress to use it.',
						'wp-carousel-free'
					)}
				</div>
			)}
			<div className="wpcpf-ai-config__head">
				<div className="wpcpf-ai-config__head-text">
					<h3 className="wpcpf-ai-config__title">{__('AI Providers', 'wp-carousel-free')}</h3>
					<p className="wpcpf-ai-config__desc">
						{__('Configure the AI provider that builds your carousels.', 'wp-carousel-free')}
					</p>
				</div>
				<span className="wpcpf-ai-config__count">
					{sprintf(
						/* translators: 1: number of connected AI providers, 2: number of AI providers */
						__('%1$d of %2$d ready', 'wp-carousel-free'),
						connectedCount,
						AI_PROVIDER_CONFIG.length
					)}
				</span>
			</div>
			<div className="wpcpf-ai-config__providers">
				{AI_PROVIDER_CONFIG.map(({ slug, label, Icon }) => {
					const isActive = slug === activeProvider.slug;
					const status = describeStatus(isConnectorConnected(aiSettings, slug), stateOf(slug));
					return (
						<button
							key={slug}
							type="button"
							aria-pressed={isActive}
							className={`wpcpf-ai-config__provider${isActive ? ' is-active' : ''}`}
							onClick={() => setActiveSlug(slug)}
						>
							<span className="wpcpf-ai-config__provider-icon">
								<Icon />
							</span>
							<span className="wpcpf-ai-config__provider-label">{label}</span>
							<span className={`wpcpf-ai-config__provider-status is-${status.tone}`}>{status.label}</span>
							{slug === primarySlug && (
								<span className="wpcpf-ai-config__provider-badge">{__('Primary', 'wp-carousel-free')}</span>
							)}
						</button>
					);
				})}
			</div>
			<AiProviderSettings
				key={activeProvider.slug}
				provider={activeProvider}
				aiSettings={aiSettings}
				keyState={stateOf(activeProvider.slug)}
				isConnected={isProviderConnected(aiSettings, overrides, activeProvider.slug)}
				isPrimary={activeProvider.slug === primarySlug}
				primarySlug={primarySlug}
				onVerify={(force) => verifyKey(activeProvider.slug, force)}
				saveOptions={saveOptions}
			/>
		</div>
	);
}
