import { __, sprintf } from '@wordpress/i18n';

// Provider names, shared with the dashboard's AI Configuration tab.
export const AI_PROVIDER_LABELS = {
	anthropic: __('Anthropic (Claude)', 'wp-carousel-free'),
	gemini: __('Google Gemini', 'wp-carousel-free'),
	openai: __('OpenAI (ChatGPT)', 'wp-carousel-free'),
	groq: __('Groq', 'wp-carousel-free'),
};

/**
 * Display name for a provider slug.
 *
 * @param {string} slug Provider slug.
 * @return {string} Label.
 */
export const getProviderLabel = (slug) => AI_PROVIDER_LABELS[slug] || slug;

/**
 * Providers that can serve a request, Primary first (`AIKeyManager::usable_providers()`).
 *
 * @return {Array<{slug: string, model: string, recommended: string, models: Array<{value: string, label: string}>}>} Rows.
 */
export const getUsableProviders = () => window.wpcpBlockLocalize?.aiProviders || [];

/**
 * Model options for one provider, its recommended model marked.
 *
 * @param {Object} provider Row from `getUsableProviders()`.
 * @return {Array<{value: string, label: string}>} Options.
 */
export const getModelOptions = (provider) =>
	(provider?.models || []).map(({ value, label }) => ({
		value,
		label:
			value === provider.recommended
				? sprintf(
						/* translators: %s: AI model name */
						__('%s (Recommended)', 'wp-carousel-free'),
						label
				  )
				: label,
	}));

/**
 * A provider's error message, prefixed with the provider and model it came from.
 *
 * @param {string} slug    Provider slug.
 * @param {string} model   Model id, or empty when the server picked it.
 * @param {string} message Message as the provider phrased it.
 * @return {string} Display message.
 */
export const formatProviderError = (slug, model, message) => {
	const row = getUsableProviders().find((item) => item.slug === slug);
	const modelLabel = model ? row?.models?.find(({ value }) => value === model)?.label || model : '';

	if (modelLabel) {
		return sprintf(
			/* translators: 1: AI provider label, 2: AI model name, 3: error message from the provider. */
			__('%1$s (%2$s): %3$s', 'wp-carousel-free'),
			getProviderLabel(slug),
			modelLabel,
			message
		);
	}

	return sprintf(
		/* translators: 1: AI provider label, 2: error message from the provider. */
		__('%1$s: %2$s', 'wp-carousel-free'),
		getProviderLabel(slug),
		message
	);
};
