import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, createInterpolateElement } from '@wordpress/element';
import { Modal, Button, Notice } from '@wordpress/components';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import { createBlock, getBlockType } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import useAIGenerator from './useAIGenerator';
import { BrandMarkTile } from './BrandMarkIcon';
import StarterPillsRail from './StarterPillsRail';
import { getModelOptions, getProviderLabel, getUsableProviders } from './providers';
import { applyColumnOverride, findColumnsTargetBlock } from './columnOverride';
import { needsSetup } from '../utils/needsSetup';
import { insertPattern } from '../ready-patterns/insertPattern';
import { evaluateRequirements } from '../ready-patterns/requirements';
import './ai-builder.scss';

// Cycled while a generate request is in flight, purely for perceived progress —
// the API gives no real step-by-step signal. Advance stays capped on the last
// label (never loops, never claims 100%) so the UI never desyncs from a request
// that runs shorter or longer than this cycle.
const PROGRESS_STEP_LABELS = [
	__('Reading your prompt', 'wp-carousel-free'),
	__('Choosing a layout', 'wp-carousel-free'),
	__('Composing slides', 'wp-carousel-free'),
	__('Applying styles', 'wp-carousel-free'),
];
const PROGRESS_STEP_INTERVAL_MS = 1400;

// Keyed by AIController::failure_reason(); shown when another provider can take over.
const FAILURE_NOTICES = {
	/* translators: 1: AI provider that failed, 2: AI provider to continue with. */
	limit: __(
		'<strong>%1$s</strong> reached its limit before finishing. Continue with <strong>%2$s</strong> to get your result.',
		'wp-carousel-free'
	),
	/* translators: 1: AI provider that failed, 2: AI provider to continue with. */
	incomplete: __(
		'<strong>%1$s</strong> returned an incomplete answer. Continue with <strong>%2$s</strong> to get your result.',
		'wp-carousel-free'
	),
	/* translators: 1: AI provider that failed, 2: AI provider to continue with. */
	timeout: __(
		'<strong>%1$s</strong> took too long to respond. Continue with <strong>%2$s</strong> to get your result.',
		'wp-carousel-free'
	),
	/* translators: 1: AI provider that failed, 2: AI provider to continue with. */
	auth: __(
		'<strong>%1$s</strong> rejected the saved API key. Continue with <strong>%2$s</strong> to get your result.',
		'wp-carousel-free'
	),
	/* translators: 1: AI provider that failed, 2: AI provider to continue with. */
	error: __(
		"<strong>%1$s</strong> couldn't finish this request. Continue with <strong>%2$s</strong> to get your result.",
		'wp-carousel-free'
	),
};

// Suffix on a failed provider's option in the footer select.
const FAILURE_TAGS = {
	limit: __('Limit reached', 'wp-carousel-free'),
	incomplete: __('Incomplete answer', 'wp-carousel-free'),
	timeout: __('Timed out', 'wp-carousel-free'),
	auth: __('Key rejected', 'wp-carousel-free'),
	error: __('Failed', 'wp-carousel-free'),
};

// Matches AIController::MAX_PROMPT_LENGTH, which trims anything longer.
const MAX_PROMPT_LENGTH = 1000;

// Blocks the builder can build, in the order a default is picked.
const BUILDABLE_BLOCKS = ['carousel', 'slider', 'thumbnails-slider', 'tiles'].map(
	(slug) => `wp-carousel-pro/${slug}`
);

/**
 * The first buildable block this site has not switched off.
 *
 * @return {string} Block name.
 */
const defaultBlockName = () => {
	const disabled = window.wpcpBlockLocalize?.disabledBlocks || [];
	return BUILDABLE_BLOCKS.find((name) => !disabled.includes(name)) || BUILDABLE_BLOCKS[0];
};

export default function AIBuilderModal({
	isOpen,
	onClose,
	targetClientId = null,
	requestedBlockName = null,
	isRefining = false,
}) {
	const [prompt, setPrompt] = useState('');
	const [blockName, setBlockName] = useState(requestedBlockName || defaultBlockName());
	const [provider, setProvider] = useState('');
	const [model, setModel] = useState('');
	const [applying, setApplying] = useState(false);
	const [progressStep, setProgressStep] = useState(0);
	const { generate, cancel, reset, loading, error, setError, failure, clearFailure, failures } =
		useAIGenerator();

	// Holds on the last label/percentage instead of completing — a real request
	// may finish before or well after this cycle runs out.
	useEffect(() => {
		if (!loading) {
			setProgressStep(0);
			return undefined;
		}

		const timer = setInterval(() => {
			setProgressStep((step) => Math.min(step + 1, PROGRESS_STEP_LABELS.length - 1));
		}, PROGRESS_STEP_INTERVAL_MS);

		return () => clearInterval(timer);
	}, [loading]);

	const { insertBlock, replaceBlock, updateBlockAttributes, selectBlock } =
		useDispatch(blockEditorStore);

	const aiSettings = useSelect(() => {
		return window.wpcpBlockLocalize?.aiSettings || {};
	}, []);

	const getBlock = useSelect((select) => select(blockEditorStore).getBlock, []);
	const getBlockInsertionPoint = useSelect(
		(select) => select(blockEditorStore).getBlockInsertionPoint,
		[]
	);

	useEffect(() => {
		if (requestedBlockName) {
			setBlockName(requestedBlockName);
		}
	}, [requestedBlockName]);

	// Every open starts from an empty prompt on the Primary, or the first provider that can run.
	useEffect(() => {
		if (!isOpen) {
			setPrompt('');
			reset();
			return;
		}
		const firstProvider = getUsableProviders()[0];
		setProvider(firstProvider?.slug || '');
		setModel(firstProvider?.model || '');
	}, [isOpen, reset]);

	if (!isOpen) {
		return null;
	}

	// Blocks disabled from the dashboard "Blocks" tab, plus any not yet
	// released in this version — unregistered client-side in blocks/index.js.
	// A block missing from this list is never offered as an AI target: inserting
	// one anyway produces an unrenderable "doesn't include support" placeholder.
	const disabledBlocks = window.wpcpBlockLocalize?.disabledBlocks || [];
	// Connected providers, or a stored key the provider has not rejected.
	const providers = getUsableProviders();
	const hasProvider = providers.length > 0;

	// A block that already shows content is refined; an empty placeholder is built fresh, like a new insert.
	const getConfiguredTarget = () => {
		const target = targetClientId ? getBlock(targetClientId) : null;
		return target && !needsSetup(target.attributes) ? target : null;
	};

	/**
	 * Apply a chosen starter: always fill the prompt, and steer the target block
	 * toward the block the starter was written for — unless a configured block is
	 * open for refining, or the starter's block isn't available on this site.
	 *
	 * @param {Object} item Starter prompt entry from StarterPillsRail.
	 */
	const handleSelectPrompt = (item) => {
		setPrompt(item.prompt);
		if (!getConfiguredTarget() && item.blockName && !disabledBlocks.includes(item.blockName)) {
			setBlockName(item.blockName);
		}
	};

	/**
	 * Insert the Ready Pattern the AI matched.
	 *
	 * Returns false — rather than reporting an error — when the pattern cannot be
	 * used here, so the caller can still answer the prompt with generated
	 * attributes instead of leaving the user with nothing.
	 *
	 * @param {Object} pattern Manifest item from the AI response.
	 * @return {Promise<boolean>} True when the pattern reached the canvas.
	 */
	const applyMatchedPattern = async (pattern) => {
		// The server filters on requirements it can see; this catches a module or
		// plugin the editor session knows to be off.
		if (evaluateRequirements(pattern?.requires).length > 0) {
			return false;
		}

		try {
			const result = await insertPattern({
				pattern,
				requestedClientId: targetClientId,
			});

			if (!result?.success) {
				return false;
			}

			const target = findColumnsTargetBlock(getBlock(result.focusClientId));
			if (target) {
				const patched = applyColumnOverride(target.attributes, prompt);
				if (patched !== target.attributes) {
					updateBlockAttributes(target.clientId, patched);
				}
			}

			dispatch('core/notices').createSuccessNotice(
				sprintf(
					/* translators: %s: pattern name */
					__('AI matched a ready-made layout: “%s”.', 'wp-carousel-free'),
					pattern.name
				),
				{ type: 'snackbar' }
			);

			return true;
		} catch (insertError) {
			return false;
		}
	};

	/**
	 * `AIDemoImageLibrary` (PHP) always hands back exactly 5 demo photos —
	 * it has no idea how many columns the prompt asked for. When an explicit
	 * column count outgrew that fixed catalog, the carousel ended up with
	 * fewer populated slots than columns (e.g. "6 columns" rendering only 5).
	 * Cycle the existing demo items to fill the gap, re-keyed so each item
	 * stays unique; real fetched items (`patternDemo` unset) are left alone.
	 *
	 * @param {Object} attributes Attributes already column-checked.
	 * @return {Object} Attributes with `items` padded to at least `columns`.
	 */
	const padDemoItemsToColumnCount = (attributes) => {
		const columns = attributes?.layoutOptions?.columns;
		const items = attributes?.items;
		if (
			!attributes?.patternDemo ||
			!columns ||
			!Array.isArray(items) ||
			items.length === 0 ||
			items.length >= columns
		) {
			return attributes;
		}

		const paddedItems = [...items];
		for (let index = items.length; index < columns; index++) {
			const source = items[index % items.length];
			paddedItems.push({ ...source, id: `${source.id}-repeat-${index + 1}` });
		}

		return { ...attributes, items: paddedItems };
	};

	const announceSuccess = () => {
		dispatch('core/notices').createSuccessNotice(
			isRefining
				? __('Block updated with AI.', 'wp-carousel-free')
				: __('Block created with AI.', 'wp-carousel-free'),
			{ type: 'snackbar' }
		);
	};

	/**
	 * Apply a generated attribute set to the target block, or insert a new one.
	 *
	 * The attribute catalog the AI generates from never touches `align` (it isn't
	 * a content/layout decision worth spending a model call on), so a fresh
	 * insert would otherwise land at the schema's `align: ''` default — "None"
	 * in the toolbar, a narrow preview. Ready Pattern inserts don't need this:
	 * each pattern already ships its own alignment.
	 *
	 * An explicit column count in the prompt is enforced here too, in case the
	 * model's own generation drifted off the number the user actually typed.
	 *
	 * @param {Object}  attributes        Sanitized attributes from the AI response.
	 * @param {?string} resolvedBlockName Block the server generated for. A prompt
	 *                                    naming a block of its own ("panoramic",
	 *                                    "ticker", "bento grid") is answered on
	 *                                    that block rather than on whichever one
	 *                                    the modal happened to open with, so the
	 *                                    insert has to follow it — building the
	 *                                    opener's block instead would drop every
	 *                                    setting generated for the real one.
	 * @return {boolean} True when the attributes reached a block.
	 */
	const applyGeneratedAttributes = (attributes, resolvedBlockName = null) => {
		const columnChecked = padDemoItemsToColumnCount(applyColumnOverride(attributes, prompt));
		const target = targetClientId ? getBlock(targetClientId) : null;

		// The server withholds a disabled or unreleased block, and this rechecks
		// the editor's own registry: a block unregistered client-side would insert
		// as a "doesn't include support" placeholder rather than a carousel.
		const insertableBlockName =
			resolvedBlockName &&
			!disabledBlocks.includes(resolvedBlockName) &&
			getBlockType(resolvedBlockName)
				? resolvedBlockName
				: blockName;

		// A configured block, or a placeholder of the same type, keeps its clientId.
		if (target && (target.name === insertableBlockName || getConfiguredTarget())) {
			updateBlockAttributes(targetClientId, columnChecked);
			selectBlock(targetClientId);
			announceSuccess();
			return true;
		}

		if (!getBlockType(insertableBlockName)) {
			setError(
				__(
					'That block is switched off on this site, so the carousel could not be inserted.',
					'wp-carousel-free'
				)
			);
			return false;
		}

		const newBlock = createBlock(insertableBlockName, {
			...columnChecked,
			// The generated set carries the slug the server built for; it has to
			// name the block actually being inserted, since the renderer reads it.
			blockName: insertableBlockName.replace('wp-carousel-pro/', ''),
			align: columnChecked.align || 'wide',
		});
		if (target) {
			replaceBlock(targetClientId, newBlock);
		} else {
			const { index, rootClientId } = getBlockInsertionPoint() || {};
			insertBlock(newBlock, index, rootClientId);
		}
		selectBlock(newBlock.clientId);
		announceSuccess();
		return true;
	};

	/**
	 * Tell the user when a request fell back to a single generic block because
	 * no Ready Pattern covered everything they asked for.
	 *
	 * Applying attributes always succeeds regardless of this reason — a prompt
	 * naming more sections (hero, services, portfolio, logos, testimonials, …)
	 * than any one pattern combines can only ever produce one generic block,
	 * since attribute generation configures a single block's settings and has
	 * no way to compose multiple sections. Without this, that gap is invisible:
	 * the request silently "succeeds" with a result far short of what was asked
	 * for, and there is nothing to tell the user their multi-section request
	 * was not actually deliverable.
	 *
	 * @param {string} [reason] The model's own stated reason for declining
	 *                          every shortlisted pattern, or empty when no
	 *                          pattern was attempted or declined.
	 */
	const announcePatternDecline = (reason) => {
		if (!reason) {
			return;
		}

		// A fixed, self-assigned id (rather than the auto-generated one
		// createNotice() would otherwise pick) so the timeout below can target
		// this exact notice for removal without needing the dispatch call's
		// return value.
		const noticeId = `wpcp-pattern-decline-${Date.now()}`;

		dispatch('core/notices').createInfoNotice(
			sprintf(
				/* translators: %s: the model's own reason for not picking a ready-made layout */
				__(
					'No single ready-made layout covered everything you asked for (%s), so this block was built from generic settings instead of a full layout.',
					'wp-carousel-free'
				),
				reason
			),
			{ id: noticeId, isDismissible: true }
		);

		// Informational, not an error the user needs to act on — clear it on
		// its own after a few seconds instead of leaving it for a manual dismiss.
		setTimeout(() => {
			dispatch('core/notices').removeNotice(noticeId);
		}, 4500);
	};

	const handleSelectProvider = (slug) => {
		setProvider(slug);
		setModel(providers.find((item) => item.slug === slug)?.model || '');
		clearFailure();
	};

	/**
	 * Send the prompt, to the footer's provider unless another is named.
	 *
	 * @param {Object} [override]          Provider to use instead of the footer's.
	 * @param {string} [override.provider] Provider slug.
	 * @param {string} [override.model]    Model of that provider.
	 */
	const handleGenerate = async (override = {}) => {
		const requestProvider = override.provider ?? provider;
		const requestModel = override.model ?? model;

		if (!prompt.trim()) {
			setError(
				__('Please enter a prompt describing the carousel you want to generate.', 'wp-carousel-free')
			);
			return;
		}

		// Only a configured block sends its attributes; a placeholder is built fresh, so the server can route the prompt.
		const configuredTarget = getConfiguredTarget();
		const existingAttributes = configuredTarget ? configuredTarget.attributes : {};
		const requestBlockName = configuredTarget ? configuredTarget.name : blockName;
		// A Ready Pattern match applies via a raw wholesale attribute replacement
		// (insertPattern()'s in-place-update branch), not through
		// AISchemaValidator::sanitize_and_merge()'s existing-attribute-preserving
		// layering — the same protection a refine's own attribute path already
		// gets. "Refine" means adjust what's here, never silently swap the whole
		// block for a different pattern's layout, so a refine never lets pattern
		// matching run at all.
		const response = await generate({
			prompt,
			blockName: requestBlockName,
			existingAttributes,
			allowPatterns: !isRefining && !configuredTarget,
			provider: requestProvider,
			model: requestModel,
		});

		if (!response) {
			return;
		}

		setApplying(true);

		try {
			if ('pattern' === response.mode) {
				if (await applyMatchedPattern(response.pattern)) {
					onClose();
					return;
				}

				// The matched pattern is unusable here — build the carousel from
				// attributes instead of failing the prompt.
				const fallback = await generate({
					prompt,
					blockName: requestBlockName,
					existingAttributes,
					allowPatterns: false,
					provider: requestProvider,
					model: requestModel,
				});

				// Show notice when patterns and fallback both fails, so the user can rephrase the prompt instead of silently leaving them with nothing.
				if (!fallback) {
					setError(
						__(
							'The matched layout could not be applied, and generating a fallback configuration failed too. Please try again or rephrase your prompt.',
							'wp-carousel-free'
						)
					);
					return;
				}

				if (applyGeneratedAttributes(fallback.attributes, fallback.blockName)) {
					onClose();
				}
				return;
			}

			if (applyGeneratedAttributes(response.attributes, response.blockName)) {
				announcePatternDecline(response.patternDeclineReason);
				onClose();
			}
		} finally {
			setApplying(false);
		}
	};

	const isAiEnabled = false !== aiSettings.ai_enabled;
	const hasConnector = Boolean(aiSettings.connectors?.[aiSettings.provider]?.registered);
	// A key this plugin stores that the provider has refused. `has_key` is
	// already false for it, but "no key yet" would send the user looking for a
	// field that is not empty.
	const isKeyRejected = 'invalid' === aiSettings.key_status;
	const isBusy = loading || applying;
	const modelOptions = getModelOptions(providers.find(({ slug }) => slug === provider));
	// The next provider, Primary first, that has not failed yet.
	const fallbackProvider = failure ? providers.find(({ slug }) => !failures[slug]) : null;
	const fallbackNotice = FAILURE_NOTICES[failure?.reason] || FAILURE_NOTICES.error;

	const handleContinue = () => {
		setProvider(fallbackProvider.slug);
		setModel(fallbackProvider.model);
		handleGenerate({ provider: fallbackProvider.slug, model: fallbackProvider.model });
	};

	let generateButtonLabel = __('Build Carousel', 'wp-carousel-free');
	if (loading) {
		generateButtonLabel = PROGRESS_STEP_LABELS[progressStep] + '…';
	} else if (applying) {
		generateButtonLabel = __('Applying…', 'wp-carousel-free');
	} else if (isRefining) {
		generateButtonLabel = __('Update Carousel', 'wp-carousel-free');
	}

	// Caps below 100% while a label is still showing — the request may still be
	// running well after this cycle's labels run out, and a full bar would claim
	// otherwise.
	let progressPct = 0;
	if (loading) {
		progressPct = Math.round((progressStep / PROGRESS_STEP_LABELS.length) * 100);
	} else if (applying) {
		progressPct = 100;
	}

	const handleClose = () => {
		cancel();
		onClose();
	};

	const settingsLink = {
		strong: <strong />,
		link: (
			// eslint-disable-next-line jsx-a11y/anchor-has-content -- content supplied by createInterpolateElement
			<a href={window.wpcpBlockLocalize?.aiSettingsUrl} target="_blank" rel="noopener noreferrer" />
		),
	};

	// Why a request cannot be made: a key the provider refused reads very
	// differently from no key at all, and sending someone to "add a key" when
	// the field already holds one is how a bad key survives.
	let credentialNotice = createInterpolateElement(
		__(
			'AI API key is missing. Please configure your API key under <strong>WP Carousel > Settings ></strong> <link>AI Configuration</link>.',
			'wp-carousel-free'
		),
		settingsLink
	);

	if (isKeyRejected) {
		credentialNotice = createInterpolateElement(
			__(
				'The saved AI API key was rejected by the provider. Replace it under <strong>WP Carousel > Settings ></strong> <link>AI Configuration</link>.',
				'wp-carousel-free'
			),
			settingsLink
		);
	} else if (hasConnector) {
		credentialNotice = createInterpolateElement(
			__(
				'This AI provider is not connected yet. Connect it in <connectors>WordPress Connectors</connectors>, or add a key under <strong>WP Carousel > Settings ></strong> <link>AI Configuration</link>.',
				'wp-carousel-free'
			),
			{
				connectors: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content -- content supplied by createInterpolateElement
					<a href={aiSettings.connectors_url} target="_blank" rel="noopener noreferrer" />
				),
				...settingsLink,
			}
		);
	}

	const blockTitle = getBlockType(blockName)?.title || '';
	const modalTitle = isRefining
		? sprintf(
				/* translators: %s: block title */
				__('Refine %s with AI', 'wp-carousel-free'),
				blockTitle
		  )
		: __('Build Your Carousel or Gallery with AI', 'wp-carousel-free');

	return (
		<Modal
			title={modalTitle}
			icon={<BrandMarkTile size={36} />}
			onRequestClose={handleClose}
			className="wpcp-ai-builder-modal"
		>
			<div className="wpcp-ai-builder-modal__body">
				{!isAiEnabled && (
					<div className="wpcp-ai-builder-modal__connect">
						{__(
							'AI features are disabled on this site, so carousel generation is unavailable.',
							'wp-carousel-free'
						)}
					</div>
				)}

				{isAiEnabled && !hasProvider && (
					<div className="wpcp-ai-builder-modal__connect">{credentialNotice}</div>
				)}

				{fallbackProvider && (
					<div className="wpcp-ai-builder-modal__fallback" role="alert">
						<p className="wpcp-ai-builder-modal__fallback-text">
							{createInterpolateElement(
								sprintf(
									fallbackNotice,
									getProviderLabel(failure.provider),
									getProviderLabel(fallbackProvider.slug)
								),
								{ strong: <strong /> }
							)}
						</p>
						<Button
							variant="primary"
							className="wpcp-ai-builder-modal__fallback-btn"
							onClick={handleContinue}
						>
							{__('Continue', 'wp-carousel-free')}
						</Button>
					</div>
				)}

				{error && !fallbackProvider && (
					<Notice
						status="error"
						isDismissible={true}
						onRemove={() => setError(null)}
						className="wpcp-ai-builder-modal__notice"
					>
						{error}
					</Notice>
				)}

				<label htmlFor="wpcp-ai-prompt" className="wpcp-ai-heading">
					{isRefining
						? __('What should change?', 'wp-carousel-free')
						: __('What do you want to create?', 'wp-carousel-free')}
				</label>

				<div className="wpcp-ai-textarea-card">
					<textarea
						id="wpcp-ai-prompt"
						className="wpcp-ai-textarea"
						value={prompt}
						maxLength={MAX_PROMPT_LENGTH}
						onChange={(event) => setPrompt(event.target.value)}
						placeholder={
							isRefining
								? __('Make the slides rounded with captions and show 4 per row', 'wp-carousel-free')
								: __(
										'A full-width image carousel with 3 columns, rounded corners, captions and autoplay every 4 seconds.',
										'wp-carousel-free'
								  )
						}
					/>
					<div className="wpcp-ai-textarea-hint">
						{__('Mention layout, content, motion and styling.', 'wp-carousel-free')}
					</div>
				</div>

				{!isRefining && <StarterPillsRail onSelectPrompt={handleSelectPrompt} />}

				<div className="wpcp-ai-builder-modal__footer">
					<div className="wpcp-ai-builder-modal__provider">
						{hasProvider && (
							<>
								<select
									className="wpcp-ai-inline-select"
									aria-label={__('AI provider', 'wp-carousel-free')}
									value={provider}
									onChange={(event) => handleSelectProvider(event.target.value)}
									disabled={isBusy}
								>
									{providers.map(({ slug }) => (
										<option key={slug} value={slug}>
											{failures[slug]
												? sprintf(
														/* translators: 1: AI provider label, 2: why its last request failed. */
														__('%1$s (%2$s)', 'wp-carousel-free'),
														getProviderLabel(slug),
														FAILURE_TAGS[failures[slug]] || FAILURE_TAGS.error
												  )
												: getProviderLabel(slug)}
										</option>
									))}
								</select>
								{modelOptions.length > 0 && (
									<>
										<span className="wpcp-ai-builder-modal__provider-sep" aria-hidden="true">
											·
										</span>
										<select
											className="wpcp-ai-inline-select"
											aria-label={__('AI model', 'wp-carousel-free')}
											value={model}
											onChange={(event) => setModel(event.target.value)}
											disabled={isBusy}
										>
											{modelOptions.map(({ label, value }) => (
												<option key={value} value={value}>
													{label}
												</option>
											))}
										</select>
									</>
								)}
							</>
						)}
					</div>
					<div className="wpcp-ai-builder-modal__actions">
						{loading && (
							<button
								type="button"
								aria-label={__('Stop generating', 'wp-carousel-free')}
								onClick={cancel}
								className="wpcp-ai-stop-btn"
							>
								<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
									<rect
										x="2"
										y="2"
										width="8"
										height="8"
										rx="1.5"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
									/>
								</svg>
							</button>
						)}
						<Button
							variant="primary"
							className="wpcp-ai-generate-btn"
							onClick={() => handleGenerate()}
							aria-busy={isBusy}
							disabled={isBusy || !hasProvider || !isAiEnabled || !prompt.trim()}
						>
							<span className="wpcp-ai-generate-btn__fill" style={{ width: `${progressPct}%` }} />
							<span className="wpcp-ai-generate-btn__label">
								{loading && (
									<span className="wpcp-ai-generate-btn__dots">
										<span />
										<span />
										<span />
									</span>
								)}
								{generateButtonLabel}
							</span>
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
