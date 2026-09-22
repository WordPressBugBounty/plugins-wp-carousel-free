import { __, sprintf, _n } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	createPortal,
} from '@wordpress/element';
import { useConstrainedTabbing, useFocusOnMount, useMergeRefs } from '@wordpress/compose';
import { dispatch, select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import ErrorBoundary from './ErrorBoundary';
import Sidebar from './Sidebar';
import LibraryToolbar from './LibraryToolbar';
import PatternGrid from './PatternGrid';
import PreviewDrawer from './PreviewDrawer';
import PreflightDialog from './PreflightDialog';
import usePatternLibrary from './usePatternLibrary';
import { insertPattern } from './insertPattern';
import { categoryFromBlockName } from './constants';
import { evaluateRequirements } from './requirements';
import { CloseIcon, LogoMarkIcon } from './icons';
import './ready-patterns.scss';

/**
 * Move DOM focus to a block wrapper (canvas may be iframed).
 * `selectBlock` sets selection only; this makes keyboard focus follow.
 *
 * @param {string|null|undefined} clientId Block client id.
 */
function focusBlockInCanvas(clientId) {
	if (!clientId) {
		return;
	}

	const selector = `[data-block="${clientId}"]`;
	const tryFocus = (doc) => {
		const el = doc?.querySelector?.(selector);
		if (el && 'function' === typeof el.focus) {
			el.focus({ preventScroll: true });
			return true;
		}
		return false;
	};

	if (tryFocus(document)) {
		return;
	}

	const canvas = document.querySelector(
		'iframe[name="editor-canvas"], iframe.edit-site-visual-editor__editor-canvas'
	);
	if (canvas?.contentDocument) {
		tryFocus(canvas.contentDocument);
	}
}

/**
 * Fullscreen Ready Patterns Library modal — hosted once at editor level.
 *
 * @param {Object}      props
 * @param {boolean}     props.isOpen
 * @param {Function}    props.onClose
 * @param {string|null} [props.targetClientId]     Client id from the open request.
 * @param {string|null} [props.requestedBlockName] Optional category sugar from the request.
 * @return {JSX.Element|null} Portal contents when open.
 */
export default function ReadyPatternsModal({
	isOpen,
	onClose,
	targetClientId = null,
	requestedBlockName = null,
}) {
	const panelRef = useRef(null);
	const previousFocusRef = useRef(null);
	const insertedFocusClientIdRef = useRef(null);
	const previewOriginRef = useRef(null);
	const [insertingId, setInsertingId] = useState(null);
	const [refreshing, setRefreshing] = useState(false);
	const [previewPattern, setPreviewPattern] = useState(null);
	const [preflight, setPreflight] = useState(null);

	const constrainedTabbingRef = useConstrainedTabbing();
	const focusOnMountRef = useFocusOnMount('firstElement');
	const dialogRef = useMergeRefs([panelRef, constrainedTabbingRef, focusOnMountRef]);

	const library = usePatternLibrary({ isOpen });

	useEffect(() => {
		if (isOpen) {
			// eslint-disable-next-line @wordpress/no-global-active-element -- restore editor focus on close
			previousFocusRef.current = document.activeElement;
			insertedFocusClientIdRef.current = null;

			const storeName =
				requestedBlockName ||
				(targetClientId ? select(blockEditorStore).getBlockName(targetClientId) : null);
			const initialCategory = categoryFromBlockName(storeName);
			if ('all' !== initialCategory) {
				library.setCategory(initialCategory);
			}
		} else {
			setPreviewPattern(null);
			setPreflight(null);
		}
		// Only run when the modal opens — category pre-selection is intentional one-shot.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return undefined;
		}

		const handleKeyDown = (event) => {
			// The drawer and the preflight dialog own Escape while they are open.
			if ('Escape' === event.key && !previewPattern && !preflight) {
				event.preventDefault();
				onClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose, previewPattern, preflight]);

	useEffect(() => {
		if (isOpen) {
			return;
		}

		const focusClientId = insertedFocusClientIdRef.current;
		if (focusClientId) {
			// After a successful insert, follow the block — the invoker may be gone.
			requestAnimationFrame(() => focusBlockInCanvas(focusClientId));
			insertedFocusClientIdRef.current = null;
			return;
		}

		if (previousFocusRef.current?.focus) {
			previousFocusRef.current.focus();
		}
	}, [isOpen]);

	const handleBackdropClick = useCallback(
		(event) => {
			if (previewPattern || preflight) {
				return;
			}
			if (panelRef.current && !panelRef.current.contains(event.target)) {
				onClose();
			}
		},
		[onClose, previewPattern, preflight]
	);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await library.refresh();
		} finally {
			setRefreshing(false);
		}
	}, [library]);

	const runInsert = useCallback(
		async (pattern) => {
			setInsertingId(pattern.id);
			try {
				const result = await insertPattern({
					pattern,
					requestedClientId: targetClientId,
				});
				if (result?.success) {
					insertedFocusClientIdRef.current = result.focusClientId || null;
					setPreviewPattern(null);
					onClose();
				}
			} catch (insertError) {
				dispatch('core/notices').createErrorNotice(
					insertError?.message || __('Failed to insert pattern.', 'wp-carousel-free')
				);
			} finally {
				setInsertingId(null);
			}
		},
		[targetClientId, onClose]
	);

	const handleInsert = useCallback(
		(pattern) => {
			if (insertingId) {
				return;
			}

			// Nothing is fetched until an unmet requirement is acknowledged.
			const unmet = evaluateRequirements(pattern?.requires);
			if (unmet.length > 0) {
				setPreflight({ pattern, unmet });
				return;
			}

			runInsert(pattern);
		},
		[insertingId, runInsert]
	);

	const handlePreview = useCallback((pattern) => {
		// eslint-disable-next-line @wordpress/no-global-active-element -- restore the invoking Preview button
		previewOriginRef.current = document.activeElement;
		setPreviewPattern(pattern);
	}, []);

	// Where the previewed pattern sits in the list the grid is currently showing.
	// -1 once a filter change has dropped it out, which hides the step controls.
	const previewIndex = useMemo(
		() =>
			previewPattern ? library.visibleItems.findIndex((item) => item.id === previewPattern.id) : -1,
		[previewPattern, library.visibleItems]
	);

	// Stops at both ends rather than wrapping, so the footer's disabled Prev and
	// Next report where the list really ends.
	const handleStepPreview = useCallback(
		(offset) => {
			const items = library.visibleItems;
			if (previewIndex < 0) {
				return;
			}

			const next = previewIndex + offset;
			if (next < 0 || next >= items.length) {
				return;
			}

			setPreviewPattern(items[next]);
		},
		[library.visibleItems, previewIndex]
	);

	const handleClosePreview = useCallback(() => {
		setPreviewPattern(null);
		const origin = previewOriginRef.current;
		previewOriginRef.current = null;
		if (origin?.focus) {
			requestAnimationFrame(() => origin.focus());
		}
	}, []);

	const statusMessage = useMemo(() => {
		if (library.loading) {
			return __('Loading patterns…', 'wp-carousel-free');
		}

		return sprintf(
			/* translators: %d: number of patterns shown */
			_n('%d pattern', '%d patterns', library.visibleItems.length, 'wp-carousel-free'),
			library.visibleItems.length
		);
	}, [library.loading, library.visibleItems.length]);

	if (!isOpen) {
		return null;
	}

	return createPortal(
		<div className="wpcp-ready-patterns-backdrop" onMouseDown={handleBackdropClick}>
			<div
				className="wpcp-ready-patterns-modal"
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label={__('Ready Patterns Library', 'wp-carousel-free')}
			>
				<header className="wpcp-ready-patterns-header">
					<div className="wpcp-ready-patterns-brand">
						<LogoMarkIcon />
						<h2 className="wpcp-ready-patterns-title">
							{__('Ready Patterns Library', 'wp-carousel-free')}
						</h2>
					</div>
					<div className="wpcp-ready-patterns-header-actions">
						<button
							type="button"
							className="wpcp-ready-patterns-close"
							onClick={onClose}
							aria-label={__('Close', 'wp-carousel-free')}
						>
							<CloseIcon />
						</button>
					</div>
				</header>

				<div className="wpcp-ready-patterns-body">
					<ErrorBoundary onRetry={library.retry}>
						<Sidebar
							tier={library.tier}
							onTierChange={library.setTier}
							search={library.search}
							onSearchChange={library.setSearch}
							category={library.category}
							onCategoryChange={library.setCategory}
							useCase={library.useCase}
							onUseCaseChange={library.setUseCase}
							sourceType={library.sourceType}
							onSourceTypeChange={library.setSourceType}
							tags={library.tags}
							onToggleTag={library.toggleTag}
							categoryTerms={library.categoryTerms}
							tagTerms={library.tagTerms}
							useCaseTerms={library.useCaseTerms}
							counts={library.counts}
							tierCounts={library.tierCounts}
							useCaseCounts={library.useCaseCounts}
							sourceTypeCounts={library.sourceTypeCounts}
							onClearFilters={library.clearFilters}
						/>
						<div className="wpcp-ready-patterns-main">
							<LibraryToolbar
								sort={library.sort}
								onSortChange={library.setSort}
								gridDensity={library.gridDensity}
								onGridDensityChange={library.setGridDensity}
								favoritesCount={library.favorites.length}
								showFavoritesOnly={library.showFavoritesOnly}
								onToggleFavoritesView={() => library.setShowFavoritesOnly(!library.showFavoritesOnly)}
								onRefresh={handleRefresh}
								refreshing={refreshing || library.loading}
							/>
							<div className="screen-reader-text" aria-live="polite">
								{statusMessage}
							</div>
							<PatternGrid
								loading={library.loading}
								error={library.error}
								onRetry={library.retry}
								items={library.visibleItems}
								gridDensity={library.gridDensity}
								onInsert={handleInsert}
								onPreview={handlePreview}
								insertingId={insertingId}
								favorites={library.favorites}
								onToggleFavorite={library.toggleFavorite}
							/>
						</div>
					</ErrorBoundary>
				</div>

				{previewPattern ? (
					<PreviewDrawer
						pattern={previewPattern}
						onClose={handleClosePreview}
						onInsert={handleInsert}
						isInserting={insertingId === previewPattern.id}
						index={previewIndex}
						total={library.visibleItems.length}
						onPrevious={() => handleStepPreview(-1)}
						onNext={() => handleStepPreview(1)}
					/>
				) : null}

				{preflight ? (
					<PreflightDialog
						patternName={preflight.pattern?.name}
						unmet={preflight.unmet}
						onCancel={() => setPreflight(null)}
						onProceed={() => {
							const pattern = preflight.pattern;
							setPreflight(null);
							runInsert(pattern);
						}}
					/>
				) : null}
			</div>
		</div>,
		document.body
	);
}
