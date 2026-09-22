/**
 * Read Fancybox 5 options from global `wpcp_lightbox` (PHP Lightbox_Config mirror).
 *
 * @return {Object} Global Fancybox config object, or `{}` when unavailable.
 */
export function getGlobalLightboxFancyboxConfig() {
	if (
		typeof window.wpcp_lightbox === 'object' &&
		window.wpcp_lightbox !== null &&
		typeof window.wpcp_lightbox.fancybox === 'object'
	) {
		return window.wpcp_lightbox.fancybox;
	}
	return {};
}

/**
 * Forward a lifecycle event to a caller-supplied handler (from the global
 * config's `on` map or the per-call `overrides.on`), if one was registered.
 * The merged `on` object below overwrites any same-named key a caller placed in
 * `on`, so this keeps the lifecycle hooks from silently shadowing an intended
 * handler.
 *
 * @param {Object|null|undefined} source `globalConfig.on` or `overrideOn`.
 * @param {string}                name   Event name to forward.
 * @param {...any}                args   Arguments to pass through.
 * @return {void}
 */
function runUserLifecycleHandler(source, name, ...args) {
	if (source && typeof source[name] === 'function') {
		source[name](...args);
	}
}

/**
 * @param {Object} [overrides] Optional Fancybox option overrides.
 * @return {Object} Merged Fancybox options for the frontend runtime.
 */
export function buildLightboxOptions(overrides = {}) {
	const globalConfig = getGlobalLightboxFancyboxConfig();
	const overrideOn = overrides.on || {};
	const { on: _onIgnored, ...restOverrides } = overrides;

	return {
		...globalConfig,
		...restOverrides,
		on: {
			...(globalConfig.on || {}),
			...overrideOn,
			// `ready` fires once the container and carousel are fully built, so all
			// container-dependent setup lives here. Doing this in `init` was a silent
			// no-op: getContainer() is undefined until `ready`, which left the wrapper
			// class and theme unapplied.
			ready: (fancybox) => {
				const container = fancybox?.getContainer?.() || fancybox?.getSlide?.()?.$container;
				if (container) {
					container.classList.add('wpcp-lightbox-wrapper');
					const theme = globalConfig.theme || '';
					if (theme && 'auto' !== theme) {
						container.setAttribute('theme', 'light' === theme ? 'light' : 'dark');
					}
				}
				runUserLifecycleHandler(globalConfig.on, 'ready', fancybox);
				runUserLifecycleHandler(overrideOn, 'ready', fancybox);
			},
		},
	};
}
