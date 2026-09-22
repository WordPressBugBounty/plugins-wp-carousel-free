/**
 * Pagination-dots style-config rows — the `--wpcp-pag-*` token bag re-expressed
 * through the shared config + emitTokens pipeline (Phase 1 proof slice).
 *
 * Rows use `attr: 'paginationDotsOptions'` and pagination-specific transforms.
 * Structural tokens (gap, dims) set `always: true` so they still emit at schema
 * defaults, matching the legacy var-bag behavior.
 */

/** @type {import('./style-config.js').StyleConfigRow[]} */
const paginationStyleConfig = [
	{
		id: 'pag-gap',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-gap',
		transform: 'paginationGap',
		device: true,
		always: true,
		wholeAttr: true,
	},
	{
		id: 'pag-item-w-dots',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-item-w',
		transform: 'paginationDim',
		dimField: 'width',
		rangesKey: 'item',
		fallback: 12,
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'paginationDotsOptions.paginationStyle', op: 'in', value: ['dots', 'dynamic'] },
	},
	{
		id: 'pag-item-h-dots',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-item-h',
		transform: 'paginationDim',
		dimField: 'height',
		rangesKey: 'item',
		fallback: 12,
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'paginationDotsOptions.paginationStyle', op: 'in', value: ['dots', 'dynamic'] },
	},
	{
		id: 'pag-stepper-w',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-stepper-w',
		transform: 'paginationDim',
		dimField: 'width',
		rangesKey: 'step',
		fallback: 14,
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'paginationDotsOptions.paginationStyle', op: 'eq', value: 'stepper' },
	},
	{
		id: 'pag-stepper-h',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-stepper-h',
		transform: 'paginationDim',
		dimField: 'height',
		rangesKey: 'step',
		fallback: 5,
		device: true,
		always: true,
		wholeAttr: true,
		when: { attr: 'paginationDotsOptions.paginationStyle', op: 'eq', value: 'stepper' },
	},
	{
		id: 'pag-color',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-color',
		transform: 'pagColor',
		wholeAttr: true,
	},
	{
		id: 'pag-text-color',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-text-color',
		transform: 'pagTextColor',
	},
	{
		id: 'pag-active-color',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-active-color',
		transform: 'pagActiveColor',
	},
	{
		id: 'pag-active-text-color',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-active-text-color',
		transform: 'pagActiveTextColor',
	},
	{
		id: 'pag-bg',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-bg',
		transform: 'pagBg',
	},
	{
		id: 'pag-active-bg',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-active-bg',
		transform: 'pagActiveBg',
	},
	{
		id: 'pag-border-style',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-border-style',
		transform: 'pagBorderStyle',
	},
	{
		id: 'pag-active-border-style',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-active-border-style',
		transform: 'pagActiveBorderStyle',
	},
	{
		id: 'pag-border-color',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-border-color',
		transform: 'pagBorderColor',
	},
	{
		id: 'pag-active-border-color',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-active-border-color',
		transform: 'pagActiveBorderColor',
	},
	{
		id: 'pag-border-width',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-border-width',
		transform: 'pagBorderWidth',
	},
	{
		id: 'pag-active-border-width',
		attr: 'paginationDotsOptions',
		var: '--wpcp-pag-active-border-width',
		transform: 'pagActiveBorderWidth',
	},
];

export default paginationStyleConfig;
