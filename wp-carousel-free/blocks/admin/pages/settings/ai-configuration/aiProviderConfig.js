import { AI_PROVIDER_LABELS } from '../../../../blocks/shared/ai-builder/providers';
import { ClaudeIcon, GeminiIcon, GroqIcon, OpenAIIcon } from './icons';

/**
 * Provider cards on the AI Configuration tab, in display order.
 */
export const AI_PROVIDER_CONFIG = [
	{
		slug: 'anthropic',
		label: AI_PROVIDER_LABELS.anthropic,
		name: 'Anthropic',
		Icon: ClaudeIcon,
		keyUrl: 'https://console.anthropic.com/settings/keys',
	},
	{
		slug: 'gemini',
		label: AI_PROVIDER_LABELS.gemini,
		name: 'Gemini',
		Icon: GeminiIcon,
		keyUrl: 'https://aistudio.google.com/apikey',
	},
	{
		slug: 'openai',
		label: AI_PROVIDER_LABELS.openai,
		name: 'OpenAI',
		Icon: OpenAIIcon,
		keyUrl: 'https://platform.openai.com/api-keys',
	},
	{
		slug: 'groq',
		label: AI_PROVIDER_LABELS.groq,
		name: 'Groq',
		Icon: GroqIcon,
		keyUrl: 'https://console.groq.com/keys',
	},
];

// Verdicts as AIKeyValidator reports them, plus the in-flight check.
export const KEY_VALID = 'valid';
export const KEY_INVALID = 'invalid';
export const KEY_UNVERIFIED = 'unverified';
export const KEY_UNKNOWN = 'unknown';
export const KEY_NONE = 'none';
export const KEY_CHECKING = 'checking';

/**
 * The verdict on a provider's stored key, with a just-run check taking precedence.
 *
 * @param {Object} aiSettings `getOptions.aiSettings`.
 * @param {Object} overrides  Slug → state from a verification run this session.
 * @param {string} slug       Provider slug.
 * @return {string} One of the KEY_* states.
 */
export const getKeyState = (aiSettings, overrides, slug) => {
	if (overrides?.[slug]) {
		return overrides[slug];
	}
	const key = aiSettings?.keys?.[slug];
	if (!key?.has_key) {
		return KEY_NONE;
	}
	return key.status || KEY_UNKNOWN;
};

/**
 * Whether WordPress Connectors serves this provider.
 *
 * @param {Object} aiSettings `getOptions.aiSettings`.
 * @param {string} slug       Provider slug.
 * @return {boolean} Connected through WordPress.
 */
export const isConnectorConnected = (aiSettings, slug) =>
	Boolean(aiSettings?.connectors?.[slug]?.connected);

/**
 * Whether a provider can serve a request, the way `GatewayResolver` decides it:
 * a WordPress connection, or a stored key its provider has not rejected.
 *
 * @param {Object} aiSettings `getOptions.aiSettings`.
 * @param {Object} overrides  Slug → state from a verification run this session.
 * @param {string} slug       Provider slug.
 * @return {boolean} Usable.
 */
export const isProviderConnected = (aiSettings, overrides, slug) => {
	if (isConnectorConnected(aiSettings, slug)) {
		return true;
	}
	const state = getKeyState(aiSettings, overrides, slug);
	return KEY_NONE !== state && KEY_INVALID !== state;
};

/**
 * The provider generation runs on, while it can serve a request.
 *
 * @param {Object} aiSettings `getOptions.aiSettings`.
 * @param {Object} overrides  Slug → state from a verification run this session.
 * @return {string} Provider slug, or "" when the stored one is not usable.
 */
export const resolvePrimaryProvider = (aiSettings, overrides) => {
	const stored = aiSettings?.provider || '';
	return stored && isProviderConnected(aiSettings, overrides, stored) ? stored : '';
};
