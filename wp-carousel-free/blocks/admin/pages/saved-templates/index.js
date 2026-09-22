import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Tooltip, Spinner } from '@wordpress/components';
import { useDispatch, resolveSelect, useSelect } from '@wordpress/data';
import {
	EditPencilIcon,
	CopyIcon,
	DeleteIcon,
	LeftArrow,
	RightArrow,
	CheckIcon,
	CopyToClipboardIcon,
	PlusIcon,
	EmptyStateFolderIcon,
} from './icons';
import { SavedTemplatesPromo } from './SavedTemplatesPromo';
import { toastSuccessMsg, toastErrorMsg, copyText } from '../../functions';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;
const POST_TYPE = 'sp_wpcp_template';
const PER_PAGE = 10;

const addNewUrl = wpcpf?.homeUrl
	? `${wpcpf.homeUrl.replace(
			/\/$/,
			''
	  )}/wp-admin/post-new.php?post_type=${POST_TYPE}&wpcpblock_inserter=true`
	: '#';

const templateQuery = (search) => ({
	status: 'any',
	per_page: -1,
	search,
	_fields: ['id', 'modified', 'title', 'status'],
});

/**
 * Resolve a WP REST title field to a display string. REST may return a string
 * or `{ rendered, raw }`; coercing an object yields "[object Object]".
 *
 * @param {string|{rendered?: string, raw?: string}|undefined} title Title from entity record.
 * @return {string} Safe HTML/plain title for display.
 */
const getTemplateTitle = (title) => {
	if (!title) {
		return '(No Title)';
	}
	if (typeof title === 'string') {
		return title;
	}
	return title.rendered || title.raw || '(No Title)';
};

/**
 * Strip tags and decode entities from a REST-rendered title for safe text display.
 * Uses DOMParser rather than dangerouslySetInnerHTML so embedded markup never executes.
 *
 * @param {string} html Rendered title, possibly containing HTML.
 * @return {string} Plain-text title.
 */
const getPlainTemplateTitle = (html) => {
	if (!html) {
		return '';
	}
	return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
};

const SavedTemplates = () => {
	const [selectBulkValue, setSelectBulkValue] = useState('');
	const [searchValue, setSearchValue] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [allCheck, setAllCheck] = useState(false);
	const [checkId, setCheckId] = useState([]);
	const [shortcodeCopied, setShortcodeCopied] = useState('');
	const [noPostText, setNoPostText] = useState(false);
	const timeoutRef = useRef(null);

	// Free lists block templates only. The Classic carousel CPT is not exposed
	// over REST and making it so would mean changing frozen Classic code.
	const allTemplates = useSelect(
		(select) =>
			select('core')?.getEntityRecords('postType', POST_TYPE, templateQuery(searchValue)) || [],
		[searchValue]
	);

	// Unfiltered library size, kept apart from the searched list so an unmatched
	// search does not read as an empty library and bring the promo back mid-search.
	const { libraryCount, hasResolvedLibrary } = useSelect((select) => {
		const core = select('core');
		const libraryArgs = ['postType', POST_TYPE, templateQuery('')];

		return {
			libraryCount: core?.getEntityRecords(...libraryArgs)?.length || 0,
			hasResolvedLibrary: Boolean(core?.hasFinishedResolution('getEntityRecords', libraryArgs)),
		};
	}, []);

	const totalPostCount = allTemplates.length;
	const savedTemplateList = allTemplates.slice(
		searchValue ? 0 : (currentPage - 1) * PER_PAGE,
		searchValue ? PER_PAGE : currentPage * PER_PAGE
	);

	const copyShortCodeHandler = (item) => {
		const copied = copyText(`[${POST_TYPE} id="${item.id}"]`);
		if (copied) {
			setShortcodeCopied(item.id);
		} else {
			toastErrorMsg(__('Failed to copy shortcode', 'wp-carousel-free'));
		}
	};

	const checkIdHandler = (itemId) => {
		const hasValue = checkId.includes(itemId);
		setCheckId(hasValue ? checkId.filter((value) => value !== itemId) : [...checkId, itemId]);
		setAllCheck(false);
	};

	const searchValueHandler = (e) => {
		const searchInputValue = e.target?.value;
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			setSearchValue(searchInputValue);
			setCurrentPage(1);
		}, 1000);
	};

	const { deleteEntityRecord, editEntityRecord, saveEntityRecord, saveEditedEntityRecord } =
		useDispatch('core');

	const deleteItemHandler = async (itemId = null) => {
		const deleteId = itemId ? [itemId] : checkId;
		if (deleteId.length < 1) {
			return;
		}

		// eslint-disable-next-line no-alert -- intentional confirmation before a destructive delete
		const confirmed = window.confirm(
			__('Are you sure you want to delete this saved template?', 'wp-carousel-free')
		);
		if (!confirmed) {
			return;
		}

		await Promise.all(
			deleteId.map(async (id) => {
				try {
					await deleteEntityRecord('postType', POST_TYPE, id, { force: true });
				} catch (error) {
					toastErrorMsg(__('Failed to delete template.', 'wp-carousel-free'));
				}
			})
		);

		setCheckId(itemId ? checkId.filter((value) => value !== itemId) : []);
		toastSuccessMsg(__('Template deleted successfully.', 'wp-carousel-free'));
	};

	const updateStatusHandler = async (newStatus = 'publish') => {
		if (checkId.length < 1) {
			return;
		}

		await Promise.all(
			checkId.map(async (id) => {
				if (!id) {
					return;
				}
				try {
					const record = await resolveSelect('core').getEntityRecord('postType', POST_TYPE, id);
					if (!record) {
						return;
					}
					await editEntityRecord('postType', POST_TYPE, id, { status: newStatus });
					await saveEditedEntityRecord('postType', POST_TYPE, id);
				} catch (error) {
					toastErrorMsg(__('Failed to update template status.', 'wp-carousel-free'));
				}
			})
		);

		toastSuccessMsg(__('Template status updated successfully.', 'wp-carousel-free'));
		setCheckId([]);
	};

	const bulkActionHandler = () => {
		if ('' === selectBulkValue) {
			return;
		}
		if ('delete' === selectBulkValue) {
			deleteItemHandler();
		} else {
			updateStatusHandler(selectBulkValue);
		}
		setCheckId([]);
		setAllCheck(false);
		setSelectBulkValue('');
	};

	const duplicateHandler = async (item) => {
		try {
			const original = await resolveSelect('core').getEntityRecord('postType', POST_TYPE, item.id);
			if (!original) {
				toastErrorMsg(__('Template not found', 'wp-carousel-free'));
				return;
			}

			const title = original.title?.raw || original.title?.rendered || original.title || '(No title)';

			await saveEntityRecord('postType', POST_TYPE, {
				title: `${title} (Copy)`,
				content: original.content?.raw || '',
				meta: original.meta || {},
				status: 'draft',
			});

			toastSuccessMsg(__('Template duplicated successfully.', 'wp-carousel-free'));
		} catch (error) {
			toastErrorMsg(__('Failed to duplicate template', 'wp-carousel-free'));
		}
	};

	useEffect(() => {
		if (!shortcodeCopied) {
			return undefined;
		}
		const timer = setTimeout(() => setShortcodeCopied(''), 2000);
		return () => clearTimeout(timer);
	}, [shortcodeCopied]);

	useEffect(() => {
		if (savedTemplateList.length < 1) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => setNoPostText(true), 1500);
		}
	}, [savedTemplateList]);

	const totalPages = Math.ceil(totalPostCount / PER_PAGE);
	const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
	const isEmpty = !savedTemplateList || savedTemplateList.length === 0;

	// The promo introduces the feature, so it retires once the first template exists.
	const hasTemplates = libraryCount > 0;
	const showPromo = hasResolvedLibrary && !hasTemplates;

	return (
		<div className="wpcpf-saved-templates-page-wrapper">
			{showPromo && <SavedTemplatesPromo />}
			<div
				className={`wpcpf-saved-templates-page-container${
					hasTemplates ? '' : ' wpcpf-saved-templates-page-container--bare'
				}`}
			>
				{hasTemplates && (
					<div className="wpcpf-saved-template-header">
						<div className="wpcpf-saved-template-header-left">
							<select
								name="bulk-action"
								className="wpcpf-saved-template-select"
								aria-label={__('Bulk action', 'wp-carousel-free')}
								value={selectBulkValue}
								onChange={(e) => setSelectBulkValue(e.target.value)}
							>
								<option value="">{__('Bulk Action', 'wp-carousel-free')}</option>
								<option value="publish">{__('Publish', 'wp-carousel-free')}</option>
								<option value="draft">{__('Draft', 'wp-carousel-free')}</option>
								<option value="delete">{__('Delete', 'wp-carousel-free')}</option>
							</select>
							<button
								type="button"
								className="wpcpf-saved-template-select-apply"
								onClick={bulkActionHandler}
							>
								{__('Apply', 'wp-carousel-free')}
							</button>
							<input
								name="search-template"
								className="wpcpf-saved-template-search-field"
								type="text"
								aria-label={__('Search templates', 'wp-carousel-free')}
								placeholder={__('Search…', 'wp-carousel-free')}
								spellCheck="false"
								onChange={searchValueHandler}
							/>
						</div>
						<div className="wpcpf-saved-template-header-right">
							<a href={addNewUrl} className="wpcpf-saved-template-add-new" rel="noreferrer">
								<i className="dashicons dashicons-plus-alt2"></i>
								{__('Add New Template', 'wp-carousel-free')}
							</a>
						</div>
					</div>
				)}

				<table className="wpcpf-saved-template-content-table">
					<thead className="wpcpf-saved-template-table-head">
						<tr>
							<th className="wpcpf-saved-template-table-checkBox">
								<input
									type="checkbox"
									aria-label={__('Select all templates', 'wp-carousel-free')}
									onChange={() => {
										setAllCheck((prev) => !prev);
										setCheckId(!allCheck ? savedTemplateList.map((listItem) => listItem.id) : []);
									}}
									checked={allCheck}
								/>
							</th>
							<th className="wpcpf-saved-template-table-title">{__('Title', 'wp-carousel-free')}</th>
							<th className="wpcpf-saved-template-table-shortcode">
								{__('Shortcode', 'wp-carousel-free')}
							</th>
							<th className="wpcpf-saved-template-table-date">{__('Date', 'wp-carousel-free')}</th>
							<th className="wpcpf-saved-template-table-action">{__('Action', 'wp-carousel-free')}</th>
						</tr>
					</thead>
					<tbody className="wpcpf-saved-template-table-body">
						{!noPostText && isEmpty && (
							<tr>
								<td colSpan={5} className="wpcpf-saved-template-preloader-no-data">
									<span className="wpcpf-saved-template-loading">
										<Spinner />
									</span>
								</td>
							</tr>
						)}

						{savedTemplateList.map((item) => {
							const date = new Date(item?.modified || Date.now());
							const checkBoxValue = allCheck || checkId.some((itemId) => itemId === item?.id);
							const editUrl = `${wpcpf?.homeUrl}wp-admin/post.php?post=${item?.id}&action=edit`;

							return (
								<tr key={item.id} className="wpcpf-saved-template-table-row">
									<td className="wpcpf-saved-template-table-checkBox">
										<input
											type="checkbox"
											aria-label={__('Select template', 'wp-carousel-free')}
											onChange={() => checkIdHandler(item?.id)}
											checked={checkBoxValue}
										/>
									</td>
									<td className="wpcpf-saved-template-table-title">
										<a
											href={editUrl}
											rel="noreferrer noopener"
											title={getPlainTemplateTitle(getTemplateTitle(item?.title))}
										>
											<span>{getPlainTemplateTitle(getTemplateTitle(item?.title))}</span>
										</a>
									</td>
									<td className="wpcpf-saved-template-table-shortcode">
										<span
											className="wpcpf-saved-template-shortcode-text"
											role="button"
											tabIndex={0}
											onClick={() => copyShortCodeHandler(item)}
											onKeyDown={(e) => {
												if ('Enter' === e.key || ' ' === e.key) {
													copyShortCodeHandler(item);
												}
											}}
										>
											{`[${POST_TYPE} id="${item?.id}"]`}
										</span>
										<span
											className="wpcpf-shortcode-copy-tooltip"
											style={{ opacity: shortcodeCopied === item.id ? 1 : 0 }}
										>
											<CheckIcon />
											{__('Copied!', 'wp-carousel-free')}
										</span>
										{shortcodeCopied !== item.id && <CopyToClipboardIcon />}
									</td>
									<td className="wpcpf-saved-template-table-date">
										<div>{item?.status || 'publish'}</div>
										<div>{date.toLocaleString()}</div>
									</td>
									<td className="wpcpf-saved-template-table-action">
										<div className="wpcpf-saved-template-table-action-btn">
											<Tooltip text={__('Edit', 'wp-carousel-free')} delay={300} placement="top">
												<a
													aria-label={__('Edit', 'wp-carousel-free')}
													href={editUrl}
													className="wpcpf-saved-template-action wpcpf-action-edit"
													rel="noreferrer"
												>
													<EditPencilIcon />
												</a>
											</Tooltip>
											<Tooltip text={__('Duplicate', 'wp-carousel-free')} delay={300} placement="top">
												<button
													type="button"
													aria-label={__('Duplicate', 'wp-carousel-free')}
													className="wpcpf-saved-template-action wpcpf-action-copy"
													onClick={() => duplicateHandler(item)}
												>
													<CopyIcon />
												</button>
											</Tooltip>
											<Tooltip text={__('Delete', 'wp-carousel-free')} delay={300} placement="top">
												<button
													type="button"
													aria-label={__('Delete', 'wp-carousel-free')}
													className="wpcpf-saved-template-action wpcpf-action-delete"
													onClick={() => deleteItemHandler(item?.id)}
												>
													<DeleteIcon />
												</button>
											</Tooltip>
										</div>
									</td>
								</tr>
							);
						})}

						{noPostText && isEmpty && (
							<tr className="wpcpf-saved-template-empty-row">
								<td colSpan={5} className="wpcpf-saved-template-preloader-no-data">
									<div className="wpcpf-saved-template-empty">
										<div className="wpcpf-saved-template-empty__message">
											<EmptyStateFolderIcon />
											<p className="wpcpf-saved-template-empty__text">
												{searchValue
													? __('No carousels or galleries match your search.', 'wp-carousel-free')
													: __('No carousels or galleries yet.', 'wp-carousel-free')}
											</p>
										</div>
										<a href={addNewUrl} rel="noreferrer" className="wpcpf-saved-template-empty__cta">
											{__('Create a Saved Template', 'wp-carousel-free')}
											<PlusIcon />
										</a>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>

				{hasTemplates && (
					<div className="wpcpf-saved-template-footer">
						<div className="wpcpf-saved-template-count">
							{`${__('Page', 'wp-carousel-free')} ${currentPage} ${__('of', 'wp-carousel-free')} ${
								totalPages || 1
							}`}
							<span>{` [ ${totalPostCount} ${__('Items', 'wp-carousel-free')} ]`}</span>
						</div>
						{pages.length > 1 && (
							<div className="wpcpf-saved-template-pagination">
								<button
									type="button"
									className={`wpcpf-saved-template-pagination-btn${
										1 === currentPage ? ' btn-disabled' : ''
									}`}
									onClick={() => setCurrentPage(1 !== currentPage ? currentPage - 1 : 1)}
								>
									<LeftArrow />
								</button>
								{pages.map((item) => (
									<button
										type="button"
										key={item}
										className={`wpcpf-saved-template-pagination-btn${
											currentPage === item ? ' btn-active' : ''
										}`}
										onClick={() => setCurrentPage(item)}
									>
										{item}
									</button>
								))}
								<button
									type="button"
									className={`wpcpf-saved-template-pagination-btn${
										currentPage === pages.length ? ' btn-disabled' : ''
									}`}
									onClick={() =>
										setCurrentPage(currentPage !== pages.length ? currentPage + 1 : pages.length)
									}
								>
									<RightArrow />
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default SavedTemplates;
